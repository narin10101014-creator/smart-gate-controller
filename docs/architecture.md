# Smart Gate Controller Architecture

## Overview
This project is designed as a local-first smart gate controller with a web-based dashboard and an ESP32 firmware backend.

The architecture is split into:
- `backend/` — local backend API for authentication, control commands, and logging
- `firmware/` — ESP32 firmware with Wi-Fi and REST API integration
- `web/` — mobile-friendly web application for login and gate control
- `docs/` — documentation and architecture notes
- `hardware/` — hardware design files and wiring notes
- `pcb/` — PCB design files

## Goals for MVP
- web login/logout flow for two users
- secure control button to open/close gate
- backend that manages users, sessions, logs, and ESP32 commands
- local network deployment now, cloud-ready later

## Future extension
- add cloud sync and remote access
- add persistent database in backend
- add OTA firmware updates for ESP32
- add multiple gate controllers and access levels
- add mobile PWA support for iOS and Android
