"""
Tool: aggregator.py
Layer: 3 - Execution
SOP: architecture/SOP-003-aggregator.md

Merges raw scraper outputs, deduplicates by URL hash (id),
preserves existing bookmarked/read state, and produces
the final data/articles.json dashboard payload.
"""

import json
import os
import hashlib
import logging
import shutil
from datetime import datetime, timezone

# ── Setup ──────────────────────────────────────────────────────────────────────
logging.basicConfig(level=logging.INFO, format="[Aggregator] %(levelname)s: %(message)s")
log = logging.getLogger(__name__)

BASE = os.path.dirname(__file__)
TMP = os.path.join(BASE, "..", ".tmp")
DATA = os.path.join(BASE, "..", "frontend", "public", "data")
PAYLOAD_PATH = os.path.join(DATA, "articles.json")
BOOKMARKS_PATH = os.path.join(DATA, "bookmarks.json")

SOURCES = [
    os.path.join(TMP, "bensbites_raw.json"),
    os.path.join(TMP, "airundown_raw.json"),
    os.path.join(TMP, "reddit_raw.json"),
]


# ── Helpers ────────────────────────────────────────────────────────────────────

def load_json(path: str, default):
    if not os.path.exists(path):
        return default
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        log.warning(f"Could not load {path}: {e}")
        return default


def load_bookmarks() -> dict:
    return load_json(BOOKMARKS_PATH, {"bookmarked_ids": [], "read_ids": []})


def backup_payload():
    if os.path.exists(PAYLOAD_PATH):
        backup = PAYLOAD_PATH.replace(".json", "_backup.json")
        shutil.copy(PAYLOAD_PATH, backup)
        log.info(f"Backed up payload to {backup}")


# ── Main ───────────────────────────────────────────────────────────────────────

def aggregate() -> dict:
    os.makedirs(DATA, exist_ok=True)

    # Load existing payload
    existing_payload = load_json(PAYLOAD_PATH, {"articles": [], "meta": {}})
    existing_articles = {a["id"]: a for a in existing_payload.get("articles", [])}

    # Load bookmarks for state preservation
    bookmarks = load_bookmarks()
    bookmarked_ids = set(bookmarks.get("bookmarked_ids", []))
    read_ids = set(bookmarks.get("read_ids", []))

    # Collect new articles from raw files
    new_articles = []
    sources_scraped = []

    for source_path in SOURCES:
        raw = load_json(source_path, [])
        if raw:
            source_name = raw[0].get("source", "Unknown") if raw else "Unknown"
            sources_scraped.append(source_name)
            new_articles.extend(raw)
            log.info(f"Loaded {len(raw)} articles from {source_path}")
        else:
            log.warning(f"No articles from {source_path} — skipping")

    if not new_articles:
        log.warning("No new articles found. Preserving existing payload (RULE-009).")
        return existing_payload

    # Merge: new articles take priority for metadata; existing state (bookmarked/read) preserved
    merged = dict(existing_articles)  # start with existing

    added_count = 0
    for article in new_articles:
        aid = article.get("id") or hashlib.md5(article["url"].encode()).hexdigest()
        article["id"] = aid

        if aid not in merged:
            # Brand new article
            article["bookmarked"] = aid in bookmarked_ids
            article["read"] = aid in read_ids
            merged[aid] = article
            added_count += 1
        else:
            # Already known — preserve user state, update metadata
            existing = merged[aid]
            article["bookmarked"] = existing.get("bookmarked", False) or (aid in bookmarked_ids)
            article["read"] = existing.get("read", False) or (aid in read_ids)
            merged[aid] = article

    log.info(f"Added {added_count} new articles. Total: {len(merged)}")

    # Sort by published_at descending
    sorted_articles = sorted(
        merged.values(),
        key=lambda a: a.get("published_at", ""),
        reverse=True,
    )

    # Build payload
    payload = {
        "articles": sorted_articles,
        "meta": {
            "last_refreshed": datetime.now(timezone.utc).isoformat(),
            "total_articles": len(sorted_articles),
            "sources_scraped": list(set(sources_scraped)),
        }
    }

    return payload


def main():
    payload = aggregate()
    backup_payload()

    with open(PAYLOAD_PATH, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2, ensure_ascii=False)

    log.info(f"✅ Payload written: {len(payload['articles'])} articles → {PAYLOAD_PATH}")
    return payload


if __name__ == "__main__":
    main()
