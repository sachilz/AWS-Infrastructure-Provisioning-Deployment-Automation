# Setup Guide & Local Prerequisites

This guide outlines the local environment requirements before initiating Terraform provisioning or Ansible deployment.

## 1. Prerequisites (Local Ubuntu Environment)

Ensure the following tools are installed on your local control node (Ubuntu / WSL):

- **Git** (`git --version`)
- **AWS CLI v2** (`aws --version`)
- **Terraform >= 1.5.0** (`terraform -version`)
- **Ansible >= 2.14** (`ansible --version`)
- **SSH Client** (`ssh -V`)

## 2. AWS Credentials Configuration

Configure AWS CLI credentials with an IAM user that has permissions for EC2, VPC, and networking:

```bash
aws configure
```

Verify your identity:
```bash
aws sts get-caller-identity
```

## 3. SSH Key Generation

Generate an SSH key pair to access the EC2 instance:

```bash
ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa -C "devops-portfolio-key"
```

## 4. Next Steps

Refer to the root [README.md](../README.md) for the phased implementation workflow.
