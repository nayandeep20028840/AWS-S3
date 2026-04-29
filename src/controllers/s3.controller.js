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
      const { operation = 'getObject', expiresIn = 3600 } = req.query;

      const url = await s3Service.generatePresignedUrl(filename, operation, parseInt(expiresIn, 10));

      res.json({
        filename,
        operation,
        expiresIn: parseInt(expiresIn, 10),
        url
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new S3Controller();
