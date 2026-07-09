# Society App

A residential society management app. Its core is visitor management: residents invite guests with an OTP, and a gate guard checks in five kinds of visitors (guest, cab/delivery, household help, maintenance/vendor, emergency), with resident approval and admin escalation for anyone who can't be auto-verified. Every check-in is written to an audit trail. Alongside that, every role can post/read a society Notice board, browse an event photo Gallery, and residents can raise Grievances that the admin tracks through to resolution.

This was built for you to learn from — the code favors clarity over cleverness. Start reading at `server/src/services/visitService.js`, it's the heart of the app.

## Running it

Requires Node.js (v18+).

```bash
npm run install:all   # installs server + client dependencies
npm run dev            # starts the API on :4000 and the web app on :5173
```

Open http://localhost:5173. A SQLite database file (`server/society.db`) is created automatically on first run, seeded with demo accounts.

### Demo logins (password: `password123`)

| Role     | Email             | Notes |
|----------|-------------------|-------|
| Resident | resident@demo.com | Flat A-101 |
| Guard    | guard@demo.com    | Gate check-in screen |
| Admin    | admin@demo.com    | Escalation queue, staff/vendor registries, audit trail |

New accounts can also be created via the Sign up page (residents must give a flat number).

## How the visitor flow works

1. **Resident invites a guest**: creates a name + one-time OTP, shown on their dashboard to share with the guest.
2. **Guard checks a visitor in** at `/guard`, picking one of five visitor types:
   - **Guest**: enters the OTP → instant entry if valid. No/invalid OTP → guard judges if the visitor is identifiable. Not identifiable → denied. Identifiable → sent to the resident for approval, with a 2-minute timer; no response auto-escalates to the admin queue.
   - **Cab/Delivery**: guard notes the order/ride code and marks it verified or not.
   - **Household help**: looked up by ID card number against the registered staff list and their shift hours.
   - **Maintenance/vendor**: matched against a scheduled service request for the day.
   - **Emergency services**: let in immediately; resident and admin are notified after the fact.
3. Every decision — arrival, ID check, resident/admin response, entry, denial, departure — is written to `audit_log` and viewable per-visit from the Admin dashboard's "Full audit trail".

## The other modules

- **Notices** (`/notices`): any logged-in role can post a title + body; everyone sees the full board, newest first.
- **Gallery** (`/gallery`): admin uploads event/festival photos (stored on disk under `server/uploads/`, served at `/uploads/<filename>`); every role can browse them.
- **Grievances**: from the Resident dashboard, pick a category (maintenance/security/noise/other) and describe the issue. It shows up on the Admin dashboard, where the admin moves it through open → in progress → resolved, optionally with a note the resident can see.

## Project layout

```
server/               Express API
  src/db.js            SQLite schema + demo seed data
  src/auth.js           JWT + role-check middleware
  src/services/visitService.js   All check-in/approval/escalation logic (start here)
  src/routes/           One file per resource (auth, invites, visits, staff, service-requests,
                         notices, grievances, gallery)
  uploads/               Gallery photo files (created automatically, not committed)

client/                React (Vite) frontend
  src/pages/resident/   Invite guests, approve/deny, visit history, raise grievances
  src/pages/guard/      Gate check-in screen for all 5 visitor types
  src/pages/admin/      Escalation queue, staff/vendor registries, audit trail, grievances
  src/pages/Notices.jsx  Shared notice board (all roles)
  src/pages/Gallery.jsx  Shared event photo gallery (all roles)
  src/context/AuthContext.jsx   Login/signup state, stored in localStorage
  src/api.js            Tiny fetch wrapper that attaches the JWT (plus a multipart upload helper)
```

## Notes on this version

- **No SMS/push**: OTPs and approval requests are in-app only (shown on screen / polled every 5 seconds). To add real SMS, you'd plug a provider (e.g. Twilio) into `invites.js` where the OTP is generated.
- **Anyone can sign up as any role** for demo simplicity. In a real deployment, guard/admin accounts would be provisioned by the society, not self-signup.
- **Gallery storage is local disk**, fine for a single-server demo. A production deployment would want cloud storage (S3 etc.) instead of `server/uploads/`.
