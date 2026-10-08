const crypto = require("crypto");

const {
  saveOrgan,
  getOrganById,
} = require("../repositories/organRepository");

const {
  uploadOrganToS3,
} = require("./s3Service");

const {
  registerOrganOnBlockchain,
} = require("./blockchainService");


async function registerOrgan(organData) {

  // ========================================
  // GENERATE SHA-256 HASH
  // ========================================

  const hash = crypto
    .createHash("sha256")
    .update(JSON.stringify(organData))
    .digest("hex");

  console.log(
    "🔐 Organ SHA-256 Hash:",
    hash
  );


  // ========================================
  // CREATE ORGAN OBJECT
  // ========================================

  const organ = {
    ...organData,
    hash,
    registeredAt: new Date().toISOString(),
  };


  // ========================================
  // SAVE TEMPORARILY IN LOCAL MEMORY
  // ========================================

  saveOrgan(organ);

  console.log(
    "💾 Organ saved in local repository"
  );


  // ========================================
  // UPLOAD ORGAN METADATA TO AWS S3
  // ========================================

  const s3Key =
    await uploadOrganToS3(organ);

  organ.s3Key = s3Key;


  // ========================================
  // STORE HASH ON BLOCKCHAIN
  // ========================================

  const blockchainResult =
    await registerOrganOnBlockchain(
      organ.organId,
      organ.hash
    );

  organ.blockchain = blockchainResult;


  console.log(
    "🎉 Organ registration completed successfully"
  );


  return organ;
}


function getOrgan(organId) {
  return getOrganById(organId);
}


module.exports = {
  registerOrgan,
  getOrgan,
};