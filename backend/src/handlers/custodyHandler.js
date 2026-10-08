const {
  recordCustodyEvent,
  getCustodyHistory,
} = require("../services/custodyService");


async function recordCustodyEventHandler(req, res) {
  try {

    const {
      organId,
      location,
      custodian,
      status,
    } = req.body;

    if (
      !organId ||
      !location ||
      !custodian ||
      !status
    ) {
      return res.status(400).json({
        success: false,
        message:
          "organId, location, custodian and status are required",
      });
    }

    const event = await recordCustodyEvent({
      organId,
      location,
      custodian,
      status,
    });

    res.status(201).json({
      success: true,
      message: "Custody event recorded successfully",
      data: event,
    });

  } catch (error) {

    console.error(
      "Custody Error:",
      error
    );

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
}


async function getCustodyHistoryHandler(req, res) {

  try {

    const history =
      await getCustodyHistory(
        req.params.organId
      );

    res.status(200).json({
      success: true,
      data: history,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }

}


module.exports = {
  recordCustodyEventHandler,
  getCustodyHistoryHandler,
};