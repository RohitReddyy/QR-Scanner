/**
 * registered-users.js
 * Lists all registered attendees with their check-in status.
 * Allows front-desk members to manually check in an attendee by ID.
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
  const usersLoading = document.getElementById('usersLoading');
  const usersEmpty   = document.getElementById('usersEmpty');
  const tableWrap    = document.getElementById('tableWrap');
  const usersBody    = document.getElementById('usersBody');
  const searchInput  = document.getElementById('searchInput');
  const toast        = document.getElementById('toast');

  // ── Fetch attendees ───────────────────────────────────────────────────────
  async function fetchAttendees(search = '') {
    usersLoading.style.display = 'block';
    usersEmpty.style.display   = 'none';
    tableWrap.style.display    = 'none';

    try {
      const url = search
        ? `/api/attendees?search=${encodeURIComponent(search)}`
        : '/api/attendees';
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch attendees');
      const attendees = await res.json();
      renderAttendees(attendees);
    } catch (err) {
      usersLoading.innerHTML = `<p style="color:var(--color-danger)">Error: ${err.message}</p>`;
    }
  }

  // ── Render attendees table ────────────────────────────────────────────────
  function renderAttendees(attendees) {
    usersLoading.style.display = 'none';

    if (!attendees.length) {
      usersEmpty.style.display = 'block';
      return;
    }

    usersBody.innerHTML = attendees.map((a) => `
      <tr id="row-${a._id}">
        <td>${escHtml(a.firstName)} ${escHtml(a.lastName)}</td>
        <td>${escHtml(a.email)}</td>
        <td><code>${escHtml(a.code)}</code></td>
        <td>
          ${a.checkedIn
            ? '<span class="badge badge-success">Checked In</span>'
            : '<span class="badge badge-pending">Not Checked In</span>'
          }
        </td>
        <td>
          <button
            class="btn btn-primary btn-sm checkin-btn"
            data-id="${a._id}"
            data-name="${escHtml(a.firstName + ' ' + a.lastName)}"
            ${a.checkedIn ? 'disabled' : ''}
          >
            ${a.checkedIn ? 'Already Checked In' : 'Check In'}
          </button>
        </td>
      </tr>
    `).join('');

    // Attach click handlers to all check-in buttons
    usersBody.querySelectorAll('.checkin-btn').forEach((btn) => {
      btn.addEventListener('click', () => handleCheckIn(btn));
    });

    tableWrap.style.display = 'block';
  }

  // ── Handle check-in button click ─────────────────────────────────────────
  async function handleCheckIn(btn) {
    const id   = btn.dataset.id;
    const name = btn.dataset.name;

    btn.disabled    = true;
    btn.textContent = 'Checking in…';

    try {
      const res  = await fetch(`/api/attendees/${id}/checkin`, { method: 'POST' });
      const data = await res.json();

      if (res.ok) {
        showToast(`✅ ${data.message}`, 'success');

        // Update the row status badge and button in place
        const row = document.getElementById(`row-${id}`);
        if (row) {
          row.querySelector('td:nth-child(4)').innerHTML =
            '<span class="badge badge-success">Checked In</span>';
          btn.textContent = 'Already Checked In';
        }
      } else {
        showToast(`⚠️ ${data.error || 'Check-in failed.'}`, 'error');
        btn.disabled    = false;
        btn.textContent = 'Check In';
      }
    } catch {
      showToast('❌ Network error. Could not check in.', 'error');
      btn.disabled    = false;
      btn.textContent = 'Check In';
    }
  }

  // ── Toast helper ──────────────────────────────────────────────────────────
  let toastTimer = null;
  function showToast(message, type = 'info', duration = 3500) {
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.className   = `toast ${type} show`;
    toastTimer = setTimeout(() => toast.classList.remove('show'), duration);
  }

  // ── Search with debounce ──────────────────────────────────────────────────
  let searchTimer;
  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => fetchAttendees(searchInput.value.trim()), 350);
  });

  // ── Escape HTML helper ────────────────────────────────────────────────────
  function escHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ── Initial load ──────────────────────────────────────────────────────────
  fetchAttendees();
})();
