# gemini.md — Project Constitution
> **This file is law.** Only update when: a schema changes, a rule is added, or architecture is modified.

---

## 🧭 Project Identity

- **Project Name:** B.L.A.S.T. News Dashboard
- **System Pilot:** Antigravity (Gemini)
- **Protocol:** B.L.A.S.T. + A.N.T. 3-Layer Architecture
- **Status:** 🟡 Phase 1 — Blueprint Awaiting Approval

---

## 🏗️ Architecture Overview

```
├── gemini.md          # Project Constitution (THIS FILE)
├── .env               # API Keys/Secrets (none for Phase 1)
├── requirements.txt   # Python dependencies
├── architecture/      # Layer 1: SOPs (Markdown)
├── tools/             # Layer 3: Python Scripts
├── data/              # Live payload + bookmarks
└── .tmp/              # Temporary Workbench (ephemeral)
```

---

## 📐 Data Schema — LOCKED ✅

### Raw Input Schema (per article, per source)
```json
{
  "source":       "string",        // "Ben's Bites" | "The AI Rundown"
  "title":        "string",
  "url":          "string",
  "summary":      "string",
  "image_url":    "string (optional)",
  "published_at": "ISO8601 string",
  "scraped_at":   "ISO8601 string"
}
```

### Output Schema: `data/articles.json` (Dashboard Payload)
```json
{
  "articles": [
    {
      "id":           "string (md5 hash of url)",
      "source":       "string",
      "title":        "string",
      "url":          "string",
      "summary":      "string",
      "image_url":    "string (optional)",
      "published_at": "ISO8601 string",
      "bookmarked":   false,
      "read":         false
    }
  ],
  "meta": {
    "last_refreshed":  "ISO8601 string",
    "total_articles":  0,
    "sources_scraped": ["Ben's Bites", "The AI Rundown"]
  }
}
```

### Persistence: `data/bookmarks.json`
```json
{
  "bookmarked_ids": ["string (id)"],
  "read_ids":       ["string (id)"]
}
```

---

## 📏 Behavioral Rules — LOCKED ✅

1. **RULE-001:** Tools in `tools/` must be atomic and independently testable.
2. **RULE-002:** No secrets are ever hardcoded. All credentials go in `.env`.
3. **RULE-003:** All intermediate files go in `.tmp/`. Never in root.
4. **RULE-004:** If a scraper fails, log the error and continue. Never crash the whole pipeline.
5. **RULE-005:** The dashboard payload (`data/articles.json`) must always be valid JSON.
6. **RULE-006:** No duplicate articles. Deduplication is by URL hash (`id` field).
7. **RULE-007:** Only articles published within the last 24 hours are shown (Ben's Bites). The AI Rundown issues are shown if they are new (not in existing payload).
8. **RULE-008:** Bookmarks must survive page refresh. Phase 1: localStorage. Phase 2: Supabase.
9. **RULE-009:** If no new data is found in a scrape, do not overwrite `data/articles.json`. Preserve existing data.
10. **RULE-010:** The pipeline runs every 24 hours. Manual trigger via "Refresh Now" button is also available.

---

## 🔗 Integrations — LOCKED ✅

| Service | Method | URL | Key Status |
|---------|--------|-----|------------|
| Ben's Bites | RSS Feed via `feedparser` | `https://www.bensbites.com/feed` | ✅ No key needed |
| The AI Rundown | HTML scrape via `requests` + `BeautifulSoup` | `https://theairundown.com/theairundown-archive.html` | ✅ No key needed |
| Reddit | `praw` library | Reddit API | ⏳ Phase 2 |
| Supabase | `supabase-py` | TBD | ⏳ Phase 2 |

---

## 🗂️ Maintenance Log

| Date | Change | Author |
|------|--------|--------|
| 2026-04-13 | Constitution initialized — Protocol 0 | System Pilot |
| 2026-04-13 | Schema LOCKED after Discovery Q&A. Rules LOCKED. Integrations LOCKED. Status → Phase 1 Blueprint Pending Approval | System Pilot |
