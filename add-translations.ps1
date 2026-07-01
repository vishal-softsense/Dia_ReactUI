# =============================================================================
# add-translations.ps1
# Automatically adds useTranslation import + hook to all Masters page JS files.
# Run from: d:\CoreUI\MVC_API_UI\UI
# Usage: .\add-translations.ps1
# =============================================================================

$mastersPath = "src\pages\Masters"
$files = Get-ChildItem -Path $mastersPath -Recurse -Filter "*.js"

$i18nImport  = 'import { useTranslation } from "react-i18next";'
$hookLine    = '    const { t } = useTranslation();'

$successCount = 0
$skipCount    = 0

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw -Encoding UTF8

    # ── 1. Skip if already has useTranslation ──────────────────────────────
    if ($content -match 'useTranslation') {
        Write-Host "SKIP (already done): $($file.Name)" -ForegroundColor Yellow
        $skipCount++
        continue
    }

    # ── 2. Add import after the last existing import line ─────────────────
    # Find the last "import " line and insert after it
    $lines = $content -split "`r?`n"
    $lastImportIndex = -1
    for ($idx = 0; $idx -lt $lines.Count; $idx++) {
        if ($lines[$idx] -match '^import ') {
            $lastImportIndex = $idx
        }
    }

    if ($lastImportIndex -eq -1) {
        Write-Host "SKIP (no imports found): $($file.Name)" -ForegroundColor Red
        $skipCount++
        continue
    }

    # Insert i18n import after last import
    $newLines = [System.Collections.Generic.List[string]]::new()
    for ($idx = 0; $idx -lt $lines.Count; $idx++) {
        $newLines.Add($lines[$idx])
        if ($idx -eq $lastImportIndex) {
            $newLines.Add($i18nImport)
        }
    }
    $lines = $newLines.ToArray()

    # ── 3. Add hook inside component (after first "const Xxx = () =>" or "function Xxx(") ──
    $hookInserted = $false
    $newLines2 = [System.Collections.Generic.List[string]]::new()
    for ($idx = 0; $idx -lt $lines.Count; $idx++) {
        $newLines2.Add($lines[$idx])

        if (-not $hookInserted) {
            # Match arrow function component: "const XxxXxx = () => {"  or  "const XxxXxx = (props) => {"
            if ($lines[$idx] -match '^\s*const\s+\w+\s*=\s*\(.*\)\s*=>\s*\{') {
                $newLines2.Add($hookLine)
                $hookInserted = $true
            }
            # Match regular function: "function XxxXxx("
            elseif ($lines[$idx] -match '^\s*function\s+\w+\s*\(') {
                $newLines2.Add($hookLine)
                $hookInserted = $true
            }
        }
    }

    if (-not $hookInserted) {
        Write-Host "SKIP (component pattern not found): $($file.Name)" -ForegroundColor Red
        $skipCount++
        continue
    }

    # ── 4. Wrap JSX text literals with t() ─────────────────────────────────
    # Strategy: wrap static strings inside JSX (between > and <, or in attributes like placeholder/title)
    $finalContent = $newLines2 -join "`r`n"

    # Wrap JSX text content: >Some Text< → >{t("Some Text")}<
    # Only match text with letters (skip whitespace-only, numbers-only, icons)
    $finalContent = [regex]::Replace($finalContent, '(?<=>)([^<>{}\r\n]+?)(?=<)', {
        param($m)
        $text = $m.Groups[1].Value
        $trimmed = $text.Trim()
        # Only wrap if: has letters, not already t(...), not JSX expression, not empty
        if ($trimmed -match '[A-Za-z]' -and $trimmed -notmatch '^\{' -and $trimmed.Length -gt 1) {
            # Preserve leading/trailing whitespace
            $leading  = $text -replace '^(\s*).*$', '$1'
            $trailing = $text -replace '^.*?(\s*)$', '$1'
            # Escape double quotes inside the text
            $escaped = $trimmed -replace '"', "'"
            return "$leading`{t(`"$escaped`")`}$trailing"
        }
        return $m.Value
    })

    # Wrap placeholder="..." attribute values
    $finalContent = [regex]::Replace($finalContent, '(placeholder=")([^"]+)(")', {
        param($m)
        $val = $m.Groups[2].Value
        if ($val -match '[A-Za-z]' -and $val -notmatch '^\{') {
            $escaped = $val -replace '"', "'"
            return "placeholder={t(`"$escaped`")}"
        }
        return $m.Value
    })

    # Wrap title="..." attribute values
    $finalContent = [regex]::Replace($finalContent, '(title=")([^"]+)(")', {
        param($m)
        $val = $m.Groups[2].Value
        if ($val -match '[A-Za-z]' -and $val -notmatch '^\{') {
            $escaped = $val -replace '"', "'"
            return "title={t(`"$escaped`")}"
        }
        return $m.Value
    })

    # Wrap SearchPlaceholder="..." (TableContainer prop)
    $finalContent = [regex]::Replace($finalContent, '(SearchPlaceholder=")([^"]+)(")', {
        param($m)
        $val = $m.Groups[2].Value
        if ($val -match '[A-Za-z]') {
            $escaped = $val -replace '"', "'"
            return "SearchPlaceholder={t(`"$escaped`")}"
        }
        return $m.Value
    })

    # ── 5. Write back ───────────────────────────────────────────────────────
    [System.IO.File]::WriteAllText($file.FullName, $finalContent, [System.Text.Encoding]::UTF8)
    Write-Host "DONE: $($file.Name)" -ForegroundColor Green
    $successCount++
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Total processed : $successCount files" -ForegroundColor Green
Write-Host "Skipped         : $skipCount files"   -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Cyan
