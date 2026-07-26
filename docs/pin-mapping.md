# Pin Mapping — Arduino Nano ESP32

Pin assignments for the firmware in `firmware/`, verified directly against the
installed PlatformIO board package (`framework-arduinoespressif32`, variant
`arduino_nano_nora`) rather than assumed from the product photo alone.

## Motor driver (L298N)

| Signal | Arduino Pin | GPIO | Direction | Description |
|--------|-------------|------|-----------|-------------|
| `PIN_MOTOR_IN1` | `D2` | GPIO5 | Output | L298N `IN1` — direction control, HIGH to open |
| `PIN_MOTOR_IN2` | `D3` | GPIO6 | Output | L298N `IN2` — direction control, HIGH to close |
| `PIN_MOTOR_ENA` | `D4` | GPIO7 | Output (PWM) | L298N `ENA` — motor enable/speed |

Firmware guarantees `IN1`/`IN2` are never driven HIGH at the same time
(`firmware/src/motor_control.cpp`).

## Reed switches

| Signal | Arduino Pin | GPIO | Direction | Description |
|--------|-------------|------|-----------|-------------|
| `PIN_REED_OPEN` | `D5` | GPIO8 | Input (`INPUT_PULLUP`) | Open-limit reed switch — reads LOW when triggered |
| `PIN_REED_CLOSED` | `D6` | GPIO9 | Input (`INPUT_PULLUP`) | Closed-limit reed switch — reads LOW when triggered |

## Reserved pins

Pins the board dedicates to fixed on-board functions. None of these are used by the
current firmware, but they are not available for general I/O either.

| Signal | Arduino Pin | GPIO | Direction | Description |
|--------|-------------|------|-----------|-------------|
| `RX` | `D0` | GPIO44 | Input | Hardware UART0 RX |
| `TX` | `D1` | GPIO43 | Output | Hardware UART0 TX |
| `SS` | `D10` | GPIO21 | — | Hardware SPI chip select |
| `MOSI` | `D11` | GPIO38 | Output | Hardware SPI MOSI |
| `MISO` | `D12` | GPIO47 | Input | Hardware SPI MISO |
| `SCK` / `LED_BUILTIN` | `D13` | GPIO48 | Output | Hardware SPI clock, doubles as the built-in LED |
| `SDA` | `A4` | GPIO11 | — | Hardware I2C data |
| `SCL` | `A5` | GPIO12 | — | Hardware I2C clock |
| `LED_RED` | — | GPIO46 | Output | Onboard RGB LED, red channel |
| `LED_GREEN` | — | GPIO0 | Output | Onboard RGB LED, green channel — also an ESP32-S3 boot strapping pin |
| `LED_BLUE` / `RTS` | — | GPIO45 | Output | Onboard RGB LED, blue channel |

`D7`-`D9` and `A0`-`A3`, `A6`-`A7` are broken out on the header and unused by this
firmware, available for future expansion.

## UART

The board exposes one hardware UART on `D0`/`D1` (`RX`/`TX`, GPIO44/GPIO43), separate
from the native-USB serial connection used for `Serial`/logging in this firmware. The
current firmware does not use this UART.

## USB

The Nano ESP32 uses the ESP32-S3's native USB peripheral (via the onboard USB-C
connector) for both flashing and `Serial` output (`Serial.begin(115200)` in
`firmware/src/main.cpp`, matching `monitor_speed = 115200` in `platformio.ini`). The
underlying USB D+/D- lines are internal to the module and are not exposed as any
`Dx`/`Ax` header pin.

## Power pins

Labeled on the board header (see the product pinout), not GPIOs:

| Pin | Description |
|---|---|
| `VIN` | Unregulated supply input to the onboard regulator (see `docs/hardware.md` for the accepted range) |
| `VBUS` | USB 5V rail |
| `3.3V` | Regulated 3.3V output |
| `GND` | Ground (multiple pins) |

## Arduino Pin names vs ESP32 GPIO numbers

`firmware/include/config.h` uses symbolic names (`D2`, `D3`, ...) rather than raw
GPIO numbers. This matters because the Arduino Nano ESP32 board package supports two
pin-numbering modes, controlled by build-time macros
(`framework-arduinoespressif32/platforms/espressif32/boards/arduino_nano_esp32.json`):

- **`BOARD_HAS_PIN_REMAP`** (the default for this board, and what `firmware/platformio.ini`
  builds with) — `D2` etc. are small logical indices (e.g. `D2 == 2`), and every pin
  function (`pinMode`, `digitalWrite`, `digitalRead`, `analogWrite`, ...) is
  transparently remapped to the real GPIO through a lookup table
  (`variants/arduino_nano_nora/io_pin_remap.cpp`). Under this mode, `D2` resolves to
  **GPIO5** at runtime — the value shown in the "GPIO" column above.
- **`BOARD_USES_HW_GPIO_NUMBERS`** — pin remapping is disabled and `Dx`/`Ax` names
  resolve directly to real GPIO numbers instead (e.g. `D2 == 5` directly).

Because the active mode is a build-time setting, writing `PIN_MOTOR_IN1 = D2` in
`config.h` resolves correctly under either mode — a raw literal like `26` would not.
The "GPIO" column in the tables above reflects the real silicon pin regardless of
mode, verified directly from `TO_GPIO_NUMBER[]` in
`variants/arduino_nano_nora/io_pin_remap.cpp`.
