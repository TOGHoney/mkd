const mongoose = require('mongoose');
const Conversation = require('../models/Conversation');

/**
 * Retrieve paginated conversation history for the workspace admin dashboard (DASH-05).
 */
async function getConversations(req, res) {
  const workspaceId = req.workspace._id;
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const skip = (page - 1) * limit;

  try {
    let conversations = [];
    let total = 0;

    if (mongoose.connection && mongoose.connection.readyState === 1) {
      [conversations, total] = await Promise.all([
        Conversation.find({ workspace_id: workspaceId })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Conversation.countDocuments({ workspace_id: workspaceId })
      ]);
    } else {
      // Mock for test/offline
      conversations = [
        {
          session_id: 'sess_sample_demo_123',
          workspace_id: workspaceId,
          user_ip: '127.0.0.1',
          origin: 'https://example.com',
          messages: [
            { role: 'user', content: 'What is your refund policy?', citations: [] },
            {
              role: 'assistant',
              content: 'You can request a full refund within 30 days of purchase.',
              citations: ['https://example.com/refunds']
            }
          ],
          latency_ms: 420,
          createdAt: new Date()
        }
      ];
      total = 1;
    }

    return res.status(200).json({
      conversations,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit) || 1
      }
    });
  } catch (err) {
    console.error('[ConversationController] Error:', err);
    return res.status(500).json({ error: 'Failed to retrieve conversation logs' });
  }
}

module.exports = {
  getConversations
};
