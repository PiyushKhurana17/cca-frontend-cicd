$ErrorActionPreference = 'Stop'

if ([string]::IsNullOrWhiteSpace($env:AWS_REGION)) { throw 'AWS_REGION is not set.' }
if ([string]::IsNullOrWhiteSpace($env:ECR_REGISTRY)) { throw 'ECR_REGISTRY is not set.' }

$password = (& aws ecr get-login-password --region $env:AWS_REGION | Out-String).Trim()
if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($password)) {
    throw 'Could not get an ECR authorization password.'
}

$password | & docker login --username AWS --password-stdin $env:ECR_REGISTRY
if ($LASTEXITCODE -ne 0) { throw 'Docker login to ECR failed.' }
Write-Host 'ECR authentication succeeded.'
