# Organizador PAI

Web app for a municipal Immediate Action Protocol (PAI). Operators upload complaint PDFs, the server extracts the fields, and supervisors approve or reject each case. Approved cases can be forwarded to the responsible area on WhatsApp, with a local audit trail.

This repository is a portfolio project. It runs on one machine with SQLite. It is not a hosted multi-user deployment.

## Stack

- Node.js and Express
- SQLite (`better-sqlite3`)
- PDF text extraction (`pdf-parse`)
- Optional WhatsApp delivery (`whatsapp-web.js`)

## Run locally

Requirements: Node.js 20+.

```bash
cp .env.example .env
```

Edit `.env` and set `SESSION_SECRET` plus the three account passwords. The placeholders in `.env.example` are rejected on purpose.

```bash
npm install
npm start
```

Open http://localhost:3000 and sign in with the usernames and passwords from your `.env`. On first launch the app creates those accounts and an example area. The database, uploaded PDFs, and WhatsApp session stay on disk and are gitignored.

## Configuration

| Variable | Purpose |
| --- | --- |
| `SESSION_SECRET` | Signs the session cookie. At least 16 characters. |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | Admin account, created if missing. |
| `OPERATOR_USERNAME` / `OPERATOR_PASSWORD` | Operator account, created if missing. |
| `SUPERVISOR_USERNAME` / `SUPERVISOR_PASSWORD` | Supervisor account, created if missing. |
| `PORT` | HTTP port. Defaults to 3000. |

Do not commit `.env`.

## WhatsApp

`whatsapp-web.js` is an unofficial client. Use a dedicated number. The first start prints a QR code in the terminal. The HTTP server still runs if WhatsApp is disconnected; sending a message then fails until a phone is linked.

`whatsapp-server/` is an optional Railway-style process for the same client. `whatsapp-server-greenapi/` calls GREEN-API instead and reads `GREEN_API_ID` and `GREEN_API_TOKEN` from the environment (see `whatsapp-server-greenapi/.env.example`). Neither service is required to run the main app.

## License

MIT

Maintainer: [CynarJulep](https://github.com/CynarJulep)
