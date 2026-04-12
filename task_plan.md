# task_plan.md — Phase Tracker & Checklist

> Living document. Updated as phases progress.

---

## 🗺️ B.L.A.S.T. Phase Map

| Phase | Name | Status | Owner |
|-------|------|--------|-------|
| 0 | Initialization | 🟡 In Progress | System Pilot |
| 1 | Blueprint | ⬜ Pending | System Pilot |
| 2 | Link | ⬜ Pending | System Pilot |
| 3 | Architect | ⬜ Pending | System Pilot |
| 4 | Stylize | ⬜ Pending | System Pilot |
| 5 | Trigger | ⬜ Pending | System Pilot |

---

## ✅ Phase 0: Initialization

- [x] Create `gemini.md` (Project Constitution)
- [x] Create `task_plan.md` (this file)
- [x] Create `findings.md`
- [x] Create `progress.md`
- [ ] **BLOCKED:** Discovery Questions answered by user
- [ ] Data Schema confirmed in `gemini.md`
- [ ] Blueprint approved → unlock Phase 2+

---

## ⬜ Phase 1: Blueprint

- [ ] North Star confirmed
- [ ] Integrations + API keys identified
- [ ] Source of truth defined
- [ ] Delivery payload format confirmed
- [ ] Behavioral rules locked in `gemini.md`
- [ ] Research done (GitHub repos, libraries)
- [ ] `PLAN.md` written and approved

---

## ⬜ Phase 2: Link

- [ ] `.env` file created with all secrets
- [ ] Minimal test script for each external service
- [ ] All connections verified as live

---

## ⬜ Phase 3: Architect (A.N.T. 3 Layers)

- [ ] `architecture/` SOPs written (Layer 1)
- [ ] Navigation/routing logic defined (Layer 2)
- [ ] `tools/` Python scripts built (Layer 3)
  - [ ] `tools/scraper_bens_bites.py`
  - [ ] `tools/scraper_ai_rundown.py`
  - [ ] `tools/scraper_reddit.py`
  - [ ] `tools/aggregator.py`
  - [ ] `tools/payload_builder.py`

---

## ⬜ Phase 4: Stylize

- [ ] Dashboard HTML/CSS built
- [ ] Glassmorphism dark theme applied
- [ ] Bookmark & read state functional
- [ ] User feedback collected

---

## ⬜ Phase 5: Trigger

- [ ] Scheduler/cron configured (24-hour refresh)
- [ ] Production deployment complete
- [ ] `gemini.md` Maintenance Log updated
