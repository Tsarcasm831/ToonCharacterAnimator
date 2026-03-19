param(
    [string]$InputDir = "scripts/output",
    [string]$SinglesDir = "public/assets/musicshrunk/singles",
    [string]$MusicTsxPath = "components/ui/audio/Music.tsx",
    [string]$GeneratedDataPath = "components/ui/audio/autoSingles.generated.ts",
    [string]$Artist = "Lord Tsarcasm",
    [switch]$DryRun
)

$ErrorActionPreference = "Stop"

function Get-NextBackupPath {
    param([string]$Path)

    $candidate = "$Path.bak"
    if (-not (Test-Path $candidate)) {
        return $candidate
    }

    $index = 2
    while (Test-Path "$Path.bak$index") {
        $index++
    }
    return "$Path.bak$index"
}

function ConvertTo-Slug {
    param([string]$Value)

    $slug = [System.Text.RegularExpressions.Regex]::Replace($Value.ToLowerInvariant(), "[^a-z0-9]+", "-").Trim("-")
    if ([string]::IsNullOrWhiteSpace($slug)) {
        return "track-" + [Math]::Abs($Value.GetHashCode())
    }
    return $slug
}

function Escape-TsString {
    param([string]$Value)
    return $Value.Replace('\', '\\').Replace("'", "\'")
}

function Get-TrackDuration {
    param([string]$FilePath)

    $ffprobe = Get-Command ffprobe -ErrorAction SilentlyContinue
    if (-not $ffprobe) {
        return "0:00"
    }

    try {
        $secondsRaw = & ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 $FilePath
        $seconds = [double]::Parse(($secondsRaw | Select-Object -First 1), [System.Globalization.CultureInfo]::InvariantCulture)
        if ($seconds -lt 0) {
            return "0:00"
        }
        $ts = [TimeSpan]::FromSeconds([Math]::Round($seconds))
        if ($ts.Hours -gt 0) {
            return "{0}:{1:00}:{2:00}" -f $ts.Hours, $ts.Minutes, $ts.Seconds
        }
        return "{0}:{1:00}" -f $ts.Minutes, $ts.Seconds
    }
    catch {
        return "0:00"
    }
}

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$sourcePath = Join-Path $repoRoot $InputDir
$targetPath = Join-Path $repoRoot $SinglesDir
$musicTsxFullPath = Join-Path $repoRoot $MusicTsxPath
$generatedDataFullPath = Join-Path $repoRoot $GeneratedDataPath

if (-not (Test-Path $sourcePath)) {
    throw "Input folder not found: $sourcePath"
}
if (-not (Test-Path $musicTsxFullPath)) {
    throw "Music.tsx not found: $musicTsxFullPath"
}

if (-not (Test-Path $targetPath)) {
    if ($DryRun) {
        Write-Host "[DRY RUN] Would create folder: $targetPath"
    }
    else {
        New-Item -ItemType Directory -Path $targetPath -Force | Out-Null
    }
}

$sourceOpusFiles = Get-ChildItem -Path $sourcePath -Recurse -File -Filter *.opus | Sort-Object Name
if ($sourceOpusFiles.Count -eq 0) {
    Write-Host "No .opus files found in $sourcePath"
    exit 0
}

$copiedSingles = @()
foreach ($sourceFile in $sourceOpusFiles) {
    $destinationFile = Join-Path $targetPath $sourceFile.Name
    $copiedSingles += [PSCustomObject]@{
        Name = $sourceFile.Name
        FilePath = if ($DryRun) { $sourceFile.FullName } else { $destinationFile }
        Url = "/assets/musicshrunk/singles/$($sourceFile.Name)"
    }

    if ($DryRun) {
        Write-Host "[DRY RUN] Copy: $($sourceFile.FullName) -> $destinationFile"
    }
    else {
        Copy-Item -Path $sourceFile.FullName -Destination $destinationFile -Force
        Write-Host "Copied: $($sourceFile.Name)"
    }
}

$musicTsxContent = Get-Content -Path $musicTsxFullPath -Raw
if ($musicTsxContent -notmatch "AUTO_GENERATED_SINGLE_ALBUMS" -or $musicTsxContent -notmatch "AUTO_GENERATED_FEATURED_TRACKS") {
    throw "Music.tsx is missing generated singles integration. Expected AUTO_GENERATED_SINGLE_ALBUMS and AUTO_GENERATED_FEATURED_TRACKS."
}

$manualSinglesUrls = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::OrdinalIgnoreCase)
[System.Text.RegularExpressions.Regex]::Matches($musicTsxContent, "/assets/musicshrunk/singles/[^\x27\x22]+\.opus") | ForEach-Object {
    [void]$manualSinglesUrls.Add($_.Value)
}

$candidates = foreach ($item in $copiedSingles) {
    if (-not $manualSinglesUrls.Contains($item.Url)) {
        [PSCustomObject]@{
            Name = $item.Name
            FilePath = $item.FilePath
            Url = $item.Url
        }
    }
}

$coverPalettes = @(
    "bg-gradient-to-br from-violet-900 via-fuchsia-900 to-slate-950",
    "bg-gradient-to-br from-cyan-900 via-slate-800 to-indigo-950",
    "bg-gradient-to-br from-amber-700 via-orange-700 to-red-900",
    "bg-gradient-to-br from-lime-900 via-emerald-900 to-slate-950",
    "bg-gradient-to-br from-slate-800 via-rose-900 to-black",
    "bg-gradient-to-br from-blue-800 via-indigo-900 to-slate-950"
)

