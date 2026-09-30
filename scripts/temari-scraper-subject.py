#!/usr/bin/env python3
"""
Subject-by-subject scraper.

Usage: python3 temari-scraper-subject.py <subject_name>

For the given subject, scrapes ALL its papers across ALL years, one at a time.
Rotates through saved sessions (account1-5) when one gets rate-limited, and
creates a fresh random account if all existing sessions are blocked.

For each paper:
1. Open the paper's detail page
2. Dismiss any tour dialogs
3. Click "Download the paper" via JS
4. Wait for the PDF to land in ~/Downloads/
5. Move it to temari-pdfs/<filename>.pdf
6. Extract text to temari-papers/<Subject>/<filename>.txt
"""
import json
import os
import random
import re
import shutil
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path("/home/z/my-project")
PAPERS_JSON = ROOT / "scripts" / "temari-papers.json"
PDF_DIR = ROOT / "scripts" / "temari-pdfs"
OUT_DIR = ROOT / "scripts" / "temari-papers"
DOWNLOADS_DIR = Path("/home/z/Downloads")
SESSIONS = [
    ("account1", "0989680816", "0816", ROOT / "scripts" / "temari-session.json"),
    ("account2", "0928905156", "5156", ROOT / "scripts" / "temari-session2.json"),
    ("account3", "0913979891", "5156", ROOT / "scripts" / "temari-session3.json"),
    ("account4", "0997873321", "5156", ROOT / "scripts" / "temari-session4.json"),
    ("account5", "0995851670", "5156", ROOT / "scripts" / "temari-session5.json"),
    ("account6", "0979816295", "5156", ROOT / "scripts" / "temari-session6.json"),
    ("account7", "0931175014", "5156", ROOT / "scripts" / "temari-session7.json"),
    ("account8", "0999869704", "5156", ROOT / "scripts" / "temari-session8.json"),
    ("account9", "0994294517", "5156", ROOT / "scripts" / "temari-session9.json"),
    ("account10", "0919779444", "5156", ROOT / "scripts" / "temari-session10.json"),
    ("account11", "0926516678", "5156", ROOT / "scripts" / "temari-session11.json"),
    ("account12", "0949597964", "5156", ROOT / "scripts" / "temari-session12.json"),
    ("account13", "0975247141", "5156", ROOT / "scripts" / "temari-session13.json"),
    ("account14", "0934906574", "5156", ROOT / "scripts" / "temari-session14.json"),
    ("account15", "0991904703", "5156", ROOT / "scripts" / "temari-session15.json"),
]
PDF_DIR.mkdir(parents=True, exist_ok=True)
OUT_DIR.mkdir(parents=True, exist_ok=True)


def run_ab(*args: str, timeout: int = 60) -> str:
    try:
        out = subprocess.run(
            ["agent-browser", *args],
            capture_output=True,
            text=True,
            timeout=timeout,
        )
        return (out.stdout or "") + (out.stderr or "")
    except subprocess.TimeoutExpired:
        return ""


def normalize_filename(text: str, paper_id: str) -> tuple[str, str]:
    subject = text.split(",")[0].strip().replace(" ", "_").replace("/", "-")
    safe = re.sub(r"[^A-Za-z0-9_\-]+", "_", text).strip("_")
    return subject, f"{safe}_{paper_id}"


def extract_text(pdf_path: Path, txt_path: Path) -> bool:
    try:
        with open(txt_path, "w", encoding="utf-8") as f:
            subprocess.run(
                ["pdftotext", "-layout", str(pdf_path), "-"],
                check=True,
                stdout=f,
                stderr=subprocess.DEVNULL,
                timeout=30,
            )
        return txt_path.exists() and txt_path.stat().st_size > 100
    except (subprocess.CalledProcessError, subprocess.TimeoutExpired):
        return False


def get_latest_downloaded_pdf(before_mtime: float) -> Path | None:
    if not DOWNLOADS_DIR.exists():
        return None
    candidates = [
        p for p in DOWNLOADS_DIR.glob("*.pdf")
        if p.stat().st_mtime > before_mtime
    ]
    if not candidates:
        return None
    return max(candidates, key=lambda p: p.stat().st_mtime)


def login_with_session(session_path: Path) -> bool:
    """Load a saved session into the browser."""
    if not session_path.exists():
        return False
    out = run_ab("state", "load", str(session_path), timeout=15)
    return "✓" in out or "Done" in out


