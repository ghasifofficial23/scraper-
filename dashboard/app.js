/**
 * B.L.A.S.T. Dashboard — app.js
 * Reads: ../data/articles.json
 * Persists: localStorage (bookmarks & read state)
 *
 * Architecture:
 *   State  → single source of truth object
 *   Render → pure function from state
 *   Events → mutate state → re-render
 */

'use strict';

// ═══════════════════════════════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════════════════════════════

const DATA_PATH = '/data/articles.json';
const API_REFRESH = 'http://localhost:5050/api/refresh';
const REFRESH_HOURS = 24;
const LS_BOOKMARKS = 'blast_bookmarks';
const LS_READ      = 'blast_read';
const LS_LAST_AUTO = 'blast_last_auto_refresh';

// ═══════════════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════════════

const state = {
  articles:      [],
  meta:          {},
  bookmarked:    new Set(),
  read:          new Set(),
  sourceFilter:  'all',      // 'all' | "Ben's Bites" | "The AI Rundown" | 'Reddit' | 'bookmarked'
  readFilter:    'all',      // 'all' | 'unread' | 'read'
  searchQuery:   '',
  loaded:        false,
};

// ═══════════════════════════════════════════════════════════════════
// PERSISTENCE — localStorage
// ═══════════════════════════════════════════════════════════════════

function loadLS() {
  try {
    const bm = JSON.parse(localStorage.getItem(LS_BOOKMARKS) || '[]');
    const rd = JSON.parse(localStorage.getItem(LS_READ) || '[]');
    state.bookmarked = new Set(bm);
    state.read       = new Set(rd);
  } catch { /* ignore */ }
}

function saveLS() {
  localStorage.setItem(LS_BOOKMARKS, JSON.stringify([...state.bookmarked]));
  localStorage.setItem(LS_READ,       JSON.stringify([...state.read]));
}

// ═══════════════════════════════════════════════════════════════════
// DATA LOADING
// ═══════════════════════════════════════════════════════════════════

async function loadData() {
  try {
    const r = await fetch(DATA_PATH + '?t=' + Date.now());
    if (!r.ok) throw new Error('Failed to load articles.json');
    const data = await r.json();
    state.articles = data.articles || [];
    state.meta     = data.meta     || {};
    state.loaded   = true;
    updateStats();
    updateRefreshLabel();
    render();
  } catch (err) {
    showToast('Could not load data. Is the dashboard in the right folder?', 'error');
    console.error(err);
  }
}

// ═══════════════════════════════════════════════════════════════════
// FILTERING
// ═══════════════════════════════════════════════════════════════════

function getVisibleArticles() {
  let list = state.articles;

  // Source / bookmark filter
  if (state.sourceFilter === 'bookmarked') {
    list = list.filter(a => state.bookmarked.has(a.id));
  } else if (state.sourceFilter !== 'all') {
    list = list.filter(a => a.source === state.sourceFilter);
  }

  // Read filter
  if (state.readFilter === 'unread') {
    list = list.filter(a => !state.read.has(a.id));
  } else if (state.readFilter === 'read') {
    list = list.filter(a => state.read.has(a.id));
  }

  // Search
  const q = state.searchQuery.toLowerCase().trim();
  if (q) {
    list = list.filter(a =>
      (a.title  || '').toLowerCase().includes(q) ||
      (a.summary || '').toLowerCase().includes(q)
    );
  }

  return list;
}

// ═══════════════════════════════════════════════════════════════════
// RENDER
// ═══════════════════════════════════════════════════════════════════

function render() {
  const visible = getVisibleArticles();
  const mainContent = document.getElementById('main-content');
  const emptyState  = document.getElementById('empty-state');

  const bbArticles = visible.filter(a => a.source === "Ben's Bites");
  const arArticles = visible.filter(a => a.source === "The AI Rundown");
  const rdArticles = visible.filter(a => a.source === "Reddit");

  // Show/hide columns based on source filter
  const colNews   = document.getElementById('col-news');
  const colDives  = document.getElementById('col-dives');
  const colReddit = document.getElementById('col-reddit');

  if (visible.length === 0 && state.loaded) {
    emptyState.style.display   = 'flex';
    colNews.style.display    = 'none';
    colDives.style.display   = 'none';
    colReddit.style.display  = 'none';
  } else {
    emptyState.style.display = 'none';

    if (state.sourceFilter === 'all' || state.sourceFilter === "Ben's Bites" || state.sourceFilter === 'bookmarked') {
      colNews.style.display = 'flex';
      renderList('bb-list', bbArticles);
      document.getElementById('bb-count').textContent = bbArticles.length;
    } else {
      colNews.style.display = 'none';
    }

    if (state.sourceFilter === 'all' || state.sourceFilter === "The AI Rundown" || state.sourceFilter === 'bookmarked') {
      colDives.style.display = 'flex';
      renderList('ar-list', arArticles);
      document.getElementById('ar-count').textContent = arArticles.length;
    } else {
      colDives.style.display = 'none';
    }

    if (state.sourceFilter === 'all' || state.sourceFilter === "Reddit" || state.sourceFilter === 'bookmarked') {
      if (colReddit) colReddit.style.display = 'flex';
      renderList('rd-list', rdArticles);
      const rdCount = document.getElementById('rd-count');
      if (rdCount) rdCount.textContent = rdArticles.length;
    } else {
      if (colReddit) colReddit.style.display = 'none';
    }
  }

  updateStats();
}

