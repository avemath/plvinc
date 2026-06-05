# PLV Inc — Professional Land Services Website

Static site built with [Astro](https://astro.build) and managed through [Sveltia CMS](https://github.com/sveltia/sveltia-cms) at `/studio`. Deployed on Cloudflare Pages; auto-rebuilds on every content save.

---

## Project Structure

```
plvinc/
├── src/
│   ├── content/
│   │   ├── config.ts            # Astro content collection schemas
│   │   ├── services/            # One .md file per service (6 seeded)
│   │   └── people/              # One .md file per team member (empty = no Team page)
│   ├── data/
│   │   ├── settings.json        # Global site settings
│   │   └── pages/               # Per-page data (home, about, experience, contact)
│   ├── components/              # Reusable Astro components
│   ├── layouts/Base.astro       # Shared HTML shell (nav + footer)
│   ├── pages/                   # One .astro file per route
│   ├── styles/global.css        # Full design system
│   └── utils/markdown.ts        # Markdown renderer for JSON-stored fields
├── public/
│   ├── studio/
│   │   ├── index.html           # Sveltia CMS shell (route: /studio)
│   │   └── config.yml           # CMS collection + field definitions
│   ├── images/uploads/          # CMS-managed media
│   ├── favicon.svg
│   └── robots.txt
├── astro.config.mjs
├── package.json
└── .nvmrc                       # Node 22
```

---

## Local Development

```bash
nvm use           # uses .nvmrc → Node 22
npm install
npm run dev       # http://localhost:4321
```

The `/studio` route requires GitHub OAuth and won't function locally without a running OAuth worker. All content files can be edited directly in `src/data/` and `src/content/` for local development.

---

## One-Time Setup Checklist

### 1. Cloudflare Pages — Deploy

1. Log in to [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**.
2. Select the `plvinc` repository, branch `main`.
3. Build settings:
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Node.js version:** `22` (set in Environment variables or Cloudflare dashboard)
4. Click **Save and Deploy**.

Every push to `main` (including saves from `/studio`) triggers a rebuild automatically.

### 2. GitHub OAuth App

1. Go to **GitHub → Settings → Developer settings → OAuth Apps → New OAuth App**.
2. Fill in:
   - **Application name:** PLV Inc Website Editor
   - **Homepage URL:** `https://YOUR_DOMAIN.com`
   - **Authorization callback URL:** `https://YOUR_OAUTH_WORKER.workers.dev/callback`
3. Click **Register**. Copy the **Client ID** and generate a **Client Secret**.

### 3. Sveltia CMS Authenticator (Cloudflare Worker)

The OAuth Worker handles the GitHub login flow so the CMS never stores credentials.

```bash
# Install Wrangler if you don't have it
npm install -g wrangler
wrangler login

# Clone the authenticator
git clone https://github.com/sveltia/sveltia-cms-auth
cd sveltia-cms-auth

# Set secrets
wrangler secret put GITHUB_CLIENT_ID      # paste Client ID
wrangler secret put GITHUB_CLIENT_SECRET  # paste Client Secret

# Deploy
wrangler deploy
```

Wrangler will print the Worker URL (e.g. `https://sveltia-cms-auth.YOURNAME.workers.dev`).

### 4. Wire Everything Together

**`public/studio/config.yml`** — update three lines:

```yaml
backend:
  repo: YOUR_GITHUB_USERNAME/plvinc      # ← your GitHub username
  base_url: https://YOUR_WORKER_URL      # ← Wrangler Worker URL

site_url: https://YOUR_DOMAIN.com        # ← your real domain
```

**`astro.config.mjs`** — update the `site` value:

```js
site: 'https://YOUR_DOMAIN.com',
```

**`public/robots.txt`** — update the sitemap URL.

Commit and push. Cloudflare Pages will rebuild.

### 5. Point GoDaddy DNS at Cloudflare Pages

The domain stays at GoDaddy. Only the DNS records change.

1. In the Cloudflare Pages dashboard, open your project → **Custom domains** → **Set up a custom domain** → enter your domain → follow the prompts to get the CNAME target (e.g. `plvinc.pages.dev`).
2. Log in to GoDaddy → **DNS** → delete any existing `A` record for `@` and any `CNAME` for `www`.
3. Add:
   | Type  | Name | Value                   | TTL  |
   |-------|------|-------------------------|------|
   | CNAME | @    | `plvinc.pages.dev`      | 1 hr |
   | CNAME | www  | `plvinc.pages.dev`      | 1 hr |
   > **Note:** GoDaddy may call the root record `@` or your bare domain name. Use CNAME flattening (GoDaddy supports it automatically for root records).
4. DNS propagation typically takes 5–30 minutes. Cloudflare provisions an SSL certificate automatically once the CNAME resolves.

### 6. Contact Form (Web3Forms)

1. Go to [web3forms.com](https://web3forms.com) and enter the site owner's email address. A free access key is emailed instantly.
2. In `/studio` → **Site Settings** → **Contact Form Access Key**, paste the key and save.

Free tier: **250 submissions per month**. Paid plans start at $9/month for unlimited. The key is domain-bound, so it won't work from other sites.

Honeypot spam protection is already wired into the form. If you encounter spam, enable [Web3Forms hCaptcha](https://docs.web3forms.com/spam-protection) by adding `<input type="hidden" name="captcha" value="1">` to `ContactForm.astro`.

### 7. Add a GitHub Collaborator as CMS Editor

The CMS authenticates via GitHub. Anyone you add as a **collaborator with Write access** to the `plvinc` repository can log in to `/studio` and edit content.

1. GitHub → `plvinc` repository → **Settings** → **Collaborators** → **Add people** → enter their GitHub username → **Add collaborator**.
2. They accept the invitation, then visit `YOUR_DOMAIN.com/studio` and click **Login with GitHub**.

---

## Updating Content Without the CMS

All content is plain files — edit them directly and push:

- `src/data/settings.json` — global settings
- `src/data/pages/*.json` — per-page content
- `src/content/services/*.md` — service pages
- `src/content/people/*.md` — team members (add/delete files here)

---

## Decap CMS Fallback

Sveltia CMS is a drop-in replacement for Decap CMS (formerly Netlify CMS) using the same `config.yml` format. If Sveltia CMS is ever unavailable, swap the script tag in `public/studio/index.html`:

```html
<!-- Replace the Sveltia line with: -->
<script src="https://unpkg.com/decap-cms@^3/dist/decap-cms.js"></script>
```

No config changes needed.

---

## Dependency Pinning

- Node version: `.nvmrc` (22)
- npm packages: exact versions in `package.json`, committed `package-lock.json`
- Sveltia CMS CDN: pinned version in `public/studio/index.html`

To update Sveltia CMS: change the version number in the `<script>` src in `public/studio/index.html` and test locally before pushing.
