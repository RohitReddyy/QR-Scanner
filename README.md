# InfraGard Saint Louis – Front Desk QR Scanner (Demo)

A front-desk QR code scanning demo application for InfraGard Saint Louis events.
Front-desk staff log in on their mobile device and use the camera to scan attendee QR codes.

---

## Features

| Feature | Description |
|---|---|
| **Login** | Session-based auth for front-desk users only |
| **Scan QR** | Mobile camera scanning via jsQR (no native app needed) |
| **Manual Entry** | Add attendees with auto-generated professional codes |
| **QR Preview** | QR image generated client-side after manual entry |
| **Logs** | Full scan history table with search and CSV export |
| **Responsive** | Desktop and mobile layouts with different scan behavior |

---

## Tech Stack

- **Backend**: Node.js + Express
- **Database**: MongoDB + Mongoose
- **Auth**: express-session + connect-mongo
- **Security**: helmet, bcryptjs
- **Frontend**: Plain HTML + CSS + Vanilla JS
- **QR Scanning**: [jsQR](https://github.com/cozmo/jsQR)
- **QR Generation**: [QRCode.js](https://github.com/davidshimjs/qrcodejs)

---

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- [MongoDB](https://www.mongodb.com/try/download/community) running locally (default: `mongodb://localhost:27017`)

---

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` if needed. Defaults work for local development:

```
MONGODB_URI=mongodb://localhost:27017/infragard_qr_demo
SESSION_SECRET=change_this_to_a_long_random_string
PORT=3000
NODE_ENV=development
```

### 3. Seed the database

This creates the demo front-desk user and 8 sample attendees:

```bash
npm run seed
```

### 4. Start the server

```bash
npm run dev      # development (auto-restarts with nodemon)
# or
npm start        # production
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Demo Credentials

| Field | Value |
|---|---|
| Email | `frontdesk@infragardstl.org` |
| Password | `Demo@123` |

---

## Sample Attendee Codes (for testing)

Scan or manually enter one of these codes to test a successful scan:

```
INFRA-1001  →  John Doe
INFRA-1002  →  Jane Smith
INFRA-1003  →  Robert Johnson
INFRA-1004  →  Emily Davis
INFRA-1005  →  Michael Brown
INFRA-1006  →  Sarah Wilson
INFRA-1007  →  David Martinez
INFRA-1008  →  Ashley Anderson
```

To test a **failed** scan, scan any QR code that contains a code not in the above list.

---

## Project Structure

```
QR Scanner Project/
├── server/
│   ├── app.js                  # Express app setup
│   ├── server.js               # HTTP server entry point
│   ├── config/
│   │   └── db.js               # MongoDB connection
│   ├── models/
│   │   ├── FrontdeskUser.js
│   │   ├── Attendee.js
│   │   └── ScanLog.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── scan.js
│   │   ├── logs.js
│   │   └── attendees.js
│   ├── middleware/
│   │   └── auth.js             # requireAuth middleware
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── scanController.js
│   │   ├── logsController.js
│   │   └── attendeesController.js
│   └── scripts/
│       └── seed.js             # Database seeder
├── public/
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   ├── login.js
│   │   ├── dashboard.js
│   │   ├── logs.js
│   │   └── manual-entry.js
│   ├── images/                 # Place infragard-logo.png here
│   ├── login.html
│   ├── dashboard.html
│   ├── logs.html
│   └── manual-entry.html
├── .env.example
├── package.json
└── README.md
```

---

## API Endpoints

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/login` | No | Log in with email + password |
| POST | `/api/auth/logout` | No | Destroy session |
| GET | `/api/auth/me` | No | Get current session user |
| POST | `/api/scan` | Yes | Process a scanned QR code |
| GET | `/api/logs` | Yes | Get all scan logs (newest first) |
| POST | `/api/attendees/manual-entry` | Yes | Add a new attendee |
| GET | `/api/attendees` | Yes | List all attendees (debug) |

Query param for logs: `GET /api/logs?search=<term>`

---

## Scanning on Mobile

1. Open the app on a mobile browser (Chrome, Safari, Firefox)
2. Log in as the front-desk user
3. Tap the **scan icon** or **Scan QR Code** button
4. Allow camera permissions when prompted
5. Point the camera at a QR code containing one of the INFRA-XXXX codes
6. Result toast appears; tap **Scan Again** to scan another

> The scan button is intentionally **disabled on desktop** with a tooltip explaining to use mobile.

---

## Adding Your Logo

Place a file named `infragard-logo.png` inside `public/images/` — it will automatically appear on the login page.

---

## NPM Scripts

| Script | Command | Description |
|---|---|---|
| `npm start` | `node server/server.js` | Start production server |
| `npm run dev` | `nodemon server/server.js` | Start dev server with auto-restart |
| `npm run seed` | `node server/scripts/seed.js` | Seed demo data into MongoDB |
