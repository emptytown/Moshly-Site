/**
 * Moshly Apps — single source of truth for the app catalog and slot rules.
 *
 * Used by BOTH hub views so they always show the same apps and slots:
 *   - dashboard.html  (cards)  → dashboard-logic.js
 *   - launcher.html   (icons)
 *
 * Slot limits mirror `appsLimit` / `freeAppsLimit` in functions/api/_plans.js.
 * If pricing changes, update both files together.
 */
(function (global) {
    'use strict';

    const CATALOG = Object.freeze([
        {
            slug: 'quote', name: 'Quote', description: 'Financial hub',
            status: 'live', iconAsset: '/assets/moshly-Quote-logo-svg.svg', iconBrutal: '/assets/neo-brut-icons/quote.png', url: '/apps/quote.html',
            shell: true, origin: 'https://quote.moshly.io', entry: '/callback',
            type: 'Plan app', categories: ['Business', 'Analytics']
        },
        {
            slug: 'fifthsense', name: 'Fifth Sense', description: 'Interactive Circle of Fifths',
            status: 'live', iconAsset: '/assets/moshly-FifhtSense-logo-svg.svg', iconBrutal: '/assets/neo-brut-icons/fifthsense.png', url: '/apps/fifthsense.html',
            shell: true, origin: 'https://fifthsense.moshly.io', entry: '/',
            type: 'Free', categories: ['Learning', 'Interactive']
        },
        {
            slug: 'merchpad', name: 'MerchPad', description: 'Merch management',
            status: 'live', iconAsset: '/assets/moshly-merchpad-logo-svg.svg', iconBrutal: '/assets/neo-brut-icons/merchpad.png', url: 'https://merchpad.moshly.io',
            shell: true, entry: '/auth/callback',
            type: 'Plan app', categories: ['Business', 'Booking']
        },
        {
            slug: 'rank', name: 'Rank', description: 'SEO visibility tool for independent artists',
            status: 'live', iconAsset: '/assets/moshly-rank-logo-svg.svg', iconBrutal: '/assets/neo-brut-icons/rank.png', url: 'https://rank.moshly.io',
            type: 'Plan app', categories: ['Business']
        },
        {
            slug: 'run', name: 'Run', description: 'Interactive Roadbooks for tours and shows',
            status: 'live', iconAsset: '/assets/moshly-run-logo-svg.svg', iconBrutal: '/assets/neo-brut-icons/run.png', url: 'https://run.moshly.io',
            shell: true, entry: '/auth/callback',
            type: 'Plan app', categories: ['Business', 'Tour']
        },
        {
            slug: 'days', name: 'Days', description: 'Task management and scheduling',
            status: 'live', iconAsset: '/assets/moshly-days-logo-svg.svg', iconBrutal: '/assets/neo-brut-icons/days.png', url: 'https://days.moshly.io',
            shell: true, entry: '/auth/callback',
            type: 'Plan app', categories: ['Business', 'Productivity']
        },
        {
            slug: 'time', name: 'Time', description: 'Fullscreen clock, timer, stopwatch and countdowns',
            status: 'live', iconAsset: '/assets/moshly-time-logo-svg.svg', iconBrutal: '/assets/neo-brut-icons/time.png', url: 'https://time.moshly.io',
            shell: true,
            type: 'Free', categories: ['Productivity', 'Tour']
        }
    ]);

    // Mirrors PLAN_LIMITS[plan].appsLimit (god/semi_god get major-tier limits, see GOD_TIER_PLANS).
    const PLAN_APP_SLOTS = Object.freeze({
        free: 0, solo: 3, collective: 6, business: 12, major: 24, semi_god: 24, god: 24
    });
    // Mirrors PLAN_LIMITS[plan].freeAppsLimit — free apps are shown in rows of 3.
    const FREE_APP_ROW = 3;

    function planOf(user) {
        return String(user?.subscription?.plan || user?.plan || 'free').toLowerCase();
    }

    function appSlotsFor(plan) {
        return PLAN_APP_SLOTS[String(plan || 'free').toLowerCase()] ?? 0;
    }

    function normalizeSlug(s) {
        const n = String(s || '').toLowerCase().trim();
        return n === 'fifth sense' ? 'fifthsense' : n;
    }

    // Resolution order (same in both views):
    //   1. user.apps — the client's live list (the dashboard updates it on connect/disconnect)
    //   2. profile.connectedApps from /me
    //   3. the cached session user's apps (offline / server returned an empty list)
    function activeSlugs(user) {
        let list = Array.isArray(user?.apps) ? user.apps : [];
        if (!Array.isArray(user?.apps)) {
            const server = Array.isArray(user?.profile?.connectedApps) ? user.profile.connectedApps : [];
            if (server.length) {
                list = server;
            } else {
                try {
                    const cached = JSON.parse(localStorage.getItem('moshly_user') || 'null');
                    if (Array.isArray(cached?.apps)) list = cached.apps;
                } catch (_) {}
            }
        }
        return [...new Set(list.map(normalizeSlug))];
    }

    function findApp(slug) {
        const s = normalizeSlug(slug);
        return CATALOG.find(a => a.slug === s) || null;
    }

    // Apps disconnected this billing cycle stay locked until it ends. Format: { slug: expiresAtMs }.
    function blacklistedSlugs() {
        let blacklist = {};
        try { blacklist = JSON.parse(localStorage.getItem('moshly_app_blacklist') || '{}') || {}; } catch (_) {}
        const now = Date.now();
        const clean = {};
        for (const [slug, expiresAt] of Object.entries(blacklist)) {
            if (expiresAt > now) clean[slug] = expiresAt;
        }
        try { localStorage.setItem('moshly_app_blacklist', JSON.stringify(clean)); } catch (_) {}
        return Object.keys(clean);
    }

    function emptySlotSetting() {
        let v = 12;
        try { v = parseInt(localStorage.getItem('moshly_setting_empty_slots') || '12', 10); } catch (_) {}
        return Number.isFinite(v) && v > 0 ? v : 12;
    }

    /**
     * Everything a hub view needs to render the apps area. Both views must render
     * exactly these lists/counts — only the presentation differs.
     */
    function layout(user) {
        const slugs = activeSlugs(user);
        const active = CATALOG.filter(a => slugs.includes(a.slug));
        const mainApps = active.filter(a => a.type !== 'Free');
        const freeApps = active.filter(a => a.type === 'Free');
        const plan = planOf(user);
        const totalSlots = appSlotsFor(plan);

        // Plan slots: show the user's "empty slots" preference (default 12), growing by a row of 3
        // once it is filled, never beyond what the plan allows.
        const used = mainApps.length;
        const displayed = used < emptySlotSetting() ? emptySlotSetting() : Math.floor(used / 3) * 3 + 3;
        const emptyMain = Math.max(0, Math.min(totalSlots, displayed) - used);

        // Free slots: always at least one row of 3, plus a new row once a row is full.
        const usedFree = freeApps.length;
        const displayedFree = usedFree < FREE_APP_ROW ? FREE_APP_ROW : Math.floor(usedFree / FREE_APP_ROW) * FREE_APP_ROW + FREE_APP_ROW;
        const emptyFree = Math.max(0, displayedFree - usedFree);

        return {
            plan, totalSlots, mainApps, freeApps, emptyMain, emptyFree,
            peekApp: findApp(user?.peek_app),
            blacklisted: blacklistedSlugs()
        };
    }

    // Browshly (app.html): apps flagged `shell: true` open inside the Moshly frame instead of
    // leaving moshly.io. `origin` is the app's own site when `url` is a page on moshly.io;
    // `entry` is the path that receives the one-time sign-in `?token=` (none: no sign-in).
    // Returns the app's origin, or null if it must not be framed.
    function shellOrigin(app) {
        if (!app || app.shell !== true) return null;
        try {
            const u = new URL(app.origin || app.url);
            return u.protocol === 'https:' && u.hostname.endsWith('.moshly.io') ? u.origin : null;
        } catch (_) { return null; }
    }

    // Where the hub sends the user to open an app: the frame for shell apps, else null.
    function shellUrlFor(appUrl) {
        const app = CATALOG.find(a => a.url === appUrl);
        return shellOrigin(app) ? `/app?app=${encodeURIComponent(app.slug)}` : null;
    }

    global.MoshlyApps = Object.freeze({
        CATALOG, PLAN_APP_SLOTS, appSlotsFor, planOf, normalizeSlug, activeSlugs, findApp, blacklistedSlugs, layout,
        shellOrigin, shellUrlFor
    });
})(window);