def create_random_account() -> tuple[str, Path]:
    """Create a fresh temari.et account with a random Ethiopian phone number."""
    # Generate a random Ethiopian phone number
    prefixes = ["091", "092", "093", "094", "097", "099"]
    prefix = random.choice(prefixes)
    suffix = "".join([str(random.randint(0, 9)) for _ in range(7)])
    phone = prefix + suffix
    pin = "5156"

    print(f"  + Creating fresh account: {phone}")

    # Close + open signup
    run_ab("close", timeout=10)
    time.sleep(2)
    run_ab("open", "https://temari.et/signup", timeout=20)
    run_ab("wait", "--text", "Create your account", "--timeout", "10000", timeout=15)

    # Fill the form
    out = run_ab("snapshot", "-i", timeout=10)
    phone_match = re.search(r'textbox "Phone number" \[ref=([a-z0-9]+)\]', out)
    name_match = re.search(r'textbox "Full name" \[ref=([a-z0-9]+)\]', out)
    pin_match = re.search(r'textbox "PIN" \[ref=([a-z0-9]+)\]', out)
    switch_match = re.search(r'switch \[checked=false, ref=([a-z0-9]+)\]', out)
    btn_match = re.search(r'button "Create account" \[ref=([a-z0-9]+)\]', out)
    if not (phone_match and name_match and pin_match and switch_match and btn_match):
        print(f"  ! Couldn't find signup form elements")
        return ("", Path())

    run_ab("fill", f"@{phone_match.group(1)}", phone, timeout=10)
    run_ab("fill", f"@{name_match.group(1)}", f"User {random.randint(1000,9999)}", timeout=10)
    run_ab("fill", f"@{pin_match.group(1)}", pin, timeout=10)
    run_ab("click", f"@{switch_match.group(1)}", timeout=10)
    time.sleep(1)
    run_ab("click", f"@{btn_match.group(1)}", timeout=10)
    run_ab("wait", "5000", timeout=10)

    # Pick Grade 12 + Natural
    out = run_ab("snapshot", "-i", timeout=10)
    g12_match = re.search(r'radio "Grade 12" \[ref=([a-z0-9]+)\]', out)
    if g12_match:
        run_ab("click", f"@{g12_match.group(1)}", timeout=10)
        time.sleep(1)
    out = run_ab("snapshot", "-i", timeout=10)
    nat_match = re.search(r'radio "Natural science[^"]*" \[ref=([a-z0-9]+)\]', out)
    cont_match = re.search(r'button "Continue" \[ref=([a-z0-9]+)\]', out)
    if nat_match:
        run_ab("click", f"@{nat_match.group(1)}", timeout=10)
        time.sleep(1)
    if cont_match:
        run_ab("click", f"@{cont_match.group(1)}", timeout=10)
    run_ab("wait", "5000", timeout=10)

    # Save session
    session_num = len(SESSIONS) + 1
    session_path = ROOT / f"scripts/temari-session{session_num}.json"
    run_ab("state", "save", str(session_path), timeout=10)

    # Record the account
    SESSIONS.append((f"account{session_num}", phone, pin, session_path))
    print(f"  + Account saved: {phone} / {pin} -> {session_path.name}")
    return (phone, session_path)


