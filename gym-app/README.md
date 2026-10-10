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
2. Open **Members → Add member**, select a plan and set the membership start date.
3. Leave **Cash has been received and confirmed** unticked until cash is actually in hand. You can record full or partial cash later from the member profile.
4. Use **Load sample data** on the empty dashboard if you want to explore the charts first. The sample records are fictional and can be removed in Settings.

Monthly plans use calendar months; the membership runs through the day before its next monthly anniversary. Day-based plans are also supported. Money is stored as integer minor units (including three decimal places for TND).

## Email reminders

The dashboard checks each minute for opted-in members whose active membership is approaching its end date. It queues an email at 7 days remaining and another at 4 days remaining. A member needs a valid email address and explicit email-reminder permission. A later renewal suppresses reminders for the earlier membership.

**Real email delivery needs SMTP credentials.** Without them, the app still works and shows the email queue, but it will not send email. To configure a provider:

1. Copy `.env.example` to `.env` in this folder.
2. Fill in the SMTP host, port, TLS setting, username, password/app password, and verified sender address.
3. Set `APP_URL` to the address members should see in reminder emails.
4. Restart the app and use **Settings → Send test email**.

Example configuration:

```dotenv
SMTP_HOST=smtp.your-provider.example
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-smtp-username
SMTP_PASS=your-smtp-password-or-app-password
SMTP_FROM="Your Gym <verified-sender@example.com>"
APP_URL=http://localhost:3000
```

The app never returns SMTP credentials to the browser. Do not commit `.env` or share it in chat. Check your email provider's free-tier limits and sender-verification requirements.

## Data, backups and exports

- Database file: `gym-app/data/gym.db`
- **Settings → Download database backup** creates a consistent SQLite backup.
- Members and cash-payment history can each be exported as CSV.
- Keep backups in a private location. A database backup contains member contact details and password hashes.

The SQLite file lives on the computer running the server; browsers connect to that server's API. For access from other devices on the same trusted Wi-Fi, use the host computer's LAN address and allow port 3000 only on that private network. The Node command binds to the LAN by default; Docker Compose binds to `127.0.0.1` for safer defaults—change its port mapping to `0.0.0.0:${PORT:-3000}:3000` only if you specifically need LAN access. Do not expose the development server directly to the public internet.

For an always-on VPS later, deploy behind HTTPS with a firewall and regular off-server backups. Configure `APP_URL` and `COOKIE_SECURE=true` when serving HTTPS. The same app and SQLite data can be moved to the VPS for a small single-gym setup; PostgreSQL is a sensible later upgrade if you need multiple servers or higher write concurrency.

## Current first-release scope

Included: owner login and password changes, members, configurable plans, monthly/day durations, membership history, expiry countdowns, expiring/expired views, manual cash-payment confirmation (including partial payments), cash collection summaries, email reminder queue and SMTP delivery, insights, CSV exports, SQLite backups, and fictional sample data.

Not included yet: WhatsApp, staff accounts, attendance/check-in, expenses and profit calculations, AI assistant, online payments, and member self-service. Those should be added after this workflow has been tested with real gym rules.
