const {
  getOrganAuditTrail,
} = require("../services/auditService");


async function getOrganAuditTrailHandler(req, res) {
  try {
    const { organId } = req.params;

    const auditTrail =
      await getOrganAuditTrail(organId);

    res.status(200).json({
      success: true,
      data: auditTrail,
    });

  } catch (error) {

    console.error(
      "Audit Trail Error:",
      error
    );

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}


module.exports = {
  getOrganAuditTrailHandler,
};