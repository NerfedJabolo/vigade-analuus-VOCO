#!/usr/bin/env bash
# Koostab veaaruande DOCX-i ja PDF-i Markdownist.
set -euo pipefail
cd "$(dirname "$0")/.."

PANDOC=".tools/pandoc-3.8.2/bin/pandoc"
OUT="report/Veebirakenduste_veaaruanded_2026-11-17"
TMP="report/_build_veaaruanded.docx"

mkdir -p .cache .lo report

"$PANDOC" report/veaaruanded.md -o "$TMP" --reference-doc=.tools/reference-landscape.docx
python3 scripts/postprocess_docx.py "$TMP" "${OUT}.docx"
rm -f "$TMP"

XDG_CACHE_HOME="$PWD/.cache" HOME="$PWD" \
  soffice -env:UserInstallation="file://$PWD/.lo" --headless \
  --convert-to pdf --outdir report "${OUT}.docx" >/dev/null 2>&1

echo "Valmis: ${OUT}.docx"
echo "Valmis: ${OUT}.pdf"
