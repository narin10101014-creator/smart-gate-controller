# Firmware

PlatformIO project for the **Arduino Nano ESP32** (ESP32-S3, via the u-blox
NORA-W106 module). Connects to WiFi, polls the backend for open/close commands,
drives a DC gate motor through an L298N H-bridge, and reports the real position
back once a reed switch confirms the gate reached its limit.

See `docs/api.md` for the exact backend endpoints this firmware calls, and
`docs/architecture.md` for how it fits into the rest of the system.

## Module architecture

Each module has one responsibility and no knowledge of modules above it in this list:

| Module | Responsibility | Does *not* know about |
|---|---|---|
| `config.h` | Pin numbers and timing constants | — (data only, no functions) |
| `wifi_manager` | Non-blocking WiFi connect/reconnect | The backend API, the gate |
| `api_client` | HTTP calls to the backend, translated to plain enums | Motors, pins, the state machine |
| `motor_control` | Drives the L298N pins, guarantees `IN1`/`IN2` are never both `HIGH` | Reed switches, timing, the network |
| `gate_state` | The state machine: polls for commands, watches reed switches, enforces the safety cutoff | — (this is the orchestrator) |
| `main.cpp` | Calls `WifiManager::begin/update` and `GateState::begin/update` | Everything else — no other logic lives here |

`gate_state` composes `motor_control` and `api_client` internally; `main.cpp` only
ever calls `WifiManager` and `GateState`.

## Pin mapping (Arduino Nano ESP32)

Pins are defined in `include/config.h` using the board's **symbolic Arduino names**
(`D2`, `D3`, ...), not raw GPIO numbers — the Nano ESP32 remaps `Dx` to different
underlying GPIOs depending on the active pin-numbering mode (Tools > Pin Numbering
in Arduino IDE; PlatformIO uses the Arduino-style mapping by default), so symbolic
names stay correct regardless of that setting.

| Constant | Pin | Purpose |
|---|---|---|
| `PIN_MOTOR_IN1` | `D2` | L298N IN1 — direction: open |
| `PIN_MOTOR_IN2` | `D3` | L298N IN2 — direction: close |
| `PIN_MOTOR_ENA` | `D4` | L298N ENA — PWM enable/speed |
| `PIN_REED_OPEN` | `D5` | Reed switch, open limit (`INPUT_PULLUP`, LOW = triggered) |
| `PIN_REED_CLOSED` | `D6` | Reed switch, closed limit (`INPUT_PULLUP`, LOW = triggered) |

Full wiring diagram, power requirements, and safety notes are in `docs/hardware.md`.

## State machine

`gate_state` tracks one of three states internally (not exposed outside the module):

- **Idle** — polls `GET /api/esp32/command` every `COMMAND_POLL_INTERVAL_MS` (1000ms).
  On `"open"`/`"close"`, calls `MotorControl::driveOpen()`/`driveClose()` and switches
  to the matching moving state.
- **Moving (open or closing)** — every loop tick, reads the reed switch matching the
  current direction. On trigger: stops the motor, returns to idle, and calls
  `POST /api/esp32/report` with the real position.
- **Safety cutoff** — independent of the reed switch, if a move exceeds
  `MAX_TRAVEL_MS` (20000ms) the motor is stopped anyway. **No report is sent** in this
  case — the gate's real position is unknown, and the backend keeps its last known
  status until a future move succeeds. This is an accepted limitation, not a bug.

The main loop is entirely `millis()`-driven; there is no `delay()` anywhere, so WiFi
maintenance, command polling, and reed-switch checks all stay responsive.

## `secrets.h` setup

WiFi credentials and the backend URL are kept out of source control:

```bash
cp include/secrets.h.example include/secrets.h
```

Then edit `include/secrets.h`:
```cpp
#define WIFI_SSID "your-wifi-name"
#define WIFI_PASSWORD "your-wifi-password"
#define BACKEND_BASE_URL "http://192.168.1.50:3000/api"
```

- The Nano ESP32 only supports **2.4GHz WiFi** — use a 2.4GHz SSID if your router
  splits bands.
- `BACKEND_BASE_URL` must be the backend host's **LAN IP**, not `localhost` — the
  ESP32 is a separate device on the network.

`include/secrets.h` is gitignored; only `include/secrets.h.example` (placeholders) is
committed.

## Build, upload, monitor

```bash
cd firmware
pio run              # build only
pio run -t upload    # build and flash over USB
pio device monitor    # serial monitor at 115200 baud
```

Or use the PlatformIO extension's Build/Upload/Monitor buttons in VS Code — open
`firmware/` as its own folder (or add it as a workspace folder) for the extension to
detect `platformio.ini` and generate working IntelliSense.
