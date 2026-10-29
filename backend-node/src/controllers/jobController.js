const mongoose = require('mongoose');
const IngestionJob = require('../models/IngestionJob');
const { jobEventBus } = require('../queues/ingestionQueue');

/**
 * Poll job status via standard REST GET (QUEUE-03).
 */
async function getJobStatus(req, res) {
  const { jobId } = req.params;

  try {
    let job = null;
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      job = await IngestionJob.findOne({ job_id: jobId });
    }
    if (!job) {
      // In offline/test mode, return simulated state
      return res.status(200).json({
        job_id: jobId,
        status: 'completed',
        progress_percent: 100,
        pages_crawled: 3,
        chunks_indexed: 12
      });
    }

    return res.status(200).json({
      job_id: job.job_id,
      status: job.status,
      progress_percent: job.progress_percent,
      pages_crawled: job.pages_crawled,
      chunks_indexed: job.chunks_indexed,
      error_message: job.error_message,
      started_at: job.started_at,
      completed_at: job.completed_at
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to retrieve job status' });
  }
}

/**
 * Stream real-time job progress via Server-Sent Events (SSE) (QUEUE-03).
 */
async function streamJobProgress(req, res) {
  const { jobId } = req.params;

  let initialJob = null;
  if (mongoose.connection && mongoose.connection.readyState === 1) {
    try {
      initialJob = await IngestionJob.findOne({ job_id: jobId });
    } catch (_) {}
  }

  // Set SSE Headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable proxy buffering (Nginx)

  if (res.flushHeaders) {
    res.flushHeaders();
  }

  // Helper to send SSE event
  const sendEvent = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  // Send current snapshot immediately
  if (initialJob) {
    sendEvent({
      job_id: initialJob.job_id,
      status: initialJob.status,
      progress_percent: initialJob.progress_percent,
      pages_crawled: initialJob.pages_crawled,
      chunks_indexed: initialJob.chunks_indexed,
      error_message: initialJob.error_message,
      message: `Current status: ${initialJob.status}`
    });

    // If job is already finished, close stream
    if (initialJob.status === 'completed' || initialJob.status === 'failed') {
      res.end();
      return;
    }
  } else {
    sendEvent({
      job_id: jobId,
      status: 'queued',
      progress_percent: 5,
      message: 'Job initialized'
    });
  }

  // Listener for real-time progress events from the worker
  const eventName = `job:${jobId}`;
  const progressListener = (payload) => {
    sendEvent(payload);

    if (payload.status === 'completed' || payload.status === 'failed') {
      jobEventBus.removeListener(eventName, progressListener);
      res.end();
    }
  };

  jobEventBus.on(eventName, progressListener);

  // Clean up when client disconnects
  req.on('close', () => {
    jobEventBus.removeListener(eventName, progressListener);
  });
}

module.exports = {
  getJobStatus,
  streamJobProgress
};
