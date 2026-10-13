# Linux Administration & Nginx Web Server Notes

## 1. Linux Server Administration (Ubuntu)
- **Package Management (`apt`)**:
  - `sudo apt update`: Updates the local index of available packages from repositories.
  - `sudo apt install -y nginx`: Installs the Nginx package non-interactively.
- **Service Management (`systemd` / `systemctl`)**:
  - `sudo systemctl status nginx`: Checks current service health and PID.
  - `sudo systemctl enable nginx`: Ensures Nginx automatically boots upon server reboot.
  - `sudo systemctl restart nginx` vs. `sudo systemctl reload nginx`:
    - `reload`: Gracefully re-reads configuration files with **zero downtime**.
    - `restart`: Completely stops and starts the process.

## 2. Nginx Web Server Core Architecture
- **Master & Worker Processes**: Nginx runs a lightweight master process that manages worker processes, each handling thousands of concurrent HTTP connections using an asynchronous event loop.
- **Virtual Host Configuration (`/etc/nginx/sites-available/`)**:
  - Defines the server block, listening port (`80`), `server_name`, and root directory (`/var/www/html`).
  - Activated by symlinking into `/etc/nginx/sites-enabled/`.
- **Testing Nginx Config**:
  - `sudo nginx -t`: Always test configuration syntax before reloading to prevent web server outages!
