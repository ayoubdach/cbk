# Gymflow — Gym Owner Dashboard

A local-first, full-stack gym membership dashboard. It uses **SQLite** for free local storage and **Node.js** for the API and scheduled email reminders. This is a separate app: the existing CBK shop pages in the repository root have not been changed.

## Requirements

- Node.js **22.5 or newer** (Node 22 includes the built-in SQLite module)
- npm

No paid database account or external frontend build service is needed. Run `npm test` to execute the local API and SQLite smoke test.

## Start testing locally

From a terminal in this folder:

```bash
cd gym-app
npm install
npm start
```

Open **http://localhost:3000**. On first launch, create the owner account. The app creates `data/gym.db` automatically. Choose your gym name, currency and timezone during setup (the initial currency is TND).

### Optional: run with Docker

If Docker Compose is installed, the same app can be run in a container with the SQLite file persisted in `gym-app/data/`:

```bash
cd gym-app
cp .env.example .env
# Edit .env if you want to set email delivery or a different timezone.
docker compose up --build
```

Then open **http://localhost:3000**. To stop it, press `Ctrl+C` or run `docker compose down`. The database remains in `data/`.

After signing in:

1. Open **Settings → Membership plans** and add your real plan names, durations and prices.
2. Open **Members → Add member** and enter the member's full name, phone number and email. Choose the membership plan and start date; the countdown and dashboard statistics update automatically from these records.
3. Record the member's permissions separately: expiry reminders and promotional emails are independent opt-ins. Leave both unchecked unless the member has agreed.
4. Leave **Cash has been received and confirmed** unticked until cash is actually in hand. You can record full or partial cash later from the member profile.
5. Use **Load sample data** on the empty dashboard if you want to explore the charts first. The sample records are fictional and can be removed in Settings.

Monthly plans use calendar months; the membership runs through the day before its next monthly anniversary. Day-based plans are also supported. Money is stored as integer minor units (including three decimal places for TND).

## Email reminders

The dashboard checks each minute for opted-in members whose active membership is approaching its end date. It queues an email at 7 days remaining and another at 4 days remaining. A member needs a valid email address and explicit email-reminder permission. A later renewal suppresses reminders for the earlier membership.

**Real email delivery needs SMTP credentials.** Without them, the app still works and shows the email queue, but it will not send email. To configure a provider:

1. Copy `.env.example` to `.env` in this folder.
2. Fill in the SMTP host, port, TLS setting, username, password/app password, and a sender address verified with your provider.
3. Set `APP_URL` to the address members should see in reminder emails.
4. Restart the app and use **Settings → Send test email**. The test goes only to the signed-in owner.
5. Open **Email campaigns** to compose an HTML-supported promotion, preview it, and send a test to the owner inbox before queuing the actual campaign.

Example configuration:

```dotenv
SMTP_HOST=smtp.your-provider.example
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-smtp-username
SMTP_PASS=your-smtp-password-or-app-password
SMTP_FROM="Your Gym <verified-sender@example.com>"
APP_URL=http://localhost:3000

# Optional AI assistant (OpenAI-compatible chat-completions API)
AI_API_KEY=your-provider-api-key
AI_MODEL=gpt-4o-mini
AI_API_BASE_URL=https://api.openai.com/v1
```

### Promotional campaign safeguards

- Campaign recipients are selected from saved member records with a separate **promotional email permission**. Current and former members remain eligible while their record, email address and consent remain; membership expiry alone does not remove them. A reminder opt-in does not allow marketing, and the owner cannot add an arbitrary/non-consenting address to a send.
- Consent and the email address are checked again immediately before each queued send. If either changes, that recipient is skipped.
- Campaign sender email must exactly match the address in `SMTP_FROM`; that address should be verified by your SMTP provider. Test campaigns go only to the owner account.
- HTML is sanitized before delivery. Campaigns are queued and sent in small batches; transient SMTP failures are retried up to three attempts. Add a visible opt-out link/instructions appropriate to your local rules if your provider or jurisdiction requires one; members can also reply to the sender and the owner should remove promotional permission in the member profile.
- SMTP credentials stay server-side. Do not commit `.env` or share it in chat. Check your email provider's free-tier limits and sender-verification requirements before using real member addresses.

## Floating AI assistant (optional)

Gymflow includes a closable messenger-style assistant for platform help, general questions and gym-specific membership/analytics questions. To turn it on, add `AI_API_KEY` to the server's `.env`, optionally set `AI_MODEL` and `AI_API_BASE_URL`, then restart the app. The default model is `gpt-4o-mini` and the default base URL is `https://api.openai.com/v1`. The endpoint must support the OpenAI-compatible `POST /chat/completions` API. Docker Compose also passes these three variables through to the container.

The key remains server-side; it is never returned by `/api/config` or sent from browser code. Chat history is kept in the current browser session only and is not written to the Gymflow database. For gym-specific answers, the provider receives a limited snapshot of dashboard totals, plan information, recent cash payments and up to 250 matching member records. Member names, membership dates/status and payment/balance values may be included when relevant; member email addresses, phone numbers and private notes are excluded. Use an AI provider whose data-handling terms are appropriate for your gym, and verify important answers in the dashboard.

Without AI configuration, the floating widget explains that setup is needed and the rest of Gymflow continues to work normally.

## Data, backups and exports

- Database file: `gym-app/data/gym.db`
- **Settings → Download database backup** creates a consistent SQLite backup.
- Members and cash-payment history can each be exported as CSV.
- Keep backups in a private location. A database backup contains member contact details and password hashes.

The SQLite file lives on the computer running the server; browsers connect to that server's API. For access from other devices on the same trusted Wi-Fi, use the host computer's LAN address and allow port 3000 only on that private network. The Node command binds to the LAN by default; Docker Compose binds to `127.0.0.1` for safer defaults—change its port mapping to `0.0.0.0:${PORT:-3000}:3000` only if you specifically need LAN access. Do not expose the development server directly to the public internet.

For an always-on VPS later, deploy behind HTTPS with a firewall and regular off-server backups. Configure `APP_URL` and `COOKIE_SECURE=true` when serving HTTPS. The same app and SQLite data can be moved to the VPS for a small single-gym setup; PostgreSQL is a sensible later upgrade if you need multiple servers or higher write concurrency.

## Current first-release scope

Included: owner-only login and password changes, members with required name/phone/email, configurable plans and durations, membership history and expiry countdowns, separate reminder and marketing consent, manual cash-payment confirmation (including partial payments), cash collection summaries, reminder and promotional email queues, HTML campaign preview/test sending with SMTP safeguards, a floating AI assistant (optional separately configured model/API), insights, CSV exports, SQLite backups, and fictional sample data.

Not included yet: WhatsApp, staff accounts, attendance/check-in, expenses and profit calculations, online payments, and member self-service.
