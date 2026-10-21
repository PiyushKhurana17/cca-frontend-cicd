pipeline {
    agent any

    triggers {
        pollSCM('H/1 * * * *')
    }

    options {
        timestamps()
        disableConcurrentBuilds()
    }

    environment {
        AWS_REGION = 'ap-south-1'
        ECR_REPOSITORY = 'cca-frontend'
        VITE_API_URL = ''
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Initialize Image Details') {
            steps {
                script {
                    def account = bat(
                        returnStdout: true,
                        script: '@echo off\r\naws sts get-caller-identity --query Account --output text'
                    ).trim()
                    if (!(account ==~ /[0-9]{12}/)) {
                        error('Could not determine a 12-digit AWS account ID. Check AWS CLI credentials.')
                    }
                    env.AWS_ACCOUNT_ID = account
                    env.ECR_REGISTRY = "${account}.dkr.ecr.${env.AWS_REGION}.amazonaws.com"
                    env.IMAGE_TAG = "build-${env.BUILD_NUMBER}"
                    env.ECR_IMAGE = "${env.ECR_REGISTRY}/${env.ECR_REPOSITORY}:${env.IMAGE_TAG}"
                    env.LATEST_IMAGE = "${env.ECR_REGISTRY}/${env.ECR_REPOSITORY}:latest"
                    echo "Publishing ${env.ECR_IMAGE}"
                }
            }
        }

        stage('Install Dependencies') {
            steps {
                bat 'npm ci'
            }
        }

        stage('Build Frontend') {
            steps {
                bat 'npm run build'
            }
        }

        stage('Docker Build') {
            steps {
                bat 'docker build -f Dockerfile.ci --build-arg "VITE_API_URL=%VITE_API_URL%" -t "%ECR_IMAGE%" -t "%LATEST_IMAGE%" .'
            }
        }

        stage('ECR Login') {
            steps {
                bat 'powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%WORKSPACE%\\scripts\\ecr-login.ps1"'
            }
        }

        stage('Push to ECR') {
            steps {
                bat 'docker push "%ECR_IMAGE%"'
                bat 'docker push "%LATEST_IMAGE%"'
            }
        }

        stage('Deploy to Minikube') {
            steps {
                bat 'powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%WORKSPACE%\\scripts\\deploy-to-minikube.ps1" -ImageTag "%IMAGE_TAG%" -AccountId "%AWS_ACCOUNT_ID%" -Region "%AWS_REGION%" -Repository "%ECR_REPOSITORY%"'
            }
        }
    }

    post {
        success {
            echo 'CI/CD succeeded: new image is in ECR and Kubernetes rollout completed.'
        }
        failure {
            echo 'CI/CD failed. Inspect the first failing stage in Console Output.'
        }
    }
}
