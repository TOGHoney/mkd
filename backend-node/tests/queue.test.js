process.env.NODE_ENV = 'test';
const assert = require('assert');
const { addIngestionJob, jobEventBus } = require('../src/queues/ingestionQueue');
const { executeIngestionTask } = require('../src/queues/ingestionWorker');
const { createSource } = require('../src/controllers/sourceController');
const IngestionJob = require('../src/models/IngestionJob');
const Source = require('../src/models/Source');

async function runQueueTests() {
  console.log('--- Running Plan 03-02 Tests: Ingestion Queue & SSE Stream ---');

  const mockWorkspaceId = '654321098765432109876543';
  const mockSourceId = '123456789012345678901234';
  const testUrl = 'https://docs.example.com/api';

  // Test 1: Ingestion job addition and initial state (QUEUE-01)
  console.log('Test 1: Enqueue ingestion job...');
  let eventCaptured = false;
  let capturedPayload = null;

  const jobId = await addIngestionJob({
    workspaceId: mockWorkspaceId,
    sourceId: mockSourceId,
    url: testUrl,
    maxPages: 10,
    maxDepth: 2
  });

  assert.ok(jobId && jobId.startsWith('job_'), 'addIngestionJob must return job_id with prefix job_');
  console.log(`✓ Enqueued job with ID: ${jobId}`);

  // Test 2: Source creation controller returns HTTP 202 Accepted (QUEUE-01)
  console.log('Test 2: SourceController.createSource responds HTTP 202 Accepted...');
  let resStatus = null;
  let resBody = null;

  // Mock Source.create
  const originalSourceCreate = Source.create;
  Source.create = async function (data) {
    return {
      _id: mockSourceId,
      workspace_id: data.workspace_id,
      name: data.name,
      type: data.type,
      url: data.url,
      status: 'idle'
    };
  };

  try {
    const mockReq = {
      body: {
        name: 'Documentation Guide',
        url: 'https://docs.company.com',
        max_pages: 25,
        max_depth: 2
      },
      workspace: {
        _id: mockWorkspaceId
      }
    };

    const mockRes = {
      status(code) {
        resStatus = code;
        return {
          json(data) {
            resBody = data;
          }
        };
      }
    };

    await createSource(mockReq, mockRes);
    assert.strictEqual(resStatus, 202, 'createSource must return HTTP 202 Accepted');
    assert.strictEqual(resBody.status, 'queued', 'Response status must be queued');
    assert.ok(resBody.job_id && resBody.job_id.startsWith('job_'), 'Response must include job_id');
    assert.ok(resBody.source && resBody.source.url === 'https://docs.company.com', 'Response must include source details');
    console.log('✓ Source creation returned HTTP 202 Accepted with job_id');
  } finally {
    Source.create = originalSourceCreate;
  }

  // Test 3: Worker execution transitions (queued -> crawling -> indexing -> completed) (QUEUE-02)
  console.log('Test 3: Worker execution lifecycle transitions...');
  const lifecycleEvents = [];
  const testWorkerJobId = `job_test_${Date.now()}`;

  const listener = (event) => {
    lifecycleEvents.push(event);
  };
  jobEventBus.on(`job:${testWorkerJobId}`, listener);

  const workerResult = await executeIngestionTask({
    jobId: testWorkerJobId,
    workspaceId: mockWorkspaceId,
    sourceId: mockSourceId,
    url: 'https://example.com/docs',
    maxPages: 10,
    maxDepth: 2
  });

  jobEventBus.removeListener(`job:${testWorkerJobId}`, listener);

  assert.strictEqual(workerResult.status, 'completed', 'Worker should complete successfully');
  assert.ok(workerResult.pagesCrawled >= 1, 'Should record pages crawled');
  assert.ok(workerResult.chunksIndexed >= 1, 'Should record chunks indexed');

  const statuses = lifecycleEvents.map((e) => e.status);
  assert.ok(statuses.includes('crawling'), 'Worker must emit crawling event');
  assert.ok(statuses.includes('indexing'), 'Worker must emit indexing event');
  assert.ok(statuses.includes('completed'), 'Worker must emit completed event');
  console.log(`✓ Worker transitioned through: ${statuses.join(' -> ')}`);

  // Test 4: SSE streaming header and formatting validation (QUEUE-03)
  console.log('Test 4: SSE streaming endpoint response structure...');
  const writtenChunks = [];
  const headersSet = {};

  const mockSSEReq = {
    params: { jobId: testWorkerJobId },
    on(event, handler) {}
  };

  const mockSSERes = {
    setHeader(key, val) {
      headersSet[key] = val;
    },
    flushHeaders() {},
    write(chunk) {
      writtenChunks.push(chunk);
    },
    end() {}
  };

  const { streamJobProgress } = require('../src/controllers/jobController');
  await streamJobProgress(mockSSEReq, mockSSERes);

  assert.strictEqual(headersSet['Content-Type'], 'text/event-stream', 'Must set Content-Type text/event-stream');
  assert.ok(headersSet['Cache-Control'].includes('no-cache'), 'Must disable caching');
  assert.strictEqual(headersSet['Connection'], 'keep-alive', 'Connection must be keep-alive');
  assert.ok(writtenChunks.length >= 1, 'Should write initial SSE data chunk');
  assert.ok(writtenChunks[0].startsWith('data: '), 'SSE chunk must start with data: prefix');
  console.log('✓ SSE streaming headers and payload format verified');

  console.log('\n--- ALL PLAN 03-02 TESTS PASSED SUCCESSFULLY ---');
}

runQueueTests().catch((err) => {
  console.error('Queue test failed:', err);
  process.exit(1);
});
