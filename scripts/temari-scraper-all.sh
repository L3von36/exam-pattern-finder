#!/usr/bin/env bash
# Comprehensive batch-scraper for all remaining papers across all subjects.
# Uses ALL available accounts in rotation; whichever is fresh, it grabs the paper.
# Runs as a daemon in the background.

ROOT=/home/z/my-project
PAPERS_JSON=$ROOT/scripts/temari-papers.json
LOG=/tmp/scraper-all.log

# Get all missing papers (pid + subject + title)
MISSING=$(PAPERS_JSON="$PAPERS_JSON" ROOT="$ROOT" python3 << 'PYEOF'
import json, re, os
from pathlib import Path

PAPERS_JSON = os.environ["PAPERS_JSON"]
ROOT = os.environ["ROOT"]

with open(PAPERS_JSON) as f:
    papers = json.load(f)

subject_order = [
    "Biology",
    "Chemistry",
    "Civics and Ethical Education",
    "English",
    "Mathematics",
    "Physics",
    "Scholastic Aptitude Test",
]

missing_by_subject = {}
for p in papers:
    subject = p["text"].split(",")[0].strip()
    pid = p["href"].rsplit("/", 1)[-1]
    safe = re.sub(r"[^A-Za-z0-9_\-]+", "_", p["text"]).strip("_") + f"_{pid}"
    subj_dir = subject.replace(" ", "_").replace("/", "-")
    txt = Path(f"{ROOT}/scripts/temari-papers/{subj_dir}/{safe}.txt")
    if not (txt.exists() and txt.stat().st_size > 100):
        if subject not in missing_by_subject:
            missing_by_subject[subject] = []
        missing_by_subject[subject].append({"pid": pid, "text": p["text"]})

for subject in subject_order:
    if subject in missing_by_subject:
        for m in missing_by_subject[subject]:
            print(f"{m['pid']}\t{subject}\t{m['text']}")
PYEOF
)

if [ -z "$MISSING" ]; then
  echo "All papers done!"
  exit 0
fi

echo "Missing papers:"
echo "$MISSING" | wc -l
echo ""

# Loop through each missing paper
echo "$MISSING" | while IFS=$'\t' read -r pid subject title; do
  if [ -z "$pid" ]; then continue; fi
  echo "[$pid] $title"
  subject_short=$(echo "$subject" | cut -d' ' -f1)
  subj_dir=$(echo "$subject" | sed 's/ /_/g; s/\//-/g')

  # Try each account in rotation
  for sess in 18 17 16 15 1 2 3 4 5 6 7 8 9 10 11 12 13 14; do
    sess_file="$ROOT/scripts/temari-session${sess}.json"
    if [ ! -f "$sess_file" ]; then continue; fi
    agent-browser state load "$sess_file" 2>&1 > /dev/null
    rm -f /home/z/Downloads/*.pdf
    agent-browser open "https://temari.et/me/exam-prep/$pid" 2>&1 > /dev/null
    if ! agent-browser wait --text "Download the paper" --timeout 8000 2>&1 | tail -1 | grep -q "Done"; then continue; fi
    sleep 0.3
    agent-browser eval "Array.from(document.querySelectorAll('button')).filter(b=>b.textContent.trim()==='Not now').forEach(b=>b.click())" 2>&1 > /dev/null
    sleep 0.3
    agent-browser eval "(function(){var btn=Array.from(document.querySelectorAll('button')).find(b=>b.textContent.trim()==='Download the paper'||(b.getAttribute('aria-label')||'').trim()==='Download the paper');if(btn){btn.click();return 'CLICKED';}return 'NO_BTN';})()" 2>&1 > /dev/null
    sleep 9
    pdf_file=$(ls /home/z/Downloads/*.pdf 2>/dev/null | head -1)
    if [ -n "$pdf_file" ]; then
      title_actual=$(pdftotext -layout "$pdf_file" - 2>/dev/null | head -2 | tail -1 | sed 's/^ *//')
      # The downloaded title should match the subject we requested
      if echo "$title_actual" | grep -qi "$subject_short"; then
        safe_filename=$(echo "$title_actual" | sed 's/[^A-Za-z0-9_ ]//g; s/ /_/g')_$pid
        mv "$pdf_file" "$ROOT/scripts/temari-pdfs/${safe_filename}.pdf" 2>/dev/null
        pdftotext -layout "$ROOT/scripts/temari-pdfs/${safe_filename}.pdf" "$ROOT/scripts/temari-papers/${subj_dir}/${safe_filename}.txt" 2>/dev/null
        echo "  OK via acc$sess"
        break
      else
        # Decoy - clean up + try next account
        rm -f "$pdf_file"
      fi
    fi
  done
done

# Final inventory
echo ""
echo "=== FINAL INVENTORY ==="
total=0
for d in $ROOT/scripts/temari-papers/*/; do
  count=$(ls $d/*.txt 2>/dev/null | wc -l)
  echo "  $(basename $d): $count"
  total=$((total + count))
done
echo "TOTAL: $total papers"
