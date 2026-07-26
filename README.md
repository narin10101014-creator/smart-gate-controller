# Smart Gate Controller

A local-first smart gate controller: a Vue web dashboard for login and gate control,
an Express backend that tracks gate state and activity, and ESP32 firmware that
drives the physical gate motor.

See `docs/architecture.md` for how the pieces fit together, `docs/api.md` for the
backend's REST API, and `docs/hardware.md` / `firmware/README.md` for the gate motor
circuit and firmware.

## Repository structure

```
backend/    Express REST API (auth, gate control, logs)
web/        Vue 3 web dashboard
firmware/   PlatformIO project for the Arduino Nano ESP32
docs/       Architecture, API, and hardware documentation
```

## Required software

- Node.js and npm (`backend/`, `web/`)
- [PlatformIO](https://platformio.org/) (`firmware/`) — via the VS Code extension or
  the `pio` CLI
- An Arduino Nano ESP32 board, USB-C cable, and the gate motor circuit described in
  `docs/hardware.md` (only needed to run the firmware against real hardware)

## Quick start

### Backend
```bash
cd backend
npm install
cp .env.example .env   # then edit ADMIN_PASSWORD / FAMILY_PASSWORD
npm run dev            # http://localhost:3000
```
`backend/.env` is required — the server refuses to start without `ADMIN_PASSWORD`
and `FAMILY_PASSWORD` set (see `docs/api.md` for the seeded accounts these create).

### Web dashboard
```bash
cd web
npm install
npm run dev            # http://localhost:5173
```
Talks to the backend via `VITE_API_BASE_URL` (see `web/.env.example`), which defaults
to `http://localhost:3000/api`.

### Firmware
```bash
cd firmware
cp include/secrets.h.example include/secrets.h   # then edit WiFi + backend URL
pio run -t upload
pio device monitor
```
See `firmware/README.md` for the full module architecture, pin mapping, and build
details, and `docs/hardware.md` for how to wire the motor driver and reed switches.

## Build instructions

Each subproject builds independently:

```bash
cd backend && npm install       # no build step, runs directly with node
cd web && npm run build         # outputs to web/dist/
cd firmware && pio run          # outputs to firmware/.pio/build/
```
