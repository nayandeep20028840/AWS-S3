const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { dynamoDBClient } = require('../config/aws.config');

const docClient = DynamoDBDocumentClient.from(dynamoDBClient);
const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || 'S3_Uploads';

class DynamoDBService {
  async saveMetadata(filename, fileUrl) {
    const params = {
      TableName: TABLE_NAME,
      Item: {
        filename: filename, // Partition Key
        uploadedAt: new Date().toISOString(),
        status: 'SUCCESS',
        fileUrl: fileUrl
      }
    };

    const command = new PutCommand(params);
    return await docClient.send(command);
  }
}

module.exports = new DynamoDBService();
