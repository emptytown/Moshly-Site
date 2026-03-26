/**
 * Moshly Dedicated Auth Client
 */
const AUTH_URL = '/api';

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

    requireSession: async (redirectUrl = '/?auth=login') => {
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
        if (!user || user.privilege !== 'god') {
            window.location.href = '/dashboard.html';
            return null;
        }
        return user;
    },

    logout: () => {
        localStorage.removeItem('moshly_user');
        localStorage.removeItem('moshly_token');
        localStorage.removeItem('moshly_session_token');
        if (window.syncAuthUI) window.syncAuthUI();
        window.location.href = '/';
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
                    if (window.syncAuthUI) window.syncAuthUI();
                    
                    // Handle redirect
                    const params = new URLSearchParams(window.location.search);
                    const dest = params.get('redirect') || '/dashboard.html';
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
            const name = document.getElementById('reg-name')?.value;
            const feedback = document.getElementById('reg-feedback');
            const btn = document.querySelector('#panelRegister .auth-submit');

            if (!email || !password) {
                if (feedback) {
                    feedback.textContent = 'Email and password are required.';
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
                    // Pre-fill login email after registration
                    const loginEmail = document.getElementById('login-email');
                    if (loginEmail) loginEmail.value = email;
                    // Auto-switch to login tab
                    if (window.switchTab) window.switchTab('login');
                    // Trigger login handler directly
                    return MoshlyAuth.handleAuth(null, 'login');
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
    }
};

// Export to window
window.MoshlyAuth = MoshlyAuth;
window.handleAuth = MoshlyAuth.handleAuth; 
window.authFetch = MoshlyAuth.authFetch; // Convenience
window.AUTH_URL = AUTH_URL;
