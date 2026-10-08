const { ethers } = require("ethers");
const path = require("path");

// ========================================
// BLOCKCHAIN PROVIDER
// ========================================

// Connect to local Ganache
const provider = new ethers.JsonRpcProvider(
  process.env.BLOCKCHAIN_RPC_URL
);

// ========================================
// LOAD SMART CONTRACT ABI
// ========================================

const contractArtifact = require(
  path.join(
    __dirname,
    "../../../blockchain/build/TransplantChain.json"
  )
);

// ========================================
// ENVIRONMENT VALIDATION
// ========================================

console.log(
  "Contract address:",
  JSON.stringify(process.env.CONTRACT_ADDRESS)
);

console.log(
  "Valid contract address:",
  ethers.isAddress(process.env.CONTRACT_ADDRESS)
);

if (!process.env.CONTRACT_ADDRESS) {
  throw new Error(
    "CONTRACT_ADDRESS is missing from .env"
  );
}

if (!ethers.isAddress(process.env.CONTRACT_ADDRESS)) {
  throw new Error(
    `Invalid CONTRACT_ADDRESS: ${process.env.CONTRACT_ADDRESS}`
  );
}

if (!process.env.BLOCKCHAIN_PRIVATE_KEY) {
  throw new Error(
    "BLOCKCHAIN_PRIVATE_KEY is missing from .env"
  );
}

// ========================================
// WALLET
// ========================================

const wallet = new ethers.Wallet(
  process.env.BLOCKCHAIN_PRIVATE_KEY,
  provider
);

// ========================================
// FRESH NONCE HELPER
// ========================================

async function getFreshNonce() {
  try {
    /*
     * Ask Ganache directly for the latest confirmed
     * transaction count.
     *
     * This avoids ethers using a stale cached nonce.
     */
    const nonceHex = await provider.send(
      "eth_getTransactionCount",
      [
        wallet.address,
        "latest"
      ]
    );

    const nonce = parseInt(nonceHex, 16);

    console.log(
      `🔢 Fresh blockchain nonce: ${nonce}`
    );

    return nonce;

  } catch (error) {

    console.error(
      "❌ Failed to get fresh nonce:",
      error.message
    );

    throw error;
  }
}

// ========================================
// SMART CONTRACT INSTANCE
// ========================================

const transplantChainContract = new ethers.Contract(
  process.env.CONTRACT_ADDRESS,
  contractArtifact.abi,
  wallet
);

// ========================================
// TEST BLOCKCHAIN CONNECTION
// ========================================

async function testBlockchainConnection() {
  try {

    const blockNumber =
      await provider.getBlockNumber();

    console.log(
      `⛓️ Blockchain connected successfully. Current block: ${blockNumber}`
    );

    console.log(
      `📄 Using contract: ${await transplantChainContract.getAddress()}`
    );

    console.log(
      `👛 Wallet address: ${wallet.address}`
    );

    const nonce =
      await getFreshNonce();

    console.log(
      `🔢 Current wallet nonce: ${nonce}`
    );

  } catch (error) {

    console.error(
      "❌ Blockchain connection failed:",
      error.message
    );

  }
}


// ========================================
// ORGAN REGISTRATION FUNCTIONS
// ========================================

async function registerOrganOnBlockchain(
  organId,
  organHash
) {
  try {

    const nonce =
      await getFreshNonce();

    console.log(
      `🔢 Organ registration nonce: ${nonce}`
    );

    const transaction =
      await transplantChainContract.registerOrgan(
        organId,
        organHash,
        {
          nonce: nonce
        }
      );

    console.log(
      `⛓️ Organ registration transaction sent: ${transaction.hash}`
    );

    const receipt =
      await transaction.wait();

    console.log(
      `✅ Organ registered on blockchain. Block: ${receipt.blockNumber}`
    );

    return {
      transactionHash: transaction.hash,
      blockNumber: receipt.blockNumber,
    };

  } catch (error) {

    console.error(
      "❌ Failed to register organ on blockchain:",
      error.message
    );

    throw error;
  }
}


async function getOrganRegistrationFromBlockchain(
  organId
) {
  try {

    const record =
      await transplantChainContract.getOrganRegistration(
        organId
      );

    // If organ does not exist,
    // Solidity returns empty/default values
    if (!record[0]) {
      return null;
    }

    return {
      organId: record[0],
      organHash: record[1],
      timestamp: Number(record[2]),
    };

  } catch (error) {

    console.error(
      "❌ Failed to get organ registration:",
      error.message
    );

    throw error;
  }
}


// ========================================
// IoT HASH FUNCTIONS
// ========================================

