const { S3Client } = require('@aws-sdk/client-s3');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const dotenv = require('dotenv');

dotenv.config();

const config = {
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  },
  bucketName: process.env.S3_BUCKET_NAME || 'my-bucket'
};

const s3Client = new S3Client({
  region: config.region,
  credentials: config.credentials
});

const dynamoDBClient = new DynamoDBClient({
  region: config.region,
  credentials: config.credentials
});

module.exports = {
  s3Client,
  dynamoDBClient,
  BUCKET_NAME: config.bucketName
};
