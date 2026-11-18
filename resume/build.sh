#!/bin/sh
# Prints resume/index.html to public/Jack_Schliewe_Resume.pdf with headless Chrome, then fails if it is not one page.
# CHROME overrides the browser, e.g. Playwright's chrome-headless-shell.
set -e
cd "$(dirname "$0")/.."
"${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}" --headless --disable-gpu --no-pdf-header-footer \
  --user-data-dir="$(mktemp -d)" \
  --print-to-pdf="$PWD/public/Jack_Schliewe_Resume.pdf" "file://$PWD/resume/index.html" 2>/dev/null
pages=$(pdfinfo public/Jack_Schliewe_Resume.pdf | awk '/^Pages:/ {print $2}')
echo "pages: $pages"
[ "$pages" = 1 ]