function renderList(listId, articles) {
  const el = document.getElementById(listId);
  if (!articles.length) {
    el.innerHTML = `<div class="article-card" style="opacity:0.4;padding:32px 24px;text-align:center;">
      <p style="font-size:10px;letter-spacing:0.16em;color:#555">NO ARTICLES IN THIS VIEW</p>
    </div>`;
    return;
  }

  el.innerHTML = articles.map(a => buildCard(a)).join('');
}

function buildCard(article) {
  const isBookmarked = state.bookmarked.has(article.id);
  const isRead       = state.read.has(article.id);
  const isNew        = !isRead;

  const sourceClass = article.source === "Ben's Bites" ? 'source-bb' : article.source === "The AI Rundown" ? 'source-ar' : 'source-rd';
  const sourceLabel = article.source === "Ben's Bites" ? 'BB' : article.source === "The AI Rundown" ? 'AR' : 'RD';

  const pubDate = article.published_at
    ? formatDate(article.published_at)
    : '';

  const issueNum = article.issue_num
    ? `<span class="card-issue">ISSUE #${article.issue_num}</span>`
    : '';

  const titleEscaped = escHtml(article.title || 'Untitled');
  const summaryEscaped = escHtml(article.summary || '');

  return `
<div class="article-card ${isBookmarked ? 'is-bookmarked' : ''} ${isRead ? 'is-read' : 'is-new'}"
     data-id="${escHtml(article.id)}" id="card-${escHtml(article.id)}">
  <div class="card-meta">
    <span class="card-source ${sourceClass}">${sourceLabel}</span>
    <span class="card-date">${pubDate}</span>
    ${issueNum}
  </div>
  <h3 class="card-title">${titleEscaped}</h3>
  ${summaryEscaped ? `<p class="card-summary">${summaryEscaped}</p>` : ''}
  <div class="card-actions">
    <a href="${escHtml(article.url)}" target="_blank" rel="noopener"
       class="card-btn" onclick="markRead('${escHtml(article.id)}')">
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
        <path d="M1 5H9M5 1L9 5L5 9" stroke="currentColor" stroke-width="1.2" stroke-linecap="square"/>
      </svg>
      READ
    </a>
    <button class="card-btn btn-read" onclick="toggleRead('${escHtml(article.id)}')"
            title="${isRead ? 'Mark unread' : 'Mark as read'}">
      ${isRead ? '✓ READ' : 'MARK READ'}
    </button>
    <button class="card-bookmark ${isBookmarked ? 'bookmarked' : ''}"
            onclick="toggleBookmark('${escHtml(article.id)}')"
            title="${isBookmarked ? 'Remove bookmark' : 'Save article'}">
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M2 2H12V13L7 10L2 13V2Z"
              stroke="${isBookmarked ? '#BFF549' : '#555'}"
              stroke-width="1.2"
              fill="${isBookmarked ? '#BFF549' : 'none'}"
              stroke-linecap="square"/>
      </svg>
    </button>
  </div>
</div>`;
}

// ═══════════════════════════════════════════════════════════════════
// ACTIONS
// ═══════════════════════════════════════════════════════════════════

function toggleBookmark(id) {
  if (state.bookmarked.has(id)) {
    state.bookmarked.delete(id);
    showToast('Bookmark removed', 'info');
  } else {
    state.bookmarked.add(id);
    showToast('Article saved ✓', 'success');
  }
  saveLS();
  render();
  updateStats();
}

function toggleRead(id) {
  if (state.read.has(id)) {
    state.read.delete(id);
  } else {
    state.read.add(id);
  }
  saveLS();
  render();
  updateStats();
}

function markRead(id) {
  state.read.add(id);
  saveLS();
  // Update card DOM directly for instant feedback
  const card = document.getElementById('card-' + id);
  if (card) {
    card.classList.add('is-read');
    card.classList.remove('is-new');
  }
  updateStats();
}

// ═══════════════════════════════════════════════════════════════════
// STATS
// ═══════════════════════════════════════════════════════════════════

