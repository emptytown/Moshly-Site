/**
 * Moshly Dashboard Logic
 * Fetches real data from the Hub API and populates the UI.
 */

async function initDashboard() {
    // 1. Guard: Ensure session
    const ok = await window.MoshlyAuth.requireSession('/?auth=login');
    if (!ok) return;

    // 2. Fetch User Data (Profiles, Quotas, Workspaces)
    const { ok: fetchOk, data } = await window.MoshlyAuth.authFetch('/me');
    if (!fetchOk) {
        console.error('Failed to fetch dashboard data');
        return;
    }

    const { user } = data;
    updateProfileUI(user);
    updateQuotasUI(user.subscription);
}

function updateProfileUI(user) {
    const nameEls = document.querySelectorAll('.db-user-name, .db-mob-drawer-uname');
    const planEls = document.querySelectorAll('.db-user-plan, .db-mob-drawer-uplan');
    const avatarEls = document.querySelectorAll('.db-user-avatar, .db-mob-drawer-avatar');

    nameEls.forEach(el => el.textContent = user.name || user.email.split('@')[0]);
    planEls.forEach(el => {
        el.textContent = (user.plan || 'Free').toUpperCase() + ' PLAN';
        el.className = `db-user-plan db-plan-${user.plan || 'free'}`;
    });

    if (user.avatarUrl) {
        avatarEls.forEach(el => {
            el.style.backgroundImage = `url(${user.avatarUrl})`;
            el.style.backgroundSize = 'cover';
            el.textContent = '';
        });
    } else {
        const initials = (user.name || user.email)
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
        avatarEls.forEach(el => el.textContent = initials);
    }
}

function updateQuotasUI(sub) {
    if (!sub) return;

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

function formatNumber(num) {
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toString();
}

// Initialize on load
document.addEventListener('DOMContentLoaded', initDashboard);
