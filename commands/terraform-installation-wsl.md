# Terminal Breakdown: Installing Terraform on Ubuntu WSL

This document provides a line-by-line explanation of the terminal commands executed while setting up HashiCorp Terraform on Ubuntu (WSL 2).

---

## 📋 Session Overview

- **Host Environment**: Ubuntu 24.04 LTS (Noble Numbat) on Windows WSL 2
- **Objective**: Install the official HashiCorp Terraform binary and verify its version.
- **Result**: Successfully installed **Terraform v1.16.5 (linux_amd64)**.

---

## 🔍 Detailed Command-by-Command Breakdown

---

### Command 1: `pwd`

```bash
sachintha@Sachilz:/mnt/c/Users/sachintha/Desktop/AWS-Infrastructure-Provisioning-Deployment-Automation$ pwd
```

#### What It Does:
- `pwd` stands for **Print Working Directory**.
- Displays the absolute path of the current shell location.

#### What Happened:
```text
/mnt/c/Users/sachintha/Desktop/AWS-Infrastructure-Provisioning-Deployment-Automation
```
- In WSL, Windows physical drives are mounted under the `/mnt/` directory (`C:\` corresponds to `/mnt/c/`). This confirmed the terminal was positioned at the project root directory.

---

### Command 2: `ls -la terraform`

```bash
sachintha@Sachilz:/mnt/c/Users/sachintha/Desktop/AWS-Infrastructure-Provisioning-Deployment-Automation$ ls -la terraform
```

#### What It Does:
- `ls`: List directory contents.
- `-l`: Use the long listing format (shows file permissions, owner, group, file size, and timestamp).
- `-a`: Include hidden files (files starting with a `.`).
- `terraform`: The target subdirectory to inspect.

#### What Happened:
The terminal listed the repository's Terraform files (`main.tf`, `outputs.tf`, `provider.tf`, `variables.tf`, `versions.tf`, and `terraform.tfvars.example`), verifying that all scaffolding was present before attempting execution.

---

### Command 3: `cd terraform`

```bash
sachintha@Sachilz:/mnt/c/Users/sachintha/Desktop/AWS-Infrastructure-Provisioning-Deployment-Automation$ cd terraform
```

#### What It Does:
- `cd` stands for **Change Directory**.
- Moves the shell's active working directory into `/terraform`.

#### What Happened:
The command prompt updated to `.../terraform$`, ensuring all subsequent Terraform commands run in the context of the IaC configuration files.

---

### Command 4: `terraform init` (Error Encountered)

```bash
sachintha@Sachilz:/mnt/c/Users/sachintha/Desktop/AWS-Infrastructure-Provisioning-Deployment-Automation/terraform$ terraform init
```

#### What It Does:
- Intended to initialize the Terraform working directory by reading configuration files and downloading provider plugins into `.terraform/`.

#### What Happened & Error Analysis:
```text
Command 'terraform' not found, but can be installed with:
sudo snap install terraform
```
- **Error**: The binary `terraform` was not installed or present in `$PATH`.
- **System Suggestion Warning**: Ubuntu suggested `sudo snap install terraform`. 
  > [!WARNING]
  > Snaps often encounter permission or daemon issues inside WSL environments without systemd. The official and recommended approach on Ubuntu is using **HashiCorp's official APT repository**.

---

### Command 5: `sudo apt update`

```bash
sachintha@Sachilz:/mnt/c/Users/sachintha/Desktop/AWS-Infrastructure-Provisioning-Deployment-Automation/terraform$ sudo apt update
```

#### What It Does:
- `sudo`: SuperUser DO (runs with root administrative privileges).
- `apt update`: Contacts configured package repositories to refresh the local package cache with the latest available software versions.

#### What Happened:
Downloaded repository metadata from `archive.ubuntu.com` and `security.ubuntu.com` for Ubuntu 24.04 (`noble`). Reported that 53 system packages were eligible for upgrades.

---

### Command 6: `sudo install terraform` (Syntax Mistake)

```bash
sachintha@Sachilz:/mnt/c/Users/sachintha/Desktop/AWS-Infrastructure-Provisioning-Deployment-Automation/terraform$ sudo install terraform
```

#### What Happened & Error Analysis:
```text
install: missing destination file operand after 'terraform'
Try 'install --help' for more information.
```
- **Error**: The user intended to run `sudo apt install terraform`, but omitted the package manager `apt`.
- In Linux, `install` is a core utility (part of GNU coreutils) used to copy files and set file attributes (similar to `cp` + `chmod`). Because no destination directory was provided, `install` errored out.

---

### Command 7: `sudo apt install -y curl gpg`

```bash
sachintha@Sachilz:/mnt/c/Users/sachintha/Desktop/AWS-Infrastructure-Provisioning-Deployment-Automation/terraform$ sudo apt install -y curl gpg
```

#### What It Does:
- Installs prerequisites needed to safely download and verify HashiCorp's repository:
  - `curl`: Command-line tool for transferring data via URLs.
  - `gpg`: GNU Privacy Guard, used to verify cryptographic signatures.
- `-y`: Automatically answers "yes" to installation confirmation prompts.

#### What Happened:
Both `curl` (8.5.0) and `gpg` (2.4.4) were already installed. The system marked them as manually installed so they will not be automatically purged.

---

### Command 8: Add HashiCorp GPG Signing Key

```bash
curl -fsSL https://apt.releases.hashicorp.com/gpg | sudo gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg
```

#### What It Does:
This pipeline cryptographically registers HashiCorp as a trusted software publisher on your Ubuntu system.

- **`curl -fsSL https://apt.releases.hashicorp.com/gpg`**:
  - `-f` (fail silently on server errors).
  - `-s` (silent mode, hides progress bar).
  - `-S` (show error if it fails).
  - `-L` (follow HTTP redirects).
  - Fetches HashiCorp's public ASCII-armored PGP key.
- **`|` (Pipe)**:
  - Streams the output of `curl` directly into the input of `gpg`.
- **`sudo gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg`**:
  - `--dearmor`: Converts the OpenPGP ASCII-armored key into binary format required by modern APT.
  - `-o`: Writes the binary keyring to `/usr/share/keyrings/hashicorp-archive-keyring.gpg`.

#### What Happened:
Ubuntu saved the cryptographic key. When APT downloads packages in subsequent steps, it verifies the packages were signed by HashiCorp's private key, preventing supply-chain tampering.

---

### Command 9: Add HashiCorp Official Repository to APT Sources

```bash
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(grep -oP '(?<=UBUNTU_CODENAME=).*' /etc/os-release || lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/hashicorp.list
```

#### What It Does:
Constructs an APT source entry string and writes it to a new file in `/etc/apt/sources.list.d/`.

#### Component Breakdown:
1. **`dpkg --print-architecture`**: Automatically resolves your CPU architecture (prints `amd64`).
2. **`signed-by=/usr/share/keyrings/...`**: Explicitly scopes the GPG key to this repository only (Debian/Ubuntu security best practice to prevent rogue keys from signing packages across other repos).
3. **`https://apt.releases.hashicorp.com`**: The official HashiCorp Debian package mirror.
4. **`grep -oP '(?<=UBUNTU_CODENAME=).*' /etc/os-release`**: Extracts the Ubuntu release codename (resolves to `noble` for Ubuntu 24.04).
5. **`sudo tee /etc/apt/sources.list.d/hashicorp.list`**: Standard way to write to a root-owned file in a bash pipeline without permission issues from standard redirection (`>`).

#### Resulting File Content:
```text
deb [arch=amd64 signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com noble main
```

---

### Command 10 & 11: Update Package Index & Install Terraform

```bash
sudo apt update
sudo apt install -y terraform
```

#### What It Does:
- `sudo apt update`: Reads the newly created `hashicorp.list` file and indexes HashiCorp's remote software package list.
- `sudo apt install -y terraform`: Downloads and installs the latest stable version of Terraform.

#### What Happened:
```text
Get:4 https://apt.releases.hashicorp.com noble InRelease [12.8 kB]
Get:5 https://apt.releases.hashicorp.com noble/main amd64 Packages [326 kB]
...
Get:1 https://apt.releases.hashicorp.com noble/main amd64 terraform amd64 1.16.5-1 [35.9 MB]
Selecting previously unselected package terraform.
Unpacking terraform (1.16.5-1) ...
Setting up terraform (1.16.5-1) ...
```
- APT contacted `apt.releases.hashicorp.com`.
- Downloaded the Debian package archive (`35.9 MB`).
- Installed the executable to `/usr/bin/terraform`.

---

### Command 12: `terraform version` (Verification)

```bash
sachintha@Sachilz:/mnt/c/Users/sachintha/Desktop/AWS-Infrastructure-Provisioning-Deployment-Automation/terraform$ terraform version
```

#### What It Does:
- Executes the Terraform binary with the `version` subcommand to ensure the binary is functional and located in `$PATH`.

#### What Happened:
```text
Terraform v1.16.5
on linux_amd64
```
- Output confirms that **Terraform v1.16.5** is installed and ready for infrastructure development on Ubuntu Linux!

---

## 💡 Summary of Key Takeaways

1. **Avoid `sudo snap install` in WSL**: Snap requires systemd and often fails in WSL; official APT repositories are the standard.
2. **Keyrings vs. Trusted.gpg**: Modern Ubuntu deprecates `apt-key add`. The `signed-by=/usr/share/keyrings/...` pattern is the current industry standard for repository isolation.
3. **Difference between `install` and `apt install`**: `install` is a file manipulation command; `apt install` is the package manager command.
