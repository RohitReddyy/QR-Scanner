/**
 * dashboard.js – Handles the QR scan workflow on the dashboard page.
 *
 * Desktop: scan button is disabled; shows tooltip and static hint.
 * Mobile:  scan icon and button both open the camera; jsQR decodes frames.
 */

(function () {
  'use strict';

  // ── Guard: must be logged in ──────────────────────────────────────────────
  async function checkAuth() {
    const res = await fetch('/api/auth/me');
    if (!res.ok) {
      window.location.href = '/login.html';
    }
  }
  checkAuth();

  // ── Element refs ──────────────────────────────────────────────────────────
  const scanBtn          = document.getElementById('scanBtn');
  const scanIconWrap     = document.getElementById('scanIconWrap');
  const scannerContainer = document.getElementById('scannerContainer');
  const scannerVideo     = document.getElementById('scannerVideo');
  const closeScannerBtn  = document.getElementById('closeScannerBtn');
  const rescanBtn        = document.getElementById('rescanBtn');
  const toast            = document.getElementById('toast');

  // ── Mobile detection ──────────────────────────────────────────────────────
  // We rely on CSS for showing/hiding the hint text, but we also need to know
  // in JS whether to enable the scanner.
  const isMobile = () => window.innerWidth <= 768;

  // Enable scan button and icon click only on mobile
  function updateScanState() {
    if (isMobile()) {
      scanBtn.disabled = false;
      scanIconWrap.style.cursor = 'pointer';
    } else {
      scanBtn.disabled = true;
      scanIconWrap.style.cursor = 'default';
    }
  }
  updateScanState();
  window.addEventListener('resize', updateScanState);

  // ── Logout ────────────────────────────────────────────────────────────────
  document.getElementById('logoutBtn').addEventListener('click', async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login.html';
  });

  // ── Scanner state ─────────────────────────────────────────────────────────
  let stream       = null; // MediaStream from camera
  let animFrame    = null; // requestAnimationFrame id
  let scanning     = false;

  // ── Open camera ───────────────────────────────────────────────────────────
  async function openScanner() {
    if (!isMobile()) return; // extra safety

    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }, // rear camera
        audio: false,
      });
      scannerVideo.srcObject = stream;
      scannerContainer.style.display = 'flex';
      scanning = true;
      scanBtn.style.display   = 'none';
      rescanBtn.style.display = 'none';
      requestAnimationFrame(decodeFrame);
    } catch (err) {
      showToast('Camera access denied. Please allow camera permissions.', 'error');
      console.error('Camera error:', err);
    }
  }

  // ── Stop camera ───────────────────────────────────────────────────────────
  function closeScanner() {
    scanning = false;
    cancelAnimationFrame(animFrame);
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      stream = null;
    }
    scannerVideo.srcObject = null;
    scannerContainer.style.display = 'none';
  }

  // ── QR decode loop (uses jsQR) ────────────────────────────────────────────
  const canvas = document.createElement('canvas');
  const ctx    = canvas.getContext('2d');

  function decodeFrame() {
    if (!scanning) return;

    if (scannerVideo.readyState === scannerVideo.HAVE_ENOUGH_DATA) {
      canvas.height = scannerVideo.videoHeight;
      canvas.width  = scannerVideo.videoWidth;
      ctx.drawImage(scannerVideo, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      // jsQR – third param is an options object; inversionAttempts helps with dark-on-light
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      });

      if (code) {
        // QR code found — stop scanning and validate
        closeScanner();
        validateCode(code.data.trim());
        return;
      }
    }

    animFrame = requestAnimationFrame(decodeFrame);
  }

  // ── Validate code with backend ────────────────────────────────────────────
  async function validateCode(code) {
    // Show spinner for 1.5s before showing result — gives a deliberate UX pause
    showToast('⏳ Validating…', 'info', 10000);

    await new Promise((resolve) => setTimeout(resolve, 1500));

    try {
      const res  = await fetch('/api/scan', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ code }),
      });
      const data = await res.json();

      if (res.ok && data.status === 'success') {
        showToast('✅ ' + data.message, 'success', 4000);
      } else if (data.status === 'duplicate') {
        showToast('⚠️ ' + data.message, 'info', 4000);
      } else {
        showToast('❌ ' + (data.message || 'Scan failed. Code not found.'), 'error', 4000);
      }
    } catch {
      showToast('❌ Network error. Could not validate code.', 'error');
    } finally {
      // Show "Scan Again" button so the user can rescan without refreshing
      scanBtn.style.display   = 'none';
      rescanBtn.style.display = 'inline-flex';
    }
  }

  // ── Toast helper ─────────────────────────────────────────────────────────
  let toastTimer = null;
  function showToast(message, type = 'info', duration = 3000) {
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.className   = `toast ${type} show`;
    toastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, duration);
  }

  // ── Button / icon event listeners ────────────────────────────────────────
  scanBtn.addEventListener('click', () => {
    if (!scanBtn.disabled) openScanner();
  });

  scanIconWrap.addEventListener('click', () => {
    if (isMobile()) openScanner();
  });

  closeScannerBtn.addEventListener('click', () => {
    closeScanner();
    scanBtn.style.display   = 'inline-flex';
    rescanBtn.style.display = 'none';
  });

  rescanBtn.addEventListener('click', () => {
    rescanBtn.style.display = 'none';
    openScanner();
  });
})();
