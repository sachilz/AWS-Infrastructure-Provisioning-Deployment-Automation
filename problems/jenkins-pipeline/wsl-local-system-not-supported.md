# Jenkins Issue: WSL Not Supported as Local System (`WSL_E_LOCAL_SYSTEM_NOT_SUPPORTED`)

## 1. Issue Overview

| Attribute | Details |
|---|---|
| **Pipeline Stage** | Stage 8: `Ansible Syntax Check` |
| **Component** | Jenkins Windows Service / WSL 2 Integration |
| **Severity** | High (Stage execution blocked by Windows subsystem limitation) |
| **Symptoms** | Executing `wsl` inside a Jenkins Windows batch step returns `WSL_E_LOCAL_SYSTEM_NOT_SUPPORTED`. |

---

## 2. What Happened (Jenkins Console Log)

During Stage 8 (`Ansible Syntax Check`), Jenkins attempted to run:

```text
15:28:04
15:28:04 C:\ProgramData\Jenkins\.jenkins\workspace\aws-devops-docker-cicd>wsl bash -lc "cd /mnt/c/Users/sachintha/Desktop/AWS-Infrastructure-Provisioning-Deployment-Automation && ansible-playbook -i ansible/inventory/hosts.ini ansible/playbooks/site.yml --syntax-check"
15:28:04 Running WSL as local system is not supported.
15:28:04 Error code: Wsl/WSL_E_LOCAL_SYSTEM_NOT_SUPPORTED
15:28:04
15:28:04
```

---

## 3. Root Cause Analysis

### Windows Service Architecture vs. User WSL Subsystem

```text
Windows Architecture:
├── Local System Account (NT AUTHORITY\SYSTEM)
│   └── Jenkins Windows Service (Runs in Session 0, non-interactive)
│       └── ❌ WSL engine cannot launch (No LXSS registry, no user session)
│
└── User Account (sachintha)
    └── WSL 2 / Ubuntu VM (Registered under HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Lxss)
```

1. **Session 0 & Service Account**: Jenkins on Windows is installed and runs as a background Windows Service under the **`Local System`** account (`NT AUTHORITY\SYSTEM`).
2. **User-Bound WSL Registrations**: WSL 2 distributions, virtualization contexts, and filesystems are registered strictly per-user under `HKEY_CURRENT_USER`.
3. **Explicit Restriction**: Microsoft explicitly prevents the WSL kernel service from being invoked under `Local System`, raising `Wsl/WSL_E_LOCAL_SYSTEM_NOT_SUPPORTED`.

---

## 4. Solution / Fix Applied

### Replace WSL Execution with a Portable Docker Container
Instead of attempting to bridge Windows Service $\rightarrow$ User WSL, execute the Ansible syntax check inside a containerized Ansible environment (`cytopia/ansible:latest`).

Updated **Stage 8** in `Jenkinsfile`:

```groovy
stage('8. Ansible Syntax Check') {
    steps {
        bat '''
            docker run --rm ^
              -v "%WORKSPACE%/ansible:/ansible" ^
              -w /ansible ^
              cytopia/ansible:latest ^
              ansible-playbook -i inventory/hosts.ini playbooks/site.yml --syntax-check
        '''
    }
}
```

### Why This Is the Best DevOps Approach:
- **Zero Host Dependency**: Eliminates reliance on whether WSL, Ubuntu, or Ansible are installed on the underlying host.
- **True CI/CD Portability**: The pipeline can now run on any Windows, Linux, or cloud-hosted Jenkins build agent with Docker.
- **Isolated Workspace**: Mounts the checked-out `%WORKSPACE%/ansible` directory directly, testing the exact commit Jenkins is evaluating.

---

## 5. Alternative Solution (System Administration)
If you specifically need Jenkins to run local WSL commands:
1. Open Windows **Services** (`services.msc`).
2. Locate **Jenkins** $\rightarrow$ Right Click $\rightarrow$ **Properties** $\rightarrow$ **Log On** tab.
3. Switch from **Local System account** to **This account** and specify your Windows user (`sachintha`) and password.
4. Restart the service.
