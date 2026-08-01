# Smart Gate Controller Architecture

## Overview
This project is a local-first smart gate controller: a Vue web dashboard talks to an
Express backend, which in turn coordinates with ESP32-based firmware that drives the
physical gate motor. The system is designed to run entirely on a local network, with
the backend as the single source of truth for gate state, users, and activity logs.

## Repository structure
- `backend/` — Express REST API: authentication, gate control, activity logs, and the
  polling endpoints the firmware uses
- `web/` — Vue 3 web dashboard for login and gate control
- `firmware/` — PlatformIO project for the ESP32 (Arduino Nano ESP32) that drives the
  gate motor and reports its position back to the backend
- `docs/` — architecture, API, and hardware documentation

## Components

### Backend (`backend/`)
Express app (CommonJS). Sessions, logs, and gate state are persisted in SQLite
(`backend/models/db.js`, via `better-sqlite3`); only the pending command queue stays
in memory:
- **Auth** — two seeded users (`owner`/`guest` roles) recreated from env vars on every
  boot (not stored in the DB), passwords hashed with bcrypt. Session tokens are issued
  on login and required as a Bearer token on protected routes; the `sessions` table
  enforces at most one active session per user (`UNIQUE(user_id)` + `INSERT OR
  REPLACE`), so logging in again as the same user invalidates that user's previous
  token without affecting other users' sessions
- **Gate control** — a `gate_state` row (`status`, `updated_at`) representing the last
  *known real* position of the gate, plus a single-slot in-memory pending command queue
  that the firmware polls and consumes (not persisted — a restart just means the next
  button click re-queues it)
- **Logs** — a capped activity log (logins, control requests, device reports) stored in
  SQLite, `GET /api/logs` returns the most recent 100

The SQLite file lives on a Railway Volume in production, so sessions/logs/gate state
survive backend restarts and redeploys — see `docs/api.md` for the exact endpoint
contracts and `firmware/README.md` for how the firmware integrates with them.

### Web dashboard (`web/`)
Vue 3 + Vite + Vue Router + Pinia, talking to the backend over `fetch`. Two views:
a login screen and a dashboard showing gate status, open/close/toggle controls, and
recent activity, polling the backend every 5 seconds to stay in sync with the real
gate position.

### Firmware (`firmware/`)
PlatformIO project targeting the Arduino Nano ESP32 (ESP32-S3), split into single
responsibility modules (WiFi connection, backend HTTP client, motor driver, and the
gate's state machine). It polls the backend for pending open/close commands, drives
the motor through a BTS7960 motor driver, and reports the real position back once a reed
switch confirms the gate reached its limit. Full detail in `firmware/README.md`.

## Communication flow
1. A logged-in user clicks Open/Close/Toggle on the web dashboard →
   `POST /api/control` on the backend, which queues a pending command (it does not
   move anything itself).
2. The firmware polls `GET /api/esp32/command` on an interval; when a command is
   waiting, it drives the motor in that direction.
3. The firmware watches the relevant reed switch and, once triggered, stops the motor
   and calls `POST /api/esp32/report` with the real position.
4. The web dashboard's periodic `GET /api/status` poll picks up the updated position
   and reflects it in the UI.

This means gate status changes are asynchronous: clicking a button queues a request,
but the dashboard only shows the new status once the firmware confirms the physical
move completed.

## Current limitations
- The pending command queue is in-memory and is lost on restart (harmless — the user
  just re-clicks the button); everything else (sessions, logs, gate state) persists in
  SQLite across restarts
- `POST /api/esp32/report` and `GET /api/esp32/command` are not authenticated — any
  device reachable on the network can report a status or is expected to poll commands
- If the firmware's safety cutoff fires before a reed switch triggers, the gate's real
  position becomes unknown until the next successful move; no separate "unknown" state
  exists in the backend today
