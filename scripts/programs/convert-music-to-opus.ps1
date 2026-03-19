param(
    [string]$InputDir = "scripts/music",
    [string]$OutputDir = "scripts/output",
    [int]$BitrateKbps = 128,
    [switch]$DryRun
)

$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$sourcePath = (Resolve-Path (Join-Path $repoRoot $InputDir)).Path
$targetPath = (Join-Path $repoRoot $OutputDir)

if (-not (Test-Path $targetPath)) {
    New-Item -ItemType Directory -Path $targetPath | Out-Null
}

$ffmpeg = Get-Command ffmpeg -ErrorAction SilentlyContinue
if (-not $ffmpeg) {
    throw "ffmpeg is not installed or not on PATH. Install ffmpeg first, then rerun this script."
}

$inputFiles = Get-ChildItem -Path $sourcePath -File -Recurse |
    Where-Object { $_.Extension -in @(".mp3", ".wav") }

if ($inputFiles.Count -eq 0) {
    Write-Host "No .mp3 or .wav files found in $sourcePath"
    exit 0
}

foreach ($file in $inputFiles) {
    $relativePath = [System.IO.Path]::GetRelativePath($sourcePath, $file.FullName)
    $relativeOutput = [System.IO.Path]::ChangeExtension($relativePath, ".opus")
    $outputFile = Join-Path $targetPath $relativeOutput
    $outputDir = Split-Path -Parent $outputFile

    if (-not (Test-Path $outputDir)) {
        New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
    }

    $args = @(
        "-y",
        "-i", $file.FullName,
        "-c:a", "libopus",
        "-b:a", ("{0}k" -f $BitrateKbps),
        $outputFile
    )

    if ($DryRun) {
        Write-Host ("[DRY RUN] ffmpeg {0}" -f ($args -join " "))
    }
    else {
        Write-Host ("Converting: {0} -> {1}" -f $file.FullName, $outputFile)
        & ffmpeg @args | Out-Null
    }
}

Write-Host "Done."
