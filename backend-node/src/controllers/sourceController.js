const Source = require('../models/Source');
const { addIngestionJob } = require('../queues/ingestionQueue');

// Check for private / SSRF-prone hostnames
function isRestrictedHost(urlString) {
  try {
    const parsed = new URL(urlString);
    const host = parsed.hostname.toLowerCase();
    if (process.env.NODE_ENV === 'production') {
      if (
        host === 'localhost' ||
        host === '127.0.0.1' ||
        host === '::1' ||
        host.startsWith('192.168.') ||
        host.startsWith('10.') ||
        host.startsWith('172.16.')
      ) {
        return true;
      }
    }
    return false;
  } catch {
    return true;
  }
}

/**
 * Add a new knowledge source and enqueue background ingestion job.
 * Responds immediately with HTTP 202 Accepted (QUEUE-01).
 */
async function createSource(req, res) {
  const { name, url, type = 'website', max_pages = 50, max_depth = 3 } = req.body;
  const workspaceId = req.workspace._id;

  if (!url) {
    return res.status(400).json({ error: 'Source URL is required' });
  }

  // Basic URL validation
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return res.status(400).json({ error: 'URL must begin with http:// or https://' });
  }

  if (isRestrictedHost(url)) {
    return res.status(400).json({ error: 'Private or local IP addresses are not permitted' });
  }

  const sourceName = name && name.trim() ? name.trim() : new URL(url).hostname;

  try {
    // 1. Create Source record
    const source = await Source.create({
      workspace_id: workspaceId,
      name: sourceName,
      type,
      url,
      status: 'idle'
    });

    // 2. Enqueue background crawl job in BullMQ
    const jobId = await addIngestionJob({
      workspaceId,
      sourceId: source._id,
      url,
      maxPages: parseInt(max_pages, 10) || 50,
      maxDepth: parseInt(max_depth, 10) || 3
    });

    // 3. Immediately return HTTP 202 Accepted (QUEUE-01)
    return res.status(202).json({
      message: 'Source created and ingestion job enqueued',
      source: {
        _id: source._id,
        id: source._id,
        workspace_id: source.workspace_id,
        name: source.name,
        type: source.type,
        url: source.url,
        status: source.status,
        pages_count: 0,
        pages_indexed: 0,
        chunks_stored: 0,
        chunks_count: 0,
        createdAt: source.createdAt
      },
      job_id: jobId,
      status: 'queued'
    });
  } catch (err) {
    console.error('[SourceController] Error creating source:', err);
    return res.status(500).json({ error: 'Failed to create source and enqueue job' });
  }
}

/**
 * List all sources for the current workspace.
 */
async function getSources(req, res) {
  try {
    const rawSources = await Source.find({ workspace_id: req.workspace._id }).sort({ createdAt: -1 });
    const sources = rawSources.map(s => {
      const doc = s.toObject ? s.toObject() : { ...s };
      const pages = doc.pages_indexed ?? doc.pages_count ?? 0;
      const chunks = doc.chunks_stored ?? doc.chunks_count ?? (pages > 0 ? pages * 4 : 0);
      return {
        ...doc,
        _id: doc._id || doc.id,
        pages_count: pages,
        pages_indexed: pages,
        chunks_stored: chunks,
        chunks_count: chunks
      };
    });
    return res.status(200).json({ sources });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to retrieve sources' });
  }
}

/**
 * Delete a source from the workspace.
 */
async function deleteSource(req, res) {
  const { id } = req.params;

  try {
    const source = await Source.findOneAndDelete({
      _id: id,
      workspace_id: req.workspace._id
    });

    if (!source) {
      return res.status(404).json({ error: 'Source not found' });
    }

    return res.status(200).json({ message: 'Source deleted successfully', id });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete source' });
  }
}

module.exports = {
  createSource,
  getSources,
  deleteSource
};
