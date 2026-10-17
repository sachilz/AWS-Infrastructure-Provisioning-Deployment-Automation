# Troubleshooting: Nginx Template Validation Failure (`"server" directive is not allowed here`)

## 1. Issue Overview

| Attribute | Details |
|---|---|
| **Component** | Ansible / Nginx / Template Validation (`ansible.builtin.template`) |
| **Severity** | High (Aborted playbook execution during task `Install Nginx configuration`) |
| **Symptoms** | Ansible failed to deploy the Nginx site configuration due to validation failure `[emerg] "server" directive is not allowed here`. |

---

## 2. What Happened (Terminal Output)

During the execution of `ansible-playbook -i inventory/hosts.ini playbooks/site.yml`, the playbook failed at the Nginx template task:

```text
TASK [nginx : Install Nginx configuration] ******************************************************************
fatal: [web1]: FAILED! => {
    "changed": false,
    "checksum": "ab45a06b15bf2bf7f5a5275473a21ba32d5d480f",
    "exit_status": 1,
    "msg": "failed to validate",
    "stderr": "2026/10/17 16:31:41 [emerg] 2438#2438: \"server\" directive is not allowed here in /home/ubuntu/.ansible/tmp/ansible-tmp-1792254687.1130202-3252-12460936122453/source:2\nnginx: configuration file /home/ubuntu/.ansible/tmp/ansible-tmp-1792254687.1130202-3252-12460936122453/source test failed\n",
    "stderr_lines": [
        "2026/10/17 16:31:41 [emerg] 2438#2438: \"server\" directive is not allowed here in /home/ubuntu/.ansible/tmp/ansible-tmp-1792254687.1130202-3252-12460936122453/source:2",
        "nginx: configuration file /home/ubuntu/.ansible/tmp/ansible-tmp-1792254687.1130202-3252-12460936122453/source test failed"
    ],
    "stdout": "",
    "stdout_lines": []
}

PLAY RECAP **************************************************************************************************
web1                       : ok=4    changed=2    unreachable=0    failed=1    skipped=0    rescued=0    ignored=0
```

---

## 3. Root Cause Analysis

### The Syntax Hierarchy of Nginx
Nginx configuration files follow a strict nested context hierarchy:

```text
nginx.conf (Main / Root Context)
├── events { ... }
└── http { ... }
    ├── include /etc/nginx/conf.d/*.conf;
    └── include /etc/nginx/sites-enabled/*;
        └── server { ... } (Virtual Host Context)
            └── location { ... }
```

In Nginx:
- A `server { ... }` block is only syntactically legal **inside** an `http { ... }` block.
- A `server { ... }` block is **strictly forbidden** at the top level of a standalone configuration file.

### Why `validate: "nginx -t -c %s"` Caused the Failure
In `ansible/roles/nginx/tasks/main.yml`, the task was written as:
```yaml
- name: Install Nginx configuration
  ansible.builtin.template:
    src: nginx.conf.j2
    dest: /etc/nginx/sites-available/default
    owner: root
    group: root
    mode: "0644"
    validate: "nginx -t -c %s"  # <--- Root Cause
  notify: Reload nginx
```

1. Ansible renders the template to a temporary staging file on the remote host (e.g. `/home/ubuntu/.ansible/tmp/.../source`).
2. Before replacing the destination file, Ansible executes the `validate` command, substituting `%s` with the path to the temporary file.
3. The flag **`-c <file>`** instructs Nginx to use that temporary file as the **complete, standalone root configuration file** (replacing `/etc/nginx/nginx.conf`).
4. However, `nginx.conf.j2` is merely a virtual host snippet destined for `/etc/nginx/sites-available/default`. It begins directly with `server { ... }` without the outer `events { }` or `http { }` wrappers.
5. When Nginx parsed the file as a root configuration, it immediately encountered `server` on line 2 and aborted with:
   `[emerg] "server" directive is not allowed here`.

---

## 4. Solution / Fix

Remove the `validate: "nginx -t -c %s"` line from the task in `ansible/roles/nginx/tasks/main.yml`:

```diff
- name: Install Nginx configuration
  ansible.builtin.template:
    src: nginx.conf.j2
    dest: /etc/nginx/sites-available/default
    owner: root
    group: root
    mode: "0644"
-   validate: "nginx -t -c %s"
  notify: Reload nginx
```

---

## 5. Verification

After removing `validate: "nginx -t -c %s"`, re-running the playbook succeeded cleanly:

```bash
ansible-playbook -i inventory/hosts.ini playbooks/site.yml
```

### Result:
- `TASK [nginx : Install Nginx configuration]` changed successfully.
- `RUNNING HANDLER [nginx : Reload nginx]` reloaded the web server without errors.
- The web server served the static site over HTTP on port 80.

---

## 6. Best Practices: How to Safely Validate Nginx in Ansible

If you want automated configuration testing without breaking virtual host snippets, use one of these standard patterns:

### Pattern A: Test Nginx globally after template installation (Recommended)
Add a follow-up task to test the entire active Nginx configuration using `nginx -t`:

```yaml
- name: Install Nginx configuration
  ansible.builtin.template:
    src: nginx.conf.j2
    dest: /etc/nginx/sites-available/default
    owner: root
    group: root
    mode: "0644"
  notify: Reload nginx

- name: Test overall Nginx configuration validity
  ansible.builtin.command: nginx -t
  changed_when: false
```

### Pattern B: Reserve `validate: "nginx -t -c %s"` only for the main `/etc/nginx/nginx.conf`
Only use `validate: "nginx -t -c %s"` when templating the complete `/etc/nginx/nginx.conf` file, which includes the required `events {}` and `http {}` blocks. Never use it on partial includes or virtual host files in `conf.d/` or `sites-available/`.
