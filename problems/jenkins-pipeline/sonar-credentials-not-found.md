# Jenkins Issue: Missing SonarQube Credentials (`Could not find credentials entry with ID`)

## 1. Issue Overview

| Attribute | Details |
|---|---|
| **Pipeline Stage** | Stage 4: `SonarQube Code Analysis` |
| **Component** | Jenkins / SonarQube Scanner Plugin / Credentials Store |
| **Severity** | High (Build Aborted Immediately) |
| **Symptoms** | Pipeline fails at the start of stage 4 before executing the scanner. |

---

## 2. What Happened (Jenkins Console Log)

During pipeline execution, Jenkins successfully performed checkout and file verification, but halted at Stage 4:

```text
[Pipeline] stage
[Pipeline] { (4. SonarQube Code Analysis)
[Pipeline] withSonarQubeEnv
15:01:35  Injecting SonarQube environment variables using the configuration: sonarqube
[Pipeline] {
[Pipeline] withCredentials
[Pipeline] // withCredentials
[Pipeline] }
15:01:35  WARN: Unable to locate 'report-task.txt' in the workspace. Did the SonarScanner succeed?
[Pipeline] // withSonarQubeEnv
[Pipeline] }
...
ERROR: Could not find credentials entry with ID 'sonar-token'
Finished: FAILURE
```

---

## 3. Root Cause Analysis

### How `withCredentials` Works in Declarative Pipelines
In `Jenkinsfile`:
```groovy
withCredentials([
    string(
        credentialsId: 'sonar-token',
        variable: 'SONAR_TOKEN'
    )
])
```

1. The `withCredentials` step instructs Jenkins to query its internal encrypted credential storage for an entry whose ID matches `'sonar-token'`.
2. Because no credential with that identifier existed in Jenkins, the runtime environment threw `ERROR: Could not find credentials entry with ID 'sonar-token'`.
3. Jenkins immediately aborted the pipeline without executing the nested `bat` script.

---

## 4. Solution / Fix

### Option A: Create the Missing Credential in Jenkins (Recommended)
1. **Generate SonarQube Token**:
   - Open SonarQube (`http://localhost:9000`).
   - Go to: **My Account** $\rightarrow$ **Security** $\rightarrow$ **Generate Token**.
   - Select **User Token** and copy the generated hash.
2. **Add to Jenkins**:
   - Open Jenkins Dashboard $\rightarrow$ **Manage Jenkins** $\rightarrow$ **Credentials** $\rightarrow$ **System** $\rightarrow$ **Global credentials (unrestricted)**.
   - Click **Add Credentials**.
   - Configure:
     - **Kind**: `Secret text`
     - **Secret**: `<Paste your SonarQube token>`
     - **ID**: `sonar-token` *(Must match the `credentialsId` specified in Jenkinsfile)*
     - **Description**: `SonarQube API Token`
   - Click **Create**.

### Option B: Synchronize `credentialsId` in `Jenkinsfile`
If you already created a credential with a different ID (e.g. `jenkins-devops-token`), update `Jenkinsfile` to match that ID:
```diff
withCredentials([
    string(
-       credentialsId: 'sonar-token',
+       credentialsId: 'jenkins-devops-token',
        variable: 'SONAR_TOKEN'
    )
])
```

---

## 5. Verification
After creating or synchronizing the credential, re-running the build:
- Successfully injected the token into environment variable `SONAR_TOKEN`.
- Completed code analysis on `terraform`, `ansible`, and `website`.
- Passed execution to Stage 5.
