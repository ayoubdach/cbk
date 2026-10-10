# CBK web projects

The existing CBK shop pages (`index.html` and `admin.html`) are unchanged.

A separate Gymflow full-stack gym-management app is in [`gym-app/`](gym-app/README.md). It uses a local SQLite database, supports member and membership management, admin-confirmed cash payments, expiry reminders by email, reports, CSV export and database backups.

## Quick start

```bash
cd gym-app
npm install
npm start
```

Open http://localhost:3000 and create the first owner account. See [`gym-app/README.md`](gym-app/README.md) for email setup, backups, Docker and deployment notes.
