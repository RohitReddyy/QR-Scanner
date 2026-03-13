/**
 * login.js – Handles the login form submission.
 * Redirects to dashboard.html on success.
 */

(function () {
  'use strict';

  // If already logged in, skip to dashboard
  fetch('/api/auth/me')
    .then((r) => { if (r.ok) window.location.href = '/dashboard.html'; })
    .catch(() => {});

  const form        = document.getElementById('loginForm');
  const loginBtn    = document.getElementById('loginBtn');
  const loginError  = document.getElementById('loginError');
  const emailInput  = document.getElementById('email');
  const passInput   = document.getElementById('password');
  const emailErr    = document.getElementById('emailError');
  const passErr     = document.getElementById('passwordError');

  // Clear field error on input
  emailInput.addEventListener('input', () => { emailErr.textContent = ''; emailInput.classList.remove('error'); });
  passInput.addEventListener('input',  () => { passErr.textContent  = ''; passInput.classList.remove('error'); });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginError.style.display = 'none';
    emailErr.textContent = '';
    passErr.textContent  = '';

    const email    = emailInput.value.trim();
    const password = passInput.value;
    let valid = true;

    // Basic client-side validation
    if (!email) {
      emailErr.textContent = 'Email is required.';
      emailInput.classList.add('error');
      valid = false;
    }
    if (!password) {
      passErr.textContent = 'Password is required.';
      passInput.classList.add('error');
      valid = false;
    }
    if (!valid) return;

    loginBtn.disabled    = true;
    loginBtn.textContent = 'Signing in…';

    try {
      const res  = await fetch('/api/auth/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (res.ok) {
        window.location.href = '/dashboard.html';
      } else {
        loginError.textContent = data.error || 'Login failed. Please try again.';
        loginError.style.display = 'block';
      }
    } catch {
      loginError.textContent = 'Network error. Is the server running?';
      loginError.style.display = 'block';
    } finally {
      loginBtn.disabled    = false;
      loginBtn.textContent = 'Sign In';
    }
  });
})();
