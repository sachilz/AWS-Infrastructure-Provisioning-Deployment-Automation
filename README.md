# AWS Infrastructure Provisioning & Deployment Automation
### 🚀 End-to-End DevSecOps Cloud Architecture with Terraform, Ansible, Docker & Jenkins

[![AWS](https://img.shields.io/badge/AWS-Cloud-232F3E?logo=amazon-aws&logoColor=white)](https://aws.amazon.com/)
[![Terraform](https://img.shields.io/badge/Terraform-1.5+-7B42BC?logo=terraform&logoColor=white)](https://www.terraform.io/)
[![Ansible](https://img.shields.io/badge/Ansible-2.14+-EE0000?logo=ansible&logoColor=white)](https://www.ansible.com/)
[![Docker](https://img.shields.io/badge/Docker-Containerized-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![Jenkins](https://img.shields.io/badge/Jenkins-CI%2FCD-D24939?logo=jenkins&logoColor=white)](https://www.jenkins.io/)
[![Ubuntu](https://img.shields.io/badge/Ubuntu-24.04_LTS-E95420?logo=ubuntu&logoColor=white)](https://ubuntu.com/)
[![Security](https://img.shields.io/badge/DevSecOps-Gitleaks%20%7C%20SonarQube%20%7C%20Trivy-blue)](#-devsecops-pipeline--security-gates)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A production-grade DevSecOps project demonstrating automated cloud infrastructure provisioning, containerization, automated configuration management, and a robust CI/CD security pipeline.

> 🌐 **Live Cloud Deployment**:  
> The containerized website is actively running on AWS EC2 and publicly accessible at:  
> **👉 [http://35.173.190.241/](http://35.173.190.241/)**

---

## 🏛️ System Architecture

![AWS Infrastructure Provisioning & Deployment Automation Architecture](website/assets/AWS%20Infrastructure%20Provisioning%20and%20Deployment%20Automation.png)

### Architectural Flow (Step-by-Step):
1. **Developer Workstation**: Code updates (HTML/CSS/JS, Terraform, Ansible, Jenkinsfile) are authored in VS Code and committed via Git.
2. **Source Repository**: Pushed to GitHub, which triggers the Jenkins CI/CD pipeline via webhook.
3. **IAM Authentication**: Dedicated AWS IAM user with least-privilege policies provides programmatic credentials for cloud automation.
4. **Terraform IaC**: Terraform authenticates via IAM to plan and apply the required AWS networking and compute resources.
5. **Infrastructure Provisioning**: Terraform declaratively builds:
   - Custom **VPC (`10.0.0.0/16`)** with DNS hostnames enabled.
   - **Public Subnet (`10.0.1.0/24`)** mapped to an **Internet Gateway (IGW)**.
   - **Public Route Table** routing `0.0.0.0/0` to the IGW.
   - **Security Group** strictly restricting SSH (port 22) to admin IP and opening HTTP (port 80) to public traffic.
   - **EC2 Instance (Ubuntu 24.04 LTS)** with encrypted root storage and public IP association.
6. **CI/CD Pipeline (Jenkins)**: Executes multi-stage static analysis, secret scanning (Gitleaks), code quality (SonarQube), linting, Trivy container security scanning, and container testing.
7. **Container Registry**: Docker images are built, tagged, and ready for container registry distribution.
8. **Ansible Configuration**: Connects over SSH to the EC2 instance to decommission standalone services, install the Docker engine, transfer assets, build the production image, and launch the website container on port `80:80`.
9. **Container Hosting**: The website runs in an isolated `nginx:alpine` container managed by Docker with automatic restart policies (`unless-stopped`).
10. **End User Access**: Global visitors access the live modern developer profile via HTTP port 80 at **[http://35.173.190.241/](http://35.173.190.241/)**.

---

## 🛠️ Technology Stack

| Domain | Technology | Purpose |
|---|---|---|
| **Cloud Infrastructure** | **AWS (us-east-1)** | VPC, Public Subnet, Route Tables, Internet Gateway, Security Groups, and EC2. |
| **Infrastructure as Code** | **Terraform** | Declarative state management, lifecycle tracking, and reproducible cloud resources. |
| **Config Management** | **Ansible** | Automated system packages, Docker engine installation, file syncing, and container lifecycle. |
| **Containerization** | **Docker & Compose** | Isolated `nginx:alpine` runtime environment for the modern profile web application. |
| **CI/CD Automation** | **Jenkins** | Automated 14-stage declarative pipeline validating secrets, code, IaC, and container health. |
| **Security & Scanning** | **Gitleaks, SonarQube, Trivy, Checkov** | Pre-deployment secret detection, static analysis, IaC compliance, and CVE vulnerability scanning. |
| **Application Layer** | **HTML5, Modern CSS, Vanilla JS** | Modern Facebook-inspired DevSecOps profile dashboard featuring Dark/Light mode and live host metrics. |

---

## ⚙️ Setup Guide & Local Prerequisites

### 1. Local Control Node Requirements (WSL / Ubuntu)
Ensure the following tools are installed on your workstation control environment:

```bash
git --version          # Git version control
aws --version          # AWS CLI v2
terraform -version     # Terraform >= 1.5.0
ansible --version      # Ansible >= 2.14
docker --version       # Docker Engine
ssh -V                 # OpenSSH client
```

### 2. AWS Credentials Configuration
Configure AWS CLI with your dedicated IAM user credentials with EC2, VPC, and networking permissions:

```bash
aws configure
```

Verify your programmatic authentication and account context:
```bash
aws sts get-caller-identity
```

### 3. SSH Key Generation
Generate the dedicated 4096-bit RSA key pair for EC2 authentication:

```bash
ssh-keygen -t rsa -b 4096 -f ~/.ssh/aws-devops-automation -C "aws-devops-automation-key"
```

Set correct permissions on the private key:
```bash
chmod 400 ~/.ssh/aws-devops-automation
```

---

## 📂 Project Directory Structure

```text
AWS-Infrastructure-Provisioning-Deployment-Automation/
├── .editorconfig                 # Editor formatting configuration
├── .gitignore                    # Comprehensive secrets and state isolation
├── LICENSE                       # MIT License
├── README.md                     # Master project architecture & operational documentation
├── Jenkinsfile                   # Declarative 14-stage DevSecOps CI/CD pipeline
├── Dockerfile                    # Multi-stage optimized Nginx website image
├── compose.yaml                  # Local development container orchestration
├── install-aws-cli.sh            # Automated AWS CLI v2 installation helper
│
├── terraform/                    # Infrastructure as Code (AWS Cloud Provisioning)
│   ├── versions.tf               # Required Terraform & AWS provider versions
│   ├── provider.tf               # AWS region and default provider tags
│   ├── variables.tf              # Input parameters (CIDRs, instance type, SSH path)
│   ├── terraform.tfvars.example  # Example variables template (safe for Git)
│   ├── main.tf                   # Core infrastructure (VPC, Subnet, IGW, RT, SG, EC2)
│   └── outputs.tf                # Public IP, instance ID, and SSH connect strings
│
├── ansible/                      # Configuration Management & Docker Deployment
│   ├── ansible.cfg               # Inventory and roles path configuration
│   ├── inventory/
│   │   ├── hosts.example.ini     # Template inventory file
│   │   └── hosts.ini             # Target EC2 public IP and SSH key configuration
│   ├── playbooks/
│   │   └── site.yml              # Master orchestration deployment playbook
│   └── roles/
│       ├── docker/               # Modern Docker Engine & Container deployment role
│       │   └── tasks/main.yml    # Service stop, Docker install, build & container launch
│       └── nginx/                # Legacy standalone Nginx configuration role
│           ├── tasks/main.yml
│           ├── handlers/main.yml
│           └── templates/nginx.conf.j2
│
├── website/                      # Modern Facebook-Style DevSecOps Profile Webpage
│   ├── index.html                # Semantic HTML5 with SVG icons and live cloud status
│   ├── style.css                 # Modern CSS design system with Light/Dark mode
│   ├── script.js                 # Theme toggler, dynamic host/IP badge, feed interactivity
│   └── assets/                   # Architecture diagram, avatar, and banner media
│
├── problems/                     # Technical Issues & Troubleshooting Catalog
│   ├── README.md                 # 5-step DevOps debugging methodology
│   ├── resolved-issues.md        # Master log of encountered bugs and resolutions
│   ├── issue-template.md         # Standard issue template
│   ├── outdated-webpage-unexecuted-deployment.md # Issue #010: Deploy execution gap
│   ├── nginx-template-validation-failure.md      # Issue #009: Virtual host context fix
│   ├── ansible-role-not-found.md                 # Issue #008: Role path resolution
│   ├── ansible-world-writable-directory.md       # Issue #007: WSL directory permissions
│   └── aws-cli-wsl-troubleshooting.md            # AWS CLI installation & STS issues
│
├── learnings/                    # Deep-Dive Technical Notes
│   ├── README.md                 # Learning roadmap
│   ├── aws-networking-notes.md   # VPC, CIDRs, routing, and network segmentation
│   ├── terraform-notes.md        # Declarative IaC, state files, and resource graph
│   ├── ansible-notes.md          # Agentless configuration, idempotency, and tasks
│   └── linux-nginx-notes.md      # Ubuntu administration, systemd, and web performance
│
└── commands/                     # Quick Reference Terminal Guides
    ├── README.md                 # Command index
    ├── terraform-installation-wsl.md
    └── aws-cli-commands-wsl.md
```

---

## 🔒 DevSecOps Pipeline & Security Gates

The Jenkins pipeline ([Jenkinsfile](Jenkinsfile)) enforces a strict "Shift-Left" security strategy:

```text
[Code Checkout] ➔ [Gitleaks Secret Scan] ➔ [SonarQube Static Analysis] ➔ [Quality Gate]
       ➔ [Checkov IaC Scan] ➔ [ShellCheck] ➔ [Terraform Validate] ➔ [Ansible Syntax Check]
       ➔ [Trivy Base Image Scan] ➔ [Docker Build] ➔ [Trivy Image Scan] ➔ [Container Test]
       ➔ [Terraform Plan] ➔ [Ansible Deploy to EC2]
```

1. **Secret Detection (Gitleaks)**: Scans every commit for leaked AWS keys, SSH credentials, or tokens.
2. **Code Quality (SonarQube)**: Validates maintainability, code smells, and syntax vulnerabilities.
3. **IaC Security (Checkov)**: Audits Terraform code against CIS benchmarks (e.g. unencrypted volumes, open ingress).
4. **Container Vulnerability Scanning (Trivy)**: Scans base images (`nginx:alpine`) and final builds for `HIGH` and `CRITICAL` CVEs.
5. **Local Container Healthcheck**: Spins up a test container and runs automated HTTP health checks before releasing.

---

## 🚀 Execution & Deployment Workflow

### Phase 1: Provision Infrastructure with Terraform

1. Navigate to the Terraform directory:
   ```bash
   cd terraform
   ```
2. Create your `terraform.tfvars` from the example template:
   ```bash
   cp terraform.tfvars.example terraform.tfvars
   ```
3. Initialize and apply:
   ```bash
   terraform init
   terraform plan
   terraform apply -auto-approve
   ```
4. Capture the public IP from the output:
   ```bash
   terraform output web_public_ip
   ```

### Phase 2: Deploy Containerized Application with Ansible

1. Update `ansible/inventory/hosts.ini` with your provisioned EC2 Public IP:
   ```ini
   [webservers]
   web1 ansible_host=35.173.190.241 ansible_user=ubuntu ansible_ssh_private_key_file=~/.ssh/aws-devops-automation
   ```

2. Run the deployment playbook:
   ```bash
   cd ../ansible
   ANSIBLE_HOST_KEY_CHECKING=False ansible-playbook -i inventory/hosts.ini playbooks/site.yml
   ```

3. **What Ansible Automates on the EC2 Server**:
   - Stops & disables legacy standalone Nginx to free host port 80.
   - Installs Docker Engine & adds `ubuntu` user to the `docker` group.
   - Syncs `Dockerfile` and `website/` assets to `/opt/devops-website`.
   - Builds the Docker image `devops-profile-website:latest` on EC2.
   - Launches the container `devops-profile-web` on port `80:80` with `--restart unless-stopped`.

---

## 🌐 Verification

Open your browser and navigate to the live EC2 deployment:
```
http://35.173.190.241/
```
*(Or your dynamically provisioned `http://<EC2_PUBLIC_IP>/`)*

### Verified Features:
- 🌓 **Interactive Light / Dark Mode Toggle** with persistent state.
- 🟢 **Live Cloud Status Card** displaying the active host IP dynamically.
- ⚡ **Dockerized Nginx Engine** serving static assets with sub-30ms response times.
- 📱 **Fully Responsive Layout** from mobile displays (360px) to desktop monitors.

---

## 🧹 Infrastructure Teardown

To prevent incurring unnecessary AWS cloud charges after testing:

```bash
cd terraform
terraform destroy -auto-approve
```

---

## 📖 Troubleshooting & Lessons Learned

Encountered an issue or gotcha during deployment? Check our documented solutions:
- **Issue #010**: [Outdated Webpage Display & Port 80 Service Transition](problems/outdated-webpage-unexecuted-deployment.md)
- **Issue #009**: [Nginx Template Validation & Context Hierarchy](problems/nginx-template-validation-failure.md)
- **Issue #008**: [Ansible Role Not Found & Custom Directory Layouts](problems/ansible-role-not-found.md)
- **Issue #007**: [Ansible World-Writable Directory & WSL Permissions](problems/ansible-world-writable-directory.md)
- **Comprehensive Log**: [Full Resolved Issues Catalog](problems/resolved-issues.md)

---

## 📄 License
This project is open-source under the [MIT License](LICENSE).