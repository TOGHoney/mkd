const express = require('express');
const router = express.Router();
const sourceController = require('../controllers/sourceController');
const { requireAuth, requireWorkspaceAccess } = require('../middlewares/auth');

// All source management endpoints require authentication and tenant access
router.use(requireAuth);
router.use(requireWorkspaceAccess);

router.post('/', sourceController.createSource);
router.get('/', sourceController.getSources);
router.delete('/:id', sourceController.deleteSource);

module.exports = router;
