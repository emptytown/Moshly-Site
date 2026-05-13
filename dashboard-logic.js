/**
 * Moshly Dashboard Logic
 * Fetches real data from the Hub API and populates the UI.
 */

// Blacklist storage format: { appSlug: expiresAt_timestamp }
function getBlacklistedApps(subscriptionExpiresAt) {
    const blacklist = JSON.parse(localStorage.getItem('moshly_app_blacklist') || '{}');
    const now = Date.now();
    const cleanBlacklist = {};

    for (const [slug, expiresAt] of Object.entries(blacklist)) {
        if (expiresAt > now) {
            cleanBlacklist[slug] = expiresAt;
        }
    }

    localStorage.setItem('moshly_app_blacklist', JSON.stringify(cleanBlacklist));
    return Object.keys(cleanBlacklist);
}

function addToBlacklist(appSlug, subscriptionExpiresAt) {
    const blacklist = JSON.parse(localStorage.getItem('moshly_app_blacklist') || '{}');
    blacklist[appSlug] = subscriptionExpiresAt;
    localStorage.setItem('moshly_app_blacklist', JSON.stringify(blacklist));
}

function getTimeUntilNextCycle(subscriptionExpiresAt) {
    const now = new Date();
    const expiresDate = new Date(subscriptionExpiresAt);
    const diff = expiresDate - now;

    if (diff <= 0) return 'Expired';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h`;
}

window.openAppDisconnectModal = function(appSlug) {
    window._pendingDisconnectApp = appSlug;
    const overlay = document.getElementById('dbAppDisconnectOverlay');
    const timerEl = document.getElementById('dbDisconnectTimer');

    if (overlay && window._currentUser?.subscription?.expiresAt) {
        const timeLeft = getTimeUntilNextCycle(window._currentUser.subscription.expiresAt);
        if (timerEl) {
            timerEl.textContent = `Renews in: ${timeLeft}`;
        }
        overlay.classList.add('open');
        document.body.style.overflow = 'hidden';
    }
};

window.closeAppDisconnectModal = function() {
    const overlay = document.getElementById('dbAppDisconnectOverlay');
    if (overlay) {
        overlay.classList.remove('open');
        document.body.style.overflow = '';
        window._pendingDisconnectApp = null;
    }
};

window.confirmAppDisconnect = async function() {
    const appSlug = window._pendingDisconnectApp;
    if (!appSlug) return;

    // Remove from connected apps
    if (Array.isArray(window._currentUser.apps)) {
        const aliases = {
            'fifthsense': 'fifth sense',
            'fifth sense': 'fifthsense'
        };
        const targetSlugs = [appSlug.toLowerCase().trim()];
        if (aliases[appSlug.toLowerCase().trim()]) {
            targetSlugs.push(aliases[appSlug.toLowerCase().trim()]);
        }

        window._currentUser.apps = window._currentUser.apps.filter(
            s => !targetSlugs.includes(s.toLowerCase().trim())
        );
    }

    // Add to blacklist until next cycle
    if (window._currentUser.subscription?.expiresAt) {
        addToBlacklist(appSlug, window._currentUser.subscription.expiresAt);
    }

    // Save to server
    try {
        const res = await window.MoshlyAuth.authFetch('/me', {
            method: 'PATCH',
            body: JSON.stringify({ connectedApps: window._currentUser.apps })
        });

        if (!res.ok && res.status === 423) {
            const data = await res.json();
            alert(`⏳ ${data.message}\n\nYou can change apps again when your cycle renews.`);
            closeAppDisconnectModal();
            return;
        }

        if (!res.ok) {
            alert('Failed to disconnect app. Please try again.');
            closeAppDisconnectModal();
            return;
        }
    } catch (err) {
        console.error('Failed to save app disconnect:', err);
        alert('An error occurred. Please try again.');
        closeAppDisconnectModal();
        return;
    }

    // Update UI on success
    updateAppsUI(window._currentUser);
    updateAppConnectorUI(window._currentUser);
    closeAppDisconnectModal();
};

window._dashProjects = [];

const PROJECT_SLOT_MAP = {
    'free': 1, 'solo': 3, 'collective': 5, 'business': 15, 'major': 999
};

function escapeHtml(str) {
    return String(str ?? '')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// Global APP_CATALOG with types and categories
const APP_CATALOG = [
    {
        slug: 'quote', name: 'Quote', description: 'Financial hub',
        status: 'live', iconAsset: '/assets/moshly-Quote-logo-svg.svg', url: '/apps/quote.html',
        type: 'Plan app', categories: ['Business', 'Analytics']
    },
    {
        slug: 'fifthsense', name: 'Fifth Sense', description: 'Interactive Circle of Fifths',
        status: 'live', iconAsset: '/assets/moshly-FifhtSense-logo-svg.svg', url: '/apps/fifthsense.html',
        type: 'Free', categories: ['Learning', 'Interactive']
    },
    {
        slug: 'merchpad', name: 'MerchPad', description: 'Merch management',
        status: 'live', iconAsset: '/assets/moshly-merchpad-logo-svg.svg', url: 'https://merchpad.moshly.io',
        type: 'Plan app', categories: ['Business', 'Booking']
    },
    {
        slug: 'rank', name: 'Rank', description: 'SEO visibility tool for independent artists',
        status: 'live', iconAsset: '/assets/moshly-rank-logo-svg.svg', url: 'https://rank.moshly.io',
        type: 'Plan app', categories: ['Business']
    }
];

function _showLaunchError(msg) {
    const existing = document.getElementById('_sso-error-toast');
    if (existing) existing.remove();
    const el = document.createElement('div');
    el.id = '_sso-error-toast';
    el.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#1a1a2e;color:#ff6b6b;border:1px solid #ff6b6b;border-radius:8px;padding:12px 20px;font-size:14px;z-index:9999;box-shadow:0 4px 12px rgba(0,0,0,.4)';
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 5000);
}

// SSO launch: generates a 60s token and redirects to the app's /auth/callback
window.launchApp = async function(appUrl) {
    try {
        const res = await window.MoshlyAuth.authFetch('/auth/sso/token', { method: 'POST' });
        if (!res.ok) throw new Error(`server responded ${res.status}`);
        if (!res.data?.token) throw new Error('no token returned');
        window.location.href = `${appUrl}/auth/callback?token=${encodeURIComponent(res.data.token)}`;
    } catch (e) {
        console.error('SSO launch failed:', e.message);
        _showLaunchError('Could not launch app — please try again or refresh the page.');
    }
};

async function initDashboard() {
    // 1. Guard: Ensure session
    const ok = await window.MoshlyAuth.requireSession('/login');
    if (!ok) return;

    // Update Date Greeting
    const dateEl = document.getElementById('db-date');
    if (dateEl) {
        const now = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        dateEl.textContent = now.toLocaleDateString(undefined, options);
    }

    // 2. Fetch User Data (Profiles, Quotas, Workspaces)
    // requireSession above already ensures we have a valid _accessToken.
    const { ok: fetchOk, data } = await window.MoshlyAuth.authFetch('/me');
    if (!fetchOk) {
        console.error('Failed to fetch dashboard data');
        return;
    }

    const { user } = data;
    
    // Sync user preferences from server to localStorage for immediate availability
    if (user.profile) {
        if (user.profile.uxSettings) {
            if (user.profile.uxSettings.emptySlots) {
                localStorage.setItem('moshly_setting_empty_slots', user.profile.uxSettings.emptySlots);
            }
        }
        // Prefer server-side apps; fall back to localStorage if server returned empty
        const serverApps = Array.isArray(user.profile.connectedApps) ? user.profile.connectedApps : [];
        if (serverApps.length > 0) {
            user.apps = serverApps;
        } else {
            const lsUser = window.MoshlyAuth.getUser();
            const lsApps = Array.isArray(lsUser?.apps) ? lsUser.apps : [];
            user.apps = lsApps;
            if (lsApps.length > 0) {
                // Re-sync orphaned localStorage state back to server
                window._currentUser = user;
                _scheduleSaveApps();
            }
        }
    }

    window._currentUser = user; // Store globally for UI updates
    updateProfileUI(user);
    updateQuotasUI(user.subscription);
    updateSubscriptionUI(user.subscription);
    updateAppsUI(user);
    updateAppConnectorUI(user);

    // 3. Setup Sidebars and Theme
    initSidebarControls();
    initDashboardTheme();
    initUXSettings();

    // 4. Fetch Projects
    fetchProjects();
}

async function fetchProjects() {
    const { ok, data } = await window.MoshlyAuth.authFetch('/projects');
    if (ok) {
        updateProjectsUI(data.projects);
    }
}

function buildProjectBar(project) {
    const icon = getProjectIcon(project.type);
    const typeLabel = project.type
        ? (project.type.charAt(0).toUpperCase() + project.type.slice(1))
        : '';
    const meta = [typeLabel, project.location].filter(Boolean).join(' · ');
    const safeId = escapeHtml(project.id);

    return `
        <div class="db-proj-bar" role="button" tabindex="0" onclick="openProjectModal('${safeId}','view')"
             onkeydown="if(event.key==='Enter'||event.key===' ')openProjectModal('${safeId}','view')">
            <div class="db-proj-icon">${icon}</div>
            <div class="db-proj-bar-info">
                <div class="db-proj-name">${escapeHtml(project.name)}</div>
                ${meta ? `<div class="db-proj-meta">${escapeHtml(meta)}</div>` : ''}
            </div>
            <div class="db-proj-bar-actions">
                <button class="db-proj-bar-btn" title="Edit"
                    onclick="event.stopPropagation(); openProjectModal('${safeId}','edit')" type="button">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                </button>
                <button class="db-proj-bar-btn db-proj-bar-btn--delete" title="Delete"
                    onclick="event.stopPropagation(); deleteProject('${safeId}')" type="button">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
                        <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                    </svg>
                </button>
            </div>
        </div>`;
}

function buildEmptyProjectSlot() {
    return `
        <button class="db-proj-bar db-proj-bar--empty" onclick="openProjectModal()" type="button">
            <span class="db-proj-bar-plus">+</span>
            <span class="db-proj-bar-empty-label">New Project</span>
        </button>`;
}

function updateProjectsUI(projects) {
    const slotListEl = document.getElementById('dbProjSlotList');
    const availEl = document.getElementById('dbProjAvail');
    const managerListEl = document.getElementById('dbProjectsManagerList');

    const plan = (window._currentUser?.subscription?.plan || 'free').toLowerCase();
    const totalSlots = PROJECT_SLOT_MAP[plan] ?? 1;
    const used = projects ? projects.length : 0;
    const remaining = Math.max(0, totalSlots - used);

    window._dashProjects = projects || [];

    if (availEl) availEl.textContent = `${used} / ${totalSlots}`;

    if (slotListEl) {
        let html = (projects || []).map(buildProjectBar).join('');
        if (remaining > 0) html += buildEmptyProjectSlot();
        slotListEl.innerHTML = html;
    }

    // Keep manager modal in sync
    if (managerListEl) {
        if (!projects || projects.length === 0) {
            managerListEl.innerHTML = '<div class="db-manager-empty">No projects found. Create your first one to get started!</div>';
        } else {
            managerListEl.innerHTML = projects.map(p => `
                <div class="db-manager-item">
                    <div class="db-manager-item-icon">${getProjectIcon(p.type)}</div>
                    <div class="db-manager-item-info">
                        <div class="db-manager-item-name">${escapeHtml(p.name)}</div>
                        <div class="db-manager-item-meta">${escapeHtml(p.type)} · ${escapeHtml(p.location || 'No location')}</div>
                    </div>
                    <button class="db-manager-item-btn" onclick="openProjectModal('${escapeHtml(p.id)}','view')">View</button>
                </div>
            `).join('');
        }
    }
}

function getProjectIcon(type) {
    const icons = {
        artist: '👤',
        band: '🎸',
        theatre: '🎭',
        venue: '🏛️',
        festival: '🎡',
        production: '🎬',
        agency: '🧭'
    };
    return icons[type] || '📁';
}

async function submitCreateProject() {
    const name = document.getElementById('dbProjName').value;
    const typeBtn = document.querySelector('.db-proj-type-btn.active');
    const type = typeBtn ? typeBtn.getAttribute('data-type') : null;
    const genre = document.getElementById('dbProjGenre').value;
    const location = document.getElementById('dbProjBasedOn').value;
    const description = document.getElementById('dbProjDesc').value;
    const notes = document.getElementById('dbProjNotes').value;

    // Collect Team
    const team = [];
    document.querySelectorAll('#dbProjTeamRows .db-proj-dyn-row').forEach(row => {
        const active = row.querySelector('.db-proj-switch input').checked;
        const memberName = row.querySelector('.db-proj-team-name').value;
        const role = row.querySelector('.db-proj-team-role').value;
        const fee = row.querySelector('.db-proj-team-fee').value;
        if (memberName || role) {
            team.push({ active, name: memberName, role, fee });
        }
    });

    // Collect Extra Fields
    const extraFields = [];
    document.querySelectorAll('#dbProjExtraFields .db-proj-dyn-row').forEach(row => {
        const active = row.querySelector('.db-proj-switch input').checked;
        const key = row.querySelector('.db-proj-extra-key').value;
        const val = row.querySelector('.db-proj-extra-val').value;
        const sizeBtn = row.querySelector('.db-proj-size-btn.active');
        const size = sizeBtn ? sizeBtn.textContent : 'S';
        if (key) {
            extraFields.push({ active, key, value: val, size });
        }
    });

    // Collect AI Chips
    const aiContextRules = [];
    document.querySelectorAll('.db-proj-ai-chip').forEach(chip => {
        const text = chip.textContent.replace('×', '').trim();
        if (text) aiContextRules.push(text);
    });

    if (!name || !type) {
        alert('Please enter a project name and select a type.');
        return;
    }

    const btn = document.getElementById('dbProjConfirmBtn');
    const originalText = btn.textContent;
    btn.textContent = 'Creating...';
    btn.disabled = true;

    try {
        const { ok, data } = await window.MoshlyAuth.authFetch('/projects', {
            method: 'POST',
            body: JSON.stringify({
                name,
                type,
                genre,
                location,
                description,
                notes,
                team,
                extraFields,
                aiContextRules
            })
        });

        if (ok) {
            alert('Project created successfully!');
            closeProjectModal();
            fetchProjects(); // Refresh the list
        } else {
            alert(data.error || 'Failed to create project.');
        }
    } catch (err) {
        console.error('Project creation error:', err);
        alert('An error occurred.');
    } finally {
        btn.textContent = originalText;
        btn.disabled = false;
    }
}

window.submitCreateProject = submitCreateProject;

// UI Stubs for complex project fields
window.addProjectExtraFieldRow = () => {
    const list = document.getElementById('dbProjExtraFields');
    if (!list) return;
    const row = document.createElement('div');
    row.className = 'db-proj-dyn-row db-proj-dyn-row--extra';
    row.innerHTML = `
        <label class="db-proj-switch db-proj-switch--labeled">
            <input type="checkbox" checked onchange="this.closest('.db-proj-dyn-row--extra').classList.toggle('db-proj-card--inactive',!this.checked)">
            <span class="db-proj-switch-label">Active</span>
            <span class="db-proj-switch-track"></span>
        </label>
        <input type="text" class="db-proj-input db-proj-extra-key" placeholder="Field Name (e.g. Rider)">
        <input type="text" class="db-proj-input db-proj-extra-val" placeholder="Value (e.g. Link)">
        <div class="db-proj-size-toggle" style="display:flex;">
            <button class="db-proj-size-btn active" onclick="this.parentElement.querySelectorAll('button').forEach(b=>b.classList.remove('active'));this.classList.add('active')" type="button">S</button>
            <button class="db-proj-size-btn" onclick="this.parentElement.querySelectorAll('button').forEach(b=>b.classList.remove('active'));this.classList.add('active')" type="button">M</button>
        </div>
        <button class="db-proj-remove" onclick="this.parentElement.remove()" type="button">×</button>
    `;
    list.appendChild(row);
};

window.addProjectTeamRow = () => {
    const list = document.getElementById('dbProjTeamRows');
    if (!list) return;
    const row = document.createElement('div');
    row.className = 'db-proj-dyn-row db-proj-team-card';
    row.innerHTML = `
        <div class="db-proj-card-row">
            <input type="text" class="db-proj-input db-proj-team-name" placeholder="Member Name">
            <label class="db-proj-switch db-proj-switch--labeled">
                <input type="checkbox" checked onchange="this.closest('.db-proj-team-card').classList.toggle('db-proj-card--inactive',!this.checked)">
                <span class="db-proj-switch-label">Active</span>
                <span class="db-proj-switch-track"></span>
            </label>
        </div>
        <div class="db-proj-card-row">
            <input type="text" class="db-proj-input db-proj-team-role" placeholder="Role">
            <input type="number" class="db-proj-input db-proj-team-fee" placeholder="0" min="0">
        </div>
        <button class="db-proj-card-remove" onclick="this.closest('.db-proj-team-card').remove(); updateProjectTeamSummary();" type="button">×</button>
    `;
    list.appendChild(row);
};

window.updateProjectTeamSummary = () => {
    const rows = document.querySelectorAll('#dbProjTeamRows .db-proj-dyn-row');
    const summary = document.getElementById('dbProjTeamSummary');
    if (summary) {
        summary.textContent = `${rows.length} member${rows.length === 1 ? '' : 's'} added`;
    }
};

window.toggleProjectTeamSection = () => {
    const wrap = document.getElementById('dbProjTeamWrap');
    const btn = document.getElementById('dbProjTeamToggleBtn');
    if (wrap) {
        const isOpen = wrap.classList.toggle('open');
        if (btn) btn.textContent = isOpen ? 'Close Team' : 'Open Team';
    }
};
window.addAiContextRule = () => {
    const input = document.getElementById('dbProjAiRuleInput');
    const val = input?.value.trim();
    if (val) {
        const chips = document.getElementById('dbProjAiChips');
        const chip = document.createElement('div');
        chip.className = 'db-proj-ai-chip';
        chip.innerHTML = `${val} <span onclick="this.parentElement.remove()">×</span>`;
        chips.appendChild(chip);
        input.value = '';
    }
};

function initSidebarControls() {
    // Collapse / Expand Sidebar
    const collapseBtn = document.getElementById('dbCollapseBtn');
    const sidebar = document.getElementById('dbSidebar');
    if (collapseBtn && sidebar) {
        collapseBtn.addEventListener('click', () => {
            const isCollapsed = sidebar.classList.toggle('collapsed');
            localStorage.setItem('moshly-sidebar-collapsed', isCollapsed);
        });

        // Restore state
        if (localStorage.getItem('moshly-sidebar-collapsed') === 'true') {
            sidebar.classList.add('collapsed');
        }
    }

    // Sign Out
    const signoutBtns = document.querySelectorAll('.db-signout-btn, .db-mob-drawer-footer-btn.signout');
    signoutBtns.forEach(btn => {
        btn.addEventListener('click', signOut);
    });
}

function signOut() {
    openSignOutConfirmation();
}

/**
 * SIGN OUT CONFIRMATION FLOW
 */
window.openSignOutConfirmation = function() {
    const overlay = document.getElementById('dbSignOutOverlay');
    if (overlay) {
        overlay.classList.add('open');
        document.body.style.overflow = 'hidden';
    }
};

window.closeSignOutConfirmation = function() {
    const overlay = document.getElementById('dbSignOutOverlay');
    if (overlay) {
        overlay.classList.remove('open');
        document.body.style.overflow = '';
        
        // Reset modal content in case it was showing "See you soon"
        setTimeout(() => {
            const title = document.getElementById('signOutTitle');
            const message = document.getElementById('signOutMessage');
            const footer = overlay.querySelector('.db-modal-footer');
            if (title) title.innerText = 'Sign Out';
            if (message) message.innerText = 'Are you sure you want to sign out?';
            if (footer) footer.style.display = 'flex';
        }, 300);
    }
};

window.confirmSignOut = function() {
    const title = document.getElementById('signOutTitle');
    const message = document.getElementById('signOutMessage');
    const footer = document.querySelector('#dbSignOutOverlay .db-modal-footer');

    if (title) title.innerText = 'Logging out...';
    if (message) message.innerText = 'You will be logged out immediately. See you soon!';
    if (footer) footer.style.display = 'none';

    // Delay to let user read the message
    setTimeout(() => {
        if (window.MoshlyAuth && window.MoshlyAuth.logout) {
            window.MoshlyAuth.logout();
        } else {
            // Fallback
            localStorage.removeItem('moshly_token');
            localStorage.removeItem('moshly_user');
            sessionStorage.clear();
            window.location.href = '/login';
        }
    }, 2000);
};

function initDashboardTheme() {
    const themeBtn = document.getElementById('dbThemeBtn');
    const mobThemeBtn = document.getElementById('dbMobThemeBtn');

    if (themeBtn) themeBtn.addEventListener('click', toggleTheme);
    if (mobThemeBtn) mobThemeBtn.addEventListener('click', toggleTheme);

    // Initial UI sync
    const isLight = document.documentElement.classList.contains('theme-light');
    updateDashboardThemeUI(isLight);
}

function initUXSettings() {
    const emptySlotsSetting = localStorage.getItem('moshly_setting_empty_slots') || '12';
    const select = document.getElementById('dbSettingEmptySlots');
    if (select) {
        select.value = emptySlotsSetting;
    }
}

async function updateUXSettings() {
    const select = document.getElementById('dbSettingEmptySlots');
    if (select) {
        const val = select.value;
        localStorage.setItem('moshly_setting_empty_slots', val);
        
        // Persist to server
        if (window._currentUser) {
            const currentUxSettings = window._currentUser.profile?.uxSettings || {};
            const newUxSettings = { ...currentUxSettings, emptySlots: val };
            
            try {
                const { ok } = await window.MoshlyAuth.authFetch('/me', {
                    method: 'PATCH',
                    body: JSON.stringify({ uxSettings: newUxSettings })
                });
                if (ok) {
                    if (!window._currentUser.profile) window._currentUser.profile = {};
                    window._currentUser.profile.uxSettings = newUxSettings;
                }
            } catch (err) {
                console.error('Failed to save UX settings to server:', err);
            }

            updateAppsUI(window._currentUser);
        }

        // Close modal after saving
        if (window.closeProjectContextModal) {
            window.closeProjectContextModal();
        }
    }
}

function updateDashboardThemeUI(isLight) {
    const sunIcons = document.querySelectorAll('#dbThemeIconSun, #dbMobThemeIconSun, .db-theme-sun');
    const moonIcons = document.querySelectorAll('#dbThemeIconMoon, #dbMobThemeIconMoon, .db-theme-moon');
    const labels = document.querySelectorAll('#dbThemeLabel, #dbMobThemeLabel, .db-theme-label');

    sunIcons.forEach(el => el.classList.toggle('db-hidden', !isLight));
    moonIcons.forEach(el => el.classList.toggle('db-hidden', isLight));
    labels.forEach(el => el.textContent = isLight ? 'Dark Mode' : 'Light Mode');
}

function updateProfileUI(user) {
    const nameEls = document.querySelectorAll('.db-user-name, .db-mob-drawer-uname, .db-profile-pname');
    const planEls = document.querySelectorAll('.db-user-plan, .db-mob-drawer-uplan');
    const avatarEls = document.querySelectorAll('.db-user-avatar, .db-mob-drawer-avatar, .db-profile-avatar');
    const firstNameEl = document.getElementById('db-first-name');

    const firstName = user.profile?.firstName || user.name?.split(' ')[0] || user.email.split('@')[0];
    const displayName = user.name || firstName || user.email.split('@')[0];
    
    nameEls.forEach(el => el.textContent = displayName);
    if (firstNameEl) firstNameEl.textContent = firstName;

    planEls.forEach(el => {
        el.textContent = (user.subscription?.plan || 'Free').toUpperCase() + ' PLAN';
        el.className = `db-user-plan db-plan-${user.subscription?.plan || 'free'}`;
    });

    // Update Avatar
    const updateAvatars = (url) => {
        avatarEls.forEach(el => {
            el.style.backgroundImage = url ? `url(${url})` : '';
            el.style.backgroundSize = 'cover';
            el.textContent = url ? '' : initials;
        });
        // Profile Panel Avatar
        const panelAvatar = document.getElementById('dbPanelAvatar');
        if (panelAvatar) {
            panelAvatar.style.backgroundImage = url ? `url(${url})` : '';
            panelAvatar.style.backgroundSize = 'cover';
            panelAvatar.textContent = url ? '' : initials;
        }
    };

    const initials = (user.name || user.email)
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    if (user.avatarUrl) {
        updateAvatars(user.avatarUrl);
    } else {
        updateAvatars(null);
    }

    // Update Profile Panel Info
    const panelName = document.getElementById('dbPanelName');
    const panelEmail = document.getElementById('dbPanelEmail');
    if (panelName) panelName.textContent = displayName;
    if (panelEmail) panelEmail.textContent = user.email;

    // View Mode Fields
    const fieldMapping = {
        'dbPanelViewFirstName': user.profile?.firstName || '—',
        'dbPanelViewLastName': user.profile?.lastName || '—',
        'dbPanelViewName': user.name || '—',
        'dbPanelViewEmail': user.email || '—',
        'dbPanelViewJobTitle': user.profile?.jobTitle || '—',
        'dbPanelViewOrg': user.profile?.organization || '—',
        'dbPanelViewLocation': user.profile?.location || '—',
        'dbPanelViewSkills': user.profile?.skills || '—'
    };
    for (const [id, val] of Object.entries(fieldMapping)) {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
    }

    // Dashboard Cards (using data-field)
    document.querySelectorAll('[data-field]').forEach(el => {
        const field = el.getAttribute('data-field');
        if (field === 'org') el.textContent = user.profile?.organization || '—';
        if (field === 'job_title') el.textContent = user.profile?.jobTitle || '—';
        if (field === 'skills') el.textContent = user.profile?.skills || '—';
        if (field === 'location') el.textContent = user.profile?.location || '—'; if (field === 'email') el.textContent = user.email || '—';
    });
}

function updateQuotasUI(sub) {
    if (!sub) return; updateQuotasCardUI(sub);

    // PDF Exports
    const pdfUsed = sub.pdfExportsUsed || 0;
    const pdfLimit = sub.pdfExportsLimit || 1;
    const pdfPercent = (pdfUsed / pdfLimit) * 100;
    
    const pdfNum = document.querySelector('.db-pdf-ring-num');
    const pdfDenom = document.getElementById('db-pdf-ring-denom');
    const pdfRing = document.getElementById('pdfRingFill');
    
    if (pdfNum) pdfNum.textContent = pdfUsed;
    if (pdfDenom) pdfDenom.textContent = ` / ${pdfLimit}`;
    if (pdfRing) {
        const circumference = 2 * Math.PI * 35;
        pdfRing.style.strokeDasharray = `${circumference} ${circumference}`;
        pdfRing.style.strokeDashoffset = circumference - (pdfPercent / 100) * circumference;
    }

    // AI Credits
    const aiUsed = sub.aiCreditsUsed || 0;
    const aiLimit = sub.aiCreditsLimit || 100;
    const aiPercent = (aiUsed / aiLimit) * 100;

    const aiNum = document.getElementById('db-ai-ring-num');
    const aiDenom = document.getElementById('db-ai-ring-denom');
    const aiRing = document.getElementById('aiRingFill');

    if (aiNum) aiNum.textContent = formatNumber(aiLimit - aiUsed);
    if (aiDenom) aiDenom.textContent = ` / ${formatNumber(aiLimit)}`;
    if (aiRing) {
        const circumference = 2 * Math.PI * 35;
        aiRing.style.strokeDasharray = `${circumference} ${circumference}`;
        aiRing.style.strokeDashoffset = circumference - (aiPercent / 100) * circumference;
    }
}

function updateSubscriptionUI(sub) {
    const planNameEl = document.getElementById('db-billing-plan-name');
    const planRenewEl = document.getElementById('db-plan-renew-sub');
    const planPriceEl = document.getElementById('db-billing-price');
    
    if (planNameEl) {
        planNameEl.textContent = (sub?.plan || 'Free').charAt(0).toUpperCase() + (sub?.plan || 'Free').slice(1) + ' Plan';
    }

    if (planPriceEl) {
        const prices = { 'free': '€0.00', 'solo': '€4.99', 'collective': '€9.99', 'business': '€24.99', 'major': '€79.99' };
        planPriceEl.textContent = prices[sub?.plan?.toLowerCase()] || '€0.00';
    }

    if (planRenewEl && sub?.expiresAt) {
        const date = new Date(sub.expiresAt);
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        planRenewEl.textContent = `Renews on ${date.toLocaleDateString(undefined, options)}`;
    } else if (planRenewEl) {
        planRenewEl.textContent = 'No active subscription cycle.';
    }
}

async function handlePhotoFileChange(input) {
    const file = input.files[0];
    if (!file) return;

    // 1. Client-side preview & size check
    if (file.size > 2 * 1024 * 1024) {
        alert('Image too large. Please select a file under 2MB.');
        return;
    }

    // 2. Convert to Base64 (Temporary solution if no R2)
    const reader = new FileReader();
    reader.onload = async (e) => {
        const base64Data = e.target.result;

        // 3. Upload to /api/me
        try {
            const { ok, data } = await window.MoshlyAuth.authFetch('/me', {
                method: 'PATCH',
                body: JSON.stringify({ avatarUrl: base64Data })
            });

            if (ok) {
                // Update all avatars in UI
                const avatarEls = document.querySelectorAll('.db-user-avatar, .db-mob-drawer-avatar, .db-profile-avatar, #dbPanelAvatar');
                avatarEls.forEach(el => {
                    el.style.backgroundImage = `url(${base64Data})`;
                    el.style.backgroundSize = 'cover';
                    el.textContent = '';
                });
                alert('Photo updated successfully!');
            } else {
                alert('Failed to upload photo.');
            }
        } catch (err) {
            console.error('Photo upload error:', err);
            alert('An error occurred during upload.');
        }
    };
    reader.readAsDataURL(file);
}

function updateAppsUI(user) {
    const appsGrid = document.getElementById('dbAppsGrid');
    const peekGrid = document.getElementById('dbPeekGrid');
    if (!appsGrid) return;

    const activeAppSlugs = Array.isArray(user.apps) ? user.apps.map(s => s.toLowerCase().trim()) : [];
    // Ensure we only have one entry per app (handle aliases)
    const uniqueActiveAppSlugs = [...new Set(activeAppSlugs.map(s => (s === 'fifth sense' ? 'fifthsense' : s)))];

    const activeApps = APP_CATALOG.filter(a => uniqueActiveAppSlugs.includes(a.slug.toLowerCase().trim()));

    // Determine slot capacity based on plan
    const plan = (user.subscription?.plan || 'free').toLowerCase();
    const slotMap = { 'free': 0, 'solo': 3, 'collective': 6, 'business': 12, 'major': 24 };
    const totalSlots = slotMap[plan] || 0;

    // 1. Permanent Slots (Main Apps)
    const activeMainApps = activeApps.filter(a => a.type !== 'Free');
    const activeFreeApps = activeApps.filter(a => a.type === 'Free');

    // Get blacklisted apps for this cycle
    const blacklistedApps = getBlacklistedApps(user.subscription?.expiresAt);

    let appsHtml = activeMainApps.map(app => {
        const isNew = window._newApps && window._newApps.includes(app.slug);
        const isBlacklisted = blacklistedApps.includes(app.slug);
        const slotClass = isBlacklisted
            ? 'db-app-slot db-app-slot--blacklisted'
            : isNew ? 'db-app-slot db-app-slot--new' : 'db-app-slot';
        const linkAttr = app.url.includes('.moshly.io')
            ? `href="javascript:void(0)" onclick="window.launchApp('${app.url}')"`
            : `href="${app.url}"`;

        const disconnectBtn = isBlacklisted ? '' : `
            <button class="db-app-disconnect-btn" onclick="event.preventDefault(); event.stopPropagation(); openAppDisconnectModal('${app.slug}')" title="Disconnect app">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
        `;

        const statusText = isBlacklisted ? 'Locked until next cycle' : 'Live';

        return `
            <a ${isBlacklisted ? 'href="javascript:void(0)"' : linkAttr} class="${slotClass}">
                ${disconnectBtn}
                <div class="db-app-slot-top">
                    <div class="db-app-slot-icon">
                        <img src="${app.iconAsset}" alt="${app.name}">
                    </div>
                    <div class="db-app-slot-meta">
                        <div class="db-app-slot-name">${app.name}</div>
                        <div class="db-app-slot-status">${statusText}</div>
                    </div>
                </div>
                <div class="db-app-slot-desc">${app.description}</div>
                <div class="db-app-slot-action">
                    <button class="db-app-slot-btn" type="button" ${isBlacklisted ? 'disabled' : ''}>
                        ${isBlacklisted ? 'Locked' : 'Use App'}
                    </button>
                </div>
            </a>
        `;
    }).join('');

    // Clear new apps list after rendering
    if (window._newApps) {
        window._newApps = [];
    }

    // Add empty slots
    // 1. A quantidade de slots vazios em display deve ser identico ao permitido pelo plano em uso
    // Updated Logic: Max shown empty slots is now user configurable (default 12).
    // If used >= base, show 3 more empty slots (capped by plan limit).
    const usedCount = activeMainApps.length;
    const baseSlots = parseInt(localStorage.getItem('moshly_setting_empty_slots') || '12', 10);
    
    let displayedSlots;
    if (usedCount < baseSlots) {
        displayedSlots = baseSlots;
    } else {
        displayedSlots = Math.floor(usedCount / 3) * 3 + 3;
    }
    
    // Cap by the actual plan total
    const effectiveTotal = Math.min(totalSlots, displayedSlots);
    const emptySlotsCount = Math.max(0, effectiveTotal - usedCount);

    for (let i = 0; i < emptySlotsCount; i++) {
        appsHtml += `
            <a href="javascript:void(0)" class="db-app-slot db-app-slot--empty" onclick="window.openAppConnectorModal ? window.openAppConnectorModal() : null">
                <div class="db-app-slot-empty-content">
                    <div class="db-app-slot-plus-circle">+</div>
                    <span class="db-app-slot-label">Connect App</span>
                </div>
            </a>
        `;
    }

    appsGrid.innerHTML = appsHtml;

    // 2. Peek Slot Section Logic
    if (peekGrid) {
        // 2. Deve sempre haver um Peek Slot visivel
        const peekSection = document.getElementById('dbPeekSection');
        if (peekSection) peekSection.classList.remove('db-hidden');

        const peekAppSlug = user.peek_app?.toLowerCase();
        // Look in catalog for peek app info
        const peekApp = APP_CATALOG.find(a => a.slug === peekAppSlug);

        if (peekApp) {
            const peekLinkAttr = peekApp.url.includes('.moshly.io')
                ? `href="javascript:void(0)" onclick="window.launchApp('${peekApp.url}')"`
                : `href="${peekApp.url}"`;
            peekGrid.innerHTML = `
                <a ${peekLinkAttr} class="db-app-slot db-app-slot--peek">
                    <div class="db-app-slot-top">
                        <div class="db-app-slot-icon">
                            <img src="${peekApp.iconAsset}" alt="${peekApp.name}">
                        </div>
                        <div class="db-app-slot-meta">
                            <div class="db-app-slot-name">${peekApp.name}</div>
                            <div class="db-app-slot-status">Peek Active</div>
                        </div>
                    </div>
                    <div class="db-app-slot-desc">${peekApp.description}</div>
                    <div class="db-app-slot-action">
                        <button class="db-app-slot-btn" type="button">Use App</button>
                    </div>
                </a>
            `;
        } else {
            peekGrid.innerHTML = `
                <a href="javascript:void(0)" class="db-app-slot db-app-slot--empty" onclick="window.openAppConnectorModal ? window.openAppConnectorModal() : null">
                    <div class="db-app-slot-empty-content">
                        <div class="db-app-slot-plus-circle">+</div>
                        <span class="db-app-slot-label">Try any App (24h)</span>
                    </div>
                </a>
            `;
        }
    }

    const freeAppsGrid = document.getElementById('dbFreeAppsGrid');
    if (freeAppsGrid) {
        // 3. Devem haver sempre pelo menos 3 slots para Free Apps Visiveis
        // Updated Logic: Always start with 3 empty slots. If used >= 3, show 3 more empty slots (incremental).
        // Render active free apps first
        let freeAppsHtml = activeFreeApps.map(app => `
            <a href="${app.url}" class="db-app-slot">
                <div class="db-app-slot-icon">
                    <img src="${app.iconAsset}" alt="${app.name}">
                </div>
                <div class="db-app-slot-info">
                    <div class="db-app-slot-name">${app.name}</div>
                    <div class="db-app-slot-desc">${app.description}</div>
                    <div class="db-app-slot-status">Free</div>
                    <div class="db-app-slot-action">
                        <button class="db-app-slot-btn" type="button">Use App</button>
                    </div>
                </div>
            </a>
        `).join('');

        // Incremental logic for free slots
        const usedFreeCount = activeFreeApps.length;
        let displayedFreeSlots;
        if (usedFreeCount < 3) {
            displayedFreeSlots = 3;
        } else {
            displayedFreeSlots = Math.floor(usedFreeCount / 3) * 3 + 3;
        }

        const emptyFreeSlotsCount = Math.max(0, displayedFreeSlots - usedFreeCount);
        for (let i = 0; i < emptyFreeSlotsCount; i++) {
            freeAppsHtml += `
                <a href="javascript:void(0)" class="db-app-slot db-app-slot--empty" onclick="window.openAppConnectorModal ? window.openAppConnectorModal() : null">
                    <div class="db-app-slot-empty-content">
                        <div class="db-app-slot-plus-circle">+</div>
                        <span class="db-app-slot-label">Connect App</span>
                    </div>
                </a>
            `;
        }

        freeAppsGrid.innerHTML = freeAppsHtml;
    }
}

function updateAppConnectorUI(user) {
    const moshlyList = document.getElementById('dbMoshlyAppsList');
    const freeList = document.getElementById('dbFreeMoshlyAppsList');
    const infoEl = document.getElementById('dbConnectorInfo');
    if (!moshlyList || !freeList) return;

    // Plan & Capacity Logic
    const plan = (user.subscription?.plan || 'free').toLowerCase();
    const slotMap = { 'free': 0, 'solo': 3, 'collective': 6, 'business': 12, 'major': 24 };
    const totalSlots = slotMap[plan] || 0;
    const activeAppSlugs = Array.isArray(user.apps) ? user.apps.map(s => s.toLowerCase().trim()) : [];
    
    // Normalize aliases for usage calculation
    const usageSlugs = activeAppSlugs.map(s => {
        const normalized = s.toLowerCase().trim();
        if (normalized === 'fifth sense') return 'fifthsense';
        return normalized;
    });
    const uniqueUsageSlugs = [...new Set(usageSlugs)];
    
    // Only count non-free apps towards the usage limit
    const freeSlugs = APP_CATALOG.filter(a => a.type === 'Free').map(a => a.slug);
    const normalizedFreeSlugs = freeSlugs.map(s => s.toLowerCase().trim());
    
    const usedSlots = uniqueUsageSlugs.filter(slug => !normalizedFreeSlugs.includes(slug)).length;
    const remainingSlots = Math.max(0, totalSlots - usedSlots);

    if (infoEl) {
        infoEl.innerHTML = `
            <div class="db-connector-info-card">
                <div class="db-connector-info-header">
                    <span class="db-connector-info-plan-tag">${plan.toUpperCase()} PLAN</span>
                    <span class="db-connector-info-usage">${usedSlots} / ${totalSlots} Slots used</span>
                </div>
                <div class="db-connector-info-bar">
                    <div class="db-connector-info-fill" style="width: ${totalSlots > 0 ? (usedSlots / totalSlots) * 100 : 0}%"></div>
                </div>
                <div class="db-connector-info-footer">
                    ${remainingSlots > 0 
                        ? `<span class="db-connector-info-status">You have <strong>${remainingSlots}</strong> slot${remainingSlots === 1 ? '' : 's'} available to connect apps.</span>`
                        : `<span class="db-connector-info-status">Capacity reached. Upgrade your plan for more slots.</span>`
                    }
                </div>
            </div>
        `;
    }

    // Filter by UI selects if they exist
    const typeFilter = document.getElementById('dbAppTypeFilter')?.value || 'all';
    const categoryFilter = document.getElementById('dbAppCategoryFilter')?.value || 'all';

    const filteredCatalog = APP_CATALOG.filter(app => {
        if (app.hidden) return false;
        const matchesType = typeFilter === 'all' || app.type === typeFilter;
        const matchesCategory = categoryFilter === 'all' || app.categories.includes(categoryFilter);
        return matchesType && matchesCategory;
    });

    // 1. Moshly Apps (Plan apps & Premium)
    const moshlyApps = filteredCatalog.filter(a => a.type !== 'Free');

    moshlyList.innerHTML = moshlyApps.map(app => {
        const slug = app.slug;
        const isConnected = activeAppSlugs.some(s => s === slug || (slug === 'fifthsense' && s === 'fifth sense'));
        const canConnect = remainingSlots > 0;
        
        let buttonHtml = '';
        if (isConnected) {
            buttonHtml = `<button class="db-app-action-btn db-app-action-btn--disconnect" onclick="toggleAppConnection('${slug}', false)">Disconnect</button>`;
        } else {
            buttonHtml = `<button class="db-app-action-btn db-app-action-btn--connect" ${canConnect ? '' : 'disabled'} onclick="toggleAppConnection('${slug}', true)">Connect Now</button>`;
        }

        return `
            <div class="db-app-connector-row ${isConnected ? 'db-app-connector-row--connected' : ''}">
                <div class="db-app-connector-main">
                    <strong>${app.name}</strong>
                    <span>${app.description}</span>
                    <div class="db-app-connector-categories">
                        ${app.categories.map(c => `<span class="db-category-tag">${c}</span>`).join('')}
                    </div>
                </div>
                <div class="db-app-connector-side">
                    <span class="db-status-tag">${app.status}</span>
                    <div class="db-app-connector-actions">
                        ${buttonHtml}
                    </div>
                </div>
            </div>
        `;
    }).join('');

    if (moshlyApps.length === 0) {
        moshlyList.innerHTML = '<div class="db-connector-empty">No apps match the selected filters.</div>';
    }

    // 2. Free Moshly Apps
    const freeApps = filteredCatalog.filter(a => a.type === 'Free');

    freeList.innerHTML = freeApps.map(app => {
        const slug = app.slug;
        const isConnected = activeAppSlugs.some(s => s === slug || (slug === 'fifth sense' && s === 'fifthsense'));
        
        let buttonHtml = '';
        if (isConnected) {
            buttonHtml = `<button class="db-app-action-btn db-app-action-btn--disconnect" onclick="toggleAppConnection('${slug}', false)">Disconnect</button>`;
        } else {
            buttonHtml = `<button class="db-app-action-btn db-app-action-btn--connect" onclick="toggleAppConnection('${slug}', true)">Connect Now</button>`;
        }

        return `
            <div class="db-app-connector-row ${isConnected ? 'db-app-connector-row--connected' : ''}">
                <div class="db-app-connector-main">
                    <strong>${app.name}</strong>
                    <span>${app.description}</span>
                    <div class="db-app-connector-categories">
                        ${app.categories.map(c => `<span class="db-category-tag">${c}</span>`).join('')}
                    </div>
                </div>
                <div class="db-app-connector-side">
                    <span class="db-status-tag" style="color: var(--color-success); border-color: var(--color-success);">Free</span>
                    <div class="db-app-connector-actions">
                        ${buttonHtml}
                    </div>
                </div>
            </div>
        `;
    }).join('');

    if (freeApps.length === 0) {
        freeList.innerHTML = '<div class="db-connector-empty">No free apps match the selected filters.</div>';
    }
}

/**
 * Triggered by filter changes in the UI
 */
function applyAppFilters() {
    const user = window._currentUser;
    if (user) updateAppConnectorUI(user);
}

let _saveAppsTimer = null;

function _scheduleSaveApps() {
    clearTimeout(_saveAppsTimer);
    _saveAppsTimer = setTimeout(async () => {
        const user = window._currentUser;
        if (!user || !Array.isArray(user.apps)) return;
        try {
            await window.MoshlyAuth.authFetch('/me', {
                method: 'PATCH',
                body: JSON.stringify({ connectedApps: user.apps })
            });
        } catch (err) {
            console.error('Failed to auto-save app choices:', err);
        }
    }, 600);
}

function toggleAppConnection(appSlug, isChecked) {
    if (!window._currentUser) return;

    if (!Array.isArray(window._currentUser.apps)) {
        window._currentUser.apps = [];
    }

    const normalizedSlug = appSlug.toLowerCase().trim();

    if (isChecked) {
        if (!window._currentUser.apps.some(s => s.toLowerCase().trim() === normalizedSlug)) {
            window._currentUser.apps.push(appSlug);
        }
    } else {
        const aliases = {
            'fifthsense': 'fifth sense',
            'fifth sense': 'fifthsense'
        };
        const targetSlugs = [normalizedSlug];
        if (aliases[normalizedSlug]) targetSlugs.push(aliases[normalizedSlug]);

        window._currentUser.apps = window._currentUser.apps.filter(
            s => !targetSlugs.includes(s.toLowerCase().trim())
        );
    }

    // Mirror apps into localStorage so MoshlyAuth.getUser() stays consistent
    const lsUser = window.MoshlyAuth.getUser();
    if (lsUser) {
        lsUser.apps = window._currentUser.apps;
        localStorage.setItem('moshly_user', JSON.stringify(lsUser));
    }

    if (isChecked) {
        if (!window._newApps) window._newApps = [];
        window._newApps.push(appSlug);
    }

    updateAppsUI(window._currentUser);
    updateAppConnectorUI(window._currentUser);

    _scheduleSaveApps();
}

async function saveAppChoices() {
    const user = window._currentUser;
    if (user && Array.isArray(user.apps)) {
        clearTimeout(_saveAppsTimer);
        try {
            await window.MoshlyAuth.authFetch('/me', {
                method: 'PATCH',
                body: JSON.stringify({ connectedApps: user.apps })
            });
        } catch (err) {
            console.error('Failed to save app choices to server:', err);
        }
    }

    if (window.closeAppConnectorModal) {
        window.closeAppConnectorModal();
    }

    const appsSection = document.getElementById('apps');
    if (appsSection) {
        appsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function formatNumber(num) {
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toString();
}

/**
 * Handles permanent and destructive actions in the Deadly Zone.
 * @param {string} action - The type of danger action to perform.
 */
async function handleDangerAction(action) {
    if (action === 'terminate') {
        return terminateAccount();
    }

    const messages = {
        disconnect: "This will disconnect all connected apps and integrations. Continue?",
        erase: "This will clear your local browser cache and sign you out. Continue?",
    };

    if (!confirm(messages[action])) return;


    try {
        switch (action) {
            case 'erase':
                // Clear all local storage types
                localStorage.clear();
                sessionStorage.clear();
                
                // Clear cookies (best effort for client-side)
                document.cookie.split(";").forEach(function(c) { 
                    document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
                });

                alert("Local cache erased. Redirecting to login...");
                window.location.href = '/login';
                break;

            case 'disconnect':
                const discRes = await window.MoshlyAuth.authFetch('/me/disconnect', { method: 'POST' });
                if (discRes.ok) alert('All apps disconnected.');
                break;

        }
    } catch (err) {
        console.error(`Deadly Zone Error (${action}):`, err);
        alert('An error occurred while performing this action.');
    }
}

/**
 * Handles the "Terminate Account" action with mandatory confirmation and timing choice.
 */
async function terminateAccount() {
    // 1. Initial Warning
    const initialWarning = "DANGER: This will permanently delete your ENTIRE account. This action is NOT REVOKABLE even if you choose to terminate at the end of the cycle.";
    if (!confirm(initialWarning)) return;

    // 2. Choice of Timing
    // OK = Terminate NOW, Cancel = End of Cycle
    const choice = confirm("Press OK to terminate NOW (Immediate effect) or CANCEL to terminate at the END OF THE CYCLE.");
    const timing = choice ? 'now' : 'end_of_cycle';

    // 3. Mandatory Confirmation String
    const verify = prompt(`To confirm ${timing.replace(/_/g, ' ')} termination, please type "DELETE ACCOUNT":`);
    if (verify !== 'DELETE ACCOUNT') {
        alert("Confirmation failed. Action cancelled.");
        return;
    }

    try {
        const { ok, data: result } = await window.MoshlyAuth.authFetch('/me', {
            method: 'DELETE',
            body: JSON.stringify({ timing: timing })
        });

        if (ok) {
            if (timing === 'now') {
                alert("Account terminated immediately. Logging out.");
                await window.MoshlyAuth.logout();
            } else {
                alert("Account scheduled for termination at the end of the cycle. This action cannot be undone.");
                window.location.reload();
            }
        } else {
            alert(`Error: ${result?.error || 'Failed to terminate account'}`);
        }
    } catch (err) {
        console.error("Termination Error:", err);
        alert("An error occurred during account termination.");
    }
}

async function submitEditProject(projectId) {
    const name = document.getElementById('dbProjName')?.value?.trim();
    const typeBtn = document.querySelector('.db-proj-type-btn.active');
    const type = typeBtn?.getAttribute('data-type') || null;
    const genre = document.getElementById('dbProjGenre')?.value?.trim();
    const location = document.getElementById('dbProjBasedOn')?.value?.trim();
    const description = document.getElementById('dbProjDesc')?.value?.trim();
    const notes = document.getElementById('dbProjNotes')?.value?.trim();

    // Collect Team
    const team = [];
    document.querySelectorAll('#dbProjTeamRows .db-proj-dyn-row').forEach(row => {
        const active = row.querySelector('.db-proj-switch input')?.checked ?? true;
        const memberName = row.querySelector('.db-proj-team-name')?.value ?? '';
        const role = row.querySelector('.db-proj-team-role')?.value ?? '';
        const fee = row.querySelector('.db-proj-team-fee')?.value ?? '';
        if (memberName || role) team.push({ active, name: memberName, role, fee });
    });

    // Collect Extra Fields
    const extraFields = [];
    document.querySelectorAll('#dbProjExtraFields .db-proj-dyn-row').forEach(row => {
        const active = row.querySelector('.db-proj-switch input')?.checked ?? true;
        const key = row.querySelector('.db-proj-extra-key')?.value ?? '';
        const val = row.querySelector('.db-proj-extra-val')?.value ?? '';
        const sizeBtn = row.querySelector('.db-proj-size-btn.active');
        const size = sizeBtn ? sizeBtn.textContent : 'S';
        if (key) extraFields.push({ active, key, value: val, size });
    });

    // Collect AI Chips
    const aiContextRules = [];
    document.querySelectorAll('.db-proj-ai-chip').forEach(chip => {
        const text = chip.textContent.replace('×', '').trim();
        if (text) aiContextRules.push(text);
    });

    if (!name || !type) {
        alert('Please enter a project name and select a type.');
        return;
    }

    const btn = document.getElementById('dbProjConfirmBtn');
    const originalText = btn?.textContent;
    if (btn) { btn.textContent = 'Saving…'; btn.disabled = true; }

    try {
        const { ok, data } = await window.MoshlyAuth.authFetch(`/projects/${encodeURIComponent(projectId)}`, {
            method: 'PATCH',
            body: JSON.stringify({ name, type, genre, location, description, notes, team, extraFields, aiContextRules })
        });
        if (ok) {
            closeProjectModal();
            fetchProjects();
        } else {
            alert(data?.error || 'Failed to update project.');
        }
    } catch (err) {
        console.error('Edit project error:', err);
        alert('An error occurred. Please try again.');
    } finally {
        if (btn) { btn.textContent = originalText; btn.disabled = false; }
    }
}

async function deleteProject(projectId) {
    if (!confirm('Delete this project? This cannot be undone.')) return;
    try {
        const { ok, data } = await window.MoshlyAuth.authFetch(`/projects/${encodeURIComponent(projectId)}`, {
            method: 'DELETE'
        });
        if (ok) {
            fetchProjects();
        } else {
            alert(data?.error || 'Failed to delete project.');
        }
    } catch (err) {
        console.error('Delete project error:', err);
        alert('An error occurred. Please try again.');
    }
}

// Export to window so the HTML onclick can find it
window.handleDangerAction = handleDangerAction;
window.submitEditProject = submitEditProject;
window.deleteProject = deleteProject;
window.handlePhotoFileChange = handlePhotoFileChange;
window.updateUXSettings = updateUXSettings;

// Initialize on load
document.addEventListener('DOMContentLoaded', initDashboard);

function updateQuotasCardUI(sub) {
    const renewEl = document.getElementById("db-billing-renewal-val");
    const appsEl = document.getElementById("db-billing-apps-val");
    const pdfEl = document.getElementById("db-billing-pdf-val");
    const aiEl = document.getElementById("db-billing-ai-val");

    if (renewEl && sub.expiresAt) renewEl.textContent = new Date(sub.expiresAt).toLocaleDateString(undefined, { month: "short", day: "numeric" });
    if (appsEl) {
        const slotMap = { 'free': 0, 'solo': 3, 'collective': 6, 'business': 12, 'major': 24 };
        appsEl.textContent = slotMap[sub.plan] ?? '0';
    }
    if (pdfEl) pdfEl.textContent = sub.pdfExportsLimit || "1";
    if (aiEl) aiEl.textContent = formatNumber(sub.aiCreditsLimit || 100);
}
