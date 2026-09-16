import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { once } from 'node:events';
import test from 'node:test';
import { startServer } from './smoke.mjs';

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

for (const scenario of ['status stale', 'body stale', 'message stale', 'persistent stale', 'generic 504', 'invalid module', '404 stale']) {
  test(scenario, { timeout: 20000 }, async () => {
    let staleRequests = 0;
    let pageLoads = 0;
    const server = createServer((req, res) => {
      if (req.url.startsWith('/entry.js')) {
        res.setHeader('Content-Type', 'text/javascript');
        res.end('import "/dep.js";');
        return;
      }
      if (req.url === '/dep.js') {
        staleRequests++;
        res.setHeader('Content-Type', 'text/javascript');
        if (scenario === 'invalid module') return res.end('export const broken = ;');
        if (staleRequests === 1 || ['persistent stale', 'generic 504'].includes(scenario)) {
          res.statusCode = 504;
          if (scenario === 'status stale') res.statusMessage = 'Outdated Optimize Dep';
          res.end(scenario === 'generic 504' ? 'Gateway Timeout'
            : scenario === 'message stale' ? 'There is a new version of the pre-bundle for "/dep.js", a page reload is going to ask for it.'
            : scenario === 'status stale' ? '' : 'ERR_OUTDATED_OPTIMIZED_DEP');
          return;
        }
        res.end('export const valid = true;');
        return;
      }
      pageLoads++;
      const missing = req.url === '/__smoke_missing_page__';
      res.statusCode = missing ? 404 : 200;
      res.setHeader('Content-Type', 'text/html');
      const script = scenario !== '404 stale' || missing
        ? `<script type="module" src="/entry.js?v=${pageLoads}"></script>` : '';
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
      const fails = ['persistent stale', 'generic 504', 'invalid module'].includes(scenario);
      assert.equal(code, fails ? 1 : 0, output);
      assert.equal(staleRequests, scenario === 'persistent stale' ? 3 : fails ? 1 : 2, output);
      if (scenario === 'persistent stale') assert.equal(pageLoads, 3);
      if (!fails) assert.match(output, /Smoke check passed/);
      if (scenario === 'generic 504') assert.match(output, /expected HTTP 200, got 504/);
      if (scenario === 'invalid module') assert.match(output, /Invalid browser JavaScript/);
      if (fails && scenario !== 'persistent stale') assert.doesNotMatch(output, /Retrying/);
      // --url never owns (or stops) the external server.
      assert.equal((await fetch(`http://127.0.0.1:${server.address().port}/`)).status, 200);
    } finally {
      server.closeAllConnections();
      await new Promise(resolve => server.close(resolve));
    }
  });
}

test('owned server stops after success and escalates unresponsive shutdown', async () => {
  for (const stubborn of [false, true]) {
    const handle = await startServer({
      argv: ['-e', `${stubborn ? "process.on('SIGTERM', () => {});" : ''}
        console.log('Local http://127.0.0.1:5055/');
        setInterval(() => {}, 1000);`],
      killTimeout: 100,
    });
    await handle.stop();
    await handle.stop();
    assert.throws(() => process.kill(handle.pid, 0), { code: 'ESRCH' });
  }
});

test('startup failures clean up and remove signal listeners', async () => {
  const before = process.listenerCount('SIGTERM');
  for (const source of [
    "console.log('Port 5055 is already in use'); setInterval(() => {}, 1000);",
    "console.log('Local http://127.0.0.1:5056/'); setInterval(() => {}, 1000);",
    'process.exit(1)',
  ]) {
    await assert.rejects(startServer({
      argv: ['-e', `console.log('PID=' + process.pid); ${source}`], readyTimeout: 500, killTimeout: 100,
    }), error => {
      assert.match(error.message, /busy|did not become ready|exited/);
      const pid = Number(error.message.match(/PID=(\d+)/)?.[1]);
      assert.ok(pid, error.message);
      assert.throws(() => process.kill(pid, 0), { code: 'ESRCH' });
      return true;
    });
  }
  await assert.rejects(startServer({ command: '/nonexistent-smoke-command', readyTimeout: 500 }), /ENOENT/);
  assert.equal(process.listenerCount('SIGTERM'), before);
});

test('interrupt cleans up owned child without touching external servers', { timeout: 10000 }, async () => {
  const child = spawn(process.execPath, ['--input-type=module', '-e', `
    import { startServer } from './scripts/smoke.mjs';
    const handle = await startServer({
      argv: ['-e', "console.log('Local http://127.0.0.1:5055/'); setInterval(() => {}, 1000);"]
    });
    console.log('OWNED=' + handle.pid);
  `]);
  let output = '';
  const exited = once(child, 'exit');
  try {
    const pid = await new Promise((resolve, reject) => {
      child.stdout.on('data', chunk => {
        output += chunk;
        const match = output.match(/OWNED=(\d+)/);
        if (match) resolve(Number(match[1]));
      });
      child.on('error', reject);
      child.on('exit', () => reject(new Error(`Exited before readiness: ${output}`)));
    });
    child.kill('SIGTERM');
    assert.equal((await exited)[0], 143);
    assert.throws(() => process.kill(pid, 0), { code: 'ESRCH' });
  } finally {
    if (child.exitCode === null) child.kill('SIGTERM');
  }
});