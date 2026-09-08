param(
  [string[]]$Names = @()
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$sourceRoot = Join-Path $root 'assets\icons'
$outputRoot = Join-Path $root 'src\common\icons'

if (-not $Names -or $Names.Count -eq 0) {
  $Names = Get-ChildItem -LiteralPath $sourceRoot -Filter '*.svg' -File |
    Sort-Object Name |
    ForEach-Object { $_.BaseName }
}

if (-not $Names -or $Names.Count -eq 0) {
  throw "No SVG icons found in $sourceRoot"
}

if (-not (Test-Path -LiteralPath $outputRoot)) {
  New-Item -ItemType Directory -Path $outputRoot | Out-Null
}

$chromeCandidates = @(
  "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
  "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe",
  "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe"
)
$browser = $chromeCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $browser) {
  throw 'Chrome or Edge was not found.'
}

Add-Type -AssemblyName System.Drawing
$jpegCodec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() |
  Where-Object { $_.MimeType -eq 'image/jpeg' } |
  Select-Object -First 1
$quality = [System.Drawing.Imaging.Encoder]::Quality

foreach ($name in $Names) {
  $svgPath = Join-Path $sourceRoot "$name.svg"
  $jpgPath = Join-Path $outputRoot "$name.jpg"
  if (-not (Test-Path -LiteralPath $svgPath)) {
    throw "Missing SVG icon: $svgPath"
  }

  $pngPath = Join-Path $env:TEMP "vela-band-$name-$PID.png"
  $uri = ([System.Uri](Resolve-Path -LiteralPath $svgPath).Path).AbsoluteUri
  & $browser --headless --disable-gpu --hide-scrollbars --default-background-color=000000 --window-size=96,96 "--screenshot=$pngPath" $uri | Out-Null
  if (-not (Test-Path -LiteralPath $pngPath)) {
    throw "Browser did not render PNG: $name"
  }

  $source = [System.Drawing.Image]::FromFile($pngPath)
  $bitmap = New-Object System.Drawing.Bitmap 96, 96
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.Clear([System.Drawing.Color]::Black)
  $graphics.DrawImage($source, 0, 0, 96, 96)
  $encoderParameters = New-Object System.Drawing.Imaging.EncoderParameters 1
  $encoderParameters.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter($quality, 92L)
  $bitmap.Save($jpgPath, $jpegCodec, $encoderParameters)

  $encoderParameters.Dispose()
  $graphics.Dispose()
  $bitmap.Dispose()
  $source.Dispose()
  Remove-Item -LiteralPath $pngPath
  Write-Output "Rendered $jpgPath"
}
