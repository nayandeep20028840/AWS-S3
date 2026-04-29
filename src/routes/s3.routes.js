const express = require('express');
const router = express.Router();
const s3Controller = require('../controllers/s3.controller');

router.post('/upload', s3Controller.upload);
router.get('/read/:filename', s3Controller.read);
router.get('/list', s3Controller.list);
router.put('/update/:filename', s3Controller.update);
router.delete('/delete/:filename', s3Controller.delete);
router.get('/presigned-url/:filename', s3Controller.getPresignedUrl);

module.exports = router;
