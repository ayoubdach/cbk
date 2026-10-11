import express from 'express';
import nodemailer from 'nodemailer';
import sanitizeHtml from 'sanitize-html';
import { DatabaseSync } from 'node:sqlite';
import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const APP_DIR = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(APP_DIR, 'public');

function loadLocalEnv() {
  const envPath = path.join(APP_DIR, '.env');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const separator = trimmed.indexOf('=');
    if (separator < 1) continue;
    const key = trimmed.slice(0, separator).trim();
    let value = trimmed.slice(separator + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

loadLocalEnv();

const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || '0.0.0.0';
const COOKIE_NAME = 'gym_session';
const SESSION_DAYS = 7;
const DEFAULT_TIMEZONE = process.env.GYM_TIMEZONE || 'Africa/Tunis';
const configuredDbPath = process.env.DATABASE_PATH || './data/gym.db';
const DB_PATH = path.isAbsolute(configuredDbPath) ? configuredDbPath : path.resolve(APP_DIR, configuredDbPath);
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new DatabaseSync(DB_PATH);
db.exec(`
  PRAGMA foreign_keys = ON;
  PRAGMA journal_mode = WAL;
  PRAGMA busy_timeout = 5000;

  CREATE TABLE IF NOT EXISTS app_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'staff')),
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_sessions_expiry ON sessions(expires_at);

  CREATE TABLE IF NOT EXISTS members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    notes TEXT NOT NULL DEFAULT '',
    email_opt_in INTEGER NOT NULL DEFAULT 0 CHECK (email_opt_in IN (0, 1)),
    marketing_opt_in INTEGER NOT NULL DEFAULT 0 CHECK (marketing_opt_in IN (0, 1)),
    created_at TEXT NOT NULL,
    created_on TEXT NOT NULL,
    is_demo INTEGER NOT NULL DEFAULT 0 CHECK (is_demo IN (0, 1))
  );
  CREATE INDEX IF NOT EXISTS idx_members_name ON members(name COLLATE NOCASE);
  CREATE INDEX IF NOT EXISTS idx_members_email ON members(email COLLATE NOCASE);

  CREATE TABLE IF NOT EXISTS membership_plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    duration_value INTEGER NOT NULL CHECK (duration_value > 0),
    duration_unit TEXT NOT NULL CHECK (duration_unit IN ('months', 'days')),
    price_minor INTEGER NOT NULL CHECK (price_minor >= 0),
    active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    is_demo INTEGER NOT NULL DEFAULT 0 CHECK (is_demo IN (0, 1))
  );

  CREATE TABLE IF NOT EXISTS memberships (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    plan_id INTEGER REFERENCES membership_plans(id) ON DELETE SET NULL,
    plan_name TEXT NOT NULL,
    duration_value INTEGER NOT NULL,
    duration_unit TEXT NOT NULL CHECK (duration_unit IN ('months', 'days')),
    price_minor INTEGER NOT NULL CHECK (price_minor >= 0),
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled')),
    created_at TEXT NOT NULL,
    created_by INTEGER REFERENCES app_users(id) ON DELETE SET NULL,
    is_demo INTEGER NOT NULL DEFAULT 0 CHECK (is_demo IN (0, 1))
  );
  CREATE INDEX IF NOT EXISTS idx_memberships_member_dates ON memberships(member_id, start_date, end_date);
  CREATE INDEX IF NOT EXISTS idx_memberships_end_date ON memberships(end_date);

  CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    membership_id INTEGER NOT NULL REFERENCES memberships(id) ON DELETE CASCADE,
    member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    amount_minor INTEGER NOT NULL CHECK (amount_minor > 0),
    method TEXT NOT NULL DEFAULT 'cash' CHECK (method = 'cash'),
    note TEXT NOT NULL DEFAULT '',
    paid_at TEXT NOT NULL,
    paid_on TEXT NOT NULL,
    created_by INTEGER REFERENCES app_users(id) ON DELETE SET NULL,
    is_demo INTEGER NOT NULL DEFAULT 0 CHECK (is_demo IN (0, 1))
  );
  CREATE INDEX IF NOT EXISTS idx_payments_paid_on ON payments(paid_on);
  CREATE INDEX IF NOT EXISTS idx_payments_membership ON payments(membership_id);

  CREATE TABLE IF NOT EXISTS email_notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    membership_id INTEGER NOT NULL REFERENCES memberships(id) ON DELETE CASCADE,
    member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    stage_days INTEGER NOT NULL CHECK (stage_days IN (7, 4)),
    recipient TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'sent', 'failed')),
    attempt_count INTEGER NOT NULL DEFAULT 0,
    next_attempt_at TEXT,
    last_error TEXT,
    created_at TEXT NOT NULL,
    sent_at TEXT,
    UNIQUE (membership_id, stage_days)
  );
  CREATE INDEX IF NOT EXISTS idx_email_notifications_queue ON email_notifications(status, next_attempt_at);

  CREATE TABLE IF NOT EXISTS email_campaigns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_name TEXT NOT NULL,
    sender_email TEXT NOT NULL,
    subject TEXT NOT NULL,
    html_body TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'sending', 'sent', 'partial', 'failed')),
    created_at TEXT NOT NULL,
    created_by INTEGER REFERENCES app_users(id) ON DELETE SET NULL
  );
  CREATE INDEX IF NOT EXISTS idx_email_campaigns_created ON email_campaigns(created_at DESC);

  CREATE TABLE IF NOT EXISTS email_campaign_recipients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    campaign_id INTEGER NOT NULL REFERENCES email_campaigns(id) ON DELETE CASCADE,
    member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    recipient TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'sent', 'failed', 'skipped')),
    attempt_count INTEGER NOT NULL DEFAULT 0,
    next_attempt_at TEXT,
    last_error TEXT,
    created_at TEXT NOT NULL,
    sent_at TEXT,
    UNIQUE (campaign_id, member_id)
  );
  CREATE INDEX IF NOT EXISTS idx_email_campaign_recipient_queue ON email_campaign_recipients(status, created_at);

  CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`);

const memberColumns = new Set(db.prepare('PRAGMA table_info(members)').all().map((column) => column.name));
if (!memberColumns.has('marketing_opt_in')) {
  db.exec('ALTER TABLE members ADD COLUMN marketing_opt_in INTEGER NOT NULL DEFAULT 0 CHECK (marketing_opt_in IN (0, 1))');
}
const campaignRecipientColumns = new Set(db.prepare('PRAGMA table_info(email_campaign_recipients)').all().map((column) => column.name));
if (!campaignRecipientColumns.has('attempt_count')) {
  db.exec('ALTER TABLE email_campaign_recipients ADD COLUMN attempt_count INTEGER NOT NULL DEFAULT 0');
}
if (!campaignRecipientColumns.has('next_attempt_at')) {
  db.exec('ALTER TABLE email_campaign_recipients ADD COLUMN next_attempt_at TEXT');
}

const settingsDefaults = {
  gym_name: 'Your Gym',
  currency: 'TND',
  timezone: DEFAULT_TIMEZONE,
};
const insertSetting = db.prepare('INSERT OR IGNORE INTO app_settings (key, value) VALUES (?, ?)');
for (const [key, value] of Object.entries(settingsDefaults)) insertSetting.run(key, value);

const nowIso = () => new Date().toISOString();
const getSetting = (key, fallback = '') => db.prepare('SELECT value FROM app_settings WHERE key = ?').get(key)?.value ?? fallback;
const setSetting = db.prepare('INSERT INTO app_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value');

function localDateForTimezone(date = new Date(), timezone = getSetting('timezone', DEFAULT_TIMEZONE)) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const part = (type) => parts.find((item) => item.type === type)?.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}

function addDays(dateString, days) {
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return date.toISOString().slice(0, 10);
}

function addMonths(dateString, months) {
  const [year, month, day] = dateString.split('-').map(Number);
  const firstOfTargetMonth = new Date(Date.UTC(year, month - 1 + months, 1));
  const lastDay = new Date(Date.UTC(firstOfTargetMonth.getUTCFullYear(), firstOfTargetMonth.getUTCMonth() + 1, 0)).getUTCDate();
  const result = new Date(Date.UTC(firstOfTargetMonth.getUTCFullYear(), firstOfTargetMonth.getUTCMonth(), Math.min(day, lastDay)));
  return result.toISOString().slice(0, 10);
}

function calculateEndDate(startDate, durationValue, durationUnit) {
  if (durationUnit === 'days') return addDays(startDate, durationValue - 1);
  return addDays(addMonths(startDate, durationValue), -1);
}

function daysBetween(laterDate, earlierDate) {
  const [ly, lm, ld] = laterDate.split('-').map(Number);
  const [ey, em, ed] = earlierDate.split('-').map(Number);
  return Math.round((Date.UTC(ly, lm - 1, ld) - Date.UTC(ey, em - 1, ed)) / 86_400_000);
}

function currencyFractionDigits(currency = getSetting('currency', 'TND')) {
  try {
    return new Intl.NumberFormat('en', { style: 'currency', currency }).resolvedOptions().maximumFractionDigits;
  } catch {
    return 2;
  }
}

function toMinorUnits(value, currency = getSetting('currency', 'TND')) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0 || amount > 1_000_000_000) return null;
  return Math.round(amount * (10 ** currencyFractionDigits(currency)));
}

