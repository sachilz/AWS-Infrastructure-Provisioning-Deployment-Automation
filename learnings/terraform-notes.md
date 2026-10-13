# Infrastructure as Code (Terraform) Notes

## 1. What is Terraform & Declarative IaC?
- In **imperative** tools (like bash scripts or AWS CLI), you specify *step-by-step actions* to create resources.
- In **declarative** tools (Terraform), you specify the *desired end state* (e.g., "I want 1 EC2 instance with this security group"). Terraform calculates the diff and figures out how to reach that state.

## 2. Core Terraform Workflow
1. `terraform init`:
   - Downloads required provider plugins (AWS provider) into `.terraform/`.
   - Generates or reads `.terraform.lock.hcl` to lock provider checksums.
2. `terraform validate`:
   - Checks syntax and internal consistency of configuration files without talking to AWS.
3. `terraform plan`:
   - Reads existing cloud state, compares it with local `.tf` files, and prints an execution plan (`+` to create, `~` to modify, `-` to destroy).
4. `terraform apply`:
   - Executes the plan by making API calls to AWS.
   - Updates `terraform.tfstate`.
5. `terraform destroy`:
   - Deletes all managed cloud resources cleanly to prevent unexpected cloud billing.

## 3. The Role of Terraform State (`terraform.tfstate`)
- **What it does**: Maps real-world AWS resource IDs (e.g., `i-0123456789abcdef0`) to the resource blocks in your code (`aws_instance.web_server`).
- **Why it must NEVER be committed to Git**:
  - Contains full resource attributes in plaintext, including sensitive metadata, passwords, or keys.
  - State files can cause concurrency conflicts if multiple people apply at once.

## 4. File Organization Best Practice
- `versions.tf`: Minimum Terraform version + required provider constraints.
- `provider.tf`: AWS provider settings and default tags.
- `variables.tf`: Input variable definitions, types, and defaults.
- `terraform.tfvars`: Local values for variables (ignored in Git).
- `main.tf`: Core cloud resources.
- `outputs.tf`: Outputs exposed for humans and downstream automation (e.g., Ansible).
