
pipeline {
    agent {
        label 'ec2-builder'
    }

    triggers {
        pollSCM('H/2 * * * *')
    }

    options {
        timestamps()
        disableConcurrentBuilds()
        skipDefaultCheckout(true)
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
                    def account = sh(
                        returnStdout: true,
                        script: 'aws sts get-caller-identity --query Account --output text'
                    ).trim()

                    if (!(account ==~ /[0-9]{12}/)) {
                        error('Could not determine AWS account ID. Check the EC2 IAM role.')
                    }

                    env.AWS_ACCOUNT_ID = account
                    env.ECR_REGISTRY =
                        "${account}.dkr.ecr.${env.AWS_REGION}.amazonaws.com"
                    env.IMAGE_TAG = "build-${env.BUILD_NUMBER}"
                    env.ECR_IMAGE =
                        "${env.ECR_REGISTRY}/${env.ECR_REPOSITORY}:${env.IMAGE_TAG}"
                    env.LATEST_IMAGE =
                        "${env.ECR_REGISTRY}/${env.ECR_REPOSITORY}:latest"

                    echo "Publishing image: ${env.ECR_IMAGE}"
                }
            }
        }

        stage('Docker Build') {
            steps {
                // Dockerfile.ci installs Node dependencies and builds React.
                sh 'docker build -f Dockerfile.ci -t "$ECR_IMAGE" -t "$LATEST_IMAGE" .'
            }
        }

        stage('ECR Login') {
            steps {
                sh '''
                    set -eu
                    aws ecr get-login-password --region "$AWS_REGION" |
                    docker login --username AWS --password-stdin "$ECR_REGISTRY"
                '''
            }
        }

        stage('Push to ECR') {
            steps {
                sh 'docker push "$ECR_IMAGE"'
                sh 'docker push "$LATEST_IMAGE"'
            }
        }

        stage('Deploy to Minikube') {
            agent {
                label 'windows-minikube'
            }

            steps {
                // The deployment script and Kubernetes manifests are needed
                // on the Windows agent, so check out the repository there.
                checkout scm

                bat 'powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%WORKSPACE%\\scripts\\deploy-to-minikube.ps1" -ImageTag "%IMAGE_TAG%" -AccountId "%AWS_ACCOUNT_ID%" -Region "%AWS_REGION%" -Repository "%ECR_REPOSITORY%"'
            }
        }
    }

    post {
        success {
            echo 'CI/CD succeeded: image pushed to ECR and Kubernetes rollout completed.'
        }

        failure {
            echo 'CI/CD failed. Inspect the first failing stage in Console Output.'
        }
    }
}
