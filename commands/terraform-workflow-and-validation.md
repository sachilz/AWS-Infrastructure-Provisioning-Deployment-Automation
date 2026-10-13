# Terminal Breakdown: Terraform Workflow, Initialization & Validation

This document breaks down the terminal commands executed while initializing, formatting, validating, and testing Terraform in the project's `terraform/` directory.

---

## 📋 Session Overview

- **Host Environment**: Ubuntu 24.04 LTS (WSL 2)
- **Working Directory**: `/mnt/c/Users/sachintha/Desktop/AWS-Infrastructure-Provisioning-Deployment-Automation/terraform`
- **Objective**: Initialize provider plugins, verify code formatting, validate syntax, and test state management.
- **Key Outcome**: Successfully downloaded AWS provider `v6.68.0`, generated `.terraform.lock.hcl`, and achieved `Success! The configuration is valid.`

---

## 🔍 Detailed Command-by-Command Breakdown

---

### Command 1: `terraform init` (Provider Plugin Installation)

```bash
sachintha@Sachilz:.../terraform$ terraform init
```

#### What It Does:
- `terraform init` is the **first command** that must be run in any new or cloned Terraform project.
- It prepares the current working directory for use by:
  1. Initializing the backend (local state storage by default).
  2. Reading `versions.tf` and scanning all `.tf` files for provider requirements.
  3. Querying the Terraform Registry (`registry.terraform.io`).
  4. Downloading required provider binaries into the hidden `.terraform/providers/` directory.
  5. Generating or updating the dependency lock file (`.terraform.lock.hcl`).

#### What Happened in the Terminal:
```text
Initializing the backend...

Initializing provider plugins...
- Finding hashicorp/aws versions matching "~> 6.0"...
- Installing hashicorp/aws v6.68.0...
- Installed hashicorp/aws v6.68.0 (signed by HashiCorp)

Terraform has created a lock file .terraform.lock.hcl to record the provider
selections it made above. Include this file in your version control repository
so that Terraform can guarantee to make the same selections by default when
you run "terraform init" in the future.

Terraform has been successfully initialized!
```

#### Key Technical Concepts:
- **`hashicorp/aws v6.68.0`**: Terraform resolved the version constraint `~> 6.0` (pessimistic constraint operator) to the latest stable release in the 6.x series.
- **`.terraform.lock.hcl`**: Records the exact version (`6.68.0`) and cryptographic SHA-256 hashes of the downloaded provider binary across multiple operating systems. This ensures deterministic, reproducible builds across your team or CI/CD pipelines.
- **`.terraform/` Directory**: Contains the compiled Go binary for the AWS provider (~200MB). This directory is rightly excluded from Git in [`.gitignore`](../.gitignore).

---

### Command 2: `terraform fmt -check` (Format Verification)

```bash
sachintha@Sachilz:.../terraform$ terraform fmt -check
```

#### What It Does:
- `terraform fmt`: Rewrites Terraform configuration files to adhere to canonical HashiCorp configuration style (2-space indents, alignment of `=` signs).
- `-check`: Non-destructive flag. Instead of modifying files, it checks whether files are properly formatted.
  - Exits with `0`: All files are formatted properly.
  - Exits with non-zero: Lists files that require formatting.

#### What Happened:
The command returned immediately with no output and exit code `0`, confirming all configuration files conformed to canonical formatting.

---

### Command 3: `terraform fmt` (In-Place Reformatting)

```bash
sachintha@Sachilz:.../terraform$ terraform fmt
```

#### What It Does:
- Scans all `.tf` files in the current directory and formats them in-place.
- If a file is modified by `fmt`, its filename is printed to stdout.

#### What Happened:
Returned without printing any file names, meaning every `.tf` file was already cleanly formatted.

---

### Command 4: `terraform validate` (Static Syntax & Consistency Check)

```bash
sachintha@Sachilz:.../terraform$ terraform validate
```

#### What It Does:
- Validates configuration files for:
  - Correct HCL syntax.
  - Valid argument names and resource types against the installed provider schemas.
  - Valid references between resources (e.g. `aws_vpc.main.id` referenced in `aws_subnet.public`).
  - Correct variable types and validation rules.
- **Does NOT** contact AWS APIs or verify AWS credentials (it is a purely local static analysis).

#### What Happened:
```text
Success! The configuration is valid.
```
- Confirmed that all 5 Terraform files (`versions.tf`, `provider.tf`, `variables.tf`, `main.tf`, and `outputs.tf`) are internally consistent and completely valid according to AWS provider v6 schemas.

---

### Command 5: `terraform plan` (Execution Plan Generation)

```bash
sachintha@Sachilz:.../terraform$ terraform plan
```

#### What It Does:
- Creates an **execution plan** by comparing three things:
  1. Your desired state (local `.tf` files).
  2. Your current state recorded in `terraform.tfstate`.
  3. The real-world cloud resources currently live in AWS.

#### What Happened in the Terminal:
```text
No changes. Your infrastructure matches the configuration.
```
- **Why this appeared**: This occurred during the initial test when `main.tf` was still a placeholder comment file before adding the resource definitions. With zero resource blocks defined in code and zero resources in AWS, desired state matched actual state (nothing to create).

---

### Command 6: `terraform state list` (Inspecting State File)

```bash
sachintha@Sachilz:.../terraform$ terraform state list
```

#### What It Does:
- Lists all cloud resources tracked in the current Terraform state file (`terraform.tfstate`).

#### What Happened & Error Analysis:
```text
No state file was found!

State management commands require a state file. Run this command
in a directory where Terraform has been run or use the -state flag
to point the command to a specific state location.
```
- **Root Cause**: `terraform state list` requires an existing `terraform.tfstate` file. Because `terraform apply` has not been executed yet, no state file has been created on disk.
- **Takeaway**: State is generated **only** after resources are actually created via `terraform apply`.

---

## 💡 Summary of Key DevOps Practices

| Command | Purpose | When to Run |
|---|---|---|
| `terraform init` | Downloads provider plugins and initializes backend | Once at project start, or when changing providers/modules |
| `terraform fmt` | Automatically formats HCL code to standard style | Before committing code to Git |
| `terraform validate` | Checks code syntax, references, and provider schemas locally | After writing or editing any `.tf` file |
| `terraform plan` | Shows proposed cloud changes (`+` create, `~` update, `-` destroy) | Always before running `terraform apply` |
| `terraform state list` | Inspects currently tracked resources in state | After resources are provisioned via `apply` |
