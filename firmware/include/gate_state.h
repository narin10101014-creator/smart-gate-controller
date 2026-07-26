#pragma once

// Orchestrates MotorControl + ApiClient into the gate's state machine
// (idle / moving-open / moving-closing), including reed-switch checks and the
// max-travel-time safety cutoff. The only module main.cpp needs for gate
// behavior; MotorControl and ApiClient are internal implementation details.
namespace GateState {

// Initializes owned modules (MotorControl) and internal state. Call once from setup().
void begin();

// Runs one tick of the state machine: polls for commands while idle, checks
// reed switches and the safety cutoff while moving. Call every loop() tick.
void update();

} // namespace GateState
