# Resolved Issues & Troubleshooting Catalog

A running log of technical problems faced and solved throughout this project.

---

### [ISSUE-001] SSH Error: "UNPROTECTED PRIVATE KEY FILE! (0644 too open)"

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
It is required that your private key files are NOT accessible by others.
This private key will be ignored.
Load key "/home/ubuntu/.ssh/id_rsa": bad permissions
ubuntu@54.210.88.142: Permission denied (publickey).
```

#### 3. Root Cause Analysis
OpenSSH requires that private keys are readable and writable *only* by the owner. A permission of `0644` allows other users on the system to read the file, which SSH treats as a potential security compromise.

#### 4. Solution / Fix
Restricted file permissions using `chmod`:
```bash
chmod 600 ~/.ssh/id_rsa
```

#### 5. Prevention / Takeaway
Always ensure `.ssh` directory permissions are `700` and private key permissions are `600` (`chmod 600 <key>`).

---

### [ISSUE-002] Ansible Connection Timeout to EC2 Instance

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
The AWS Security Group attached to the EC2 instance did not have an active Ingress rule for TCP Port 22 allowing the control machine's current public IP address. Alternatively, the local IP changed (dynamic home ISP IP).

#### 4. Solution / Fix
1. Checked current public IP: `curl -s https://checkip.amazonaws.com`
2. Updated the `allowed_ssh_cidr` variable in `terraform.tfvars` with the updated IP (`x.x.x.x/32`).
3. Ran `terraform apply` to update the security group rule.

#### 5. Prevention / Takeaway
When working with residential dynamic IPs, verify your current public IP address before testing remote SSH and Ansible connections.

---

*(Add your future issues and fixes below as you encounter them during implementation!)*
