"""
Tool: scraper_reddit.py
Layer: 3 - Execution

Scrapes top posts from r/ArtificialInteligence for the last 24 hours.
Writes raw JSON to .tmp/reddit_raw.json
"""

import requests
import json
import os
import hashlib
import logging
from datetime import datetime, timezone

logging.basicConfig(level=logging.INFO, format="[Reddit] %(levelname)s: %(message)s")
log = logging.getLogger(__name__)

URL = "https://www.reddit.com/r/ArtificialInteligence/top/.json?limit=10&t=day"
OUTPUT_PATH = os.path.join(os.path.dirname(__file__), "..", ".tmp", "reddit_raw.json")

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
}

def make_id(url: str) -> str:
    return hashlib.md5(url.encode()).hexdigest()

def scrape() -> list[dict]:
    log.info(f"Fetching Reddit: {URL}")
    articles = []

    try:
        response = requests.get(URL, headers=HEADERS, timeout=15)
        response.raise_for_status()
        data = response.json()
    except Exception as e:
        log.error(f"Failed to fetch Reddit: {e}")
        return []

    posts = data.get("data", {}).get("children", [])
    log.info(f"Loaded {len(posts)} posts from Reddit")

    for post in posts:
        post_data = post.get("data", {})
        title = post_data.get("title", "")
        permalink = post_data.get("permalink", "")
        if not permalink:
            continue

        url = f"https://www.reddit.com{permalink}"
        selftext = post_data.get("selftext", "")
        
        # Summary caps at 400 chars. If empty, use url or short desc
        summary = selftext[:400] + ("..." if len(selftext) > 400 else "")
        if not summary:
            summary = "A top daily discussion from r/ArtificialInteligence."

        # Fetch thumbnail or preview image if available
        image_url = None
        if post_data.get("thumbnail") and post_data["thumbnail"].startswith("http"):
            image_url = post_data["thumbnail"]
        elif "preview" in post_data and post_data["preview"].get("images"):
            try:
                # reddit API HTML encodes the ampersands in image urls
                image_url = post_data["preview"]["images"][0]["source"]["url"].replace("&amp;", "&")
            except Exception:
                pass

        pub_ts = post_data.get("created_utc", 0)
        pub_dt = datetime.fromtimestamp(pub_ts, tz=timezone.utc) if pub_ts else datetime.now(timezone.utc)
        now = datetime.now(timezone.utc).isoformat()

        article = {
            "source": "Reddit",
            "title": title,
            "url": url,
            "summary": summary,
            "image_url": image_url,
            "published_at": pub_dt.isoformat(),
            "scraped_at": now,
            "id": make_id(url),
        }
        articles.append(article)
        log.info(f"  ✓ {title[:65]}")

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
