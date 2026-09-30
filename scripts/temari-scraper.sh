#!/bin/bash
# Robust bash-based scraper for temari.et papers.
# Uses the saved session (temari-session2.json) for auth.
# Skips papers already scraped.
# Each agent-browser call has a hard timeout so the script never hangs.

set -u  # undefined var = error
ROOT=/home/z/my-project
OUT_DIR=$ROOT/scripts/temari-papers
PAPERS_JSON=$ROOT/scripts/temari-papers.json
LOG=/tmp/scraper2.log
AB="agent-browser"

# Extract paper list from JSON (already saved from earlier session)
mapfile -t PAPERS < <(python3 -c "
import json, re
raw = open('$PAPERS_JSON').read()
m = re.search(r'\[.*\]', raw, re.DOTALL)
d = json.loads(m.group(0))
for p in d:
    print(p['href'] + '\t' + p['text'])
")

TOTAL=${#PAPERS[@]}
echo "Total papers: $TOTAL"
SUCCESSED=0
SKIPPED=0
FAILED=0

for ((i=0; i<TOTAL; i++)); do
  entry="${PAPERS[$i]}"
  href=$(echo "$entry" | cut -f1)
  text=$(echo "$entry" | cut -f2)
  paper_id=$(echo "$href" | rev | cut -d/ -f1 | rev)
  
  # Normalize filename
  subject=$(echo "$text" | cut -d, -f1 | tr ' ' '_' | tr '/' '-')
  safe=$(echo "$text" | sed 's/[^A-Za-z0-9_-]\+/_/g' | sed 's/^_//;s/_$//')
  base_name="${safe}_${paper_id}"
  subj_dir="$OUT_DIR/$subject"
  mkdir -p "$subj_dir"
  txt_path="$subj_dir/$base_name.txt"
  pdf_path="$subj_dir/$base_name.pdf"
  
  n=$((i+1))
  
  # Skip if already done
  if [ -f "$txt_path" ] && [ $(stat -c%s "$txt_path" 2>/dev/null || echo 0) -gt 100 ]; then
    echo "[$n/$TOTAL] SKIP: $text"
    SKIPPED=$((SKIPPED+1))
    continue
  fi
  
  echo "[$n/$TOTAL] $text"
  
  # Open paper detail page (timeout 25s)
  url="https://temari.et$href"
  timeout 25 $AB open "$url" > /dev/null 2>&1
  # Wait for page to render
  timeout 15 $AB wait --text "Download the paper" --timeout 12000 > /dev/null 2>&1
  sleep 1
  
  # Dismiss any tour dialogs
  timeout 10 $AB eval "Array.from(document.querySelectorAll('button')).filter(b=>b.textContent.trim()==='Not now').forEach(b=>b.click())" > /dev/null 2>&1
  sleep 0.5
  
  # Snapshot known UUIDs before click
  KNOWN_BEFORE=$(timeout 15 $AB network requests --filter "r2.cloudflarestorage" 2>&1 | grep -oE '/exam_paper/[a-f0-9-]+\.pdf' | sort -u | wc -l)
  
  # Click Download via JS (note: ?.click() returns undefined when successful,
  # so we explicitly return 'CLICKED' on success).
  CLICK_RES=$(timeout 10 $AB eval "(Array.from(document.querySelectorAll('button')).find(x=>x.textContent.trim()==='Download the paper')||{click:()=>0}).click(); 'CLICKED'" 2>&1)
  
  if [[ "$CLICK_RES" == *NO_BTN* ]]; then
    echo "  ! No download button"
    FAILED=$((FAILED+1))
    continue
  fi
  
  # Wait for new R2 URL to appear (poll up to 20s)
  NEW_URL=""
  for attempt in 1 2 3 4 5 6 7 8 9 10; do
    sleep 2
    KNOWN_AFTER=$(timeout 15 $AB network requests --filter "r2.cloudflarestorage" 2>&1 | grep -oE '/exam_paper/[a-f0-9-]+\.pdf' | sort -u | wc -l)
    if [ "$KNOWN_AFTER" -gt "$KNOWN_BEFORE" ]; then
      # Get the latest full URL using sed (more reliable than grep -oE which truncates)
      NEW_URL=$(timeout 15 $AB network requests --filter "r2.cloudflarestorage" 2>&1 | grep "/exam_paper/" | tail -1 | sed 's/.*GET //;s/ (Document.*//')
      if [ -n "$NEW_URL" ] && [ ${#NEW_URL} -gt 200 ]; then
        break
      else
        NEW_URL=""
      fi
    fi
  done
  
  if [ -z "$NEW_URL" ]; then
    echo "  ! No R2 URL captured"
    FAILED=$((FAILED+1))
    continue
  fi
  
  # Download PDF
  if ! timeout 60 curl -sL -o "$pdf_path" "$NEW_URL"; then
    echo "  ! PDF download failed"
    FAILED=$((FAILED+1))
    continue
  fi
  
  # Extract text
  if ! timeout 30 pdftotext -layout "$pdf_path" "$txt_path" 2>/dev/null; then
    echo "  ! Text extraction failed"
    FAILED=$((FAILED+1))
    continue
  fi
  
  size_kb=$(($(stat -c%s "$txt_path" 2>/dev/null || echo 0) / 1024))
  uuid=$(echo "$NEW_URL" | grep -oE '/exam_paper/[a-f0-9-]+\.pdf' | head -1 | sed 's|/exam_paper/||;s|.pdf||')
  echo "  OK  $base_name.txt ($size_kb KB text, uuid=$(echo $uuid | cut -c1-8)...)"
  SUCCESSED=$((SUCCESSED+1))
  
  # Small delay between papers
  sleep 3
done

echo ""
echo "=== Done: scraped=$SUCCESSED skipped=$SKIPPED failed=$FAILED ==="
