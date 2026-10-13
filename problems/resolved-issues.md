# Resolved Issues & Troubleshooting Catalog

A running log of technical problems faced and solved throughout this project.

> [!TIP]
> For the comprehensive deep-dive into the WSL setup environment, refer to the dedicated guide:  
> 📖 [AWS CLI Setup and Troubleshooting on Windows WSL](aws-cli-wsl-troubleshooting.md)

---

### [ISSUE-001] Package 'awscli' Has No Installation Candidate in APT

- **Date**: 2026-10-13 / 2026-10-14
- **Component**: Linux (Ubuntu on WSL 2) / Package Management
- **Severity**: High (Blocked AWS CLI installation)

#### 1. What Happened
Attempting to install the AWS CLI using Ubuntu's package manager resulted in APT failing to locate the package.

```bash
sudo apt install awscli
```

#### 2. Exact Error Output
```text
Reading package lists... Done
Building dependency tree... Done
E: Package 'awscli' has no installation candidate
```

#### 3. Root Cause Analysis
The configured Ubuntu APT repositories did not provide an installable package named `awscli`. Furthermore, standard APT packages often contain outdated AWS CLI v1 rather than the modern v2 architecture.

#### 4. Solution / Fix
Switched from APT to the official AWS CLI v2 bundle:
```bash
sudo apt update && sudo apt install -y curl unzip
curl -fsSL https://awscli.amazonaws.com/v2/install.sh -o install-aws-cli.sh
```

#### 5. Prevention / Takeaway
For developer tools that evolve rapidly (AWS CLI, Terraform, Docker), always use official vendor binaries or repositories rather than default distribution package managers.

---

### [ISSUE-002] Missing 'unzip' Dependency During AWS CLI Installation

- **Date**: 2026-10-13 / 2026-10-14
- **Component**: Linux (Ubuntu on WSL 2) / Dependencies
- **Severity**: Medium (Installer failure)

#### 1. What Happened
Running the official AWS CLI installer failed immediately during prerequisite verification.

#### 2. Exact Error Output
```text
aws-cli installer: error: missing required dependencies: unzip
```

#### 3. Root Cause Analysis
Minimal WSL Ubuntu cloud images omit common archive utilities like `unzip`. The AWS CLI installer script downloads a `.zip` bundle and expects `unzip` to be present in `$PATH`.

#### 4. Solution / Fix
Installed `unzip` and `curl` via APT:
```bash
sudo apt update
sudo apt install -y unzip curl
unzip -v
```

#### 5. Prevention / Takeaway
Inspect installer scripts or official prerequisites before running shell installers in minimal container or WSL environments.

---

### [ISSUE-003] AWS CLI Installed Under Root Directory Instead of System-Wide

- **Date**: 2026-10-13 / 2026-10-14
- **Component**: Linux (Ubuntu on WSL 2) / PATH & Permissions
- **Severity**: High (CLI inaccessible to non-root user)

#### 1. What Happened
The installer was executed with `sudo`, placing the binary in root's home directory. Switching back to the standard user resulted in command not found.

```bash
aws --version
# Command 'aws' not found
```

#### 2. Exact Error Output
```text
Installed to: /root/.local/share/aws-cli
Command path: /root/.local/bin/aws
...
Command 'aws' not found, but can be installed with:
sudo apt install awscli
```

#### 3. Root Cause Analysis
The installer defaults to user-local XDG paths (`$HOME/.local/bin`). Running `sudo` without specifying a system-wide flag placed the files into `/root/.local/bin`, which is not in the standard user's `$PATH`.

#### 4. Solution / Fix
Ran the installer with the explicit `--system` parameter to place the binary in `/usr/local/bin`:
```bash
sudo bash install-aws-cli.sh --system
which aws
aws --version
```

#### 5. Prevention / Takeaway
Always pass `--system` to third-party install scripts when installing tools intended for all users on a server.

---

### [ISSUE-004] AWS Authentication Not Configured

- **Date**: 2026-10-13 / 2026-10-14
- **Component**: AWS IAM / Authentication
- **Severity**: High (Blocker for AWS API access)

#### 1. What Happened
While `aws --version` succeeded, running commands requiring AWS cloud authentication failed.

```bash
aws sts get-caller-identity
```

#### 2. Exact Error Output
```text
Unable to locate credentials. You can configure credentials by running "aws configure".
```

#### 3. Root Cause Analysis
Installing the CLI binary only installs the executable; it does not authenticate with AWS. No IAM credentials or profile existed in `~/.aws/credentials` or environment variables.

#### 4. Solution / Fix
1. Created an IAM user with required permissions in the AWS Management Console.
2. Ran `aws configure` to store Access Key ID, Secret Access Key, and default region (`us-east-1`).
3. Verified identity with:
```bash
aws sts get-caller-identity
```

#### 5. Prevention / Takeaway
Separate **client installation** from **identity authentication**. Keep credentials stored in `~/.aws/` and never commit credentials to Git.

---

### [ISSUE-005] SSH Error: "UNPROTECTED PRIVATE KEY FILE! (0644 too open)"

- **Date**: Reference / Setup
- **Component**: Linux / SSH
- **Severity**: High (Blocker for server access)

#### 1. What Happened
Attempting to connect to the AWS EC2 instance using an SSH key pair resulted in the SSH client immediately aborting the connection.

```bash
ssh -i ~/.ssh/id_rsa ubuntu@54.210.88.142
```

#### 2. Exact Error Output
```text
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
@         WARNING: UNPROTECTED PRIVATE KEY FILE!          @
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
Permissions 0644 for '/home/ubuntu/.ssh/id_rsa' are too open.
Load key "/home/ubuntu/.ssh/id_rsa": bad permissions
ubuntu@54.210.88.142: Permission denied (publickey).
```

#### 3. Root Cause Analysis
OpenSSH requires that private keys are readable and writable *only* by the owner. Permission `0644` allows other users to read the key file.

#### 4. Solution / Fix
```bash
chmod 600 ~/.ssh/id_rsa
```

#### 5. Prevention / Takeaway
Always ensure `.ssh` directory permissions are `700` and private key permissions are `600` (`chmod 600 <key>`).

---

### [ISSUE-006] Ansible Connection Timeout to EC2 Instance

- **Date**: Reference / Setup
- **Component**: AWS Networking / Security Groups
- **Severity**: High (Blocker for automated configuration)

#### 1. What Happened
Running an Ansible ping or playbook execution timed out without establishing a connection.

```bash
ansible webservers -m ping -i inventory/hosts.ini
```

#### 2. Exact Error Output
```text
web1 | UNREACHABLE! => {
    "changed": false,
    "msg": "Failed to connect to the host via ssh: ssh: connect to host 54.210.88.142 port 22: Connection timed out",
    "unreachable": true
}
```

#### 3. Root Cause Analysis
The AWS Security Group attached to the EC2 instance did not have an active Ingress rule for TCP Port 22 matching the control machine's public IP address.

#### 4. Solution / Fix
1. Checked current public IP: `curl -s https://checkip.amazonaws.com`
2. Updated `allowed_ssh_cidr` in `terraform.tfvars` with the updated IP (`x.x.x.x/32`).
3. Applied changes: `terraform apply`.

#### 5. Prevention / Takeaway
When working with residential dynamic IPs, verify your current public IP address before testing remote SSH and Ansible connections.
