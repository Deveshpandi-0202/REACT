# deploy.ps1 — Deploy React frontend to GitHub Pages
# Usage: .\deploy.ps1 -RepoName "my-react-app" -BackendUrl "https://your-backend.onrender.com"

param(
    [string]$RepoName = "my-react-app",
    [string]$BackendUrl = ""
)

$ErrorActionPreference = "Stop"
$FrontendDir = "$PSScriptRoot\my-react-app"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  GitHub Pages Deployment Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ── Step 1: Check if git is installed ─────────────────────────────────────
Write-Host "[1/7] Checking prerequisites..." -ForegroundColor Yellow
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: Git is not installed. Install from https://git-scm.com" -ForegroundColor Red
    exit 1
}
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: npm is not installed." -ForegroundColor Red
    exit 1
}
Write-Host "  Git and npm found." -ForegroundColor Green

# ── Step 2: Set VITE_API_URL if backend URL provided ──────────────────────
Write-Host "[2/7] Configuring environment..." -ForegroundColor Yellow
if ($BackendUrl) {
    $envFile = "$FrontendDir\.env.production"
    "VITE_API_URL=$BackendUrl/api" | Out-File -FilePath $envFile -Encoding utf8
    Write-Host "  Set VITE_API_URL=$BackendUrl/api" -ForegroundColor Green
} else {
    Write-Host "  No backend URL provided. Using default (localhost:5000)." -ForegroundColor Yellow
    Write-Host "  To set later: .\deploy.ps1 -BackendUrl 'https://your-app.onrender.com'" -ForegroundColor Gray
}

# ── Step 3: Install dependencies ──────────────────────────────────────────
Write-Host "[3/7] Installing dependencies..." -ForegroundColor Yellow
Push-Location $FrontendDir
npm install
Pop-Location
Write-Host "  Dependencies installed." -ForegroundColor Green

# ── Step 4: Lint check ────────────────────────────────────────────────────
Write-Host "[4/7] Running lint check..." -ForegroundColor Yellow
Push-Location $FrontendDir
npm run lint
if ($LASTEXITCODE -ne 0) {
    Pop-Location
    Write-Host "  Lint failed. Fix errors before deploying." -ForegroundColor Red
    exit 1
}
Pop-Location
Write-Host "  Lint passed." -ForegroundColor Green

# ── Step 5: Build ─────────────────────────────────────────────────────────
Write-Host "[5/7] Building for production..." -ForegroundColor Yellow
Push-Location $FrontendDir
npm run build
if ($LASTEXITCODE -ne 0) {
    Pop-Location
    Write-Host "  Build failed." -ForegroundColor Red
    exit 1
}
Pop-Location
Write-Host "  Build complete. Output in my-react-app\dist\" -ForegroundColor Green

# ── Step 6: Init git repo if needed ───────────────────────────────────────
Write-Host "[6/7] Setting up Git..." -ForegroundColor Yellow
Push-Location $PSScriptRoot

$isGitRepo = Test-Path ".git"
if (-not $isGitRepo) {
    git init
    git checkout -b main
    Write-Host "  Initialized new Git repo." -ForegroundColor Green
}

# ── Step 7: Deploy to gh-pages branch ─────────────────────────────────────
Write-Host "[7/7] Deploying to GitHub Pages..." -ForegroundColor Yellow

# Check if gh-pages branch exists
$branchExists = git branch --list "gh-pages" 2>$null
if ($branchExists) {
    git branch -D gh-pages 2>$null
}

# Create orphan gh-pages branch with only dist contents
git checkout --orphan gh-pages
git add -f my-react-app/dist/*
git commit -m "Deploy to GitHub Pages"
git push origin gh-pages --force 2>$null

# Go back to main
git checkout main
git add -f my-react-app/dist 2>$null
git reset HEAD my-react-app/dist 2>$null

Pop-Location

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Deployment Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Push your code to GitHub:" -ForegroundColor White
Write-Host "     git remote add origin https://github.com/YOUR_USERNAME/$RepoName.git" -ForegroundColor Gray
Write-Host "     git add . && git commit -m 'Initial commit' && git push -u origin main" -ForegroundColor Gray
Write-Host ""
Write-Host "  2. Enable GitHub Pages:" -ForegroundColor White
Write-Host "     Go to repo Settings > Pages > Source: gh-pages branch" -ForegroundColor Gray
Write-Host ""
Write-Host "  3. Your site will be at:" -ForegroundColor White
Write-Host "     https://YOUR_USERNAME.github.io/$RepoName/" -ForegroundColor Gray
Write-Host ""
