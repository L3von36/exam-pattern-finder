#!/usr/bin/env python3
"""
Scraper for temari.et exam papers — robust version.

Per paper:
1. Open the paper's detail page (e.g. /me/exam-prep/627).
2. Wait until the page actually loads (the "Download the paper" button appears).
3. Dismiss the "Show me around" tour dialog if present.
4. Snapshot known R2 PDF UUIDs in the network log.
5. Click the Download button via JS eval (bypasses overlay issues).
6. Poll the network log until a NEW R2 URL with a NEW UUID appears.
7. Curl the PDF to disk under temari-papers/<Subject>/<filename>.pdf
8. Extract text via pdftotext to <filename>.txt
9. Move on.

The script is resumable — if a .txt file already exists for a paper, it's skipped.
"""
import json
import re
import subprocess
import time
from pathlib import Path
from urllib.parse import unquote

ROOT = Path("/home/z/my-project")
PAPERS_JSON = ROOT / "scripts" / "temari-papers.json"
SESSION_JSON = ROOT / "scripts" / "temari-session2.json"  # new account session
OUT_DIR = ROOT / "scripts" / "temari-papers"
OUT_DIR.mkdir(parents=True, exist_ok=True)


def run_ab(*args: str, timeout: int = 30) -> str:
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
    except FileNotFoundError:
        return ""


def normalize_filename(text: str, paper_id: str) -> tuple[str, str]:
    subject = text.split(",")[0].strip().replace(" ", "_").replace("/", "-")
    safe = re.sub(r"[^A-Za-z0-9_\-]+", "_", text).strip("_")
    return subject, f"{safe}_{paper_id}"


def get_known_r2_uuids() -> set[str]:
    """Return the set of R2 PDF UUIDs seen so far in network log."""
    out = run_ab("network", "requests", "--filter", "r2.cloudflarestorage", timeout=15)
    return set(re.findall(r"/exam_paper/([a-f0-9\-]+)\.pdf", out))


def get_latest_r2_url_for_uuid(uuid: str) -> str | None:
    """Find the full signed URL for a specific UUID."""
    out = run_ab("network", "requests", "--filter", "r2.cloudflarestorage", timeout=15)
    # Full URL ends with .pdf?... (Document)
    pattern = rf"https://[^\s]+/exam_paper/{re.escape(uuid)}\.pdf\?[^\s]+"
    match = re.search(pattern, out)
    return match.group(0) if match else None


def dismiss_tour_dialog() -> None:
    """Dismiss any 'Show me around' / 'Not now' dialogs."""
    run_ab("eval", "Array.from(document.querySelectorAll('button')).filter(b=>b.textContent.trim()==='Not now').forEach(b=>b.click())", timeout=10)
    time.sleep(0.5)


def click_download_via_js() -> bool:
    """Click the 'Download the paper' button via JS (bypasses overlay blocking)."""
    out = run_ab(
        "eval",
        "var b=Array.from(document.querySelectorAll('button')).find(x=>x.textContent.trim()==='Download the paper');if(b){b.click();'CLICKED'}else{'NO_BTN'}",
        timeout=10,
    )
    return "CLICKED" in out


def get_recent_api_status() -> dict[str, int]:
    """Look at the most recent /api/v1/documents POSTs and return counts by status."""
    out = run_ab("network", "requests", "--filter", "api/v1/documents", timeout=15)
    statuses: dict[str, int] = {}
    # Lines look like: [HASH] POST https://api.temari.et/api/v1/documents (Fetch) 429
    for line in out.splitlines():
        m = re.search(r"POST https://api\.temari\.et/api/v1/documents.*?\)\s+(\d+)", line)
        if m:
            status = m.group(1)
            statuses[status] = statuses.get(status, 0) + 1
    return statuses


def wait_for_page_load() -> bool:
    """Wait until 'Download the paper' button text is visible on the page."""
    out = run_ab("wait", "--text", "Download the paper", "--timeout", "15000", timeout=20)
    return "Done" in out or "Download the paper" in out


