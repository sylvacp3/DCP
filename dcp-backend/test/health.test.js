const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');

const app = require('../src/app');

test('GET /api/health retourne un statut ok', async (t) => {
  const server = http.createServer(app);

  await new Promise((resolve) => {
    server.listen(0, '127.0.0.1', resolve);
  });

  t.after(() => {
    return new Promise((resolve) => server.close(resolve));
  });

  const address = server.address();
  const response = await fetch(
    `http://127.0.0.1:${address.port}/api/health`
  );

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: 'ok' });
});
