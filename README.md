# Asset Library

Public asset depository for tndwwt / CommuniTREE / CSR / Ezone / Art for Awareness / Save-a-Turtle / etc. Browse a gallery at `assets.tndwwt.org`, copy direct CDN URLs, paste into emails. Files served by jsDelivr (GitHub CDN); gallery hosted on Vercel.

## How it works

```
assets/{organization}/{type}/{filename}.{ext}      ← the files
assets/{organization}/{type}/{filename}.tags.json  ← optional sidecar metadata
```

Each file's direct URL is:
```
https://cdn.jsdelivr.net/gh/{GITHUB_USER}/{REPO}@main/assets/{org}/{type}/{filename}.{ext}
```

The gallery reads `site/assets.json` (regenerated on every build/push) and renders a filterable grid.

## Add new assets

1. Drop your file in the right folder: `assets/art4awareness/banner/earth-stories-hero.jpg`
2. (Optional) Add tags: `assets/art4awareness/banner/earth-stories-hero.jpg.tags.json`
   ```json
   { "campaigns": ["earth-stories-2026"], "alt": "Earth Stories 2026 hero banner" }
   ```
3. Commit + push: `git add . && git commit -m "Add hero banner" && git push`
4. Vercel rebuilds the manifest automatically. jsDelivr serves the file at the URL above.

If no sidecar is provided, the asset is tagged `campaigns: ["evergreen"]`.

## Taxonomy

Defined in `config.json`:

- **Organizations:** communitree, csr, ezone, art4awareness, save-a-turtle, fff-makers, littleleaders, tndwwt
- **Asset types:** logo, banner, header, footer, signature, icon, photo, poster, background, button, cta, divider
- **Campaigns:** evergreen, earth-stories-2026, weekly-newsletter, toy-ambassador, vermi-composter, pet-bottle-hero, e-waste-collector, unused-medicine, soil-healer (extend freely — campaigns are open-vocabulary)

To extend, edit `config.json`. New organizations/types need matching folders under `assets/`.

## Local development

```bash
npm run build   # regenerate site/assets.json from current files
npm run dev     # build + serve site/ on http://localhost:5173
```

## Deploy

The gallery deploys to Vercel; the asset files are served by GitHub via jsDelivr (no separate hosting cost).

### One-time setup

1. **Fill in your GitHub username** in `config.json` → `github.user`
2. **Create the GitHub repo** (public) and push this folder
3. **Connect the repo to Vercel** — Vercel auto-detects `vercel.json`
4. **Add custom domain** `assets.tndwwt.org` in Vercel → Settings → Domains
5. **Add a CNAME** at your DNS provider: `assets` → `cname.vercel-dns.com`

### Every push

- Vercel runs `node scripts/build-manifest.mjs` → regenerates `site/assets.json`
- jsDelivr serves new files from GitHub within ~10 minutes (cache TTL)

## File size & limits

- jsDelivr individual file limit: **50 MB** (plenty for images; for video, use a different provider)
- GitHub repo soft limit: ~5 GB total
- For ~200 image assets, well under any limit

## Why GitHub + jsDelivr instead of Cloudinary

- Version-controlled (you can roll back any asset change)
- Zero ongoing cost, zero vendor lock-in
- Tradeoff: no on-the-fly resizing — upload pre-sized images

## Email integration

These URLs work in Gmail, Apple Mail, Outlook, and any major email client:

```html
<img src="https://cdn.jsdelivr.net/gh/USER/assets-library@main/assets/art4awareness/logo/primary-2026.png"
     alt="Art for Awareness" style="width:200px; height:auto;">
```

Use the gallery's "Copy &lt;img&gt; tag" button to get a ready-made tag.
