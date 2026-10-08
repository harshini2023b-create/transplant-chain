const { registerOrgan, getOrgan } = require("../services/organService");

async function registerOrganHandler(req, res) {
    try {
        const organ = await registerOrgan(req.body);

        res.status(201).json({
            success: true,
            message: "Organ registered successfully",
            data: organ,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}

function getOrganHandler(req, res) {
    try {
        const organ = getOrgan(req.params.organId);

        if (!organ) {
            return res.status(404).json({
                success: false,
                message: "Organ not found",
            });
        }

        res.status(200).json({
            success: true,
            data: organ,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}

module.exports = {
    registerOrganHandler,
    getOrganHandler,
};