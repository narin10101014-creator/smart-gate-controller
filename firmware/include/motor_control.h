#pragma once

// Owns the L298N pins. Guarantees IN1/IN2 are never both HIGH at once. No
// knowledge of reed switches, timing, or the network.
namespace MotorControl {

// Configures pin modes and ensures the motor starts stopped. Call once from setup().
void begin();

void stop();
void driveOpen();
void driveClose();

} // namespace MotorControl
