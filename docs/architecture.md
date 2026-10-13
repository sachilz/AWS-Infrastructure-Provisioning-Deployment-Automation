# Architecture Overview

## Target Infrastructure Design

The project deploys a secure, automated single-tier web architecture on Amazon Web Services (AWS) using Infrastructure as Code (Terraform) and Configuration Management (Ansible).

```text
+--------------------------------------------------------------------------+
| AWS Cloud (VPC: 10.0.0.0/16)                                             |
|                                                                          |
|   +------------------------------------------------------------------+   |
|   | Public Subnet (10.0.1.0/24)                                      |   |
|   |                                                                  |   |
|   |   +----------------------------------------------------------+   |   |
|   |   | Security Group                                           |   |   |
|   |   |   - Inbound: Port 22 (SSH - Restricted to admin IP)      |   |   |
|   |   |   - Inbound: Port 80 (HTTP - Public 0.0.0.0/0)           |   |   |
|   |   |   - Outbound: All Traffic (0.0.0.0/0)                    |   |   |
|   |   |                                                          |   |   |
|   |   |   +--------------------------------------------------+   |   |   |
|   |   |   | EC2 Instance (Ubuntu 22.04 LTS / 24.04 LTS)     |   |   |   |
|   |   |   |   - Web Server: Nginx                            |   |   |   |
|   |   |   |   - Application: Static Website (/var/www/html)  |   |   |   |
|   |   |   +--------------------------------------------------+   |   |   |
|   |   |                            ▲                             |   |   |
|   |   +----------------------------|-----------------------------+   |   |
|   |                                |                             |   |   |
|   |                     +--------------------+                   |   |   |
|   |                     | Route Table        |                   |   |   |
|   |                     +--------------------+                   |   |   |
|   |                                |                             |   |   |
|   +--------------------------------|-----------------------------+   |
|                                    ▼                                 |
|                       +--------------------------+                   |
|                       | Internet Gateway (IGW)   |                   |
|                       +--------------------------+                   |
|                                    ▲                                 |
+------------------------------------|---------------------------------+
                                     │
                             Internet Traffic
```

## Provisioning and Deployment Flow

1. **Phase 1 (Terraform Provisioning)**:
   - Terraform authenticates with AWS.
   - VPC, Subnet, Internet Gateway, and Route Table are created.
   - Security Group configured with strict SSH access and public HTTP access.
   - EC2 instance launched with an attached SSH key pair.
   - Public IP output is emitted.

2. **Phase 2 (Ansible Configuration & Deployment)**:
   - Ansible connects to the provisioned EC2 instance via SSH.
   - System packages are updated on Ubuntu.
   - Nginx web server is installed and enabled.
   - Custom Nginx virtual host configuration is deployed.
   - Website files (`website/`) are copied to `/var/www/html`.
   - Nginx service is reloaded/restarted.
