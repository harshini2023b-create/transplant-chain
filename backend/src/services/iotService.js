const {
  generateIoTHash,
} = require("../utils/hashUtils");

const {
  saveReading,
  getReadingsByOrganId,
} = require("../repositories/iotRepository");

const {
  uploadIoTReadingToS3,
} = require("./s3Service");

const {
  recordIoTHashOnBlockchain,
} = require("./blockchainService");

// ==========================================
// RECORD IOT READING
// ==========================================

async function recordReading(readingData) {

  // Generate SHA-256 hash

  const hash =
    generateIoTHash(readingData);

  // Create IoT record

  const reading = {
    ...readingData,

    hash,

    recordedAt:
      new Date().toISOString(),
  };

  // Store locally

  saveReading(reading);

  // Upload complete reading to AWS S3

  const s3Key =
    await uploadIoTReadingToS3(
      reading
    );

  // Store hash on blockchain

  const blockchainResult =
    await recordIoTHashOnBlockchain(
      reading.organId,
      hash
    );

  return {
    ...reading,

    s3Key,

    blockchain:
      blockchainResult,
  };
}

// ==========================================
// GENERATE AUTOMATIC SENSOR READING
// ==========================================

function generateAutomaticReading(
  organId
) {

  return {

    organId,

    // Cold organ transport temperature

    temperature: Number(
      (
        2 +
        Math.random() * 6
      ).toFixed(2)
    ),

    // Transport humidity

    humidity: Number(
      (
        65 +
        Math.random() * 20
      ).toFixed(2)
    ),

    // Simulated GPS

    latitude: Number(
      (
        12.900000 +
        Math.random() * 0.100000
      ).toFixed(6)
    ),

    longitude: Number(
      (
        77.500000 +
        Math.random() * 0.150000
      ).toFixed(6)
    ),

    sensorId:
      "IOT-SENSOR-001",

    timestamp:
      new Date().toISOString(),
  };
}

// ==========================================
// RECORD AUTOMATIC IOT DATA
// ==========================================

async function recordAutomaticReading(
  organId
) {

  const sensorReading =
    generateAutomaticReading(
      organId
    );

  console.log(
    `🌡️ Automatic IoT reading generated for ${organId}`
  );

  return await recordReading(
    sensorReading
  );
}

// ==========================================
// GET ORGAN READINGS
// ==========================================

function getOrganReadings(organId) {

  return getReadingsByOrganId(
    organId
  );
}

module.exports = {

  recordReading,

  getOrganReadings,

  generateAutomaticReading,

  recordAutomaticReading,
};