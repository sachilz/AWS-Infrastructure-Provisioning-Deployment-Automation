# Terminal Breakdown: Installing AWS CLI v2 on Ubuntu WSL

This document provides a line-by-line explanation of the terminal commands used to install and authenticate the official AWS Command Line Interface (AWS CLI v2) on Ubuntu (WSL 2).

---

## 📋 Session Overview

- **Host Environment**: Ubuntu 24.04 LTS on Windows WSL 2
- **Objective**: Install AWS CLI v2 system-wide and verify STS authentication.
- **Key Output**: AWS CLI v2 installed under `/usr/local/bin/aws`.

---

## 🔍 Detailed Command-by-Command Breakdown

---

### Command 1: `sudo apt update && sudo apt install -y curl unzip`

```bash
sudo apt update && sudo apt install -y curl unzip
```

#### What It Does:
- Refreshes local package indexes and installs:
  - `curl`: Tool to download files from HTTP/HTTPS endpoints.
  - `unzip`: Utility to unpack `.zip` archives.
- `&&`: Chaining operator that only executes the second command if the first succeeds (exit code 0).

#### What Happened:
Ensured the system has the prerequisite tools required by the AWS CLI installer. Without `unzip`, the installer returns `missing required dependencies: unzip`.

---

### Command 2: Download Official AWS CLI v2 Installer Script

```bash
curl -fsSL https://awscli.amazonaws.com/v2/install.sh -o install-aws-cli.sh
```

#### What It Does:
- Downloads the official install script directly from Amazon Web Services.
- `-fsSL`: Fails silently on HTTP errors, runs quietly without progress bars, displays errors if they occur, and follows HTTP redirects.
- `-o install-aws-cli.sh`: Saves the output as a local shell script.

#### What Happened:
The 700+ line bash script `install-aws-cli.sh` was saved to the current working directory.

---

### Command 3: System-Wide Installation (`--system`)

```bash
sudo bash install-aws-cli.sh --system
```

#### What It Does:
- Executes the installer script with administrative privileges (`sudo`).
- `--system`: **Critical flag**. Instructs the installer to place binaries in `/usr/local/bin` and libraries in `/usr/local/aws-cli`, making the `aws` command available to **all users** on the machine.

#### What Happened & Why `--system` Matters:
- Without `--system`, running `sudo bash install-aws-cli.sh` defaults to user-local XDG paths, putting the executable in `/root/.local/bin/aws`. As a result, regular non-root users would get `Command 'aws' not found`.
- With `--system`, the executable is placed in `/usr/local/bin/aws`, which is in every user's default `$PATH`.

---

### Command 4: Check Binary Location and Version

```bash
which aws
aws --version
```

#### What It Does:
- `which aws`: Searches `$PATH` to identify which executable will run.
- `aws --version`: Executes the binary to print version, Python interpreter, and OS architecture.

#### What Happened:
- `which aws` returned `/usr/local/bin/aws`.
- `aws --version` verified AWS CLI v2 is operational.

---

### Command 5: Verify AWS Identity & Authentication

```bash
aws sts get-caller-identity
```

#### What It Does:
- Calls the **AWS Security Token Service (STS)** API method `GetCallerIdentity`.
- Returns the Account ID, IAM User/Role ARN, and unique principal ID.

#### Expected Output:
```json
{
    "UserId": "AIDAXXXXXXXXXXXXXXXX",
    "Account": "123456789012",
    "Arn": "arn:aws:iam::123456789012:user/devops-user"
}
```

#### What Happened & Errors:
- If credentials are not configured, returns `Unable to locate credentials.`.
- Resolved by configuring credentials via `aws configure` (or AWS IAM Identity Center).
