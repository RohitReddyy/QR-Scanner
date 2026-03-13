/**
 * logs.js – Fetches and renders scan logs.
 * Includes search/filter and CSV export.
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
  const exportBtn    = document.getElementById('exportBtn');

  let allLogs = []; // Cache for CSV export and client-side filtering

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
      allLogs = logs;
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

  // ── CSV export ────────────────────────────────────────────────────────────
  exportBtn.addEventListener('click', () => {
    if (!allLogs.length) return;

    const headers = ['Date & Time', 'Code', 'Name', 'Email', 'Front-Desk Employee', 'Status'];
    const rows = allLogs.map((log) => [
      formatDate(log.scannedAt),
      log.code,
      log.name || '',
      log.email || '',
      log.scannedByName,
      log.status,
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `scan-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  });

  // ── Initial load ──────────────────────────────────────────────────────────
  fetchLogs();
})();
