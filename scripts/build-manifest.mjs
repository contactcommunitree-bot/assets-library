#!/usr/bin/env node
// Walks ./assets/ and produces ./site/assets.json — the manifest the gallery consumes.
//
// Convention:
//   assets/{org}/{type}/{filename}            → asset file
//   assets/{org}/{type}/{filename}.tags.json  → optional sidecar: { "campaigns": [...], "alt": "..." }
//
// Defaults: campaign = ["evergreen"] when no sidecar is provided.
// Output:   site/assets.json with one entry per asset, including the jsDelivr URL.

import { readdir, readFile, writeFile, stat } from 'node:fs/promises';
import { join, extname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const ASSETS_DIR = join(ROOT, 'assets');
const OUT = join(ROOT, 'site', 'assets.json');

const IMAGE_EXT = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.avif']);
const DOC_EXT   = new Set(['.pdf']);

const config = JSON.parse(await readFile(join(ROOT, 'config.json'), 'utf8'));
const orgSet  = new Set(config.taxonomy.organizations.map(o => o.slug));
const typeSet = new Set(config.taxonomy.types.map(t => t.slug));

const { user, repo, branch } = config.github;
const cdnBase = `https://cdn.jsdelivr.net/gh/${user}/${repo}@${branch}`;

async function walk(dir) {
  const out = [];
  let entries;
  try { entries = await readdir(dir, { withFileTypes: true }); }
  catch { return out; }
  for (const e of entries) {
    const full = join(dir, e.name);
    if (e.isDirectory()) out.push(...await walk(full));
    else if (e.isFile() && !e.name.startsWith('.')) out.push(full);
  }
  return out;
}

const all = await walk(ASSETS_DIR);
const manifest = [];

for (const file of all) {
  const rel = file.slice(ROOT.length + 1).replaceAll('\\', '/'); // assets/org/type/file
  const parts = rel.split('/');
  if (parts.length < 4 || parts[0] !== 'assets') continue;

  const org  = parts[1];
  const type = parts[2];
  const name = parts.slice(3).join('/');
  const ext  = extname(name).toLowerCase();

  if (name.endsWith('.tags.json')) continue;       // skip sidecars
  if (!IMAGE_EXT.has(ext) && !DOC_EXT.has(ext)) continue;
  if (!orgSet.has(org) || !typeSet.has(type)) {
    console.warn(`Skipping (unknown org/type): ${rel}`);
    continue;
  }

  // Sidecar lookup
  const sidecarPath = `${file}.tags.json`;
  let sidecar = {};
  try { sidecar = JSON.parse(await readFile(sidecarPath, 'utf8')); } catch {}

  const campaigns = Array.isArray(sidecar.campaigns) && sidecar.campaigns.length
    ? sidecar.campaigns
    : ['evergreen'];

  const stats = await stat(file);
  const slug  = basename(name, ext);

  manifest.push({
    id: rel,
    path: rel,
    url: `${cdnBase}/${rel}`,
    org,
    type,
    campaigns,
    slug,
    filename: name,
    ext: ext.slice(1),
    bytes: stats.size,
    mtime: stats.mtime.toISOString(),
    alt: sidecar.alt ?? slug.replaceAll('-', ' '),
  });
}

manifest.sort((a, b) => b.mtime.localeCompare(a.mtime));

await writeFile(OUT, JSON.stringify({
  generatedAt: new Date().toISOString(),
  cdnBase,
  taxonomy: config.taxonomy,
  count: manifest.length,
  assets: manifest,
}, null, 2));

console.log(`Wrote ${manifest.length} asset(s) → ${OUT}`);
