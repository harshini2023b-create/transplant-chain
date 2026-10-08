const organs = new Map();

function saveOrgan(organ) {
    organs.set(organ.organId, organ);
    return organ;
}

function getOrganById(organId) {
    return organs.get(organId);
}

module.exports = {
    saveOrgan,
    getOrganById,
};