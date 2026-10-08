const crypto = require("crypto");

function generateIoTHash(reading) {
  const dataToHash =
    `${reading.organId}|` +
    `${reading.temperature}|` +
    `${reading.humidity}|` +
    `${reading.latitude}|` +
    `${reading.longitude}`;

  return crypto
    .createHash("sha256")
    .update(dataToHash)
    .digest("hex");
}

module.exports = {
  generateIoTHash,
};