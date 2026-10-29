const mongoose = require('mongoose');

const ingestionJobSchema = new mongoose.Schema({
  job_id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  workspace_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    required: true,
    index: true
  },
  source_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Source',
    required: true,
    index: true
  },
  url: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['queued', 'crawling', 'indexing', 'completed', 'failed'],
    default: 'queued',
    index: true
  },
  progress_percent: {
    type: Number,
    default: 0
  },
  pages_crawled: {
    type: Number,
    default: 0
  },
  chunks_indexed: {
    type: Number,
    default: 0
  },
  error_message: {
    type: String,
    default: null
  },
  started_at: {
    type: Date,
    default: null
  },
  completed_at: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const IngestionJob = mongoose.models.IngestionJob || mongoose.model('IngestionJob', ingestionJobSchema);

module.exports = IngestionJob;
