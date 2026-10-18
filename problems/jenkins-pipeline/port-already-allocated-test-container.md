# Jenkins Issue: Port Collision in Test Container (`Bind for 0.0.0.0:8081 failed: port is already allocated`)

## 1. Issue Overview

| Attribute | Details |
|---|---|
| **Pipeline Stage** | Stage 12: `Test Website Container` |
| **Component** | Jenkins / Docker Engine / Host Port Binding |
| **Severity** | High (Integration testing phase aborted) |
| **Symptoms** | Docker daemon refuses to start the test container due to host port `8081` conflict. |

---

## 2. What Happened (Jenkins Console Log)

During Stage 12 (`Test Website Container`):

```text
16:11:21
16:11:21 C:\ProgramData\Jenkins\.jenkins\workspace\aws-devops-docker-cicd>docker rm -f jenkins-website-test 2>nul
16:11:21
16:11:21 C:\ProgramData\Jenkins\.jenkins\workspace\aws-devops-docker-cicd>docker run -d --name jenkins-website-test -p 127.0.0.1:8081:80 devops-profile-website:latest
16:11:21 62958290c1c874f1ff6d79626c1a1949f812bf7820f83e98a65fc0d5ac9cf842
16:11:21 docker: Error response from daemon: failed to set up container networking: driver failed programming external connectivity on endpoint jenkins-website-test (7c47434ee137678785d20928e0adf95fa53cd40c311049adc8ea0831ea6e3c04): Bind for 0.0.0.0:8081 failed: port is already allocated
16:11:21
16:11:21 C:\ProgramData\Jenkins\.jenkins\workspace\aws-devops-docker-cicd>if errorlevel 1 exit /b 1
```

---

## 3. Root Cause Analysis

### Port Collision
1. Earlier in local development, the static website was started via Docker Compose:
   ```yaml
   # compose.yaml
   ports:
     - "8081:80"
   ```
   This container (`devops-profile-web`) was actively running on the host machine, listening on TCP port `8081`.
2. When Jenkins executed Stage 12, it attempted to bind another container (`jenkins-website-test`) to the exact same host port (`-p 127.0.0.1:8081:80`).
3. Since only one socket listener can bind to a given TCP port on the host network stack, Docker aborted with `Bind for 0.0.0.0:8081 failed: port is already allocated`.

### Port Mismatch in the Stage Script
Additionally, line 150 and line 155 of `Jenkinsfile` had a port discrepancy:
- Line 150 bound to port **`8081`**: `-p 127.0.0.1:8081:80`
- Line 155 queried port **`18081`**: `Invoke-WebRequest 'http://127.0.0.1:18081/'`

Even if port 8081 had been free, the healthcheck would have failed by querying the wrong port!

---

## 4. Solution / Fix

### Use a Dedicated, Non-Conflicting CI/CD Test Port (`18081`)
In `Jenkinsfile`, update the port binding in Stage 12 to **`18081`**:

```diff
stage('12. Test Website Container') {
    steps {
        bat '''
            docker rm -f %TEST_CONTAINER% 2>nul

            docker run -d ^
            --name %TEST_CONTAINER% ^
-           -p 127.0.0.1:8081:80 ^
+           -p 127.0.0.1:18081:80 ^
            %IMAGE_NAME%:%IMAGE_TAG%

            if errorlevel 1 exit /b 1

            powershell -NoProfile -Command "$ok=$false; for($i=0;$i -lt 15;$i++){try{$r=Invoke-WebRequest 'http://127.0.0.1:18081/' -TimeoutSec 2; if($r.StatusCode -eq 200){$ok=$true;break}}catch{}; Start-Sleep -Seconds 2}; if(-not $ok){exit 1}"
            ...
        '''
    }
}
```

### Benefits of High Ephemeral Test Ports (e.g. `18081`):
- **Isolation**: Prevents pipeline builds from clashing with local developer environments running on standard development ports (`80`, `8080`, `8081`).
- **Parallel Safety**: Allows developers to keep their local Compose stack running while Jenkins executes automated builds in the background.

---

## 5. Verification
After updating the port to `18081`:
1. `docker run` successfully bound to `127.0.0.1:18081:80`.
2. The PowerShell health check queried `http://127.0.0.1:18081/`, received `200 OK`, and confirmed:
   `Website container test passed.`
3. The test container was cleaned up automatically (`docker rm -f %TEST_CONTAINER%`).
