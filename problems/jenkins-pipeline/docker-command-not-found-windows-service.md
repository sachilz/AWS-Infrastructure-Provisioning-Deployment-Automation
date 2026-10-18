# Jenkins Issue: Docker Command Not Found in Windows Service (`'docker' is not recognized`)

## 1. Issue Overview

| Attribute | Details |
|---|---|
| **Pipeline Stage** | Stage 5: `Hadolint Dockerfile Scan` (and subsequent Docker stages) |
| **Component** | Jenkins Windows Agent / Docker Desktop / Windows Service Environment |
| **Severity** | High (All Docker-based stages blocked) |
| **Symptoms** | Batch step fails immediately reporting `'docker' is not recognized`. |

---

## 2. What Happened (Jenkins Console Log)

During Stage 5 (`Hadolint Dockerfile Scan`):

```text
15:20:15
15:20:15 C:\ProgramData\Jenkins\.jenkins\workspace\aws-devops-docker-cicd>docker run --rm -i hadolint/hadolint 0<Dockerfile
15:20:15 'docker' is not recognized as an internal or external command,
15:20:15 operable program or batch file.
[Pipeline] }
[Pipeline] // stage
Stage "6. Trivy Terraform Scan" skipped due to earlier failure(s)
...
Finished: FAILURE
```

---

## 3. Root Cause Analysis

### Windows Service Accounts vs. User Accounts
On Windows, Jenkins typically runs as a background **Windows Service** under `C:\ProgramData\Jenkins\.jenkins\` using the `Local System` or service account.

```text
Windows Environment Paths:
├── System / Machine PATH (Accessible to Jenkins Service)
│   ├── C:\Windows\system32
│   ├── C:\Program Files\Git\cmd
│   └── C:\DevSecOps\...
└── User PATH (Only accessible in logged-in user session 'sachintha')
    └── C:\Users\sachintha\AppData\Local\Programs\DockerDesktop\resources\bin  <-- Docker is here!
```

1. **Per-User Docker Installation**: Docker Desktop was installed under the current user's profile:
   `C:\Users\sachintha\AppData\Local\Programs\DockerDesktop\resources\bin\docker.exe`
2. **Missing from Machine PATH**: This path is added only to the user's personal environment variable `PATH`.
3. **Jenkins Service Execution**: When the Jenkins Windows Service spawned `cmd.exe` to execute `bat`, it only inherited the **System/Machine PATH**. Since `docker.exe` was not in the Machine PATH, the command shell failed to find it.

---

## 4. Solution / Fix

### Solution 1: Prepend Docker Path in `Jenkinsfile` (Recommended)
Add Docker's binary directory directly to `PATH` inside the pipeline `environment` block in `Jenkinsfile`:

```groovy
    environment {
        // Prepend Docker Desktop directory to PATH for all Windows batch steps
        PATH = "C:\\Users\\sachintha\\AppData\\Local\\Programs\\DockerDesktop\\resources\\bin;${env.PATH}"

        GITLEAKS_PATH = 'C:\\DevSecOps\\gitleaks\\gitleaks.exe'
        SONAR_SCANNER = 'C:\\DevSecOps\\sonar-scanner\\bin\\sonar-scanner.bat'
        TRIVY_PATH    = 'C:\\DevSecOps\\trivy\\trivy.exe'

        IMAGE_NAME     = 'devops-profile-website'
        IMAGE_TAG      = 'latest'
        TEST_CONTAINER = 'jenkins-website-test'
    }
```

### Solution 2: Add to Jenkins Global Properties (Permanent for All Jobs)
1. Open Jenkins Dashboard $\rightarrow$ **Manage Jenkins** $\rightarrow$ **System**.
2. Scroll to **Global properties** $\rightarrow$ Check **Environment variables**.
3. Click **Add**:
   - **Name**: `PATH+DOCKER`
   - **Value**: `C:\Users\sachintha\AppData\Local\Programs\DockerDesktop\resources\bin`
4. Click **Save**.

### Solution 3: Native Binary Alternative for Hadolint
Because `hadolint.exe` is already installed on the Windows host at `C:\DevSecOps\hadolint\hadolint.exe` (which is in the System PATH), you can also run it natively:
```diff
stage('5. Hadolint Dockerfile Scan') {
    steps {
        bat '''
-           docker run --rm -i hadolint/hadolint < Dockerfile
+           hadolint Dockerfile
        '''
    }
}
```
*(Note: Docker is still required for Stage 10 `Build Docker Image` and Stage 12 `Test Website Container`, so Solution 1 or 2 is still necessary).*

---

## 5. Verification
After applying the fix, re-running the build:
- `docker run --rm -i hadolint/hadolint < Dockerfile` executed successfully.
- `docker build` and `docker run` in subsequent stages functioned without error.
