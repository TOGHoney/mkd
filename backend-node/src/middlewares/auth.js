const jwt = require('jsonwebtoken');
const Workspace = require('../models/Workspace');

const JWT_SECRET = process.env.JWT_SECRET || 'supermemory_jwt_secret_dev_key_2026';

/**
 * Middleware to authenticate requests via Bearer JWT token.
 */
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication token required' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id, email }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Middleware to enforce strict multi-tenant isolation.
 * Verifies that the authenticated user owns or has access to the requested workspace.
 * Rejects cross-tenant attempts with HTTP 403 Forbidden (AUTH-04).
 */
async function requireWorkspaceAccess(req, res, next) {
  const workspaceId =
    req.params.workspaceId ||
    req.body.workspace_id ||
    req.headers['x-workspace-id'] ||
    req.query.workspace_id;

  if (!workspaceId) {
    return res.status(400).json({ error: 'Workspace ID is required' });
  }

  try {
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    // Verify ownership
    if (workspace.owner_id.toString() !== req.user.id.toString()) {
      return res.status(403).json({ error: 'Unauthorized cross-tenant access' });
    }

    req.workspace = workspace;
    next();
  } catch (err) {
    // If invalid ObjectId format, return 400
    if (err.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid workspace ID format' });
    }
    return res.status(500).json({ error: 'Error validating workspace access' });
  }
}

function generateToken(payload, expiresIn = '7d') {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

module.exports = {
  requireAuth,
  requireWorkspaceAccess,
  generateToken,
  JWT_SECRET
};
