const {
  getLatestIoTHashFromBlockchain,
} = require("./blockchainService");

const {
  generateIoTHash,
} = require("../utils/hashUtils");

async function verifyIoTReading(reading) {

  // Generate deterministic hash
  const calculatedHash =
    generateIoTHash(reading);

  // Retrieve latest blockchain record
  const blockchainRecord =
    await getLatestIoTHashFromBlockchain(
      reading.organId
    );

  if (!blockchainRecord) {
    return {
      verified: false,
      reason:
        "No blockchain record found for this organ",
    };
  }

  // Compare hashes
  const verified =
    calculatedHash === blockchainRecord.dataHash;

  return {
    verified,

    organId: reading.organId,

    calculatedHash,

    blockchainHash:
      blockchainRecord.dataHash,

    blockchainTimestamp:
      blockchainRecord.timestamp,

    recordIndex:
      blockchainRecord.recordIndex,

    message: verified
      ? "Data integrity verified successfully"
      : "⚠️ Data integrity check failed - data may have been tampered with",
  };
}

module.exports = {
  verifyIoTReading,
};