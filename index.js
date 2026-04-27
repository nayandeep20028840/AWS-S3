/**
 * AWS S3 CRUD Operations - Node.js Service
 * Entry point for starting the server
 */

const app = require('./src/app');
const { BUCKET_NAME } = require('./src/config/aws.config');

const PORT = process.env.PORT || 3000;
const REGION = process.env.AWS_REGION || 'us-east-1';

const server = app.listen(PORT, () => {
  console.log(`🚀 S3 CRUD Service running on port ${PORT}`);
  console.log(`📦 Bucket: ${BUCKET_NAME}`);
  console.log(`🌍 Region: ${REGION}`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

module.exports = app; // For testing