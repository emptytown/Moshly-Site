/**
 * Moshly UI Core
 * Handles global UI behaviors: Menus, Themes, Modals, and Auth Sync.
 */

// --- 1. AUTH UI SYNC ---
function syncAuthUI() {
    const user = (() => {
        try { return JSON.parse(localStorage.getItem('moshly_user')); } catch { return null; }
    })();

    const loginBtns = document.querySelectorAll('#nav-login-btn, #mobile-nav-login-btn');
    const dashBtns = document.querySelectorAll('#nav-dash-btn, #mobile-nav-dash-btn');

    if (user && user.email) {
        loginBtns.forEach(btn => btn.classList.add('u-hidden'));
        dashBtns.forEach(btn => btn.classList.remove('u-hidden'));
    } else {
        loginBtns.forEach(btn => btn.classList.remove('u-hidden'));
        dashBtns.forEach(btn => btn.classList.add('u-hidden'));
    }
}

// --- 2. MOBILE MENU ---
function toggleMobileMenu() {
    const btn = document.getElementById('navMenuBtn');
    const menu = document.getElementById('mobileNavMenu');
    if (!btn || !menu) return;
    const isOpen = menu.classList.toggle('mobile-nav--open');
    btn.classList.toggle('nav-menu-btn--open', isOpen);
    btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    menu.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
}

function closeMobileMenu() {
    const btn = document.getElementById('navMenuBtn');
    const menu = document.getElementById('mobileNavMenu');
    if (!btn || !menu) return;
    menu.classList.remove('mobile-nav--open');
    btn.classList.remove('nav-menu-btn--open');
    btn.setAttribute('aria-expanded', 'false');
    menu.setAttribute('aria-hidden', 'true');
}

function initMobileMenu() {
    const btn = document.getElementById('navMenuBtn');
    if (!btn) return;
    btn.addEventListener('click', toggleMobileMenu);
    document.addEventListener('click', (e) => {
        const menu = document.getElementById('mobileNavMenu');
        if (!menu || !menu.classList.contains('mobile-nav--open')) return;
        if (menu.contains(e.target) || btn.contains(e.target)) return;
        closeMobileMenu();
    });
    window.addEventListener('resize', () => {
        if (window.innerWidth > 900) closeMobileMenu();
    });
}

// --- 3. THEME TOGGLE ---
function toggleTheme() {
    const isLight = document.documentElement.classList.toggle('theme-light');
    localStorage.setItem('moshly-theme', isLight ? 'light' : 'dark');
    updateThemeToggle(isLight);
}

function updateThemeToggle(isLight) {
    const sun = document.querySelector('.theme-toggle-icon--sun');
    const moon = document.querySelector('.theme-toggle-icon--moon');
    if (!sun || !moon) return;
    sun.style.opacity = isLight ? '1' : '0.35';
    moon.style.opacity = isLight ? '0.35' : '1';
}

function initTheme() {
    const saved = localStorage.getItem('moshly-theme');
    const isLight = saved === 'light';
    if (isLight) {
        document.documentElement.classList.add('theme-light');
    }
    updateThemeToggle(isLight);
}

// --- 4. MODALS & TABS ---
function openModal(tab) {
    switchTab(tab || 'login');
    const overlay = document.getElementById('authOverlay');
    if (!overlay) return;
    overlay.classList.add('auth-overlay--visible');
    overlay.setAttribute('aria-hidden','false');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    const overlay = document.getElementById('authOverlay');
    if (!overlay) return;
    overlay.classList.remove('auth-overlay--visible');
    overlay.setAttribute('aria-hidden','true');
    document.body.style.overflow = '';
    // Reset eye icons
    document.querySelectorAll('.auth-pw-toggle').forEach(btn => {
        const eye = btn.querySelector('.pw-eye');
        const eyeOff = btn.querySelector('.pw-eye-off');
        if (eye) eye.style.display = '';
        if (eyeOff) eyeOff.style.display = 'none';
    });
}

function switchTab(tab) {
    ['login','register','insertCode','forgot'].forEach(t => {
        const panelId = 'panel' + t.charAt(0).toUpperCase() + t.slice(1);
        const el = document.getElementById(panelId);
        if (el) el.classList.toggle('auth-panel--hidden', t !== tab);
    });
    ['login','register','insertCode'].forEach(t => {
        const btn = document.getElementById('tab' + t.charAt(0).toUpperCase() + t.slice(1));
        if (btn) btn.classList.toggle('auth-tab--active', t === tab);
    });
    // Reset forgot panel state
    if (tab === 'forgot') {
        const success = document.getElementById('forgotSuccess');
        const form = document.querySelector('#panelForgot .auth-form');
        const emailInput = document.getElementById('forgot-email');
        if (success) success.style.display = 'none';
        if (form) form.style.display = '';
        if (emailInput) emailInput.value = '';
        const btn = document.querySelector('#panelForgot .auth-submit');
        if (btn) { btn.disabled = false; btn.textContent = 'Send Reset Link'; }
    }
}

function togglePwVisibility(btn) {
    const input = btn.closest('.auth-pw-wrap').querySelector('input');
    const isHidden = input.type === 'password';
    input.type = isHidden ? 'text' : 'password';
    const eye = btn.querySelector('.pw-eye');
    const eyeOff = btn.querySelector('.pw-eye-off');
    if (eye) eye.style.display = isHidden ? 'none' : '';
    if (eyeOff) eyeOff.style.display = isHidden ? '' : 'none';
}

// --- 5. INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    initMobileMenu();
    initTheme();
    syncAuthUI();

    // Auto-open logic
    const p = new URLSearchParams(location.search);
    const collabInvite = p.get('collab_invite');
    if (collabInvite) {
        openModal('insertCode');
        const inp = document.getElementById('insert-code-input');
        if (inp) inp.value = collabInvite.toUpperCase();
    } else if (p.get('auth') === 'login') {
        openModal('login');
    }
});

document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
        closeModal();
        closeMobileMenu();
    }
});

// Export globals for HTML onclick handlers
window.toggleMobileMenu = toggleMobileMenu;
window.closeMobileMenu = closeMobileMenu;
window.openModal = openModal;
window.closeModal = closeModal;
window.toggleTheme = toggleTheme;
window.switchTab = switchTab;
window.togglePwVisibility = togglePwVisibility;
window.syncAuthUI = syncAuthUI;
