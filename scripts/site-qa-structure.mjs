// Browser structure and interaction evidence for the ten public routes.
//
// This check owns its headless Chromium process. It intentionally uses CDP
// directly so it can run alongside older QA checks without borrowing their
// browser or touching their DevTools ports.
//
// Run with:
//   node scripts/site-qa-structure.mjs
//
// REPLIT_DEV_DOMAIN is required. The browser uses CDP port 9226 and profile
// /tmp/qa-structure. Raw evidence is written to
// docs/site-qa-evidence/structure.json.

import { execFileSync, spawn } from 'node:child_process';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';

const CDP_PORT = 9226;
const PROFILE_DIR = '/tmp/qa-structure';
const OUTPUT = 'docs/site-qa-evidence/structure.json';
const routes = [
  '/', '/systems', '/defense', '/mycelium', '/research',
  '/about', '/cofounder', '/contact', '/privacy', '/404',
];
const viewports = [
  { name: 'mobile-390', width: 390, height: 844, mobile: true, targetMinimum: 44 },
  { name: 'desktop-1280', width: 1280, height: 900, mobile: false, targetMinimum: 24 },
];
const selectedRoutes = (process.env.SITE_QA_ROUTES || routes.join(','))
  .split(',')
  .map((route) => route.trim())
  .filter((route) => routes.includes(route));
const selectedViewports = (process.env.SITE_QA_VIEWPORTS || viewports.map((viewport) => viewport.name).join(','))
  .split(',')
  .map((name) => name.trim())
  .map((name) => viewports.find((viewport) => viewport.name === name))
  .filter(Boolean);
const updateExisting = process.env.SITE_QA_UPDATE_EXISTING === '1';

const domain = process.env.REPLIT_DEV_DOMAIN;
const origin = (process.env.SITE_QA_ORIGIN || (domain ? `https://${domain}` : '')).replace(/\/+$/, '');
if (!origin) throw new Error('REPLIT_DEV_DOMAIN (or SITE_QA_ORIGIN) is required');

function commandPath(name) {
  try {
    return execFileSync('sh', ['-lc', `command -v ${name}`], { encoding: 'utf8' }).trim() || null;
  } catch {
    return null;
  }
}

const chromium = process.env.CHROMIUM_BIN ||
  process.env.REPLIT_PLAYWRIGHT_CHROMIUM_EXECUTABLE ||
  commandPath('chromium') ||
  'chromium';

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function waitForEndpoint(browser) {
  const deadline = Date.now() + 15_000;
  let lastError = '';
  while (Date.now() < deadline) {
    if (browser.exitCode !== null) {
      throw new Error(`Chromium exited before CDP was ready: ${lastError}`);
    }
    try {
      const response = await fetch(`http://127.0.0.1:${CDP_PORT}/json/version`);
      if (response.ok) {
        const version = await response.json();
        if (version.webSocketDebuggerUrl) return version;
      }
      lastError = `HTTP ${response.status}`;
    } catch (error) {
      lastError = error.message;
    }
    await wait(100);
  }
  throw new Error(`Timed out waiting for CDP ${CDP_PORT}: ${lastError}`);
}

