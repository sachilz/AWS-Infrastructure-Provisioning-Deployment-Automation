# Jenkins Issue: Ansible Role Lookup & Workspace Path Mismatch (`the role 'nginx' was not found`)

## 1. Issue Overview

| Attribute | Details |
|---|---|
| **Pipeline Stage** | Stage 8: `Ansible Syntax Check` |
| **Component** | Jenkins Pipeline / WSL Integration / Ansible Directory Resolution |
| **Severity** | High (Syntax check validation aborted) |
| **Symptoms** | Ansible failed to locate the `nginx` role when executed from the repository root in CI/CD. |

---

## 2. What Happened (Terminal / Jenkins Log)

When Stage 8 executed the command:
```bash
cd /mnt/c/Users/.../AWS-Infrastructure-Provisioning-Deployment-Automation && ansible-playbook -i ansible/inventory/hosts.ini ansible/playbooks/site.yml --syntax-check
```

The task failed with:
```text
ERROR! the role 'nginx' was not found in /mnt/c/Users/.../AWS-Infrastructure-Provisioning-Deployment-Automation/ansible/playbooks/roles:/home/sachintha/.ansible/roles:/usr/share/ansible/roles:/etc/ansible/roles:/mnt/c/Users/.../AWS-Infrastructure-Provisioning-Deployment-Automation/ansible/playbooks

The offending line appears to be:

  roles:
    - nginx
      ^ here
```

---

## 3. Root Cause Analysis

There were two interrelated causes:

### Cause 1: Missing Root `ansible.cfg`
The project's custom `roles_path = roles` was configured inside `ansible/ansible.cfg`, not at the project root.
When running from the root repository directory:
1. Ansible searches for `ansible.cfg` in `./` (the root).
2. Because no configuration was found in the root, it defaulted role lookup to `<playbook_dir>/roles/` (`ansible/playbooks/roles/`).
3. Since the role is actually located at `ansible/roles/nginx`, Ansible could not find it.

### Cause 2: Hardcoded Path vs Jenkins Workspace
In `Jenkinsfile`, Stage 8 originally had:
```groovy
bat '''
    wsl bash -lc "cd /mnt/c/Users/sachintha/Desktop/AWS-Infrastructure-Provisioning-Deployment-Automation && ansible-playbook ..."
'''
```
Jenkins actually checks out code into its own isolated workspace:
`C:\ProgramData\Jenkins\.jenkins\workspace\aws-devops-docker-cicd`

Running commands against the desktop folder bypassed the code verified by Jenkins and broke portability.

---

## 4. Solution / Fix

### Fix 1: Make Role Reference Relative in `site.yml`
Updated `ansible/playbooks/site.yml` to specify the role relative to the playbook's directory:

```diff
- name: Configure Web Server and Deploy Application
  hosts: webservers
  become: true
  roles:
-   - nginx
+   - role: ../roles/nginx
```

Now, Ansible resolves `../roles/nginx` relative to `site.yml` itself, functioning identically regardless of whether commands run from `./`, from `ansible/`, or in CI/CD.

### Fix 2: Dynamically Convert Jenkins `%WORKSPACE%` to WSL Path
In `Jenkinsfile`, use `wslpath` so WSL points directly to Jenkins's active workspace:

```groovy
stage('8. Ansible Syntax Check') {
    steps {
        bat '''
            wsl bash -lc "cd $(wslpath '%WORKSPACE%') && ansible-playbook -i ansible/inventory/hosts.ini ansible/playbooks/site.yml --syntax-check"
        '''
    }
}
```

---

## 5. Verification
Ran the syntax check from the repository root:
```bash
ansible-playbook -i ansible/inventory/hosts.ini ansible/playbooks/site.yml --syntax-check
```

### Result:
```text
playbook: ansible/playbooks/site.yml
```
*(Exit code: `0` - Success! No role missing errors).*
