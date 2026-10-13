# AWS CLI Setup and Troubleshooting on Windows WSL

## 1. Overview
During the initial setup of the **AWS Infrastructure Provisioning & Deployment Automation** project, several issues occurred while installing and configuring the AWS Command Line Interface (AWS CLI) in Ubuntu running under Windows Subsystem for Linux (WSL).

This document records the issues, their root causes, troubleshooting steps, and verification commands for future reference and reproducible environment setup.

---

## 2. Development Environment

| Component | Specification |
|---|---|
| **Host Operating System** | Windows 11 / 10 |
| **Linux Environment** | Ubuntu on WSL 2 |
| **IDE** | Antigravity IDE |
| **Project Directory (WSL mount)** | `/mnt/c/Users/sachintha/Desktop/AWS-Infrastructure-Provisioning-Deployment-Automation` |
| **Infrastructure as Code** | Terraform |
| **Configuration Management** | Ansible |
| **Cloud Provider** | Amazon Web Services (AWS) |

---

## 3. Issue 1: AWS CLI Package Not Available in APT

### Error
When attempting to install AWS CLI using APT:
```bash
sudo apt install awscli
```

The terminal returned:
```text
E: Package 'awscli' has no installation candidate
```

### Cause
The configured Ubuntu APT repositories for the current release did not provide an installable package named `awscli`, or the repository universe component was not indexed. In addition, the upstream APT package is typically AWS CLI v1, whereas AWS CLI v2 is recommended for modern deployments.

### Solution
Instead of relying on APT, install the official AWS CLI v2 bundle.

1. Update package lists and install basic transport dependencies:
   ```bash
   sudo apt update
   sudo apt install -y curl unzip
   ```

2. Download the official AWS CLI v2 installer script:
   ```bash
   curl -fsSL https://awscli.amazonaws.com/v2/install.sh -o install-aws-cli.sh
   ```

3. Official documentation: [AWS CLI Installation Guide](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)

---

## 4. Issue 2: Missing `unzip` Dependency

### Error
The first installation attempt returned:
```text
aws-cli installer: error: missing required dependencies: unzip
```

### Cause
The AWS CLI installer package downloads a compressed `.zip` archive behind the scenes and requires the `unzip` utility, which was absent in the minimal Ubuntu WSL image.

### Solution
Install the missing utility via APT:
```bash
sudo apt update
sudo apt install -y unzip curl
```

Verify that `unzip` is available:
```bash
unzip -v
```

---

## 5. Issue 3: AWS CLI Installed Under the Root User Directory

### Error
After running the installer with `sudo` without system-wide flags, the AWS CLI reported installation under:
```text
/root/.local/share/aws-cli
```
The command path was placed under:
```text
/root/.local/bin/aws
```

However, when switching back to the regular Ubuntu user (`sachintha`), executing `aws` returned:
```text
Command 'aws' not found
```

### Cause
The installer defaults to a user-local directory under XDG paths (`$HOME/.local/bin`). When executed under `sudo`, `$HOME` resolved to `/root/`. Consequently, the binary was not placed in standard system PATH locations (`/usr/local/bin`) accessible by non-root users.

### Solution
Install the AWS CLI **system-wide** using the `--system` parameter:
```bash
sudo bash install-aws-cli.sh --system
```

Verify the installation path and version as a regular user:
```bash
which aws
aws --version
```

Expected binary location:
```text
/usr/local/bin/aws
```

> [!NOTE]
> Do not delete existing installation directories blindly. First verify the active executable and its location (`which -a aws`).

---

## 6. Issue 4: AWS Authentication Not Configured

### Description
Installing the AWS CLI binary only installs the client tool; it does not automatically authenticate the user to AWS. 

Even when `aws --version` succeeds, AWS commands requiring cloud access will fail if valid credentials or profiles are absent.

### Verification Command
```bash
aws sts get-caller-identity
```

