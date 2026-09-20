# PLV Inc — Professional Land Services Website

Static site for Petro Land Ventures. Built with [Astro](https://astro.build), edited through
[Sveltia CMS](https://github.com/sveltia/sveltia-cms) at `/studio`, hosted on Cloudflare Pages.
Saving in the editor commits to `main`, and every push to `main` rebuilds and redeploys the site.

Live at [plvinc.com](https://plvinc.com). Non-technical editing instructions live in
[EDITING-GUIDE.md](EDITING-GUIDE.md).

---

## Stack

| | |
|---|---|
| Framework | Astro 6.4.4, static output |
| CMS | Sveltia CMS 0.166.0, loaded from CDN at a pinned version |
| Hosting | Cloudflare Pages, project `plvinc` |
| Deploys | GitHub Actions, on push to `main` |
| Contact form | Web3Forms |
| Node | 22, set in `.nvmrc` |

---

## Project Structure

```
plvinc/
├── .github/workflows/
│   ├── deploy.yml               # Build and deploy on push to main
│   └── domain-doctor.yml        # Read-only report on the domain wiring
├── src/
│   ├── content.config.ts        # Collection schemas (Astro 6 glob loader)
│   ├── content/
│   │   ├── services/            # One .md per service (6 of them)
│   │   └── people/              # One .md per team member
│   ├── data/
│   │   ├── settings.json        # Global site settings
│   │   ├── us-states.json       # State paths and labels for the coverage map
│   │   └── pages/               # Per-page content: home, about, experience, contact
│   ├── components/              # Nav, Footer, SEO, ContactForm, CoverageMap, service cards
│   ├── layouts/Base.astro       # Shared HTML shell
│   ├── pages/                   # One .astro per route, plus services/[slug].astro
│   ├── styles/global.css        # Design system
│   └── utils/markdown.ts        # Renders markdown held in JSON fields
├── public/
│   ├── studio/
│   │   ├── index.html           # CMS shell, served at /studio
│   │   └── config.yml           # CMS collections and field definitions
│   ├── images/uploads/          # Media uploaded through the CMS
│   ├── favicon.svg
│   └── robots.txt
├── astro.config.mjs
├── wrangler.jsonc
├── package.json
└── .nvmrc
```

The Team page is generated from `src/content/people/`. It only exists when that folder has at
least one entry; empty it and both the page and its nav link disappear.

---

## Local Development

```bash
nvm use
npm install
npm run dev       # http://localhost:4321
```

`/studio` will not log in locally, since the OAuth flow points at a deployed worker. To work on
content locally, edit the files under `src/data/` and `src/content/` directly. They are plain JSON
and Markdown, and the CMS reads and writes exactly the same files.

---

## Deployment

Every push to `main` triggers `.github/workflows/deploy.yml`, which installs, builds, and uploads
the `dist/` folder with Wrangler. Content saved in `/studio` is a commit to `main`, so it goes
through the same path. A content change is usually live in a minute or two.

The workflow needs one repository secret, `CLOUDFLARE_API_TOKEN`, holding a Cloudflare API token
with write access to the Pages project.

Two things that are easy to get wrong:

**The Pages project is direct-upload, not connected to Git.** Deploys come from the Action, not
from Cloudflare watching the repository. Do not use "Connect to Git" on the project in the
dashboard. Doing that creates a second build pipeline racing the first, and the two will overwrite
each other's deployments.

**Verify on plvinc.com, not on the workflow's green check.** A successful Action means the upload
succeeded. It does not prove the custom domain is serving that build. If the two ever disagree,
see the troubleshooting section below.

---

## Domain and DNS

The domain is registered at GoDaddy, but its nameservers point at Cloudflare. Every record lives
in the Cloudflare zone for `plvinc.com`. Editing DNS in the GoDaddy control panel has no effect on
anything.

| Name | Type | Target | Proxy |
|---|---|---|---|
| `plvinc.com` | CNAME | `plvinc.pages.dev` | Proxied |
| `www.plvinc.com` | CNAME | `plvinc.pages.dev` | Proxied |

Both names are attached to the Pages project as custom domains, and a zone redirect rule sends
`www` to the apex. Keep the proxy on. Pages custom-domain validation fails against a DNS-only
record, and the apex needs Cloudflare's CNAME flattening to be a CNAME at all.

The same zone carries the company's Microsoft 365 email: the MX record, the SPF and DMARC TXT
records, `autodiscover`, and the Lync/Teams SRV entries. Nothing about the website requires
touching any of them, and removing one will silently break mail rather than the site.

### If the site ever serves an old build

This happened in September 2026 and took an embarrassing amount of time to find, so it is worth
writing down.

A Cloudflare Worker that ships static assets can claim a hostname through a **Worker Custom
Domain**. While it holds that hostname, it serves its own bundled copy of the site and Pages never
gets a look in. The symptoms are distinctive: `plvinc.pages.dev` is perfectly current,
`plvinc.com` is frozen on an old build, and the Pages custom domains sit at `pending` forever
because the hostname is already spoken for.

It hides well:

- In DNS the binding appears as a proxied `AAAA` record pointing at `100::`. Through the API that
  looks like an ordinary dead record, which invites a pointless "just repoint the DNS" fix.
- The dashboard renders the same row as type `Worker` and marks it "Selection unavailable", which
  is the real tell. Trust the dashboard over the API here.
- It does **not** appear under the zone's Workers Routes. Custom Domains are account-scoped, under
  Workers → the script → Settings → Domains & Routes.

The fix is to delete the Worker Custom Domain, then immediately add the CNAME back. Deleting the
binding also deletes the `AAAA` record that stood in for it, and Pages will not create a
replacement on its own, so the domain stops resolving entirely until a record exists again. Add
the CNAME first or have it ready to paste.

`.github/workflows/domain-doctor.yml` reports all of the above. Run it from the Actions tab with
no inputs for a read-only summary.

---

## The CMS

`/studio` runs Sveltia CMS against this repository over GitHub OAuth. Authentication goes through
a small Cloudflare Worker, `sveltia-cms-auth`, so the CMS never holds credentials of its own. The
worker URL is set as `base_url` in `public/studio/config.yml`.

That worker is unrelated to the site build and is easy to mistake for something disposable. It is
not. Delete it and nobody can log in to the editor.

### Giving someone edit access

Access is GitHub access. Anyone with **Write** permission on this repository can sign in to
`/studio` and edit content.

1. Repository → **Settings** → **Collaborators** → **Add people**.
2. They accept the invitation.
3. They open [plvinc.com/studio](https://plvinc.com/studio) and click **Login with GitHub**.

---

## Contact Form

Submissions go through [Web3Forms](https://web3forms.com). The access key is stored in
`src/data/settings.json` and is editable in the CMS under **Site Settings → Contact Form Access
Key**. The free tier covers 250 submissions a month, and the key is bound to the domain, so it is
useless if copied elsewhere.

The form has a honeypot field and client-side validation. If spam gets through, Web3Forms supports
[hCaptcha](https://docs.web3forms.com/spam-protection); adding it means one hidden input in
`ContactForm.astro`.

---

## Editing Content Without the CMS

Everything the CMS writes is a plain file, so it can all be edited directly and pushed:

- `src/data/settings.json` for global settings
- `src/data/pages/*.json` for page content
- `src/content/services/*.md` for the service pages
- `src/content/people/*.md` for team members, one file each

---

## Decap CMS Fallback

Sveltia CMS is a drop-in replacement for Decap CMS and reads the same `config.yml`. If Sveltia is
ever unavailable, swap the script tag in `public/studio/index.html`:

```html
<script src="https://unpkg.com/decap-cms@^3/dist/decap-cms.js"></script>
```

No configuration changes are needed.

---

## Dependency Pinning

Versions are pinned deliberately: exact numbers in `package.json`, a committed
`package-lock.json`, Node in `.nvmrc`, and the CMS pinned to a specific version in its CDN URL
rather than a floating tag. The CMS is the one most worth keeping pinned, since it loads in the
browser at runtime and a bad release would break editing with no deploy to roll back.

To move Sveltia forward, change the version in the `<script>` tag in `public/studio/index.html`
and check that the editor still loads before pushing.
