# 🛠️ Issues, Bugs & Troubleshooting Log

This directory serves as a record of real technical challenges, errors, and blockers encountered while building this project, along with their root causes and resolutions.

Documenting problems and solutions is one of the strongest indicators of practical engineering maturity. It demonstrates:
- Troubleshooting and debugging methodology.
- Ability to read error logs and trace root causes.
- Preventive mindset (knowing how to avoid repeating the same mistake).

---

## 📁 Folder Contents

- [`aws-cli-wsl-troubleshooting.md`](aws-cli-wsl-troubleshooting.md): In-depth WSL Ubuntu setup guide covering APT package issues, missing dependencies, root installation fixes, and STS authentication.
- [`ansible-world-writable-directory.md`](ansible-world-writable-directory.md): Guide for resolving Ansible's world-writable directory security check and ignored `ansible.cfg` in WSL 2.
- [`ansible-role-not-found.md`](ansible-role-not-found.md): Guide for resolving missing role lookups caused by custom directory layouts and skipped `roles_path`.
- [`nginx-template-validation-failure.md`](nginx-template-validation-failure.md): Guide on Nginx configuration context hierarchy and why `validate: "nginx -t -c %s"` fails for virtual host snippets.
- [**`jenkins-pipeline/`**](jenkins-pipeline/README.md): **Dedicated folder for Jenkins CI/CD pipeline issues and fixes:**
  - [`sonar-credentials-not-found.md`](jenkins-pipeline/sonar-credentials-not-found.md): Missing SonarQube credentials in Jenkins store.
  - [`docker-command-not-found-windows-service.md`](jenkins-pipeline/docker-command-not-found-windows-service.md): Docker binary missing from Windows Service system PATH.
  - [`ansible-role-lookup-workspace-mismatch.md`](jenkins-pipeline/ansible-role-lookup-workspace-mismatch.md): Ansible role lookup failure and dynamic `%WORKSPACE%` path resolution.
  - [`wsl-local-system-not-supported.md`](jenkins-pipeline/wsl-local-system-not-supported.md): WSL execution blocked under Windows Service `Local System` account.
  - [`port-already-allocated-test-container.md`](jenkins-pipeline/port-already-allocated-test-container.md): Test container port collision (`8081`) and health check mismatch.
- [`resolved-issues.md`](resolved-issues.md): Running catalog of all resolved problems encountered across Terraform, Ansible, AWS, and Linux.
- [`issue-template.md`](issue-template.md): Standardized template to copy and fill out whenever you hit a new error.

---

## 🔍 The 5-Step DevOps Debugging Framework

When you hit an error during this project, follow this structured approach:

1. **Observe & Capture**: Don't clear your terminal! Copy the exact error code and command that triggered it.
2. **Isolate the Layer**: Identify whether the error is:
   - **Cloud/Network** (AWS SG, Route Table, VPC CIDR, IAM permissions)
   - **IaC Syntax/State** (Terraform provider, variable mismatch, lock issue)
   - **Connection/Auth** (SSH key permission, port 22 blocked, wrong remote user)
   - **Configuration** (Ansible syntax, missing package, file path error)
3. **Formulate a Hypothesis**: Ask: *"Why did the system reject this command or connection?"*
4. **Apply Fix & Verify**: Test the fix in isolation.
5. **Document**: Log it using [`issue-template.md`](issue-template.md).