function updateStats() {
  const all = state.articles;
  document.getElementById('stat-total').textContent  = all.length;
  document.getElementById('stat-bb').textContent     = all.filter(a => a.source === "Ben's Bites").length;
  document.getElementById('stat-ar').textContent     = all.filter(a => a.source === "The AI Rundown").length;
  const statRd = document.getElementById('stat-rd');
  if (statRd) statRd.textContent = all.filter(a => a.source === "Reddit").length;
  document.getElementById('stat-bm').textContent     = state.bookmarked.size;
  document.getElementById('stat-unread').textContent = all.filter(a => !state.read.has(a.id)).length;
  document.getElementById('bb-count').textContent    = all.filter(a => a.source === "Ben's Bites").length;
  document.getElementById('ar-count').textContent    = all.filter(a => a.source === "The AI Rundown").length;
  const rdCount = document.getElementById('rd-count');
  if (rdCount) rdCount.textContent = all.filter(a => a.source === "Reddit").length;
}

// ═══════════════════════════════════════════════════════════════════
// REFRESH
// ═══════════════════════════════════════════════════════════════════

async function triggerRefresh() {
  const btn = document.getElementById('btn-refresh');
  btn.classList.add('spinning');
  document.getElementById('loading-overlay').classList.add('active');

  try {
    const res = await fetch(API_REFRESH, { method: 'POST' });
    if (res.ok) {
      showToast('Pipeline complete. Reloading…', 'success');
      await new Promise(r => setTimeout(r, 800));
      await loadData();
      localStorage.setItem(LS_LAST_AUTO, Date.now().toString());
    } else {
      showToast('Refresh failed. Is run_pipeline.py --serve running?', 'error');
    }
  } catch {
    // Flask not running — reload JSON anyway (manual pipeline may have been run)
    showToast('API offline. Reloading data from disk…', 'info');
    await loadData();
  } finally {
    btn.classList.remove('spinning');
    document.getElementById('loading-overlay').classList.remove('active');
  }
}

function updateRefreshLabel() {
  const meta = state.meta;
  const label = document.getElementById('refresh-label');
  const dot   = document.getElementById('refresh-dot');

  if (!meta.last_refreshed) {
    label.textContent = 'Never refreshed';
    dot.classList.add('stale');
    return;
  }

  const last = new Date(meta.last_refreshed);
  const diffH = (Date.now() - last.getTime()) / 3600000;
  const diffStr = diffH < 1
    ? 'Just now'
    : diffH < 24
      ? `${Math.floor(diffH)}h ago`
      : `${Math.floor(diffH / 24)}d ago`;

  label.textContent = `Updated ${diffStr}`;

  if (diffH > REFRESH_HOURS) {
    dot.classList.add('stale');
    showToast('Feed is over 24h old. Click Refresh to get latest.', 'info');
  } else {
    dot.classList.remove('stale');
  }
}

function checkAutoRefresh() {
  const last = parseInt(localStorage.getItem(LS_LAST_AUTO) || '0', 10);
  const diffH = (Date.now() - last) / 3600000;
  if (diffH >= REFRESH_HOURS) {
    // Don't auto-trigger full pipeline (needs server), just flag
    updateRefreshLabel();
  }
}

// ═══════════════════════════════════════════════════════════════════
// FILTERS
// ═══════════════════════════════════════════════════════════════════

function setSourceFilter(val) {
  state.sourceFilter = val;
  document.querySelectorAll('.nav-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.filter === val);
  });
  render();
}

function setReadFilter(val) {
  state.readFilter = val;
  document.querySelectorAll('.filter-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.readFilter === val);
  });
  render();
}

// ═══════════════════════════════════════════════════════════════════
// UTILS
// ═══════════════════════════════════════════════════════════════════

function formatDate(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch { return ''; }
}

function escHtml(str) {
  return String(str)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&#x27;');
}

let _toastTimer = null;
function showToast(msg, type = 'info') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `toast toast-${type} show`;
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => { t.classList.remove('show'); }, 3200);
}

// ═══════════════════════════════════════════════════════════════════
// EVENT BINDINGS
// ═══════════════════════════════════════════════════════════════════

function bindEvents() {
  // Nav source filter
  document.querySelectorAll('.nav-btn').forEach(btn => {
    // Only bind to filters that actually filter, avoid board view link
    if (btn.hasAttribute('data-filter')) {
      btn.addEventListener('click', () => setSourceFilter(btn.dataset.filter));
    }
  });

  // Read filter
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => setReadFilter(btn.dataset.readFilter));
  });

  // Search
  const searchInput = document.getElementById('search-input');
  let searchTimer;
  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      state.searchQuery = searchInput.value;
      render();
    }, 250);
  });

  // Refresh button
  document.getElementById('btn-refresh').addEventListener('click', triggerRefresh);
}

// ═══════════════════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════════════════

async function init() {
  loadLS();
  bindEvents();
  await loadData();
  checkAutoRefresh();
}

// Expose for inline onclick handlers
window.toggleBookmark = toggleBookmark;
window.toggleRead     = toggleRead;
window.markRead       = markRead;

document.addEventListener('DOMContentLoaded', init);
