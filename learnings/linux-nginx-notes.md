# Linux Administration & Nginx Web Server Notes

This document covers Linux system administration, `systemd` service management, Nginx web server architecture, and HTTP response inspection.

---

## 1. Systemd Service Management (`systemctl`)

In modern Linux distributions (such as Ubuntu 24.04 LTS), **systemd** is the system and service manager (PID 1).

### Essential Commands
```bash
# Check service status with full log details without opening a pager
sudo systemctl status nginx --no-pager

# Start, stop, or restart the service
sudo systemctl start nginx
sudo systemctl stop nginx
sudo systemctl restart nginx

# Graceful reload (re-reads configuration without dropping active connections)
sudo systemctl reload nginx

# Enable or disable automatic startup on system boot
sudo systemctl enable nginx
sudo systemctl disable nginx
```

### Analyzing `systemctl status nginx` Output
When inspecting the running service:
- **`Loaded: loaded (...; enabled)`**: Confirms the systemd unit file is present and configured to launch automatically upon boot.
- **`Active: active (running)`**: Shows the daemon is alive, with uptime duration.
- **`ExecReload: ... status=0/SUCCESS`**: Shows that the reload signal triggered by Ansible (`Reload nginx`) succeeded.
- **`Memory` and `CPU`**: Live resource utilization metrics of the Nginx service.

---

## 2. Nginx Architecture: Master & Worker Processes

Nginx employs an **asynchronous, event-driven, non-blocking** architecture rather than spawning a new thread or process per connection.

```text
systemd (PID 1)
  └── nginx master process (PID 2167) [Runs as root to bind to port 80]
        ├── nginx worker process (PID 3172) [Runs as www-data to serve requests]
        └── nginx worker process (PID 3173) [Runs as www-data to serve requests]
```

1. **Master Process**:
   - Performs privileged operations (e.g., binding to privileged port `80`).
   - Reads and evaluates configuration files.
   - Creates, binds, and manages worker processes.
2. **Worker Processes**:
   - Run under unprivileged user permissions (`www-data`).
   - Efficiently process thousands of concurrent client requests via epoll/kqueue event loops.

---

## 3. HTTP Header Inspection with `curl -I`

The `curl -I` (or `curl --head`) command issues an HTTP **HEAD** request, asking the server to return only headers without downloading the response body.

### Example Inspection
```bash
curl -I http://localhost
```

### Response Header Breakdown
```text
HTTP/1.1 200 OK
Server: nginx/1.24.0 (Ubuntu)
Date: Sat, 17 Oct 2026 18:13:52 GMT
Content-Type: text/html
Content-Length: 10880
Last-Modified: Sat, 17 Oct 2026 16:30:09 GMT
Connection: keep-alive
ETag: "6ad3a291-2a80"
Accept-Ranges: bytes
```

| Header | Meaning & Importance |
|---|---|
| `HTTP/1.1 200 OK` | The request succeeded and the requested resource (`index.html`) was found. |
| `Server: nginx/1.24.0 (Ubuntu)` | Identifies the web server software and operating system. |
| `Content-Type: text/html` | MIME type telling the client/browser how to render the content. |
| `Content-Length: 10880` | Exact size in bytes of the payload (matches the file size of `website/index.html`). |
| `Last-Modified` | Timestamp when the static file was placed on disk. |
| `ETag` | Unique identifier (hash/checksum) used by browsers and CDNs for cache validation. |

---

## 4. Testing Endpoints Locally vs. Remotely

| Command | Location | What it Tests |
|---|---|---|
| `curl -I http://localhost` | On EC2 Instance | Verifies Nginx is listening and responding locally. |
| `curl -I http://<PUBLIC_IP>` | On Local Workstation / WSL | Verifies AWS Security Group (port 80 Ingress) and Internet Gateway routing. |
| Browser: `http://<PUBLIC_IP>` | Web Browser | Verifies complete website UI, CSS styling, and asset rendering. |
