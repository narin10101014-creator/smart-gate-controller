#pragma once

// Owns the BTS7960 driver pins (RPWM/LPWM). Guarantees only one channel is
// ever active at once. No knowledge of reed switches, timing, or the network.
namespace MotorControl {

// Configures pin modes and ensures the motor starts stopped. Call once from setup().
void begin();

void stop();
void driveOpen();
void driveClose();

} // namespace MotorControl
