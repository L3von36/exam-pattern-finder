#!/usr/bin/env bash
# Batch-scrape remaining papers for a subject, trying all accounts in rotation.
# Usage: bash temari-scraper-batch.sh <subject>

SUBJECT="$1"
ROOT=/home/z/my-project
PAPERS_JSON=$ROOT/scripts/temari-papers.json

# Get list of missing papers for this subject (id + title)
PIDS=$(python3 << PYEOF
import json, re
from pathlib import Path

with open("$PAPERS_JSON") as f:
    papers = json.load(f)

subject = "$SUBJECT"
for p in papers:
    if p["text"].split(",")[0].strip() != subject:
        continue
    pid = p["href"].rsplit("/", 1)[-1]
    safe = re.sub(r"[^A-Za-z0-9_\-]+", "_", p["text"]).strip("_") + f"_{pid}"
    subj_dir = subject.replace(" ", "_").replace("/", "-")
    txt = Path(f"$ROOT/scripts/temari-papers/{subj_dir}/{safe}.txt")
    if not (txt.exists() and txt.stat().st_size > 100):
        print(f"{pid}\t{p['text']}")
PYEOF
)

if [ -z "$PIDS" ]; then
  echo "$SUBJECT is already complete!"
  exit 0
fi

echo "=== Scraping $SUBJECT ==="
echo "$PIDS" | wc -l
echo ""

echo "$PIDS" | while IFS=$'\t' read -r pid title; do
  if [ -z "$pid" ]; then continue; fi
  echo "[$pid] $title"
  for sess in 16 15 14 1 2 3 4 5 6 7 8 9 10 11 12 13; do
    sess_file="$ROOT/scripts/temari-session${sess}.json"
    if [ ! -f "$sess_file" ]; then continue; fi
    agent-browser state load "$sess_file" 2>&1 > /dev/null
    rm -f /home/z/Downloads/*.pdf
    agent-browser open "https://temari.et/me/exam-prep/$pid" 2>&1 > /dev/null
    if ! agent-browser wait --text "Download the paper" --timeout 8000 2>&1 | tail -1 | grep -q "Done"; then
      continue
    fi
    sleep 0.3
    agent-browser eval "Array.from(document.querySelectorAll('button')).filter(b=>b.textContent.trim()==='Not now').forEach(b=>b.click())" 2>&1 > /dev/null
    sleep 0.3
    agent-browser eval "(function(){var btn=Array.from(document.querySelectorAll('button')).find(b=>b.textContent.trim()==='Download the paper'||(b.getAttribute('aria-label')||'').trim()==='Download the paper');if(btn){btn.click();return 'CLICKED';}return 'NO_BTN';})()" 2>&1 > /dev/null
    sleep 9
    pdf_file=$(ls /home/z/Downloads/*.pdf 2>/dev/null | head -1)
    if [ -n "$pdf_file" ]; then
      title_actual=$(pdftotext -layout "$pdf_file" - 2>/dev/null | head -2 | tail -1 | sed 's/^ *//')
      subject_short=$(echo "$SUBJECT" | cut -d' ' -f1)
      if echo "$title_actual" | grep -qi "$subject_short"; then
        safe_filename=$(echo "$title_actual" | sed 's/[^A-Za-z0-9_ ]//g; s/ /_/g')_$pid
        subj_dir=$(echo "$SUBJECT" | sed 's/ /_/g; s/\//-/g')
        mv "$pdf_file" "$ROOT/scripts/temari-pdfs/${safe_filename}.pdf" 2>/dev/null
        pdftotext -layout "$ROOT/scripts/temari-pdfs/${safe_filename}.pdf" "$ROOT/scripts/temari-papers/${subj_dir}/${safe_filename}.txt" 2>/dev/null
        echo "  OK via acc$sess"
        break
      else
        rm -f "$pdf_file"
      fi
    fi
  done
done

# Final count
subj_dir=$(echo "$SUBJECT" | sed 's/ /_/g; s/\//-/g')
echo ""
echo "=== $SUBJECT count: $(ls $ROOT/scripts/temari-papers/$subj_dir/*.txt 2>/dev/null | wc -l) ==="
