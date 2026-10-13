# 💻 Terminal Commands Reference

This directory documents real terminal commands executed during the setup, provisioning, and configuration of the **AWS Infrastructure Provisioning & Deployment Automation** project on Ubuntu (Windows WSL 2).

Each document provides a step-by-step breakdown of:
- The exact command entered.
- What happened under the hood.
- Why the command was needed.
- Explanations of outputs and error messages.

---

## 📑 Command Guides

| Document | Focus Area | Key Commands Covered |
|---|---|---|
| [`terraform-installation-wsl.md`](terraform-installation-wsl.md) | Official Terraform Installation on Ubuntu WSL | `curl`, `gpg --dearmor`, `tee`, `apt update`, `apt install -y terraform`, `terraform version` |
| [`terraform-workflow-and-validation.md`](terraform-workflow-and-validation.md) | Terraform Workflow & Local Validation | `terraform init`, `terraform fmt -check`, `terraform validate`, `terraform plan`, `terraform state list` |
| [`aws-cli-commands-wsl.md`](aws-cli-commands-wsl.md) | AWS CLI v2 Installation & Verification | `curl`, `unzip`, `bash install-aws-cli.sh --system`, `aws sts get-caller-identity` |
