# Roadmap

Reflects the actual state of this repository, not a forward-looking product plan.
Phases with no code, design doc, or decision committed to the repo are marked "not
started" rather than filled in speculatively.

## Current status

**Completed**
- Backend REST API: auth (bcrypt-hashed passwords, session tokens), gate
  status/control, activity logs, ESP32 command/report endpoints
- Web dashboard: login and gate control UI, polling-based status sync
- Firmware: WiFi, backend HTTP client, motor driver, and gate state machine modules,
  compiling successfully for the Arduino Nano ESP32
- Hardware wiring design and pin mapping, verified against the installed board package

**In progress**
- Physical hardware assembly and testing (wiring built in `docs/hardware.md`, not yet
  confirmed working against a real motor/reed switches in this repo's history)
- Firmware calibration against real hardware (`MAX_TRAVEL_MS` is a placeholder)

**Planned (not started — no implementation or design committed yet)**
- Mobile app
- OTA firmware updates
- Production release (persistence, device authentication, deployment)

---

## Phase 1 — Backend

**Objectives:** REST API for authentication, gate control, and activity logging that
the web dashboard and firmware can both rely on.

**Completed work:**
- Login/logout with bcrypt-hashed passwords, credentials from environment variables
- `GET /api/status`, `POST /api/control` (queues a command, resolves `toggle`)
- `GET /api/logs` (capped, newest-first activity log)
- `GET /api/esp32/command`, `POST /api/esp32/report` for firmware integration

**Remaining work:**
- Session expiry (tokens are valid indefinitely until logout or backend restart)
- Rate limiting on `/api/login`
- Authentication on the ESP32 device endpoints (currently open to anything on the
  network)
- Persistent storage (all state is in-memory and lost on restart)

**Dependencies:** None — self-contained Express app.

**Risks:** In-memory state means any backend restart wipes sessions, logs, and gate
status; unauthenticated device endpoints are a known attack surface once exposed
beyond a trusted local network.

## Phase 2 — Firmware

**Objectives:** ESP32 firmware that polls the backend for commands, drives the gate
motor, and reports the real position back.

**Completed work:**
- `wifi_manager`, `api_client`, `motor_control`, `gate_state` modules, each with a
  single documented responsibility (`firmware/README.md`)
- Idle/moving state machine with reed-switch stop and a safety-cutoff timeout
- Successful `pio run` builds targeting `arduino_nano_esp32`

**Remaining work:**
- Calibrate `MAX_TRAVEL_MS` against the real motor's actual travel time
- Retry or surface failures for `POST /api/esp32/report` (currently fire-and-forget —
  see `docs/state-machine.md`)
- Validate behavior against real WiFi conditions (drops, reconnects) over time

**Dependencies:** Phase 3 (physical hardware) to test motor/reed-switch behavior;
Phase 1 backend reachable on the same network.

**Risks:** Behavior is verified by compilation only so far, not by running against a
real motor and reed switches.

## Phase 3 — Hardware Integration

**Objectives:** A wired, physical gate motor circuit the firmware can safely drive.

**Completed work:**
- Bill of materials, wiring diagram, and pin mapping documented
  (`docs/hardware.md`, `docs/pin-mapping.md`), verified against the Arduino Nano
  ESP32's actual board package rather than assumed

**Remaining work:**
- Physical assembly of the L298N, motor, reed switches, and power supply
- Confirming the safety notes in `docs/hardware.md` (fusing, common ground, L298N
  regulator jumper) are followed in the physical build

**Dependencies:** Physical components (Nano ESP32 board, L298N module, gate motor,
reed switches, power supply).

**Risks:** Wiring mistakes are the primary risk category here — `docs/hardware.md`'s
safety notes exist specifically to address issues identified during design review
(regulator conflicts, ground topology, stall current sizing).

## Phase 4 — Web Dashboard

**Objectives:** A mobile-friendly web UI for logging in and controlling the gate.

**Completed work:**
- Vue 3 + Vite + Pinia + Vue Router app with login and dashboard views
- 5-second polling to reflect real gate status and activity log
- Verified production build (`vite build`)

**Remaining work:**
- Production hosting/deployment (currently run via `vite dev`/`vite preview` only)
- Broader manual testing across browsers/devices beyond initial verification

**Dependencies:** Phase 1 backend reachable from the browser.

**Risks:** None specific to the dashboard beyond the backend-side gaps already listed
in Phase 1 (e.g. no session expiry affects how long a stolen token remains valid).

## Phase 5 — Mobile App

**Objectives:** Not yet defined. No mobile app (native or otherwise) exists in this
repository; the web dashboard in Phase 4 is responsive but is not a substitute for a
dedicated app and is not being tracked as one.

**Completed work:** None.

**Remaining work:** Entire phase — scope has not been decided.

**Dependencies:** A stable Phase 1 API to build against.

**Risks:** Not assessed — no design work has started.

## Phase 6 — OTA Updates

**Objectives:** Not yet defined. Firmware is currently updated only by physically
connecting over USB and running `pio run -t upload` (`firmware/README.md`); no
over-the-air update mechanism exists.

**Completed work:** None.

**Remaining work:** Entire phase — scope has not been decided.

**Dependencies:** A stable Phase 2 firmware baseline to update from.

**Risks:** Not assessed — no design work has started.

## Phase 7 — Production Release

**Objectives:** Not yet defined beyond the gaps already identified elsewhere in this
document. Today, every component runs in a local/dev configuration: in-memory backend
state, dev servers for the web dashboard, and USB-only firmware updates.

**Completed work:** None specific to production readiness.

**Remaining work:** Persistent backend storage, device authentication, a real
deployment target for the backend and web dashboard, and resolution of the security
gaps already tracked in Phase 1.

**Dependencies:** Meaningful progress on Phases 1-4 (backend persistence and auth
hardening, firmware reliability, confirmed hardware, and a hosted web dashboard).

**Risks:** Releasing before the Phase 1 security gaps (unauthenticated device
endpoints, no session expiry, no rate limiting) are addressed would expose physical
gate access to anyone who can reach the backend.