def download_pdf(url: str, out_path: Path) -> bool:
    try:
        subprocess.run(
            ["curl", "-sL", "-o", str(out_path), url],
            check=True,
            timeout=60,
        )
        return out_path.exists() and out_path.stat().st_size > 1000
    except (subprocess.CalledProcessError, subprocess.TimeoutExpired):
        return False


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
        return txt_path.exists() and txt_path.stat().st_size > 0
    except (subprocess.CalledProcessError, subprocess.TimeoutExpired):
        return False


def main() -> None:
    with open(PAPERS_JSON) as f:
        raw = f.read()
    match = re.search(r"\[.*\]", raw, re.DOTALL)
    if not match:
        print("Could not parse paper list JSON")
        return
    papers = json.loads(match.group(0))

    print(f"Total papers to scrape: {len(papers)}")

    # Load saved session (cookies)
    if SESSION_JSON.exists():
        run_ab("state", "load", str(SESSION_JSON), timeout=15)

    success = 0
    skipped = 0
    failed: list[dict] = []

    for i, paper in enumerate(papers, 1):
        href = paper["href"]
        text = paper["text"]
        paper_id = href.rsplit("/", 1)[-1]
        subject, base_name = normalize_filename(text, paper_id)

        subj_dir = OUT_DIR / subject
        subj_dir.mkdir(parents=True, exist_ok=True)
        pdf_path = subj_dir / f"{base_name}.pdf"
        txt_path = subj_dir / f"{base_name}.txt"

        # Skip if already done (resumable)
        if txt_path.exists() and txt_path.stat().st_size > 100:
            print(f"[{i}/{len(papers)}] SKIP: {text}")
            skipped += 1
            continue

        url = f"https://temari.et{href}"
        print(f"[{i}/{len(papers)}] {text}")

        # Open paper detail page
        run_ab("open", url, timeout=20)
        if not wait_for_page_load():
            print(f"  ! Page didn't load (no Download button)")
            failed.append({"paper": text, "reason": "page load failed"})
            continue
        time.sleep(1.5)

        # Dismiss tour dialog
        dismiss_tour_dialog()

        # Snapshot known UUIDs before click
        known_before = get_known_r2_uuids()

        # Click Download via JS
        if not click_download_via_js():
            print(f"  ! Download button not found")
            failed.append({"paper": text, "reason": "no download button"})
            continue

        # Wait for new R2 URL — check API status for 429 backoff
        new_uuid = None
        new_url = None
        backoff = 0
        for attempt in range(25):  # up to 50s
            time.sleep(2 + backoff)
            # Check if API returned 429 (rate-limited)
            statuses = get_recent_api_status()
            if "429" in statuses and str(statuses.get("200", 0)) == "0":
                # Only backoff if no 200s yet for this click
                backoff = min(backoff + 3, 15)
                print(f"  . 429 rate-limited, backing off {backoff}s (attempt {attempt+1})")
                # Retry the click
                click_download_via_js()
                continue
            backoff = 0
            after = get_known_r2_uuids()
            new_uuids = after - known_before
            if new_uuids:
                new_uuid = next(iter(new_uuids))
                new_url = get_latest_r2_url_for_uuid(new_uuid)
                if new_url:
                    break

        if not new_url:
            print(f"  ! No new R2 URL captured (rate-limited?)")
            failed.append({"paper": text, "reason": "no R2 URL (likely rate limit)"})
            # Add a longer cooldown before next attempt
            time.sleep(15)
            continue

        # Download the PDF
        if not download_pdf(new_url, pdf_path):
            print(f"  ! PDF download failed")
            failed.append({"paper": text, "reason": "download failed"})
            continue

        # Extract text
        if not extract_text(pdf_path, txt_path):
            print(f"  ! Text extraction failed")
            failed.append({"paper": text, "reason": "extraction failed"})
            continue

        size_kb = txt_path.stat().st_size // 1024
        print(f"  OK  {pdf_path.name} ({size_kb} KB text, uuid={new_uuid[:8]}...)")
        success += 1

        # Gentle delay between papers to avoid hitting the rate limit
        time.sleep(6)

    print(f"\n=== Done: scraped={success}  skipped={skipped}  failed={len(failed)} ===")
    if failed:
        print(f"\nFailures:")
        for f in failed[:30]:
            print(f"  - {f['paper']}: {f['reason']}")


if __name__ == "__main__":
    main()
