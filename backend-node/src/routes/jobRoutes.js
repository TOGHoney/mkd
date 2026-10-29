const express = require('express');
const router = express.Router();
const jobController = require('../controllers/jobController');

// Polling endpoint
router.get('/:jobId', jobController.getJobStatus);

// Real-time SSE progress stream
router.get('/:jobId/progress', jobController.streamJobProgress);

module.exports = router;