### Expected Successful Output
```json
{
    "UserId": "AIDAXXXXXXXXXXXXXXXX",
    "Account": "123456789012",
    "Arn": "arn:aws:iam::123456789012:user/devops-user"
}
```

#### Explanation of Output Attributes:
- **`UserId`**: Unique internal ID of the authenticated AWS IAM principal.
- **`Account`**: 12-digit AWS Account ID associated with the credentials.
- **`Arn`**: Amazon Resource Name identifying the authenticated IAM user or assumed role.

### Common Authentication Errors & Solutions

| Error Message | Likely Root Cause | Solution |
|---|---|---|
| `Unable to locate credentials.` | No credentials configured in `~/.aws/credentials` or environment variables. | Run `aws configure` or authenticate via IAM Identity Center / SSO. |
| `The security token included in the request is invalid.` | Expired session token or malformed Access Key / Secret Key. | Regenerate IAM access keys or re-authenticate SSO session (`aws sso login`). |
| `AccessDenied` | IAM user or role lacks permissions for the requested STS action. | Attach required policy (`AdministratorAccess` or specific EC2/VPC least-privilege policies). |
| `Could not connect to the endpoint URL` | Network connectivity, DNS failure in WSL, or incorrect AWS region. | Verify WSL DNS resolution, internet access, and region setting (`us-east-1`). |

---

## 7. AWS Authentication Best Practices

1. **Prefer Short-Lived Credentials**: Use AWS IAM Identity Center or role-based authentication whenever possible.
2. **Never Commit Secrets to Git**: AWS access keys, secret keys, or `.env` files must be strictly excluded by `.gitignore`.
3. **Never Share Secrets in Public**: Redact Account IDs, Access Keys, and ARNs from screenshots and public writeups.
4. **Avoid Using the AWS Root Account**: Always create a dedicated IAM user with scoped privileges for development tasks.
5. **Set Budget Alerts**: Before launching EC2 instances or NAT Gateways, configure an AWS CloudWatch Budget Alert (e.g., $5.00 limit).
6. **Use `aws configure` Carefully**: For local development with static IAM keys, `aws configure` stores credentials locally in `~/.aws/credentials` (outside Git).

---

## 8. Final Verification Checklist

Before starting Terraform infrastructure development, verify the following:

- [ ] Terraform is installed and available in the Ubuntu terminal (`terraform -version`).
- [ ] AWS CLI v2 is installed correctly system-wide (`which aws`).
- [ ] `aws --version` displays the installed v2 release.
- [ ] Ansible is installed and available (`ansible --version`).
- [ ] Git is installed and configured (`git --version`).
- [ ] AWS authentication succeeds with `aws sts get-caller-identity`.
- [ ] The authenticated identity has the required permissions for VPC, Subnet, and EC2 provisioning.
- [ ] AWS credentials and private keys are excluded from Git.
- [ ] AWS billing and cleanup procedures (`terraform destroy`) have been reviewed.

---

## 9. Next Steps

Once the prerequisites have been verified:
1. Configure and verify AWS credentials on the workstation.
2. Select target AWS region for the project (`us-east-1`).
3. Create the initial Terraform configuration in [`terraform/`](../terraform).
4. Define networking (VPC, Subnet, IGW, Route Table) and Security Groups.
5. Review the execution plan via `terraform plan`.
6. Provision the EC2 instance via `terraform apply`.
7. Configure the instance using Ansible in [`ansible/`](../ansible).
8. Deploy the static website to Nginx (`/var/www/html`).
9. Verify HTTP access via the browser.
10. Destroy resources when finished using `terraform destroy`.

---

## 📚 References
- [AWS CLI v2 Installation Guide](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
- [AWS CLI Configuration Files](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-files.html)
- [AWS CLI Authentication Overview](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-authentication.html)
- [AWS STS GetCallerIdentity API](https://docs.aws.amazon.com/STS/latest/APIReference/API_GetCallerIdentity.html)
