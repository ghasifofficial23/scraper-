"""
Tool: scraper_bensbites.py
Layer: 3 - Execution
SOP: architecture/SOP-001-scraper-bensbites.md

Fetches the Ben's Bites Substack RSS feed and extracts articles
published within the last 24 hours. Writes raw JSON to .tmp/bensbites_raw.json
"""

import feedparser
import json
import os
import re
import hashlib
import logging
from datetime import datetime, timezone, timedelta
from email.utils import parsedate_to_datetime

# ── Setup ──────────────────────────────────────────────────────────────────────
logging.basicConfig(level=logging.INFO, format="[BensBites] %(levelname)s: %(message)s")
log = logging.getLogger(__name__)

FEED_URL = "https://www.bensbites.com/feed"
OUTPUT_PATH = os.path.join(os.path.dirname(__file__), "..", ".tmp", "bensbites_raw.json")
CUTOFF_HOURS = 168  # 7 days — Ben's Bites publishes every 2-3 days, not daily

# ── Helpers ────────────────────────────────────────────────────────────────────

def strip_html(text: str) -> str:
    """Remove HTML tags and collapse whitespace."""
    if not text:
        return ""
    clean = re.sub(r"<[^>]+>", " ", text)
    clean = re.sub(r"\s+", " ", clean).strip()
    return clean[:600]  # Cap summary length


def parse_date(entry) -> datetime | None:
    """Parse feedparser published_parsed or published string."""
    try:
        if entry.get("published_parsed"):
            import time
            ts = time.mktime(entry.published_parsed)
            return datetime.fromtimestamp(ts, tz=timezone.utc)
        if entry.get("published"):
            return parsedate_to_datetime(entry.published).astimezone(timezone.utc)
    except Exception as e:
        log.warning(f"Could not parse date: {e}")
    return None


def make_id(url: str) -> str:
    return hashlib.md5(url.encode()).hexdigest()


# ── Main ───────────────────────────────────────────────────────────────────────

def scrape() -> list[dict]:
    log.info(f"Fetching feed: {FEED_URL}")
    cutoff = datetime.now(timezone.utc) - timedelta(hours=CUTOFF_HOURS)
    articles = []

    try:
        feed = feedparser.parse(FEED_URL)
    except Exception as e:
        log.error(f"Failed to fetch feed: {e}")
        return []

    if feed.bozo:
        log.warning(f"Feed parse warning: {feed.bozo_exception}")

    log.info(f"Feed returned {len(feed.entries)} entries")

    for entry in feed.entries:
        try:
            url = entry.get("link", "")
            if not url:
                continue

            pub_dt = parse_date(entry)
            if pub_dt and pub_dt < cutoff:
                log.debug(f"Skipping old entry: {entry.get('title', '')[:60]}")
                continue

            summary_raw = entry.get("summary", "") or entry.get("content", [{}])[0].get("value", "")
            summary = strip_html(summary_raw)

            # Try to find imageUrl
            image_url = None
            if hasattr(entry, "media_content") and entry.media_content:
                image_url = entry.media_content[0].get("url")
            elif hasattr(entry, "enclosures") and entry.enclosures:
                image_url = entry.enclosures[0].get("href")
            else:
                img_match = re.search(r'<img[^>]+src="([^">]+)"', summary_raw)
                if img_match:
                    image_url = img_match.group(1)

            article = {
                "source": "Ben's Bites",
                "title": strip_html(entry.get("title", "Untitled")),
                "url": url,
                "summary": summary,
                "image_url": image_url,
                "published_at": pub_dt.isoformat() if pub_dt else datetime.now(timezone.utc).isoformat(),
                "scraped_at": datetime.now(timezone.utc).isoformat(),
                "id": make_id(url),
            }
            articles.append(article)
            log.info(f"  ✓ {article['title'][:70]}")

        except Exception as e:
            log.error(f"Failed to parse entry: {e}")
            continue

    log.info(f"Scraped {len(articles)} articles from Ben's Bites (last {CUTOFF_HOURS}h)")
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
