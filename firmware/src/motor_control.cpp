#include "motor_control.h"

#include <Arduino.h>

#include "config.h"

namespace MotorControl {

void begin() {
    pinMode(PIN_MOTOR_RPWM, OUTPUT);
    pinMode(PIN_MOTOR_LPWM, OUTPUT);
    stop();
}

void stop() {
    analogWrite(PIN_MOTOR_RPWM, 0);
    analogWrite(PIN_MOTOR_LPWM, 0);
}

void driveOpen() {
    // LPWM is zeroed before RPWM is driven, so both channels are never
    // active at the same time.
    analogWrite(PIN_MOTOR_LPWM, 0);
    analogWrite(PIN_MOTOR_RPWM, 255);
}

void driveClose() {
    // Same guarantee as driveOpen(), mirrored.
    analogWrite(PIN_MOTOR_RPWM, 0);
    analogWrite(PIN_MOTOR_LPWM, 255);
}

} // namespace MotorControl
