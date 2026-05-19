# Asset Library — Handoff

**Built:** 2026-05-19 · v1 scaffold complete · 0 assets · ready to deploy.

## What's done

- ✅ Project scaffolded at `/Users/mukesh/assets-library/`
- ✅ Folder structure for 8 orgs × 12 asset types (96 folders, all with `.gitkeep`)
- ✅ Manifest build script (`scripts/build-manifest.mjs`)
- ✅ Gallery site (HTML + CSS + JS) with:
  - 3-dimensional smart filter (org × campaign × type)
  - Search box (`/` keyboard shortcut)
  - Click-to-copy CDN URL and ready-made `<img>` tag
  - Dark/light mode (follows system)
  - Mobile-responsive grid
- ✅ Vercel config (`vercel.json`)
- ✅ Initial git commit on local `main` branch
- ✅ Taxonomy seeded in `config.json` (extend freely)

## What needs your authorization

Three steps. ~10 minutes total.

### 1. Set your GitHub username in config

Edit `/Users/mukesh/assets-library/config.json`, replace `REPLACE_WITH_GITHUB_USERNAME` with your actual GitHub handle.

### 2. Authenticate gh, create the repo, push

```bash
cd /Users/mukesh/assets-library
gh auth login
gh repo create assets-library --public --source=. --remote=origin --push
```

The `--public` flag is required — jsDelivr only serves files from public repos.

### 3. Deploy to Vercel + add custom domain

Option A — via CLI:
```bash
cd /Users/mukesh/assets-library
npx vercel --prod
# Follow prompts; then:
npx vercel domains add assets.tndwwt.org
```

Option B — via web (often easier the first time):
- Go to https://vercel.com/new
- Import the `assets-library` repo
- Deploy (Vercel auto-detects `vercel.json`)
- Settings → Domains → Add `assets.tndwwt.org`
- Vercel will show you the CNAME to add at your DNS host (typically `cname.vercel-dns.com`)

### 4. Add the DNS CNAME at your registrar

Wherever `tndwwt.org` is registered:
```
Type:   CNAME
Name:   assets
Value:  cname.vercel-dns.com
TTL:    300
```

Propagation is usually 5–60 minutes. After that, `https://assets.tndwwt.org` is live.

## Then: upload assets

Drop image files into the right folder, commit, push. Each push regenerates the manifest and redeploys the gallery.

```bash
# Example:
cp ~/Downloads/art4aware-logo.png \
   assets/art4awareness/logo/primary-2026.png

# Optional metadata sidecar
cat > assets/art4awareness/logo/primary-2026.png.tags.json <<'EOF'
{
  "campaigns": ["earth-stories-2026", "evergreen"],
  "alt": "Art for Awareness primary logo, 2026"
}
EOF

git add . && git commit -m "Add art4awareness logo" && git push
```

## Test locally before pushing

```bash
cd /Users/mukesh/assets-library
npm run dev
# Opens at http://localhost:5173
```

Note: thumbnails won't render locally until you push (because the CDN URLs point at GitHub). To preview locally, swap `cdnBase` in `scripts/build-manifest.mjs` temporarily to a local path.

## Cost

$0/mo — Vercel hobby tier + GitHub public repo + jsDelivr public CDN are all free.

## Where to look next

- `README.md` — full how-to-use docs
- `config.json` — taxonomy (add orgs, types, campaigns here)
- `scripts/build-manifest.mjs` — manifest generator
- `site/app.js` — gallery logic
- `/Users/mukesh/Desktop/asset-library-PLAN.md` — original plan with rationale
