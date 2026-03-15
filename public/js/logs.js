/**
 * logs.js – Fetches and renders scan logs.
 */

(function () {
  'use strict';

  // ── Auth guard ────────────────────────────────────────────────────────────
  async function checkAuth() {
    const res = await fetch('/api/auth/me');
    if (!res.ok) window.location.href = '/login.html';
  }
  checkAuth();

  // ── Logout ────────────────────────────────────────────────────────────────
  document.getElementById('logoutBtn').addEventListener('click', async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login.html';
  });

  // ── Element refs ──────────────────────────────────────────────────────────
  const logsLoading  = document.getElementById('logsLoading');
  const logsEmpty    = document.getElementById('logsEmpty');
  const tableWrap    = document.getElementById('tableWrap');
  const logsBody     = document.getElementById('logsBody');
  const searchInput  = document.getElementById('searchInput');

  // ── Fetch logs ────────────────────────────────────────────────────────────
  async function fetchLogs(search = '') {
    logsLoading.style.display = 'block';
    logsEmpty.style.display   = 'none';
    tableWrap.style.display   = 'none';

    try {
      const url = search ? `/api/logs?search=${encodeURIComponent(search)}` : '/api/logs';
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch logs');
      const logs = await res.json();
      renderLogs(logs);
    } catch (err) {
      logsLoading.innerHTML = `<p style="color:var(--color-danger)">Error: ${err.message}</p>`;
    }
  }

  // ── Render logs into table ────────────────────────────────────────────────
  function renderLogs(logs) {
    logsLoading.style.display = 'none';

    if (!logs.length) {
      logsEmpty.style.display = 'block';
      return;
    }

    logsBody.innerHTML = logs.map((log) => `
      <tr>
        <td>${formatDate(log.scannedAt)}</td>
        <td><code>${escHtml(log.code)}</code></td>
        <td>${escHtml(log.name || '—')}</td>
        <td>${escHtml(log.email || '—')}</td>
        <td>${escHtml(log.scannedByName)}</td>
        <td>
          <span class="badge badge-${log.status}">
            ${log.status === 'success' ? 'Success' : 'Failed'}
          </span>
        </td>
      </tr>
    `).join('');

    tableWrap.style.display = 'block';
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  function formatDate(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  }

  // Escape HTML to prevent XSS in table cells
  function escHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ── Search / filter ───────────────────────────────────────────────────────
  let searchTimer;
  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      fetchLogs(searchInput.value.trim());
    }, 350); // debounce 350ms
  });

  // ── Initial load ──────────────────────────────────────────────────────────
  fetchLogs();
})();
