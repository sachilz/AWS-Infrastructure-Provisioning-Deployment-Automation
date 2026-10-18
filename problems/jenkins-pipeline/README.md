# ⚙️ Jenkins CI/CD Pipeline Troubleshooting Catalog

This folder contains detailed incident reports, root cause analyses, and solutions for issues encountered while developing and running the automated DevSecOps Jenkins pipeline on Windows & WSL.

---

## 🗂️ Documented Issues

| Issue Document | Affected Stage | Root Cause | Solution |
|---|---|---|---|
| [`sonar-credentials-not-found.md`](sonar-credentials-not-found.md) | Stage 4: `SonarQube Code Analysis` | Missing secret text credential with ID `sonar-token` in Jenkins credentials store. | Added user API token as `Secret text` in Jenkins Global Credentials. |
| [`docker-command-not-found-windows-service.md`](docker-command-not-found-windows-service.md) | Stage 5: `Hadolint Dockerfile Scan` | Docker Desktop installed under user AppData, missing from Windows System service PATH. | Prepended Docker bin path to `environment.PATH` in Jenkinsfile or Jenkins Global Properties. |
| [`ansible-role-lookup-workspace-mismatch.md`](ansible-role-lookup-workspace-mismatch.md) | Stage 8: `Ansible Syntax Check` | Subdirectory playbook could not find roles when executed from project root; hardcoded desktop path instead of `%WORKSPACE%`. | Updated `site.yml` to use relative path `- role: ../roles/nginx` and dynamic `$(wslpath '%WORKSPACE%')`. |
| [`wsl-local-system-not-supported.md`](wsl-local-system-not-supported.md) | Stage 8: `Ansible Syntax Check` | Windows Service `Local System` account cannot launch user-session WSL engine (`WSL_E_LOCAL_SYSTEM_NOT_SUPPORTED`). | Replaced WSL execution with containerized Ansible runner (`cytopia/ansible:latest`). |
| [`port-already-allocated-test-container.md`](port-already-allocated-test-container.md) | Stage 12: `Test Website Container` | Host port `8081` was already bound by the local Compose container, and mismatched port `18081` in the health check. | Updated container port binding to dedicated CI/CD test port `18081`. |
