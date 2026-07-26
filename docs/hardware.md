# Hardware

Wiring, pin mapping, and power/safety notes for the gate motor circuit driven by the
firmware in `firmware/`. Pin constants referenced here are defined in
`firmware/include/config.h`.

## Bill of materials

| Part | Notes | Qty |
|---|---|---|
| Arduino Nano ESP32 | ESP32-S3 via u-blox NORA-W106 | 1 |
| L298N motor driver module | Dual H-bridge, built-in flyback diodes | 1 |
| DC gate motor | 12V or 24V geared motor, reversible | 1 |
| Magnetic reed switch | Normally-open, one per travel limit | 2 |
| Power supply | Sized to the motor's stall current, matches its voltage | 1 |

## Wiring diagram

```mermaid
graph LR
    PSU["Motor power supply\n(12/24V)"]
    NANO["Arduino Nano ESP32"]
    L298["L298N H-bridge"]
    MOTOR["DC gate motor"]
    ROPEN["Reed switch\nopen limit"]
    RCLOSE["Reed switch\nclosed limit"]

    PSU -->|V+ / GND| L298
    L298 -->|OUT1 / OUT2| MOTOR

    NANO -->|"D2 -> IN1"| L298
    NANO -->|"D3 -> IN2"| L298
    NANO -->|"D4 -> ENA (PWM)"| L298

    ROPEN -->|"D5 (INPUT_PULLUP)"| NANO
    RCLOSE -->|"D6 (INPUT_PULLUP)"| NANO

    NANO -.->|GND| L298
```

## Pin mapping (Arduino Nano ESP32)

| Nano ESP32 pin | Connects to | Purpose |
|---|---|---|
| `D2` | L298N `IN1` | Direction control — drive HIGH to open |
| `D3` | L298N `IN2` | Direction control — drive HIGH to close |
| `D4` | L298N `ENA` | PWM enable/speed |
| `D5` | Reed switch — open limit | `INPUT_PULLUP`; reads LOW when fully open |
| `D6` | Reed switch — closed limit | `INPUT_PULLUP`; reads LOW when fully closed |
| `GND` | L298N `GND` + power supply `GND` | Common ground — required |

Pins are referenced by their Arduino symbolic names (`D2`-`D6`), not raw GPIO numbers
— see `firmware/README.md` for why.

## L298N connections

- `IN1`/`IN2` — direction control from the Nano ESP32. Firmware guarantees these are
  never both `HIGH` at the same time (see `motor_control` in `firmware/README.md`).
- `ENA` — PWM enable/speed, driven by the Nano ESP32.
- `OUT1`/`OUT2` — to the DC motor terminals.
- `12V`/`GND` (motor supply input) — from the power supply, sized to the motor's
  voltage and stall current.
- L298N's onboard 5V logic regulator is **not used** here — do not connect it to the
  Nano ESP32's power pins (see Power requirements below).

## Reed switch wiring

Each reed switch is wired between its signal pin (`D5` or `D6`) and `GND`, with the
pin configured `INPUT_PULLUP` in firmware — so the pin reads `HIGH` normally and
`LOW` when the switch closes (magnet present, gate at that limit). No external
pull-up resistor or debounce capacitor is required for `INPUT_PULLUP` to function,
but a small ceramic capacitor (~100nF) across each switch to `GND` is recommended if
wiring runs near the motor leads, to filter switching noise from the L298N.

## Power requirements

- **During development**, power the Nano ESP32 over its USB-C port (5V) — simplest
  and safest option while testing on a bench.
- **For a permanent installation**, the Nano ESP32's `VIN` pin accepts a wider range
  (Arduino's documentation states a recommended minimum of 6V; consult the official
  datasheet for the exact upper limit before wiring a permanent supply). Feeding a
  12V or 24V motor supply's raw voltage directly into `VIN` may exceed that limit —
  if in doubt, power the Nano ESP32 from a separate, regulated low-voltage supply
  (5–9V) rather than the same rail as the motor.
- The L298N's motor-side supply (`12V`/`GND` input) is separate from the Nano ESP32's
  power and should come directly from the power supply sized to the motor.
- `GND` must be common between the Nano ESP32, the L298N, and the power supply.

Sources: [Arduino Nano ESP32 Cheat Sheet](https://docs.arduino.cc/tutorials/nano-esp32/cheat-sheet/),
[Arduino Forum — Nano ESP32-S3 minimum VIN voltage](https://forum.arduino.cc/t/arduino-nano-esp32-s3-minimum-vin-voltage-datasheet-question/1246320).

## Safety notes

- **Never drive `IN1` and `IN2` HIGH at the same time.** Firmware already enforces
  this in `motor_control` (see `firmware/README.md`) — do not bypass it with manual
  pin writes elsewhere.
- **Trust the reed switches, not a timer.** The motor must stop the instant the
  matching reed switch triggers; the firmware's `MAX_TRAVEL_MS` cutoff is a fallback
  only, not the primary stop mechanism.
- **Do not power the Nano ESP32 from the L298N's onboard 5V regulator** — it cannot
  reliably supply the current spikes WiFi draws.
- **Size the power supply to the motor's stall current**, not its running current — a
  gate pushing against an obstruction draws significantly more than its normal
  running current.
- **Add an inline fuse** between the power supply and the L298N, rated to the
  supply's expected current, to protect against a jammed gate or wiring fault.
