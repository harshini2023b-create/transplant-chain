const iotReadings = [];

function saveReading(reading) {
  iotReadings.push(reading);

  return reading;
}

function getReadingsByOrganId(organId) {
  return iotReadings.filter(
    (reading) =>
      reading.organId === organId
  );
}

function getAllReadings() {
  return iotReadings;
}

module.exports = {
  saveReading,
  getReadingsByOrganId,
  getAllReadings,
};