function fromMinorUnits(value, currency = getSetting('currency', 'TND')) {
  return Number(value) / (10 ** currencyFractionDigits(currency));
}

function validDateString(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function normalizeEmail(value) {
  if (typeof value !== 'string') return null;
  const email = value.trim().toLowerCase();
  if (!email) return null;
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return undefined;
  return email;
}

function normalizePhone(value) {
  if (typeof value !== 'string') return null;
  const phone = value.trim();
  if (!phone) return null;
  if (phone.length > 40) return undefined;
  return phone;
}

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}

function configuredSenderEmail() {
  const from = process.env.SMTP_FROM || '';
  const address = from.match(/<([^<>]+)>/)?.[1] || from;
  return normalizeEmail(address);
}

function sanitizeCampaignHtml(value) {
  const safeTags = [...new Set([
    ...sanitizeHtml.defaults.allowedTags,
    'h1', 'h2', 'h3', 'h4', 'img', 'table', 'thead', 'tbody', 'tfoot', 'tr', 'td', 'th', 'center',
  ])];
  return sanitizeHtml(value, {
    allowedTags: safeTags,
    allowedAttributes: {
      '*': ['style', 'class'],
      a: ['href', 'name', 'target', 'rel'],
      img: ['src', 'alt', 'width', 'height', 'style'],
      table: ['width', 'cellpadding', 'cellspacing', 'border', 'role'],
      td: ['width', 'align', 'valign', 'colspan', 'rowspan'],
      th: ['width', 'align', 'valign', 'colspan', 'rowspan'],
    },
    allowedStyles: {
      '*': {
        color: [/^#[0-9a-f]{3,8}$/i, /^(?:rgb|rgba|hsl|hsla)\([0-9.,%\s]+\)$/i, /^[a-z]{3,20}$/i],
        'background-color': [/^#[0-9a-f]{3,8}$/i, /^(?:rgb|rgba|hsl|hsla)\([0-9.,%\s]+\)$/i, /^[a-z]{3,20}$/i],
        'font-size': [/^[0-9.]+(?:px|em|rem|%)$/i],
        'font-family': [/^[a-z0-9 ,"'_-]+$/i],
        'font-weight': [/^(?:normal|bold|[1-9]00)$/i],
        'text-align': [/^(?:left|right|center|justify)$/i],
        'text-decoration': [/^(?:none|underline|line-through)$/i],
        'line-height': [/^[0-9.]+(?:px|em|rem|%)?$/i],
        padding: [/^[0-9.]+(?:px|em|rem|%)?(?:\s+[0-9.]+(?:px|em|rem|%)?){0,3}$/i],
        margin: [/^[0-9.]+(?:px|em|rem|%)?(?:\s+[0-9.]+(?:px|em|rem|%)?){0,3}$/i],
        width: [/^[0-9.]+(?:px|%|em|rem)$/i],
        height: [/^[0-9.]+(?:px|%|em|rem)$/i],
        'max-width': [/^[0-9.]+(?:px|%|em|rem)$/i],
        'border-radius': [/^[0-9.]+(?:px|%|em|rem)$/i],
        border: [/^[0-9px solid #a-z(),.%\s]+$/i],
      },
    },
    allowedSchemes: ['http', 'https', 'mailto', 'tel'],
    allowedSchemesByTag: { img: ['http', 'https'] },
    allowProtocolRelative: false,
    transformTags: { a: sanitizeHtml.simpleTransform('a', { target: '_blank', rel: 'noopener noreferrer' }) },
  });
}

function campaignTextFromHtml(html) {
  return String(html)
    .replace(/<\s*br\s*\/?\s*>/gi, '\n')
    .replace(/<\/(?:p|div|h[1-6]|li|tr|table)>/gi, '\n')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/[ \t]+/g, ' ')
    .replace(/\n[ \t]+/g, '\n')
    .trim();
}

function parseRecipientList(value) {
  if (typeof value !== 'string' || !value.trim()) throw apiError('Enter at least one opted-in member email address.');
  const raw = value.split(/[\s,;]+/).filter(Boolean);
  if (raw.length > 100) throw apiError('A campaign can be sent to a maximum of 100 recipients at a time.');
  const normalized = raw.map((item) => normalizeEmail(item));
  if (normalized.some((email) => !email)) throw apiError('Check the recipient list: enter plain, valid email addresses.');
  return [...new Set(normalized)];
}

function validateCampaignSender(senderNameValue, senderEmailValue) {
  const senderName = requiredText(senderNameValue, 'Sender name', 80);
  if (/[\r\n]/.test(senderName)) throw apiError('Sender name cannot contain line breaks.');
  const senderEmail = normalizeEmail(senderEmailValue);
  if (!senderEmail) throw apiError('Enter a valid sender email address.');
  const configured = configuredSenderEmail();
  if (!configured) throw apiError('The SMTP sender address is missing or invalid in .env.');
  if (senderEmail !== configured) throw apiError(`Use the verified sender address configured in SMTP_FROM: ${configured}`);
  return { senderName, senderEmail };
}

function transaction(callback) {
  db.exec('BEGIN IMMEDIATE');
  try {
    const result = callback();
    db.exec('COMMIT');
    return result;
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

function hashText(value) {
  return createHash('sha256').update(value).digest('hex');
}

function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const derived = scryptSync(password, salt, 64).toString('hex');
  return `scrypt$${salt}$${derived}`;
}

function verifyPassword(password, storedHash) {
  try {
    const [scheme, salt, expectedHex] = storedHash.split('$');
    if (scheme !== 'scrypt' || !salt || !expectedHex) return false;
    const expected = Buffer.from(expectedHex, 'hex');
    const actual = scryptSync(password, salt, expected.length);
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}

function parseCookies(header = '') {
  const result = {};
  for (const part of header.split(';')) {
    const separator = part.indexOf('=');
    if (separator < 1) continue;
    const key = part.slice(0, separator).trim();
    const value = part.slice(separator + 1).trim();
    try { result[key] = decodeURIComponent(value); } catch { result[key] = value; }
  }
  return result;
}

function issueSession(userId, req, res) {
  const token = randomBytes(32).toString('base64url');
  const tokenHash = hashText(token);
  const createdAt = nowIso();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86_400_000).toISOString();
  db.prepare('INSERT INTO sessions (token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)')
    .run(tokenHash, userId, expiresAt, createdAt);
  const useSecureCookie = req.secure || process.env.COOKIE_SECURE === 'true';
  const secure = useSecureCookie ? '; Secure' : '';
  const sameSite = useSecureCookie ? 'None' : 'Strict';
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=${encodeURIComponent(token)}; HttpOnly; Path=/; SameSite=${sameSite}; Max-Age=${SESSION_DAYS * 86_400}${secure}`);
}

function clearSessionCookie(req, res) {
  const useSecureCookie = req.secure || process.env.COOKIE_SECURE === 'true';
  const secure = useSecureCookie ? '; Secure' : '';
  const sameSite = useSecureCookie ? 'None' : 'Strict';
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=; HttpOnly; Path=/; SameSite=${sameSite}; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT${secure}`);
}

function authMiddleware(req, res, next) {
  const token = parseCookies(req.headers.cookie)[COOKIE_NAME];
  if (!token || token.length < 32 || token.length > 128) return res.status(401).json({ error: 'Please sign in to continue.' });
  const tokenHash = hashText(token);
  const session = db.prepare(`
    SELECT s.token_hash, s.expires_at, u.id, u.name, u.email, u.role
    FROM sessions s JOIN app_users u ON u.id = s.user_id
    WHERE s.token_hash = ?
  `).get(tokenHash);
  if (!session || session.expires_at <= nowIso()) {
    if (session) db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(tokenHash);
    clearSessionCookie(req, res);
    return res.status(401).json({ error: 'Your session has expired. Please sign in again.' });
  }
  req.user = { id: session.id, name: session.name, email: session.email, role: session.role };
  req.sessionHash = tokenHash;
  next();
}

function csrfProtection(req, res, next) {
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) return next();
  const origin = req.get('origin');
  if (origin) {
    try {
      const originHost = new URL(origin).host;
      const forwardedHosts = (req.get('x-forwarded-host') || '').split(',').map((host) => host.trim()).filter(Boolean);
      const allowedHosts = [req.get('host'), ...forwardedHosts].filter(Boolean);
      if (!allowedHosts.includes(originHost)) return res.status(403).json({ error: 'Request origin was rejected.' });
    } catch {
      return res.status(403).json({ error: 'Request origin was rejected.' });
    }
  }
  next();
}

const loginAttempts = new Map();
function loginRateLimit(req, res, next) {
  const key = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const bucket = loginAttempts.get(key);
  if (!bucket || now - bucket.startedAt > 15 * 60_000) {
    loginAttempts.set(key, { count: 1, startedAt: now });
    return next();
  }
  if (bucket.count >= 10) return res.status(429).json({ error: 'Too many sign-in attempts. Please wait 15 minutes and try again.' });
  bucket.count += 1;
  next();
}

function apiError(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function requiredText(value, label, maxLength = 120) {
  if (typeof value !== 'string' || !value.trim()) throw apiError(`${label} is required.`);
  const result = value.trim();
  if (result.length > maxLength) throw apiError(`${label} must be ${maxLength} characters or fewer.`);
  return result;
}

function getPlanById(planId) {
  const id = Number(planId);
  if (!Number.isInteger(id) || id < 1) throw apiError('Choose a valid membership plan.');
  const plan = db.prepare('SELECT * FROM membership_plans WHERE id = ? AND active = 1').get(id);
  if (!plan) throw apiError('That membership plan is not available. Please refresh and try again.', 404);
  return plan;
}

function createMembership({ memberId, plan, startDate, priceMinor, createdBy, isDemo = 0 }) {
  const endDate = calculateEndDate(startDate, plan.duration_value, plan.duration_unit);
  const createdAt = nowIso();
  const result = db.prepare(`
    INSERT INTO memberships
      (member_id, plan_id, plan_name, duration_value, duration_unit, price_minor, start_date, end_date, status, created_at, created_by, is_demo)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?)
  `).run(memberId, plan.id, plan.name, plan.duration_value, plan.duration_unit, priceMinor ?? plan.price_minor, startDate, endDate, createdAt, createdBy ?? null, isDemo);
  return { id: Number(result.lastInsertRowid), endDate };
}

function confirmedPaidMinor(membershipId) {
  return Number(db.prepare('SELECT COALESCE(SUM(amount_minor), 0) AS total FROM payments WHERE membership_id = ?').get(membershipId).total);
}

function insertCashPayment({ memberId, membershipId, amountMinor, note = '', createdBy, isDemo = 0 }) {
  db.prepare(`
    INSERT INTO payments (membership_id, member_id, amount_minor, method, note, paid_at, paid_on, created_by, is_demo)
    VALUES (?, ?, ?, 'cash', ?, ?, ?, ?, ?)
  `).run(membershipId, memberId, amountMinor, note, nowIso(), localDateForTimezone(), createdBy ?? null, isDemo);
}

function activeMembershipFilter(today) {
  return { today };
}

function getMemberSummary(member, today = localDateForTimezone()) {
  const membership = db.prepare(`
    SELECT * FROM memberships
    WHERE member_id = ?
    ORDER BY
      CASE WHEN status = 'active' AND start_date <= ? AND end_date >= ? THEN 0
           WHEN status = 'active' AND start_date > ? THEN 1
           ELSE 2 END,
      CASE WHEN status = 'active' THEN end_date END DESC,
      created_at DESC,
      id DESC
    LIMIT 1
  `).get(member.id, today, today, today);

  let membershipSummary = null;
  let paidMinor = 0;
  let outstandingMinor = 0;
  let daysRemaining = null;
  let status = 'no-plan';
  if (membership) {
    paidMinor = confirmedPaidMinor(membership.id);
    outstandingMinor = Math.max(0, Number(membership.price_minor) - paidMinor);
    daysRemaining = daysBetween(membership.end_date, today);
    if (membership.status !== 'active') status = membership.status;
    else if (membership.start_date > today) status = 'upcoming';
    else if (daysRemaining < 0) status = 'expired';
    else if (daysRemaining <= 7) status = 'expiring';
    else status = 'active';
    membershipSummary = {
      id: membership.id,
      planId: membership.plan_id,
      planName: membership.plan_name,
      durationValue: membership.duration_value,
      durationUnit: membership.duration_unit,
      priceMinor: Number(membership.price_minor),
      startDate: membership.start_date,
      endDate: membership.end_date,
      status,
    };
  }
  const paymentState = !membership ? 'none' : outstandingMinor <= 0 ? 'paid' : paidMinor > 0 ? 'partial' : 'due';
  return {
    id: member.id,
    isDemo: Boolean(member.is_demo),
    name: member.name,
    email: member.email,
    phone: member.phone,
    notes: member.notes,
    emailOptIn: Boolean(member.email_opt_in),
    marketingOptIn: Boolean(member.marketing_opt_in),
    createdAt: member.created_at,
    createdOn: member.created_on,
    membership: membershipSummary,
    paidMinor,
    outstandingMinor,
    paymentState,
    daysRemaining,
  };
}

function getMembersList(search = '') {
  const today = localDateForTimezone();
  const query = search.trim().slice(0, 100);
  const members = query
    ? db.prepare(`SELECT * FROM members WHERE name LIKE ? OR COALESCE(email, '') LIKE ? OR COALESCE(phone, '') LIKE ? ORDER BY created_at DESC, id DESC LIMIT 1000`).all(`%${query}%`, `%${query}%`, `%${query}%`)
    : db.prepare('SELECT * FROM members ORDER BY created_at DESC, id DESC LIMIT 1000').all();
  return members.map((member) => getMemberSummary(member, today));
}

function currentMembershipRows(today = localDateForTimezone()) {
  return db.prepare(`
    SELECT s.*, m.name AS member_name, m.email, m.email_opt_in
    FROM memberships s JOIN members m ON m.id = s.member_id
    WHERE s.status = 'active' AND s.start_date <= ? AND s.end_date >= ?
  `).all(today, today);
}

function getOverview() {
  const today = localDateForTimezone();
  const monthStart = `${today.slice(0, 7)}-01`;
  const sevenDaysAgo = addDays(today, -6);
  const currentRows = currentMembershipRows(today);
  const activeMembers = new Set(currentRows.map((row) => row.member_id)).size;
  const expiringRows = currentRows.filter((row) => {
    const remaining = daysBetween(row.end_date, today);
    return remaining >= 0 && remaining <= 7;
  });
  const expiredMembers = db.prepare(`
    SELECT COUNT(DISTINCT old.member_id) AS count
    FROM memberships old
    WHERE old.status = 'active' AND old.end_date < ?
      AND NOT EXISTS (
        SELECT 1 FROM memberships future
        WHERE future.member_id = old.member_id AND future.status = 'active'
          AND future.start_date <= ? AND future.end_date >= ?
      )
  `).get(today, today, today).count;
  const revenueToday = Number(db.prepare('SELECT COALESCE(SUM(amount_minor), 0) AS total FROM payments WHERE paid_on = ?').get(today).total);
  const revenueMonth = Number(db.prepare('SELECT COALESCE(SUM(amount_minor), 0) AS total FROM payments WHERE paid_on >= ? AND paid_on <= ?').get(monthStart, today).total);
  const outstandingMinor = currentRows.reduce((sum, row) => sum + Math.max(0, Number(row.price_minor) - confirmedPaidMinor(row.id)), 0);
  const newMembers30 = Number(db.prepare('SELECT COUNT(*) AS count FROM members WHERE created_on >= ? AND created_on <= ?').get(addDays(today, -29), today).count);

  const chartRows = db.prepare(`
    SELECT paid_on, SUM(amount_minor) AS total
    FROM payments WHERE paid_on >= ? AND paid_on <= ?
    GROUP BY paid_on ORDER BY paid_on
  `).all(sevenDaysAgo, today);
  const chartMap = new Map(chartRows.map((row) => [row.paid_on, Number(row.total)]));
  const revenueByDay = Array.from({ length: 7 }, (_, index) => {
    const date = addDays(sevenDaysAgo, index);
    return { date, amountMinor: chartMap.get(date) || 0 };
  });

  const plans = db.prepare(`
    SELECT s.plan_name AS name, COUNT(DISTINCT s.member_id) AS members
    FROM memberships s
    WHERE s.status = 'active' AND s.start_date <= ? AND s.end_date >= ?
    GROUP BY s.plan_name ORDER BY members DESC, name ASC LIMIT 5
  `).all(today, today);
  const recentPayments = db.prepare(`
    SELECT p.id, p.amount_minor, p.paid_at, p.paid_on, p.note, m.name AS member_name, s.plan_name
    FROM payments p JOIN members m ON m.id = p.member_id JOIN memberships s ON s.id = p.membership_id
    ORDER BY p.paid_at DESC, p.id DESC LIMIT 6
  `).all().map((payment) => ({ ...payment, amountMinor: Number(payment.amount_minor) }));
  const reminderCounts = db.prepare(`
    SELECT status, COUNT(*) AS count FROM email_notifications GROUP BY status
  `).all().reduce((accumulator, item) => ({ ...accumulator, [item.status]: Number(item.count) }), {});
  const allMembers = Number(db.prepare('SELECT COUNT(*) AS count FROM members').get().count);

  return {
    today,
    stats: {
      totalMembers: allMembers,
      activeMembers,
      expiringSoon: expiringRows.length,
      expiredMembers: Number(expiredMembers),
      revenueTodayMinor: revenueToday,
      revenueMonthMinor: revenueMonth,
      outstandingMinor,
      newMembers30,
      queuedEmails: reminderCounts.queued || 0,
      failedEmails: reminderCounts.failed || 0,
    },
    revenueByDay,
    plans,
    recentPayments,
    expiringMembers: expiringRows
      .map((membership) => ({
        id: membership.member_id,
        name: membership.member_name,
        email: membership.email,
        planName: membership.plan_name,
        endDate: membership.end_date,
        daysRemaining: daysBetween(membership.end_date, today),
      }))
      .sort((a, b) => a.daysRemaining - b.daysRemaining)
      .slice(0, 6),
  };
}

function smtpConfigured() {
  return Boolean(String(process.env.SMTP_HOST || '').trim() && configuredSenderEmail());
}

function getTransporter() {
  if (!smtpConfigured()) return null;
  const port = Number(process.env.SMTP_PORT || 587);
  const secure = String(process.env.SMTP_SECURE || '').toLowerCase() === 'true' || port === 465;
  const options = {
    host: process.env.SMTP_HOST,
    port,
    secure,
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  };
  if (process.env.SMTP_USER || process.env.SMTP_PASS) {
    options.auth = { user: process.env.SMTP_USER || '', pass: process.env.SMTP_PASS || '' };
  }
  return nodemailer.createTransport(options);
}

async function sendReminderEmail(notification) {
  const transport = getTransporter();
  if (!transport) return false;
  const gymName = getSetting('gym_name', 'Your Gym');
  const name = escapeHtml(notification.member_name);
  const planName = escapeHtml(notification.plan_name);
  const endDate = escapeHtml(notification.end_date);
  const days = Number(notification.stage_days);
  const subject = `${gymName}: your membership ends in ${days} days`;
  const appUrl = (process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '');
  await transport.sendMail({
    from: process.env.SMTP_FROM,
    to: notification.recipient,
    subject,
    text: `Hi ${notification.member_name},\n\nYour ${notification.plan_name} membership at ${gymName} ends on ${notification.end_date}, in ${days} days. Please contact the gym to renew.\n\n${gymName}\n${appUrl}`,
    html: `<!doctype html><html><body style="margin:0;padding:32px;background:#f4f6f8;font-family:Arial,sans-serif;color:#18232b"><div style="max-width:560px;margin:auto;padding:32px;background:#fff;border-radius:16px"><div style="font-size:12px;font-weight:bold;letter-spacing:2px;color:#79a83d;text-transform:uppercase">${escapeHtml(gymName)}</div><h1 style="font-size:25px;margin:16px 0 10px">Your membership is ending soon</h1><p>Hi ${name}, your <strong>${planName}</strong> membership ends on <strong>${endDate}</strong> — in ${days} days.</p><p>Please contact the gym if you would like to renew.</p><p style="margin-top:28px;color:#6a7781;font-size:13px">${escapeHtml(gymName)}</p></div></body></html>`,
  });
  return true;
}

let reminderCycleRunning = false;
async function runReminderCycle() {
  if (reminderCycleRunning) return;
  reminderCycleRunning = true;
  try {
    const today = localDateForTimezone();
    const current = currentMembershipRows(today);
    const createReminder = db.prepare(`
      INSERT OR IGNORE INTO email_notifications
        (membership_id, member_id, stage_days, recipient, status, attempt_count, created_at)
      VALUES (?, ?, ?, ?, 'queued', 0, ?)
    `);
    for (const membership of current) {
      if (!membership.email || !membership.email_opt_in) continue;
      const renewed = db.prepare(`
        SELECT 1 FROM memberships other
        WHERE other.member_id = ? AND other.id <> ? AND other.status = 'active'
          AND other.start_date <= ? AND other.end_date > ?
        LIMIT 1
      `).get(membership.member_id, membership.id, addDays(membership.end_date, 1), membership.end_date);
      if (renewed) continue;
      const remaining = daysBetween(membership.end_date, today);
      let stage = null;
      if (remaining > 4 && remaining <= 7) stage = 7;
      else if (remaining > 0 && remaining <= 4) stage = 4;
      if (stage) createReminder.run(membership.id, membership.member_id, stage, membership.email, nowIso());
    }

    if (!smtpConfigured()) return;
    const due = db.prepare(`
      SELECT n.*, m.name AS member_name, s.plan_name, s.end_date
      FROM email_notifications n
      JOIN members m ON m.id = n.member_id
      JOIN memberships s ON s.id = n.membership_id
      WHERE n.status IN ('queued', 'failed')
        AND n.attempt_count < 3
        AND (n.next_attempt_at IS NULL OR n.next_attempt_at <= ?)
      ORDER BY n.created_at ASC LIMIT 10
    `).all(nowIso());
    for (const notification of due) {
      try {
        await sendReminderEmail(notification);
        db.prepare(`UPDATE email_notifications SET status = 'sent', attempt_count = attempt_count + 1,
          sent_at = ?, next_attempt_at = NULL, last_error = NULL WHERE id = ?`).run(nowIso(), notification.id);
      } catch (error) {
        const attempts = Number(notification.attempt_count) + 1;
        const backoffMinutes = attempts === 1 ? 15 : attempts === 2 ? 60 : 360;
        const retryAt = new Date(Date.now() + backoffMinutes * 60_000).toISOString();
        db.prepare(`UPDATE email_notifications SET status = 'failed', attempt_count = ?, next_attempt_at = ?, last_error = ? WHERE id = ?`)
          .run(attempts, retryAt, String(error?.message || 'Email delivery failed').slice(0, 500), notification.id);
        console.error(`Could not send membership reminder #${notification.id}:`, error?.message || error);
      }
    }
  } catch (error) {
    console.error('Reminder scheduler error:', error);
  } finally {
    reminderCycleRunning = false;
  }
}

async function sendCampaignEmail(campaign, recipient) {
  const transport = getTransporter();
  if (!transport) throw new Error('SMTP is not configured.');
  const gymName = getSetting('gym_name', 'Your Gym');
  const footerText = `You are receiving this promotional email because you agreed to updates from ${gymName}. Reply to ${campaign.sender_email} if you would like the gym to remove you from future promotions.`;
  const footerHtml = `<hr style="border:0;border-top:1px solid #e5e7eb;margin:28px 0"><p style="font-family:Arial,sans-serif;font-size:12px;line-height:1.6;color:#65716a">You are receiving this promotional email because you agreed to updates from ${escapeHtml(gymName)}. Reply to <a href="mailto:${escapeHtml(campaign.sender_email)}">${escapeHtml(campaign.sender_email)}</a> if you would like the gym to remove you from future promotions.</p>`;
  const safeBody = sanitizeCampaignHtml(campaign.html_body);
  await transport.sendMail({
    from: { name: campaign.sender_name, address: campaign.sender_email },
    replyTo: campaign.sender_email,
    to: recipient.recipient,
    subject: campaign.subject,
    text: `${campaignTextFromHtml(safeBody)}\n\n${footerText}`,
    html: `<!doctype html><html><body>${safeBody}${footerHtml}</body></html>`,
  });
}

function refreshCampaignStatus(campaignId) {
  const counts = db.prepare(`
    SELECT COUNT(*) AS total,
      SUM(CASE WHEN status = 'queued' THEN 1 ELSE 0 END) AS queued,
      SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) AS sent,
      SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) AS failed,
      SUM(CASE WHEN status = 'skipped' THEN 1 ELSE 0 END) AS skipped
    FROM email_campaign_recipients WHERE campaign_id = ?
  `).get(campaignId);
  const queued = Number(counts.queued || 0);
  const sent = Number(counts.sent || 0);
  const failed = Number(counts.failed || 0);
  const skipped = Number(counts.skipped || 0);
  const status = queued > 0 ? 'sending' : (failed + skipped > 0 ? (sent > 0 ? 'partial' : 'failed') : 'sent');
  db.prepare('UPDATE email_campaigns SET status = ? WHERE id = ?').run(status, campaignId);
}

let campaignCycleRunning = false;
async function runCampaignQueue() {
  if (campaignCycleRunning || !smtpConfigured()) return;
  campaignCycleRunning = true;
  try {
    const queued = db.prepare(`
      SELECT r.id AS recipient_id, r.campaign_id, r.member_id, r.recipient, r.attempt_count,
        m.email AS current_email, m.marketing_opt_in,
        c.sender_name, c.sender_email, c.subject, c.html_body
      FROM email_campaign_recipients r
      JOIN email_campaigns c ON c.id = r.campaign_id
      JOIN members m ON m.id = r.member_id
      WHERE r.status = 'queued' AND (r.next_attempt_at IS NULL OR r.next_attempt_at <= ?)
        AND c.status IN ('queued', 'sending')
      ORDER BY c.created_at ASC, r.id ASC LIMIT 20
    `).all(nowIso());
    for (const recipient of queued) {
      db.prepare("UPDATE email_campaigns SET status = 'sending' WHERE id = ? AND status = 'queued'").run(recipient.campaign_id);
      if (!recipient.marketing_opt_in || !recipient.current_email || recipient.current_email.toLowerCase() !== recipient.recipient.toLowerCase()) {
        db.prepare("UPDATE email_campaign_recipients SET status = 'skipped', last_error = 'Member consent or email address changed before send.' WHERE id = ?")
          .run(recipient.recipient_id);
      } else {
        try {
          await sendCampaignEmail(recipient, { recipient: recipient.recipient });
          db.prepare("UPDATE email_campaign_recipients SET status = 'sent', attempt_count = attempt_count + 1, next_attempt_at = NULL, sent_at = ?, last_error = NULL WHERE id = ?")
            .run(nowIso(), recipient.recipient_id);
        } catch (error) {
          const attempts = Number(recipient.attempt_count) + 1;
          const retryable = attempts < 3;
          const delayMinutes = attempts === 1 ? 1 : 15;
          const nextAttemptAt = retryable ? new Date(Date.now() + delayMinutes * 60_000).toISOString() : null;
          db.prepare(`UPDATE email_campaign_recipients SET status = ?, attempt_count = ?, next_attempt_at = ?, last_error = ? WHERE id = ?`)
            .run(retryable ? 'queued' : 'failed', attempts, nextAttemptAt, String(error?.message || 'Email delivery failed').slice(0, 500), recipient.recipient_id);
          console.error(`Could not send campaign #${recipient.campaign_id} to recipient #${recipient.recipient_id} (attempt ${attempts}/3):`, error?.message || error);
        }
      }
      refreshCampaignStatus(recipient.campaign_id);
    }
  } catch (error) {
    console.error('Campaign queue error:', error);
  } finally {
    campaignCycleRunning = false;
  }
}

function getCurrencyLocked() {
  return Number(db.prepare('SELECT COUNT(*) AS count FROM membership_plans').get().count) > 0
    || Number(db.prepare('SELECT COUNT(*) AS count FROM memberships').get().count) > 0
    || Number(db.prepare('SELECT COUNT(*) AS count FROM payments').get().count) > 0;
}

function setNoCache(req, res, next) {
  res.setHeader('Cache-Control', 'no-store');
  next();
}

function csvCell(value) {
  let text = String(value ?? '');
  if ('=+-@\t\r'.includes(text[0] || '')) text = `'${text}`;
  return '"' + text.replaceAll('"', '""') + '"';
}

const app = express();
app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  // Frame policy is intentionally omitted so the hosted Arena preview can embed this app.
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self'; frame-src 'self' about:; base-uri 'self'; form-action 'self'");
  next();
});
app.use(express.json({ limit: '64kb' }));
app.use((req, res, next) => { if (!req.body || typeof req.body !== 'object') req.body = {}; next(); });
app.use('/api', setNoCache);
app.use('/api', csrfProtection);

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.get('/api/setup-status', (req, res) => {
  res.json({ setupRequired: Number(db.prepare('SELECT COUNT(*) AS count FROM app_users').get().count) === 0 });
});

app.post('/api/setup', (req, res, next) => {
  try {
    if (Number(db.prepare('SELECT COUNT(*) AS count FROM app_users').get().count) > 0) {
      return res.status(409).json({ error: 'Setup is already complete. Please sign in.' });
    }
    const name = requiredText(req.body.name, 'Your name', 100);
    const email = normalizeEmail(req.body.email);
    if (!email) throw apiError('Enter a valid email address.');
    const password = typeof req.body.password === 'string' ? req.body.password : '';
    if (password.length < 10) throw apiError('Choose a password with at least 10 characters.');
    if (password.length > 200) throw apiError('Password is too long.');
    const gymName = requiredText(req.body.gymName || 'Your Gym', 'Gym name', 100);
    const currency = String(req.body.currency || 'TND').trim().toUpperCase();
    try { new Intl.NumberFormat('en', { style: 'currency', currency }).format(1); } catch { throw apiError('Enter a valid three-letter currency code, such as TND, EUR, or USD.'); }
    const timezone = String(req.body.timezone || DEFAULT_TIMEZONE).trim();
    try { new Intl.DateTimeFormat('en', { timeZone: timezone }).format(new Date()); } catch { throw apiError('Enter a valid timezone, for example Africa/Tunis.'); }

    const result = transaction(() => {
      const insertUser = db.prepare('INSERT INTO app_users (name, email, password_hash, role, created_at) VALUES (?, ?, ?, \'owner\', ?)')
        .run(name, email, hashPassword(password), nowIso());
      setSetting.run('gym_name', gymName);
      setSetting.run('currency', currency);
      setSetting.run('timezone', timezone);
      return Number(insertUser.lastInsertRowid);
    });
    issueSession(result, req, res);
    res.status(201).json({ user: { name, email, role: 'owner' }, setupComplete: true });
  } catch (error) { next(error); }
});

app.post('/api/login', loginRateLimit, (req, res, next) => {
  try {
    const email = normalizeEmail(req.body.email);
    const password = typeof req.body.password === 'string' ? req.body.password : '';
    const user = email ? db.prepare('SELECT * FROM app_users WHERE email = ? COLLATE NOCASE').get(email) : null;
    if (!user || !verifyPassword(password, user.password_hash)) return res.status(401).json({ error: 'Email or password is incorrect.' });
    issueSession(user.id, req, res);
    res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (error) { next(error); }
});

app.post('/api/logout', authMiddleware, (req, res) => {
  db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(req.sessionHash);
  clearSessionCookie(req, res);
  res.json({ ok: true });
});

app.use('/api', authMiddleware);
app.use('/api', (req, res, next) => req.user?.role === 'owner' ? next() : res.status(403).json({ error: 'Owner access only.' }));

app.get('/api/me', (req, res) => res.json({ user: req.user }));

app.post('/api/account/password', (req, res, next) => {
  try {
    const currentPassword = typeof req.body.currentPassword === 'string' ? req.body.currentPassword : '';
    const newPassword = typeof req.body.newPassword === 'string' ? req.body.newPassword : '';
    const user = db.prepare('SELECT password_hash FROM app_users WHERE id = ?').get(req.user.id);
    if (!user || !verifyPassword(currentPassword, user.password_hash)) throw apiError('Current password is incorrect.', 403);
    if (newPassword.length < 10) throw apiError('Choose a new password with at least 10 characters.');
    if (newPassword.length > 200) throw apiError('New password is too long.');
    if (currentPassword === newPassword) throw apiError('Choose a different password from your current one.');
    transaction(() => {
      db.prepare('UPDATE app_users SET password_hash = ? WHERE id = ?').run(hashPassword(newPassword), req.user.id);
      db.prepare('DELETE FROM sessions WHERE user_id = ? AND token_hash <> ?').run(req.user.id, req.sessionHash);
    });
    res.json({ ok: true });
  } catch (error) { next(error); }
});
app.get('/api/config', (req, res) => {
  res.json({
    gymName: getSetting('gym_name', 'Your Gym'),
    currency: getSetting('currency', 'TND'),
    currencyDigits: currencyFractionDigits(),
    timezone: getSetting('timezone', DEFAULT_TIMEZONE),
    currencyLocked: getCurrencyLocked(),
    smtpConfigured: smtpConfigured(),
    emailFrom: smtpConfigured() ? process.env.SMTP_FROM : null,
    smtpSenderEmail: smtpConfigured() ? configuredSenderEmail() : null,
    marketingRecipientCount: Number(db.prepare("SELECT COUNT(*) AS count FROM members WHERE marketing_opt_in = 1 AND email IS NOT NULL AND email <> ''").get().count),
    database: 'SQLite',
  });
});

app.patch('/api/settings', (req, res, next) => {
  try {
    const gymName = requiredText(req.body.gymName, 'Gym name', 100);
    const timezone = requiredText(req.body.timezone, 'Timezone', 100);
    try { new Intl.DateTimeFormat('en', { timeZone: timezone }).format(new Date()); } catch { throw apiError('Enter a valid timezone, for example Africa/Tunis.'); }
    let currency = getSetting('currency', 'TND');
    if (req.body.currency !== undefined) {
      const requestedCurrency = String(req.body.currency).trim().toUpperCase();
      try { new Intl.NumberFormat('en', { style: 'currency', currency: requestedCurrency }).format(1); } catch { throw apiError('Enter a valid three-letter currency code, such as TND, EUR, or USD.'); }
      if (requestedCurrency !== currency && getCurrencyLocked()) throw apiError('Currency cannot be changed after plans, memberships, or payments have been created.');
      currency = requestedCurrency;
    }
    setSetting.run('gym_name', gymName);
    setSetting.run('timezone', timezone);
    setSetting.run('currency', currency);
    res.json({ gymName, timezone, currency, currencyDigits: currencyFractionDigits(currency), currencyLocked: getCurrencyLocked() });
  } catch (error) { next(error); }
});

app.get('/api/overview', (req, res) => res.json(getOverview()));

app.get('/api/members', (req, res) => {
  const search = typeof req.query.search === 'string' ? req.query.search : '';
  res.json({ members: getMembersList(search) });
});

app.get('/api/members/:id', (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) throw apiError('Member not found.', 404);
    const member = db.prepare('SELECT * FROM members WHERE id = ?').get(id);
    if (!member) throw apiError('Member not found.', 404);
    const today = localDateForTimezone();
    const memberships = db.prepare('SELECT * FROM memberships WHERE member_id = ? ORDER BY start_date DESC, id DESC').all(id).map((membership) => {
      const paidMinor = confirmedPaidMinor(membership.id);
      const daysRemaining = daysBetween(membership.end_date, today);
      let state = membership.status;
      if (state === 'active' && membership.start_date > today) state = 'upcoming';
      else if (state === 'active' && daysRemaining < 0) state = 'expired';
      else if (state === 'active' && daysRemaining <= 7) state = 'expiring';
      else if (state === 'active') state = 'active';
      return {
        id: membership.id,
        planName: membership.plan_name,
        durationValue: membership.duration_value,
        durationUnit: membership.duration_unit,
        priceMinor: Number(membership.price_minor),
        paidMinor,
        outstandingMinor: Math.max(0, Number(membership.price_minor) - paidMinor),
        startDate: membership.start_date,
        endDate: membership.end_date,
        status: state,
      };
    });
    const payments = db.prepare(`
      SELECT p.id, p.membership_id, p.amount_minor, p.method, p.note, p.paid_at, p.paid_on, s.plan_name
      FROM payments p JOIN memberships s ON s.id = p.membership_id
      WHERE p.member_id = ? ORDER BY p.paid_at DESC, p.id DESC
    `).all(id).map((payment) => ({ ...payment, amountMinor: Number(payment.amount_minor) }));
    res.json({ member: getMemberSummary(member, today), memberships, payments });
  } catch (error) { next(error); }
});

app.post('/api/members', (req, res, next) => {
  try {
    const name = requiredText(req.body.name, 'Member name', 120);
    const email = normalizeEmail(req.body.email);
    if (email === undefined) throw apiError('Enter a valid email address.');
    if (!email) throw apiError('Member email is required.');
    const phone = normalizePhone(req.body.phone);
    if (phone === undefined) throw apiError('Phone number must be 40 characters or fewer.');
    if (!phone) throw apiError('Member phone number is required.');
    const notes = typeof req.body.notes === 'string' ? req.body.notes.trim().slice(0, 1000) : '';
    const plan = getPlanById(req.body.planId);
    const startDate = req.body.startDate || localDateForTimezone();
    if (!validDateString(startDate)) throw apiError('Choose a valid membership start date.');
    const priceMinor = req.body.price === undefined || req.body.price === '' ? Number(plan.price_minor) : toMinorUnits(req.body.price);
    if (priceMinor === null || priceMinor < 0) throw apiError('Enter a valid membership price.');
    const confirmCash = req.body.confirmCash === true;
    const paymentAmountMinor = confirmCash
      ? (req.body.paymentAmount === undefined || req.body.paymentAmount === '' ? priceMinor : toMinorUnits(req.body.paymentAmount))
      : 0;
    if (confirmCash && (!paymentAmountMinor || paymentAmountMinor < 1 || paymentAmountMinor > priceMinor)) {
      throw apiError('Enter a cash amount greater than zero and no more than the membership price.');
    }
    const marketingOptIn = req.body.marketingOptIn === true;
    if (req.body.emailOptIn === true && !email) throw apiError('An email address is required before enabling email reminders.');
    if (marketingOptIn && !email) throw apiError('An email address is required before enabling promotional emails.');

    const newMemberId = transaction(() => {
      const memberInsert = db.prepare(`
        INSERT INTO members (name, email, phone, notes, email_opt_in, marketing_opt_in, created_at, created_on)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(name, email, phone, notes, req.body.emailOptIn === true ? 1 : 0, marketingOptIn ? 1 : 0, nowIso(), localDateForTimezone());
      const memberId = Number(memberInsert.lastInsertRowid);
      const membership = createMembership({ memberId, plan, startDate, priceMinor, createdBy: req.user.id });
      if (confirmCash) insertCashPayment({ memberId, membershipId: membership.id, amountMinor: paymentAmountMinor, note: 'Cash received and confirmed at registration', createdBy: req.user.id });
      return memberId;
    });
    res.status(201).json({ member: getMemberSummary(db.prepare('SELECT * FROM members WHERE id = ?').get(newMemberId)) });
  } catch (error) { next(error); }
});

app.patch('/api/members/:id', (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const existing = db.prepare('SELECT * FROM members WHERE id = ?').get(id);
    if (!existing) throw apiError('Member not found.', 404);
    const name = req.body.name === undefined ? existing.name : requiredText(req.body.name, 'Member name', 120);
    const email = req.body.email === undefined ? existing.email : normalizeEmail(req.body.email);
    if (email === undefined) throw apiError('Enter a valid email address.');
    if (!email) throw apiError('Member email is required.');
    const phone = req.body.phone === undefined ? existing.phone : normalizePhone(req.body.phone);
    if (phone === undefined) throw apiError('Phone number must be 40 characters or fewer.');
    if (!phone) throw apiError('Member phone number is required.');
    const notes = req.body.notes === undefined ? existing.notes : String(req.body.notes).trim().slice(0, 1000);
    const emailOptIn = req.body.emailOptIn === undefined ? Boolean(existing.email_opt_in) : req.body.emailOptIn === true;
    const marketingOptIn = req.body.marketingOptIn === undefined ? Boolean(existing.marketing_opt_in) : req.body.marketingOptIn === true;
    if (emailOptIn && !email) throw apiError('An email address is required before enabling email reminders.');
    if (marketingOptIn && !email) throw apiError('An email address is required before enabling promotional emails.');
    db.prepare('UPDATE members SET name = ?, email = ?, phone = ?, notes = ?, email_opt_in = ?, marketing_opt_in = ? WHERE id = ?')
      .run(name, email, phone, notes, emailOptIn ? 1 : 0, marketingOptIn ? 1 : 0, id);
    res.json({ member: getMemberSummary(db.prepare('SELECT * FROM members WHERE id = ?').get(id)) });
  } catch (error) { next(error); }
});

app.post('/api/members/:id/memberships', (req, res, next) => {
  try {
    const memberId = Number(req.params.id);
    const member = db.prepare('SELECT * FROM members WHERE id = ?').get(memberId);
    if (!member) throw apiError('Member not found.', 404);
    const plan = getPlanById(req.body.planId);
    const today = localDateForTimezone();
    const latest = db.prepare(`SELECT end_date FROM memberships WHERE member_id = ? AND status = 'active' ORDER BY end_date DESC, id DESC LIMIT 1`).get(memberId);
    const defaultStart = latest && latest.end_date >= today ? addDays(latest.end_date, 1) : today;
    const startDate = req.body.startDate || defaultStart;
    if (!validDateString(startDate)) throw apiError('Choose a valid membership start date.');
    const priceMinor = req.body.price === undefined || req.body.price === '' ? Number(plan.price_minor) : toMinorUnits(req.body.price);
    if (priceMinor === null || priceMinor < 0) throw apiError('Enter a valid membership price.');
    const confirmCash = req.body.confirmCash === true;
    const paymentAmountMinor = confirmCash
      ? (req.body.paymentAmount === undefined || req.body.paymentAmount === '' ? priceMinor : toMinorUnits(req.body.paymentAmount))
      : 0;
    if (confirmCash && (!paymentAmountMinor || paymentAmountMinor < 1 || paymentAmountMinor > priceMinor)) {
      throw apiError('Enter a cash amount greater than zero and no more than the membership price.');
    }
    const result = transaction(() => {
      const membership = createMembership({ memberId, plan, startDate, priceMinor, createdBy: req.user.id });
      if (confirmCash) insertCashPayment({ memberId, membershipId: membership.id, amountMinor: paymentAmountMinor, note: 'Cash received and confirmed during renewal', createdBy: req.user.id });
      return membership;
    });
    res.status(201).json({ membership: result, member: getMemberSummary(db.prepare('SELECT * FROM members WHERE id = ?').get(memberId)) });
  } catch (error) { next(error); }
});

app.post('/api/members/:id/payments', (req, res, next) => {
  try {
    const memberId = Number(req.params.id);
    const membershipId = Number(req.body.membershipId);
    const membership = db.prepare('SELECT * FROM memberships WHERE id = ? AND member_id = ?').get(membershipId, memberId);
    if (!membership) throw apiError('Membership not found.', 404);
    const amountMinor = toMinorUnits(req.body.amount);
    if (!amountMinor || amountMinor < 1) throw apiError('Enter a cash amount greater than zero.');
    const outstanding = Math.max(0, Number(membership.price_minor) - confirmedPaidMinor(membershipId));
    if (outstanding <= 0) throw apiError('This membership is already paid in full.');
    if (amountMinor > outstanding) throw apiError('Cash amount cannot be greater than the outstanding balance.');
    insertCashPayment({ memberId, membershipId, amountMinor, note: 'Cash received and confirmed by admin', createdBy: req.user.id });
    res.status(201).json({ payment: { amountMinor, method: 'cash', paidOn: localDateForTimezone() }, member: getMemberSummary(db.prepare('SELECT * FROM members WHERE id = ?').get(memberId)) });
  } catch (error) { next(error); }
});

app.get('/api/plans', (req, res) => {
  const plans = db.prepare(`
    SELECT p.*, (SELECT COUNT(*) FROM memberships s WHERE s.plan_id = p.id AND s.status = 'active' AND s.end_date >= ?) AS active_members
    FROM membership_plans p ORDER BY p.active DESC, p.sort_order ASC, p.id ASC
  `).all(localDateForTimezone()).map((plan) => ({
    id: plan.id,
    name: plan.name,
    durationValue: plan.duration_value,
    durationUnit: plan.duration_unit,
    priceMinor: Number(plan.price_minor),
    active: Boolean(plan.active),
    activeMembers: Number(plan.active_members),
    isDemo: Boolean(plan.is_demo),
  }));
  res.json({ plans });
});

app.post('/api/plans', (req, res, next) => {
  try {
    const name = requiredText(req.body.name, 'Plan name', 80);
    const durationValue = Number(req.body.durationValue);
    const durationUnit = req.body.durationUnit;
    if (!Number.isInteger(durationValue) || durationValue < 1 || durationValue > 120) throw apiError('Plan duration must be between 1 and 120.');
    if (!['months', 'days'].includes(durationUnit)) throw apiError('Choose months or days for the plan duration.');
    const priceMinor = toMinorUnits(req.body.price);
    if (priceMinor === null || priceMinor < 1) throw apiError('Plan price must be greater than zero.');
    const result = db.prepare(`
      INSERT INTO membership_plans (name, duration_value, duration_unit, price_minor, active, sort_order, created_at)
      VALUES (?, ?, ?, ?, 1, (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM membership_plans), ?)
    `).run(name, durationValue, durationUnit, priceMinor, nowIso());
    res.status(201).json({ id: Number(result.lastInsertRowid) });
  } catch (error) { next(error); }
});

app.patch('/api/plans/:id', (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const plan = db.prepare('SELECT * FROM membership_plans WHERE id = ?').get(id);
    if (!plan) throw apiError('Plan not found.', 404);
    if (req.body.active !== undefined) {
      if (typeof req.body.active !== 'boolean') throw apiError('Invalid plan status.');
      db.prepare('UPDATE membership_plans SET active = ? WHERE id = ?').run(req.body.active ? 1 : 0, id);
    } else {
      const name = req.body.name === undefined ? plan.name : requiredText(req.body.name, 'Plan name', 80);
      const durationValue = req.body.durationValue === undefined ? plan.duration_value : Number(req.body.durationValue);
      const durationUnit = req.body.durationUnit === undefined ? plan.duration_unit : req.body.durationUnit;
      const priceMinor = req.body.price === undefined ? Number(plan.price_minor) : toMinorUnits(req.body.price);
      if (!Number.isInteger(durationValue) || durationValue < 1 || durationValue > 120) throw apiError('Plan duration must be between 1 and 120.');
      if (!['months', 'days'].includes(durationUnit)) throw apiError('Choose months or days for the plan duration.');
      if (priceMinor === null || priceMinor < 1) throw apiError('Plan price must be greater than zero.');
      db.prepare('UPDATE membership_plans SET name = ?, duration_value = ?, duration_unit = ?, price_minor = ? WHERE id = ?')
        .run(name, durationValue, durationUnit, priceMinor, id);
    }
    res.json({ ok: true });
  } catch (error) { next(error); }
});

app.get('/api/payments', (req, res) => {
  const payments = db.prepare(`
    SELECT p.id, p.amount_minor, p.note, p.paid_at, p.paid_on, m.name AS member_name, s.plan_name
    FROM payments p JOIN members m ON m.id = p.member_id JOIN memberships s ON s.id = p.membership_id
    ORDER BY p.paid_at DESC, p.id DESC LIMIT 300
  `).all().map((payment) => ({ ...payment, amountMinor: Number(payment.amount_minor) }));
  const totalMinor = payments.reduce((sum, payment) => sum + payment.amountMinor, 0);
  res.json({ payments, totalMinor });
});

app.get('/api/reminders', (req, res) => {
  const reminders = db.prepare(`
    SELECT n.id, n.stage_days, n.recipient, n.status, n.attempt_count, n.next_attempt_at, n.last_error, n.created_at, n.sent_at,
      m.name AS member_name, s.plan_name, s.end_date
    FROM email_notifications n
      JOIN members m ON m.id = n.member_id
      JOIN memberships s ON s.id = n.membership_id
    ORDER BY n.created_at DESC, n.id DESC LIMIT 100
  `).all().map((item) => ({
    id: item.id,
    daysBefore: item.stage_days,
    recipient: item.recipient,
    status: item.status,
    attemptCount: item.attempt_count,
    nextAttemptAt: item.next_attempt_at,
    lastError: item.last_error,
    createdAt: item.created_at,
    sentAt: item.sent_at,
    memberName: item.member_name,
    planName: item.plan_name,
    endDate: item.end_date,
  }));
  res.json({ reminders, smtpConfigured: smtpConfigured() });
});

app.get('/api/campaigns/recipients', (req, res) => {
  const recipients = db.prepare(`
    SELECT id, name, email, phone FROM members
    WHERE marketing_opt_in = 1 AND email IS NOT NULL AND email <> ''
    ORDER BY name COLLATE NOCASE ASC
  `).all().map((member) => ({ id: member.id, name: member.name, email: member.email, phone: member.phone }));
  res.json({ recipients, smtpConfigured: smtpConfigured(), senderEmail: configuredSenderEmail() });
});

app.get('/api/campaigns', (req, res) => {
  const campaigns = db.prepare(`
    SELECT c.id, c.sender_name, c.sender_email, c.subject, c.status, c.created_at,
      (SELECT COUNT(*) FROM email_campaign_recipients r WHERE r.campaign_id = c.id) AS recipient_count,
      (SELECT COUNT(*) FROM email_campaign_recipients r WHERE r.campaign_id = c.id AND r.status = 'sent') AS sent_count,
      (SELECT COUNT(*) FROM email_campaign_recipients r WHERE r.campaign_id = c.id AND r.status = 'failed') AS failed_count,
      (SELECT COUNT(*) FROM email_campaign_recipients r WHERE r.campaign_id = c.id AND r.status = 'skipped') AS skipped_count,
      (SELECT COUNT(*) FROM email_campaign_recipients r WHERE r.campaign_id = c.id AND r.status = 'queued') AS queued_count
    FROM email_campaigns c ORDER BY c.created_at DESC, c.id DESC LIMIT 30
  `).all().map((campaign) => ({
    id: campaign.id,
    senderName: campaign.sender_name,
    senderEmail: campaign.sender_email,
    subject: campaign.subject,
    status: campaign.status,
    createdAt: campaign.created_at,
    recipientCount: Number(campaign.recipient_count),
    sentCount: Number(campaign.sent_count),
    failedCount: Number(campaign.failed_count),
    skippedCount: Number(campaign.skipped_count),
    queuedCount: Number(campaign.queued_count),
  }));
  res.json({ campaigns });
});

app.post('/api/campaigns/test', async (req, res, next) => {
  try {
    if (!smtpConfigured()) throw apiError('Email is not configured yet. Add your SMTP settings to the .env file first.', 400);
    const { senderName, senderEmail } = validateCampaignSender(req.body.senderName, req.body.senderEmail);
    const subject = requiredText(req.body.subject, 'Subject', 180);
    if (/[\r\n]/.test(subject)) throw apiError('Subject cannot contain line breaks.');
    const rawHtml = requiredText(req.body.htmlBody, 'Email body', 20_000);
    const htmlBody = sanitizeCampaignHtml(rawHtml);
    if (!htmlBody.trim()) throw apiError('The email body is empty after unsafe HTML was removed.');
    const transport = getTransporter();
    await transport.verify();
    const gymName = getSetting('gym_name', 'Your Gym');
    await transport.sendMail({
      from: { name: senderName, address: senderEmail },
      replyTo: senderEmail,
      to: req.user.email,
      subject: `[TEST] ${subject}`,
      text: `${campaignTextFromHtml(htmlBody)}\n\nThis was a test campaign from ${gymName}.`,
      html: `<!doctype html><html><body>${htmlBody}<hr><p style=\"font-family:Arial,sans-serif;font-size:12px;color:#6b7280\">Test email for ${escapeHtml(gymName)}. Only you received this test.</p></body></html>`,
    });
    res.json({ ok: true, sentTo: req.user.email });
  } catch (error) {
    if (error.status) return next(error);
    next(apiError(`Test email failed: ${String(error?.message || 'Unable to connect to SMTP').slice(0, 220)}`, 502));
  }
});

app.post('/api/campaigns/send', (req, res, next) => {
  try {
    if (!smtpConfigured()) throw apiError('Email is not configured yet. Add your SMTP settings to the .env file first.', 400);
    const { senderName, senderEmail } = validateCampaignSender(req.body.senderName, req.body.senderEmail);
    const subject = requiredText(req.body.subject, 'Subject', 180);
    if (/[\r\n]/.test(subject)) throw apiError('Subject cannot contain line breaks.');
    const rawHtml = requiredText(req.body.htmlBody, 'Email body', 20_000);
    const htmlBody = sanitizeCampaignHtml(rawHtml);
    if (!htmlBody.trim()) throw apiError('The email body is empty after unsafe HTML was removed.');
    const emails = parseRecipientList(req.body.recipientList);
    const placeholders = emails.map(() => '?').join(',');
    const optedIn = db.prepare(`
      SELECT id, email FROM members
      WHERE marketing_opt_in = 1 AND email IS NOT NULL AND lower(email) IN (${placeholders})
    `).all(...emails);
    const optedInByEmail = new Map(optedIn.map((member) => [member.email.toLowerCase(), member]));
    const notConsented = emails.filter((email) => !optedInByEmail.has(email));
    if (notConsented.length) throw apiError(`${notConsented.length} address(es) are not on a member record with promotional email consent. Only opted-in members can receive campaigns.`);

    const campaignId = transaction(() => {
      const inserted = db.prepare(`
        INSERT INTO email_campaigns (sender_name, sender_email, subject, html_body, status, created_at, created_by)
        VALUES (?, ?, ?, ?, 'queued', ?, ?)
      `).run(senderName, senderEmail, subject, htmlBody, nowIso(), req.user.id);
      const id = Number(inserted.lastInsertRowid);
      const addRecipient = db.prepare(`
        INSERT INTO email_campaign_recipients (campaign_id, member_id, recipient, status, created_at)
        VALUES (?, ?, ?, 'queued', ?)
      `);
      for (const email of emails) addRecipient.run(id, optedInByEmail.get(email).id, email, nowIso());
      return id;
    });
    void runCampaignQueue();
    res.status(202).json({ ok: true, campaignId, recipientCount: emails.length, status: 'queued' });
  } catch (error) { next(error); }
});

app.post('/api/email/test', async (req, res, next) => {
  try {
    if (!smtpConfigured()) throw apiError('Email is not configured yet. Add your SMTP settings to the .env file first.', 400);
    const transporter = getTransporter();
    await transporter.verify();
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: req.user.email,
      subject: `${getSetting('gym_name', 'Your Gym')} — test email`,
      text: 'Your gym dashboard email settings are working. Expiry reminders can now be delivered.',
      html: '<p>Your gym dashboard email settings are working. Expiry reminders can now be delivered.</p>',
    });
    res.json({ ok: true, sentTo: req.user.email });
  } catch (error) {
    if (error.status) return next(error);
    next(apiError(`Email test failed: ${String(error?.message || 'Unable to connect to SMTP').slice(0, 220)}`, 502));
  }
});

app.post('/api/demo-data', (req, res, next) => {
  try {
    if (Number(db.prepare('SELECT COUNT(*) AS count FROM members').get().count) > 0
      || Number(db.prepare('SELECT COUNT(*) AS count FROM membership_plans').get().count) > 0) {
      throw apiError('Demo data can only be loaded into an empty gym.');
    }
    const today = localDateForTimezone();
    const currency = getSetting('currency', 'TND');
    const demoPlans = [
      { name: 'Monthly access', duration_value: 1, duration_unit: 'months', amount: 65 },
      { name: 'Two-month pass', duration_value: 2, duration_unit: 'months', amount: 115 },
      { name: 'Quarterly access', duration_value: 3, duration_unit: 'months', amount: 160 },
    ];
    transaction(() => {
      const addPlan = db.prepare(`INSERT INTO membership_plans (name, duration_value, duration_unit, price_minor, active, sort_order, created_at, is_demo)
        VALUES (?, ?, ?, ?, 1, ?, ?, 1)`);
      const plans = demoPlans.map((plan, index) => ({ ...plan, id: Number(addPlan.run(plan.name, plan.duration_value, plan.duration_unit, toMinorUnits(plan.amount, currency), index, nowIso()).lastInsertRowid) }));
      const demoMembers = [
        { name: 'Alex Morgan', plan: 0, offset: 7, paid: true },
        { name: 'Jamie Rivera', plan: 1, offset: 4, paid: true },
        { name: 'Taylor Reed', plan: 0, offset: 18, paid: true },
        { name: 'Jordan Blake', plan: 2, offset: -5, paid: true },
        { name: 'Casey Parker', plan: 1, offset: 33, paid: false },
        { name: 'Riley Quinn', plan: 0, offset: 0, paid: true },
      ];
      const addMember = db.prepare(`INSERT INTO members (name, email, phone, notes, email_opt_in, created_at, created_on, is_demo)
        VALUES (?, ?, ?, '', 0, ?, ?, 1)`);
      for (let index = 0; index < demoMembers.length; index += 1) {
        const demoMember = demoMembers[index];
        const memberId = Number(addMember.run(demoMember.name, `demo${index + 1}@example.com`, '00000000', nowIso(), today).lastInsertRowid);
        const plan = plans[demoMember.plan];
        const endDate = addDays(today, demoMember.offset);
        const startDate = addDays(endDate, -(plan.duration_unit === 'months' ? plan.duration_value * 30 - 1 : plan.duration_value - 1));
        const membershipResult = db.prepare(`INSERT INTO memberships (member_id, plan_id, plan_name, duration_value, duration_unit, price_minor, start_date, end_date, status, created_at, is_demo)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, 1)`)
          .run(memberId, plan.id, plan.name, plan.duration_value, plan.duration_unit, toMinorUnits(plan.amount, currency), startDate, endDate, nowIso());
        if (demoMember.paid) {
          insertCashPayment({ memberId, membershipId: Number(membershipResult.lastInsertRowid), amountMinor: toMinorUnits(plan.amount, currency), note: 'DEMO — cash confirmed', isDemo: 1 });
        }
      }
    });
    res.status(201).json({ ok: true, demoData: true });
  } catch (error) { next(error); }
});

app.delete('/api/demo-data', (req, res, next) => {
  try {
    transaction(() => {
      db.prepare('DELETE FROM email_notifications WHERE membership_id IN (SELECT id FROM memberships WHERE is_demo = 1)').run();
      db.prepare('DELETE FROM payments WHERE is_demo = 1').run();
      db.prepare('DELETE FROM memberships WHERE is_demo = 1').run();
      db.prepare('DELETE FROM members WHERE is_demo = 1').run();
      db.prepare('DELETE FROM membership_plans WHERE is_demo = 1').run();
    });
    res.json({ ok: true });
  } catch (error) { next(error); }
});

app.get('/api/export/members.csv', (req, res) => {
  const headers = ['Name', 'Email', 'Phone', 'Member since', 'Plan', 'Start date', 'End date', 'Membership status', `Plan price (${getSetting('currency', 'TND')})`, `Paid (${getSetting('currency', 'TND')})`, `Balance due (${getSetting('currency', 'TND')})`, 'Email reminders agreed', 'Marketing emails agreed'];
  const rows = getMembersList('').map((member) => [
    member.name, member.email, member.phone, member.createdOn, member.membership?.planName || '',
    member.membership?.startDate || '', member.membership?.endDate || '', member.membership?.status || 'no-plan',
    member.membership ? fromMinorUnits(member.membership.priceMinor) : '',
    fromMinorUnits(member.paidMinor), fromMinorUnits(member.outstandingMinor), member.emailOptIn ? 'Yes' : 'No', member.marketingOptIn ? 'Yes' : 'No',
  ]);
  const csv = '\uFEFF' + [headers, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="gym-members-${localDateForTimezone()}.csv"`);
  res.send(csv);
});

app.get('/api/export/payments.csv', (req, res) => {
  const headers = ['Date', 'Paid at', 'Member', 'Membership plan', `Cash amount (${getSetting('currency', 'TND')})`, 'Method', 'Note'];
  const payments = db.prepare(`
    SELECT p.amount_minor, p.paid_at, p.paid_on, p.note, m.name AS member_name, s.plan_name
    FROM payments p JOIN members m ON m.id = p.member_id JOIN memberships s ON s.id = p.membership_id
    ORDER BY p.paid_at DESC, p.id DESC
  `).all();
  const rows = payments.map((payment) => [payment.paid_on, payment.paid_at, payment.member_name, payment.plan_name, fromMinorUnits(payment.amount_minor), 'Cash', payment.note]);
  const csv = '\uFEFF' + [headers, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="gym-cash-payments-${localDateForTimezone()}.csv"`);
  res.send(csv);
});

app.get('/api/backup', (req, res, next) => {
  const backupPath = path.join(path.dirname(DB_PATH), `.gym-backup-${process.pid}-${Date.now()}.sqlite`);
  const cleanUp = () => { try { fs.rmSync(backupPath, { force: true }); } catch {} };
  try {
    const quotedPath = backupPath.replaceAll("'", "''");
    db.exec(`VACUUM INTO '${quotedPath}'`);
    const stat = fs.statSync(backupPath);
    res.setHeader('Content-Type', 'application/vnd.sqlite3');
    res.setHeader('Content-Length', stat.size);
    res.setHeader('Content-Disposition', `attachment; filename=\"gymflow-backup-${localDateForTimezone()}.sqlite\"`);
    res.once('finish', cleanUp);
    res.once('close', cleanUp);
    const stream = fs.createReadStream(backupPath);
    stream.once('error', (error) => {
      cleanUp();
      if (!res.headersSent) next(error);
      else res.destroy(error);
    });
    stream.pipe(res);
  } catch (error) {
    cleanUp();
    next(error);
  }
});

app.use(express.static(PUBLIC_DIR, { extensions: ['html'] }));
app.use('/api', (req, res) => res.status(404).json({ error: 'API route not found.' }));
app.get('*path', (req, res) => res.sendFile(path.join(PUBLIC_DIR, 'index.html')));

app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  if (error instanceof SyntaxError && 'body' in error) return res.status(400).json({ error: 'Invalid JSON request.' });
  const status = Number.isInteger(error.status) ? error.status : 500;
  if (status >= 500) console.error('Request error:', error);
  res.status(status).json({ error: status >= 500 ? 'Something went wrong. Please try again.' : error.message });
});

const server = app.listen(PORT, HOST, () => {
  console.log(`Gym Dashboard listening on http://${HOST}:${PORT}`);
  console.log(`SQLite database: ${DB_PATH}`);
  if (!smtpConfigured()) console.log('SMTP is not configured: email reminders will remain queued until SMTP details are added to .env.');
  runReminderCycle();
  runCampaignQueue();
});

const reminderTimer = setInterval(runReminderCycle, 60_000);
const campaignTimer = setInterval(runCampaignQueue, 15_000);
const sessionCleanupTimer = setInterval(() => {
  db.prepare('DELETE FROM sessions WHERE expires_at <= ?').run(nowIso());
}, 60 * 60_000);

function shutdown() {
  clearInterval(reminderTimer);
  clearInterval(campaignTimer);
  clearInterval(sessionCleanupTimer);
  server.close(() => {
    db.close();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 5000).unref();
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
