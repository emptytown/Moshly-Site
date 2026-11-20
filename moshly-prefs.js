/**
 * Moshly Prefs — hub display preferences that must look the same in the
 * full dashboard and the simple dash (launcher), on every device.
 *
 * Stored server-side in profile.uxSettings (PATCH /api/me, whole object —
 * so we always merge) and mirrored in localStorage so pages can apply them
 * before first paint:
 *   uxSettings.skin       'brutal' | 'legacy'   ↔ localStorage 'moshly-skin'
 *   uxSettings.theme      'dark'   | 'light'    ↔ localStorage 'moshly-theme'
 *   uxSettings.emptySlots '3'…'12'              ↔ localStorage 'moshly_setting_empty_slots'
 * The server value wins on load; changes are written to both.
 */
(function (global) {
    'use strict';

    const SKINS = ['brutal', 'legacy'];
    const THEMES = ['dark', 'light'];

    function lsGet(k) { try { return localStorage.getItem(k); } catch (_) { return null; } }
    function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (_) {} }

    function local() {
        return {
            skin: lsGet('moshly-skin') === 'legacy' ? 'legacy' : 'brutal',
            theme: lsGet('moshly-theme') === 'light' ? 'light' : 'dark'
        };
    }

    // Apply to the page (classes + any page-specific UI sync hooks) and mirror locally.
    function apply({ skin, theme } = {}) {
        const root = document.documentElement;
        if (SKINS.includes(skin)) {
            SKINS.forEach(s => root.classList.toggle('skin-' + s, s === skin));
            lsSet('moshly-skin', skin);
            if (typeof global.updateDashboardSkinUI === 'function') global.updateDashboardSkinUI(skin);
        }
        if (THEMES.includes(theme)) {
            const isLight = theme === 'light';
            root.classList.toggle('theme-light', isLight);
            lsSet('moshly-theme', theme);
            if (typeof global.updateThemeToggle === 'function') global.updateThemeToggle(isLight);
            if (typeof global.updateDashboardThemeUI === 'function') global.updateDashboardThemeUI(isLight);
        }
    }

    /**
     * Call once /me has loaded. Server values win; if the account has none yet,
     * returns the local values so the caller can seed the server (seed=true).
     */
    function syncFromServer(user, { seed = false } = {}) {
        const ux = user?.profile?.uxSettings || {};
        if (ux.emptySlots) lsSet('moshly_setting_empty_slots', ux.emptySlots);
        apply({ skin: ux.skin, theme: ux.theme });

        const missing = {};
        if (!SKINS.includes(ux.skin)) missing.skin = local().skin;
        if (!THEMES.includes(ux.theme)) missing.theme = local().theme;
        if (seed && Object.keys(missing).length) save(user, missing);
    }

    // Merge `partial` into the user's uxSettings and persist it (best effort).
    async function save(user, partial) {
        if (!user) return false;
        if (!user.profile) user.profile = {};
        const next = { ...(user.profile.uxSettings || {}), ...partial };
        user.profile.uxSettings = next;
        try {
            const { ok } = await global.MoshlyAuth.authFetch('/me', {
                method: 'PATCH',
                body: JSON.stringify({ uxSettings: next })
            });
            return ok;
        } catch (err) {
            console.warn('[MoshlyPrefs] could not save preferences:', err);
            return false;
        }
    }

    global.MoshlyPrefs = Object.freeze({ local, apply, syncFromServer, save });
})(window);
