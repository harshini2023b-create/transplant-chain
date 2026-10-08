const {
  S3Client,
  ListBucketsCommand,
  PutObjectCommand,
  ListObjectsV2Command,
  GetObjectCommand,
} = require("@aws-sdk/client-s3");

// ==========================================
// S3 CLIENT
// ==========================================

const s3Client = new S3Client({
  region: process.env.AWS_REGION,

  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// ==========================================
// TEST S3 CONNECTION
// ==========================================

async function testS3Connection() {

  try {

    await s3Client.send(
      new ListBucketsCommand({})
    );

    console.log(
      "✅ AWS S3 Connected Successfully"
    );

  } catch (error) {

    console.error(
      "❌ AWS S3 Connection Failed:",
      error.message
    );

  }

}

// ==========================================
// UPLOAD IOT READING TO S3
// ==========================================

async function uploadIoTReadingToS3(reading) {

  try {

    const key =
      `iot-readings/${reading.organId}-${Date.now()}.json`;

    const command =
      new PutObjectCommand({

        Bucket:
          process.env.AWS_S3_BUCKET,

        Key:
          key,

        Body:
          JSON.stringify(
            reading,
            null,
            2
          ),

        ContentType:
          "application/json",

      });

    await s3Client.send(
      command
    );

    console.log(
      `☁️ IoT reading uploaded to S3: ${key}`
    );

    return key;

  } catch (error) {

    console.error(
      "❌ IoT S3 upload failed:",
      error.message
    );

    throw error;

  }

}

// ==========================================
// GET IOT READINGS FROM S3
// ==========================================

async function getIoTReadingsFromS3(
  organId
) {

  try {

    const prefix =
      `iot-readings/${organId}-`;

    const listCommand =
      new ListObjectsV2Command({

        Bucket:
          process.env.AWS_S3_BUCKET,

        Prefix:
          prefix,

      });

    const listResponse =
      await s3Client.send(
        listCommand
      );

    if (!listResponse.Contents) {

      return [];

    }

    const readings = [];

    for (
      const object of
      listResponse.Contents
    ) {

      const getCommand =
        new GetObjectCommand({

          Bucket:
            process.env.AWS_S3_BUCKET,

          Key:
            object.Key,

        });

      const response =
        await s3Client.send(
          getCommand
        );

      const bodyString =
        await response.Body
          .transformToString();

      readings.push({

        ...JSON.parse(
          bodyString
        ),

        // Include the S3 file key

        s3Key:
          object.Key,

      });

    }

    return readings;

  } catch (error) {

    console.error(
      "❌ Failed to retrieve IoT readings from S3:",
      error.message
    );

    throw error;

  }

}

// ==========================================
// UPLOAD ORGAN TO S3
// ==========================================

async function uploadOrganToS3(
  organ
) {

  try {

    const key =
      `organs/${organ.organId}.json`;

    const command =
      new PutObjectCommand({

        Bucket:
          process.env.AWS_S3_BUCKET,

        Key:
          key,

        Body:
          JSON.stringify(
            organ,
            null,
            2
          ),

        ContentType:
          "application/json",

      });

    await s3Client.send(
      command
    );

    console.log(
      `☁️ Organ registration uploaded to S3: ${key}`
    );

    return key;

  } catch (error) {

    console.error(
      "❌ Organ S3 upload failed:",
      error.message
    );

    throw error;

  }

}

// ==========================================
// UPLOAD CUSTODY EVENT TO S3
// ==========================================

async function uploadCustodyEventToS3(
  custodyEvent
) {

  try {

    const timestamp =
      Date.now();

    const key =
      `custody-events/${custodyEvent.organId}/${timestamp}.json`;

    const command =
      new PutObjectCommand({

        Bucket:
          process.env.AWS_S3_BUCKET,

        Key:
          key,

        Body:
          JSON.stringify(
            custodyEvent,
            null,
            2
          ),

        ContentType:
          "application/json",

      });

    await s3Client.send(
      command
    );

    console.log(
      `☁️ Custody event uploaded to S3: ${key}`
    );

    return key;

  } catch (error) {

    console.error(
      "❌ Custody event S3 upload failed:",
      error.message
    );

    throw error;

  }

}

// ==========================================
// GET CUSTODY EVENTS FROM S3
// ==========================================

async function getCustodyEventsFromS3(
  organId
) {

  try {

    const prefix =
      `custody-events/${organId}/`;

    const listCommand =
      new ListObjectsV2Command({

        Bucket:
          process.env.AWS_S3_BUCKET,

        Prefix:
          prefix,

      });

    const listResponse =
      await s3Client.send(
        listCommand
      );

    if (
      !listResponse.Contents ||
      listResponse.Contents.length === 0
    ) {

      return [];

    }

    const events = [];

    for (
      const object of
      listResponse.Contents
    ) {

      const getCommand =
        new GetObjectCommand({

          Bucket:
            process.env.AWS_S3_BUCKET,

          Key:
            object.Key,

        });

      const response =
        await s3Client.send(
          getCommand
        );

      const bodyString =
        await response.Body
          .transformToString();

      const event =
        JSON.parse(
          bodyString
        );

      events.push({

        ...event,

        // Add S3 key so the audit
        // system knows where this
        // custody event came from

        s3Key:
          object.Key,

      });

    }

    return events;

  } catch (error) {

    console.error(
      "❌ Failed to retrieve custody events from S3:",
      error.message
    );

    throw error;

  }

}

// ==========================================
// EXPORTS
// ==========================================

module.exports = {

  s3Client,

  // Connection

  testS3Connection,

  // Organ

  uploadOrganToS3,

  // IoT

  uploadIoTReadingToS3,

  getIoTReadingsFromS3,

  // Custody

  uploadCustodyEventToS3,

  getCustodyEventsFromS3,

};