$featuredAccents = @(
    "from-violet-500 via-fuchsia-600 to-slate-900",
    "from-cyan-500 via-slate-600 to-indigo-800",
    "from-amber-500 via-orange-600 to-red-800",
    "from-lime-500 via-emerald-600 to-slate-900",
    "from-rose-500 via-red-700 to-slate-900",
    "from-blue-500 via-indigo-600 to-slate-900"
)

$generatedEntries = @()
for ($i = 0; $i -lt $candidates.Count; $i++) {
    $item = $candidates[$i]
    $baseName = [System.IO.Path]::GetFileNameWithoutExtension($item.Name)
    $slug = ConvertTo-Slug $baseName
    $albumId = "$slug-single"
    $trackId = $slug

    $compactSlug = $slug -replace "-", ""
    $coverImage = $null
    foreach ($ext in @("png", "jpg", "jpeg", "webp")) {
        $candidateCover = "/assets/images/singles/$compactSlug.$ext"
        $candidateCoverPath = Join-Path $repoRoot ("public/assets/images/singles/$compactSlug.$ext")
        if (Test-Path $candidateCoverPath) {
            $coverImage = $candidateCover
            break
        }
    }

    $generatedEntries += [PSCustomObject]@{
        AlbumId = $albumId
        AlbumTitle = "$baseName (Single)"
        TrackId = $trackId
        TrackTitle = $baseName
        Duration = Get-TrackDuration $item.FilePath
        FileUrl = $item.Url
        CoverColor = $coverPalettes[$i % $coverPalettes.Count]
        CoverImage = $coverImage
        AccentColor = $featuredAccents[$i % $featuredAccents.Count]
        Tagline = "New single release"
    }
}

$year = (Get-Date).Year.ToString()
$albumBlocks = foreach ($entry in $generatedEntries) {
    $coverImageLine = if ($entry.CoverImage) { "        coverImage: '$(Escape-TsString $entry.CoverImage)'," } else { "" }
@"
    {
        id: '$(Escape-TsString $entry.AlbumId)',
        title: '$(Escape-TsString $entry.AlbumTitle)',
        artist: '$(Escape-TsString $Artist)',
        year: '$year',
        genre: 'Single',
        coverColor: '$(Escape-TsString $entry.CoverColor)',
$coverImageLine
        tracks: [
            {
                id: '$(Escape-TsString $entry.TrackId)',
                title: '$(Escape-TsString $entry.TrackTitle)',
                artist: '$(Escape-TsString $Artist)',
                duration: '$(Escape-TsString $entry.Duration)',
                fileUrl: '$(Escape-TsString $entry.FileUrl)'
            }
        ]
    }
"@
}

$featuredBlocks = foreach ($entry in $generatedEntries) {
    $coverImageLine = if ($entry.CoverImage) { "        coverImage: '$(Escape-TsString $entry.CoverImage)'," } else { "" }
@"
    {
        trackId: '$(Escape-TsString $entry.TrackId)',
        albumId: '$(Escape-TsString $entry.AlbumId)',
$coverImageLine
        accentColor: '$(Escape-TsString $entry.AccentColor)',
        tagline: '$(Escape-TsString $entry.Tagline)',
    }
"@
}

$albumsText = if ($albumBlocks.Count -gt 0) { $albumBlocks -join ",`r`n" } else { "" }
$featuredText = if ($featuredBlocks.Count -gt 0) { $featuredBlocks -join ",`r`n" } else { "" }

$generatedFileContent = @"
export interface GeneratedTrack {
    id: string;
    title: string;
    artist: string;
    duration: string;
    fileUrl: string;
}

export interface GeneratedAlbum {
    id: string;
    title: string;
    artist: string;
    year: string;
    genre: string;
    coverColor: string;
    coverImage?: string;
    spotifyUrl?: string;
    tracks: GeneratedTrack[];
}

export interface GeneratedFeaturedTrack {
    trackId: string;
    albumId: string;
    coverImage?: string;
    spotifyUrl?: string;
    accentColor: string;
    tagline: string;
}

export const AUTO_GENERATED_SINGLE_ALBUMS: GeneratedAlbum[] = [
$albumsText
];

export const AUTO_GENERATED_FEATURED_TRACKS: GeneratedFeaturedTrack[] = [
$featuredText
];
"@

if ($DryRun) {
    Write-Host "[DRY RUN] Would write generated metadata to $generatedDataFullPath"
    Write-Host "[DRY RUN] Generated album entries: $($generatedEntries.Count)"
}
else {
    $generatedDir = Split-Path -Parent $generatedDataFullPath
    if (-not (Test-Path $generatedDir)) {
        New-Item -ItemType Directory -Path $generatedDir -Force | Out-Null
    }

    if (Test-Path $generatedDataFullPath) {
        $backupPath = Get-NextBackupPath -Path $generatedDataFullPath
        Copy-Item -Path $generatedDataFullPath -Destination $backupPath
        Write-Host "Backed up generated data file: $backupPath"
    }

    Set-Content -Path $generatedDataFullPath -Value $generatedFileContent -Encoding utf8
    Write-Host "Updated generated metadata: $generatedDataFullPath"
    Write-Host "Generated album entries: $($generatedEntries.Count)"
}
