# ============================================================
# SOP-003: Aggregator & Payload Builder
# Inputs: .tmp/bensbites_raw.json, .tmp/airundown_raw.json
# Output: data/articles.json
# ============================================================

## Purpose
Merge scraped articles from all sources, deduplicate by URL hash (id),
sort by published_at descending, and write the final dashboard payload.

## Logic
1. Load .tmp/bensbites_raw.json and .tmp/airundown_raw.json
2. Load existing data/articles.json (if it exists)
3. Assign id = md5(url) for each new article
4. Merge new + existing articles
5. Deduplicate by id — keep newest scraped_at if duplicate
6. Sort by published_at descending
7. If no new articles found: DO NOT overwrite data/articles.json (RULE-009)
8. Write merged payload to data/articles.json with updated meta block

## Deduplication Rule
- id = hashlib.md5(url.encode()).hexdigest()
- If same id appears in existing + new: use existing (preserve bookmarked/read state)

## Payload Builder
- Merges articles array
- Updates meta.last_refreshed = now ISO8601
- Updates meta.total_articles = len(articles)
- Updates meta.sources_scraped = list of sources that returned data

## Error Handling
- If either raw file is empty/missing: skip that source, continue
- If data/articles.json is malformed: back up to .tmp/ and start fresh
