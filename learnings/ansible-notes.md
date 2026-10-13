# Configuration Management (Ansible) Notes

## 1. What is Ansible & How Does It Work?
- **Agentless Architecture**: Unlike Chef or Puppet, Ansible doesn't need software installed on the target machine. It connects over standard **SSH**, copies temporary Python modules, executes them, and cleans up.
- **Push Model**: The control node (Ubuntu local machine) pushes configuration to remote servers.

## 2. Key Concept: Idempotency
- **Definition**: An operation is idempotent if executing it multiple times produces the exact same result without unintended side effects.
- **Example**: If Nginx is already installed and running, running the playbook again will say `ok` instead of trying to reinstall or restart it needlessly.

## 3. Inventory & Configuration
- **`inventory/hosts.ini`**: Lists target machines, their IP addresses, connection users (`ubuntu`), and SSH private key locations.
- **`ansible.cfg`**: Configures global defaults like `host_key_checking = False` for dynamic ephemeral cloud instances and default role paths.

## 4. Ansible Roles & Best Practices
Rather than putting 100 tasks into one large playbook, an Ansible **Role** separates concerns:
- `tasks/main.yml`: Step-by-step actions (install packages, enable services).
- `handlers/main.yml`: Event-driven actions (e.g., restart Nginx only when config template changes).
- `templates/`: Jinja2 templates (`.j2`) for dynamic server configs.
- `vars/` or `defaults/`: Reusable role variables.
