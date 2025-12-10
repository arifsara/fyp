# PowerShell script to set up PostgreSQL with pgvector using Docker
# Run this from the backend directory

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "PostgreSQL + pgvector Docker Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is running
Write-Host "Checking Docker..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version
    Write-Host "✅ Docker found: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not installed or not running!" -ForegroundColor Red
    Write-Host "Please install Docker Desktop from: https://www.docker.com/products/docker-desktop/" -ForegroundColor Yellow
    exit 1
}

# Check if Docker daemon is running
try {
    docker ps | Out-Null
    Write-Host "✅ Docker daemon is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker daemon is not running!" -ForegroundColor Red
    Write-Host "Please start Docker Desktop" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Stop and remove existing container if it exists
Write-Host "Checking for existing container..." -ForegroundColor Yellow
$existingContainer = docker ps -a --filter "name=glowsense-postgres" --format "{{.Names}}" 2>$null
if ($existingContainer -eq "glowsense-postgres") {
    Write-Host "⚠️  Found existing container. Stopping and removing..." -ForegroundColor Yellow
    docker stop glowsense-postgres 2>$null
    docker rm glowsense-postgres 2>$null
    Write-Host "✅ Existing container removed" -ForegroundColor Green
}

Write-Host ""

# Check if port 5432 is in use
Write-Host "Checking port 5432..." -ForegroundColor Yellow
$portInUse = netstat -ano | findstr :5432
if ($portInUse -and $portInUse -notmatch "docker") {
    Write-Host "⚠️  Port 5432 is in use!" -ForegroundColor Yellow
    Write-Host "You may need to stop your existing PostgreSQL service." -ForegroundColor Yellow
    $continue = Read-Host "Continue anyway? (y/n)"
    if ($continue -ne "y" -and $continue -ne "Y") {
        Write-Host "Setup cancelled." -ForegroundColor Red
        exit 1
    }
}

Write-Host ""

# Create new container
Write-Host "Creating PostgreSQL container with pgvector..." -ForegroundColor Yellow
Write-Host "This may take a few minutes on first run (downloading image)..." -ForegroundColor Cyan

docker run -d `
  --name glowsense-postgres `
  -e POSTGRES_PASSWORD=18220 `
  -e POSTGRES_DB=glowsense_db `
  -e POSTGRES_USER=postgres `
  -p 5432:5432 `
  --restart unless-stopped `
  pgvector/pgvector:pg16

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to create container!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Container created" -ForegroundColor Green
Write-Host ""

# Wait for PostgreSQL to start
Write-Host "Waiting for PostgreSQL to start..." -ForegroundColor Yellow
$maxAttempts = 30
$attempt = 0
$started = $false

while ($attempt -lt $maxAttempts -and -not $started) {
    Start-Sleep -Seconds 2
    $attempt++
    try {
        $result = docker exec glowsense-postgres pg_isready -U postgres 2>$null
        if ($result -match "accepting connections") {
            $started = $true
            Write-Host "✅ PostgreSQL is ready!" -ForegroundColor Green
        }
    } catch {
        Write-Host "." -NoNewline -ForegroundColor Gray
    }
}

if (-not $started) {
    Write-Host ""
    Write-Host "❌ PostgreSQL failed to start. Check logs:" -ForegroundColor Red
    Write-Host "docker logs glowsense-postgres" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Enable pgvector extension
Write-Host "Enabling pgvector extension..." -ForegroundColor Yellow
docker exec glowsense-postgres psql -U postgres -d glowsense_db -c "CREATE EXTENSION IF NOT EXISTS vector;" 2>&1 | Out-Null

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ pgvector extension enabled" -ForegroundColor Green
} else {
    Write-Host "⚠️  Warning: Could not enable pgvector extension" -ForegroundColor Yellow
    Write-Host "   This might be normal if it's already enabled" -ForegroundColor Gray
}

Write-Host ""

# Verify pgvector
Write-Host "Verifying pgvector installation..." -ForegroundColor Yellow
$vectorTest = docker exec glowsense-postgres psql -U postgres -d glowsense_db -t -c "SELECT vector('[1,2,3]');" 2>&1
if ($vectorTest -match "\[1,2,3\]") {
    Write-Host "✅ pgvector is working correctly!" -ForegroundColor Green
} else {
    Write-Host "⚠️  Could not verify pgvector" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Run: python create_rag_tables.py" -ForegroundColor White
Write-Host "2. Start your backend: uvicorn main:app --reload" -ForegroundColor White
Write-Host ""
Write-Host "Useful commands:" -ForegroundColor Yellow
Write-Host "  View logs: docker logs glowsense-postgres" -ForegroundColor Gray
Write-Host "  Stop: docker stop glowsense-postgres" -ForegroundColor Gray
Write-Host "  Start: docker start glowsense-postgres" -ForegroundColor Gray
Write-Host "  Access DB: docker exec -it glowsense-postgres psql -U postgres -d glowsense_db" -ForegroundColor Gray
Write-Host ""

