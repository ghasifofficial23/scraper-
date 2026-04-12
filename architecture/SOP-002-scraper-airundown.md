# ============================================================
# SOP-002: The AI Rundown Scraper
# Source: https://theairundown.com/theairundown-archive.html
# Method: requests + BeautifulSoup
# Output: .tmp/airundown_raw.json
# Filter: Only issues not already present in data/articles.json
# ============================================================

## Purpose
Collect issue listings from The AI Rundown's archive page.
Each issue is a deep-dive workflow guide published ~weekly.
These are treated as "Deep Dive" content, not daily news.

## Inputs
- Archive URL: https://theairundown.com/theairundown-archive.html

## Outputs
- .tmp/airundown_raw.json (array of raw article objects)

## Logic
1. GET the archive HTML page
2. Parse all issue cards: issue number, title, read-time, summary, URL
3. Construct published_at as today's date for latest issue (archive has no dates)
4. Load existing data/articles.json to get known IDs
5. Only include issues where URL hash is NOT already in existing payload
6. Write array to .tmp/airundown_raw.json

## Error Handling
- If page fetch fails (non-200): log error, write empty array
- If parsing fails on a card: log and skip
- NEVER crash the process

## Edge Cases
- Archive page has no publish dates: use scrape date with issue number as proxy
- Page may add anti-scraping headers: use a browser-like User-Agent
