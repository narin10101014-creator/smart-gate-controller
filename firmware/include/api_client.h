#pragma once

// Translates backend HTTP calls into plain values. No knowledge of motors, pins,
// or the gate's state machine.

enum class GateCommand { None, Open, Close };
enum class GatePosition { Open, Closed };

namespace ApiClient {

// GET /api/esp32/command - returns the pending command, or GateCommand::None.
GateCommand pollCommand();

// POST /api/esp32/report - reports the real position. Returns true on success.
bool reportStatus(GatePosition position);

} // namespace ApiClient
