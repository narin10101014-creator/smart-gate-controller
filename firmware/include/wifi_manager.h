#pragma once

// Owns the WiFi connection lifecycle. No knowledge of the backend API or the gate.
namespace WifiManager {

// Starts the WiFi connection attempt. Call once from setup().
void begin();

// Maintains the connection (reconnects if dropped). Call every loop() tick.
void update();

bool isConnected();

} // namespace WifiManager
