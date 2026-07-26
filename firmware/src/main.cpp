#include "wifi_manager.h"
#include "gate_state.h"

void setup() {
    WifiManager::begin();
    GateState::begin();
}

void loop() {
    WifiManager::update();
    GateState::update();
}
