const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  session_id: {
    type: String,
    required: true,
    index: true
  },
  workspace_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    required: true,
    index: true
  },
  user_ip: {
    type: String,
    default: null
  },
  origin: {
    type: String,
    default: null
  },
  messages: [
    {
      role: {
        type: String,
        enum: ['user', 'assistant', 'system'],
        required: true
      },
      content: {
        type: String,
        required: true
      },
      citations: {
        type: [String],
        default: []
      },
      timestamp: {
        type: Date,
        default: Date.now
      }
    }
  ],
  latency_ms: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index to optimize dashboard analytics queries and avoid full table scans
conversationSchema.index({ workspace_id: 1, createdAt: -1 });

const Conversation = mongoose.models.Conversation || mongoose.model('Conversation', conversationSchema);

module.exports = Conversation;
