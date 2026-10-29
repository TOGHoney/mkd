const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const workspaceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Workspace name is required'],
    trim: true
  },
  owner_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  api_key: {
    type: String,
    unique: true,
    default: () => `sk_live_${uuidv4().replace(/-/g, '')}`
  },
  widget_key: {
    type: String,
    unique: true,
    index: true,
    default: () => `wk_live_${uuidv4().replace(/-/g, '')}`
  },
  allowed_domains: {
    type: [String],
    default: ['*']
  },
  widget_settings: {
    bot_name: {
      type: String,
      default: 'SuperMemory AI'
    },
    primary_color: {
      type: String,
      default: '#2563EB'
    },
    welcome_message: {
      type: String,
      default: 'Hi there! How can I help you today?'
    },
    position: {
      type: String,
      enum: ['bottom-right', 'bottom-left'],
      default: 'bottom-right'
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Workspace = mongoose.models.Workspace || mongoose.model('Workspace', workspaceSchema);

module.exports = Workspace;
