function parseDurationMs(value, varName) {
    const match = /^(\d+(?:\.\d+)?)(s|m|h)$/.exec(value.trim());
    if (!match) {
        throw new Error(`Invalid ${varName} "${value}" - expected a number followed by s, m, or h (e.g. "20s", "30m", "24h")`);
    }
    const amount = Number(match[1]);
    const msPerUnit = { s: 1000, m: 60 * 1000, h: 60 * 60 * 1000 };
    return amount * msPerUnit[match[2]];
}

module.exports = { parseDurationMs };
