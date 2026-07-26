#include "gate_state.h"

#include <Arduino.h>

#include "api_client.h"
#include "config.h"
#include "motor_control.h"

namespace {

enum class Motion { Idle, MovingOpen, MovingClosing };

Motion motion = Motion::Idle;
unsigned long lastPollMillis = 0;
unsigned long moveStartMillis = 0;

void startMove(GateCommand command) {
    if (command == GateCommand::Open) {
        MotorControl::driveOpen();
        motion = Motion::MovingOpen;
        moveStartMillis = millis();
    } else if (command == GateCommand::Close) {
        MotorControl::driveClose();
        motion = Motion::MovingClosing;
        moveStartMillis = millis();
    }
    // GateCommand::None: stay idle, nothing to do.
}

void pollForCommand() {
    unsigned long now = millis();
    if (now - lastPollMillis < COMMAND_POLL_INTERVAL_MS) {
        return;
    }
    lastPollMillis = now;
    startMove(ApiClient::pollCommand());
}

void handleMoving() {
    if (motion == Motion::MovingOpen && digitalRead(PIN_REED_OPEN) == LOW) {
        MotorControl::stop();
        motion = Motion::Idle;
        ApiClient::reportStatus(GatePosition::Open);
        return;
    }

    if (motion == Motion::MovingClosing && digitalRead(PIN_REED_CLOSED) == LOW) {
        MotorControl::stop();
        motion = Motion::Idle;
        ApiClient::reportStatus(GatePosition::Closed);
        return;
    }

    // Safety cutoff: stop regardless of reed-switch state once travel takes
    // too long. Position is now unknown, so no report is sent - the backend
    // simply keeps its last known status until a future move succeeds.
    if (millis() - moveStartMillis > MAX_TRAVEL_MS) {
        MotorControl::stop();
        motion = Motion::Idle;
    }
}

} // namespace

namespace GateState {

void begin() {
    MotorControl::begin();

    // Reed switches are read only by this module, so their pin setup lives
    // here rather than in MotorControl.
    pinMode(PIN_REED_OPEN, INPUT_PULLUP);
    pinMode(PIN_REED_CLOSED, INPUT_PULLUP);

    motion = Motion::Idle;
    lastPollMillis = millis();
}

void update() {
    if (motion == Motion::Idle) {
        pollForCommand();
    } else {
        handleMoving();
    }
}

} // namespace GateState
