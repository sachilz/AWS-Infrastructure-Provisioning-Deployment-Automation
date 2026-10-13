# AWS Infrastructure Provisioning & Deployment Automation

A hands-on DevOps project demonstrating automated cloud infrastructure provisioning and configuration management using **Terraform**, **Ansible**, **AWS**, and **Linux (Ubuntu)**.

---

## 📌 Project Overview

This repository demonstrates an end-to-end DevOps workflow for provisioning cloud infrastructure and deploying a web application. 

Instead of manual point-and-click provisioning in the AWS Management Console, the entire infrastructure lifecycle is managed via **Infrastructure as Code (IaC)** with Terraform. Once the virtual machines and networking are live, **Ansible** automates system configuration, security baseline setup, web server installation (Nginx), and deployment of a static website.

---

## 🛠️ Planned Technologies

| Technology | Role | Purpose |
|---|---|---|
| **AWS** | Cloud Provider | Hosts networking (VPC, Subnet, Route Tables, Security Group) and compute (EC2). |
| **Terraform** | Infrastructure as Code (IaC) | Declaratively provisions and manages AWS resources. |
| **Ansible** | Configuration Management | Configures the Ubuntu server, installs Nginx, and deploys website files. |
| **Linux (Ubuntu)** | Operating System | Host OS for both the local control environment and the cloud target instance. |
| **Nginx** | Web Server | High-performance HTTP server serving the static website. |
| **Git & GitHub** | Version Control | Source code management, branching strategy, and project documentation. |

---

## 🎯 Learning & Engineering Objectives

- **Infrastructure as Code (IaC)**: Write modular, reusable Terraform configurations to manage cloud resources reproducibly.
- **Automated Configuration**: Use Ansible playbooks and roles to configure servers idempotently without manual SSH commands.
- **Cloud Networking & Security**: Implement AWS VPC, subnets, route tables, internet gateways, and security groups following least-privilege principles.
- **Git & Repository Architecture**: Maintain a clean, industry-standard directory structure with strict `.gitignore` rules to protect secrets and state.
- **Hands-on DevOps Troubleshooting**: Diagnose and resolve networking, SSH authentication, and service configuration issues in Linux.

---

## 📂 Project Structure

```text
AWS-Infrastructure-Provisioning-Deployment-Automation/
├── .editorconfig                 # Editor formatting configuration
├── .gitignore                    # Excludes state files, keys, and temporary artifacts
├── LICENSE                       # MIT License
├── README.md                     # Project documentation
│
├── terraform/                    # Infrastructure as Code (Terraform)
│   ├── versions.tf               # Terraform and provider version constraints
│   ├── provider.tf               # AWS provider configuration
│   ├── variables.tf              # Input variable declarations
│   ├── terraform.tfvars.example  # Sample variable values (safe for version control)
│   ├── main.tf                   # Core AWS resources (VPC, Subnet, SG, EC2)
│   └── outputs.tf                # Infrastructure outputs (Public IP, Instance ID)
│
├── ansible/                      # Configuration Management (Ansible)
│   ├── ansible.cfg               # Ansible runtime configuration
│   ├── inventory/
│   │   └── hosts.example.ini     # Inventory template for target EC2 instances
│   ├── playbooks/
│   │   └── site.yml              # Main orchestration playbook
│   └── roles/
│       └── nginx/                # Reusable Nginx configuration role
│           ├── tasks/main.yml    # Task definitions (install, configure, deploy)
│           ├── handlers/main.yml # Handlers (service reload/restart)
│           └── templates/        # Jinja2 configuration templates
│               └── nginx.conf.j2
│
├── website/                      # Static Application Content
│   ├── index.html                # Static site homepage
│   ├── style.css                 # Site styling
│   └── assets/                   # Image assets and icons
│
├── scripts/                      # Automation & Helper Scripts
│   ├── setup_local_env.sh        # Verifies local workstation tools
│   └── deploy.sh                 # Master deployment execution script
│
├── learnings/                    # Key Concepts & Technical Notes
│   ├── README.md                 # Index of learning modules
│   ├── aws-networking-notes.md   # VPC, CIDR, subnets, routing, and security
│   ├── terraform-notes.md        # Declarative IaC, lifecycle, and state
│   ├── ansible-notes.md          # Agentless automation, idempotency, and roles
│   └── linux-nginx-notes.md      # Ubuntu administration, systemd, and virtual hosts
│
├── problems/                     # Issues & Troubleshooting Catalog
│   ├── README.md                 # 5-step debugging framework
│   ├── issue-template.md         # Template to document new errors
│   └── resolved-issues.md        # Running catalog of bugs, root causes, and fixes
│
└── docs/                         # Project Architecture & Guides
    ├── architecture.md           # Architecture diagrams and design details
    └── setup-guide.md            # Local workstation and AWS prerequisites
```

---

## 🚀 Planned Implementation Phases

The project is structured into 5 iterative phases:

### Phase 1: Repository Architecture & Local Setup
- [x] Design clean, scalable folder layout.
- [x] Configure robust `.gitignore` for secrets and state isolation.
- [x] Establish setup guide and local environment validation scripts.

### Phase 2: AWS Infrastructure as Code with Terraform
- [ ] Write modular Terraform files (`versions.tf`, `provider.tf`, `variables.tf`).
- [ ] Define AWS VPC, Public Subnet, Internet Gateway, and Route Table.
- [ ] Configure EC2 Security Group (Port 22 restricted, Port 80 open).
- [ ] Provision Ubuntu EC2 instance and export public IP via `outputs.tf`.

### Phase 3: Configuration Management with Ansible
- [ ] Configure `ansible.cfg` and inventory.
- [ ] Build reusable `nginx` Ansible role (tasks, handlers, Jinja2 template).
- [ ] Write main playbook `site.yml` for automated configuration and idempotency testing.

### Phase 4: Application Deployment & Verification
- [ ] Integrate static website deployment into Ansible workflow.
- [ ] Deploy site to `/var/www/html` and verify HTTP access via browser.
- [ ] Test end-to-end automation with `scripts/deploy.sh`.

### Phase 5: Documentation & Portfolio Presentation
- [ ] Create architecture diagram visual.
- [ ] Document lessons learned, security best practices, and cleanup steps (`terraform destroy`).
- [ ] Publish project to GitHub as a portfolio showcase.

---

## 🔐 Security Best Practices

1. **No Hardcoded Credentials**: AWS credentials are never committed. They are loaded via environment variables or local AWS CLI profiles.
2. **State & Key Isolation**: `.gitignore` strictly blocks `.tfstate`, `*.pem`, `id_rsa`, and local `*.tfvars` files.
3. **Least Privilege**: Security group ingress rules should restrict SSH (port 22) to your public IP rather than `0.0.0.0/0`.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).