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

---

### [ISSUE-007] Ansible World-Writable Directory & Ignored `ansible.cfg` in WSL

- **Date**: 2026-10-17
- **Component**: Ansible / WSL 2 / Filesystem Permissions
- **Severity**: High (Ignored configuration and inventory defaults)

#### 1. What Happened
Running `ansible webservers -m ping` from the project's `ansible/` directory failed to detect the inventory and target hosts defined in `ansible.cfg`.

```bash
ansible webservers -m ping
```

#### 2. Exact Error Output
```text
[WARNING]: Ansible is being run in a world writable directory (/mnt/c/Users/sachintha/Desktop/AWS-Infrastructure-Provisioning-Deployment-Automation/ansible), ignoring it as an ansible.cfg source.
[WARNING]: No inventory was parsed, only implicit localhost is available
[WARNING]: provided hosts list is empty, only localhost is available. Note that the implicit localhost does not match 'all'
[WARNING]: Could not match supplied host pattern, ignoring: webservers
```

#### 3. Root Cause Analysis
Ansible includes a security feature that deliberately skips reading `ansible.cfg` if the directory has world-writable permissions (`0777`). In WSL 2, Windows NTFS drives mounted at `/mnt/c/` default to permission `0777`. As a result, Ansible skipped `ansible.cfg` and missed the default inventory file.

#### 4. Solution / Fix
Set the `ANSIBLE_CONFIG` environment variable to explicitly tell Ansible to trust and load the configuration file:
```bash
export ANSIBLE_CONFIG=./ansible.cfg
# To persist across terminal sessions:
echo 'export ANSIBLE_CONFIG=./ansible.cfg' >> ~/.bashrc
source ~/.bashrc
```

#### 5. Prevention / Takeaway
For Linux-native tooling with strict permission requirements, either set the path via environment variables or store project code in the native Linux filesystem (`/home/username/`) rather than `/mnt/c/`.

---

### [ISSUE-008] Ansible Role Not Found (`ERROR! the role 'nginx' was not found`)

- **Date**: 2026-10-17
- **Component**: Ansible / Role Paths / WSL
- **Severity**: High (Playbook syntax checks and execution blocked)

#### 1. What Happened
Running `ansible-playbook playbooks/site.yml --syntax-check` failed because Ansible could not locate the `nginx` role referenced inside `playbooks/site.yml`.

#### 2. Exact Error Output
```text
[WARNING]: Ansible is being run in a world writable directory (/mnt/c/Users/.../ansible), ignoring it as an ansible.cfg source.
ERROR! the role 'nginx' was not found in .../ansible/playbooks/roles:...

The offending line appears to be:

  roles:
    - nginx
      ^ here
```

#### 3. Root Cause Analysis
Because the current directory was treated as world-writable in WSL, Ansible ignored `ansible.cfg`, which defined `roles_path = roles`. Without this setting, Ansible only looked in `<playbook_dir>/roles` (`playbooks/roles/`) instead of the project's root `roles/` directory.

#### 4. Solution / Fix
Exported `ANSIBLE_CONFIG=./ansible.cfg` in `~/.bashrc`:
```bash
echo 'export ANSIBLE_CONFIG=./ansible.cfg' >> ~/.bashrc
source ~/.bashrc
```
This forces Ansible to load `ansible.cfg`, properly registering `roles_path = roles`.

#### 5. Prevention / Takeaway
When organizing playbooks in subdirectories (e.g. `playbooks/`), either configure `roles_path` in a trusted `ansible.cfg` or reference roles using relative paths (`- role: ../roles/<name>`).

---

### [ISSUE-009] Nginx Template Validation Failure (`"server" directive is not allowed here`)

- **Date**: 2026-10-17
- **Component**: Ansible / Nginx / Template Validation
- **Severity**: High (Playbook execution aborted during Nginx site template deployment)

#### 1. What Happened
Executing `ansible-playbook playbooks/site.yml` failed during the `Install Nginx configuration` task with a validation error.

```bash
ansible-playbook -i inventory/hosts.ini playbooks/site.yml
```

#### 2. Exact Error Output
```text
TASK [nginx : Install Nginx configuration] ******************************************************************
fatal: [web1]: FAILED! => {
    "msg": "failed to validate",
    "stderr": "[emerg] 2438#2438: \"server\" directive is not allowed here in /home/ubuntu/.ansible/tmp/.../source:2\nnginx: configuration file ... test failed\n"
}
```

#### 3. Root Cause Analysis
The task had `validate: "nginx -t -c %s"`. In Nginx, the `-c` flag instructs the binary to parse the file as the complete root configuration (`nginx.conf`), where `server` blocks are only allowed within an `http { ... }` block. Because `nginx.conf.j2` is an included virtual host snippet (placed in `/etc/nginx/sites-available/default`), it only defines a `server { ... }` block without outer wrappers, causing the root-level syntax check to fail.

#### 4. Solution / Fix
Removed `validate: "nginx -t -c %s"` from the `ansible.builtin.template` task in `ansible/roles/nginx/tasks/main.yml`.

#### 5. Prevention / Takeaway
Do not use `nginx -t -c %s` to validate virtual host snippets or files located in `sites-available/` or `conf.d/`. Use global validation via a subsequent `nginx -t` command task if validation is desired.
