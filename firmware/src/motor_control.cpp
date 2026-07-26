#include "motor_control.h"

#include <Arduino.h>

#include "config.h"

namespace MotorControl {

void begin() {
    pinMode(PIN_MOTOR_IN1, OUTPUT);
    pinMode(PIN_MOTOR_IN2, OUTPUT);
    pinMode(PIN_MOTOR_ENA, OUTPUT);
    stop();
}

void stop() {
    digitalWrite(PIN_MOTOR_IN1, LOW);
    digitalWrite(PIN_MOTOR_IN2, LOW);
    analogWrite(PIN_MOTOR_ENA, 0);
}

void driveOpen() {
    // IN2 is dropped to LOW before IN1 goes HIGH, so both pins are never
    // HIGH at the same time.
    digitalWrite(PIN_MOTOR_IN2, LOW);
    digitalWrite(PIN_MOTOR_IN1, HIGH);
    analogWrite(PIN_MOTOR_ENA, 255);
}

void driveClose() {
    // Same guarantee as driveOpen(), mirrored: IN1 dropped before IN2 goes HIGH.
    digitalWrite(PIN_MOTOR_IN1, LOW);
    digitalWrite(PIN_MOTOR_IN2, HIGH);
    analogWrite(PIN_MOTOR_ENA, 255);
}

} // namespace MotorControl
