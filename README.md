# PLV Inc: Professional Land Services Website

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
│   │   ├── people/              # One .md per team member
│   │   └── insights/            # Articles. Empty, and dormant while empty.
│   ├── data/
│   │   ├── settings.json        # Global site settings
│   │   ├── us-states.json       # State paths and labels for the coverage map
│   │   └── pages/               # One file per page: home, about, services,
│   │                            #   mineral-owners, experience, insights,
│   │                            #   contact
│   ├── components/              # Nav, Footer, SEO, ContactForm, CoverageMap,
│   │                            #   CallToAction, ServiceCard, ServiceList
│   ├── layouts/Base.astro       # Shared HTML shell
│   ├── pages/                   # One .astro per route, plus services/[slug].astro
│   │                            #   and insights/[slug].astro
│   ├── styles/
│   │   ├── fonts.css            # Self-hosted @font-face rules
│   │   └── global.css           # Design system
│   └── utils/markdown.ts        # Renders markdown held in JSON fields
├── public/
│   ├── studio/
│   │   ├── index.html           # CMS shell, served at /studio
│   │   └── config.yml           # CMS collections and field definitions
│   ├── images/
│   │   ├── og-default.png       # 1200x630 default share image
│   │   └── uploads/             # Media uploaded through the CMS, incl. logos
│   ├── fonts/                   # Self-hosted woff2
│   ├── _headers                 # Cache-Control for hashed assets
│   ├── favicon.svg
│   ├── favicon-16.png
│   ├── favicon-32.png
│   ├── apple-touch-icon.png
│   └── robots.txt
├── _source-images/              # Full-resolution originals. Gitignored.
├── astro.config.mjs
├── wrangler.jsonc
├── package.json
└── .nvmrc
```

---

## Photography

Three bands carry a photograph: the home hero, the dark closing band on the home page, and the
**Mineral Owners** header. Originals live in `_source-images/`, which is gitignored. Only the
derived JPEGs in `public/images/uploads/` are committed and served.

| Source | Derived | Used by |
|---|---|---|
| `workspace-window-monitors.png` | `hero-office-monitors.jpg` | Home hero |
| `workspace-rig-sunset.png` | `cta-rig-horizon.jpg` | Home closing band |
| `workspace-desk-map.png` | `mineral-owners-lease-map.jpg` | Mineral Owners header |

Each is softened slightly and desaturated at build time rather than with a CSS filter. Blurring a
bitmap that size on every paint costs a full composited layer, and the processed file also
compresses harder. The three together deploy at about 160 KB, against 6 MB of originals.
Regenerate with [sharp](https://sharp.pixelplumbing.com), already a dependency:

```js
sharp(src).resize({ width: 1672 }).blur(1.2)
  .modulate({ saturation: 0.85 })
  .jpeg({ quality: 64, mozjpeg: true })
  .toFile(out)
```

The green wash over each photograph sits in the same `background-image` stack as the picture,
earliest layer on top, rather than in a pseudo-element above it. The hero keeps its wash in CSS
because it is weighted to the left to carry the headline and has to follow the crop. The other
two sit behind centred text, so their wash is even and is composited into the file instead,
using `#1B4332` then `#0B1F15` at `.20`/`.58` for the closing band and `.18`/`.60` for the header:

```js
sharp(src).resize({ width: 1672, height: 941, fit: 'cover' }).blur(1.2)
  .modulate({ saturation: 0.85 })
  .composite([{ input: greenLayer }, { input: darkLayer }])
  .jpeg({ quality: 68, mozjpeg: true })
  .toFile(out)
```

The blur is deliberately light, enough to stop map grids and document text competing with the
copy, not enough to make the scene mush. Raising it much past 2 starts to read as out of focus.

Swapping a source, or changing the blur, means rechecking contrast: white text should clear 4.5:1
against the brightest point it covers. The current files measure 4.4:1 at worst behind the large
hero headline, which needs only 3:1, and 5.5:1 or better everywhere the body copy sits.

The hero and closing-band images are set through the CMS, so either can be changed without
touching code, but an unprocessed upload will be sharp, heavy, and washed only by whatever the
CSS provides. The **Mineral Owners** header is wired in `global.css`.

---

The people in `src/content/people/` render at the foot of the **About** page. About and Team were
separate pages until About was down to a sentence that Team already said better; the methodology
in "How We Work" belonged to neither, so it leads the merged page. `/people` 301s to `/about` via
`public/_redirects`. Empty the folder and only the people section disappears, not the page.

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

**Keep copy out of the templates.** Page subtitles, section labels, search descriptions and the
closing call to action all live in `src/data/pages/*.json` and are exposed in `/studio`. Putting a
string straight into an `.astro` file puts it beyond the owner's reach, which is the one thing this
setup exists to avoid. If a page needs a new piece of text, add a field to the JSON and to
`public/studio/config.yml` alongside it.

The closing band on every page is one component, `CallToAction.astro`, reading that page's `cta`
object. It takes a `tone` of `dark` or `light`; interior pages use `light` so they don't open and
close on the same green.

**Sections hide when their data is empty.** The figures row, home testimonials, Selected Projects,
the Mineral Owners FAQ, the About page's people and Insights all render nothing at all when their
list is empty, rather than leaving a heading over a gap. Insights goes further and drops out of the nav,
the footer and the sitemap until a post exists. Keep that behaviour when adding anything similar,
because it is what lets the owner switch a section off without asking for a code change.

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
