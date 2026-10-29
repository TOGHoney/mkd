const User = require('../models/User');
const Workspace = require('../models/Workspace');
const { generateToken } = require('../middlewares/auth');

/**
 * Register a new company admin account.
 * Automatically provisions a default workspace and unique widget_key (AUTH-01, AUTH-02).
 */
async function register(req, res) {
  const { email, password } = req.body;
  const name = req.body.name || req.body.company_name;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Company/User name, email, and password are required' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long' });
  }

  try {
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    // 1. Create user
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password
    });

    // 2. Auto-provision default workspace (AUTH-02)
    const workspaceName = req.body.company_name || `${name}'s Workspace`;
    const workspace = await Workspace.create({
      name: workspaceName,
      owner_id: user._id,
      allowed_domains: ['*'],
      widget_settings: {
        bot_name: `${name} AI`,
        primary_color: '#2563EB',
        welcome_message: `Hi there! Ask me anything about ${name}.`,
        position: 'bottom-right'
      }
    });

    // 3. Issue JWT
    const token = generateToken({ id: user._id, email: user.email });

    return res.status(201).json({
      message: 'Account registered and workspace provisioned successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt
      },
      workspace: {
        id: workspace._id,
        _id: workspace._id,
        name: workspace.name,
        widget_key: workspace.widget_key,
        api_key: workspace.api_key,
        allowed_domains: workspace.allowed_domains,
        widget_settings: workspace.widget_settings
      }
    });
  } catch (err) {
    console.error('[Auth] Registration error:', err);
    return res.status(500).json({ error: 'Internal server error during registration' });
  }
}

/**
 * Log in an existing user.
 */
async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Retrieve default workspace
    let workspace = await Workspace.findOne({ owner_id: user._id });
    if (!workspace) {
      // Lazy provision if missing
      workspace = await Workspace.create({
        name: `${user.name}'s Workspace`,
        owner_id: user._id
      });
    }

    const token = generateToken({ id: user._id, email: user.email });

    return res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      },
      workspace: {
        id: workspace._id,
        _id: workspace._id,
        name: workspace.name,
        widget_key: workspace.widget_key,
        api_key: workspace.api_key,
        allowed_domains: workspace.allowed_domains,
        widget_settings: workspace.widget_settings
      }
    });
  } catch (err) {
    console.error('[Auth] Login error:', err);
    return res.status(500).json({ error: 'Internal server error during login' });
  }
}

/**
 * Get currently authenticated user profile and workspaces.
 */
async function getMe(req, res) {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const workspaces = await Workspace.find({ owner_id: user._id });

    return res.status(200).json({
      user,
      workspaces
    });
  } catch (err) {
    return res.status(500).json({ error: 'Error retrieving user profile' });
  }
}

module.exports = {
  register,
  login,
  getMe
};
