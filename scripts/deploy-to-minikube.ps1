param(
    [Parameter(Mandatory = $true)][string]$ImageTag,
    [Parameter(Mandatory = $true)][string]$AccountId,
    [Parameter(Mandatory = $true)][string]$Region,
    [Parameter(Mandatory = $true)][string]$Repository
)

$ErrorActionPreference = 'Stop'
$registry = "$AccountId.dkr.ecr.$Region.amazonaws.com"
$image = "$registry/$Repository`:$ImageTag"
Write-Host "Deploying image: $image"

$token = (& aws ecr get-login-password --region $Region | Out-String).Trim()
if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($token)) {
    throw 'Failed to retrieve ECR password.'
}

$secretArgs = @(
    'create', 'secret', 'docker-registry', 'ecr-registry-secret',
    "--docker-server=$registry", '--docker-username=AWS',
    "--docker-password=$token", '--dry-run=client', '-o', 'yaml'
)
$secretYaml = & kubectl @secretArgs
if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace(($secretYaml -join "`n"))) {
    throw 'Could not create the Kubernetes ECR secret manifest.'
}
$secretYaml | & kubectl apply -f -
if ($LASTEXITCODE -ne 0) { throw 'Could not apply ECR pull secret.' }

$root = Resolve-Path (Join-Path $PSScriptRoot '..')
$deploymentFile = Join-Path $root 'k8s\deployment.yaml'
$serviceFile = Join-Path $root 'k8s\service.yaml'
$renderedFile = Join-Path $root 'deployment.rendered.yaml'
$yaml = Get-Content $deploymentFile -Raw
if (-not $yaml.Contains('__IMAGE__')) { throw 'The Deployment file must contain the __IMAGE__ placeholder.' }
$yaml = $yaml.Replace('__IMAGE__', $image)
Set-Content -Path $renderedFile -Value $yaml -Encoding ascii

& kubectl apply -f $renderedFile
if ($LASTEXITCODE -ne 0) { throw 'Applying the Deployment failed.' }
& kubectl apply -f $serviceFile
if ($LASTEXITCODE -ne 0) { throw 'Applying the Service failed.' }
& kubectl rollout status deployment/cca-frontend --timeout=180s
if ($LASTEXITCODE -ne 0) { throw 'Kubernetes rollout failed.' }
& kubectl get deployments
& kubectl get pods -o wide
& kubectl get services
Write-Host 'Frontend successfully deployed to Minikube.'
