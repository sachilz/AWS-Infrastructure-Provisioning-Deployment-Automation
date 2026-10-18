
pipeline {
    agent any

    options {
        timestamps()
        disableConcurrentBuilds()
    }

    environment {
        GITLEAKS_PATH = 'C:\\DevSecOps\\gitleaks\\gitleaks.exe'
        SONAR_SCANNER = 'C:\\DevSecOps\\sonar-scanner\\bin\\sonar-scanner.bat'
        TRIVY_PATH = 'C:\\DevSecOps\\trivy\\trivy.exe'

        IMAGE_NAME = 'devops-profile-website'
        IMAGE_TAG = 'latest'
        TEST_CONTAINER = 'jenkins-website-test'
    }

    stages {

        stage('1. Checkout') {
            steps {
                git branch: 'main',
                    url: 'https://github.com/sachilz/AWS-Infrastructure-Provisioning-Deployment-Automation.git'
            }
        }

        stage('2. Check Required Files') {
            steps {
                bat '''
                    if not exist Dockerfile exit /b 1
                    if not exist compose.yaml exit /b 1
                    if not exist website\\index.html exit /b 1
                    if not exist terraform exit /b 1
                    if not exist ansible exit /b 1

                    echo Required project files found.
                '''
            }
        }

        stage('3. Gitleaks Secret Scan') {
            steps {
                bat '''
                    "%GITLEAKS_PATH%" detect --source . --verbose
                '''
            }
        }

        stage('4. SonarQube Code Analysis') {
            steps {
                withSonarQubeEnv('sonarqube') {
                    withCredentials([
                        string(
                            credentialsId: 'jenkins-devops-token',
                            variable: 'SONAR_TOKEN'
                        )
                    ]) {
                        bat '''
                            "%SONAR_SCANNER%" ^
                            -Dsonar.projectKey=aws-devops-automation ^
                            -Dsonar.projectName="AWS Infrastructure Automation" ^
                            -Dsonar.sources=terraform,ansible,website ^
                            -Dsonar.host.url=%SONAR_HOST_URL% ^
                            -Dsonar.token=%SONAR_TOKEN%
                        '''
                    }
                }
            }
        }

        stage('5. Hadolint Dockerfile Scan') {
            steps {
                bat '''
                    docker run --rm -i hadolint/hadolint < Dockerfile
                '''
            }
        }

        stage('6. Trivy Terraform Scan') {
            steps {
                bat '''
                    "%TRIVY_PATH%" config terraform
                '''
            }
        }

        stage('7. Terraform Validation') {
            steps {
                bat '''
                    terraform -chdir=terraform fmt -check -recursive
                    if errorlevel 1 exit /b 1

                    terraform -chdir=terraform init -backend=false
                    if errorlevel 1 exit /b 1

                    terraform -chdir=terraform validate
                '''
            }
        }

        stage('8. Ansible Syntax Check') {
            steps {
                bat '''
                    docker run --rm ^
                      -v "%WORKSPACE%/ansible:/ansible" ^
                      -w /ansible ^
                      cytopia/ansible:latest ^
                      ansible-playbook -i inventory/hosts.ini playbooks/site.yml --syntax-check
                '''
            }
        }

        stage('9. Trivy Base Image Scan') {
            steps {
                bat '''
                    "%TRIVY_PATH%" image ^
                    --severity HIGH,CRITICAL ^
                    nginx:alpine
                '''
            }
        }

        stage('10. Build Docker Image') {
            steps {
                bat '''
                    docker build -t %IMAGE_NAME%:%IMAGE_TAG% .
                '''
            }
        }

        stage('11. Trivy Final Image Scan') {
            steps {
                bat '''
                    "%TRIVY_PATH%" image ^
                    --severity HIGH,CRITICAL ^
                    %IMAGE_NAME%:%IMAGE_TAG%
                '''
            }
        }

        stage('12. Test Website Container') {
            steps {
                bat '''
                    docker rm -f %TEST_CONTAINER% 2>nul

                    docker run -d ^
                    --name %TEST_CONTAINER% ^
                    -p 127.0.0.1:18081:80 ^
                    %IMAGE_NAME%:%IMAGE_TAG%

                    if errorlevel 1 exit /b 1

                    powershell -NoProfile -Command "$ok=$false; for($i=0;$i -lt 20;$i++){try{$r=Invoke-WebRequest 'http://127.0.0.1:18081/' -TimeoutSec 2; if($r.StatusCode -eq 200){$ok=$true;break}}catch{}; Start-Sleep -Seconds 2}; if(-not $ok){exit 1}"

                    if errorlevel 1 (
                        docker rm -f %TEST_CONTAINER% 2>nul
                        exit /b 1
                    )

                    docker rm -f %TEST_CONTAINER% 2>nul
                    echo Website container test passed.
                '''
            }
        }

        stage('13. Terraform Plan') {
            steps {
                bat '''
                    terraform -chdir=terraform init
                    if errorlevel 1 exit /b 1

                    terraform -chdir=terraform plan -input=false
                '''
            }
        }

        stage('14. Deploy to EC2') {
            steps {
                echo 'Deployment is not enabled yet.'
                echo 'Configure a Linux Ansible execution agent before enabling deployment.'
            }
        }
    }

    post {
        success {
            echo 'DevSecOps CI pipeline completed successfully.'
        }

        failure {
            echo 'Pipeline failed. Review the stage console output.'
        }

        always {
            echo 'Pipeline execution finished.'
        }
    }
}
