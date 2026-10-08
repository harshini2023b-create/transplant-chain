require("dotenv").config();

const express = require("express");
const cors = require("cors");

// ====================
// Services
// ====================

const {
  testS3Connection,
} = require("./services/s3Service");

const {
  testBlockchainConnection,
} = require("./services/blockchainService");

// ====================
// Organ Handlers
// ====================

const {
  registerOrganHandler,
  getOrganHandler,
} = require("./handlers/organHandler");

// ====================
// IoT Handlers
// ====================

const {
  recordReadingHandler,
  getOrganReadingsHandler,
} = require("./handlers/iotHandler");

// ====================
// Verification Handler
// ====================

const {
  verifyIoTReadingHandler,
} = require("./handlers/verificationHandler");


// audit handler

const {
  getOrganAuditTrailHandler,
} = require("./handlers/auditHandler");

// ====================
// Custody Handler
// ====================



const {
  recordCustodyEventHandler,
  getCustodyHistoryHandler,
} = require("./handlers/custodyHandler");



// ====================
// Express App
// ====================

const app = express();


// ====================
// Middleware
// ====================

app.use(cors());
app.use(express.json());


// ====================
// Organ APIs
// ====================

// Register an organ
app.post(
  "/api/organs",
  registerOrganHandler
);

// Get a specific organ
app.get(
  "/api/organs/:organId",
  getOrganHandler
);


// ====================
// IoT APIs
// ====================

// Add a new IoT reading
app.post(
  "/api/iot/readings",
  recordReadingHandler
);

// Get readings for a specific organ
app.get(
  "/api/iot/readings/:organId",
  getOrganReadingsHandler
);


// ====================
// Verification APIs
// ====================

// Verify an IoT reading against blockchain
app.post(
  "/api/verify",
  verifyIoTReadingHandler
);


// ====================
// Custody APIs
// ====================

// POST: Record a custody event
app.post(
  "/api/custody/events",
  recordCustodyEventHandler
);

// GET: Get custody history for a specific organ
app.get(
  "/api/custody/events/:organId",
  getCustodyHistoryHandler
);

// ====================
// Audit APIs
// ====================

app.get(
  "/api/audit/:organId",
  getOrganAuditTrailHandler
);


// ====================
// Test Route
// ====================

app.get("/", (req, res) => {
  res.json({
    message: "TransplantChain Backend is Running 🚀",
  });
});


// ====================
// Start Server
// ====================

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(
    `🚀 Server running on port ${PORT}`
  );

  await testS3Connection();

  await testBlockchainConnection();
});