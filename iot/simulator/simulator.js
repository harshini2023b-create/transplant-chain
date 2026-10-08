const axios = require("axios");
require("dotenv").config();

// ==========================================
// IOT SENSOR SIMULATOR
// ==========================================

function generateSensorReading(organId) {
  return {
    organId: organId,

    // Simulated organ temperature
    temperature: Number(
      (2 + Math.random() * 6).toFixed(2)
    ),

    // Simulated humidity
    humidity: Number(
      (65 + Math.random() * 20).toFixed(2)
    ),

    // Simulated GPS coordinates
    latitude: Number(
      (12.900000 + Math.random() * 0.100000).toFixed(6)
    ),

    longitude: Number(
      (77.500000 + Math.random() * 0.150000).toFixed(6)
    ),

    timestamp: new Date().toISOString(),

    sensorId: "IOT-SENSOR-001"
  };
}


// ==========================================
// SEND READING TO BACKEND
// ==========================================

async function sendIoTReading(organId) {

  try {

    const reading = generateSensorReading(organId);

    console.log("\nGENERATED IOT READING");
    console.log(reading);

    const response = await axios.post(
      `${process.env.BACKEND_URL}/api/iot/readings`,
      reading
    );

    console.log("\nIOT READING SUCCESSFULLY SENT");
    console.log(JSON.stringify(response.data, null, 2));

  } catch (error) {

    console.error("\nIOT ERROR");

    if (error.response) {
      console.error(error.response.data);
    } else {
      console.error(error.message);
    }

  }

}


// ==========================================
// GET ORGAN ID FROM TERMINAL
// ==========================================

const organId = process.argv[2];

if (!organId) {

  console.log(
    "Usage: node simulator.js ORGAN_ID"
  );

  console.log(
    "Example: node simulator.js ORG-KIDNEY-001"
  );

  process.exit(1);

}


// ==========================================
// START SIMULATOR
// ==========================================

sendIoTReading(organId);