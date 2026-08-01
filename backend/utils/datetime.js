// Formats/parses the SQLite DATETIME string format used for every persisted
// timestamp column: 'YYYY-MM-DD HH:MM:SS' in local time.

function formatDateTime(date = new Date()) {
    const pad = (n) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} `
        + `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

// Parses a 'YYYY-MM-DD HH:MM:SS' string back into a Date, interpreting the
// components as local time (matches how formatDateTime produced them) so the
// result represents the same instant regardless of which value is used.
function parseDateTime(value) {
    const [datePart, timePart] = value.split(' ');
    const [year, month, day] = datePart.split('-').map(Number);
    const [hour, minute, second] = timePart.split(':').map(Number);
    return new Date(year, month - 1, day, hour, minute, second);
}

module.exports = { formatDateTime, parseDateTime };
