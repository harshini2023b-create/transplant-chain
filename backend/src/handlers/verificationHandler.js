const {
  verifyIoTReading,
} = require("../services/verificationService");


async function verifyIoTReadingHandler(req, res) {

  try {

    const reading = req.body;

    const result =
      await verifyIoTReading(reading);


    res.status(200).json({
      success: true,
      data: result,
    });

  } catch (error) {

    console.error(
      "Verification Error:",
      error
    );

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
}


module.exports = {
  verifyIoTReadingHandler,
};