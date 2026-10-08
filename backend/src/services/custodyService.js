const {

  recordCustodyEventOnBlockchain,

  getCustodyRecordCountFromBlockchain,

  getCustodyRecordFromBlockchain,

} = require("./blockchainService");

const {

  uploadCustodyEventToS3,

} = require("./s3Service");

const {

  recordAutomaticReading,

} = require("./iotService");

// ==========================================
// RECORD CUSTODY EVENT
// ==========================================

async function recordCustodyEvent(
  eventData
) {

  const {

    organId,

    location,

    custodian,

    status,

  } = eventData;

  // ==========================================
  // STEP 1
  // AUTOMATIC IOT SENSOR READING
  // ==========================================

  console.log(
    `🌡️ Generating IoT reading for custody event: ${organId}`
  );

  const iotReading =
    await recordAutomaticReading(
      organId
    );

  // ==========================================
  // STEP 2
  // CREATE CUSTODY EVENT
  // ==========================================

  const custodyEvent = {

    organId,

    location,

    custodian,

    status,

    recordedAt:
      new Date().toISOString(),

    // Link IoT reading

    iotReadingHash:
      iotReading.hash,

    iotReadingS3Key:
      iotReading.s3Key,

  };

  // ==========================================
  // STEP 3
  // STORE COMPLETE EVENT IN AWS S3
  // ==========================================

  const s3Key =
    await uploadCustodyEventToS3(
      custodyEvent
    );

  // ==========================================
  // STEP 4
  // STORE CUSTODY EVENT ON BLOCKCHAIN
  // ==========================================

  const blockchainResult =
    await recordCustodyEventOnBlockchain(
      organId,
      location,
      custodian,
      status
    );

  // ==========================================
  // RETURN COMPLETE RESULT
  // ==========================================

  return {

    ...custodyEvent,

    s3Key,

    blockchain:
      blockchainResult,

    automaticIoTReading:
      iotReading,

  };
}

// ==========================================
// GET CUSTODY HISTORY
// ==========================================

async function getCustodyHistory(
  organId
) {

  const count =
    await getCustodyRecordCountFromBlockchain(
      organId
    );

  const history = [];

  for (
    let i = 0;
    i < count;
    i++
  ) {

    const record =
      await getCustodyRecordFromBlockchain(
        organId,
        i
      );

    history.push(record);
  }

  return history;
}

module.exports = {

  recordCustodyEvent,

  getCustodyHistory,

};