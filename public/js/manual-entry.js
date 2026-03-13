/**
 * manual-entry.js – Handles the manual attendee entry form.
 * Includes code auto-generation and QR image preview (bonus).
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
  const form             = document.getElementById('manualEntryForm');
  const firstNameInput   = document.getElementById('firstName');
  const lastNameInput    = document.getElementById('lastName');
  const emailInput       = document.getElementById('entryEmail');
  const codeInput        = document.getElementById('code');
  const generateCodeBtn  = document.getElementById('generateCodeBtn');
  const submitBtn        = document.getElementById('submitBtn');
  const entryError       = document.getElementById('entryError');
  const entrySuccess     = document.getElementById('entrySuccess');
  const qrPreviewWrap    = document.getElementById('qrPreviewWrap');
  const qrPreviewDiv     = document.getElementById('qrPreview');
  const qrCodeValue      = document.getElementById('qrCodeValue');

  // ── Clear field errors on input ───────────────────────────────────────────
  [firstNameInput, lastNameInput, emailInput, codeInput].forEach((input) => {
    input.addEventListener('input', () => {
      const errEl = document.getElementById(input.id + 'Error') || document.getElementById('entryEmailError');
      if (errEl) errEl.textContent = '';
      input.classList.remove('error');
    });
  });

  // ── Code auto-generator ───────────────────────────────────────────────────
  // Generates a code like: INFRA-4821-A9X2
  function generateCode() {
    const chars  = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no ambiguous chars (O/0, I/1)
    const num    = Math.floor(1000 + Math.random() * 9000); // 4-digit number
    const suffix = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    return `INFRA-${num}-${suffix}`;
  }

  generateCodeBtn.addEventListener('click', () => {
    codeInput.value = generateCode();
    codeInput.classList.remove('error');
    const errEl = document.getElementById('codeError');
    if (errEl) errEl.textContent = '';
  });

  // ── Client-side validation ────────────────────────────────────────────────
  function validateForm() {
    let valid = true;
    const fields = [
      { el: firstNameInput, errId: 'firstNameError', label: 'First name' },
      { el: lastNameInput,  errId: 'lastNameError',  label: 'Last name'  },
      { el: codeInput,      errId: 'codeError',      label: 'Code'       },
    ];

    fields.forEach(({ el, errId, label }) => {
      const err = document.getElementById(errId);
      if (!el.value.trim()) {
        if (err) err.textContent = `${label} is required.`;
        el.classList.add('error');
        valid = false;
      }
    });

    // Email validation
    const emailErr = document.getElementById('entryEmailError');
    const emailRe  = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailInput.value.trim()) {
      if (emailErr) emailErr.textContent = 'Email is required.';
      emailInput.classList.add('error');
      valid = false;
    } else if (!emailRe.test(emailInput.value.trim())) {
      if (emailErr) emailErr.textContent = 'Enter a valid email address.';
      emailInput.classList.add('error');
      valid = false;
    }

    return valid;
  }

  // ── Form submit ───────────────────────────────────────────────────────────
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    entryError.style.display   = 'none';
    entrySuccess.style.display = 'none';
    qrPreviewWrap.style.display = 'none';

    if (!validateForm()) return;

    const payload = {
      firstName: firstNameInput.value.trim(),
      lastName:  lastNameInput.value.trim(),
      email:     emailInput.value.trim(),
      code:      codeInput.value.trim().toUpperCase(),
    };

    submitBtn.disabled    = true;
    submitBtn.textContent = 'Adding…';

    try {
      const res  = await fetch('/api/attendees/manual-entry', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });
      const data = await res.json();

      if (res.ok) {
        entrySuccess.textContent   = data.message;
        entrySuccess.style.display = 'block';
        generateQRPreview(payload.code);
        form.reset();
      } else if (data.errors) {
        // Express-validator field errors
        const msg = data.errors.map((err) => err.msg).join(' ');
        entryError.textContent = msg;
        entryError.style.display = 'block';
      } else {
        entryError.textContent   = data.error || 'Submission failed.';
        entryError.style.display = 'block';
      }
    } catch {
      entryError.textContent   = 'Network error. Is the server running?';
      entryError.style.display = 'block';
    } finally {
      submitBtn.disabled    = false;
      submitBtn.textContent = 'Add Attendee';
    }
  });

  // ── QR preview (bonus – uses QRCode.js) ──────────────────────────────────
  function generateQRPreview(code) {
    // Clear any previous QR image
    qrPreviewDiv.innerHTML = '';
    qrCodeValue.textContent = code;

    // QRCode.js must be loaded via the script tag in manual-entry.html
    if (typeof QRCode === 'undefined') return;

    new QRCode(qrPreviewDiv, {
      text:          code,
      width:         150,
      height:        150,
      colorDark:     '#1a3a6e',
      colorLight:    '#ffffff',
      correctLevel:  QRCode.CorrectLevel.H,
    });

    qrPreviewWrap.style.display = 'flex';
  }
})();
