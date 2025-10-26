# PowerShell script to start the AI Internship Recommender application

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  AI Internship Recommender System" -ForegroundColor Cyan
Write-Host "  with Real-Time Socket.IO Updates" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
Write-Host "Checking Node.js installation..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "Error: Node.js is not installed!" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# Check if node_modules exists
if (-Not (Test-Path "node_modules")) {
    Write-Host ""
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error: Failed to install dependencies!" -ForegroundColor Red
        exit 1
    }
    Write-Host "Dependencies installed successfully!" -ForegroundColor Green
}

# Check if .env file exists
if (-Not (Test-Path ".env")) {
    Write-Host ""
    Write-Host "Creating .env file..." -ForegroundColor Yellow
    node setup.js
    Write-Host ".env file created successfully!" -ForegroundColor Green
}

# Start the server
Write-Host "" 
Write-Host "Starting server with Socket.IO..." -ForegroundColor Yellow
Write-Host "Real-time notifications enabled" -ForegroundColor Green
Write-Host "Database persistence active" -ForegroundColor Green  
Write-Host "Resume attachment enabled" -ForegroundColor Green
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Server will start on port 3000" -ForegroundColor Green
Write-Host "  Access the app at: http://localhost:3000" -ForegroundColor Green
Write-Host "  Socket.IO ready for real-time updates" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

node server.js