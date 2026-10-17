# Troubleshooting: Ansible Role Not Found (`ERROR! the role 'nginx' was not found`)

## 1. Issue Overview

| Attribute | Details |
|---|---|
| **Component** | Ansible / Playbook Orchestration / Directory Layout |
| **Severity** | High (Playbook syntax checks and playbook execution blocked) |
| **Symptoms** | Ansible fails to locate the role referenced in `playbooks/site.yml`. |

---

## 2. What Happened (Terminal Output)

When executing `ansible-playbook -i inventory/hosts.ini playbooks/site.yml --syntax-check` from the `ansible/` root directory:

```bash
sachintha@Sachilz:/mnt/c/Users/sachintha/.../ansible$ ansible-playbook -i inventory/hosts.ini playbooks/site.yml --syntax-check
[WARNING]: Ansible is being run in a world writable directory (/mnt/c/Users/sachintha/Desktop/AWS-Infrastructure-Provisioning-Deployment-Automation/ansible), ignoring it as an ansible.cfg source. For more information see https://docs.ansible.com/ansible/devel/reference_appendices/config.html#cfg-in-world-writable-dir
ERROR! the role 'nginx' was not found in /mnt/c/Users/sachintha/Desktop/AWS-Infrastructure-Provisioning-Deployment-Automation/ansible/playbooks/roles:/home/sachintha/.ansible/roles:/usr/share/ansible/roles:/etc/ansible/roles:/mnt/c/Users/sachintha/Desktop/AWS-Infrastructure-Provisioning-Deployment-Automation/ansible/playbooks

The error appears to be in '/mnt/c/Users/sachintha/Desktop/AWS-Infrastructure-Provisioning-Deployment-Automation/ansible/playbooks/site.yml': line 8, column 7, but may
be elsewhere in the file depending on the exact syntax problem.

The offending line appears to be:

  roles:
    - nginx
      ^ here
```

---

## 3. Root Cause Analysis

### Project Structure vs. Default Role Search Paths

In this project, files are structured with playbooks inside a subdirectory and roles at the top level:

```text
ansible/
├── ansible.cfg          # Contains: roles_path = roles
├── inventory/
│   └── hosts.ini
├── playbooks/
│   └── site.yml         # References role: - nginx
└── roles/
    └── nginx/           # Actual role definition
        ├── handlers/
        ├── tasks/
        └── templates/
```

### Why Did the Lookup Fail?
1. By default, when running a playbook inside `playbooks/`, Ansible searches for roles relative to the **playbook file's directory** (`playbooks/roles/`), followed by system paths (`~/.ansible/roles`, `/usr/share/ansible/roles`, `/etc/ansible/roles`).
2. To tell Ansible that roles are located in `roles/` instead of `playbooks/roles/`, the project includes `ansible.cfg` with:
   ```ini
   roles_path = roles
   ```
3. However, because the workspace is located on a Windows NTFS mount in WSL (`/mnt/c/`), the directory has `0777` permissions. Ansible's security policy caused it to **ignore `ansible.cfg`**.
4. With `ansible.cfg` skipped, the custom `roles_path` was never applied. Ansible looked for `playbooks/roles/nginx` (which does not exist) and failed with `the role 'nginx' was not found`.

---

## 4. Applied Fix

To force Ansible to recognize the project's configuration and custom `roles_path`, we set the `ANSIBLE_CONFIG` environment variable in WSL:

```bash
# Add to ~/.bashrc for persistent sessions
echo 'export ANSIBLE_CONFIG=./ansible.cfg' >> ~/.bashrc
source ~/.bashrc
```

By exporting `ANSIBLE_CONFIG`:
- Ansible trusts the specified config file despite the world-writable directory.
- `roles_path = roles` is loaded into memory.
- `inventory = inventory/hosts.ini` is also loaded (removing the need for `-i inventory/hosts.ini`).

---

## 5. Verification

Ran the playbook syntax check from the `ansible/` directory:

```bash
cd /mnt/c/Users/sachintha/Desktop/AWS-Infrastructure-Provisioning-Deployment-Automation/ansible
ansible-playbook playbooks/site.yml --syntax-check
```

### Output:
```text
playbook: playbooks/site.yml
```
*(Exit code: `0`. Both the world-writable warning and the missing role error are resolved).*

---

## 6. Alternative Solutions & Architecture Insights

1. **Relative `roles_path` in `playbooks/`**: If `ansible.cfg` cannot be used, you can configure roles relative to the playbook inside `playbooks/site.yml`:
   ```yaml
   roles:
     - role: ../roles/nginx
   ```
2. **Standard Directory Layouts**: If you prefer not to configure custom `roles_path`, Ansible by default expects roles alongside playbooks (e.g. `ansible/site.yml` at the same level as `ansible/roles/`).
