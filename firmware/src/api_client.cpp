#include "api_client.h"

#include <HTTPClient.h>
#include <WiFiClient.h>

#include "secrets.h"

namespace {

WiFiClient wifiClient;

} // namespace

namespace ApiClient {

GateCommand pollCommand() {
    HTTPClient http;
    String url = String(BACKEND_BASE_URL) + "/esp32/command";

    if (!http.begin(wifiClient, url)) {
        return GateCommand::None;
    }

    int httpCode = http.GET();
    if (httpCode != 200) {
        http.end();
        return GateCommand::None;
    }

    // No JSON library dependency: the response shape is small and fixed
    // ({"command":{"action":"open"|"close",...}} or {"command":null}), so a
    // substring check is enough to extract the one field we need.
    String payload = http.getString();
    http.end();

    if (payload.indexOf("\"action\":\"open\"") != -1) {
        return GateCommand::Open;
    }
    if (payload.indexOf("\"action\":\"close\"") != -1) {
        return GateCommand::Close;
    }
    return GateCommand::None;
}

bool reportStatus(GatePosition position) {
    HTTPClient http;
    String url = String(BACKEND_BASE_URL) + "/esp32/report";

    if (!http.begin(wifiClient, url)) {
        return false;
    }
    http.addHeader("Content-Type", "application/json");

    const char *status = (position == GatePosition::Open) ? "open" : "closed";
    String body = String("{\"status\":\"") + status + "\"}";

    int httpCode = http.POST(body);
    http.end();

    return httpCode == 200;
}

} // namespace ApiClient
