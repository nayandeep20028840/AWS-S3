const s3Service = require('../services/s3.service');

class S3Controller {
  async upload(req, res, next) {
    try {
      const { filename, fileContent, contentType } = req.body;

      if (!filename || !fileContent) {
        return res.status(400).json({
          error: 'Missing filename or fileContent'
        });
      }

      const result = await s3Service.uploadContent(filename, fileContent, contentType);

      res.status(201).json({
        message: 'File uploaded successfully',
        filename,
        etag: result.ETag,
        versionId: result.VersionId || null
      });
    } catch (error) {
      next(error);
    }
  }

  async read(req, res, next) {
    try {
      const { filename } = req.params;
      const response = await s3Service.getObject(filename);

      const chunks = [];
      for await (const chunk of response.Body) {
        chunks.push(chunk);
      }

      const fileContent = Buffer.concat(chunks).toString('utf-8');

      res.json({
        filename,
        content: fileContent,
        contentType: response.ContentType,
        lastModified: response.LastModified,
        metadata: response.Metadata
      });
    } catch (error) {
      if (error.name === 'NoSuchKey') {
        return res.status(404).json({ error: 'File not found' });
      }
      next(error);
    }
  }

  async list(req, res, next) {
    try {
      const { prefix = '', maxKeys = 100 } = req.query;
      const response = await s3Service.listObjects(prefix, maxKeys);

      const files = (response.Contents || []).map(obj => ({
        key: obj.Key,
        size: obj.Size,
        lastModified: obj.LastModified,
        etag: obj.ETag,
        storageClass: obj.StorageClass
      }));

      res.json({
        bucket: response.Name,
        prefix,
        fileCount: files.length,
        files,
        isTruncated: response.IsTruncated,
        nextContinuationToken: response.NextContinuationToken
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const { filename } = req.params;
      const { fileContent, contentType } = req.body;

      if (!fileContent) {
        return res.status(400).json({ error: 'Missing fileContent' });
      }

      const result = await s3Service.uploadContent(filename, fileContent, contentType);

      res.json({
        message: 'File updated successfully',
        filename,
        etag: result.ETag,
        versionId: result.VersionId || null
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const { filename } = req.params;
      const result = await s3Service.deleteObject(filename);

      res.json({
        message: 'File deleted successfully',
        filename,
        deleteMarker: result.DeleteMarker || false,
        versionId: result.VersionId || null
      });
    } catch (error) {
      next(error);
    }
  }

  async getPresignedUrl(req, res, next) {
    try {
      const { filename } = req.params;
      const { expiresIn = 3600 } = req.query;

      const url = await s3Service.generatePresignedUrl(filename, parseInt(expiresIn, 10));

      res.json({
        filename,
        expiresIn: parseInt(expiresIn, 10),
        url
      });
    } catch (error) {
      next(error);
    }
  }
  
  async getPresignedUploadUrl(req, res, next) {
    try {
      const { filename } = req.params;
      const { expiresIn = 3600, contentType = 'application/octet-stream' } = req.query;
      // console.log("This is filename: -> ",filename);
      const url = await s3Service.generatePresignedUploadUrl(filename, contentType, parseInt(expiresIn, 10));
      // console.log("This is URL: -> ",url);
      res.json({
        filename,
        action: 'upload',
        expiresIn: parseInt(expiresIn, 10),
        contentType,
        url
      });
    } catch (error) {
      next(error);
    }
  }

  async getPresignedDeleteUrl(req, res, next) {
    try {
      const { filename } = req.params;
      const { expiresIn = 3600 } = req.query;

      const url = await s3Service.generatePresignedDeleteUrl(filename, parseInt(expiresIn, 10));

      res.json({
        filename,
        action: 'delete',
        expiresIn: parseInt(expiresIn, 10),
        url
      });
    } catch (error) {
      next(error);
    }
  }

  async customUploadFlow(req, res, next) {
    try {
      const { filename, fileContent, contentType } = req.body;

      if (!filename || !fileContent) {
        return res.status(400).json({
          error: 'Missing filename or fileContent'
        });
      }

      const dynamodbService = require('../services/dynamodb.service');
      const { BUCKET_NAME } = require('../config/aws.config');

      // 1. Generate Presigned Upload URL
      const uploadUrl = await s3Service.generatePresignedUploadUrl(filename, contentType);

      // 2. Use the URL to upload the file (from the backend to S3)
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: Buffer.from(fileContent),
        headers: {
          'Content-Type': contentType || 'application/octet-stream'
        }
      });

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed with status ${uploadResponse.status}`);
      }

      // 3. Write metadata to DynamoDB
      const fileUrl = `https://${BUCKET_NAME}.s3.amazonaws.com/${filename}`;
      await dynamodbService.saveMetadata(filename, fileUrl);

      // 4. Return Success
      res.json({
        message: 'File uploaded via presigned URL and database updated successfully!',
        filename,
        fileUrl
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new S3Controller();
