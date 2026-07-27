# Backend API

Base URL: `http://<backend-host>:3000/api` (port from `PORT` env var, default `3000`).
All request/response bodies are JSON.

## Authentication

Two users are seeded from environment variables at startup (see `backend/.env.example`):

| Username | Role  |
|----------|-------|
| `admin`  | owner |
| `family` | guest |

Passwords are hashed with bcrypt; there is no functional difference between `owner`
and `guest` today — both roles have identical permissions.

Login returns an opaque session token that must be sent as `Authorization: Bearer <token>`
on every protected endpoint below. Sessions are held in memory only, so they are all
invalidated when the backend process restarts. They also expire on their own after
`SESSION_TTL` (default `24h`, format like `20s`/`30m`/`24h`, see `backend/.env.example`) — a request with an
expired token gets `401 { "message": "Unauthorized" }`, same as an invalid one, and
the client must log in again.

### `POST /api/login`
No auth required.

Request:
```json
{ "username": "admin", "password": "admin123" }
```

Response `200`:
```json
{ "token": "3fc8af96-54f5-4d30-b18b-830b2bbefef6", "user": { "username": "admin", "role": "owner" } }
```

Response `401` (wrong username or password):
```json
{ "message": "Invalid credentials" }
```

### `POST /api/logout`
Requires `Authorization: Bearer <token>`.

Response `200`:
```json
{ "message": "Logged out" }
```

## Gate status and control

The backend's `gateState` (`status`: `"open"` | `"closed"`, `updatedAt`) reflects the
**last known real position**, as reported by the firmware — not necessarily the most
recent user request. See "ESP32 polling workflow" below for why these are decoupled.

### `GET /api/status`
Requires `Authorization: Bearer <token>`.

Response `200`:
```json
{ "gate": { "status": "closed", "updatedAt": "2026-07-26T13:51:40.170Z" } }
```

### `POST /api/control`
Requires `Authorization: Bearer <token>`.

Request:
```json
{ "action": "open" }
```
`action` must be one of `"open"`, `"close"`, `"toggle"`. `"toggle"` is resolved to a
concrete `"open"`/`"close"` direction server-side, based on the current `gateState.status`,
before being queued.

Response `200` — **note this returns the pre-move status**, not the result of the
requested action; the request only queues a command for the firmware to pick up:
```json
{ "gate": { "status": "closed", "updatedAt": "2026-07-26T13:51:40.170Z" } }
```

Response `400` (invalid action):
```json
{ "message": "Invalid action" }
```

### `GET /api/logs`
Requires `Authorization: Bearer <token>`.

Response `200` — newest first, capped at 100 entries:
```json
{
  "logs": [
    { "id": "1fa6241b-...", "timestamp": "2026-07-26T13:52:42.490Z", "type": "control", "user": "admin", "message": "Gate open requested" },
    { "id": "76828f84-...", "timestamp": "2026-07-26T13:52:42.309Z", "type": "login", "user": "admin", "message": "User logged in" }
  ]
}
```
`type` is one of `"login"`, `"logout"`, `"control"`, or `"device"` (device = a report
from the ESP32).

## ESP32 device endpoints

These two endpoints have **no authentication** — any device that can reach the
backend can call them. This is a known, accepted limitation (see `docs/architecture.md`).

### `GET /api/esp32/command`
Polled by the firmware. Returns and clears the single pending command in one call
(delivered at most once).

Response `200` — a command is waiting:
```json
{ "command": { "action": "open", "requestedAt": "2026-07-26T13:52:22.749Z" } }
```

Response `200` — nothing pending:
```json
{ "command": null }
```

### `POST /api/esp32/report`
Called by the firmware once a reed switch confirms the gate reached a limit. This is
the **only** way `gateState.status` actually changes.

Request:
```json
{ "status": "open" }
```
`status` must be `"open"` or `"closed"`.

Response `200`:
```json
{ "gate": { "status": "open", "updatedAt": "2026-07-26T13:52:42.490Z" } }
```

Response `400` (missing/invalid status):
```json
{ "message": "Invalid status" }
```

## ESP32 polling workflow

The backend never pushes anything to the firmware — the firmware always initiates
both calls below. This keeps the backend a plain REST API with no need for
WebSockets, callbacks, or knowing the ESP32's address.

1. User clicks Open/Close/Toggle on the web dashboard → `POST /api/control` queues a
   command. `gateState.status` is **not** changed yet.
2. The firmware polls `GET /api/esp32/command` on a fixed interval. If a command is
   waiting, it is returned once and cleared (subsequent polls see `null` until the
   next `POST /api/control` call).
3. The firmware drives the motor toward the requested direction and watches the
   matching reed switch.
4. Once the reed switch triggers (or the firmware's own safety cutoff stops it without
   reaching the limit — see `firmware/README.md`), the firmware calls
   `POST /api/esp32/report` with the real outcome. Only this call updates
   `gateState.status`.
5. The web dashboard's periodic `GET /api/status` poll then reflects the real status.

If the firmware's safety cutoff fires without the reed switch triggering, no report is
sent — `gateState.status` simply keeps its last known value until a future move
succeeds. There is no "unknown" or "error" status value in this API today.
