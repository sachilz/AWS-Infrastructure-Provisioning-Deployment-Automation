# Troubleshooting: Ansible World-Writable Directory & Ignored `ansible.cfg` in WSL

## 1. Issue Overview

| Attribute | Details |
|---|---|
| **Component** | Ansible / WSL 2 (Windows Subsystem for Linux) |
| **Severity** | High (Silently ignores project configuration and inventory settings) |
| **Symptoms** | Ansible ignores `ansible.cfg`, warns about world-writable directory, and reports `No inventory was parsed`. |

---

## 2. What Happened (Terminal Output)

When executing `ansible webservers -m ping` inside the `/ansible` directory:

```bash
sachintha@Sachilz:/mnt/c/Users/sachintha/.../ansible$ ansible webservers -m ping
[WARNING]: Ansible is being run in a world writable directory (/mnt/c/Users/sachintha/Desktop/AWS-Infrastructure-Provisioning-Deployment-Automation/ansible), ignoring it as an ansible.cfg source. For more information see https://docs.ansible.com/ansible/devel/reference_appendices/config.html#cfg-in-world-writable-dir
[WARNING]: No inventory was parsed, only implicit localhost is available
[WARNING]: provided hosts list is empty, only localhost is available. Note that the implicit localhost does not match 'all'
[WARNING]: Could not match supplied host pattern, ignoring: webservers
```

Even though an `ansible.cfg` file exists in the directory containing:
```ini
[defaults]
inventory = inventory/hosts.ini
remote_user = ubuntu
host_key_checking = False
...
```

And explicitly passing `-i inventory/hosts.ini` allowed the ping to succeed, but the warning persisted:
```bash
sachintha@Sachilz:/mnt/c/Users/sachintha/.../ansible$ ansible -i inventory/hosts.ini webservers -m ping
[WARNING]: Ansible is being run in a world writable directory (.../ansible), ignoring it as an ansible.cfg source.
web1 | SUCCESS => {
    "ping": "pong"
}
```

---

## 3. Root Cause Analysis

### Why does Ansible ignore `ansible.cfg`?
Ansible includes a built-in security protection: if the directory containing `ansible.cfg` is **world-writable** (permissions `0777` or `o+w`), Ansible **intentionally refuses to load `ansible.cfg`**.

This prevents a scenario in shared multi-user environments where another user could modify `ansible.cfg` to inject malicious plugins, modules, or privilege escalation settings that execute under your user account.

### Why is the directory world-writable in WSL?
Your project is located on the Windows filesystem mounted inside WSL at:
`/mnt/c/Users/sachintha/Desktop/...`

By default, the WSL DrvFs mount driver maps all Windows NTFS files and folders to Linux permissions `0777` (`rwxrwxrwx`). Because every directory on `/mnt/c/` is considered world-writable by the Linux kernel, Ansible triggers this security defense and completely skips reading the local `ansible.cfg`.

Consequently:
- `inventory = inventory/hosts.ini` was ignored.
- `remote_user = ubuntu` was ignored.
- `host_key_checking = False` was ignored.
- `become = True` was ignored.

---

## 4. Solutions & Workarounds

Choose the solution that best fits your workflow:

### Solution 1: Explicitly Set `ANSIBLE_CONFIG` Environment Variable (Recommended & Fastest)

When you explicitly define the path to `ansible.cfg` in an environment variable, Ansible trusts your explicit instruction and bypasses the world-writable directory check.

Run in your terminal:
```bash
export ANSIBLE_CONFIG=./ansible.cfg
```

To make this permanent whenever you open WSL, append it to your `~/.bashrc`:
```bash
echo 'export ANSIBLE_CONFIG=./ansible.cfg' >> ~/.bashrc
source ~/.bashrc
```

Now you can run Ansible commands directly without any warning:
```bash
ansible webservers -m ping
```

---

### Solution 2: Enable Metadata on WSL DrvFs Mounts

You can configure WSL to respect Linux permissions (`chmod`) on `/mnt/c` instead of forcing `0777`.

1. Open `/etc/wsl.conf` with sudo:
   ```bash
   sudo nano /etc/wsl.conf
   ```
2. Add the following automount options:
   ```ini
   [automount]
   options = "metadata,umask=022,fmask=011"
   ```
3. Save the file and restart WSL from PowerShell:
   ```powershell
   wsl.exe --shutdown
   ```
4. Re-open WSL. Directories on `/mnt/c` will now have `755` permissions instead of `777`.

---

### Solution 3: Best Practice for WSL (Clone in Native Linux Filesystem)

In WSL 2, file operations across `/mnt/c/` (the 9P network protocol between Linux VM and Windows host) are significantly slower and have permission limitations.

Industry best practice is to store DevOps projects in the native Linux virtual disk:
```bash
# Clone or move projects to Linux home
cd ~
git clone <repo-url>
cd AWS-Infrastructure-Provisioning-Deployment-Automation/ansible
```
Inside `/home/sachintha/`, permissions are native Linux permissions (`0755` for directories, `0644` for files), completely avoiding this issue while providing **10x faster disk I/O**.

---

### Solution 4: One-Off Ad-Hoc Flag (Quick Workaround)

If you only need to run a single command without modifying settings:
```bash
ansible -i inventory/hosts.ini webservers -m ping
```
*(Note: Remember that any other options defined in `ansible.cfg` such as `host_key_checking = False` or `roles_path` will still be ignored with this method unless passed as CLI flags).*

---

## 5. Verification

After applying Solution 1 or Solution 2, test again:

```bash
cd /mnt/c/Users/sachintha/Desktop/AWS-Infrastructure-Provisioning-Deployment-Automation/ansible
ansible webservers -m ping
```

Expected Output:
```text
web1 | SUCCESS => {
    "ansible_facts": {
        "discovered_interpreter_python": "/usr/bin/python3"
    },
    "changed": false,
    "ping": "pong"
}
```
*(Notice the warning is completely gone, and `-i inventory/hosts.ini` is no longer required!)*

---

## 6. Key Takeaways & Interview Talking Points

1. **Defense in Depth**: Ansible intentionally rejects config files in world-writable folders to protect against privilege escalation and arbitrary code execution from untrusted users.
2. **WSL Architecture**: Files under `/mnt/c/` reside on Windows NTFS and default to `777` permissions in Linux. Understanding cross-platform filesystem mechanics (DrvFs vs. native ext4 VHDX) is a hallmark of strong DevOps engineering.
