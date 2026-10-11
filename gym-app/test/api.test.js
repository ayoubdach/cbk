import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

const APP_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

async function findFreePort() {
  const probe = net.createServer();
  await new Promise((resolve, reject) => {
    probe.once('error', reject);
    probe.listen(0, '127.0.0.1', resolve);
  });
  const port = probe.address().port;
  await new Promise((resolve) => probe.close(resolve));
  return port;
}

async function waitForHealth(baseUrl, child) {
  const deadline = Date.now() + 10_000;
  let lastError;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`Test server exited early (code ${child.exitCode}).`);
    try {
      const response = await fetch(`${baseUrl}/api/health`);
      if (response.ok) return;
    } catch (error) { lastError = error; }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Test server did not become ready: ${lastError?.message || 'timeout'}`);
}

async function startSmtpSink() {
  const messages = [];
  const server = net.createServer((socket) => {
    socket.setEncoding('utf8');
    socket.write('220 gymflow-test ESMTP ready\r\n');
    let buffer = '';
    let dataLines = '';
    let inData = false;
    socket.on('data', (chunk) => {
      buffer += chunk;
      while (true) {
        if (inData) {
          const terminator = buffer.indexOf('\r\n.\r\n');
          if (terminator < 0) break;
          dataLines += buffer.slice(0, terminator);
          messages.push(dataLines);
          buffer = buffer.slice(terminator + 5);
          dataLines = '';
          inData = false;
          socket.write('250 2.0.0 message accepted\r\n');
          continue;
        }
        const lineEnd = buffer.indexOf('\r\n');
        if (lineEnd < 0) break;
        const line = buffer.slice(0, lineEnd);
        buffer = buffer.slice(lineEnd + 2);
        if (/^(EHLO|HELO)\b/i.test(line)) socket.write('250-gymflow-test\r\n250-PIPELINING\r\n250-SIZE 10485760\r\n250-8BITMIME\r\n250 SMTPUTF8\r\n');
        else if (/^MAIL FROM:/i.test(line) || /^RCPT TO:/i.test(line)) socket.write('250 2.1.0 ok\r\n');
        else if (/^DATA$/i.test(line)) { inData = true; socket.write('354 end with <CRLF>.<CRLF>\r\n'); }
        else if (/^RSET$/i.test(line) || /^NOOP$/i.test(line)) socket.write('250 2.0.0 ok\r\n');
        else if (/^QUIT$/i.test(line)) { socket.write('221 2.0.0 goodbye\r\n'); socket.end(); }
        else if (/^STARTTLS$/i.test(line)) socket.write('502 5.5.1 TLS is not available in the test sink\r\n');
        else socket.write('250 2.0.0 ok\r\n');
      }
    });
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  return { server, messages, port: server.address().port };
}

test('local SQLite gym dashboard: setup, member, cash, exports and backup', async (t) => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gymflow-test-'));
  const port = await findFreePort();
  const smtpSink = await startSmtpSink();
  const databasePath = path.join(tempDir, 'test-gym.db');
  const baseUrl = `http://127.0.0.1:${port}`;
  const child = spawn(process.execPath, ['--disable-warning=ExperimentalWarning', 'server.js'], {
    cwd: APP_DIR,
    env: {
      ...process.env, PORT: String(port), HOST: '127.0.0.1', DATABASE_PATH: databasePath, GYM_TIMEZONE: 'UTC',
      SMTP_HOST: '127.0.0.1', SMTP_PORT: String(smtpSink.port), SMTP_SECURE: 'false', SMTP_FROM: 'Test Gym <owner@example.test>',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let logs = '';
  child.stdout.on('data', (chunk) => { logs += chunk.toString(); });
  child.stderr.on('data', (chunk) => { logs += chunk.toString(); });
  let cookie = '';
  t.after(async () => {
    if (child.exitCode === null) {
      child.kill('SIGTERM');
      await Promise.race([once(child, 'exit'), new Promise((resolve) => setTimeout(resolve, 4_000))]);
    }
    await new Promise((resolve) => smtpSink.server.close(resolve));
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  await waitForHealth(baseUrl, child).catch((error) => { throw new Error(`${error.message}\n${logs}`); });

  async function request(route, { method = 'GET', body, authenticated = true } = {}) {
    const headers = {};
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (authenticated && cookie) headers.Cookie = cookie;
    const response = await fetch(`${baseUrl}${route}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const setCookie = response.headers.get('set-cookie');
    if (setCookie) cookie = setCookie.split(';')[0];
    const contentType = response.headers.get('content-type') || '';
    const payload = contentType.includes('application/json') ? await response.json() : await response.text();
    return { response, payload };
  }

  const setupState = await request('/api/setup-status', { authenticated: false });
  assert.equal(setupState.payload.setupRequired, true);

  const setup = await request('/api/setup', {
    method: 'POST', authenticated: false,
    body: { name: 'Test Owner', email: 'owner@example.test', password: 'a-strong-test-password', gymName: 'Test Gym', currency: 'TND', timezone: 'UTC' },
  });
  assert.equal(setup.response.status, 201);
  assert.equal(setup.payload.user.role, 'owner');
  assert.ok(cookie.startsWith('gym_session='));

  const blockedSetup = await request('/api/setup', {
    method: 'POST', authenticated: false,
    body: { name: 'Another Owner', email: 'other@example.test', password: 'another-password-123', gymName: 'Other Gym', currency: 'EUR', timezone: 'UTC' },
  });
  assert.equal(blockedSetup.response.status, 409);

  const unauthorized = await request('/api/members', { authenticated: false });
  assert.equal(unauthorized.response.status, 401);
  const roleDb = new DatabaseSync(databasePath);
  roleDb.prepare("UPDATE app_users SET role = 'staff' WHERE email = ?").run('owner@example.test');
  const nonOwnerAccess = await request('/api/config');
  assert.equal(nonOwnerAccess.response.status, 403);
  roleDb.prepare("UPDATE app_users SET role = 'owner' WHERE email = ?").run('owner@example.test');
  roleDb.close();

  const demoLoad = await request('/api/demo-data', { method: 'POST', body: {} });
  assert.equal(demoLoad.response.status, 201);
  const demoMembers = await request('/api/members');
  assert.equal(demoMembers.payload.members.length, 6);
  assert.equal(demoMembers.payload.members.every((member) => member.isDemo), true);
  const demoClear = await request('/api/demo-data', { method: 'DELETE' });
  assert.equal(demoClear.response.status, 200);
  assert.equal((await request('/api/members')).payload.members.length, 0);

  const planResult = await request('/api/plans', {
    method: 'POST',
    body: { name: 'Monthly access', durationValue: 1, durationUnit: 'months', price: '80.000' },
  });
  assert.equal(planResult.response.status, 201);
  const planId = planResult.payload.id;
  const missingPhone = await request('/api/members', {
    method: 'POST', body: { name: 'Needs a phone', email: 'needs-phone@example.test', planId, startDate: '2026-10-11', price: '80.000' },
  });
  assert.equal(missingPhone.response.status, 400);
  assert.match(missingPhone.payload.error, /phone number is required/i);
  const missingEmail = await request('/api/members', {
    method: 'POST', body: { name: 'Needs an email', phone: '+216 22 222 222', planId, startDate: '2026-10-11', price: '80.000' },
  });
  assert.equal(missingEmail.response.status, 400);
  assert.match(missingEmail.payload.error, /email is required/i);

  const memberResult = await request('/api/members', {
    method: 'POST',
    body: {
      name: 'Alex Example', email: 'alex@example.test', phone: '+216 00 000 000', emailOptIn: true, marketingOptIn: true,
      planId, startDate: '2026-10-11', price: '80.000', confirmCash: false,
    },
  });
  assert.equal(memberResult.response.status, 201);
  assert.equal(memberResult.payload.member.membership.endDate, '2026-11-10');
  assert.equal(memberResult.payload.member.paymentState, 'due');
  assert.equal(memberResult.payload.member.outstandingMinor, 80_000);

  const partialPayment = await request(`/api/members/${memberResult.payload.member.id}/payments`, {
    method: 'POST', body: { membershipId: memberResult.payload.member.membership.id, amount: '25.000' },
  });
  assert.equal(partialPayment.response.status, 201);
  assert.equal(partialPayment.payload.member.paymentState, 'partial');
  assert.equal(partialPayment.payload.member.outstandingMinor, 55_000);

  const settings = await request('/api/settings', {
    method: 'PATCH', body: { gymName: 'Test Gym', currency: 'EUR', timezone: 'UTC' },
  });
  assert.equal(settings.response.status, 400);
  const csrfAttempt = await fetch(`${baseUrl}/api/settings`, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json', Cookie: cookie, Origin: 'https://attacker.example' },
    body: JSON.stringify({ gymName: 'Attacker Gym', timezone: 'UTC' }),
  });
  assert.equal(csrfAttempt.status, 403);

  const wrongPasswordChange = await request('/api/account/password', {
    method: 'POST', body: { currentPassword: 'wrong-current-password', newPassword: 'a-new-strong-password' },
  });
  assert.equal(wrongPasswordChange.response.status, 403);
  const passwordChange = await request('/api/account/password', {
    method: 'POST', body: { currentPassword: 'a-strong-test-password', newPassword: 'a-new-strong-password' },
  });
  assert.equal(passwordChange.response.status, 200);
  const oldPasswordLogin = await request('/api/login', {
    method: 'POST', authenticated: false, body: { email: 'owner@example.test', password: 'a-strong-test-password' },
  });
  assert.equal(oldPasswordLogin.response.status, 401);
  const newPasswordLogin = await request('/api/login', {
    method: 'POST', authenticated: false, body: { email: 'owner@example.test', password: 'a-new-strong-password' },
  });
  assert.equal(newPasswordLogin.response.status, 200);

  const exportResult = await request('/api/export/members.csv');
  assert.equal(exportResult.response.status, 200);
  assert.match(exportResult.response.headers.get('content-type'), /text\/csv/);
  assert.match(exportResult.payload, /Alex Example/);
  assert.match(exportResult.payload, /Marketing emails agreed/);
  assert.match(exportResult.payload, /alex@example\.test/);

  const backupResponse = await fetch(`${baseUrl}/api/backup`, { headers: { Cookie: cookie } });
  assert.equal(backupResponse.status, 200);
  const backupPath = path.join(tempDir, 'downloaded-backup.sqlite');
  fs.writeFileSync(backupPath, Buffer.from(await backupResponse.arrayBuffer()));
  const backupDb = new DatabaseSync(backupPath, { readOnly: true });
  assert.equal(backupDb.prepare('SELECT COUNT(*) AS count FROM members').get().count, 1);
  backupDb.close();

  const nonConsentingMember = await request('/api/members', {
    method: 'POST',
    body: {
      name: 'Sam Example', email: 'sam@example.test', phone: '+216 11 111 111', emailOptIn: false, marketingOptIn: false,
      planId, startDate: '2026-10-11', price: '80.000', confirmCash: false,
    },
  });
  assert.equal(nonConsentingMember.response.status, 201);

  const recipients = await request('/api/campaigns/recipients');
  assert.deepEqual(recipients.payload.recipients.map((member) => member.email), ['alex@example.test']);
  assert.equal(recipients.payload.smtpConfigured, true);
  assert.equal((await request('/api/config')).payload.marketingRecipientCount, 1);

  const campaignPayload = {
    senderName: 'Test Gym', senderEmail: 'owner@example.test', subject: 'Member offer',
    htmlBody: '<h1>Special offer</h1><p>Thank you for training with us.</p>',
  };
  const rejectedCampaign = await request('/api/campaigns/send', {
    method: 'POST', body: { ...campaignPayload, recipientList: 'alex@example.test, sam@example.test' },
  });
  assert.equal(rejectedCampaign.response.status, 400);
  assert.match(rejectedCampaign.payload.error, /Only opted-in members/);
  assert.equal((await request('/api/campaigns')).payload.campaigns.length, 0);

  const testEmail = await request('/api/campaigns/test', {
    method: 'POST', body: { ...campaignPayload, htmlBody: '<h1>Safe test</h1><script>alert(1)</script>' },
  });
  assert.equal(testEmail.response.status, 200);
  assert.equal(testEmail.payload.sentTo, 'owner@example.test');
  assert.match(smtpSink.messages.at(-1), /To: owner@example\.test/i);
  assert.doesNotMatch(smtpSink.messages.at(-1), /<script/i);

  const queuedCampaign = await request('/api/campaigns/send', {
    method: 'POST', body: { ...campaignPayload, recipientList: 'alex@example.test' },
  });
  assert.equal(queuedCampaign.response.status, 202);
  assert.equal(queuedCampaign.payload.recipientCount, 1);
  let deliveredCampaign;
  const deliveryDeadline = Date.now() + 5_000;
  while (Date.now() < deliveryDeadline) {
    deliveredCampaign = (await request('/api/campaigns')).payload.campaigns[0];
    if (deliveredCampaign?.status === 'sent') break;
    await new Promise((resolve) => setTimeout(resolve, 40));
  }
  assert.equal(deliveredCampaign?.status, 'sent');
  assert.equal(deliveredCampaign?.sentCount, 1);
  assert.match(smtpSink.messages.at(-1), /To: alex@example\.test/i);
  assert.match(smtpSink.messages.at(-1), /Member offer/);

  const removedConsent = await request(`/api/members/${memberResult.payload.member.id}`, {
    method: 'PATCH', body: {
      name: 'Alex Example', email: 'alex@example.test', phone: '+216 00 000 000', emailOptIn: true, marketingOptIn: false,
    },
  });
  assert.equal(removedConsent.response.status, 200);
  assert.equal(removedConsent.payload.member.marketingOptIn, false);
  assert.deepEqual((await request('/api/campaigns/recipients')).payload.recipients, []);
});
