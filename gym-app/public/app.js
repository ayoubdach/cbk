const appRoot = document.getElementById('app');
const toastRegion = document.getElementById('toast-region');

const iconPaths = {
  home: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/><path d="M9 21v-6h6v6"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"/><circle cx="9.5" cy="7" r="4"/><path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  cash: '<rect x="2.5" y="5" width="19" height="14" rx="2"/><path d="M2.5 10h19M7 15h.01M17 15h.01"/><circle cx="12" cy="12" r="2.4"/>',
  chart: '<path d="M3 3v18h18"/><path d="m7 14 4-4 3 3 6-7"/><path d="M17 6h3v3"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.8-.7a8.2 8.2 0 0 1-1.7 1l-.3 1.9h-2.8l-.3-1.9a8.2 8.2 0 0 1-1.7-1l-1.8.7-1.4-2.4L7.9 15a8.2 8.2 0 0 1 0-2l-1.4-1.1L7.9 9.5l1.8.7a8.2 8.2 0 0 1 1.7-1l.3-1.9h2.8l.3 1.9a8.2 8.2 0 0 1 1.7 1l1.8-.7 1.4 2.4-1.4 1.1a8.2 8.2 0 0 1 .1 2z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/>',
  search: '<circle cx="10.8" cy="10.8" r="6.3"/><path d="m16 16 4.5 4.5"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  logout: '<path d="M10 17l5-5-5-5M15 12H3"/><path d="M12 3h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/>',
  send: '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  chevron: '<path d="m9 18 6-6-6-6"/>',
  close: '<path d="m18 6-12 12M6 6l12 12"/>',
  download: '<path d="M12 3v12m0 0 4-4m-4 4-4-4"/><path d="M5 18v3h14v-3"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>',
  shield: '<path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z"/><path d="m9 12 2 2 4-4"/>',
  trend: '<path d="m3 17 6-6 4 4 8-9"/><path d="M15 6h6v6"/>',
  dumbbell: '<path d="m6.5 6.5 11 11m-13-8 5-5m5 13 5-5M3 10l7-7m4 18 7-7"/>',
  sparkle: '<path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3Z"/><path d="m19 14 1 2.5 2.5 1-2.5 1L19 21l-1-2.5-2.5-1 2.5-1L19 14Z"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
  phone: '<path d="M21 16.5v3a2 2 0 0 1-2.2 2A19.8 19.8 0 0 1 10 18.4a19.4 19.4 0 0 1-6-6A19.8 19.8 0 0 1 1.5 3.2 2 2 0 0 1 3.5 1h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L7.4 9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.3 2.6Z"/>',
  card: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>',
  lock: '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/><path d="M12 14v3"/>',
  database: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>',
  filter: '<path d="M4 7h16M7 12h10m-7 5h4"/>',
  refresh: '<path d="M20 7v5h-5M4 17v-5h5"/><path d="M5.6 9A7 7 0 0 1 18 6l2 6M4 12l2 6a7 7 0 0 0 12.4-3"/>',
  more: '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
};

const state = {
  user: null,
  config: null,
  overview: null,
  members: [],
  plans: [],
  payments: [],
  reminders: [],
  campaigns: [],
  campaignRecipients: [],
  campaignRecipientText: null,
  view: 'overview',
  memberFilter: 'all',
  memberSearch: '',
  modal: null,
  mobileNavOpen: false,
  busy: false,
  pollTimer: null,
};

function icon(name, extraClass = '') {
  return `<svg class="${extraClass}" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${iconPaths[name] || iconPaths.info}</svg>`;
}

function esc(value = '') {
  return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}

function initials(name = '') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  return (parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : (parts[0] || 'G').slice(0, 2)).toUpperCase();
}

function avatarClass(id = 0) {
  return ['','avatar-blue','avatar-amber','avatar-rose','avatar-lilac'][Math.abs(Number(id) || 0) % 5];
}

function currencyDigits() {
  return Number(state.config?.currencyDigits ?? 2);
}

function moneyFromMinor(value) {
  const amount = Number(value || 0) / (10 ** currencyDigits());
  try {
    return new Intl.NumberFormat('en', {
      style: 'currency', currency: state.config?.currency || 'TND',
      minimumFractionDigits: currencyDigits(), maximumFractionDigits: currencyDigits(),
    }).format(amount);
  } catch {
    return `${amount.toFixed(currencyDigits())} ${state.config?.currency || ''}`;
  }
}

function inputMoneyFromMinor(value) {
  return (Number(value || 0) / (10 ** currencyDigits())).toFixed(currencyDigits());
}

function todayString() {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: state.config?.timezone || 'Africa/Tunis', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
  const part = (type) => parts.find((item) => item.type === type)?.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}

function addDays(dateString, count) {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day + count)).toISOString().slice(0, 10);
}

