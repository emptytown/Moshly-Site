/**
 * Dashboard billing: plan summary, plan picker, Stripe Checkout and customer portal.
 * The plan itself always comes from /api/me (Moshly database); this file only
 * starts checkout (/api/billing/checkout) or opens the portal (/api/billing/portal).
 *
 * Plans and prices mirror pricing.html; limits mirror functions/api/_plans.js.
 */
(function () {
    'use strict';

    const PLANS = {
        solo: {
            name: 'Solo',
            for: 'One artist, one project',
            price: { month: '€4.99', year: '€49.99' },
            features: ['3 paid app slots + 3 free', '12 PDF exports a month', '500 AI credits a month', '1 project'],
        },
        collective: {
            name: 'Collective',
            for: 'A band, a small label or a booker',
            price: { month: '€9.99', year: '€99.99' },
            features: ['6 paid app slots + 3 free', '50 PDF exports a month', '1,250 AI credits a month', '3 projects'],
        },
    };
    const PLAN_NAMES = { free: 'Free', solo: 'Solo', collective: 'Collective', business: 'Business', major: 'Major' };
    const PRICES = { free: '€0.00', solo: '€4.99', collective: '€9.99', business: '€24.99', major: '€79.99' };
    const YEAR_PRICES = { solo: '€49.99', collective: '€99.99' };
    const ENTITLED = ['active', 'trialing', 'past_due'];

    let interval = 'month';
    let busy = false;

    const $ = (id) => document.getElementById(id);
    const fmtDate = (d) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

    function sub() { return window._currentUser?.subscription || null; }
    function hasStripeSubscription(s) {
        return s?.billingProvider === 'stripe' && ENTITLED.includes(s.billingStatus) && s.plan !== 'free';
    }

    /** One status for the whole UI: { label, tone, line }. */
    function describe(s) {
        const plan = s?.plan || 'free';
        if (plan === 'free') return { label: 'Free', tone: 'neutral', line: 'Free plan. Upgrade any time.' };
        const until = s.expiresAt ? fmtDate(s.expiresAt) : null;
        if (s.billingStatus === 'past_due') {
            return { label: 'Payment issue', tone: 'warning', line: 'Your last payment failed. Update your card in Manage billing to keep your plan.' };
        }
        if (s.cancelAtPeriodEnd) {
            return { label: 'Cancelled', tone: 'warning', line: until ? `Cancelled. Your plan stays active until ${until}, then moves to Free.` : 'Cancelled at the end of the period.' };
        }
        if (s.billingStatus === 'trialing') {
            return { label: 'Trial', tone: 'active', line: until ? `Free trial until ${until}. Your first payment is on that date.` : 'Free trial.' };
        }
        if (s.billingProvider) {
            return { label: 'Active', tone: 'active', line: until ? `Renews on ${until}.` : 'Active.' };
        }
        // Invite code or manual grant: no renewal.
        return { label: 'Active', tone: 'active', line: until ? `Included until ${until}.` : 'Included with your account.' };
    }

    function priceLabel(s) {
        const plan = s?.plan || 'free';
        if (s?.billingInterval === 'year' && YEAR_PRICES[plan]) return `${YEAR_PRICES[plan]} / year`;
        return plan === 'free' ? PRICES.free : `${PRICES[plan] || PRICES.free} / month`;
    }

    /** Subscription card + profile billing actions. Called from updateSubscriptionUI. */
    function renderSummary(s) {
        const d = describe(s);
        const plan = s?.plan || 'free';
        const nameEl = $('db-billing-plan-name');
        if (nameEl) nameEl.textContent = `${PLAN_NAMES[plan] || plan} Plan`;
        const priceEl = $('db-billing-price');
        if (priceEl) priceEl.textContent = priceLabel(s);
        const lineEl = $('db-plan-renew-sub');
        if (lineEl) lineEl.textContent = d.line;
        const badge = $('db-sub-status-badge');
        if (badge) {
            badge.className = `db-stat-badge db-stat-badge--flush db-bill-badge db-bill-badge--${d.tone}`;
            const label = badge.querySelector('[data-label]');
            if (label) label.textContent = d.label;
        }

        const cancelBtn = $('db-billing-cancel-btn');
        if (cancelBtn) cancelBtn.hidden = !(hasStripeSubscription(s) && !s.cancelAtPeriodEnd);
        const manageBtn = $('db-billing-manage-btn');
        if (manageBtn) manageBtn.hidden = !s?.hasBillingAccount;
        const changeBtn = $('db-billing-change-btn');
        if (changeBtn) changeBtn.textContent = plan === 'free' ? 'Upgrade' : 'Change plan';
    }

    function renderModal() {
        const s = sub();
        const d = describe(s);
        const plan = s?.plan || 'free';
        $('dbBillCurrentName').textContent = `${PLAN_NAMES[plan] || plan}`;
        $('dbBillCurrentPrice').textContent = priceLabel(s);
        $('dbBillCurrentLine').textContent = d.line;
        const badge = $('dbBillCurrentBadge');
        badge.textContent = d.label;
        badge.className = `db-bill-badge db-bill-badge--${d.tone}`;

        document.querySelectorAll('[data-bill-interval]').forEach((btn) => {
            const on = btn.dataset.billInterval === interval;
            btn.classList.toggle('active', on);
            btn.setAttribute('aria-pressed', String(on));
        });

        const managed = hasStripeSubscription(s);
        const appleManaged = s?.billingProvider === 'apple' && ENTITLED.includes(s.billingStatus);
        const list = $('dbBillPlans');
        list.innerHTML = '';
        Object.entries(PLANS).forEach(([id, p]) => {
            const isCurrent = plan === id && (s?.billingInterval || 'month') === interval;
            const li = document.createElement('li');
            li.className = 'db-bill-plan' + (plan === id ? ' db-bill-plan--current' : '');

            const head = document.createElement('div');
            head.className = 'db-bill-plan-head';
            head.innerHTML = '<div><h4 class="db-bill-plan-name"></h4><p class="db-bill-plan-for"></p></div>' +
                '<div class="db-bill-plan-price"><strong></strong><span></span></div>';
            head.querySelector('.db-bill-plan-name').textContent = p.name;
            head.querySelector('.db-bill-plan-for').textContent = p.for;
            head.querySelector('strong').textContent = p.price[interval];
            head.querySelector('span').textContent = interval === 'year' ? '/ year' : '/ month';
            li.appendChild(head);

            const ul = document.createElement('ul');
            ul.className = 'db-bill-plan-features';
            p.features.forEach((f) => { const item = document.createElement('li'); item.textContent = f; ul.appendChild(item); });
            li.appendChild(ul);

            const btn = document.createElement('button');
            btn.type = 'button';
            if (appleManaged) {
                btn.className = 'db-btn-secondary db-bill-plan-btn';
                btn.textContent = 'Managed in the App Store';
                btn.disabled = true;
            } else if (isCurrent) {
                btn.className = 'db-btn-secondary db-bill-plan-btn';
                btn.textContent = 'Current plan';
                btn.disabled = true;
            } else if (managed) {
                // Switching between paid plans happens in the portal (proration handled by Stripe).
                btn.className = 'db-btn-secondary db-bill-plan-btn';
                btn.textContent = `Switch to ${p.name}`;
                btn.addEventListener('click', () => openPortal('update'));
            } else {
                btn.className = 'db-btn-primary db-bill-plan-btn';
                btn.textContent = `Choose ${p.name}`;
                btn.addEventListener('click', () => startCheckout(id));
            }
            li.appendChild(btn);
            list.appendChild(li);
        });

        const manage = $('dbBillManageBtn');
        manage.hidden = !s?.hasBillingAccount;
        $('dbBillPortalHint').hidden = !managed;
        setError('');
    }

    function setError(msg) {
        const el = $('dbBillError');
        if (!el) return;
        el.textContent = msg;
        el.hidden = !msg;
    }

    function setBusy(on) {
        busy = on;
        document.querySelectorAll('#dbBillingOverlay button').forEach((b) => {
            if (on) { b.dataset.wasDisabled = b.disabled ? '1' : ''; b.disabled = true; }
            else { b.disabled = b.dataset.wasDisabled === '1'; }
        });
        $('dbBillingOverlay')?.classList.toggle('db-bill-busy', on);
    }

    async function startCheckout(plan) {
        if (busy) return;
        setBusy(true);
        setError('');
        const { ok, data } = await window.MoshlyAuth.authFetch('/billing/checkout', {
            method: 'POST', body: JSON.stringify({ plan, interval }),
        });
        if (ok && data?.url) { window.location.assign(data.url); return; }
        setBusy(false);
        setError(data?.message || 'Could not start checkout. Please try again.');
    }

    async function openPortal(flow) {
        if (busy) return;
        setBusy(true);
        setError('');
        const { ok, data } = await window.MoshlyAuth.authFetch('/billing/portal', {
            method: 'POST', body: JSON.stringify(flow ? { flow } : {}),
        });
        if (ok && data?.url) { window.location.assign(data.url); return; }
        setBusy(false);
        const msg = data?.message || 'Could not open billing. Please try again.';
        if (document.getElementById('dbBillingOverlay')?.classList.contains('open')) setError(msg);
        else window.alert(msg);
    }

    function open() {
        const s = sub();
        interval = s?.billingInterval === 'year' ? 'year' : 'month';
        renderModal();
        window.ModalManager.open('dbBillingOverlay');
        $('dbBillingOverlay').querySelector('.db-bill-close')?.focus();
    }

    function close() { window.ModalManager.close('dbBillingOverlay'); }

    function setInterval(value) { interval = value === 'year' ? 'year' : 'month'; renderModal(); }

    /** After Checkout, the webhook may land a moment later: re-read /api/me a few times. */
    async function handleReturn() {
        const params = new URLSearchParams(window.location.search);
        const result = params.get('billing');
        if (!result) return;
        params.delete('billing');
        const query = params.toString();
        history.replaceState(null, '', window.location.pathname + (query ? `?${query}` : '') + window.location.hash);

        if (result === 'cancelled') { notice('Checkout cancelled. Nothing was charged.'); return; }
        if (result !== 'success') return;
        notice('Thank you! Your payment went through. Updating your plan…');
        for (let i = 0; i < 6; i++) {
            await new Promise((r) => setTimeout(r, 2000));
            const { ok, data } = await window.MoshlyAuth.authFetch('/me');
            const s = ok ? data?.user?.subscription : null;
            if (s && s.plan !== 'free') {
                window._currentUser.subscription = s;
                if (typeof window.updateSubscriptionUI === 'function') window.updateSubscriptionUI(s);
                if (typeof window.updateQuotasUI === 'function') window.updateQuotasUI(s);
                notice(`You are on ${PLAN_NAMES[s.plan] || s.plan}. Enjoy!`);
                return;
            }
        }
        notice('Your payment went through. Your plan will update in a minute; refresh the page if it does not.');
    }

    function notice(msg) {
        let el = $('dbBillNotice');
        if (!el) {
            el = document.createElement('div');
            el.id = 'dbBillNotice';
            el.className = 'db-bill-notice';
            el.setAttribute('role', 'status');
            document.body.appendChild(el);
        }
        el.textContent = msg;
        el.hidden = false;
        clearTimeout(el._t);
        el._t = setTimeout(() => { el.hidden = true; }, 7000);
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && $('dbBillingOverlay')?.classList.contains('open')) close();
    });

    window.MoshlyBilling = { open, close, setInterval, openPortal, renderSummary, handleReturn, describe };
})();
