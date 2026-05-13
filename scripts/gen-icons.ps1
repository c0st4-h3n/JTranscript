# scripts/gen-icons.ps1 - gera os icones do app na estetica do brand Coslu Labz.
#
# Carimbo: paper bg + borda dupla vermilion + monograma "CL" serif
# (C em ink, L em vermilion).
#
# Saida: src-tauri/icons/{32x32,128x128,128x128@2x}.png + icon.ico

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$iconsDir = Join-Path $root "src-tauri\icons"

Add-Type -AssemblyName System.Drawing

$paper = [System.Drawing.Color]::FromArgb(255, 239, 232, 216)
$vermilion = [System.Drawing.Color]::FromArgb(255, 184, 49, 30)
$ink = [System.Drawing.Color]::FromArgb(255, 26, 26, 26)

function New-StampIcon([int]$size, [string]$path) {
    $bmp = New-Object System.Drawing.Bitmap $size, $size
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = "AntiAlias"
    $g.TextRenderingHint = "AntiAlias"
    $g.Clear($paper)

    # Borda dupla vermilion (estilo "3px double" da Stamp.tsx)
    $outerWidth = [Math]::Max(2, [int]($size * 0.06))
    $gap = [Math]::Max(1, [int]($size * 0.02))
    $innerWidth = [Math]::Max(1, [int]($size * 0.02))

    $penOuter = New-Object System.Drawing.Pen $vermilion, $outerWidth
    $penInner = New-Object System.Drawing.Pen $vermilion, $innerWidth

    $outerInset = [int]($outerWidth / 2)
    $g.DrawRectangle($penOuter, $outerInset, $outerInset, $size - $outerWidth, $size - $outerWidth)

    $innerInset = $outerWidth + $gap + [int]($innerWidth / 2)
    $g.DrawRectangle(
        $penInner,
        $innerInset, $innerInset,
        $size - 2 * $innerInset, $size - 2 * $innerInset
    )

    # Monograma CL serif centralizado
    $fontSize = [int]($size * 0.50)
    $font = New-Object System.Drawing.Font "Georgia", $fontSize, ([System.Drawing.FontStyle]::Bold)
    $brushInk = New-Object System.Drawing.SolidBrush $ink
    $brushVerm = New-Object System.Drawing.SolidBrush $vermilion
    $sf = New-Object System.Drawing.StringFormat
    $sf.Alignment = "Center"
    $sf.LineAlignment = "Center"

    $half = $size / 2.0
    $rectC = New-Object System.Drawing.RectangleF 0, 0, $half, $size
    $rectL = New-Object System.Drawing.RectangleF $half, 0, $half, $size

    $g.DrawString("C", $font, $brushInk, $rectC, $sf)
    $g.DrawString("L", $font, $brushVerm, $rectL, $sf)

    $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)

    $g.Dispose()
    $font.Dispose()
    $brushInk.Dispose()
    $brushVerm.Dispose()
    $penOuter.Dispose()
    $penInner.Dispose()
    $bmp.Dispose()
}

New-StampIcon  32 (Join-Path $iconsDir "32x32.png")
New-StampIcon 128 (Join-Path $iconsDir "128x128.png")
New-StampIcon 256 (Join-Path $iconsDir "128x128@2x.png")

# ICO multi-resolução
$icoSizes = @(16, 24, 32, 48, 64, 128, 256)
$bmps = @()
foreach ($s in $icoSizes) {
    $tmp = New-Object System.Drawing.Bitmap $s, $s
    $g = [System.Drawing.Graphics]::FromImage($tmp)
    $g.SmoothingMode = "AntiAlias"
    $g.TextRenderingHint = "AntiAlias"
    $g.Clear($paper)
    if ($s -ge 32) {
        $ow = [Math]::Max(1, [int]($s * 0.06))
        $iw = [Math]::Max(1, [int]($s * 0.02))
        $gp = [Math]::Max(1, [int]($s * 0.02))
        $penO = New-Object System.Drawing.Pen $vermilion, $ow
        $penI = New-Object System.Drawing.Pen $vermilion, $iw
        $oI = [int]($ow / 2)
        $g.DrawRectangle($penO, $oI, $oI, $s - $ow, $s - $ow)
        $iI = $ow + $gp + [int]($iw / 2)
        if ($s - 2 * $iI -gt 0) {
            $g.DrawRectangle($penI, $iI, $iI, $s - 2 * $iI, $s - 2 * $iI)
        }
        $penO.Dispose()
        $penI.Dispose()
    }
    $fs = [int]($s * 0.50)
    $f = New-Object System.Drawing.Font "Georgia", $fs, ([System.Drawing.FontStyle]::Bold)
    $bI = New-Object System.Drawing.SolidBrush $ink
    $bV = New-Object System.Drawing.SolidBrush $vermilion
    $sf2 = New-Object System.Drawing.StringFormat
    $sf2.Alignment = "Center"
    $sf2.LineAlignment = "Center"
    $half2 = $s / 2.0
    $g.DrawString("C", $f, $bI, (New-Object System.Drawing.RectangleF 0, 0, $half2, $s), $sf2)
    $g.DrawString("L", $f, $bV, (New-Object System.Drawing.RectangleF $half2, 0, $half2, $s), $sf2)
    $g.Dispose()
    $f.Dispose()
    $bI.Dispose()
    $bV.Dispose()
    $bmps += $tmp
}

# ICO via System.Drawing.Icon — só consegue size única; vamos com 32 como base.
# Pra multi-size icon real precisaria construir o ICO binário à mão. Pra MSI ok.
$icoBase = $bmps[2]  # 32px
$hIcon = $icoBase.GetHicon()
$icon = [System.Drawing.Icon]::FromHandle($hIcon)
$icoPath = Join-Path $iconsDir "icon.ico"
$fs = [System.IO.File]::Create($icoPath)
$icon.Save($fs)
$fs.Close()
foreach ($b in $bmps) { $b.Dispose() }

Write-Host "icons:"
Get-ChildItem $iconsDir | Select-Object Name, Length
