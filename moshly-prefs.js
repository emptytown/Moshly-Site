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
 * Skin and theme also travel to every Moshly app through the shared cookies
 * moshly_skin=<neo|legacy>.<ms> and moshly_theme=<light|dark>.<ms> on .moshly.io
 * (contract: docs/MOSHLY_SKINS.md in moshly-days; module: moshly-modules/MoshlySkins).
 * The hub's 'brutal' is the family's 'neo'. The NEWEST choice wins — whether it
 * was made here, in an app, or on another device (server copy, with *UpdatedAt).
 */
(function (global) {
    'use strict';

    const SKINS = ['brutal', 'legacy'];
    const THEMES = ['dark', 'light'];

    function lsGet(k) { try { return localStorage.getItem(k); } catch (_) { return null; } }
    function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (_) {} }

    // ── Shared family cookies (.moshly.io) ──────────────────────────────
    const toFamily = (skin) => (skin === 'legacy' ? 'legacy' : 'neo');
    const fromFamily = (fam) => (fam === 'legacy' ? 'legacy' : 'brutal');
    function readShared(name, values) {
        try {
            const m = document.cookie.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]*)'));
            if (!m) return null;
            const [v, at] = decodeURIComponent(m[1]).split('.');
            if (!values.includes(v)) return null;
            const t = Number(at);
            return { value: v, at: Number.isFinite(t) && t > 0 ? t : 0 };
        } catch (_) { return null; }
    }
    function writeShared(name, value, at) {
        try {
            const host = location.hostname;
            const parts = [name + '=' + value + '.' + Math.round(at), 'Path=/', 'Max-Age=31536000', 'SameSite=Lax'];
            if (host === 'moshly.io' || host.endsWith('.moshly.io')) parts.push('Domain=.moshly.io');
            if (location.protocol === 'https:') parts.push('Secure');
            document.cookie = parts.join('; ');
        } catch (_) {}
    }
    const sharedSkin = () => { const c = readShared('moshly_skin', ['neo', 'legacy']); return c && { value: fromFamily(c.value), at: c.at }; };
    const sharedTheme = () => readShared('moshly_theme', ['light', 'dark']);

    function local() {
        const cs = sharedSkin(), ct = sharedTheme();
        return {
            skin: cs ? cs.value : (lsGet('moshly-skin') === 'legacy' ? 'legacy' : 'brutal'),
            theme: ct ? ct.value : (lsGet('moshly-theme') === 'light' ? 'light' : 'dark'),
            skinAt: cs ? cs.at : 0,
            themeAt: ct ? ct.at : 0
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
        const here = local();
        const serverSkinAt = Number(ux.skinUpdatedAt) || 0;
        const serverThemeAt = Number(ux.themeUpdatedAt) || 0;

        // Newest choice wins: the account (another device) or this browser (hub or an app).
        const useServerSkin = SKINS.includes(ux.skin) && (serverSkinAt > here.skinAt || (!here.skinAt && !serverSkinAt));
        const useServerTheme = THEMES.includes(ux.theme) && (serverThemeAt > here.themeAt || (!here.themeAt && !serverThemeAt));
        const skin = useServerSkin ? ux.skin : here.skin;
        const theme = useServerTheme ? ux.theme : here.theme;
        apply({ skin, theme });
        if (useServerSkin && serverSkinAt) writeShared('moshly_skin', toFamily(ux.skin), serverSkinAt);
        if (useServerTheme && serverThemeAt) writeShared('moshly_theme', ux.theme, serverThemeAt);

        // Tell the account about a newer choice made in this browser (e.g. inside an app).
        const newer = {};
        if (!useServerSkin && (here.skinAt > serverSkinAt || !SKINS.includes(ux.skin))) { newer.skin = here.skin; newer.skinUpdatedAt = here.skinAt || Date.now(); }
        if (!useServerTheme && (here.themeAt > serverThemeAt || !THEMES.includes(ux.theme))) { newer.theme = here.theme; newer.themeUpdatedAt = here.themeAt || Date.now(); }
        if (Object.keys(newer).length && (seed || here.skinAt || here.themeAt)) persist(user, newer);
    }

    // Merge `partial` into the user's uxSettings and persist it (best effort).
    async function save(user, partial) {
        const now = Date.now();
        const stamped = { ...partial };
        if (SKINS.includes(partial.skin)) { stamped.skinUpdatedAt = now; writeShared('moshly_skin', toFamily(partial.skin), now); }
        if (THEMES.includes(partial.theme)) { stamped.themeUpdatedAt = now; writeShared('moshly_theme', partial.theme, now); }
        return persist(user, stamped);
    }

    async function persist(user, partial) {
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