def scrape_paper(paper: dict, current_session_idx: int) -> tuple[bool, int]:
    """Try to scrape one paper. Returns (success, current_session_idx).
    If 429, rotates to the next session and retries."""
    text = paper["text"]
    href = paper["href"]
    paper_id = href.rsplit("/", 1)[-1]
    subject, base_name = normalize_filename(text, paper_id)

    subj_dir = OUT_DIR / subject
    subj_dir.mkdir(parents=True, exist_ok=True)
    pdf_path = PDF_DIR / f"{base_name}.pdf"
    txt_path = subj_dir / f"{base_name}.txt"

    if txt_path.exists() and txt_path.stat().st_size > 100:
        print(f"  SKIP (already done): {text}")
        return (True, current_session_idx)

    # Try with current session; rotate if rate-limited
    max_retries = len(SESSIONS) + 2  # allow up to 2 fresh accounts
    for retry in range(max_retries):
        # Load session
        session = SESSIONS[current_session_idx]
        login_with_session(session[3])

        # Open paper detail page
        url = f"https://temari.et{href}"
        run_ab("open", url, timeout=20)
        run_ab("wait", "--text", "Download the paper", "--timeout", "12000", timeout=15)
        time.sleep(1)

        # Dismiss tour
        run_ab("eval", "Array.from(document.querySelectorAll('button')).filter(b=>b.textContent.trim()==='Not now').forEach(b=>b.click())", timeout=10)
        time.sleep(0.5)

        # Click Download via JS (explicit CLICKED return value)
        before = time.time()
        js = """(function() {
          var btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim()==='Download the paper' || (b.getAttribute('aria-label')||'').trim()==='Download the paper');
          if (btn) { btn.scrollIntoView({block:'center'}); btn.click(); return 'CLICKED'; }
          return 'NO_BTN';
        })()"""
        out = run_ab("eval", js, timeout=10)
        if "CLICKED" not in out:
            print(f"  ! Couldn't click Download button: {out[:80]}")
            # Try next session
            current_session_idx = (current_session_idx + 1) % len(SESSIONS)
            continue

        # Wait for PDF to appear in ~/Downloads
        for _ in range(20):
            time.sleep(1)
            new_pdf = get_latest_downloaded_pdf(before)
            if new_pdf and new_pdf.stat().st_size > 1000:
                # Make sure file is fully written
                time.sleep(1)
                try:
                    shutil.move(str(new_pdf), str(pdf_path))
                except (OSError, shutil.Error):
                    shutil.copy(str(new_pdf), str(pdf_path))
                    new_pdf.unlink(missing_ok=True)
                # Check if rate-limited (no R2 URL appeared in network log)
                if not extract_text(pdf_path, txt_path):
                    print(f"  ! Text extraction failed for {text}")
                    return (False, current_session_idx)
                size_kb = txt_path.stat().st_size // 1024
                print(f"  OK  {txt_path.name} ({size_kb} KB) [via {session[0]}]")
                return (True, current_session_idx)
            # Check if we got a 429 in the network log
            api_out = run_ab("network", "requests", "--filter", "api/v1/documents", timeout=10)
            if "429" in api_out:
                # Rotate to next session
                print(f"  . Rate-limited on {session[0]}, rotating...")
                current_session_idx = (current_session_idx + 1) % len(SESSIONS)
                # If we've cycled through all sessions, create a fresh one
                if retry == len(SESSIONS) - 1:
                    new_phone, new_session = create_random_account()
                    if new_session.exists():
                        current_session_idx = len(SESSIONS) - 1
                break

    print(f"  ! Failed after {max_retries} retries: {text}")
    return (False, current_session_idx)


def main() -> None:
    if len(sys.argv) < 2:
        print("Usage: python3 temari-scraper-subject.py <subject_name>")
        print("       python3 temari-scraper-subject.py Aptitude")
        sys.exit(1)

    target_subject = sys.argv[1]
    print(f"\n=== Scraping subject: {target_subject} ===\n")

    with open(PAPERS_JSON) as f:
        raw = f.read()
    match = re.search(r"\[.*\]", raw, re.DOTALL)
    papers = json.loads(match.group(0))

    # Filter to just this subject's papers
    subject_papers = [p for p in papers if p["text"].split(",")[0].strip() == target_subject]
    print(f"Papers in {target_subject}: {len(subject_papers)}")

    # Count already scraped
    already_done = 0
    need = []
    for p in subject_papers:
        paper_id = p["href"].rsplit("/", 1)[-1]
        _, base_name = normalize_filename(p["text"], paper_id)
        txt_path = OUT_DIR / target_subject.replace(" ", "_") / f"{base_name}.txt"
        if txt_path.exists() and txt_path.stat().st_size > 100:
            already_done += 1
        else:
            need.append(p)

    print(f"  Already done: {already_done}")
    print(f"  Need to scrape: {len(need)}")
    print()

    if not need:
        print(f"Subject {target_subject} is already complete!")
        return

    # Start with session 0 (account1)
    current_session_idx = 0
    success = 0
    failed = []

    for paper in need:
        text = paper["text"]
        print(f"- {text}")
        ok, current_session_idx = scrape_paper(paper, current_session_idx)
        if ok:
            success += 1
        else:
            failed.append(text)
        # Small human-like delay
        time.sleep(3)

    print(f"\n=== {target_subject} done: scraped={success} failed={len(failed)} ===")
    if failed:
        print("Failed:")
        for f in failed:
            print(f"  - {f}")


if __name__ == "__main__":
    main()
