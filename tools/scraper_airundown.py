"""
Tool: scraper_airundown.py
Layer: 3 - Execution
SOP: architecture/SOP-002-scraper-airundown.md

Scrapes The AI Rundown archive page for new issues not already in the payload.
Writes raw JSON to .tmp/airundown_raw.json
"""

import requests
import json
import os
import hashlib
import logging
import re
from bs4 import BeautifulSoup
from datetime import datetime, timezone

# ── Setup ──────────────────────────────────────────────────────────────────────
logging.basicConfig(level=logging.INFO, format="[AIRundown] %(levelname)s: %(message)s")
log = logging.getLogger(__name__)

ARCHIVE_URL = "https://theairundown.com/theairundown-archive.html"
OUTPUT_PATH = os.path.join(os.path.dirname(__file__), "..", ".tmp", "airundown_raw.json")
PAYLOAD_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "articles.json")

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                  "(KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}


# ── Helpers ────────────────────────────────────────────────────────────────────

def make_id(url: str) -> str:
    return hashlib.md5(url.encode()).hexdigest()


def load_existing_ids() -> set:
    """Load IDs already in the dashboard payload."""
    if not os.path.exists(PAYLOAD_PATH):
        return set()
    try:
        with open(PAYLOAD_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
        return {a["id"] for a in data.get("articles", [])}
    except Exception as e:
        log.warning(f"Could not load existing payload: {e}")
        return set()


# ── Main ───────────────────────────────────────────────────────────────────────

def scrape() -> list[dict]:
    log.info(f"Fetching archive: {ARCHIVE_URL}")
    existing_ids = load_existing_ids()
    articles = []
    now = datetime.now(timezone.utc).isoformat()

    try:
        response = requests.get(ARCHIVE_URL, headers=HEADERS, timeout=15)
        response.raise_for_status()
    except Exception as e:
        log.error(f"Failed to fetch archive: {e}")
        return []

    soup = BeautifulSoup(response.text, "html.parser")

    # Find all issue links — they follow pattern: theairundown-issueNN.html
    issue_links = soup.find_all("a", href=re.compile(r"theairundown-issue\d+\.html"))

    log.info(f"Found {len(issue_links)} issues on archive page")

    seen_urls = set()
    for link in issue_links:
        try:
            href = link.get("href", "")
            if not href:
                continue

            # Build absolute URL
            if href.startswith("http"):
                url = href
            else:
                url = "https://theairundown.com/" + href.lstrip("/")

            if url in seen_urls:
                continue
            seen_urls.add(url)

            article_id = make_id(url)

            # Skip if already in payload
            if article_id in existing_ids:
                log.debug(f"Skipping known issue: {url}")
                continue

            # Extract issue number from URL
            issue_match = re.search(r"issue(\d+)", url)
            issue_num = int(issue_match.group(1)) if issue_match else 0

            # Get text content from the link block
            block_text = link.get_text(" ", strip=True)

            # Try to extract title (usually the largest text in the block)
            # The block format: "NUMBER Status TITLE ⏱ Xmin read ➤ Y prompts Summary"
            lines = [l.strip() for l in block_text.split("  ") if l.strip()]
            title = f"Issue #{issue_num}"
            summary = ""

            # Parse title from block (after issue number and status badges)
            text_clean = re.sub(r"\d+\s+(Latest|Published|Previous|Free Preview|★ Start Here)\s*", "", block_text)
            text_clean = re.sub(r"⏱ \d+ min read", "", text_clean)
            text_clean = re.sub(r"➤ \d+ prompts", "", text_clean)
            text_clean = re.sub(r"Read Issue", "", text_clean).strip()

            parts = [p.strip() for p in re.split(r"\s{2,}", text_clean) if p.strip()]
            if parts:
                title = parts[0]
                summary = " ".join(parts[1:])[:400] if len(parts) > 1 else ""

            # Fetch the actual issue to get the og:image
            image_url = None
            try:
                issue_resp = requests.get(url, headers=HEADERS, timeout=10)
                if issue_resp.status_code == 200:
                    issue_soup = BeautifulSoup(issue_resp.text, "html.parser")
                    og_image = issue_soup.find("meta", property="og:image")
                    if og_image:
                        image_url = og_image.get("content")
            except Exception as e:
                log.warning(f"Could not fetch og:image for {url}: {e}")

            article = {
                "source": "The AI Rundown",
                "title": title,
                "url": url,
                "summary": summary or f"Issue #{issue_num} — An AI workflow deep dive from The AI Rundown.",
                "image_url": image_url,
                "published_at": now,
                "scraped_at": now,
                "id": article_id,
                "issue_num": issue_num,
            }
            articles.append(article)
            log.info(f"  ✓ [{issue_num}] {title[:65]}")

        except Exception as e:
            log.error(f"Failed parsing issue link: {e}")
            continue

    # Sort by issue number descending (newest first)
    articles.sort(key=lambda x: x.get("issue_num", 0), reverse=True)
    log.info(f"Scraped {len(articles)} new issues from The AI Rundown")
    return articles


def main():
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    articles = scrape()
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(articles, f, indent=2, ensure_ascii=False)
    log.info(f"Written to {OUTPUT_PATH}")
    return articles


if __name__ == "__main__":
    main()
