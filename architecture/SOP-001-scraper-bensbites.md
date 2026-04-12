# ============================================================
# SOP-001: Ben's Bites Scraper
# Source: https://www.bensbites.com/feed (Substack RSS)
# Method: feedparser
# Output: .tmp/bensbites_raw.json
# Filter: Only items published within the last 24 hours
# ============================================================

## Purpose
Collect the latest AI news articles from Ben's Bites newsletter via their
public Substack RSS feed. Filter to last-24-hour articles only.

## Inputs
- RSS Feed URL: https://www.bensbites.com/feed

## Outputs
- .tmp/bensbites_raw.json (array of raw article objects)

## Logic
1. Fetch RSS feed via feedparser
2. For each entry, parse: title, link, summary, published date
3. Convert published date to ISO8601
4. Filter: only include if published_at >= now - 24h
5. Write array to .tmp/bensbites_raw.json

## Error Handling
- If feed fetch fails: log error, write empty array to .tmp/bensbites_raw.json
- If a single entry fails to parse: log and skip it
- NEVER crash the process

## Edge Cases
- Substack RSS may include sponsor content: include as-is (dashboard can filter)
- Published date may be in various formats: use feedparser's parsed time struct
- Summary may contain HTML: strip to plain text
