#pragma once

// Motor driver pins (L298N)
inline constexpr int PIN_MOTOR_IN1 = 26; // direction: open
inline constexpr int PIN_MOTOR_IN2 = 27; // direction: close
inline constexpr int PIN_MOTOR_ENA = 25; // PWM enable/speed

// Position sensing (magnetic reed switches, INPUT_PULLUP, LOW = triggered)
inline constexpr int PIN_REED_OPEN = 32;
inline constexpr int PIN_REED_CLOSED = 33;

// Timing
inline constexpr unsigned long COMMAND_POLL_INTERVAL_MS = 1000;
inline constexpr unsigned long MAX_TRAVEL_MS = 20000;
inline constexpr unsigned long WIFI_RETRY_INTERVAL_MS = 5000;
