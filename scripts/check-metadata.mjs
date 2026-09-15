// Asset-specific checks; run after npm run build. Optional URL must serve dist.
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import sharp from 'sharp';

const origin = 'https://thornveil.ai';
const routes = ['/', '/about/', '/cofounder/', '/contact/', '/defense/', '/mycelium/', '/privacy/', '/research/', '/systems/'];
const redirects = { products: '/systems', docs: '/systems', technology: '/systems', dronebane: '/defense' };
const base = process.argv[2];
const assets = new Map();
const titles = new Set();
const descriptions = new Set();
const attr = (tag, name) => tag.match(new RegExp(`\\b${name}="([^"]*)"`))?.[1];
const tags = (html, name) => html.match(new RegExp(`<${name}\\b[^>]*>`, 'g')) || [];
const meta = (html, key) => attr(tags(html, 'meta').find(t => attr(t, 'name') === key || attr(t, 'property') === key) || '', 'content');
const canonical = html => attr(tags(html, 'link').find(t => attr(t, 'rel') === 'canonical') || '', 'href');
async function http(path, type, status = 200) {
  if (!base) return;
  const response = await fetch(new URL(path, base), { redirect: 'manual' });
  assert.equal(response.status, status, path);
  assert.match(response.headers.get('content-type') || '', type, path);
  console.log(`HTTP ${status} ${path}`);
  return response.text();
}
for (const route of [...routes, '/404.html']) {
  const html = await readFile(`dist${route === '/404.html' ? route : `${route}index.html`}`, 'utf8');
  const title = html.match(/<title>(.*?)<\/title>/s)?.[1];
  const description = meta(html, 'description');
  assert.ok(title && description, route);
  assert.ok(!titles.has(title), `Duplicate title: ${route}`);
  assert.ok(!descriptions.has(description), `Duplicate description: ${route}`);
  titles.add(title); descriptions.add(description);
  assert.equal(canonical(html), origin + route);
  for (const [key, value] of Object.entries({ 'og:url': origin + route, 'og:title': title, 'twitter:title': title, 'og:description': description, 'twitter:description': description, 'twitter:card': 'summary_large_image' })) assert.equal(meta(html, key), value, `${route} ${key}`);
  for (const key of ['og:image', 'twitter:image']) {
    const image = new URL(meta(html, key));
    assert.equal(image.origin, origin);
    assets.set(image.pathname, /image\/jpeg/);
  }
  assert.doesNotMatch(html.split('</head>')[0], /localhost|127\.0\.0\.1|\.replit\.(dev|app)/);
  for (const link of tags(html, 'link')) {
    if (!['icon', 'apple-touch-icon', 'manifest'].includes(attr(link, 'rel'))) continue;
    const path = attr(link, 'href');
    assets.set(path, path.endsWith('.png') ? /image\/png/ : /application\/(manifest\+json|json)/);
    if (path.endsWith('.png')) {
      const image = await sharp(`dist${path}`).metadata();
      assert.equal(attr(link, 'sizes'), `${image.width}x${image.height}`);
    }
  }
  for (const link of tags(html, 'a')) {
    const href = attr(link, 'href');
    if (href?.endsWith('.pdf')) {
      assert.ok(href.startsWith('/'), `Unverified external PDF: ${href}`);
      assets.set(href, /application\/pdf/);
    }
  }
  if (route !== '/404.html') await http(route, /text\/html/);
  console.log(`Metadata OK ${route}: ${title}`);
}
const manifest = JSON.parse(await readFile('dist/site.webmanifest', 'utf8'));
for (const icon of manifest.icons) {
  const image = await sharp(`dist${icon.src}`).metadata();
  assert.equal(icon.sizes, `${image.width}x${image.height}`);
  assets.set(icon.src, /image\/png/);
}
const social = await sharp('dist/og-image.jpg').metadata();
assert.equal(social.width, 1200); assert.equal(social.height, 630);
// Include all local papers, not just the links found in HTML.
for (const name of await readdir('dist/papers')) if (name.endsWith('.pdf')) assets.set(`/papers/${name}`, /application\/pdf/);
for (const [path, type] of assets) {
  const data = await readFile(`dist${path}`);
  assert.ok(data.length > 0, path);
  if (path.endsWith('.pdf')) assert.equal(data.subarray(0, 5).toString(), '%PDF-');
  await http(path, type);
}
const sitemapIndex = await readFile('dist/sitemap-index.xml', 'utf8');
assert.ok(sitemapIndex.includes(`${origin}/sitemap-0.xml`));
const sitemap = await readFile('dist/sitemap-0.xml', 'utf8');
assert.deepEqual([...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1]).sort(), routes.map(r => origin + r).sort());
await http('/sitemap-index.xml', /(?:application|text)\/xml/);
await http('/sitemap-0.xml', /(?:application|text)\/xml/);
await http('/robots.txt', /text\/plain/);
for (const [from, to] of Object.entries(redirects)) {
  const html = await readFile(`dist/${from}/index.html`, 'utf8');
  assert.equal(canonical(html), origin + to);
  assert.ok(html.includes(`content="0;url=${to}"`));
  // Astro static output uses HTML refresh redirects, not HTTP 301 responses.
  const served = await http(`/${from}/`, /text\/html/);
  if (served) assert.ok(served.includes(`content="0;url=${to}"`));
}
const missing = await http('/metadata-check-missing-page', /text\/html/, 404);
const recovery = missing || await readFile('dist/404.html', 'utf8');
assert.ok(recovery.includes('Page not found.'));
assert.ok(recovery.includes('href="/"'));
assert.ok(recovery.includes('href="/contact"'));
assert.doesNotMatch(recovery.match(/<main\b[\s\S]*?<\/main>/)?.[0] || '', /\breveal\b/);
console.log(`PASS: ${routes.length} pages, 404, ${assets.size} assets, sitemap and 4 static redirects.`);