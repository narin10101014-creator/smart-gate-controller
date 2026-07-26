#include "wifi_manager.h"

#include <WiFi.h>

#include "config.h"
#include "secrets.h"

namespace {

unsigned long lastAttemptMillis = 0;

} // namespace

namespace WifiManager {

void begin() {
    WiFi.mode(WIFI_STA);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    lastAttemptMillis = millis();
}

void update() {
    if (WiFi.status() == WL_CONNECTED) {
        return;
    }

    // Non-blocking retry: only re-issue WiFi.begin() after the retry
    // interval has elapsed, instead of blocking the loop while it connects.
    unsigned long now = millis();
    if (now - lastAttemptMillis < WIFI_RETRY_INTERVAL_MS) {
        return;
    }

    lastAttemptMillis = now;
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
}

bool isConnected() {
    return WiFi.status() == WL_CONNECTED;
}

} // namespace WifiManager
