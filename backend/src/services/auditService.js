const {
  getIoTReadingsFromS3,
  getCustodyEventsFromS3,
} = require("./s3Service");

const {
  getOrganRegistrationFromBlockchain,
  getIoTRecordCountFromBlockchain,
  getIoTRecordFromBlockchain,
  getCustodyRecordCountFromBlockchain,
  getCustodyRecordFromBlockchain,
} = require("./blockchainService");

const {
  generateIoTHash,
} = require("../utils/hashUtils");

// ==========================================
// COMPLETE ORGAN AUDIT
// ==========================================

async function getOrganAuditTrail(organId) {

  // ========================================
  // 1. VERIFY ORGAN REGISTRATION
  // ========================================

  const organRegistration =
    await getOrganRegistrationFromBlockchain(
      organId
    );

  if (!organRegistration) {

    throw new Error(
      `Organ ${organId} is not registered on the blockchain`
    );

  }

  // ========================================
  // 2. GET IOT READINGS FROM S3
  // ========================================

  const iotReadings =
    await getIoTReadingsFromS3(
      organId
    );

  // ========================================
  // 3. GET IOT HASHES FROM BLOCKCHAIN
  // ========================================

  const blockchainIoTCount =
    await getIoTRecordCountFromBlockchain(
      organId
    );

  const iotAudit = [];

  for (
    let i = 0;
    i < iotReadings.length;
    i++
  ) {

    const reading =
      iotReadings[i];

    // Recalculate hash from S3 data

    const recalculatedHash =
      generateIoTHash(reading);

    let blockchainRecord =
      null;

    if (
      i < blockchainIoTCount
    ) {

      blockchainRecord =
        await getIoTRecordFromBlockchain(
          organId,
          i
        );

    }

    const blockchainHash =
      blockchainRecord
        ? blockchainRecord.dataHash
        : null;

    const verified =
      recalculatedHash ===
      blockchainHash;

    iotAudit.push({

      recordIndex: i,

      data: {

        organId:
          reading.organId,

        temperature:
          reading.temperature,

        humidity:
          reading.humidity,

        latitude:
          reading.latitude,

        longitude:
          reading.longitude,

        recordedAt:
          reading.recordedAt,

      },

      s3Hash:
        recalculatedHash,

      blockchainHash,

      verified,

    });

  }

  // ========================================
  // 4. GET CUSTODY EVENTS FROM S3
  // ========================================

  const s3CustodyEvents =
    await getCustodyEventsFromS3(
      organId
    );

  // ========================================
  // 5. GET CUSTODY EVENTS FROM BLOCKCHAIN
  // ========================================

  const custodyCount =
    await getCustodyRecordCountFromBlockchain(
      organId
    );

  const custodyHistory = [];

  for (
    let i = 0;
    i < custodyCount;
    i++
  ) {

    const blockchainRecord =
      await getCustodyRecordFromBlockchain(
        organId,
        i
      );

    // Try to find corresponding S3 event

    const s3Event =
      s3CustodyEvents[i];

    // Find the IoT reading linked
    // to this custody event

    let linkedIoTReading =
      null;

    if (
      s3Event &&
      s3Event.iotReadingHash
    ) {

      linkedIoTReading =
        iotAudit.find(
          (iotRecord) =>
            iotRecord.s3Hash ===
            s3Event.iotReadingHash
        );

    }

    custodyHistory.push({

      ...blockchainRecord,

      s3Key:
        s3Event
          ? s3Event.s3Key
          : null,

      iotReadingHash:
        s3Event
          ? s3Event.iotReadingHash
          : null,

      iotReadingS3Key:
        s3Event
          ? s3Event.iotReadingS3Key
          : null,

      linkedIoTReading,

    });

  }

  // ========================================
  // 6. VERIFY OVERALL IOT INTEGRITY
  // ========================================

  const allIoTVerified =
    iotAudit.length > 0 &&
    iotAudit.every(
      (record) =>
        record.verified
    );

  const overallStatus =
    iotAudit.some(
      (record) =>
        !record.verified
    )

      ? "TAMPERING_DETECTED"

      : "VERIFIED";

  // ========================================
  // 7. RETURN COMPLETE AUDIT
  // ========================================

  return {

    organId,

    organRegistration,

    // IoT

    totalIoTReadings:
      iotReadings.length,

    blockchainIoTRecords:
      blockchainIoTCount,

    iotRecords:
      iotAudit,

    // Custody

    totalCustodyRecords:
      custodyHistory.length,

    custodyHistory,

    // Verification

    allIoTVerified,

    overallStatus,

  };

}

module.exports = {
  getOrganAuditTrail,
};