async function recordIoTHashOnBlockchain(
  organId,
  dataHash
) {
  try {

    /*
     * Get the latest confirmed nonce directly
     * from Ganache.
     */
    const nonce =
      await getFreshNonce();

    console.log(
      `🔢 IoT transaction nonce: ${nonce}`
    );

    const transaction =
      await transplantChainContract.recordIoTHash(
        organId,
        dataHash,
        {
          nonce: nonce
        }
      );

    console.log(
      `⛓️ IoT blockchain transaction sent: ${transaction.hash}`
    );

    /*
     * Wait until Ganache mines the transaction
     * before allowing the next blockchain write.
     */
    const receipt =
      await transaction.wait();

    console.log(
      `✅ IoT hash recorded on blockchain. Block: ${receipt.blockNumber}`
    );

    return {
      transactionHash: transaction.hash,
      blockNumber: receipt.blockNumber,
    };

  } catch (error) {

    console.error(
      "❌ Failed to record IoT hash on blockchain:",
      error.message
    );

    throw error;
  }
}


async function getIoTRecordCountFromBlockchain(
  organId
) {
  try {

    const count =
      await transplantChainContract.getIoTRecordCount(
        organId
      );

    return Number(count);

  } catch (error) {

    console.error(
      "❌ Failed to get IoT record count:",
      error.message
    );

    throw error;
  }
}


async function getIoTRecordFromBlockchain(
  organId,
  index
) {
  try {

    const record =
      await transplantChainContract.getIoTRecord(
        organId,
        index
      );

    return {
      organId: record[0],
      dataHash: record[1],
      timestamp: Number(record[2]),
      recordIndex: index,
    };

  } catch (error) {

    console.error(
      "❌ Failed to get IoT record:",
      error.message
    );

    throw error;
  }
}


async function getLatestIoTHashFromBlockchain(
  organId
) {
  try {

    const count =
      await getIoTRecordCountFromBlockchain(
        organId
      );

    if (count === 0) {
      return null;
    }

    const latestRecord =
      await transplantChainContract.getIoTRecord(
        organId,
        count - 1
      );

    return {
      organId: latestRecord[0],
      dataHash: latestRecord[1],
      timestamp: Number(latestRecord[2]),
      recordIndex: count - 1,
    };

  } catch (error) {

    console.error(
      "❌ Failed to get latest IoT hash:",
      error.message
    );

    throw error;
  }
}


// ========================================
// CHAIN OF CUSTODY FUNCTIONS
// ========================================

async function recordCustodyEventOnBlockchain(
  organId,
  location,
  custodian,
  status
) {
  try {

    /*
     * Get a NEW nonce after the IoT transaction
     * has already been confirmed.
     */
    const nonce =
      await getFreshNonce();

    console.log(
      `🔢 Custody transaction nonce: ${nonce}`
    );

    const transaction =
      await transplantChainContract.recordCustodyEvent(
        organId,
        location,
        custodian,
        status,
        {
          nonce: nonce
        }
      );

    console.log(
      `📦 Custody transaction sent: ${transaction.hash}`
    );

    /*
     * Wait for confirmation before returning.
     */
    const receipt =
      await transaction.wait();

    console.log(
      `✅ Custody event recorded on blockchain. Block: ${receipt.blockNumber}`
    );

    return {
      transactionHash: transaction.hash,
      blockNumber: receipt.blockNumber,
    };

  } catch (error) {

    console.error(
      "❌ Failed to record custody event:",
      error.message
    );

    throw error;
  }
}


async function getCustodyRecordCountFromBlockchain(
  organId
) {
  try {

    const count =
      await transplantChainContract.getCustodyRecordCount(
        organId
      );

    return Number(count);

  } catch (error) {

    console.error(
      "❌ Failed to get custody record count:",
      error.message
    );

    throw error;
  }
}


async function getCustodyRecordFromBlockchain(
  organId,
  index
) {
  try {

    const record =
      await transplantChainContract.getCustodyRecord(
        organId,
        index
      );

    return {
      location: record[0],
      custodian: record[1],
      status: record[2],
      timestamp: Number(record[3]),
      recordIndex: index,
    };

  } catch (error) {

    console.error(
      "❌ Failed to get custody record:",
      error.message
    );

    throw error;
  }
}


// ========================================
// EXPORTS
// ========================================

module.exports = {

  provider,
  wallet,
  transplantChainContract,

  // Connection
  testBlockchainConnection,

  // Nonce
  getFreshNonce,

  // Organ Registration
  registerOrganOnBlockchain,
  getOrganRegistrationFromBlockchain,

  // IoT
  recordIoTHashOnBlockchain,
  getIoTRecordCountFromBlockchain,
  getIoTRecordFromBlockchain,
  getLatestIoTHashFromBlockchain,

  // Chain of Custody
  recordCustodyEventOnBlockchain,
  getCustodyRecordCountFromBlockchain,
  getCustodyRecordFromBlockchain,

};