function dateLabel(value, options = { month: 'short', day: 'numeric', year: undefined }) {
  if (!value) return '—';
  const date = new Date(`${value.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(date.valueOf())) return value;
  return new Intl.DateTimeFormat('en', options).format(date);
}

function dateTimeLabel(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return value;
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(date);
}

function relativeDays(days) {
  if (days === 0) return 'Ends today';
  if (days === 1) return '1 day left';
  if (days > 1) return `${days} days left`;
  if (days === -1) return 'Expired 1 day ago';
  return `Expired ${Math.abs(days)} days ago`;
}

async function api(url, options = {}) {
  const headers = new Headers(options.headers || {});
  if (options.body !== undefined && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  const response = await fetch(url, { ...options, headers, credentials: 'same-origin' });
  let payload = {};
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try { payload = await response.json(); } catch { payload = {}; }
  }
  if (!response.ok) {
    const error = new Error(payload.error || `Request failed (${response.status}).`);
    error.status = response.status;
    if (response.status === 401 && state.user) {
      state.user = null;
      state.modal = null;
      stopPolling();
      renderLogin('Your session expired. Sign in again to continue.');
    }
    throw error;
  }
  return payload;
}

function showToast(message, type = 'success') {
  const item = document.createElement('div');
  item.className = `toast${type === 'error' ? ' error' : ''}`;
  item.innerHTML = `${icon(type === 'error' ? 'info' : 'check')}<span>${esc(message)}</span>`;
  toastRegion.append(item);
  setTimeout(() => item.remove(), 4200);
}

function setBusy(button, busy, label) {
  if (!button) return;
  button.disabled = busy;
  button.setAttribute('aria-busy', String(busy));
  if (label && busy) {
    button.dataset.originalLabel = button.innerHTML;
    button.innerHTML = `<span class="boot-spinner" style="width:13px;height:13px;border-width:2px"></span>${esc(label)}`;
  } else if (!busy && button.dataset.originalLabel) {
    button.innerHTML = button.dataset.originalLabel;
    delete button.dataset.originalLabel;
  }
}

function renderBoot() {
  appRoot.innerHTML = `<main class="boot-screen"><div class="boot-mark">G</div><div class="boot-spinner"></div><p>Getting your gym ready…</p></main>`;
}

function renderAuthAside() {
  return `<aside class="auth-aside">
    <div class="auth-brand"><div class="brand-mark">G</div><span>Gymflow</span></div>
    <div class="auth-copy">
      <span class="auth-kicker">Made for your gym</span>
      <h1>Less admin.<br>More progress.</h1>
      <p>Keep memberships, renewals and cash payments in one clear place. Your gym data stays on your own computer.</p>
      <div class="auth-feature-list">
        <div class="auth-feature"><span>${icon('users')}</span><span>Member records and membership history</span></div>
        <div class="auth-feature"><span>${icon('calendar')}</span><span>Expiry countdowns and email reminders</span></div>
        <div class="auth-feature"><span>${icon('database')}</span><span>Free local SQLite database</span></div>
      </div>
    </div>
    <div class="auth-footer">A simple, private home for your gym operations.</div>
  </aside>`;
}

function renderSetup(message = '') {
  appRoot.innerHTML = `<main class="auth-screen">
    ${renderAuthAside()}
    <section class="auth-panel"><div class="auth-card">
      <div class="auth-card-top"><p class="eyebrow">First-time setup</p><h2>Set up your gym</h2><p>Create your owner account. Your SQLite database is created automatically on this computer.</p></div>
      ${message ? `<div class="notice-banner" role="alert">${icon('info')}<div><strong>Setup note</strong><p>${esc(message)}</p></div></div>` : ''}
      <form id="setup-form" class="form-grid" autocomplete="on">
        <div class="field"><label for="setup-gym">Gym name</label><input class="control" id="setup-gym" name="gymName" maxlength="100" placeholder="e.g. Northside Fitness" value="My Gym" required></div>
        <div class="setup-split">
          <div class="field"><label for="setup-name">Your name</label><input class="control" id="setup-name" name="name" autocomplete="name" maxlength="100" placeholder="Owner name" required></div>
          <div class="field"><label for="setup-currency">Currency code</label><input class="control" id="setup-currency" name="currency" maxlength="3" value="TND" placeholder="TND" required></div>
        </div>
        <div class="field"><label for="setup-email">Owner email</label><input class="control" id="setup-email" name="email" type="email" autocomplete="email" placeholder="you@example.com" required></div>
        <div class="field"><label for="setup-password">Password</label><input class="control" id="setup-password" name="password" type="password" autocomplete="new-password" minlength="10" placeholder="At least 10 characters" required><p class="form-hint">Use a strong password. It protects access to your member data.</p></div>
        <div class="field"><label for="setup-timezone">Gym timezone</label><input class="control" id="setup-timezone" name="timezone" maxlength="100" value="Africa/Tunis" placeholder="Africa/Tunis" required><p class="form-hint">Use an IANA timezone, for example Africa/Tunis or Europe/Paris.</p></div>
        <button class="button button-primary button-full" type="submit">Create gym workspace ${icon('arrow')}</button>
      </form>
      <div class="security-note">${icon('shield')}<span>Local-first and free to run. Email delivery can be connected later with SMTP settings; reminders will not send until that is configured.</span></div>
    </div></section>
  </main>`;
}

function renderLogin(message = '') {
  appRoot.innerHTML = `<main class="auth-screen">
    ${renderAuthAside()}
    <section class="auth-panel"><div class="auth-card">
      <div class="auth-card-top"><p class="eyebrow">Welcome back</p><h2>Sign in to your gym</h2><p>Use your owner account to manage members, memberships and payments.</p></div>
      ${message ? `<div class="notice-banner" role="alert">${icon('info')}<div><strong>Sign-in needed</strong><p>${esc(message)}</p></div></div>` : ''}
      <form id="login-form" class="form-grid" autocomplete="on">
        <div class="field"><label for="login-email">Email address</label><input class="control" id="login-email" name="email" type="email" autocomplete="username" placeholder="you@example.com" required></div>
        <div class="field"><label for="login-password">Password</label><input class="control" id="login-password" name="password" type="password" autocomplete="current-password" placeholder="Your password" required></div>
        <button class="button button-primary button-full" type="submit">Sign in ${icon('arrow')}</button>
      </form>
      <div class="security-note">${icon('lock')}<span>For privacy, this dashboard is accessible only to signed-in staff on this server.</span></div>
    </div></section>
  </main>`;
}

const viewTitles = {
  overview: ['Workspace', 'Overview'],
  members: ['Manage members', 'Members'],
  payments: ['Cash collection', 'Payments'],
  campaigns: ['Member communications', 'Email campaigns'],
  insights: ['Understand your numbers', 'Insights'],
  settings: ['Workspace setup', 'Settings'],
};

function navItem(view, label, iconName, badge = '') {
  return `<button class="nav-item${state.view === view ? ' active' : ''}" type="button" data-view="${view}"${state.view === view ? ' aria-current="page"' : ''}>${icon(iconName)}<span>${label}</span>${badge ? `<span class="nav-badge">${badge}</span>` : ''}</button>`;
}

function renderSidebar() {
  const expiringCount = Number(state.overview?.stats?.expiringSoon || 0);
  return `<aside class="sidebar" aria-label="Main navigation">
    <div class="sidebar-brand"><div class="brand-mark">G</div><div class="brand-copy"><strong>${esc(state.config?.gymName || 'Your Gym')}</strong><small>GYM MANAGEMENT</small></div><button class="mobile-sidebar-close" type="button" data-action="close-mobile-nav" aria-label="Close navigation">${icon('close')}</button></div>
    <div class="sidebar-label">Workspace</div>
    <nav class="sidebar-nav">
      ${navItem('overview', 'Overview', 'home')}
      ${navItem('members', 'Members', 'users', expiringCount ? String(expiringCount) : '')}
      ${navItem('payments', 'Payments', 'cash')}
      ${navItem('campaigns', 'Email campaigns', 'send')}
      ${navItem('insights', 'Insights', 'chart')}
    </nav>
    <div class="sidebar-label">Manage</div>
    <nav class="sidebar-nav">${navItem('settings', 'Settings', 'settings')}</nav>
    <div class="sidebar-spacer"></div>
    <div class="sidebar-plan-card"><div class="sidebar-plan-icon">${icon('sparkle')}</div><strong>Keep your data safe</strong><p>Download a SQLite backup from Settings regularly.</p></div>
    <div class="sidebar-profile"><div class="profile-avatar">${esc(initials(state.user?.name))}</div><div class="profile-name"><strong>${esc(state.user?.name || 'Gym owner')}</strong><small>Owner account</small></div><button class="profile-menu" type="button" data-action="logout" title="Sign out" aria-label="Sign out">${icon('logout')}</button></div>
  </aside>`;
}

function renderTopbar() {
  const [, title] = viewTitles[state.view] || viewTitles.overview;
  const currentDate = new Intl.DateTimeFormat('en', { weekday: 'short', month: 'short', day: 'numeric', timeZone: state.config?.timezone || 'Africa/Tunis' }).format(new Date());
  const hasNotices = !state.config?.smtpConfigured && state.view !== 'settings';
  return `<header class="topbar">
    <div class="topbar-left"><button class="mobile-menu" type="button" data-action="open-mobile-nav" aria-label="Open navigation">${icon('menu')}</button><div><div class="breadcrumb">GYMFLOW <span style="padding:0 4px;color:#b0b9b2">/</span> ${esc(title.toUpperCase())}</div><h2 class="topbar-heading">${esc(title)}</h2></div></div>
    <div class="topbar-actions"><span class="header-date">${esc(currentDate)}</span><span class="header-separator"></span><button class="icon-button" type="button" data-view="settings" title="Email and app settings" aria-label="Open settings">${icon('bell')}${hasNotices ? '<span class="notify-dot"></span>' : ''}</button><button class="button button-accent" type="button" data-action="new-member">${icon('plus')}<span>Add member</span></button></div>
  </header>`;
}

function renderPageHeading(title, subtitle, actions = '') {
  return `<div class="page-heading"><div><h1>${title}</h1><p>${subtitle}</p></div>${actions ? `<div class="page-heading-actions">${actions}</div>` : ''}</div>`;
}

function renderEmailNotice() {
  if (state.config?.smtpConfigured) return '';
  return `<div class="notice-banner">${icon('mail')}<div><strong>Email delivery is not configured yet</strong><p>Expiry reminders will be queued, but won't be delivered until SMTP details are added in Settings.</p></div><button class="notice-action" type="button" data-view="settings">Set up email ${icon('arrow')}</button></div>`;
}

function statCard(label, value, foot, iconName, tone = '') {
  return `<article class="stat-card"><div class="stat-top"><span class="stat-label">${label}</span><span class="stat-icon ${tone}">${icon(iconName)}</span></div><div class="stat-value">${value}</div><div class="stat-foot">${foot}</div></article>`;
}

function chartMarkup(rows, showMoney = false) {
  if (!rows?.length) return `<div class="chart-empty">No payments recorded in this period yet.</div>`;
  const maximum = Math.max(0, ...rows.map((row) => Number(row.amountMinor || 0)));
  if (!maximum) return `<div class="chart-empty">Cash payments will appear here as you confirm them.</div>`;
  return rows.map((row, index) => {
    const amount = Number(row.amountMinor || 0);
    const height = amount ? Math.max(5, (amount / maximum) * 100) : 3;
    const label = new Intl.DateTimeFormat('en', { weekday: 'short', timeZone: state.config?.timezone || 'Africa/Tunis' }).format(new Date(`${row.date}T12:00:00`));
    return `<div class="bar-column${index === rows.length - 1 ? ' today' : ''}" title="${esc(dateLabel(row.date))}: ${esc(moneyFromMinor(amount))}"><div class="bar-track"><div class="bar-fill" style="height:${height}%"></div></div><span class="bar-label">${esc(label)}</span></div>`;
  }).join('');
}

function renderPlanMix(plans) {
  if (!plans?.length) return `<div class="plan-mix-empty">Your active membership plans will appear here once you create a plan and register members.</div>`;
  const max = Math.max(...plans.map((plan) => Number(plan.members || 0)), 1);
  return `<div class="plan-mix-list">${plans.map((plan) => `<div class="plan-mix-row"><span class="plan-mix-title">${esc(plan.name)}</span><span class="plan-mix-count">${Number(plan.members)} ${Number(plan.members) === 1 ? 'member' : 'members'}</span><div class="plan-mix-track"><div class="plan-mix-bar" style="width:${Math.max(4, Number(plan.members) / max * 100)}%"></div></div></div>`).join('')}</div>`;
}

function renderExpiringRows(rows) {
  if (!rows?.length) return `<div class="empty-mini">No active memberships are expiring this week.</div>`;
  return rows.map((member, index) => `<div class="due-row"><div class="member-avatar ${avatarClass(member.id)}">${esc(initials(member.name))}</div><div class="member-main"><strong>${esc(member.name)}</strong><small>${esc(member.planName)} · ends ${esc(dateLabel(member.endDate))}</small></div><div class="due-count"><strong>${esc(relativeDays(member.daysRemaining))}</strong><small>${member.email ? esc(member.email) : 'No email added'}</small></div></div>`).join('');
}

function renderRecentPayments(payments) {
  if (!payments?.length) return `<div class="empty-mini">Confirmed cash payments will show here.</div>`;
  return payments.map((payment) => `<div class="activity-row"><div class="cash-icon">${icon('cash')}</div><div class="member-main"><strong>${esc(payment.member_name)}</strong><small>${esc(payment.plan_name)} · ${esc(dateLabel(payment.paid_on))}</small></div><div class="activity-amount">${esc(moneyFromMinor(payment.amountMinor))}<small>Cash confirmed</small></div></div>`).join('');
}

function renderOverview() {
  if (!state.overview) return `<div class="loading-inline"><span class="boot-spinner"></span>Loading your dashboard…</div>`;
  const { stats, revenueByDay, plans, recentPayments, expiringMembers } = state.overview;
  const actions = `<button class="button button-secondary" type="button" data-action="export-payments">${icon('download')}Export cash</button>`;
  const noPlans = !state.plans.some((plan) => plan.active);
  const onboarding = noPlans ? `<div class="onboarding-card"><div class="onboarding-copy"><span class="onboarding-mark">${icon('dumbbell')}</span><div><h3>Start with a membership plan</h3><p>Set your monthly fee and plan duration before adding your first member.</p></div></div><button class="button button-primary" type="button" data-action="create-plan">Create a plan ${icon('arrow')}</button></div>` : '';
  const noMembers = Number(stats.totalMembers) === 0;
  const sampleAction = noMembers && state.plans.length === 0 ? `<button class="button button-secondary" type="button" data-action="load-demo">${icon('sparkle')}Load sample data</button>` : '';
  return `${renderPageHeading(`Good day, <span>${esc(state.user?.name?.split(' ')[0] || 'Owner')}</span>`, 'Your gym at a glance. Cash payments are counted only after you confirm them.', `${sampleAction}${actions}`)}
    ${renderEmailNotice()}${onboarding}
    <div class="stat-grid">
      ${statCard('ACTIVE MEMBERS', String(stats.activeMembers), `<strong>${stats.totalMembers} total</strong><span> · ${stats.newMembers30} new in 30d</span>`, 'users')}
      ${statCard('EXPIRING THIS WEEK', String(stats.expiringSoon), `<span class="warn">${stats.expiredMembers} expired</span><span>· check renewals</span>`, 'clock', 'amber')}
      ${statCard('CASH THIS MONTH', moneyFromMinor(stats.revenueMonthMinor), `<span>${moneyFromMinor(stats.revenueTodayMinor)}</span><span> collected today</span>`, 'cash', 'blue')}
      ${statCard('OUTSTANDING', moneyFromMinor(stats.outstandingMinor), `<span>On current memberships</span>`, 'card', 'rose')}
    </div>
    <div class="dashboard-grid">
      <section class="panel panel-pad"><div class="panel-head"><div><h3 class="panel-title">Cash collected</h3><p class="panel-subtitle">Confirmed payments over the last 7 days</p></div><button class="panel-link" type="button" data-view="payments">Payment history ${icon('chevron')}</button></div><div class="chart-summary"><strong>${esc(moneyFromMinor(stats.revenueMonthMinor))}</strong><span>month to date</span></div><div class="bar-chart" role="img" aria-label="Cash payments collected over the last seven days">${chartMarkup(revenueByDay)}</div></section>
      <section class="panel panel-pad"><div class="panel-head"><div><h3 class="panel-title">Popular memberships</h3><p class="panel-subtitle">Current active members by plan</p></div><button class="panel-link" type="button" data-view="settings">Manage plans ${icon('chevron')}</button></div>${renderPlanMix(plans)}</section>
    </div>
    <div class="lower-grid">
      <section class="panel panel-pad"><div class="panel-head"><div><h3 class="panel-title">Needs your attention</h3><p class="panel-subtitle">Members with a membership ending in the next 7 days</p></div><button class="panel-link" type="button" data-view="members" data-filter="expiring">View all ${icon('chevron')}</button></div><div class="due-list">${renderExpiringRows(expiringMembers)}</div></section>
      <section class="panel panel-pad"><div class="panel-head"><div><h3 class="panel-title">Recent cash payments</h3><p class="panel-subtitle">Latest admin-confirmed collections</p></div><button class="panel-link" type="button" data-view="payments">See payments ${icon('chevron')}</button></div><div class="activity-list">${renderRecentPayments(recentPayments)}</div></section>
    </div>`;
}

function filteredMembers() {
  const search = state.memberSearch.trim().toLowerCase();
  return state.members.filter((member) => {
    if (search && ![member.name, member.email, member.phone, member.membership?.planName].some((value) => String(value || '').toLowerCase().includes(search))) return false;
    const status = member.membership?.status || 'no-plan';
    if (state.memberFilter === 'active' && !['active', 'expiring'].includes(status)) return false;
    if (state.memberFilter === 'expiring' && status !== 'expiring') return false;
    if (state.memberFilter === 'expired' && status !== 'expired') return false;
    if (state.memberFilter === 'unpaid' && !['due', 'partial'].includes(member.paymentState)) return false;
    return true;
  });
}

function membershipStatusBadge(status = 'no-plan') {
  const labels = { active: 'Active', expiring: 'Expiring', expired: 'Expired', upcoming: 'Upcoming', paused: 'Paused', cancelled: 'Cancelled', 'no-plan': 'No plan' };
  return `<span class="status-pill status-${esc(status)}">${esc(labels[status] || status)}</span>`;
}

function paymentStatusBadge(status = 'none') {
  const labels = { paid: 'Paid', partial: 'Part paid', due: 'Due', none: 'No balance' };
  return `<span class="status-pill status-${status === 'paid' ? 'paid' : status === 'partial' ? 'partial' : status === 'due' ? 'due' : 'none'}">${esc(labels[status] || status)}</span>`;
}

function renderMembersTable() {
  const members = filteredMembers();
  if (!members.length) {
    const noMembers = state.members.length === 0;
    return `<div class="blank-state"><div class="blank-icon">${icon(noMembers ? 'users' : 'search')}</div><h3>${noMembers ? 'No members yet' : 'No members match this view'}</h3><p>${noMembers ? 'Add your first member, choose their membership plan and record cash only when you have received it.' : 'Try another search or filter to find a member.'}</p>${noMembers ? `<div class="page-heading-actions"><button class="button button-primary" type="button" data-action="new-member" ${!state.plans.some((plan) => plan.active) ? 'disabled' : ''}>${icon('plus')}Add first member</button>${state.plans.length === 0 ? `<button class="button button-secondary" type="button" data-action="load-demo">${icon('sparkle')}Load sample data</button>` : ''}</div>` : ''}</div>`;
  }
  const rows = members.map((member) => {
    const membership = member.membership;
    const endDateText = membership ? `${membership.status === 'upcoming' ? 'Starts' : 'Ends'} ${dateLabel(membership.endDate)}` : 'No membership yet';
    const canPay = membership && member.outstandingMinor > 0;
    return `<tr>
      <td><div class="table-member"><div class="member-avatar ${avatarClass(member.id)}">${esc(initials(member.name))}</div><div class="table-member-name"><button type="button" data-action="open-member" data-id="${member.id}">${esc(member.name)}</button><small>${esc(member.email || member.phone || 'No contact details')}</small></div></div></td>
      <td><div class="plan-cell"><strong>${esc(membership?.planName || '—')}</strong><small>${esc(endDateText)}</small></div></td>
      <td>${membershipStatusBadge(membership?.status || 'no-plan')}</td>
      <td>${paymentStatusBadge(member.paymentState)}</td>
      <td class="money-cell${member.outstandingMinor ? '' : ' muted'}">${membership ? esc(moneyFromMinor(member.outstandingMinor)) : '—'}</td>
      <td><div class="row-actions"><button class="button-icon" type="button" title="View member" aria-label="View ${esc(member.name)}" data-action="open-member" data-id="${member.id}">${icon('chevron')}</button>${canPay ? `<button class="button-icon" type="button" title="Confirm cash received" aria-label="Confirm cash from ${esc(member.name)}" data-action="confirm-cash" data-id="${member.id}">${icon('cash')}</button>` : ''}<button class="button-icon" type="button" title="Renew membership" aria-label="Renew ${esc(member.name)}" data-action="renew-member" data-id="${member.id}">${icon('refresh')}</button></div></td>
    </tr>`;
  }).join('');
  return `<div class="table-scroll"><table class="data-table"><thead><tr><th>Member</th><th>Membership</th><th>Status</th><th>Payment</th><th>Balance due</th><th><span class="sr-only">Actions</span></th></tr></thead><tbody>${rows}</tbody></table></div><div class="table-meta"><span>Showing <strong>${members.length}</strong> of <strong>${state.members.length}</strong> members</span><span>Member data refreshes automatically</span></div>`;
}

function renderMembers() {
  const actions = `<button class="button button-secondary" type="button" data-action="export-members">${icon('download')}Export CSV</button><button class="button button-primary" type="button" data-action="new-member" ${!state.plans.some((plan) => plan.active) ? 'disabled title="Create a plan first"' : ''}>${icon('plus')}Add member</button>`;
  const filters = [['all','All'],['active','Active'],['expiring','Expiring'],['expired','Expired'],['unpaid','Unpaid']];
  return `${renderPageHeading('Members', 'Member details, active plans, expiry dates and payment status.', actions)}
    <div class="toolbar"><div class="toolbar-left"><label class="search-field">${icon('search')}<input id="member-search" type="search" placeholder="Search name, email or phone…" value="${esc(state.memberSearch)}" autocomplete="off"></label><div class="filter-pills" role="group" aria-label="Filter members">${filters.map(([key, label]) => `<button type="button" class="filter-pill${state.memberFilter === key ? ' active' : ''}" data-filter="${key}">${label}</button>`).join('')}</div></div><button class="button button-secondary button-sm" type="button" data-action="refresh">${icon('refresh')}Refresh</button></div>
    <section class="panel table-card" id="members-table-slot">${renderMembersTable()}</section>`;
}

function renderPaymentsTable() {
  if (!state.payments.length) return `<div class="blank-state"><div class="blank-icon">${icon('cash')}</div><h3>No cash payments recorded</h3><p>When you mark cash as received for a membership, the confirmed payment will appear here.</p><button class="button button-secondary" type="button" data-view="members">Go to members ${icon('arrow')}</button></div>`;
  const rows = state.payments.map((payment) => `<tr><td><strong style="color:#304337">${esc(dateLabel(payment.paid_on))}</strong><div class="form-hint">${esc(dateTimeLabel(payment.paid_at))}</div></td><td><div class="table-member"><div class="member-avatar ${avatarClass(payment.id)}">${esc(initials(payment.member_name))}</div><div class="table-member-name"><button type="button" data-action="open-member-by-name" data-name="${esc(payment.member_name)}">${esc(payment.member_name)}</button><small>${esc(payment.plan_name)}</small></div></div></td><td><span class="status-pill status-paid">Cash confirmed</span></td><td class="money-cell">${esc(moneyFromMinor(payment.amountMinor))}</td><td>${esc(payment.note || '—')}</td></tr>`).join('');
  return `<div class="table-scroll"><table class="data-table"><thead><tr><th>Date</th><th>Member / plan</th><th>Method</th><th>Amount</th><th>Note</th></tr></thead><tbody>${rows}</tbody></table></div><div class="table-meta"><span>Showing <strong>${state.payments.length}</strong> recent cash payments</span><span>Amounts represent cash confirmed by an admin</span></div>`;
}

function renderPayments() {
  const overview = state.overview?.stats || {};
  const allTotal = state.payments.reduce((sum, payment) => sum + Number(payment.amountMinor || 0), 0);
  return `${renderPageHeading('Payments', 'A clear record of cash received and confirmed by an admin.', `<button class="button button-secondary" type="button" data-action="export-payments">${icon('download')}Export CSV</button>`)}
    <div class="summary-strip"><div class="summary-tile"><span>CASH COLLECTED THIS MONTH</span><strong>${esc(moneyFromMinor(overview.revenueMonthMinor || 0))}</strong></div><div class="summary-tile"><span>COLLECTED TODAY</span><strong>${esc(moneyFromMinor(overview.revenueTodayMinor || 0))}</strong></div><div class="summary-tile"><span>ALL-TIME SHOWN</span><strong>${esc(moneyFromMinor(allTotal))}</strong></div></div>
    <section class="panel table-card">${renderPaymentsTable()}</section>`;
}

function renderCampaignHistory() {
  if (!state.campaigns.length) return `<div class="empty-mini">Your sent campaigns will appear here.</div>`;
  return `<div class="campaign-history-list">${state.campaigns.map((campaign) => `<div class="campaign-history-row"><div class="campaign-history-icon">${icon('send')}</div><div class="member-main"><strong>${esc(campaign.subject)}</strong><small>${esc(dateTimeLabel(campaign.createdAt))} · ${campaign.recipientCount} recipient${campaign.recipientCount === 1 ? '' : 's'} · ${campaign.sentCount} sent${campaign.failedCount ? ` · ${campaign.failedCount} failed` : ''}${campaign.skippedCount ? ` · ${campaign.skippedCount} skipped` : ''}</small></div><span class="status-pill status-${esc(campaign.status)}">${esc(campaign.status)}</span></div>`).join('')}</div>`;
}

function safeCampaignPreview(html) {
  const documentCopy = new DOMParser().parseFromString(String(html || ''), 'text/html');
  documentCopy.querySelectorAll('script, iframe, object, embed, form, meta, base, link, style, svg, math').forEach((node) => node.remove());
  for (const element of documentCopy.body.querySelectorAll('*')) {
    for (const attribute of [...element.attributes]) {
      if (/^on/i.test(attribute.name)) element.removeAttribute(attribute.name);
      if (['href', 'src', 'action', 'formaction'].includes(attribute.name.toLowerCase()) && /^\s*javascript:/i.test(attribute.value)) element.removeAttribute(attribute.name);
    }
  }
  return documentCopy.body.innerHTML;
}

function updateCampaignPreview() {
  const frame = document.getElementById('campaign-preview');
  if (!frame) return;
  const html = safeCampaignPreview(document.getElementById('campaign-html')?.value || '');
  frame.srcdoc = `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; style-src 'unsafe-inline'"></head><body style="margin:0;padding:20px;background:#fff;font:14px/1.55 Arial,sans-serif;color:#1d2c24">${html}</body></html>`;
}

function updateCampaignSendButton() {
  const button = document.querySelector('#campaign-form button[type="submit"]');
  if (!button) return;
  const hasRecipients = String(state.campaignRecipientText || '').split(/[\s,;]+/).some(Boolean);
  button.disabled = !(state.config?.smtpConfigured && state.config?.smtpSenderEmail && state.campaignRecipients.length && hasRecipients);
}

function renderCampaigns() {
  if (state.campaignRecipientText === null) state.campaignRecipientText = state.campaignRecipients.slice(0, 100).map((recipient) => recipient.email).join('\n');
  if (state.campaignSenderName === undefined) state.campaignSenderName = state.config?.gymName || '';
  if (state.campaignSenderEmail === undefined) state.campaignSenderEmail = state.config?.smtpSenderEmail || '';
  if (state.campaignSubject === undefined) state.campaignSubject = '';
  if (state.campaignHtmlBody === undefined) state.campaignHtmlBody = '<h1>Black Friday is here!</h1><p>Enjoy a special offer at <strong>your gym</strong>.</p><p><strong>Offer details:</strong> Add the price, dates and terms before sending.</p><p>Visit the gym or reply to this email to renew.</p>';
  const configured = Boolean(state.config?.smtpConfigured && state.config?.smtpSenderEmail);
  const hasCampaignRecipients = String(state.campaignRecipientText || '').split(/[\s,;]+/).filter(Boolean).length > 0;
  const canSend = configured && state.campaignRecipients.length > 0 && hasCampaignRecipients;
  const offerRecipients = state.campaignRecipients.length
    ? state.campaignRecipients.slice(0, 8).map((recipient) => `<div class="campaign-person-row"><div class="member-avatar ${avatarClass(recipient.id)}">${esc(initials(recipient.name))}</div><div class="member-main"><strong>${esc(recipient.name)}</strong><small>${esc(recipient.email)}</small></div><span class="consent-check">${icon('check')}</span></div>`).join('')
    : `<div class="empty-mini">No members have promotional email consent yet. Edit a member profile and record their permission first.</div>`;
  return `${renderPageHeading('Email campaigns', 'Send gym news and special offers to members who agreed to promotional emails.', '')}
    ${!configured ? `<div class="notice-banner">${icon('mail')}<div><strong>Set up email delivery before sending</strong><p>Campaigns use your verified SMTP sender. Configure SMTP in Settings; test emails go only to your owner account.</p></div><button class="notice-action" type="button" data-view="settings">Email settings ${icon('arrow')}</button></div>` : ''}
    <div class="campaign-layout">
      <section class="panel campaign-composer panel-pad"><div class="panel-head"><div><h3 class="panel-title">Compose an email</h3><p class="panel-subtitle">Write your message in HTML and test it in your own inbox before sending.</p></div><span class="email-status${configured ? ' ready' : ''}"><i></i>${configured ? 'SMTP ready' : 'Not connected'}</span></div>
        <form id="campaign-form" class="form-grid">
          <div class="form-row"><div class="field"><label for="campaign-sender-name">Sender name</label><input class="control" id="campaign-sender-name" name="senderName" maxlength="80" value="${esc(state.campaignSenderName)}" placeholder="Your gym" required></div><div class="field"><label for="campaign-sender-email">Verified sender email</label><input class="control" id="campaign-sender-email" name="senderEmail" type="email" value="${esc(state.campaignSenderEmail)}" placeholder="Configure SMTP first" required><p class="form-hint">Must match the verified address in SMTP_FROM.</p></div></div>
          <div class="field"><div class="field-label-row"><label for="campaign-recipients">Recipient email list</label><button class="panel-link" type="button" data-action="campaign-select-all" ${state.campaignRecipients.length ? '' : 'disabled'}>Use ${Math.min(state.campaignRecipients.length, 100)} opted-in ${Math.min(state.campaignRecipients.length, 100) === 1 ? 'member' : 'members'}${state.campaignRecipients.length > 100 ? ' (max)' : ''}</button></div><textarea class="control campaign-recipient-input" id="campaign-recipients" name="recipientList" placeholder="One opted-in member email per line">${esc(state.campaignRecipientText)}</textarea><p class="form-hint">Only existing members with explicit promotional email consent are allowed. Up to 100 recipients per send; the first 100 are selected by default.</p></div>
          <div class="field"><label for="campaign-subject">Subject</label><input class="control" id="campaign-subject" name="subject" maxlength="180" value="${esc(state.campaignSubject)}" placeholder="A special offer from ${esc(state.config?.gymName || 'your gym')}" required></div>
          <div class="field"><div class="field-label-row"><label for="campaign-html">Email body (HTML supported)</label><div class="template-actions"><button class="panel-link" type="button" data-action="campaign-template-blackfriday">Black Friday template</button><button class="panel-link" type="button" data-action="campaign-template-simple">Simple template</button></div></div><textarea class="control campaign-html-input" id="campaign-html" name="htmlBody" spellcheck="false" placeholder="Write or paste email-safe HTML here…" required>${esc(state.campaignHtmlBody)}</textarea><p class="form-hint">Unsafe scripts and links are removed before sending. Replace template details, dates and terms; the verified sender is also the reply-to address for opt-out requests.</p></div>
          <div class="campaign-preview-wrap"><div class="field-label-row"><strong>Email preview</strong><span>Sandboxed preview · scripts disabled</span></div><iframe id="campaign-preview" class="campaign-preview-frame" title="Email preview" sandbox=""></iframe></div>
          <div class="campaign-actions"><button class="button button-secondary" type="button" data-action="test-campaign" ${configured ? '' : 'disabled'}>${icon('mail')}Send test to owner</button><button class="button button-primary" type="submit" ${canSend ? '' : 'disabled'}>${icon('send')}Queue campaign</button></div>
        </form>
      </section>
      <aside class="campaign-side-stack"><section class="panel panel-pad"><div class="panel-head"><div><h3 class="panel-title">Eligible members</h3><p class="panel-subtitle">Only this consented list can receive offers.</p></div><span class="campaign-count">${state.campaignRecipients.length}</span></div><div class="campaign-audience-list">${offerRecipients}${state.campaignRecipients.length > 8 ? `<div class="form-hint" style="padding:10px 0">And ${state.campaignRecipients.length - 8} more opted-in members.</div>` : ''}</div><div class="campaign-consent-note">${icon('shield')}Promotional permission is separate from membership-expiry reminder permission. Untick it on a member profile to stop future campaign emails.</div></section>
        <section class="panel panel-pad"><div class="panel-head"><div><h3 class="panel-title">Campaign history</h3><p class="panel-subtitle">Delivery status for recent emails</p></div><button class="button-icon" type="button" data-action="refresh" title="Refresh campaign status">${icon('refresh')}</button></div>${renderCampaignHistory()}</section>
      </aside>
    </div>`;
}

function renderInsights() {
  if (!state.overview) return `<div class="loading-inline"><span class="boot-spinner"></span>Preparing insights…</div>`;
  const stats = state.overview.stats;
  const total = Math.max(1, Number(stats.totalMembers));
  const activePct = Math.round(Number(stats.activeMembers) / total * 100);
  const expiringPct = Math.round(Number(stats.expiringSoon) / total * 100);
  const expiredPct = Math.round(Number(stats.expiredMembers) / total * 100);
  const allPaid = state.payments.reduce((sum, payment) => sum + Number(payment.amountMinor || 0), 0);
  const maxDay = Math.max(0, ...state.overview.revenueByDay.map((row) => row.amountMinor));
  return `${renderPageHeading('Insights', 'Understand member activity and confirmed cash collection.', `<button class="button button-secondary" type="button" data-action="export-payments">${icon('download')}Export data</button>`)}
    ${renderEmailNotice()}
    <div class="insight-grid">
      <section class="panel panel-pad"><div class="panel-head"><div><h3 class="panel-title">Cash flow snapshot</h3><p class="panel-subtitle">Recorded cash payments; not expected subscription value</p></div></div><div class="insight-summary"><div class="insight-mini"><span>Today</span><strong>${esc(moneyFromMinor(stats.revenueTodayMinor))}</strong></div><div class="insight-mini"><span>This month</span><strong>${esc(moneyFromMinor(stats.revenueMonthMinor))}</strong></div><div class="insight-mini"><span>All time</span><strong>${esc(moneyFromMinor(allPaid))}</strong></div></div><div class="bar-chart" role="img" aria-label="Cash collected over the last seven days">${chartMarkup(state.overview.revenueByDay)}</div></section>
      <section class="panel panel-pad"><div class="panel-head"><div><h3 class="panel-title">Member health</h3><p class="panel-subtitle">Current membership status snapshot</p></div></div><div class="progress-list">
        ${progressLine('Active members', stats.activeMembers, activePct, '#79a94c')}
        ${progressLine('Expiring this week', stats.expiringSoon, expiringPct, '#d8a14b')}
        ${progressLine('Expired members', stats.expiredMembers, expiredPct, '#d8796b')}
      </div><div class="insights-note" style="margin-top:19px">Membership is considered active through its end date. Outstanding is calculated from unpaid balances on current memberships.</div></section>
    </div>
    <div class="dashboard-grid"><section class="panel panel-pad"><div class="panel-head"><div><h3 class="panel-title">Membership plan mix</h3><p class="panel-subtitle">Members currently on each plan</p></div><button class="panel-link" type="button" data-view="settings">Edit plans ${icon('chevron')}</button></div>${renderPlanMix(state.overview.plans)}</section><section class="panel panel-pad"><div class="panel-head"><div><h3 class="panel-title">Renewal watch</h3><p class="panel-subtitle">Next memberships to end</p></div><button class="panel-link" type="button" data-view="members" data-filter="expiring">View members ${icon('chevron')}</button></div><div class="due-list">${renderExpiringRows(state.overview.expiringMembers)}</div></section></div>
    <div class="insights-note">Profit and retention analysis are not included yet: the first version records member plans and confirmed cash, but does not record expenses, attendance or cancellation reasons.</div>`;
}

function progressLine(label, count, percent, color) {
  return `<div class="progress-line"><span>${esc(label)}</span><div class="progress-track"><div class="progress-value" style="width:${Math.max(count ? 4 : 0, percent)}%;background:${color}"></div></div><strong>${Number(count || 0)}</strong></div>`;
}

function renderPlansSettings() {
  const plans = state.plans;
  if (!plans.length) return `<div class="blank-state" style="padding:25px 10px"><div class="blank-icon">${icon('dumbbell')}</div><h3>No plans created yet</h3><p>Add your gym's prices and membership lengths to start registering members.</p><button class="button button-primary" type="button" data-action="create-plan">Create your first plan ${icon('arrow')}</button></div>`;
  return `<div class="plan-setting-list">${plans.map((plan) => `<div class="plan-setting-row${plan.active ? '' : ' plan-archived'}"><div class="plan-setting-main"><strong>${esc(plan.name)} ${plan.active ? '' : '<span class="status-pill status-none">Archived</span>'}</strong><small>${plan.durationValue} ${plan.durationUnit === 'months' ? (plan.durationValue === 1 ? 'month' : 'months') : (plan.durationValue === 1 ? 'day' : 'days')} · ${plan.activeMembers} current member${plan.activeMembers === 1 ? '' : 's'}</small></div><span class="plan-setting-price">${esc(moneyFromMinor(plan.priceMinor))}</span><div class="plan-setting-actions"><button class="button-icon" type="button" title="Edit plan" aria-label="Edit ${esc(plan.name)}" data-action="edit-plan" data-id="${plan.id}">${icon('edit')}</button><button class="button button-secondary button-sm" type="button" data-action="toggle-plan" data-id="${plan.id}" data-active="${plan.active}">${plan.active ? 'Archive' : 'Restore'}</button></div></div>`).join('')}</div>`;
}

function renderReminderHistory() {
  if (!state.reminders.length) return `<div class="empty-mini">Reminder history will appear here once a member has consented and a reminder becomes due.</div>`;
  return `<div class="reminder-list">${state.reminders.slice(0, 7).map((reminder) => `<div class="reminder-row"><div class="cash-icon">${icon('mail')}</div><div class="member-main"><strong>${esc(reminder.memberName)} · ${reminder.daysBefore}-day reminder</strong><small>${esc(reminder.recipient)} · ${esc(reminder.planName)}</small></div><div class="reminder-date"><span class="status-pill status-${esc(reminder.status)}">${esc(reminder.status)}</span><small style="display:block;margin-top:5px">${esc(dateTimeLabel(reminder.sentAt || reminder.createdAt))}</small></div></div>${reminder.lastError ? `<div class="form-hint" style="color:#b65c52;margin:-5px 0 7px 42px">${esc(reminder.lastError)}</div>` : ''}`).join('')}</div>`;
}

function renderEmailSetupCard() {
  const configured = Boolean(state.config?.smtpConfigured);
  const status = configured ? `<span class="email-status ready"><i></i>Email delivery connected</span>` : `<span class="email-status"><i></i>SMTP setup required</span>`;
  return `<section class="panel settings-card"><div class="settings-heading"><span class="settings-icon">${icon('mail')}</span><div style="flex:1"><h3>Email delivery</h3><p>Send expiry reminders and promotional campaigns from your verified SMTP sender.</p></div>${status}</div>
    ${configured ? `<div class="notice-banner" style="margin-bottom:13px;background:#f1f8ef;border-color:#dcebd5;color:#58724e">${icon('check')}<div><strong style="color:#456440">Ready to send</strong><p>Sender configured: ${esc(state.config.emailFrom || 'SMTP sender')}</p></div></div>` : `<p class="form-hint" style="font-size:9px;margin:0 0 8px">To enable real email, add SMTP settings to <code>gym-app/.env</code>, then restart the server. An email provider account is needed; no email is sent until configured.</p><pre class="code-snippet">SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-smtp-username
SMTP_PASS=your-smtp-password
SMTP_FROM="Your Gym &lt;you@example.com&gt;"
APP_URL=http://localhost:3000</pre><ol class="email-step"><li>Copy <code>.env.example</code> to <code>.env</code>.</li><li>Enter the SMTP details from your email provider. Use an app password if your provider requires one.</li><li>Restart Gymflow and use the test-email button below.</li></ol><p class="form-hint">Expiry reminders require reminder consent. Campaigns require separate promotional consent. The scheduler runs while this app is running; the verified SMTP sender is required for either type.</p>`}
    <div class="form-actions" style="margin-top:14px"><button class="button button-secondary" type="button" data-action="test-email">${icon('mail')}Send test email</button></div>
    <div class="detail-section"><h4>Recent reminder activity</h4><div class="panel" style="padding:0 12px">${renderReminderHistory()}</div></div>
  </section>`;
}

function renderSettings() {
  const config = state.config || {};
  return `${renderPageHeading('Settings', 'Set up your gym, membership plans, reminder email and local data.', '')}
    <div class="settings-grid">
      <div class="settings-stack">
        <section class="panel settings-card"><div class="settings-heading"><span class="settings-icon">${icon('settings')}</span><div><h3>Gym details</h3><p>Set your business name, currency and operating timezone.</p></div></div>
          ${config.currencyLocked ? `<div class="locked-note">${icon('lock')}Currency is locked because a plan, membership or payment already exists. This keeps saved amounts consistent.</div>` : ''}
          <form id="settings-form" class="form-grid"><div class="field"><label for="gym-name">Gym name</label><input id="gym-name" class="control" name="gymName" maxlength="100" value="${esc(config.gymName || '')}" required></div>
            <div class="form-row"><div class="field"><label for="gym-currency">Currency code</label><input id="gym-currency" class="control" name="currency" maxlength="3" value="${esc(config.currency || 'TND')}" ${config.currencyLocked ? 'disabled' : ''} required><p class="form-hint">Example: TND, EUR, MAD, USD</p></div><div class="field"><label for="gym-timezone">Timezone</label><input id="gym-timezone" class="control" name="timezone" maxlength="100" value="${esc(config.timezone || 'Africa/Tunis')}" placeholder="Africa/Tunis" required><p class="form-hint">IANA timezone, for example Africa/Tunis</p></div></div>
            <div class="form-actions"><button class="button button-primary" type="submit">Save gym settings ${icon('check')}</button></div>
          </form>
        </section>
        <section class="panel settings-card"><div class="settings-heading"><span class="settings-icon">${icon('dumbbell')}</span><div style="flex:1"><h3>Membership plans</h3><p>Create monthly, multi-month or custom-day plans. Prices are snapshots on each membership.</p></div><button class="button button-secondary button-sm" type="button" data-action="create-plan">${icon('plus')}Add plan</button></div>
          ${renderPlansSettings()}
        </section>
      </div>
      <div class="settings-stack">
        ${renderEmailSetupCard()}
        <section class="panel settings-card"><div class="settings-heading"><span class="settings-icon">${icon('database')}</span><div><h3>Local data and backups</h3><p>Your data is stored in a SQLite file on this computer. Back it up regularly.</p></div></div>
          <div class="locked-note">${icon('info')}This is a single-server database. Keep the dashboard server running on the computer or VPS that owns the data. Never share your SQLite file publicly.</div>
          <div class="data-tools"><button class="button button-secondary button-sm" type="button" data-action="backup-db">${icon('download')}Download database backup</button><button class="button button-secondary button-sm" type="button" data-action="export-members">${icon('users')}Export members CSV</button><button class="button button-secondary button-sm" type="button" data-action="export-payments">${icon('cash')}Export payments CSV</button></div>
          ${state.members.some((member) => member.isDemo) || state.plans.some((plan) => plan.isDemo) ? `<div class="form-actions" style="margin-top:14px"><button class="button button-danger button-sm" type="button" data-action="clear-demo">Remove sample data</button></div>` : ''}
          <div class="detail-section"><h4>Signed-in owner</h4><div class="account-line"><div class="profile-avatar">${esc(initials(state.user?.name))}</div><div><strong>${esc(state.user?.name || '')}</strong><small>${esc(state.user?.email || '')}</small></div><button class="button button-secondary button-sm" style="margin-left:auto" type="button" data-action="logout">${icon('logout')}Sign out</button></div></div>
          <div class="detail-section"><h4>Change password</h4><form id="password-form" class="form-grid"><div class="field"><label for="current-password">Current password</label><input class="control" id="current-password" name="currentPassword" type="password" autocomplete="current-password" required></div><div class="form-row"><div class="field"><label for="new-password">New password</label><input class="control" id="new-password" name="newPassword" type="password" minlength="10" autocomplete="new-password" required></div><div class="field"><label for="confirm-password">Confirm new password</label><input class="control" id="confirm-password" name="confirmPassword" type="password" minlength="10" autocomplete="new-password" required></div></div><div class="form-actions"><button class="button button-secondary" type="submit">Update password ${icon('shield')}</button></div></form></div>
          <p class="form-hint" style="margin-top:13px">SQLite database: <code>gym-app/data/gym.db</code> · no paid database account required.</p>
        </section>
      </div>
    </div>`;
}

function renderCurrentView() {
  switch (state.view) {
    case 'members': return renderMembers();
    case 'payments': return renderPayments();
    case 'campaigns': return renderCampaigns();
    case 'insights': return renderInsights();
    case 'settings': return renderSettings();
    default: return renderOverview();
  }
}

function renderApp() {
  if (!state.user) return;
  const shellClass = `app-shell${state.mobileNavOpen ? ' mobile-nav-open' : ''}`;
  appRoot.innerHTML = `<div class="${shellClass}">${renderSidebar()}<div class="screen-overlay" data-action="close-mobile-nav"></div><main class="app-main">${renderTopbar()}<div class="content-wrap" id="content-view">${renderCurrentView()}</div></main>${state.modal ? renderModal() : ''}</div>`;
  document.title = `${viewTitles[state.view]?.[1] || 'Overview'} — ${state.config?.gymName || 'Gymflow'}`;
  if (state.view === 'campaigns') updateCampaignPreview();
}

function selectPlans(selectedId) {
  const active = state.plans.filter((plan) => plan.active);
  if (!active.length) return `<option value="">Create a plan first</option>`;
  return active.map((plan) => `<option value="${plan.id}" data-price="${inputMoneyFromMinor(plan.priceMinor)}" ${Number(selectedId) === Number(plan.id) ? 'selected' : ''}>${esc(plan.name)} · ${esc(moneyFromMinor(plan.priceMinor))} / ${plan.durationValue} ${plan.durationUnit}</option>`).join('');
}

function modalShell(title, subtitle, body, wide = false) {
  return `<div class="modal-backdrop" data-modal-backdrop><section class="modal-card${wide ? ' modal-wide' : ''}" role="dialog" aria-modal="true" aria-label="${esc(title)}"><header class="modal-head"><div><h2>${esc(title)}</h2>${subtitle ? `<p>${esc(subtitle)}</p>` : ''}</div><button class="modal-close" type="button" data-action="close-modal" aria-label="Close">${icon('close')}</button></header><div class="modal-body">${body}</div></section></div>`;
}

function renderMemberFormModal() {
  const modal = state.modal;
  const isEdit = modal.type === 'edit-member';
  const member = modal.member || {};
  const options = selectPlans(modal.planId);
  const firstPlan = state.plans.find((plan) => plan.active && Number(plan.id) === Number(modal.planId)) || state.plans.find((plan) => plan.active);
  const price = isEdit ? '' : inputMoneyFromMinor(firstPlan?.priceMinor || 0);
  const content = `<form id="${isEdit ? 'edit-member-form' : 'member-form'}" class="form-grid">
    ${isEdit ? `<input type="hidden" name="memberId" value="${member.id}">` : ''}
    <div class="field"><label for="member-name">Full name</label><input class="control" id="member-name" name="name" maxlength="120" value="${esc(member.name || '')}" placeholder="Member's full name" autocomplete="name" required></div>
    <div class="form-row"><div class="field"><label for="member-phone">Phone number</label><input class="control" id="member-phone" name="phone" maxlength="40" value="${esc(member.phone || '')}" placeholder="+216 …" type="tel" autocomplete="tel" required></div><div class="field"><label for="member-email">Email address</label><input class="control" id="member-email" name="email" type="email" maxlength="254" value="${esc(member.email || '')}" placeholder="member@example.com" autocomplete="email" required></div></div>
    <div class="field"><label for="member-notes">Notes <span class="optional">optional</span></label><textarea class="control" id="member-notes" name="notes" maxlength="1000" placeholder="Anything useful for the gym team…">${esc(member.notes || '')}</textarea></div>
    <div class="consent-stack"><label class="check-row"><input type="checkbox" name="emailOptIn" ${member.emailOptIn ? 'checked' : ''}><span>Agreed to membership expiry reminder emails.</span></label><label class="check-row"><input type="checkbox" name="marketingOptIn" ${member.marketingOptIn ? 'checked' : ''}><span>Agreed to gym news and promotional offers.</span></label></div>
    ${isEdit ? '' : `<div class="membership-setup-block"><div class="membership-setup-heading"><strong>Membership starts tracking automatically</strong><small>Select the plan and start date. Countdown and stats update as soon as this member is saved.</small></div><div class="form-row"><div class="field"><label for="member-plan">Membership plan</label><select class="control" id="member-plan" name="planId" required>${options}</select></div><div class="field"><label for="member-start">Start date</label><input class="control" id="member-start" name="startDate" type="date" value="${esc(modal.startDate || todayString())}" required></div></div>
      <div class="field"><label for="member-price">Agreed membership price (${esc(state.config?.currency || 'TND')})</label><input class="control" id="member-price" name="price" type="number" step="${1 / (10 ** currencyDigits())}" min="0.001" value="${esc(price)}" required><p class="form-hint">Defaults to the plan price. You can adjust it for this member without changing the plan.</p></div>
      <label class="check-row"><input type="checkbox" name="confirmCash" id="confirm-cash"><span><strong>Cash has been received and confirmed</strong><br>Leave unticked if payment is still due. You can confirm cash later from the member record.</span></label>
      <div class="field confirm-payment-area" hidden><label for="new-payment-amount">Cash received (${esc(state.config?.currency || 'TND')})</label><input class="control" id="new-payment-amount" name="paymentAmount" type="number" step="${1 / (10 ** currencyDigits())}" min="0.001" value="${esc(price)}"><p class="form-hint">Partial cash payments are supported.</p></div></div>`}
    <div class="modal-footer"><button class="button button-secondary" type="button" data-action="close-modal">Cancel</button><button class="button button-primary" type="submit">${isEdit ? 'Save member' : 'Add member and membership'} ${icon('check')}</button></div>
  </form>`;
  return modalShell(isEdit ? 'Edit member details' : 'Add a new member', isEdit ? 'Update their profile and email permissions.' : 'Add their contact details; the membership countdown starts with the selected plan.', content);
}

function renderRenewModal() {
  const modal = state.modal;
  const member = state.members.find((item) => item.id === Number(modal.memberId)) || modal.member || {};
  const plan = state.plans.find((item) => item.active && Number(item.id) === Number(modal.planId)) || state.plans.find((item) => item.active);
  const defaultStart = member.membership && member.membership.endDate >= todayString() ? addDays(member.membership.endDate, 1) : todayString();
  const price = inputMoneyFromMinor(plan?.priceMinor || 0);
  const content = `<form id="renew-form" class="form-grid"><input type="hidden" name="memberId" value="${member.id}">
    <div class="detail-hero"><div class="member-avatar ${avatarClass(member.id)}">${esc(initials(member.name))}</div><div><h3>${esc(member.name)}</h3><p>${esc(member.email || 'No email address')}</p></div></div>
    <div class="form-row"><div class="field"><label for="renew-plan">New plan</label><select class="control" id="renew-plan" name="planId" required>${selectPlans(plan?.id)}</select></div><div class="field"><label for="renew-start">New start date</label><input class="control" id="renew-start" name="startDate" type="date" value="${esc(defaultStart)}" required></div></div>
    <div class="field"><label for="renew-price">Agreed price (${esc(state.config?.currency || 'TND')})</label><input class="control" id="renew-price" name="price" type="number" step="${1 / (10 ** currencyDigits())}" min="0.001" value="${esc(price)}" required></div>
    <label class="check-row"><input type="checkbox" name="confirmCash" id="renew-confirm-cash"><span><strong>Cash received and confirmed</strong><br>Otherwise, the renewal will have an outstanding balance.</span></label>
    <div class="field confirm-payment-area" hidden><label for="renew-payment-amount">Cash received (${esc(state.config?.currency || 'TND')})</label><input class="control" id="renew-payment-amount" name="paymentAmount" type="number" step="${1 / (10 ** currencyDigits())}" min="0.001" value="${esc(price)}"></div>
    <div class="modal-footer"><button class="button button-secondary" type="button" data-action="close-modal">Cancel</button><button class="button button-primary" type="submit">Add renewal ${icon('refresh')}</button></div>
  </form>`;
  return modalShell(`Renew ${member.name || 'membership'}`, 'A future renewal starts the day after the current membership ends by default.', content);
}

function renderPaymentModal() {
  const modal = state.modal;
  const member = modal.member;
  const content = `<form id="cash-form" class="form-grid"><input type="hidden" name="memberId" value="${member.id}"><input type="hidden" name="membershipId" value="${modal.membership.id}">
    <div class="detail-hero"><div class="member-avatar ${avatarClass(member.id)}">${esc(initials(member.name))}</div><div><h3>${esc(member.name)}</h3><p>${esc(modal.membership.planName)} · balance due ${esc(moneyFromMinor(modal.outstandingMinor))}</p></div></div>
    <div class="field"><label for="cash-amount">Cash received (${esc(state.config?.currency || 'TND')})</label><input class="control" id="cash-amount" name="amount" type="number" step="${1 / (10 ** currencyDigits())}" min="${esc(inputMoneyFromMinor(1))}" max="${esc(inputMoneyFromMinor(modal.outstandingMinor))}" value="${esc(inputMoneyFromMinor(modal.outstandingMinor))}" required><p class="form-hint">Confirm only cash you have actually received. Partial payment is allowed.</p></div>
    <div class="modal-footer"><button class="button button-secondary" type="button" data-action="close-modal">Cancel</button><button class="button button-primary" type="submit">${icon('cash')}Confirm cash received</button></div>
  </form>`;
  return modalShell('Confirm cash payment', 'This will create a payment record and update the member balance.', content);
}

function renderPlanModal() {
  const plan = state.modal.plan || {};
  const isEdit = Boolean(plan.id);
  const content = `<form id="plan-form" class="form-grid"><input type="hidden" name="planId" value="${plan.id || ''}">
    <div class="field"><label for="plan-name">Plan name</label><input class="control" id="plan-name" name="name" maxlength="80" value="${esc(plan.name || '')}" placeholder="Monthly access" required></div>
    <div class="form-row"><div class="field"><label for="plan-duration">Duration</label><input class="control" id="plan-duration" name="durationValue" type="number" min="1" max="120" step="1" value="${esc(plan.durationValue || 1)}" required></div><div class="field"><label for="plan-unit">Duration unit</label><select class="control" id="plan-unit" name="durationUnit"><option value="months" ${plan.durationUnit !== 'days' ? 'selected' : ''}>Calendar months</option><option value="days" ${plan.durationUnit === 'days' ? 'selected' : ''}>Days</option></select></div></div>
    <div class="field"><label for="plan-price">Price (${esc(state.config?.currency || 'TND')})</label><input class="control" id="plan-price" name="price" type="number" step="${1 / (10 ** currencyDigits())}" min="0.001" value="${isEdit ? esc(inputMoneyFromMinor(plan.priceMinor)) : ''}" placeholder="0.000" required><p class="form-hint">New memberships copy the current plan price. Existing membership prices do not change.</p></div>
    <div class="modal-footer"><button class="button button-secondary" type="button" data-action="close-modal">Cancel</button><button class="button button-primary" type="submit">${isEdit ? 'Save changes' : 'Create plan'} ${icon('check')}</button></div>
  </form>`;
  return modalShell(isEdit ? 'Edit membership plan' : 'Create membership plan', 'Choose a duration and price that match your gym.', content);
}

function renderMemberDetail() {
  const modal = state.modal;
  if (modal.loading || !modal.detail) return modalShell('Member profile', 'Loading membership history…', `<div class="loading-inline"><span class="boot-spinner"></span>Loading member details…</div>`);
  const { member, memberships, payments } = modal.detail;
  const actionButtons = `<div class="detail-action-row"><button class="button button-secondary button-sm" type="button" data-action="edit-member" data-id="${member.id}">${icon('edit')}Edit</button><button class="button button-secondary button-sm" type="button" data-action="renew-member" data-id="${member.id}">${icon('refresh')}Renew</button>${member.membership && member.outstandingMinor > 0 ? `<button class="button button-accent button-sm" type="button" data-action="confirm-cash" data-id="${member.id}">${icon('cash')}Confirm cash</button>` : ''}</div>`;
  const membershipHistory = memberships.length ? memberships.map((item) => `<div class="history-item"><div><strong>${esc(item.planName)} · ${esc(dateLabel(item.startDate))} – ${esc(dateLabel(item.endDate))}</strong><small>${esc(item.durationValue)} ${item.durationUnit === 'months' ? (item.durationValue === 1 ? 'month' : 'months') : (item.durationValue === 1 ? 'day' : 'days')} · ${membershipStatusBadge(item.status)}</small></div><div class="history-side"><strong>${esc(moneyFromMinor(item.priceMinor))}</strong><small>${item.outstandingMinor > 0 ? `${esc(moneyFromMinor(item.outstandingMinor))} due` : 'Paid in full'}</small></div></div>`).join('') : `<div class="empty-mini">No memberships recorded yet.</div>`;
  const paymentHistory = payments.length ? payments.slice(0, 8).map((payment) => `<div class="history-item"><div><strong>Cash payment · ${esc(dateLabel(payment.paid_on))}</strong><small>${esc(payment.plan_name)}${payment.note ? ` · ${esc(payment.note)}` : ''}</small></div><div class="history-side"><strong>${esc(moneyFromMinor(payment.amountMinor))}</strong><small>Confirmed</small></div></div>`).join('') : `<div class="empty-mini">No cash payments recorded.</div>`;
  const facts = `<div class="detail-facts"><div class="detail-fact"><span>Email</span><strong>${esc(member.email || 'Not provided')}</strong></div><div class="detail-fact"><span>Phone</span><strong>${esc(member.phone || 'Not provided')}</strong></div><div class="detail-fact"><span>Expiry email permission</span><strong>${member.emailOptIn ? 'Agreed' : 'Not agreed'}</strong></div><div class="detail-fact"><span>Promotional email permission</span><strong>${member.marketingOptIn ? 'Agreed' : 'Not agreed'}</strong></div><div class="detail-fact"><span>Member since</span><strong>${esc(dateLabel(member.createdOn))}</strong></div></div>`;
  const notes = member.notes ? `<div class="detail-section"><h4>Notes</h4><div class="insights-note">${esc(member.notes)}</div></div>` : '';
  const content = `<div class="detail-hero"><div class="member-avatar ${avatarClass(member.id)}">${esc(initials(member.name))}</div><div><h3>${esc(member.name)}</h3><p>${esc(member.membership?.planName || 'No current plan')} · ${member.membership ? esc(relativeDays(member.daysRemaining)) : 'No active membership'}</p></div>${actionButtons}</div>
    ${facts}${notes}<div class="detail-section"><h4>Membership history</h4>${membershipHistory}</div><div class="detail-section"><h4>Cash payments</h4>${paymentHistory}</div>`;
  return modalShell('Member profile', 'Membership and confirmed cash payment history.', content, true);
}

function renderModal() {
  if (!state.modal) return '';
  switch (state.modal.type) {
    case 'member': return renderMemberDetail();
    case 'new-member':
    case 'edit-member': return renderMemberFormModal();
    case 'renew': return renderRenewModal();
    case 'payment': return renderPaymentModal();
    case 'plan': return renderPlanModal();
    default: return '';
  }
}

async function loadData({ quiet = false } = {}) {
  if (!state.user) return;
  try {
    const [config, overview, plans, members, payments, reminders, campaigns, campaignRecipients] = await Promise.all([
      api('/api/config'), api('/api/overview'), api('/api/plans'), api('/api/members'), api('/api/payments'), api('/api/reminders'), api('/api/campaigns'), api('/api/campaigns/recipients'),
    ]);
    state.config = config;
    state.overview = overview;
    state.plans = plans.plans;
    state.members = members.members;
    state.payments = payments.payments;
    state.reminders = reminders.reminders;
    state.campaigns = campaigns.campaigns;
    state.campaignRecipients = campaignRecipients.recipients;
    if (state.campaignRecipientText !== null) {
      const currentlyEligible = new Set(state.campaignRecipients.map((recipient) => recipient.email.toLowerCase()));
      state.campaignRecipientText = state.campaignRecipientText.split(/[\s,;]+/).filter(Boolean)
        .filter((email) => currentlyEligible.has(email.toLowerCase())).join('\n');
    }
    if (!quiet) renderApp();
    else if (!state.modal && !appRoot.querySelector('input:focus, textarea:focus, select:focus')) renderApp();
  } catch (error) {
    if (error.status !== 401) showToast(error.message || 'Could not refresh dashboard data.', 'error');
  }
}

function startPolling() {
  stopPolling();
  state.pollTimer = setInterval(() => loadData({ quiet: true }), 30_000);
}

function stopPolling() {
  if (state.pollTimer) clearInterval(state.pollTimer);
  state.pollTimer = null;
}

async function initialize() {
  renderBoot();
  try {
    const setup = await api('/api/setup-status');
    if (setup.setupRequired) {
      renderSetup();
      return;
    }
    try {
      const session = await api('/api/me');
      state.user = session.user;
      await loadData();
      startPolling();
    } catch (error) {
      if (error.status === 401) renderLogin();
      else throw error;
    }
  } catch (error) {
    appRoot.innerHTML = `<main class="boot-screen"><div class="boot-mark">G</div><h2 style="margin:5px 0;color:#14231e;font-size:18px">Could not connect</h2><p>${esc(error.message || 'Start the local server and refresh this page.')}</p></main>`;
  }
}

function setView(view) {
  if (!viewTitles[view]) return;
  state.view = view;
  state.mobileNavOpen = false;
  if (view === 'members') state.memberSearch = '';
  if (view === 'campaigns' && state.campaignRecipientText === null) {
    state.campaignRecipientText = state.campaignRecipients.slice(0, 100).map((recipient) => recipient.email).join('\n');
  }
  renderApp();
}

function openMemberDetail(memberId) {
  state.modal = { type: 'member', memberId, loading: true, detail: null };
  renderApp();
  api(`/api/members/${memberId}`).then((detail) => {
    if (state.modal?.type === 'member' && Number(state.modal.memberId) === Number(memberId)) {
      state.modal = { type: 'member', memberId, detail, loading: false };
      renderApp();
    }
  }).catch((error) => showToast(error.message, 'error'));
}

function openPaymentModal(memberId) {
  const member = state.members.find((item) => Number(item.id) === Number(memberId));
  if (!member?.membership || member.outstandingMinor <= 0) {
    showToast('This member does not have an outstanding balance.', 'error');
    return;
  }
  state.modal = { type: 'payment', member, membership: member.membership, outstandingMinor: member.outstandingMinor };
  renderApp();
}

function openRenewModal(memberId) {
  const member = state.members.find((item) => Number(item.id) === Number(memberId));
  if (!member) return;
  if (!state.plans.some((plan) => plan.active)) {
    showToast('Create an active membership plan before adding a renewal.', 'error');
    setView('settings');
    return;
  }
  state.modal = { type: 'renew', memberId: member.id };
  renderApp();
}

function openEditModal(memberId) {
  const member = state.members.find((item) => Number(item.id) === Number(memberId));
  if (!member) return;
  state.modal = { type: 'edit-member', member };
  renderApp();
}

function openMemberModal() {
  if (!state.plans.some((plan) => plan.active)) {
    showToast('Create an active membership plan first.', 'error');
    setView('settings');
    return;
  }
  state.modal = { type: 'new-member' };
  renderApp();
}

function openPlanModal(planId = null) {
  const plan = planId ? state.plans.find((item) => Number(item.id) === Number(planId)) : null;
  state.modal = { type: 'plan', plan: plan || {} };
  renderApp();
}

function renderMemberRowsOnly() {
  const slot = document.getElementById('members-table-slot');
  if (slot) slot.innerHTML = renderMembersTable();
}

async function downloadFile(url, suggestedName) {
  try {
    const response = await fetch(url, { credentials: 'same-origin' });
    if (!response.ok) {
      let message = `Download failed (${response.status}).`;
      try { message = (await response.json()).error || message; } catch {}
      throw new Error(message);
    }
    const blob = await response.blob();
    const disposition = response.headers.get('content-disposition') || '';
    const name = disposition.match(/filename="?([^";]+)"?/i)?.[1] || suggestedName;
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = name;
    document.body.append(link);
    link.click();
    link.remove();
    const objectUrl = link.href;
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1500);
    showToast('Your download is ready.');
  } catch (error) {
    showToast(error.message, 'error');
  }
}

async function handleAction(action, element) {
  const id = Number(element.dataset.id);
  switch (action) {
    case 'open-mobile-nav': state.mobileNavOpen = true; renderApp(); break;
    case 'close-mobile-nav': state.mobileNavOpen = false; renderApp(); break;
    case 'close-modal': state.modal = null; renderApp(); break;
    case 'logout': {
      try { await api('/api/logout', { method: 'POST', body: '{}' }); } catch {}
      state.user = null; state.modal = null; stopPolling(); renderLogin();
      break;
    }
    case 'new-member': openMemberModal(); break;
    case 'open-member': openMemberDetail(id); break;
    case 'confirm-cash': openPaymentModal(id); break;
    case 'renew-member': openRenewModal(id); break;
    case 'edit-member': openEditModal(id); break;
    case 'create-plan': openPlanModal(); break;
    case 'edit-plan': openPlanModal(id); break;
    case 'campaign-select-all':
      state.campaignRecipientText = state.campaignRecipients.slice(0, 100).map((recipient) => recipient.email).join('\n');
      renderApp();
      break;
    case 'campaign-template-blackfriday':
      state.campaignSubject = `Black Friday at ${state.config?.gymName || 'your gym'} — limited-time offer`;
      state.campaignHtmlBody = `<h1 style="font-family:Arial,sans-serif;color:#18332a">Black Friday is here!</h1><p>For a limited time, get a special offer on your next membership at <strong>${esc(state.config?.gymName || 'your gym')}</strong>.</p><p><strong>Offer details:</strong> Add the price, dates and terms before sending.</p><p>Visit the gym or reply to this email to renew.</p>`;
      renderApp();
      break;
    case 'campaign-template-simple':
      state.campaignSubject = `A quick update from ${state.config?.gymName || 'your gym'}`;
      state.campaignHtmlBody = `<h2 style="color:#18332a">Hello from ${esc(state.config?.gymName || 'your gym')}</h2><p>We have exciting news to share with you.</p><p>Reply to this email or visit the gym to learn more.</p>`;
      renderApp();
      break;
    case 'test-campaign': {
      const form = appRoot.querySelector('#campaign-form');
      if (!form) break;
      const values = new FormData(form);
      setBusy(element, true, 'Sending test…');
      try {
        const result = await api('/api/campaigns/test', { method: 'POST', body: JSON.stringify({ senderName: values.get('senderName'), senderEmail: values.get('senderEmail'), subject: values.get('subject'), htmlBody: values.get('htmlBody') }) });
        showToast(`Test email sent to ${result.sentTo}.`);
      } catch (error) { showToast(error.message, 'error'); }
      finally { setBusy(element, false); }
      break;
    }
    case 'refresh': await loadData(); showToast('Dashboard refreshed.'); break;
    case 'export-members': await downloadFile('/api/export/members.csv', 'gym-members.csv'); break;
    case 'export-payments': await downloadFile('/api/export/payments.csv', 'gym-cash-payments.csv'); break;
    case 'backup-db': await downloadFile('/api/backup', 'gym-backup.sqlite'); break;
    case 'test-email': {
      setBusy(element, true, 'Sending test…');
      try {
        const result = await api('/api/email/test', { method: 'POST', body: '{}' });
        showToast(`Test email sent to ${result.sentTo}.`);
      } catch (error) { showToast(error.message, 'error'); }
      finally { setBusy(element, false); }
      break;
    }
    case 'load-demo': {
      const accepted = window.confirm('Load clearly fictional sample members, plans and cash payments? This only works in an empty gym.');
      if (!accepted) break;
      try { await api('/api/demo-data', { method: 'POST', body: '{}' }); await loadData(); showToast('Sample data loaded. You can remove it from Settings.'); }
      catch (error) { showToast(error.message, 'error'); }
      break;
    }
    case 'clear-demo': {
      const accepted = window.confirm('Remove all sample members, plans and payments? Real member data will not be deleted.');
      if (!accepted) break;
      try { await api('/api/demo-data', { method: 'DELETE' }); await loadData(); showToast('Sample data removed.'); }
      catch (error) { showToast(error.message, 'error'); }
      break;
    }
    case 'toggle-plan': {
      const currentlyActive = element.dataset.active === 'true';
      try {
        await api(`/api/plans/${id}`, { method: 'PATCH', body: JSON.stringify({ active: !currentlyActive }) });
        await loadData();
        showToast(currentlyActive ? 'Plan archived; existing memberships are unchanged.' : 'Plan restored.');
      } catch (error) { showToast(error.message, 'error'); }
      break;
    }
    case 'open-member-by-name': {
      const member = state.members.find((item) => item.name === element.dataset.name);
      if (member) openMemberDetail(member.id);
      break;
    }
    default: break;
  }
}

appRoot.addEventListener('click', async (event) => {
  const backdrop = event.target.closest('[data-modal-backdrop]');
  if (backdrop && event.target === backdrop) {
    state.modal = null;
    renderApp();
    return;
  }
  const viewButton = event.target.closest('[data-view]');
  if (viewButton) {
    const view = viewButton.dataset.view;
    if (viewButton.dataset.filter) state.memberFilter = viewButton.dataset.filter;
    setView(view);
    return;
  }
  const filter = event.target.closest('[data-filter]');
  if (filter && state.view === 'members') {
    state.memberFilter = filter.dataset.filter;
    renderApp();
    return;
  }
  const actionButton = event.target.closest('[data-action]');
  if (actionButton) await handleAction(actionButton.dataset.action, actionButton);
});

appRoot.addEventListener('input', (event) => {
  if (event.target.id === 'member-search') {
    state.memberSearch = event.target.value;
    renderMemberRowsOnly();
  }
  if (event.target.id === 'campaign-recipients') state.campaignRecipientText = event.target.value;
  if (event.target.id === 'campaign-sender-name') state.campaignSenderName = event.target.value;
  if (event.target.id === 'campaign-sender-email') state.campaignSenderEmail = event.target.value;
  if (event.target.id === 'campaign-subject') state.campaignSubject = event.target.value;
  if (event.target.id === 'campaign-html') {
    state.campaignHtmlBody = event.target.value;
    updateCampaignPreview();
  }
  updateCampaignSendButton();
});

appRoot.addEventListener('change', (event) => {
  const target = event.target;
  if (target.id === 'member-plan' || target.id === 'renew-plan') {
    const option = target.selectedOptions?.[0];
    const priceInput = document.getElementById(target.id === 'member-plan' ? 'member-price' : 'renew-price');
    const paymentInput = document.getElementById(target.id === 'member-plan' ? 'new-payment-amount' : 'renew-payment-amount');
    if (option && priceInput) {
      priceInput.value = option.dataset.price || '';
      if (paymentInput) paymentInput.value = option.dataset.price || '';
    }
  }
  if (target.id === 'confirm-cash' || target.id === 'renew-confirm-cash') {
    const modal = target.closest('form');
    const area = modal?.querySelector('.confirm-payment-area');
    if (area) area.hidden = !target.checked;
  }
});

appRoot.addEventListener('submit', async (event) => {
  const form = event.target;
  event.preventDefault();
  const button = form.querySelector('button[type="submit"]');
  const values = new FormData(form);
  setBusy(button, true, 'Saving…');
  try {
    if (form.id === 'setup-form') {
      const result = await api('/api/setup', { method: 'POST', body: JSON.stringify(Object.fromEntries(values)) });
      state.user = result.user;
      state.view = 'overview';
      await loadData();
      startPolling();
      showToast('Your gym workspace is ready. Create your first membership plan in Settings.');
    } else if (form.id === 'login-form') {
      const result = await api('/api/login', { method: 'POST', body: JSON.stringify(Object.fromEntries(values)) });
      state.user = result.user;
      state.view = 'overview';
      await loadData();
      startPolling();
      showToast(`Welcome back, ${result.user.name.split(' ')[0]}.`);
    } else if (form.id === 'member-form') {
      const body = Object.fromEntries(values);
      body.emailOptIn = values.has('emailOptIn');
      body.marketingOptIn = values.has('marketingOptIn');
      body.confirmCash = values.has('confirmCash');
      await api('/api/members', { method: 'POST', body: JSON.stringify(body) });
      state.modal = null;
      await loadData();
      showToast(body.confirmCash ? 'Member registered and cash confirmed.' : 'Member registered; payment is marked as due.');
    } else if (form.id === 'edit-member-form') {
      const body = Object.fromEntries(values);
      body.emailOptIn = values.has('emailOptIn');
      body.marketingOptIn = values.has('marketingOptIn');
      await api(`/api/members/${values.get('memberId')}`, { method: 'PATCH', body: JSON.stringify(body) });
      state.modal = null;
      await loadData();
      showToast('Member details updated.');
    } else if (form.id === 'renew-form') {
      const memberId = values.get('memberId');
      const body = Object.fromEntries(values);
      body.confirmCash = values.has('confirmCash');
      await api(`/api/members/${memberId}/memberships`, { method: 'POST', body: JSON.stringify(body) });
      state.modal = null;
      await loadData();
      showToast(body.confirmCash ? 'Renewal added and cash confirmed.' : 'Renewal added; payment is due.');
    } else if (form.id === 'cash-form') {
      const memberId = values.get('memberId');
      await api(`/api/members/${memberId}/payments`, { method: 'POST', body: JSON.stringify({ membershipId: values.get('membershipId'), amount: values.get('amount') }) });
      state.modal = null;
      await loadData();
      showToast('Cash payment confirmed and recorded.');
    } else if (form.id === 'plan-form') {
      const body = Object.fromEntries(values);
      const planId = body.planId;
      delete body.planId;
      if (planId) await api(`/api/plans/${planId}`, { method: 'PATCH', body: JSON.stringify(body) });
      else await api('/api/plans', { method: 'POST', body: JSON.stringify(body) });
      state.modal = null;
      await loadData();
      showToast(planId ? 'Membership plan updated.' : 'Membership plan created.');
    } else if (form.id === 'campaign-form') {
      const body = Object.fromEntries(values);
      const recipientList = [...new Set(String(body.recipientList || '').split(/[\s,;]+/).filter(Boolean).map((email) => email.toLowerCase()))];
      if (!recipientList.length) throw new Error('Enter at least one opted-in member email address.');
      if (!window.confirm(`Queue this campaign for ${recipientList.length} recipient${recipientList.length === 1 ? '' : 's'}? Only existing members who agreed to promotional email can receive it.`)) {
        setBusy(button, false);
        return;
      }
      const result = await api('/api/campaigns/send', { method: 'POST', body: JSON.stringify(body) });
      state.campaignSubject = '';
      state.campaignRecipientText = '';
      await loadData();
      showToast(`Campaign queued for ${result.recipientCount} opted-in member${result.recipientCount === 1 ? '' : 's'}.`);
    } else if (form.id === 'settings-form') {
      const body = Object.fromEntries(values);
      if (state.config?.currencyLocked) delete body.currency;
      await api('/api/settings', { method: 'PATCH', body: JSON.stringify(body) });
      await loadData();
      showToast('Gym settings saved.');
    } else if (form.id === 'password-form') {
      const body = Object.fromEntries(values);
      if (body.newPassword !== body.confirmPassword) throw new Error('The new password and confirmation do not match.');
      delete body.confirmPassword;
      await api('/api/account/password', { method: 'POST', body: JSON.stringify(body) });
      form.reset();
      setBusy(button, false);
      showToast('Password updated. Other signed-in sessions have been signed out.');
    }
  } catch (error) {
    showToast(error.message || 'Could not save changes.', 'error');
    setBusy(button, false);
  }
});

initialize();
