# PowerShell script to run database schema
# Usage: .\run_schema.ps1

Write-Host "Running database schema..." -ForegroundColor Green

# Try to find MySQL in common locations
$mysqlPaths = @(
    "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe",
    "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql",
    "C:\xampp\mysql\bin\mysql.exe",
    "C:\wamp64\bin\mysql\mysql8.0.xx\bin\mysql.exe",
    "mysql.exe"
)

$mysqlCmd = $null
foreach ($path in $mysqlPaths) {
    if (Test-Path $path) {
        $mysqlCmd = $path
        break
    }
}

if (-not $mysqlCmd) {
    # Try to find it in PATH
    $mysqlCmd = Get-Command mysql -ErrorAction SilentlyContinue
    if ($mysqlCmd) {
        $mysqlCmd = $mysqlCmd.Source
    }
}

if (-not $mysqlCmd) {
    Write-Host "MySQL not found. Please provide the path to mysql.exe" -ForegroundColor Red
    Write-Host "Or run the schema manually using MySQL Workbench/phpMyAdmin" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Alternative: Open MySQL Workbench or phpMyAdmin and run the contents of schema.sql" -ForegroundColor Yellow
    exit 1
}

Write-Host "Found MySQL at: $mysqlCmd" -ForegroundColor Green
Write-Host ""

# Read password securely
$password = Read-Host "Enter MySQL root password" -AsSecureString
$passwordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($password)
)

$schemaFile = Join-Path $PSScriptRoot "schema.sql"

if (-not (Test-Path $schemaFile)) {
    Write-Host "Schema file not found at: $schemaFile" -ForegroundColor Red
    exit 1
}

Write-Host "Executing schema..." -ForegroundColor Green

# Run the schema
$env:MYSQL_PWD = $passwordPlain
Get-Content $schemaFile | & $mysqlCmd -u root

if ($LASTEXITCODE -eq 0) {
    Write-Host "Database schema created successfully!" -ForegroundColor Green
} else {
    Write-Host "Error creating database schema. Exit code: $LASTEXITCODE" -ForegroundColor Red
}

$env:MYSQL_PWD = $null

