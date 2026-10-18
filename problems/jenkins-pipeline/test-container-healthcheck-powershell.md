# Jenkins Issue: Test Container Health Check Failure (`Invoke-WebRequest` & `timeout` on Windows Agent)

## 1. Issue Overview

| Attribute | Details |
|---|---|
| **Pipeline Stage** | Stage 12: `Test Website Container` |
| **Component** | Jenkins Windows Batch / PowerShell 5.1 / Docker Health Check |
| **Severity** | High (Pipeline fails during automated container integration test) |
| **Symptoms** | Docker container starts and returns `HTTP 200`, but health check exhausts retries and fails the build. |

---

## 2. What Happened (Error Logs)

### 1. `timeout` command failure in Jenkins batch:
```text
C:\ProgramData\Jenkins\.jenkins\workspace\aws-devops-docker-cicd>timeout /t 3 /nobreak 1>nul 
ERROR: Input redirection is not supported, exiting the process immediately.
```

### 2. PowerShell health check loop timed out even though Nginx returned 200:
Container logs confirmed Nginx received and responded `200 OK` to all requests:
```text
172.17.0.1 - - [18/Oct/2026:11:07:11 +0000] "GET / HTTP/1.1" 200 11107 "-" "Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.26100.9444" "-"
172.17.0.1 - - [18/Oct/2026:11:07:13 +0000] "GET / HTTP/1.1" 200 11107 "-" "Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.26100.9444" "-"
```
Despite this, the stage failed:
```text
=== Container logs for debugging ===
...
jenkins-website-test
Build step 'Execute Windows batch command' marked build as failure
```

---

## 3. Root Cause Analysis

### Problem 1: `Invoke-WebRequest` Fails Due to Missing `-UseBasicParsing`
* In Windows PowerShell 5.1, `Invoke-WebRequest` by default initializes the **Internet Explorer (IE) HTML DOM parser engine** to parse the response body.
* When executed in a headless/automated service environment like Jenkins (especially under `Local System`), Internet Explorer has never completed its first-launch initialization.
* This causes `Invoke-WebRequest` to throw an internal exception even when HTTP status 200 is successfully returned by Nginx.
* The exception was silently swallowed by `catch{}`, causing `$ok` to remain `$false` and eventually triggering `exit 1` after 20 retries.

### Problem 2: `timeout /t 3 /nobreak >nul` Fails on Jenkins
* Jenkins executes Windows batch steps using redirected standard input/output streams.
* The native Windows `timeout` utility does not support input redirection and immediately exits with:
  `ERROR: Input redirection is not supported, exiting the process immediately.`

---

## 4. Solution & Code Changes

### What Changed in `Jenkinsfile` (Stage 12)

```diff
- timeout /t 3 /nobreak >nul
- powershell -NoProfile -Command "$ok=$false; for($i=0;$i -lt 20;$i++){try{$r=Invoke-WebRequest 'http://localhost:18081/' -TimeoutSec 2; if($r.StatusCode -eq 200){$ok=$true;break}}catch{}; Start-Sleep -Seconds 2}; if(-not $ok){exit 1}"
+ powershell -NoProfile -Command "Start-Sleep -Seconds 3; $ok=$false; for($i=0;$i -lt 20;$i++){try{$r=Invoke-WebRequest 'http://localhost:18081/' -UseBasicParsing -TimeoutSec 2; if($r.StatusCode -eq 200){$ok=$true;break}}catch{}; Start-Sleep -Seconds 2}; if(-not $ok){exit 1}"
```

### Key Fixes:
1. **`-UseBasicParsing`**:
   Skips the Internet Explorer DOM engine entirely and parses the HTTP response as raw stream/text. This prevents IE initialization exceptions and allows `$r.StatusCode -eq 200` to be evaluated cleanly.
2. **`Start-Sleep -Seconds 3`**:
   Moved the initial startup grace period inside PowerShell instead of using `timeout.exe`, avoiding Jenkins input redirection errors.

---

## 5. Verification

After applying the fix:
1. The container started successfully on port `18081`.
2. `Invoke-WebRequest` with `-UseBasicParsing` received `HTTP 200` on the first check.
3. `$ok` evaluated to `$true`, breaking the loop immediately.
4. Console output: `Website container test passed.`
5. Build successfully proceeded to Stage 13 (`Terraform Plan`).
