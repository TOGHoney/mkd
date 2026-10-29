const express = require('express');
const router = express.Router();
const workspaceController = require('../controllers/workspaceController');
const { requireAuth, requireWorkspaceAccess } = require('../middlewares/auth');

// All workspace routes require standard JWT authentication
router.use(requireAuth);

router.get('/', workspaceController.getWorkspaces);
router.get('/:workspaceId', requireWorkspaceAccess, workspaceController.getWorkspace);
router.patch('/:workspaceId/settings', requireWorkspaceAccess, workspaceController.updateSettings);
router.post('/:workspaceId/rotate-keys', requireWorkspaceAccess, workspaceController.rotateKeys);

module.exports = router;
