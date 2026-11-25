# Script de Sincronizacao Inteligente entre Pasta Local e Nuvem (OneDrive / Google Drive)
# Mantem a pasta de desenvolvimento rapida sem travar com os arquivos do node_modules

param (
    [Parameter(Mandatory=$false)]
    [ValidateSet("ToCloud", "FromCloud")]
    [string]$Direction = "ToCloud",

    [string]$LocalPath = "",
    [string]$CloudPath = "",
    [switch]$Quiet
)

if ([string]::IsNullOrWhiteSpace($LocalPath)) {
    $scriptDir = if ($PSScriptRoot) { $PSScriptRoot } else { Split-Path -Parent $MyInvocation.MyCommand.Path }
    $LocalPath = Split-Path -Parent $scriptDir
}

function Test-PathSafe {
    param([string]$TargetPath)
    if ([string]::IsNullOrWhiteSpace($TargetPath)) { return $false }
    try {
        return (Test-Path -LiteralPath $TargetPath -ErrorAction Stop)
    } catch {
        return $false
    }
}

function Normalize-DirPath {
    param([string]$DirPath)
    try {
        return [System.IO.Path]::GetFullPath($DirPath).TrimEnd('\', '/')
    } catch {
        return $DirPath.TrimEnd('\', '/')
    }
}

function Get-CloudTargets {
    param([string]$NormalizedLocal)

    $candidates = @()

    if (-not [string]::IsNullOrWhiteSpace($CloudPath)) {
        $candidates += $CloudPath
    } else {
        # 1. OneDrive do usuario atual
        $oneDriveRoots = @(
            $env:OneDrive,
            $env:OneDriveConsumer,
            $env:OneDriveCommercial,
            (Join-Path $env:USERPROFILE "OneDrive")
        ) | Where-Object { -not [string]::IsNullOrWhiteSpace($_) }

        foreach ($root in $oneDriveRoots) {
            if (Test-PathSafe $root) {
                $odProject = Join-Path $root "Projetos\Projeto Extensao I"
                $odParent = Join-Path $root "Projetos"
                if ((Test-PathSafe $odProject) -or (Test-PathSafe $odParent) -or ($root -eq $env:OneDrive)) {
                    $candidates += $odProject
                }
            }
        }

        # 2. Google Drive (se disponivel e acessivel neste computador)
        $gDriveOther = "G:\Outros computadores\Meu computador\Projeto Extensao I"
        $gDriveMain = "G:\Meu Drive\Projetos\Projeto Extensao I"
        $gDriveParent = "G:\Meu Drive\Projetos"

        if (Test-PathSafe $gDriveOther) {
            $candidates += $gDriveOther
        }
        if ((Test-PathSafe $gDriveMain) -or (Test-PathSafe $gDriveParent)) {
            $candidates += $gDriveMain
        }
    }

    $uniqueTargets = @()
    $seen = @{}

    foreach ($cand in $candidates) {
        $norm = Normalize-DirPath $cand
        $key = $norm.ToLowerInvariant()
        if ($key -eq $NormalizedLocal.ToLowerInvariant()) { continue }
        if (-not $seen.ContainsKey($key)) {
            $seen[$key] = $true
            $uniqueTargets += $norm
        }
    }

    return $uniqueTargets
}

$NormalizedLocal = Normalize-DirPath $LocalPath
$targets = Get-CloudTargets -NormalizedLocal $NormalizedLocal

if (-not $Quiet) {
    Write-Host "==========================================================" -ForegroundColor Cyan
    Write-Host "  SINCRONIZACAO INTELIGENTE (LOCAL <-> NUVEM)" -ForegroundColor Cyan
    Write-Host "  Local: $NormalizedLocal" -ForegroundColor Gray
    Write-Host "==========================================================" -ForegroundColor Cyan
}

if ($targets.Count -eq 0) {
    Write-Warning "Nenhum destino de nuvem acessivel foi encontrado neste ambiente."
    exit 1
}

$excludeDirs = @("node_modules", ".git", ".tmp.drivedownload", ".tmp.driveupload")
$excludeFiles = @(".keep")
$hasError = $false

if ($Direction -eq "ToCloud") {
    if (-not $Quiet) {
        Write-Host "-> Direcao: LOCAL ==> NUVEM" -ForegroundColor Green
    }

    foreach ($dest in $targets) {
        try {
            if (-not (Test-PathSafe $dest)) {
                New-Item -ItemType Directory -Path $dest -Force | Out-Null
            }

            if (-not $Quiet) {
                Write-Host "   Sincronizando para: $dest" -ForegroundColor Gray
            }

            $robocopyArgs = @(
                $NormalizedLocal,
                $dest,
                "/MIR",
                "/XD"
            ) + $excludeDirs + @(
                "/XF"
            ) + $excludeFiles + @(
                "/R:2",
                "/W:1",
                "/NDL",
                "/NP"
            )

            if ($Quiet) {
                $robocopyArgs += @("/NFL", "/NJH", "/NJS")
            }

            & robocopy @robocopyArgs | Out-Null
            if ($LASTEXITCODE -ge 8) {
                Write-Warning "Falha no robocopy para '$dest' (codigo $LASTEXITCODE)."
                $hasError = $true
            }
        } catch {
            Write-Warning "Erro ao sincronizar para '$dest': $($_.Exception.Message)"
            $hasError = $true
        }
    }
} else {
    $primary = $targets | Where-Object { Test-PathSafe $_ } | Select-Object -First 1
    if (-not $primary) {
        Write-Warning "Nenhuma pasta de nuvem existente encontrada para restauracao."
        exit 1
    }

    if (-not $Quiet) {
        Write-Host "-> Direcao: NUVEM ==> LOCAL" -ForegroundColor Green
        Write-Host "   Puxando de: $primary" -ForegroundColor Gray
    }

    $robocopyArgs = @(
        $primary,
        $NormalizedLocal,
        "/MIR",
        "/XD"
    ) + $excludeDirs + @(
        "/XF"
    ) + $excludeFiles + @(
        "/R:2",
        "/W:1",
        "/NDL",
        "/NP"
    )

    if ($Quiet) {
        $robocopyArgs += @("/NFL", "/NJH", "/NJS")
    }

    & robocopy @robocopyArgs | Out-Null
    if ($LASTEXITCODE -ge 8) {
        Write-Warning "Falha no robocopy ao restaurar de '$primary' (codigo $LASTEXITCODE)."
        $hasError = $true
    }
}

if ($hasError) {
    exit 1
}

if (-not $Quiet) {
    Write-Host "`nSincronizacao concluida com sucesso! (node_modules mantido fora da nuvem)" -ForegroundColor Green
}
exit 0
