# How Terraform Authenticates with AWS (`terraform apply`)

When you run `terraform plan` or `terraform apply`, Terraform makes real API calls to Amazon Web Services (AWS) to create, modify, or destroy cloud infrastructure. 

To do this successfully, Terraform needs two things:
1. **Authentication (Who are you?)**: Proving your identity to AWS using credentials.
2. **Authorization (What are you allowed to do?)**: Having IAM policies attached that grant permission to create VPCs, Subnets, EC2 instances, Security Groups, etc.

---

## 1. Golden Security Rule: Never Hardcode Credentials

In Terraform, the AWS provider block *technically* allows hardcoding keys:
```hcl
# ❌ NEVER DO THIS (SECURITY VULNERABILITY)
provider "aws" {
  region     = "us-east-1"
  access_key = "AKIAEXAMPLE..."
  secret_key = "wJalrXUtnFEMI/..."
}
```
> [!CAUTION]
> If you commit access keys to a GitHub repository (even a private one), automated bots scan and compromise them within seconds, potentially racking up thousands of dollars in unauthorized AWS charges.
>
> Always keep your `provider.tf` clean:
> ```hcl
> provider "aws" {
>   region = var.aws_region
> }
> ```
> Terraform will automatically discover credentials using the standard AWS credential chain.

---

## 2. How Terraform Finds Your AWS Credentials (Credential Chain)

When Terraform runs, the AWS Provider searches for credentials in the following order:

```mermaid
flowchart TD
    A[Run: terraform apply] --> B{1. Static Environment Variables?}
    B -- Yes --> B1[Use AWS_ACCESS_KEY_ID & AWS_SECRET_ACCESS_KEY]
    B -- No --> C{2. AWS CLI Shared Credentials?}
    C -- Yes --> C1[Read ~/.aws/credentials & ~/.aws/config]
    C -- No --> D{3. Web Identity / OIDC Token?}
    D -- Yes --> D1[Assume IAM Role via OIDC in CI/CD]
    D -- No --> E{4. EC2 / ECS Instance Role?}
    E -- Yes --> E1[Fetch temporary keys from Instance Metadata Service]
    E -- No --> F[❌ Error: No valid credential sources found]
```

---

## 3. Recommended Local Setup: AWS CLI Profile

The most common, secure way to authenticate Terraform on your local machine (including WSL) is using the AWS CLI credentials file.

### Step 1: Create an IAM User in AWS
1. Open the **AWS Management Console** and navigate to **IAM (Identity and Access Management)**.
2. Go to **Users** -> **Create user** (e.g., name it `terraform-admin`).
3. Attach policies:
   - For learning/sandbox projects: `AdministratorAccess` (or custom policies for EC2/VPC).
4. Go to the user's **Security credentials** tab:
   - Click **Create access key**.
   - Select **Command Line Interface (CLI)**.
   - Download or copy the **Access Key ID** and **Secret Access Key**.

### Step 2: Configure the AWS CLI in Your Terminal
In your WSL or terminal, run:
```bash
aws configure
```
Enter the requested details:
```text
AWS Access Key ID [None]: AKIAIOSFODNN7EXAMPLE
AWS Secret Access Key [None]: wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
Default region name [None]: us-east-1
Default output format [None]: json
```

This saves your credentials locally to:
- `~/.aws/credentials`
- `~/.aws/config`

### Step 3: Verify Your Credentials
Test if AWS recognizes your credentials:
```bash
aws sts get-caller-identity
```
You should see output similar to:
```json
{
    "UserId": "AIDAS6XXXXXXXXXXXXXX",
    "Account": "123456789012",
    "Arn": "arn:aws:iam::123456789012:user/terraform-admin"
}
```

### Step 4: Run Terraform
Now, Terraform will automatically detect these credentials without any extra configuration:
```bash
terraform plan
terraform apply
```

---

## 4. Alternative Method: Temporary Environment Variables

If you do not want to store credentials on disk, or you are testing in a temporary terminal session, you can export them as environment variables:

```bash
export AWS_ACCESS_KEY_ID="AKIAIOSFODNN7EXAMPLE"
export AWS_SECRET_ACCESS_KEY="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
export AWS_DEFAULT_REGION="us-east-1"
```

Once set, any `terraform plan` or `terraform apply` in that terminal session will authenticate with those keys.

> [!NOTE]
> If you close the terminal session, these environment variables disappear.

---

## 5. Working with Multiple AWS Accounts (Named Profiles)

If you have multiple AWS accounts or projects, configure a named profile:

```bash
aws configure --profile devops-project
```

You can tell Terraform to use this specific profile in two ways:

1. **Via Environment Variable (Recommended)**:
   ```bash
   export AWS_PROFILE="devops-project"
   terraform apply
   ```

2. **Or in `provider.tf`**:
   ```hcl
   provider "aws" {
     region  = var.aws_region
     profile = "devops-project"
   }
   ```

---

## 6. Production & CI/CD Best Practices (GitHub Actions / GitLab CI)

In automated pipelines:
- **Do NOT** use long-lived IAM user access keys.
- **Use OpenID Connect (OIDC)**: GitHub Actions assumes a temporary IAM Role directly via AWS STS using short-lived tokens.
- **Instance Roles**: When Terraform runs on an EC2 instance (e.g., a Jenkins runner), it fetches temporary keys automatically via the instance's IAM Role (Instance Profile) with zero saved credentials.

---

## 7. Quick Troubleshooting Checklist

| Error Message | Cause | Solution |
|---|---|---|
| `No valid credential sources found` | AWS CLI is not configured and no env vars are set. | Run `aws configure` or export `AWS_ACCESS_KEY_ID`. |
| `The security token included in the request is invalid` | Typo in Access Key or Secret Key, or expired session token. | Re-run `aws configure` and check key values. |
| `AccessDenied: User is not authorized to perform: ec2:...` | The IAM User lacks permissions for that specific AWS service. | Check IAM permissions in AWS Console and attach necessary policies. |
| `SignatureDoesNotMatch` | The Secret Access Key was copied incorrectly or contains spaces/linebreaks. | Re-enter your secret key carefully using `aws configure`. |