async function pageTarget() {
  const response = await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`);
  const targets = await response.json();
  const target = targets.find((item) => item.type === 'page');
  if (!target?.webSocketDebuggerUrl) {
    throw new Error(`Chromium has no page target: ${JSON.stringify(targets)}`);
  }
  return target;
}

function createConnection(webSocketDebuggerUrl) {
  const socket = new WebSocket(webSocketDebuggerUrl);
  const pending = new Map();
  const events = [];
  let sequence = 0;

  socket.addEventListener('message', ({ data }) => {
    const message = JSON.parse(data);
    if (!message.id) {
      events.push(message);
      return;
    }
    const callback = pending.get(message.id);
    if (!callback) return;
    pending.delete(message.id);
    if (message.error) callback.reject(new Error(JSON.stringify(message.error)));
    else callback.resolve(message.result);
  });

  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++sequence;
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });

  const evaluate = async (expression) => {
    const result = await send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
      userGesture: true,
    });
    if (result.exceptionDetails) {
      throw new Error(JSON.stringify(result.exceptionDetails));
    }
    return result.result?.value;
  };

  return { socket, events, send, evaluate };
}

function remoteValue(value) {
  if (!value) return '';
  if (value.value !== undefined) {
    if (typeof value.value === 'string') return value.value;
    try {
      return JSON.stringify(value.value);
    } catch {
      return String(value.value);
    }
  }
  return value.description || value.unserializableValue || value.type || '';
}

function eventConsoleMessages(events) {
  return events
    .filter((event) => event.method === 'Runtime.consoleAPICalled')
    .filter((event) => ['error', 'warning'].includes(event.params?.type))
    .map((event) => {
      const text = (event.params.args || []).map(remoteValue).join(' ');
      const expected = /THREE\.WebGLRenderer|WebGL context|Hero graphics unavailable/i.test(text);
      return {
        type: event.params.type,
        text,
        url: event.params?.stackTrace?.callFrames?.[0]?.url || null,
        line: event.params?.stackTrace?.callFrames?.[0]?.lineNumber ?? null,
        expected,
        category: expected ? 'expected-headless-webgl-fallback' : 'console-error-or-warning',
      };
    });
}

function eventExceptions(events) {
  return events
    .filter((event) => event.method === 'Runtime.exceptionThrown')
    .map((event) => {
      const text = event.params?.exceptionDetails?.exception?.description ||
        event.params?.exceptionDetails?.text ||
        'Uncaught runtime exception';
      const expected = /dev[-_ ]?toolbar|entrypoint\.js|504/i.test(text);
      return {
        text,
        url: event.params?.exceptionDetails?.url || null,
        line: event.params?.exceptionDetails?.lineNumber ?? null,
        column: event.params?.exceptionDetails?.columnNumber ?? null,
        expected,
        category: expected ? 'expected-dev-toolbar-504' : 'runtime-exception',
      };
    });
}

function statusClassification(route, response) {
  const status = response.status;
  const responseURL = response.url || '';
  let category = 'unexpected-http-status';
  let expected = false;

  if (status === 504 && /entrypoint\.js|dev[-_]?toolbar|replit/i.test(responseURL)) {
    category = 'expected-dev-toolbar-504';
    expected = true;
  } else if (
    status === 404 &&
    route === '/404' &&
    response.type === 'Document' &&
    new URL(responseURL).pathname.replace(/\/+$/, '') === '/404'
  ) {
    category = 'expected-404-route';
    expected = true;
  }

  return { expected, category };
}

function eventNetworkIssues(events, route) {
  const requestURLs = new Map(
    events
      .filter((event) => event.method === 'Network.requestWillBeSent')
      .map((event) => [event.params?.requestId, event.params?.request?.url || null])
  );
  const responses = events
    .filter((event) => event.method === 'Network.responseReceived')
    .map((event) => event.params)
    .filter((params) => Number(params?.response?.status) >= 400)
    .map((params) => {
      const response = {
        requestId: params.requestId || null,
        url: params.response.url,
        status: params.response.status,
        type: params.type || null,
        mimeType: params.response.mimeType || null,
      };
      return { ...response, ...statusClassification(route, response) };
    });
  const expectedToolbarRequests = new Set(
    responses
      .filter((response) => response.category === 'expected-dev-toolbar-504')
      .map((response) => response.requestId)
  );
  const failed = events
    .filter((event) => event.method === 'Network.loadingFailed')
    .map((event) => {
      const requestId = event.params?.requestId || null;
      const url = event.params?.url || requestURLs.get(requestId) || null;
      const expectedToolbarAbort = expectedToolbarRequests.has(requestId);
      const expectedAnalyticsAbort = Boolean(event.params?.canceled) &&
        /plausible\.io\/api\/event|@vite\/|\/node_modules\/\.vite\//i.test(url || '');
      return {
        requestId,
        url,
        errorText: event.params?.errorText || null,
        canceled: Boolean(event.params?.canceled),
        expected: expectedToolbarAbort || expectedAnalyticsAbort,
        category: expectedToolbarAbort
          ? 'expected-dev-toolbar-504-abort'
          : expectedAnalyticsAbort
            ? 'expected-navigation-abort'
            : 'network-loading-failed',
      };
    });
  return { responses, failed };
}

function issueSummary(diagnostics) {
  const all = [
    ...diagnostics.console.map((item) => ({ ...item, category: 'console' })),
    ...diagnostics.exceptions.map((item) => ({ ...item, category: 'runtime-exception' })),
    ...diagnostics.network.responses,
    ...diagnostics.network.failed,
  ];
  return {
    total: all.length,
    expected: all.filter((item) => item.expected).length,
    unexpected: all.filter((item) => !item.expected).length,
  };
}

async function main() {
  await mkdir('docs/site-qa-evidence', { recursive: true });
  await rm(PROFILE_DIR, { recursive: true, force: true });
  await mkdir(PROFILE_DIR, { recursive: true });

  const browser = spawn(chromium, [
    '--headless=new',
    '--no-sandbox',
    '--disable-dev-shm-usage',
    `--remote-debugging-port=${CDP_PORT}`,
    `--user-data-dir=${PROFILE_DIR}`,
    '--ignore-certificate-errors',
    '--no-first-run',
    '--no-default-browser-check',
    '--window-size=1280,900',
    'about:blank',
  ], { stdio: ['ignore', 'ignore', 'pipe'] });
  let browserStderr = '';
  browser.stderr.on('data', (chunk) => { browserStderr += chunk.toString(); });

  let connection;
  let priorReport = null;
  if (updateExisting) {
    try {
      priorReport = JSON.parse(await readFile(OUTPUT, 'utf8'));
    } catch (error) {
      throw new Error(`SITE_QA_UPDATE_EXISTING=1 requires readable ${OUTPUT}: ${error.message}`);
    }
  }
  const report = priorReport
    ? {
      ...priorReport,
      updatedAt: new Date().toISOString(),
      updateHistory: [
        ...(priorReport.updateHistory || []),
        { routes: selectedRoutes, viewports: selectedViewports.map((viewport) => viewport.name) },
      ],
      rows: priorReport.rows.filter((row) => !selectedRoutes.includes(row.route) ||
        !selectedViewports.some((viewport) => viewport.name === row.viewport)),
    }
    : {
      schemaVersion: 1,
      capturedAt: new Date().toISOString(),
      completedAt: null,
      origin,
      originKind: 'managed development origin',
      production: false,
      routes,
      viewports,
      browserControl: {
        protocol: 'CDP',
        port: CDP_PORT,
        profile: PROFILE_DIR,
        executable: chromium,
        ownedChromium: true,
        otherDevToolsPortsTouched: [],
      },
      browser: null,
      checks: {
        headingOutline: {
          visibleOnly: true,
          hiddenBranchPolicy: 'display, visibility, opacity, aria-hidden, and client rects are evaluated before headings are counted',
          h1ExpectedPerRoute: 1,
        },
        landmarks: {
          visibleOnly: true,
          requiredVisibleCounts: { header: 1, main: 1, footer: 1 },
          navigationLabels: 'Explicit names are preferred; an unnamed primary navigation is accepted when it is the only unnamed navigation and all other visible navigation landmarks have unique explicit names.',
        },
        skipLink: {
          interaction: 'A real CDP Tab focuses the first skip link; Enter activates its #main-content target.',
          focusVisibility: 'The focused link must have a visible client rect and :focus-visible state.',
        },
        touchTargets: {
          shellOnly: true,
          thresholds: { mobile: 44, desktop: 24 },
          comfortMinimum: 44,
          hiddenBranchPolicy: 'Only visible header/footer links and the mobile menu after it is intentionally opened are measured.',
        },
      },
      rows: [],
    };
  report.selectedRoutes = selectedRoutes;
  report.selectedViewports = selectedViewports.map((viewport) => viewport.name);

  try {
    const endpoint = await waitForEndpoint(browser);
    const target = await pageTarget();
    connection = createConnection(target.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      connection.socket.addEventListener('open', resolve, { once: true });
      connection.socket.addEventListener('error', reject, { once: true });
    });

    const { send, evaluate, events } = connection;
    await send('Page.enable');
    await send('Runtime.enable');
    await send('Network.enable');
    await send('Emulation.setFocusEmulationEnabled', { enabled: true });
    report.browser = await send('Browser.getVersion');

    async function setViewport(viewport) {
      await send('Emulation.setDeviceMetricsOverride', {
        width: viewport.width,
        height: viewport.height,
        deviceScaleFactor: 1,
        mobile: viewport.mobile,
      });
      await send('Emulation.setTouchEmulationEnabled', {
        enabled: viewport.mobile,
        configuration: 'mobile',
      });
    }

    async function pressKey(key, code = key) {
      const keyCode = {
        Tab: 9,
        Enter: 13,
      }[key];
      await send('Input.dispatchKeyEvent', {
        type: 'keyDown',
        key,
        code,
        text: key === 'Enter' ? '\r' : undefined,
        windowsVirtualKeyCode: keyCode,
      });
      await send('Input.dispatchKeyEvent', {
        type: 'keyUp',
        key,
        code,
        windowsVirtualKeyCode: keyCode,
      });
    }

    async function waitForPage() {
      const deadline = Date.now() + 20_000;
      let lastState = '';
      while (Date.now() < deadline) {
        try {
          lastState = await evaluate('document.readyState + ":" + Boolean(document.querySelector("main"))');
          if (lastState === 'complete:true') return;
        } catch {
          // A navigation can replace the execution context between polls.
        }
        await wait(100);
      }
      throw new Error(`Timed out waiting for document/main (${lastState})`);
    }

    async function navigate(route) {
      events.length = 0;
      const navigation = await send('Page.navigate', { url: `${origin}${route}` });
      await waitForPage();
      await wait(900);
      return {
        frameId: navigation?.frameId || null,
        errorText: navigation?.errorText || null,
      };
    }

    async function revealPage() {
      const height = await evaluate('document.documentElement.scrollHeight');
      const viewportHeight = await evaluate('innerHeight');
      for (let top = 0; top < height; top += Math.max(1, viewportHeight * 0.8)) {
        await evaluate(`scrollTo({ top: ${top}, left: 0, behavior: 'instant' })`);
        await wait(120);
      }
      await evaluate('scrollTo({ top: 0, left: 0, behavior: "instant" })');
      await wait(250);
    }

    async function skipLinkCheck() {
      const present = await evaluate(`(() => {
        const link = document.querySelector('.skip-link');
        if (!link) return false;
        window.scrollTo(0, 0);
        link.blur();
        return true;
      })()`);
      if (!present) return { present: false, pass: false, reason: 'skip link is missing' };

      await pressKey('Tab');
      const focused = await evaluate(`(() => {
        const link = document.querySelector('.skip-link');
        if (!link) return null;
        const rect = link.getBoundingClientRect();
        const style = getComputedStyle(link);
        return {
          target: document.activeElement === link ? '.skip-link' : document.activeElement?.tagName?.toLowerCase() || null,
          focusVisible: link.matches(':focus-visible'),
          visibleRect: rect.width > 0 && rect.height > 0 && rect.top >= -1 && rect.bottom <= innerHeight + 1,
          rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
          transform: style.transform,
          outline: style.outline,
          boxShadow: style.boxShadow,
        };
      })()`);

      await pressKey('Enter');
      await wait(100);
      const activated = await evaluate(`(() => {
        const target = document.getElementById('main-content');
        return {
          hash: location.hash,
          targetExists: Boolean(target),
          activeElement: document.activeElement?.id || document.activeElement?.tagName?.toLowerCase() || null,
          targetTop: target?.getBoundingClientRect().top ?? null,
        };
      })()`);

      return {
        present: true,
        pass: Boolean(
          focused?.target === '.skip-link' &&
          focused.focusVisible &&
          focused.visibleRect &&
          activated.hash === '#main-content' &&
          activated.targetExists
        ),
        focused,
        activated,
      };
    }

    async function evaluateStructure(viewport) {
      return evaluate(`(() => {
        const viewportWidth = ${viewport.width};
        const targetMinimum = ${viewport.targetMinimum};
        const hasHiddenAncestor = (element) => {
          for (let node = element; node; node = node.parentElement) {
            const style = getComputedStyle(node);
            if (
              node.hidden ||
              node.getAttribute('aria-hidden') === 'true' ||
              style.display === 'none' ||
              style.visibility === 'hidden' ||
              Number(style.opacity) === 0
            ) return true;
          }
          return false;
        };
        const visible = (element) => {
          if (hasHiddenAncestor(element)) return false;
          return [...element.getClientRects()].some((rect) => rect.width > 0 && rect.height > 0);
        };
        const text = (element) => (element?.textContent || '').replace(/\\s+/g, ' ').trim();
        const labelledByText = (element) => (element?.getAttribute('aria-labelledby') || '')
          .split(/\\s+/)
          .filter(Boolean)
          .map((id) => document.getElementById(id))
          .filter(Boolean)
          .map(text)
          .filter(Boolean)
          .join(' ');
        const explicitName = (element) => {
          const ariaLabel = element?.getAttribute('aria-label')?.trim();
          if (ariaLabel) return { name: ariaLabel, source: 'aria-label' };
          const labelledBy = labelledByText(element);
          if (labelledBy) return { name: labelledBy, source: 'aria-labelledby' };
          const title = element?.getAttribute('title')?.trim();
          if (title) return { name: title, source: 'title' };
          return { name: '', source: null };
        };
        const semanticRole = (element) => {
          const explicitRole = element.getAttribute('role');
          if (explicitRole) return explicitRole.split(/\\s+/)[0];
          return {
            HEADER: 'banner',
            NAV: 'navigation',
            MAIN: 'main',
            ASIDE: 'complementary',
            FOOTER: 'contentinfo',
          }[element.tagName] || null;
        };
        const landmarks = [...document.querySelectorAll(
          'header, nav, main, aside, footer, [role="banner"], [role="navigation"], [role="main"], [role="complementary"], [role="contentinfo"], [role="region"]'
        )]
          .filter(visible)
          .map((element) => {
            const role = semanticRole(element);
            const name = explicitName(element);
            return {
              role,
              name: name.name,
              nameSource: name.source,
              id: element.id || null,
              text: text(element).slice(0, 120),
            };
          });
        const headingElements = [...document.querySelectorAll('h1, h2, h3, h4, h5, h6')].filter(visible);
        const headings = headingElements.map((element) => ({
          level: Number(element.tagName.slice(1)),
          tag: element.tagName.toLowerCase(),
          text: text(element),
          id: element.id || null,
        }));
        const skippedLevels = [];
        for (let index = 1; index < headings.length; index += 1) {
          const previous = headings[index - 1];
          const current = headings[index];
          if (current.level > previous.level + 1) {
            skippedLevels.push({
              from: previous.level,
              to: current.level,
              previous: previous.text,
              heading: current.text,
            });
          }
        }
        const shellElements = [
          ...document.querySelectorAll('header a, footer a'),
          ...(viewportWidth < 768 ? [...document.querySelectorAll('#mobile-menu a')] : []),
          ...(document.querySelector('#mobile-toggle') ? [document.querySelector('#mobile-toggle')] : []),
        ].filter((element, index, all) => all.indexOf(element) === index && visible(element));
        const shellTargets = shellElements.map((element) => {
          const rect = element.getBoundingClientRect();
          const name = explicitName(element);
          return {
            tag: element.tagName.toLowerCase(),
            href: element.getAttribute('href'),
            id: element.id || null,
            label: name.name || text(element).slice(0, 100) || element.getAttribute('alt') || '',
            x: Number(rect.x.toFixed(2)),
            y: Number(rect.y.toFixed(2)),
            width: Number(rect.width.toFixed(2)),
            height: Number(rect.height.toFixed(2)),
            minimum: targetMinimum,
            pass: rect.width >= targetMinimum && rect.height >= targetMinimum,
          };
        });
        const spacingDiameter = 24;
        const spacingRadius = spacingDiameter / 2;
        const spacingCollisions = [];
        shellTargets.forEach((target, targetIndex) => {
          if (target.width >= spacingDiameter && target.height >= spacingDiameter) return;
          const centerX = target.x + target.width / 2;
          const centerY = target.y + target.height / 2;
          shellTargets.forEach((other, otherIndex) => {
            if (targetIndex === otherIndex) return;
            const nearestX = Math.max(other.x, Math.min(centerX, other.x + other.width));
            const nearestY = Math.max(other.y, Math.min(centerY, other.y + other.height));
            const distance = Math.hypot(centerX - nearestX, centerY - nearestY);
            if (distance < spacingRadius) {
              spacingCollisions.push({
                type: 'centered-circle-vs-target',
                target: target.label,
                other: other.label,
                distance: Number(distance.toFixed(2)),
              });
            }
          });
        });
        const undersizedTargets = shellTargets.filter(
          (target) => target.width < targetMinimum || target.height < targetMinimum
        );
        const comfortMinimum = 44;
        const underComfortTargets = shellTargets.filter(
          (target) => target.width < comfortMinimum || target.height < comfortMinimum
        );
        const centeredCircleCollisions = [];
        undersizedTargets.forEach((target) => {
          const centerX = target.x + target.width / 2;
          const centerY = target.y + target.height / 2;
          shellTargets.forEach((other) => {
            if (target === other) return;
            const otherCenterX = other.x + other.width / 2;
            const otherCenterY = other.y + other.height / 2;
            const distance = Math.hypot(centerX - otherCenterX, centerY - otherCenterY);
            if (distance < spacingDiameter) {
              centeredCircleCollisions.push({
                type: 'centered-circle-vs-centered-circle',
                target: target.label,
                other: other.label,
                distance: Number(distance.toFixed(2)),
              });
            }
          });
        });
        const allSpacingCollisions = [...spacingCollisions, ...centeredCircleCollisions];
        const strictMinimumPass = undersizedTargets.length === 0;
        const comfortGoalPass = underComfortTargets.length === 0;
        const spacingExceptionPass = allSpacingCollisions.length === 0;
        const touchTargetStatus = !spacingExceptionPass
          ? 'fail'
          : comfortGoalPass
            ? 'pass'
            : 'advisory-under-44-comfort';
        const navLandmarks = landmarks.filter((landmark) => landmark.role === 'navigation');
        const navigationNames = navLandmarks
          .filter((landmark) => landmark.name)
          .map((landmark) => landmark.name);
        const hasUniqueNamedNavigation = new Set(navigationNames).size === navigationNames.length;
        const explicitNavigationLabelsPass = navLandmarks.length > 0 &&
          navLandmarks.every((landmark) => Boolean(landmark.name));
        const navigationDistinguishable = navLandmarks.length > 0 &&
          navLandmarks.filter((landmark) => !landmark.name).length <= 1 &&
          hasUniqueNamedNavigation;
        const requiredCounts = Object.fromEntries(['banner', 'main', 'contentinfo'].map((role) => [
          role,
          landmarks.filter((landmark) => landmark.role === role).length,
        ]));
        return {
          viewport: { width: innerWidth, height: innerHeight, devicePixelRatio },
          headings,
          headingOutline: {
            h1Count: headings.filter((heading) => heading.level === 1).length,
            skippedLevels,
            pass: headings.filter((heading) => heading.level === 1).length === 1 && skippedLevels.length === 0,
          },
          landmarks,
          landmarkCounts: requiredCounts,
          navigation: {
            count: navLandmarks.length,
            labels: navLandmarks,
            unlabeled: navLandmarks.filter((landmark) => !landmark.name),
            explicitLabelsPass: explicitNavigationLabelsPass,
            distinguishable: navigationDistinguishable,
            status: explicitNavigationLabelsPass
              ? 'pass-explicit-labels'
              : navigationDistinguishable
                ? 'pass-unambiguous-unnamed-primary'
                : 'finding-ambiguous-navigation',
            pass: navigationDistinguishable,
          },
          landmarksPass: requiredCounts.banner === 1 &&
            requiredCounts.main === 1 &&
            requiredCounts.contentinfo === 1 &&
            landmarks.filter((landmark) => landmark.role === 'region').every((landmark) => Boolean(landmark.name)),
          shellTargets,
          touchTargets: {
            threshold: targetMinimum,
            comfortMinimum,
            checked: shellTargets.length,
            underComfortTargets,
            underMinimumTargets: undersizedTargets,
            failures: touchTargetStatus === 'fail' ? undersizedTargets : [],
            pass: shellTargets.length > 0 && (strictMinimumPass || spacingExceptionPass),
            status: touchTargetStatus,
            comfortGoalPass,
            spacingException: {
              diameter: spacingDiameter,
              centeredCircles: shellTargets.map((target) => ({
                label: target.label,
                centerX: Number((target.x + target.width / 2).toFixed(2)),
                centerY: Number((target.y + target.height / 2).toFixed(2)),
              })),
              collisions: allSpacingCollisions,
              centeredCircleCollisions,
              pass: spacingExceptionPass,
              note: 'Each undersized target is tested as a centered 24px circle against every other shell target rectangle and centered target circle.',
            },
          },
        };
      })()`);
    }

    for (const viewport of selectedViewports) {
      await setViewport(viewport);
      for (const route of selectedRoutes) {
        const navigation = await navigate(route);
        const skipLink = await skipLinkCheck();

        // The mobile links are intentionally opened before measuring them.
        // Otherwise they are a hidden responsive branch, not a touch target.
        if (viewport.mobile) {
          await evaluate(`document.querySelector('#mobile-toggle')?.click()`);
          await wait(100);
        }
        await revealPage();
        const structure = await evaluateStructure(viewport);
        const network = eventNetworkIssues(events, route);
        const diagnostics = {
          console: eventConsoleMessages(events),
          exceptions: eventExceptions(events),
          network,
        };
        const documentResponses = events
          .filter((event) => event.method === 'Network.responseReceived')
          .map((event) => event.params)
          .filter((params) => params?.type === 'Document')
          .map((params) => ({
            url: params.response.url,
            status: params.response.status,
            mimeType: params.response.mimeType || null,
          }));
        const documentResponse = documentResponses.at(-1) || null;
        const documentStatus = documentResponse?.status ?? null;
        const expected404 = route === '/404' && documentStatus === 404;
        const status = {
          document: documentResponse,
          expected404,
          classification: expected404 ? 'expected-404-route' : 'normal-route-status',
        };
        const row = {
          route,
          viewport: viewport.name,
          navigation,
          status,
          headings: structure.headings,
          headingOutline: structure.headingOutline,
          landmarks: structure.landmarks,
          landmarkCounts: structure.landmarkCounts,
          landmarksPass: structure.landmarksPass,
          navigationLandmarks: structure.navigation,
          skipLink,
          shellTargets: structure.shellTargets,
          touchTargets: structure.touchTargets,
          diagnostics,
          issueSummary: issueSummary(diagnostics),
          pass: Boolean(
            structure.headingOutline.pass &&
            structure.landmarksPass &&
            structure.navigation.pass &&
            skipLink.pass &&
            structure.touchTargets.pass
          ),
        };
        report.rows.push(row);
        await writeFile(OUTPUT, JSON.stringify(report, null, 2));
        console.log(`${viewport.name} ${route}: ${row.pass ? 'PASS' : 'FINDING'} ` +
          `h1=${row.headingOutline.h1Count} skipped=${row.headingOutline.skippedLevels.length} ` +
          `nav=${row.navigationLandmarks.unlabeled.length ? 'unlabeled' : 'labeled'} ` +
          `skip=${row.skipLink.pass ? 'pass' : 'fail'} ` +
          `targets=${row.touchTargets.failures.length} failure/${row.touchTargets.underComfortTargets?.length || 0} under-comfort ` +
          `issues=${row.issueSummary.unexpected} unexpected/${row.issueSummary.expected} expected`);
      }
    }
    if (
      updateExisting &&
      selectedRoutes.length === 1 &&
      selectedRoutes[0] === '/' &&
      selectedViewports.length === 1 &&
      selectedViewports[0].name === 'desktop-1280'
    ) {
      const source = report.rows.find((row) => row.route === '/' && row.viewport === 'desktop-1280');
      if (!source) throw new Error('Targeted desktop shell update did not produce a source row');
      const measuredAt = new Date().toISOString();
      report.touchTargetUpdate = {
        measuredAt,
        sourceRoute: '/',
        viewport: 'desktop-1280',
        appliedTo: 'all desktop-1280 rows because header/footer shell geometry is shared',
        spacingException: source.touchTargets.spacingException,
      };
      report.rows
        .filter((row) => row.viewport === 'desktop-1280')
        .forEach((row) => {
          row.shellTargets = source.shellTargets;
          row.touchTargets = source.touchTargets;
          row.shellGeometryMeasurement = {
            sourceRoute: '/',
            measuredAt,
            sharedShell: true,
          };
        });
    }
    report.checks.landmarks.navigationLabels =
      'Explicit names are preferred; an unnamed primary navigation is accepted when it is the only unnamed navigation and all other visible navigation landmarks have unique explicit names.';
    report.checks.touchTargets.comfortMinimum = 44;
    report.rows.forEach((row) => {
      const navigation = row.navigationLandmarks;
      if (row.landmarksPass === undefined) {
        row.landmarksPass = row.landmarkCounts?.banner === 1 &&
          row.landmarkCounts?.main === 1 &&
          row.landmarkCounts?.contentinfo === 1 &&
          row.landmarks
            ?.filter((landmark) => landmark.role === 'region')
            .every((landmark) => Boolean(landmark.name));
      }
      if (navigation) {
        const names = navigation.labels.filter((landmark) => landmark.name).map((landmark) => landmark.name);
        const explicitLabelsPass = navigation.unlabeled.length === 0;
        const distinguishable = navigation.count > 0 &&
          navigation.unlabeled.length <= 1 &&
          new Set(names).size === names.length;
        row.navigationLandmarks = {
          ...navigation,
          explicitLabelsPass,
          distinguishable,
          status: explicitLabelsPass
            ? 'pass-explicit-labels'
            : distinguishable
              ? 'pass-unambiguous-unnamed-primary'
              : 'finding-ambiguous-navigation',
          pass: distinguishable,
        };
      }
      if (row.touchTargets && !row.touchTargets.underComfortTargets) {
        row.touchTargets = {
          ...row.touchTargets,
          underComfortTargets: row.touchTargets.failures || [],
          status: row.touchTargets.pass ? 'pass' : 'fail',
          comfortGoalPass: row.touchTargets.pass,
        };
      }
      row.pass = Boolean(
        row.headingOutline.pass &&
        row.landmarksPass &&
        row.navigationLandmarks?.pass &&
        row.skipLink.pass &&
        row.touchTargets.pass
      );
    });
    const viewportOrder = new Map(viewports.map((viewport, index) => [viewport.name, index]));
    const routeOrder = new Map(routes.map((route, index) => [route, index]));
    report.rows.sort((left, right) =>
      (viewportOrder.get(left.viewport) - viewportOrder.get(right.viewport)) ||
      (routeOrder.get(left.route) - routeOrder.get(right.route))
    );
    report.completedAt = new Date().toISOString();
    report.summary = {
      rows: report.rows.length,
      passingRows: report.rows.filter((row) => row.pass).length,
      findingRows: report.rows.filter((row) => !row.pass).length,
      unexpectedIssues: report.rows.reduce((sum, row) => sum + row.issueSummary.unexpected, 0),
      expectedIssues: report.rows.reduce((sum, row) => sum + row.issueSummary.expected, 0),
    };
    await writeFile(OUTPUT, JSON.stringify(report, null, 2));
    void endpoint;
  } finally {
    connection?.socket.close();
    browser.kill();
    await new Promise((resolve) => {
      if (browser.exitCode !== null) resolve();
      else browser.once('exit', resolve);
    });
    if (browserStderr && process.env.SITE_QA_DEBUG) console.error(browserStderr);
  }
}

await main();