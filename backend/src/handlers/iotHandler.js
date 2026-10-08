const {
  recordReading,
  getOrganReadings,
} = require("../services/iotService");

async function recordReadingHandler(req, res) {
  try {
    const reading = await recordReading(req.body);

    res.status(201).json({
      success: true,
      message: "IoT reading recorded successfully",
      data: reading,
    });
  } catch (error) {
    console.error("IoT Error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

function getOrganReadingsHandler(req, res) {
  try {
    const readings = getOrganReadings(req.params.organId);

    res.status(200).json({
      success: true,
      data: readings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

module.exports = {
  recordReadingHandler,
  getOrganReadingsHandler,
};