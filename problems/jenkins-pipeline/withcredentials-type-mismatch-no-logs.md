# Jenkins Issue: `withCredentials` Fails Silently with No Logs (Wrong Credential Kind)

## 1. Issue Overview

| Attribute | Details |
|---|---|
| **Pipeline Stage** | Stage 13: `Terraform Plan` |
| **Component** | Jenkins Credentials Binding / `withCredentials` Groovy step |
| **Severity** | High (Stage fails instantly with zero diagnostic output) |
| **Symptoms** | Stage fails in under 200ms. No console logs are printed. No error message is shown in the stage output. |

---

## 2. What Happened

Stage 13 was consistently failing in ~60–100ms with **absolutely no console output**:

```
Stage Logs (13. Terraform Plan)
Failed with the following error(s)
See stage logs for more detail.   ← clicking this showed nothing
```

No `bat` commands ran. No Terraform output. Nothing.

---

## 3. Root Cause Analysis

### The Credential Type Mismatch

The `Jenkinsfile` used a `string()` credential binder inside `withCredentials`:

```groovy
withCredentials([
    string(credentialsId: 'AWS_ACCESS_KEY_ID',    variable: 'AWS_ACCESS_KEY_ID'),
    string(credentialsId: 'AWS_SECRET_ACCESS_KEY', variable: 'AWS_SECRET_ACCESS_KEY')
]) {
    bat ''' ... '''
}
```

The `string()` binder **only works with credentials of Kind = `Secret text`**.

However, the credentials `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` were added to Jenkins with the **wrong Kind** (not "Secret text"). When Jenkins attempted to bind the credential, it threw a type mismatch exception **before** any commands inside the block could run.

### Execution Flow (What Actually Happened)

```
Step 1: withCredentials block starts
Step 2: Jenkins looks up 'AWS_ACCESS_KEY_ID' in credential store  ✅ Found
Step 3: Jenkins tries to bind it using string() binder             ❌ TYPE MISMATCH
Step 4: Jenkins throws exception immediately
Step 5: bat { ... } block is NEVER reached
Step 6: Stage marked as FAILED (~60ms) with zero log output
```

### Credential Binder Compatibility Table

| Groovy Binder | Required Jenkins Credential Kind |
|---|---|
| `string(...)` | **Secret text** |
| `usernamePassword(...)` | Username with password |
| `sshUserPrivateKey(...)` | SSH Username with private key |
| `file(...)` | Secret file |

---

## 4. How It Was Diagnosed

A diagnostic was applied by removing `withCredentials` entirely and replacing the `bat` block with simple echo commands:

```groovy
stage('13. Terraform Plan') {
    steps {
        bat '''
            echo === Stage 13 started ===
            echo Credential binding test complete
        '''
    }
}
```

**Result:** Stage 13 produced logs and passed immediately.

This confirmed the `bat` block itself was fine — the failure was entirely inside the `withCredentials` binding step before any command ran.

---

## 5. Solution / Fix

### Delete and Re-add Credentials with the Correct Kind

1. Go to **Jenkins → Manage Jenkins → Credentials → System → Global credentials**
2. **Delete** both `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`
3. **Re-add** both using:

| Field | Credential 1 | Credential 2 |
|---|---|---|
| **Kind** | `Secret text` ✅ | `Secret text` ✅ |
| **Scope** | Global | Global |
| **Secret** | `AKIA...` (IAM access key) | IAM secret key value |
| **ID** | `AWS_ACCESS_KEY_ID` | `AWS_SECRET_ACCESS_KEY` |
| **Description** | anything | anything |

> ⚠️ The **Kind** field is the critical one. It must be **`Secret text`** for `string()` binders to work. The Description field is irrelevant.

---

## 6. Key Debugging Rule Learned

> **If a Jenkins stage fails instantly (under 200ms) with zero console output, the failure is always in the Groovy/pipeline step setup — not in the shell commands.**

When `bat` or `sh` actually runs, it always produces at least one line of output. Zero output means the shell was never reached. Look at the pipeline step wrappers (`withCredentials`, `withSonarQubeEnv`, `withEnv`, etc.) for the root cause.

---

## 7. Verification

After re-adding credentials with **Kind = Secret text**:
1. `withCredentials` successfully bound both variables.
2. `bat` commands ran and produced console output.
3. Stage 13 proceeded to execute `terraform plan`.
