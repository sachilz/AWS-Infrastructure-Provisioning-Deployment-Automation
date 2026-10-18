# Troubleshooting: Public IP Showing Outdated Webpage After Code Changes

## 1. Issue Overview

| Attribute | Details |
|---|---|
| **Component** | Deployment Automation / Ansible / Docker / EC2 / Web Service |
| **Severity** | Medium (Developer confusion / Outdated production artifacts served) |
| **Symptoms** | After updating website code locally (`index.html`, `style.css`, `script.js`) and creating the new Docker role, navigating to `http://<EC2-PUBLIC-IP>/` continued to display the previous, unmodernized webpage. |

---

## 2. What Happened (Symptoms)

1. The website files in `website/` were modernized with a new UI, dark/light theme, and dynamic JavaScript features.
2. An Ansible Docker role was authored to build and run the website inside a Docker container on EC2.
3. However, accessing the public IP `http://35.173.190.241/` in the web browser still displayed the old version of the website. Hard-refreshing (`Ctrl + F5`) did not change the page.

---

## 3. Root Cause Analysis

This issue was caused by two interconnected factors in the deployment lifecycle:

### A. Local Edits Do Not Automatically Propagate to Remote Cloud Instances
In cloud and infrastructure engineering, files modified on a developer's local workstation (Windows filesystem) remain strictly local until an explicit delivery mechanism transfers and executes them:
* **Manual execution:** Running `ansible-playbook` over SSH from WSL to push changes to the EC2 server.
* **Continuous Deployment (CD):** A pipeline trigger in Jenkins or GitHub Actions that runs deployment scripts automatically.

Because Stage 14 in `Jenkinsfile` was intentionally stubbed out:
```groovy
stage('14. Deploy to EC2') {
    echo 'Deployment is not enabled yet.'
    echo 'Configure a Linux Ansible execution agent before enabling deployment.'
}
```
No automated CD pipeline was pushing code changes to EC2 upon file saving. The EC2 instance was still serving the files from the previous Ansible run.

### B. Daemon Service vs. Container Port 80 Collision Risk
The EC2 server was previously configured with standalone **Nginx** running as a systemd background service on port 80. Transitioning to a containerized Docker architecture required:
1. Stopping and disabling the host-level Nginx service (`systemctl stop nginx && systemctl disable nginx`).
2. If host Nginx remained active, Docker would throw a port binding error (`bind: address already in use: 0.0.0.0:80`).
3. Running the new Docker container with `-p 80:80` so incoming HTTP traffic hits the Docker container instead of the old `/var/www/html` directory.

---

## 4. Solution / Fix

### Step 1: Ensure Host Nginx is Stopped in Ansible
In [`ansible/roles/docker/tasks/main.yml`](../ansible/roles/docker/tasks/main.yml), the first task guarantees that host Nginx is stopped to release port 80:

```yaml
- name: Ensure standalone nginx service is stopped and disabled (prevent port 80 conflict)
  ansible.builtin.service:
    name: nginx
    state: stopped
    enabled: false
  failed_when: false
```

### Step 2: Build and Run Container on EC2
The role copies the updated `Dockerfile` and `website/` directory to `/opt/devops-website`, triggers `docker build`, and starts the container:

```yaml
- name: Run website container on EC2
  ansible.builtin.command:
    cmd: >
      docker run -d
      --name devops-profile-web
      --restart unless-stopped
      -p 80:80
      devops-profile-website:latest
```

### Step 3: Execute the Ansible Playbook from WSL
Executed the playbook against the inventory:

```bash
cd /mnt/c/Users/sachintha/Desktop/AWS-Infrastructure-Provisioning-Deployment-Automation/ansible
ANSIBLE_HOST_KEY_CHECKING=False ansible-playbook -i inventory/hosts.ini playbooks/site.yml
```

**Playbook Execution Result:**
```text
PLAY [Configure Web Server and Deploy Containerized Application] ***************

TASK [Gathering Facts] *********************************************************
ok: [web1]
...
TASK [../roles/docker : Build Docker image inside EC2] *************************
changed: [web1]

TASK [../roles/docker : Run website container on EC2] **************************
changed: [web1]

PLAY RECAP *********************************************************************
web1                       : ok=12   changed=2    unreachable=0    failed=0
```

### Step 4: Verification
Inspecting the running container on the EC2 host via SSH:
```bash
ssh -i ~/.ssh/aws-devops-automation ubuntu@35.173.190.241 'docker ps'
```
Output:
```text
CONTAINER ID   IMAGE                           STATUS         PORTS                NAMES
43c9c3cff0bf   devops-profile-website:latest   Up 28 seconds  0.0.0.0:80->80/tcp   devops-profile-web
```

Navigating to `http://35.173.190.241/` immediately loaded the modernized UI.

---

## 5. Key Takeaways & Best Practices

1. **Local Changes $\neq$ Deployed Changes**: Always remember the separation between the local development workspace, the Git repository, and the target cloud infrastructure. Code must be transferred and re-built/reloaded on target servers.
2. **Port Conflict Management**: When migrating from native OS packages (systemd daemons) to containerized deployments (Docker), always stop and disable the native daemon first to prevent silent port collision or lingering legacy services.
3. **Automate CD When Ready**: Once the Linux Jenkins execution agent is configured, enable Stage 14 in `Jenkinsfile` so every Git push automatically runs the Ansible deployment playbook.
