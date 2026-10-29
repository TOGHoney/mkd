const mongoose = require('mongoose');

const sourceSchema = new mongoose.Schema({
  workspace_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: [true, 'Source name is required'],
    trim: true
  },
  type: {
    type: String,
    enum: ['website', 'sitemap', 'pdf', 'faq'],
    default: 'website'
  },
  url: {
    type: String,
    required: [true, 'Source URL is required'],
    trim: true
  },
  status: {
    type: String,
    enum: ['idle', 'crawling', 'indexed', 'failed'],
    default: 'idle',
    index: true
  },
  pages_count: {
    type: Number,
    default: 0
  },
  last_crawled_at: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Source = mongoose.models.Source || mongoose.model('Source', sourceSchema);

module.exports = Source;
