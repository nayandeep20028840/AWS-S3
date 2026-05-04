const {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command
} = require('@aws-sdk/client-s3');
const { s3Client, BUCKET_NAME } = require('../config/aws.config');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

class S3Service {
  async uploadContent(filename, fileContent, contentType = 'application/octet-stream') {
    const params = {
      Bucket: BUCKET_NAME,
      Key: filename,
      Body: Buffer.from(fileContent),
      ContentType: contentType,
      Metadata: {
        'uploaded-at': new Date().toISOString(),
        'uploaded-by': 'nodejs-service'
      }
    };

    const command = new PutObjectCommand(params);
    return await s3Client.send(command);
  }

  async getObject(filename) {
    const params = {
      Bucket: BUCKET_NAME,
      Key: filename
    };

    const command = new GetObjectCommand(params);
    return await s3Client.send(command);
  }

  async listObjects(prefix = '', maxKeys = 100) {
    const params = {
      Bucket: BUCKET_NAME,
      Prefix: prefix,
      MaxKeys: parseInt(maxKeys)
    };

    const command = new ListObjectsV2Command(params);
    return await s3Client.send(command);
  }

  async deleteObject(filename) {
    const params = {
      Bucket: BUCKET_NAME,
      Key: filename
    };

    const command = new DeleteObjectCommand(params);
    return await s3Client.send(command);
  }

  async generatePresignedUrl(filename, expiresIn = 3600) {
    const params = {
      Bucket: BUCKET_NAME,
      Key: filename
    };

    const command = new GetObjectCommand(params);

    return await getSignedUrl(s3Client, command, { expiresIn });
  }

  async generatePresignedUploadUrl(filename, contentType = 'application/octet-stream', expiresIn = 3600) {
    const params = {
      Bucket: BUCKET_NAME,
      Key: filename,
      ContentType: contentType
    };

    const command = new PutObjectCommand(params);

    return await getSignedUrl(s3Client, command, { expiresIn });
  }

  async generatePresignedDeleteUrl(filename, expiresIn = 3600) {
    const params = {
      Bucket: BUCKET_NAME,
      Key: filename
    };

    const command = new DeleteObjectCommand(params);

    return await getSignedUrl(s3Client, command, { expiresIn });
  }
}

module.exports = new S3Service();
