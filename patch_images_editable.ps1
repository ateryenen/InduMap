# patch_images_editable.ps1
# Purpose: make image nodes selectable/draggable/resizable by preventing native img drag and ensuring events reach node container.
# It performs conservative regex-based edits on app/page.tsx.
# A backup will be created as app/page.tsx.bak.<timestamp>

$ErrorActionPreference = "Stop"

$projectRoot = Get-Location
$pagePath = Join-Path $projectRoot "app\page.tsx"
if (!(Test-Path $pagePath)) {
  Write-Host "❌ Cannot find $pagePath . Please run this script from your project root." -ForegroundColor Red
  exit 1
}

$ts = Get-Date -Format "yyyyMMdd_HHmmss"
$backup = "$pagePath.bak.$ts"
Copy-Item $pagePath $backup
Write-Host "✅ Backup created: $backup" -ForegroundColor Green

$content = Get-Content $pagePath -Raw

# 1) Ensure <img> has draggable={false} and onDragStart preventDefault, and pointer-events-none + select-none classes
# We only patch <img ...> that already references node.src (common in this project) to avoid touching unrelated images.
# If attributes already exist, we don't duplicate.
function Ensure-Attr($tag, $attrName, $attrValue) {
  if ($tag -match [regex]::Escape($attrName)) { return $tag }
  # insert before closing >
  return ($tag -replace ">$", " $attrValue>")
}

# Patch <img ... src={node.src} ...>
$patternImg = '<img\b[^>]*\bsrc=\{node\.src\}[^>]*>'
$matches = [regex]::Matches($content, $patternImg)
foreach ($m in $matches) {
  $tag = $m.Value

  # draggable={false}
  if ($tag -notmatch '\bdraggable=') {
    $tag = $tag -replace '<img\b', '<img draggable={false}'
  }

  # onDragStart
  if ($tag -notmatch '\bonDragStart=') {
    $tag = $tag -replace '<img\b', '<img onDragStart={(e) => e.preventDefault()}'
  }

  # className add pointer-events-none select-none
  if ($tag -match '\bclassName=') {
    # append classes inside existing className string/template
    $tag = $tag -replace 'className=\{?("([^"]*)"|`([^`]*)`)\}?', {
      param($mm)
      $full = $mm.Value
      if ($full -match '"([^"]*)"') {
        $cls = $Matches[1]
        if ($cls -notmatch 'pointer-events-none') { $cls += ' pointer-events-none' }
        if ($cls -notmatch 'select-none') { $cls += ' select-none' }
        return 'className="' + $cls.Trim() + '"'
      } elseif ($full -match '`([^`]*)`') {
        $cls = $Matches[1]
        if ($cls -notmatch 'pointer-events-none') { $cls += ' pointer-events-none' }
        if ($cls -notmatch 'select-none') { $cls += ' select-none' }
        return 'className=`' + $cls.Trim() + '`'
      } else {
        return $full
      }
    }
  } else {
    # add a sane default className (won't affect layout)
    $tag = $tag -replace '<img\b', '<img className="pointer-events-none select-none"'
  }

  # Replace in content
  $content = $content.Replace($m.Value, $tag)
}

# 2) Remove common exclusion that prevents resize handles for image nodes: node.type !== "image"
# This is conservative: just delete the specific substring from conditions.
$content = $content -replace '\s*&&\s*node\.type\s*!==\s*["'']image["'']', ''
$content = $content -replace '\s*&&\s*\(\s*node\.type\s*!==\s*["'']image["'']\s*\)', ''

# 3) Remove stopPropagation directly on wrappers that contain <img ... src={node.src} ...>
# We only target patterns like: <div ... onMouseDown={(e)=>e.stopPropagation()} ...> ... <img ... src={node.src} ...> ... </div>
$patternStop = '(?s)<div([^>]*?)\bonMouseDown=\{\(e\)\s*=>\s*e\.stopPropagation\(\)\}([^>]*?)>(.*?)<img\b([^>]*?)\bsrc=\{node\.src\}([^>]*?)>(.*?)</div>'
$content = [regex]::Replace($content, $patternStop, {
  param($mm)
  $before = $mm.Groups[1].Value
  $after  = $mm.Groups[2].Value
  $inner1 = $mm.Groups[3].Value
  $img1   = $mm.Groups[4].Value
  $img2   = $mm.Groups[5].Value
  $inner2 = $mm.Groups[6].Value
  return "<div$before$after>$inner1<img$img1 src={node.src}$img2>$inner2</div>"
})

Set-Content -Path $pagePath -Value $content -Encoding UTF8
Write-Host "✅ Patch applied to app/page.tsx" -ForegroundColor Green
Write-Host "Next steps:"
Write-Host "  1) Stop dev server"
Write-Host "  2) (Optional) delete .next folder"
Write-Host "  3) npm run dev"