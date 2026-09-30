#!/usr/bin/env python3
"""
Natural-mode scraper v3 — clicks each Download button individually on the
papers LIST page, then moves the downloaded PDF from ~/Downloads (Chrome's
default location) to the proper subject folder. Short delay between clicks
so Chrome doesn't block as "bulk download".

Logged-in account: account4 (0997873321) — fresh, not rate-limited.
"""
import json
import re
import shutil
import subprocess
import time
from pathlib import Path

ROOT = Path("/home/z/my-project")
PAPERS_JSON = ROOT / "scripts" / "temari-papers.json"
PDF_DIR = ROOT / "scripts" / "temari-pdfs"
OUT_DIR = ROOT / "scripts" / "temari-papers"
DOWNLOADS_DIR = Path("/home/z/Downloads")
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
    """Find the most recent PDF in ~/Downloads that's newer than before_mtime."""
    if not DOWNLOADS_DIR.exists():
        return None
    candidates = [
        p for p in DOWNLOADS_DIR.glob("*.pdf")
        if p.stat().st_mtime > before_mtime
    ]
    if not candidates:
        return None
    return max(candidates, key=lambda p: p.stat().st_mtime)


def click_download_for_paper(title: str, target_pdf: Path) -> bool:
    """Find the Download button for the paper with the given title, click it
    via JS, wait for the download to complete in ~/Downloads, then move it
    to target_pdf."""
    safe_title = title.replace("'", "\\'")

    # Scroll the paper's row into view + dismiss tour
    js_setup = f"""
Array.from(document.querySelectorAll('button')).filter(b=>b.textContent.trim()==='Not now').forEach(b=>b.click());
var items = Array.from(document.querySelectorAll('li, [role=listitem]'));
var target = items.find(li => li.textContent.includes('{safe_title}'));
if (target) {{ target.scrollIntoView({{block: 'center'}}); 'SCROLLED'; }} else {{ 'NOT_FOUND'; }}
"""
    out = run_ab("eval", js_setup, timeout=10)
    if "NOT_FOUND" in out:
        return False
    time.sleep(0.5)

    # Click the Download button within the matched row
    before = time.time()
    js_click = f"""
var items = Array.from(document.querySelectorAll('li, [role=listitem]'));
var target = items.find(li => li.textContent.includes('{safe_title}'));
if (target) {{
  var btn = Array.from(target.querySelectorAll('button')).find(b => {{
    var t = (b.textContent || '').trim();
    var l = (b.getAttribute('aria-label') || '').trim();
    return t === 'Download the paper' || l === 'Download the paper';
  }});
  if (btn) {{ btn.click(); 'CLICKED'; }} else {{ 'NO_BTN'; }}
}} else {{ 'NOT_FOUND'; }}
"""
    out = run_ab("eval", js_click, timeout=10)
    if "CLICKED" not in out:
        return False

    # Wait for download — poll ~/Downloads for a new PDF
    for _ in range(30):
        time.sleep(1)
        new_pdf = get_latest_downloaded_pdf(before)
        if new_pdf and new_pdf.stat().st_size > 1000:
            # File finished downloading — wait an extra second to make sure it's flushed
            time.sleep(1)
            try:
                shutil.move(str(new_pdf), str(target_pdf))
                return True
            except (OSError, shutil.Error):
                # File might still be being written — try copy + remove
                shutil.copy(str(new_pdf), str(target_pdf))
                new_pdf.unlink(missing_ok=True)
                return True
    return False


def main() -> None:
    with open(PAPERS_JSON) as f:
        raw = f.read()
    match = re.search(r"\[.*\]", raw, re.DOTALL)
    papers = json.loads(match.group(0))
    print(f"Total papers: {len(papers)}")

    success = 0
    skipped = 0
    failed: list[dict] = []

    for i, paper in enumerate(papers, 1):
        text = paper["text"]
        href = paper["href"]
        paper_id = href.rsplit("/", 1)[-1]
        subject, base_name = normalize_filename(text, paper_id)

        subj_dir = OUT_DIR / subject
        subj_dir.mkdir(parents=True, exist_ok=True)
        pdf_path = PDF_DIR / f"{base_name}.pdf"
        txt_path = subj_dir / f"{base_name}.txt"

        # Skip if already scraped
        if txt_path.exists() and txt_path.stat().st_size > 100:
            print(f"[{i}/{len(papers)}] SKIP: {text}")
            skipped += 1
            continue

        print(f"[{i}/{len(papers)}] {text}")

        if click_download_for_paper(text, pdf_path):
            if extract_text(pdf_path, txt_path):
                size_kb = txt_path.stat().st_size // 1024
                print(f"  OK  {txt_path.name} ({size_kb} KB)")
                success += 1
            else:
                print(f"  ! Text extraction failed")
                failed.append({"paper": text, "reason": "extraction failed"})
        else:
            print(f"  ! Download failed (likely rate-limited)")
            failed.append({"paper": text, "reason": "download failed"})
            # If a download fails, likely rate-limited — wait a bit
            time.sleep(10)

        # Small human-like delay between downloads so Chrome doesn't bulk-block
        time.sleep(4)

    print(f"\n=== Done: scraped={success}  skipped={skipped}  failed={len(failed)} ===")
    if failed:
        print(f"\nFailures:")
        for f in failed[:30]:
            print(f"  - {f['paper']}: {f['reason']}")


if __name__ == "__main__":
    main()
