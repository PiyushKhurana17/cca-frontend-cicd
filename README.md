# CCA Frontend CI/CD Lab

A frontend-only React/Vite notes demo for GitHub → Jenkins → Docker → Amazon ECR → Kubernetes/Minikube.
No backend or external database is required. Notes are stored in the browser's localStorage.

## Local development

1. Install Node.js LTS and Docker Desktop.
2. Run `npm install` once to generate `package-lock.json`.
3. Run `npm run dev` to start the local frontend.
4. Run `npm run build` to validate the production build.

## Before using Jenkins

- Commit `package-lock.json` after running `npm install`.
- Confirm Jenkins is running as the same Windows user that can use Docker Desktop, AWS CLI credentials, and Minikube/kubectl.
- Create ECR repository `cca-frontend` in `ap-south-1`.
- Confirm the AWS identity has ECR push/pull permissions.
- Start Minikube and set its kubectl context.
- In Jenkins, create a Pipeline job using “Pipeline script from SCM” and this repository's `Jenkinsfile`.

The Jenkinsfile polls the repository approximately once per minute. Each successful pipeline creates a build-specific image tag in ECR, pushes it, refreshes a Kubernetes ECR pull secret, and deploys it to Minikube.

## Kubernetes browser access

After the Jenkins build completes, run `kubectl port-forward service/cca-frontend-service 8081:80` in a separate terminal and open http://localhost:8081. Keep the terminal open.
