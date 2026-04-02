/**
 * Moshly Dedicated Auth Client
 */
const AUTH_URL = '/api';

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
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

    getToken: () => localStorage.getItem('moshly_token') || localStorage.getItem('moshly_session_token'),

    isAuthenticated: () => {
        const user = MoshlyAuth.getUser();
        const token = MoshlyAuth.getToken();
        return !!(user && token);
    },

    getSession: async () => {
        const user = MoshlyAuth.getUser();
        if (user) return user;
        // Fallback: try to fetch from server if token exists
        if (MoshlyAuth.getToken()) {
            const { ok, data } = await MoshlyAuth.authFetch('/me');
            if (ok && data.user) {
                localStorage.setItem('moshly_user', JSON.stringify(data.user));
                return data.user;
            }
        }
        return null;
    },

    getSessionRobust: async () => {
        if (!MoshlyAuth.getToken()) return null;
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
            const current = encodeURIComponent(window.location.href);
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

    logout: () => {
        localStorage.removeItem('moshly_user');
        localStorage.removeItem('moshly_token');
        localStorage.removeItem('moshly_session_token');
        localStorage.removeItem('moshly_refresh_token');
        if (window.syncAuthUI) window.syncAuthUI();
        window.location.href = '/';
    },

    silentRefresh: async () => {
        const refreshToken = localStorage.getItem('moshly_refresh_token');
        if (!refreshToken) return false;

        try {
            const response = await fetch(`${AUTH_URL}/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken })
            });
            const data = await response.json();

            if (response.ok && data.token) {
                localStorage.setItem('moshly_token', data.token);
                localStorage.setItem('moshly_refresh_token', data.refreshToken);
                return true;
            }
        } catch (e) {
            console.error('Silent refresh failed:', e);
        }
        return false;
    },

    // A helper for authenticated API calls
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
                headers
            });
            const data = await response.json();

            // On 401, attempt one silent refresh then retry
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
                    localStorage.setItem('moshly_user', JSON.stringify(data.user));
                    localStorage.setItem('moshly_token', data.token);
                    if (data.refreshToken) localStorage.setItem('moshly_refresh_token', data.refreshToken);
                    if (window.syncAuthUI) window.syncAuthUI();
                    
                    // Handle redirect
                    const params = new URLSearchParams(window.location.search);
                    let dest = params.get('redirect');
                    
                    if (localStorage.getItem('moshly_is_new_signup') === 'true') {
                        dest = '/setup-profile.html';
                        localStorage.removeItem('moshly_is_new_signup');
                    } else if (!dest) {
                        dest = '/dashboard.html';
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
                    // Auto-login with same credentials passed directly (not via DOM)
                    const loginResult = await MoshlyAuth.authFetch('/login', {
                        method: 'POST',
                        body: JSON.stringify({ email, password })
                    });

                    if (loginResult.ok && loginResult.data.success) {
                        localStorage.setItem('moshly_user', JSON.stringify(loginResult.data.user));
                        localStorage.setItem('moshly_token', loginResult.data.token);
                        if (loginResult.data.refreshToken) {
                            localStorage.setItem('moshly_refresh_token', loginResult.data.refreshToken);
                        }
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
                        // Optionally clear the input
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
window.authFetch = MoshlyAuth.authFetch; // Convenience
window.AUTH_URL = AUTH_URL;
