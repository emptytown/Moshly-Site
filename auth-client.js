/**
 * Moshly Dedicated Auth Client
 *
 * Token storage strategy (OWASP-JWT-001):
 *   - Access token  → in-memory only (_accessToken). Never written to localStorage.
 *   - Refresh token → HttpOnly; Secure; SameSite=Strict cookie (set by server).
 *
 * On page load the access token is null. Call MoshlyAuth.getSession() or
 * MoshlyAuth.requireSession() — both will silently attempt a token refresh via
 * the HttpOnly cookie before deciding the user is unauthenticated.
 */

const AUTH_URL = '/api';

// Private in-memory access token — never persisted to localStorage (F-01)
let _accessToken = null;

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

  // Returns the in-memory access token only — never reads localStorage
  getToken: () => _accessToken,

  // Sets session state after an inline login (e.g. post-registration auto-login).
  // Prefer silentRefresh() for page-load hydration.
  setSession: (user, token) => {
    _accessToken = token;
    if (user) localStorage.setItem('moshly_user', JSON.stringify(user));
  },

  isAuthenticated: () => {
    const user = MoshlyAuth.getUser();
    return !!(user && _accessToken);
  },

  // Returns cached user if a valid token is in memory; otherwise attempts a
  // silent refresh via the HttpOnly cookie to restore the session.
  getSession: async () => {
    if (_accessToken && MoshlyAuth.getUser()) return MoshlyAuth.getUser();
    const refreshed = await MoshlyAuth.silentRefresh();
    return refreshed ? MoshlyAuth.getUser() : null;
  },

  // Like getSession but always re-fetches the user from the server to ensure
  // the latest role/plan data is used (e.g. for admin checks).
  getSessionRobust: async () => {
    if (!_accessToken) {
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

  requireSession: async (redirectUrl = '/login.html') => {
    const user = await MoshlyAuth.getSession();
    if (!user) {
      // Encode only the relative path — never the full absolute URL (F-14)
      const current = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.href = redirectUrl.includes('?')
        ? `${redirectUrl}&redirect=${current}`
        : `${redirectUrl}?redirect=${current}`;
      return false;
    }
    return true;
  },

  requireGod: async () => {
    const user = await MoshlyAuth.getSessionRobust();
    if (!user || user.role !== 'god') {
      window.location.href = '/dashboard.html';
      return null;
    }
    return user;
  },

  logout: async () => {
    try {
      await fetch(`${AUTH_URL}/logout`, {
        method: 'POST',
        credentials: 'same-origin',
      });
    } catch (e) {
      console.error('Logout request failed:', e);
    }
    _accessToken = null;
    localStorage.removeItem('moshly_user');
    localStorage.removeItem('moshly_session_token'); // clean up legacy key
    if (window.syncAuthUI) window.syncAuthUI();
    window.location.href = '/';
  },

  // Exchanges the HttpOnly refresh token cookie for a new access token.
  // Stores result in _accessToken — never in localStorage.
  silentRefresh: async () => {
    try {
      const response = await fetch(`${AUTH_URL}/refresh`, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();

      if (response.ok && data.token) {
        _accessToken = data.token;
        if (data.user) localStorage.setItem('moshly_user', JSON.stringify(data.user));
        return true;
      }
    } catch (e) {
      console.error('Silent refresh failed:', e);
    }
    return false;
  },

  // Authenticated API helper. On 401 attempts one silent refresh then retries.
  authFetch: async (endpoint, options = {}) => {
    const token = MoshlyAuth.getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...(options.headers || {})
    };

    try {
      const response = await fetch(`${AUTH_URL}${endpoint}`, {
        ...options,
        credentials: 'same-origin',
        headers
      });
      const data = await response.json();

      if (response.status === 401 && !options._retry) {
        const refreshed = await MoshlyAuth.silentRefresh();
        if (refreshed) {
          return MoshlyAuth.authFetch(endpoint, { ...options, _retry: true });
        }
        MoshlyAuth.logout();
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
          _accessToken = data.token;
          localStorage.setItem('moshly_user', JSON.stringify(data.user));
          if (window.syncAuthUI) window.syncAuthUI();

          // Validate redirect before navigating — reject absolute/external URLs (F-02)
          const params = new URLSearchParams(window.location.search);
          const redirectParam = params.get('redirect');
          let dest = isSafeRedirect(redirectParam) ? redirectParam : '/dashboard.html';

          if (localStorage.getItem('moshly_is_new_signup') === 'true') {
            dest = '/setup-profile.html';
            localStorage.removeItem('moshly_is_new_signup');
          }

          window.location.href = dest;
        } else {
          if (feedback) {
            feedback.textContent = data.error || 'Login failed. Please try again.';
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

      try {
        const { ok, data } = await MoshlyAuth.authFetch('/register', {
          method: 'POST',
          body: JSON.stringify({ email, password, name })
        });

        if (ok && data.success) {
          // Auto-login with same credentials
          const loginResult = await MoshlyAuth.authFetch('/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
          });

          if (loginResult.ok && loginResult.data.success) {
            _accessToken = loginResult.data.token;
            localStorage.setItem('moshly_user', JSON.stringify(loginResult.data.user));
            window.location.href = '/setup-profile.html';
            return;
          }

          // Registration worked but auto-login failed — send to login
          window.location.href = '/login.html?registered=true&email=' + encodeURIComponent(email);
          return;
        } else {
          if (feedback) {
            feedback.textContent = data.error || 'Registration failed.';
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
            feedback.className = 'auth-feedback success';
            const input = document.getElementById('forgot-email');
            if (input) input.value = '';
          }
        } else {
          if (feedback) {
            feedback.textContent = data.error || 'Request failed. Please try again.';
            feedback.style.display = 'block';
            feedback.className = 'auth-feedback error';
          }
        }
      } catch (error) {
        if (feedback) {
          feedback.textContent = 'An error occurred. Please try again later.';
          feedback.style.display = 'block';
          feedback.className = 'auth-feedback error';
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
