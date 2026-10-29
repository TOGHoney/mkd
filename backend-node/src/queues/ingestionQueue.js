const { Queue } = require('bullmq');
const { v4: uuidv4 } = require('uuid');
const EventEmitter = require('events');
const mongoose = require('mongoose');
const { getRedisClient } = require('../config/redis');
const IngestionJob = require('../models/IngestionJob');

// Shared event bus for broadcasting job progress to SSE endpoints
const jobEventBus = new EventEmitter();
jobEventBus.setMaxListeners(100);

let bullQueue = null;
const memoryJobQueue = [];

function getIngestionQueue() {
  if (bullQueue) return bullQueue;

  const redis = getRedisClient();
  if (redis && !redis.isFallback && redis.status === 'ready') {
    try {
      bullQueue = new Queue('ingestion-jobs', {
        connection: redis,
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 },
          removeOnComplete: 100,
          removeOnFail: 200
        }
      });
      return bullQueue;
    } catch (err) {
      console.warn(`[BullMQ] Failed to initialize Redis queue: ${err.message}. Using resilient memory queue.`);
    }
  }
  return null;
}

/**
 * Enqueue an ingestion job into BullMQ (or resilient memory queue fallback).
 * Immediately persists record in MongoDB with status: 'queued' and returns job_id (QUEUE-01).
 */
async function addIngestionJob({ workspaceId, sourceId, url, maxPages = 50, maxDepth = 3 }) {
  const jobId = `job_${uuidv4().replace(/-/g, '')}`;

  // 1. Persist initial IngestionJob state in MongoDB if connected
  let jobRecord = null;
  if (mongoose.connection && mongoose.connection.readyState === 1) {
    try {
      jobRecord = await IngestionJob.create({
        job_id: jobId,
        workspace_id: workspaceId,
        source_id: sourceId,
        url,
        status: 'queued',
        progress_percent: 5,
        started_at: new Date()
      });
    } catch (err) {}
  }
    // If MongoDB is offline, create in-memory object
    jobRecord = {
      job_id: jobId,
      workspace_id: workspaceId,
      source_id: sourceId,
      url,
      status: 'queued',
      progress_percent: 5,
      started_at: new Date()
    };

  const jobPayload = {
    jobId,
    workspaceId: workspaceId.toString(),
    sourceId: sourceId.toString(),
    url,
    maxPages,
    maxDepth
  };

  const queue = getIngestionQueue();
  if (queue) {
    await queue.add('crawl-and-index', jobPayload, { jobId });
  } else {
    // Dispatch to local memory worker asynchronously
    memoryJobQueue.push(jobPayload);
    setImmediate(() => processNextMemoryJob());
  }

  jobEventBus.emit(`job:${jobId}`, {
    job_id: jobId,
    status: 'queued',
    progress_percent: 5,
    message: 'Job enqueued and awaiting worker pickup'
  });

  return jobId;
}

// Memory worker processing for development / tests
async function processNextMemoryJob() {
  if (memoryJobQueue.length === 0) return;
  const jobData = memoryJobQueue.shift();
  const { executeIngestionTask } = require('./ingestionWorker');
  try {
    await executeIngestionTask(jobData);
  } catch (err) {
    console.error(`[MemoryWorker] Job ${jobData.jobId} failed:`, err.message);
  }
}

module.exports = {
  getIngestionQueue,
  addIngestionJob,
  jobEventBus,
  memoryJobQueue,
  processNextMemoryJob
};
