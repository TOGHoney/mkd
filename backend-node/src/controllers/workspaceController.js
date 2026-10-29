const { v4: uuidv4 } = require('uuid');
const Workspace = require('../models/Workspace');

/**
 * List all workspaces owned by the user.
 */
async function getWorkspaces(req, res) {
  try {
    const workspaces = await Workspace.find({ owner_id: req.user.id });
    return res.status(200).json({ workspaces });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to retrieve workspaces' });
  }
}

/**
 * Get details of a specific workspace.
 */
async function getWorkspace(req, res) {
  // req.workspace is pre-attached and verified by requireWorkspaceAccess
  return res.status(200).json({ workspace: req.workspace });
}

/**
 * Update allowed_domains or widget_settings.
 */
async function updateSettings(req, res) {
  const { allowed_domains, widget_settings, name } = req.body;
  const workspace = req.workspace;

  try {
    if (name) workspace.name = name;
    if (allowed_domains && Array.isArray(allowed_domains)) {
      workspace.allowed_domains = allowed_domains;
    }
    if (widget_settings && typeof widget_settings === 'object') {
      workspace.widget_settings = {
        ...workspace.widget_settings.toObject(),
        ...widget_settings
      };
    }

    await workspace.save();
    return res.status(200).json({
      message: 'Workspace settings updated successfully',
      workspace
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update workspace settings' });
  }
}

/**
 * Rotate API key or Widget key.
 */
async function rotateKeys(req, res) {
  const { type } = req.body; // 'api_key' or 'widget_key'
  const workspace = req.workspace;

  try {
    if (type === 'api_key') {
      workspace.api_key = `sk_live_${uuidv4().replace(/-/g, '')}`;
    } else if (type === 'widget_key') {
      workspace.widget_key = `wk_live_${uuidv4().replace(/-/g, '')}`;
    } else {
      return res.status(400).json({ error: 'Invalid key type. Specify "api_key" or "widget_key".' });
    }

    await workspace.save();
    return res.status(200).json({
      message: `${type} rotated successfully`,
      api_key: workspace.api_key,
      widget_key: workspace.widget_key
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to rotate key' });
  }
}

module.exports = {
  getWorkspaces,
  getWorkspace,
  updateSettings,
  rotateKeys
};
