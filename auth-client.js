/**
 * Moshly Dedicated Auth Client
 *
 * Token storage strategy (OWASP-JWT-001):
 *   - Access token  → HttpOnly; Secure; SameSite=Strict cookie (set by server, never readable by JS).
 *   - Refresh token → HttpOnly; Secure; SameSite=Strict cookie (set by server).
 *
 * On page load call MoshlyAuth.getSession() or MoshlyAuth.requireSession() — both
 * silently attempt a token refresh via the HttpOnly cookie before deciding the user
 * is unauthenticated.
 */

const AUTH_URL = '/api';

let _refreshPromise = null;

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
}

// Accepts only same-origin relative paths; rejects absolute and protocol-relative URLs (F-02)
function isSafeRedirect(url) {
  return typeof url === 'string' && url.startsWith('/') && !url.startsWith('//');
}

const MoshlyAuth = {
  baseUrl: AUTH_URL,

  getUser: () => {
    try {
      return JSON.parse(localStorage.getItem('moshly_user'));
    } catch (e) {
      return null;
    }
  },

  // Sets session state after a login. Token is in the HttpOnly cookie — not stored here.
  setSession: (user) => {
    if (user) localStorage.setItem('moshly_user', JSON.stringify(user));
  },

  isAuthenticated: () => {
    return !!MoshlyAuth.getUser();
  },

  // Returns cached user if present; otherwise attempts a silent refresh via
  // the HttpOnly cookie to restore the session.
  getSession: async (skipSilent = false) => {
    if (MoshlyAuth.getUser()) return MoshlyAuth.getUser();
    if (skipSilent) return null;
    const refreshed = await MoshlyAuth.silentRefresh();
    if (refreshed === "unverified") return "unverified"; return refreshed ? MoshlyAuth.getUser() : null;
  },

  // Like getSession but always re-fetches the user from the server to ensure
  // the latest role/plan data is used (e.g. for admin checks).
  getSessionRobust: async () => {
    if (!MoshlyAuth.getUser()) {
      const refreshed = await MoshlyAuth.silentRefresh();
      if (!refreshed) return null;
    }
    try {
      const { ok, data } = await MoshlyAuth.authFetch('/me');
      if (ok && data.user) {
        localStorage.setItem('moshly_user', JSON.stringify(data.user));
        return data.user;
      }
    } catch (e) {
      console.error('Session verification failed:', e);
    }
    return MoshlyAuth.getUser();
  },

  requireSession: async (redirectUrl = '/login') => {
    const user = await MoshlyAuth.getSession();
    if (!user || user === "unverified") {
      // Clean redirectUrl (strip .html if passed manually)
      const cleanUrl = redirectUrl.split('?')[0].endsWith('.html') 
        ? redirectUrl.replace('.html', '') 
        : redirectUrl;

      // Encode only the relative path — never the full absolute URL (F-14)
      const current = encodeURIComponent(window.location.pathname + window.location.search);
      const reason = (user === "unverified") ? "unverified" : (MoshlyAuth.getUser() ? "expired" : "unauthorized");
      window.location.href = cleanUrl.includes("?")
        ? `${cleanUrl}&reason=${reason}&redirect=${current}`
        : `${cleanUrl}?reason=${reason}&redirect=${current}`;      return false;
    }
    return true;
  },

  requireGod: async () => {
    const user = await MoshlyAuth.getSessionRobust();
    if (!user || user.role !== 'god') {
      window.location.href = '/dashboard';
      return null;
    }
    return user;
  },

  logout: async (reason = null) => {
    try {
      await fetch(`${AUTH_URL}/logout`, {
        method: 'POST',
        credentials: 'same-origin',
      });
    } catch (e) {
      console.error('Logout request failed:', e);
    }
    localStorage.removeItem('moshly_user');
    localStorage.removeItem('moshly_session_token'); // clean up legacy key
    if (window.syncAuthUI) window.syncAuthUI();
    window.location.href = reason ? `/?reason=${reason}` : '/';
  },

  // Exchanges the HttpOnly refresh token cookie for a new access token.
  // Stores result in _accessToken — never in localStorage.
  silentRefresh: async (retryCount = 0) => {
    // If a refresh is already in progress, wait for it instead of starting a new one.
    if (_refreshPromise) return _refreshPromise;

    const performRefresh = async () => {
      try {
        const response = await fetch(`${AUTH_URL}/refresh`, {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
        });

        if (response.status === 401) {
          localStorage.removeItem('moshly_user');
          return false;
        }
        if (response.status === 403) return "unverified";

        if (response.status === 409 && retryCount < 2) {
          // Collision detected, retry up to 2 times after a short delay (100-200ms)
          const delay = 100 + Math.floor(Math.random() * 100);
          await new Promise(r => setTimeout(r, delay));
          return MoshlyAuth.silentRefresh(retryCount + 1);
        }

        if (response.status === 204) return true; // Valid session, no new token needed/provided

        // If response is not OK, don't try to parse as JSON if it's not JSON
        const contentType = response.headers.get("content-type");
        let data = {};
        if (contentType && contentType.includes("application/json")) {
          data = await response.json();
        }

        if (response.ok) {
          if (data.user) localStorage.setItem('moshly_user', JSON.stringify(data.user));
          return true;
        }
        localStorage.removeItem('moshly_user');
      } catch (e) {
        console.error('Silent refresh failed:', e);
      }
      return false;
    };

    _refreshPromise = performRefresh();
    try {
      return await _refreshPromise;
    } finally {
      _refreshPromise = null;
    }
  },

  // Authenticated API helper. On 401 attempts one silent refresh then retries.
  authFetch: async (endpoint, options = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };

    try {
      const response = await fetch(`${AUTH_URL}${endpoint}`, {
        ...options,
        credentials: 'same-origin',
        headers
      });
      const data = await response.json();

      if (response.status === 401 && !options._retry) {
        // Don't auto-logout on 401 for login or refresh endpoints
        if (endpoint === '/login' || endpoint === '/refresh') {
          return { ok: false, status: 401, data };
        }
        const refreshed = await MoshlyAuth.silentRefresh();
        if (refreshed) {
          return MoshlyAuth.authFetch(endpoint, { ...options, _retry: true });
        }
        MoshlyAuth.logout("expired");
        return { ok: false, status: 401, data };
      }

      return { ok: response.ok, status: response.status, data };
    } catch (e) {
      return { ok: false, status: 0, data: { error: 'Network error' } };
    }
  },

  handleAuth: async (event, type) => {
    if (event) event.preventDefault();

    if (type === 'login') {
      const email = document.getElementById('login-email')?.value;
      const password = document.getElementById('login-password')?.value;
      const feedback = document.getElementById('login-feedback');
      const btn = document.querySelector('#panelLogin .auth-submit');

      if (!email || !password) {
        if (feedback) {
          feedback.textContent = 'Email and password are required.';
          feedback.style.display = 'block';
        }
        return;
      }

      if (!isValidEmail(email)) {
        if (feedback) {
          feedback.textContent = 'Please enter a valid email address.';
          feedback.style.display = 'block';
        }
        return;
      }

      if (btn) {
        btn.disabled = true;
        btn.textContent = 'Logging in...';
      }

      try {
        const { ok, data } = await MoshlyAuth.authFetch('/login', {
          method: 'POST',
          body: JSON.stringify({ email, password })
        });

        if (ok && data.success) {
          MoshlyAuth.setSession(data.user);
          if (window.syncAuthUI) window.syncAuthUI();

          // Validate redirect before navigating — reject absolute/external URLs (F-02)
          const params = new URLSearchParams(window.location.search);
          const redirectParam = params.get('redirect');
          let dest = isSafeRedirect(redirectParam) ? redirectParam : '/dashboard';

          if (localStorage.getItem('moshly_is_new_signup') === 'true') {
            dest = '/setup-profile.html';
            localStorage.removeItem('moshly_is_new_signup');
          }

          window.location.href = dest;
        } else {
          if (feedback) {
            feedback.textContent = data.message || data.error || 'Login failed. Please try again.';
            feedback.className = 'auth-feedback auth-feedback--error';
            feedback.style.display = 'block';
          }
        }
      } catch (error) {
        if (feedback) {
          feedback.textContent = 'An error occurred. Please try again later.';
          feedback.style.display = 'block';
        }
      } finally {
        if (btn) {
          btn.disabled = false;
          btn.textContent = 'Log In';
        }
      }
    }

    if (type === 'register') {
      const email = document.getElementById('reg-email')?.value;
      const password = document.getElementById('reg-password')?.value;
      const firstName = document.getElementById('reg-fname')?.value || '';
      const lastName = document.getElementById('reg-lname')?.value || '';
      const name = `${firstName} ${lastName}`.trim();
      const feedback = document.getElementById('reg-feedback');
      const btn = document.querySelector('#panelRegister .auth-submit');

      if (!email || !password) {
        if (feedback) {
          feedback.textContent = 'Email and password are required.';
          feedback.style.display = 'block';
        }
        return;
      }

      if (!isValidEmail(email)) {
        if (feedback) {
          feedback.textContent = 'Please enter a valid email address.';
          feedback.style.display = 'block';
        }
        return;
      }

      if (btn) {
        btn.disabled = true;
        btn.textContent = 'Creating Account...';
      }

      const inviteCode = document.getElementById('reg-invite-code')?.value?.trim() || null;

      try {
        const registerPayload = { email, password, name };
        if (inviteCode) registerPayload.inviteCode = inviteCode;
        const { ok, data } = await MoshlyAuth.authFetch('/register', {
          method: 'POST',
          body: JSON.stringify(registerPayload)
        });

        if (ok && data.success) {
          // Send to login with registered=true to show confirmation message
          window.location.href = '/login?registered=true&email=' + encodeURIComponent(email);
          return;
        } else {
          if (feedback) {
            feedback.textContent = data.message || data.error || 'Registration failed.';
            feedback.className = 'auth-feedback auth-feedback--error';
            feedback.style.display = 'block';
          }
        }
      } catch (error) {
        if (feedback) {
          feedback.textContent = 'An error occurred. Please try again.';
          feedback.style.display = 'block';
        }
      } finally {
        if (btn) {
          btn.disabled = false;
          btn.textContent = 'Create Account';
        }
      }
    }

    if (type === 'forgot') {
      const email = document.getElementById('forgot-email')?.value;
      const feedback = document.getElementById('forgot-feedback');
      const btn = document.querySelector('#panelForgot .auth-submit');

      if (!email || !isValidEmail(email)) {
        if (feedback) {
          feedback.textContent = !email
            ? 'Please enter your email address.'
            : 'Please enter a valid email address.';
          feedback.style.display = 'block';
          feedback.className = 'auth-feedback error';
        }
        return;
      }

      if (btn) {
        btn.disabled = true;
        btn.textContent = 'Sending...';
      }

      try {
        const { ok, data } = await MoshlyAuth.authFetch('/forgot-password', {
          method: 'POST',
          body: JSON.stringify({ email })
        });

        if (ok) {
          if (feedback) {
            feedback.textContent = data.message || 'If an account exists, a reset link has been sent.';
            feedback.style.display = 'block';
            feedback.className = 'auth-feedback auth-feedback--success';
            const input = document.getElementById('forgot-email');
            if (input) input.value = '';
          }
        } else {
          if (feedback) {
            feedback.textContent = data.message || data.error || 'Request failed. Please try again.';
            feedback.style.display = 'block';
            feedback.className = 'auth-feedback auth-feedback--error';
          }
        }
      } catch (error) {
        if (feedback) {
          feedback.textContent = 'An error occurred. Please try again later.';
          feedback.style.display = 'block';
          feedback.className = 'auth-feedback auth-feedback--error';
        }
      } finally {
        if (btn) {
          btn.disabled = false;
          btn.textContent = 'Reset Password';
        }
      }
    }
  }
};

// Export to window
window.MoshlyAuth = MoshlyAuth;
window.handleAuth = MoshlyAuth.handleAuth;
window.authFetch = MoshlyAuth.authFetch;
window.AUTH_URL = AUTH_URL;
