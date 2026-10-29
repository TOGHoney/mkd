const express = require('express');
const router = express.Router();
const conversationController = require('../controllers/conversationController');
const { requireAuth, requireWorkspaceAccess } = require('../middlewares/auth');

// Protected admin analytics routes
router.use(requireAuth);
router.use(requireWorkspaceAccess);

router.get('/', conversationController.getConversations);

module.exports = router;
