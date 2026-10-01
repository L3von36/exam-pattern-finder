#!/usr/bin/env bash
# Download Grade 11 + 12 textbooks for entrance exam subjects from temari.et
# Subjects: Biology, Chemistry, English, Mathematics, Physics, Civics & Ethical Education
# (Aptitude and SAT don't have textbooks on temari.et)

ROOT=/home/z/my-project
BOOKS_DIR=$ROOT/scripts/temari-books
DOWNLOADS=/home/z/Downloads
mkdir -p $BOOKS_DIR/Grade_11 $BOOKS_DIR/Grade_12

# Function: download_textbook <grade_level_id> <grade_folder> <subject_keyword>
# Visits the textbook list for the grade, finds the matching textbook, clicks it,
# captures the detail page URL (which contains the textbook ID), then clicks Download.
download_textbook() {
  local grade_id=$1
  local grade_folder=$2
  local subject=$3

  # Visit the textbook list for this grade
  agent-browser open "https://temari.et/me/library/browse?grade_level_id=${grade_id}&category=textbook" 2>&1 > /dev/null
  sleep 2
  agent-browser wait --load networkidle --timeout 10000 2>&1 > /dev/null
  sleep 1

  # Find and click the textbook title button matching this subject
  # Use JS to find the button (case insensitive, exact match on "Subject, Grade X")
  # First try current curriculum (no "old curriculum" suffix)
  echo "Looking for: $subject"
  result=$(agent-browser eval "
    var btns = Array.from(document.querySelectorAll('button'));
    // Try exact match first (current curriculum): 'Subject, Grade X'
    var btn = btns.find(b => b.textContent.trim() === '$subject');
    // Fallback: match without old-curriculum suffix
    if (!btn) btn = btns.find(b => b.textContent.trim().startsWith('$subject') && !b.textContent.includes('old curriculum'));
    if (btn) { btn.click(); 'CLICKED'; } else { 'NO_BTN'; }
  " 2>&1 | tail -1)
  echo "  Click result: $result"

  if [[ "$result" != *CLICKED* ]]; then
    echo "  ! No button found for $subject"
    return 1
  fi

  sleep 3
  agent-browser wait --load networkidle --timeout 10000 2>&1 > /dev/null
  sleep 1

  # Capture URL (contains textbook ID)
  url=$(agent-browser get url 2>&1 | tail -1)
  echo "  Detail page: $url"

  # Verify the textbook title matches what we expect
  heading=$(agent-browser eval "document.querySelector('h1')?.textContent?.trim()?.slice(0,80) || 'NO_HEADING'" 2>&1 | tail -1)
  echo "  Heading: $heading"
  if [[ "$heading" != *"$subject"* ]]; then
    echo "  ! Wrong textbook — heading doesn't match"
    return 1
  fi

  # Build a safe filename
  safe_filename=$(echo "$subject" | tr ' ,' '__' | tr -dc 'A-Za-z0-9_' | tr '[:upper:]' '[:lower:]')
  # e.g., "Biology, Grade 12" → "biology_grade_12"

  # Skip if already downloaded
  if [ -f "$BOOKS_DIR/$grade_folder/${safe_filename}.pdf" ]; then
    echo "  SKIP — already downloaded"
    return 0
  fi

  # Clear downloads + click Download button
  rm -f $DOWNLOADS/*.pdf
  agent-browser eval "Array.from(document.querySelectorAll('button')).filter(b=>b.textContent.trim()==='Not now').forEach(b=>b.click())" 2>&1 > /dev/null
  sleep 1

  before=$(date +%s)
  agent-browser eval "Array.from(document.querySelectorAll('button')).find(b=>b.textContent.trim()==='Download')?.click()||'NO_BTN'" 2>&1 > /dev/null

  # Wait for download to complete (textbooks can be 100+ MB, allow up to 60s)
  for attempt in $(seq 1 60); do
    sleep 2
    pdf_file=$(ls $DOWNLOADS/*.pdf 2>/dev/null | head -1)
    if [ -n "$pdf_file" ]; then
      # Check if file is fully written (size stable for 2s)
      size1=$(stat -c%s "$pdf_file" 2>/dev/null || echo 0)
      sleep 2
      size2=$(stat -c%s "$pdf_file" 2>/dev/null || echo 0)
      if [ "$size1" = "$size2" ] && [ "$size1" -gt 1000000 ]; then
        # File is fully downloaded
        mv "$pdf_file" "$BOOKS_DIR/$grade_folder/${safe_filename}.pdf"
        size_mb=$(($(stat -c%s "$BOOKS_DIR/$grade_folder/${safe_filename}.pdf") / 1024 / 1024))
        echo "  OK — ${safe_filename}.pdf (${size_mb} MB)"
        return 0
      fi
    fi
  done

  echo "  ! Download timed out after 120s"
  return 1
}

echo "=== Downloading Grade 12 textbooks ==="
# Current curriculum
for subject in "Biology, Grade 12" "Chemistry, Grade 12" "English, Grade 12" "Mathematics, Grade 12" "Physics, Grade 12"; do
  download_textbook 15 Grade_12 "$subject"
done
# Old curriculum (only for subjects without current curriculum version)
download_textbook 15 Grade_12 "Civics & Ethical Education, Grade 12 (old curriculum)"

echo ""
echo "=== Downloading Grade 11 textbooks ==="
# Current curriculum
for subject in "Biology, Grade 11" "Chemistry, Grade 11" "English, Grade 11"; do
  download_textbook 14 Grade_11 "$subject"
done
# Old curriculum (Math and Physics only available as old curriculum for Grade 11)
download_textbook 14 Grade_11 "Mathematics, Grade 11 (old curriculum)"
download_textbook 14 Grade_11 "Physics, Grade 11 (old curriculum)"
download_textbook 14 Grade_11 "Civics & Ethical Education, Grade 11 (old curriculum)"

echo ""
echo "=== Final inventory ==="
for d in $BOOKS_DIR/*/; do
  grade=$(basename $d)
  count=$(ls $d/*.pdf 2>/dev/null | wc -l)
  echo "  $grade: $count textbooks"
  ls $d/*.pdf 2>/dev/null | xargs -I{} basename {} | sed 's/^/    /'
done
