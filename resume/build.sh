#!/bin/sh
# Prints a resume HTML to PDF with headless Chrome, then fails if it is not one page.
# Usage: resume/build.sh [source.html] [output.pdf]
# CHROME overrides the browser.
set -e
cd "$(dirname "$0")/.."
src=${1:-resume/index.html}
out=${2:-public/Jack_Schliewe_Resume.pdf}
# Desktop Chrome crashes in headless print on this Mac (Trace/BPT trap), so prefer Playwright's headless shell when it is installed.
shell=$(ls -d "$HOME"/Library/Caches/ms-playwright/chromium_headless_shell-*/chrome-headless-shell-mac-arm64/chrome-headless-shell 2>/dev/null | tail -1)
"${CHROME:-${shell:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}}" --headless --disable-gpu --no-pdf-header-footer \
  --user-data-dir="$(mktemp -d)" \
  --print-to-pdf="$PWD/$out" "file://$PWD/$src" 2>/dev/null
pages=$(pdfinfo "$out" | awk '/^Pages:/ {print $2}')
echo "pages: $pages"
[ "$pages" = 1 ]
