import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { once } from 'node:events';
import test from 'node:test';

for (const scenario of ['healthy', 'route failure', 'transform failure', 'invalid inline TypeScript']) {
  test(scenario, async () => {
    const server = createServer((req, res) => {
      res.setHeader('Content-Type', 'text/html');
      if (req.url === '/__smoke_missing_page__') res.statusCode = 404;
      if (scenario === 'route failure' && req.url === '/about') res.statusCode = 500;
      if (req.url === '/broken.js') {
        res.statusCode = 500;
        res.end('Transform failed: unexpected token');
        return;
      }
      const script = scenario === 'transform failure'
        ? '<script type="module" src="/broken.js"></script>'
        : scenario === 'invalid inline TypeScript'
          ? '<script>const element = document.body as HTMLElement;</script>'
          : '<script type="module">const valid = true;</script>';
      res.end(`<html><body>${script}</body></html>`);
    });
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    try {
      const child = spawn(process.execPath, [
        '--experimental-vm-modules', '--disable-warning=ExperimentalWarning',
        'scripts/smoke.mjs', '--url', `http://127.0.0.1:${server.address().port}`,
      ]);
      let output = '';
      child.stdout.on('data', chunk => { output += chunk; });
      child.stderr.on('data', chunk => { output += chunk; });
      const [code] = await once(child, 'exit');
      assert.equal(code, scenario === 'healthy' ? 0 : 1, output);
      const expected = {
        healthy: /Smoke check passed/,
        'route failure': /\/about: expected HTTP 200, got 500/,
        'transform failure': /\/broken.js: expected HTTP 200, got 500/,
        'invalid inline TypeScript': /Invalid inline browser JavaScript/,
      };
      assert.match(output, expected[scenario]);
    } finally {
      server.closeAllConnections();
      await new Promise(resolve => server.close(resolve));
    }
  });
}