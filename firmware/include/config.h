#pragma once

#include <Arduino.h>

// Pins use the board's symbolic Arduino names (D2, D3, ...) rather than raw
// GPIO numbers, since Arduino Nano ESP32 remaps Dx to different underlying
// GPIOs depending on the active pin-numbering mode (Tools > Pin Numbering).

// Motor driver pins (L298N)
inline constexpr int PIN_MOTOR_IN1 = D2; // direction: open
inline constexpr int PIN_MOTOR_IN2 = D3; // direction: close
inline constexpr int PIN_MOTOR_ENA = D4; // PWM enable/speed

// Position sensing (magnetic reed switches, INPUT_PULLUP, LOW = triggered)
inline constexpr int PIN_REED_OPEN = D5;
inline constexpr int PIN_REED_CLOSED = D6;

// Timing
inline constexpr unsigned long COMMAND_POLL_INTERVAL_MS = 1000;
inline constexpr unsigned long MAX_TRAVEL_MS = 20000;
inline constexpr unsigned long WIFI_RETRY_INTERVAL_MS = 5000;
