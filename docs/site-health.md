# Site health report

Checked on November 10, 2026, against the build of commit a2a6cde (the version live at
plvinc.com). Lighthouse ran on the local preview of that build; links, redirects and the
analytics beacon were also checked on the live site. Nothing was submitted through either form.

## 1. Contact forms

The Contact page has two forms behind two tabs: **I own land or minerals** (the short note) and
**I represent a company** (the project form). The tabs are plain HTML radio buttons, so switching
works with JavaScript off. A link to `/contact#note` or `/contact#project` opens the matching tab
(that part needs JavaScript).

### Where submissions go

Both forms post to Web3Forms (`https://api.web3forms.com/submit`). Web3Forms emails each
submission to the inbox the **access key** was created with. The key is in Site Settings →
Contact Form Access Key. The Email Address field in Site Settings does **not** decide this, so
the inbox is whichever address was used at web3forms.com when the key was made. The Web3Forms
dashboard shows it. The site's security header only allows forms to post to the site itself and
to Web3Forms.

### What email is sent

| | Short note | Project form |
|---|---|---|
| Subject | "New note from a landowner" | "New inquiry from website contact form" |
| From name | Web3Forms' default (none is set) | "Petro Land Ventures" |
| Fields in the email | Name, Phone or email, County and state, message | Name, Email, Phone, I am a, State, County or parish, Service needed, Timeline, message |
| Reply-To | **None.** The form has no field named `email`, so hitting Reply does not go to the visitor | The visitor's email address (Web3Forms uses the `email` field automatically) |

Field labels in the email are the fields' `name` attributes, in plain words. The subjects are
editable in Studio (Contact → Short Form → Email subject, and Contact → Email subject).

### Spam protection

- A hidden honeypot checkbox (`botcheck`) on both forms. People never see it; bots that tick
  every box are rejected by Web3Forms.
- The access key only works from plvinc.com.
- No captcha. If spam starts coming through, Web3Forms supports hCaptcha.
- Cloudflare's bot checks also run on the live site (its challenge script loads on every page).

### What the visitor sees (JavaScript on)

1. Pressing the button with a required field empty shows a red message under each empty field
   and moves focus to the first one. Nothing is sent. Each message clears as soon as the field
   is filled in.
2. With everything filled in, the button reads **Sending…** and is disabled while it sends.
3. **Success:**
   - The form clears and a green box appears under the button. It takes focus, so a screen
     reader reads it and a phone scrolls to it.
   - Short note: "Thanks. Your note is on its way to us, and Rickey or Shannon will get back to
     you."
   - Project form: "Thank you. Your message has been sent, and we will be in touch."
4. **Failure** (Web3Forms says no, the network drops, or the monthly limit is reached):
   - A red box reads "Something went wrong. Please try again, or reach out directly by phone or
     email."
   - The box takes focus. What the visitor typed is kept, so they can try again.

### What happens with JavaScript off

- **The browser does not check anything.** The forms carry `novalidate`, so the browser sends
  them even with empty required fields.
- **The visitor leaves the site.** The forms send `redirect=false`, which the Web3Forms docs do
  not document as a special value. Without a redirect to a full https address, Web3Forms shows
  its own page (by default `web3forms.com/success`), and nothing links back to plvinc.com.

### What to expect when you test

Before the fixes below:

- **Short note:** the email arrives with the subject "New note from a landowner", and the
  visitor's phone or email sits in the body. Reply goes nowhere useful, so copy the address.
- **Project form:** the email arrives with the subject "New inquiry from website contact form"
  and the sender "Petro Land Ventures". Reply goes to the visitor.
- **Errors:** to see the error box without breaking anything, turn Wi-Fi off just before
  pressing Send.

After the fixes, see [Testing the forms after the fixes](#testing-the-forms-after-the-fixes)
at the end of this report.

## 2. Lighthouse (before)

Scores are Performance / Accessibility / Best Practices / SEO, run with Lighthouse 12.8 on the
local preview.

| Page | Mobile | Desktop | Mobile LCP | Mobile TBT |
|---|---|---|---|---|
| Home | 92 / 100 / 100 / 100 | 100 / 100 / 100 / 100 | 2.6 s | 260 ms |
| Mineral Owners | 99 / 100 / 100 / 100 | 100 / 100 / 100 / 100 | 2.0 s | 20 ms |
| Companies | 96 / 100 / 100 / 100 | 100 / 100 / 100 / 100 | 1.8 s | 200 ms |
| Contact | 99 / 100 / 100 / 100 | 100 / 100 / 100 / 100 | 2.0 s | 0 ms |
| About | 97 / 100 / 100 / 100 | 100 / 100 / 100 / 100 | 2.6 s | 30 ms |
| Sample Work | 90 / 100 / 100 / 100 | 100 / 100 / 100 / 100 | 1.8 s | 400 ms |

CLS is 0 on every page.

### Top fixes

1. **Scroll-in animation forces extra layout work** (Sample Work 220 ms, Home 100 ms, Mineral
   Owners 70 ms of forced reflow).
   - The script that fades cards in measures each card's position after it has already changed
     another card's class, so the browser recalculates the layout again and again.
   - The observer already hands over those positions, so reading them from there removes the
     work and leaves the animation exactly as it looks now.
   - This is most of Sample Work's 400 ms blocking time.
2. **About headshots are oversized on phones.**
   - At phone width each photo shows at 325 px and needs about 650 px on a sharp screen.
   - The largest WebP copy is 640 px, so the phone falls back to the 800 px JPEG (103 KB and
     92 KB).
   - An 800 px WebP copy is about 33 KB and 39 KB.
3. **The menu logo on phones downloads the 50 KB PNG.** A WebP copy at the same size is 29 KB.
4. **Things that stay as they are:**
   - **Render-blocking stylesheet** (one 18 KB file, about 120-280 ms). It is already small, and
     inlining it would lose caching between pages.
   - **Home hero photo as WebP** (would save about 16 KB). It would change the hero's pixels,
     which must stay identical.
   - **Closing band photo** (44 KB, loaded before it scrolls into view). It is left as is by
     instruction.
   - **TradingView ticker:** its script is cached for only 5 minutes. That is TradingView's
     setting and can't be changed from here.

## 3. Links

Every link on all 15 sitemap pages and the 404 page was requested.

- **Internal:** all 14 pages, plus the 6 service pages, return 200. No internal link
  redirects.
- **External:**
  - landman.org and tradingview.com return 200.
  - The two LinkedIn profiles return LinkedIn's bot block (999). This is normal for LinkedIn
    when a script asks; both links open in a browser.
  - tools.plvinc.com (Team login) redirects to the Cloudflare Access sign-in, as it should.
- **Live redirects:**
  - `www.` and `http://` → `https://plvinc.com` (301).
  - `/about/` and `/about.html` → `/about` (308).
  - `/people` → `/about` (301).
  - `/sitemap.xml` → `/sitemap-index.xml` (301).
  - An unknown address returns a real 404.
- **Problems found:**
  - **`/favicon.ico` returns 404.** Browsers and some crawlers ask for it whatever the page
    says.
  - **`/insights` answers 200** with a page that forwards to Home. It is noindexed, out of the
    sitemap and not linked anywhere, so it does no harm. It goes away once the first post is
    written.

## 4. Images

| File | Size | Pixels | Shown at | Notes |
|---|---|---|---|---|
| hero-office-monitors.jpg | 73 KB | 1672×941 | full width | Home hero; left as is (pixel rule) |
| cta-rig-horizon.jpg | 44 KB | 1672×941 | full width | Closing band; left as is |
| mineral-owners-lease-map.jpg | 47 KB | 1672×941 | full width | Fine |
| rickey-matherne-jr-3.jpg | 103 KB | 800×800 | 325 px on phones, 558 px on desktop | Phones get the JPEG (see Lighthouse fix 2) |
| shannon-matherne-4.jpg | 92 KB | 800×800 | same | same |
| logo-mark.png | 51 KB | 465×132 | 141-162 px | Phones get the PNG (see Lighthouse fix 3) |
| logo-mark-light.png | 20 KB | 465×132 | 106 px | Footer; WebP copies already used |
| og-default.png | 85 KB | 1200×630 | share card | Correct size |

All the smaller photos (Home team strip, Contact) already load right-sized WebP copies.

**Alt text:**

- **About headshots:** "Rickey Matherne, Jr., CPL, professional photo". "Professional photo"
  adds nothing, and the alt should use the name the way the person is introduced.
- **Team strip (Home, Companies, Mineral Owners) and Contact headshots:** `alt=""`. This is
  correct, because the name is printed right beside each photo, so a screen reader would
  otherwise read it twice.
- **Logos:** alt "Petro Land Ventures". Correct.

## 5. Titles and descriptions

There are no duplicate titles or descriptions, and every indexable page has exactly one H1.
Share titles and descriptions match each page's own title and description.

**Problems:**

- **Four descriptions list four regions and leave out the Pacific Northwest:**
  - Home (also used as the business description in structured data)
  - About
  - Contact
  - Services
- **About's description is 163 characters**, so Google cuts it off.
- **Contact's title is 64 characters** with the firm name added ("Contact Our Certified
  Professional Landmen | Petro Land Ventures"), so Google cuts it off.
- **Lease Acquisition and Right-of-Way** name the Marcellus, Utica and Gulf Coast. Those are the
  plays where that work was done, not a list of regions, so they are left alone.
- **Experience** lists the 8 states, which match the Experience page.

## 6. Sharing, icons, crawling

| Check | Result |
|---|---|
| Share image (Open Graph and Twitter) | Present on every page: `og-default.png`, 1200×630, the logo on brand green, no people. Width, height and alt are declared. Twitter card is `summary_large_image`. |
| Favicons | SVG, 32 px and 16 px PNG, and a 180 px Apple touch icon. **`/favicon.ico` is missing** (see links). |
| robots.txt | Allows everything except `/studio/`. Points to the sitemap. |
| Sitemap | `sitemap-index.xml` → 15 pages. Excludes `/studio` and the empty `/insights`. |
| Canonical URLs | On every indexable page, as clean `https://plvinc.com/...` addresses with no `.html`. The 404 page is noindexed and has none. Copies at `*.pages.dev` send `noindex`. |
| Custom 404 page | Exists, in the site's style, and returns a real 404 status. It links to Home, Services, Mineral Owners, Sample Work and Contact, but **not For Companies**. |

## 7. Structured data (JSON-LD)

Every page carries a `ProfessionalService` entry for the firm and a `WebSite` entry. Pages add
more where they have it: FAQPage on Companies and Mineral Owners, Person ×2 on About, and
BreadcrumbList and Service on each service page.

**The business entry includes:**

- Name and legal name
- Phone (+15043827479) and email
- Address: Duncansville, Pennsylvania, 16635, US. No street.
- The 8 states plus the 5 region names
- Logo and image

All entries parse as valid JSON.

**Gaps:**

- **The landmen only appear on About**, so the firm entry on other pages does not name them.
- **The business description lists four regions.**
- **The states are read from the Home map.** They match Experience today, but the two could
  drift apart.

## 8. Analytics

Cloudflare Web Analytics is **already on**. Cloudflare adds its cookieless beacon to the live
pages itself (a browser visiting plvinc.com loads `static.cloudflareinsights.com/beacon.min.js`
and reports to `plvinc.com/cdn-cgi/rum`). It is not in the site's code, which is why it doesn't
show on the local preview.

- **No token is needed.**
- **Adding the snippet by hand would count every visit twice.**
- **The Privacy page already describes it in plain language:** "We use Cloudflare Web Analytics
  to count visits and see which pages are read. It does not set cookies, does not use your IP
  address to identify you, and does not track you across other websites."
- **To see the numbers:** Cloudflare dashboard → your account → **Analytics & Logs → Web
  Analytics** (or the Pages project → **Metrics**).

## 9. After the fixes

### Lighthouse

Mobile scores move a few points from run to run on this machine, so both builds were run three
times on mobile (Home five more times, alternating). The table gives median performance. Mobile
Accessibility, Best Practices and SEO stayed at 100 on every page. Desktop is still 100 / 100 /
100 / 100 everywhere.

| Page | Mobile before | Mobile after | What changed |
|---|---|---|---|
| Home | 95 | 97 | Phone logo is WebP |
| Mineral Owners | 99 | 98 | Forced reflow gone; the 1-point drop is within run-to-run noise |
| Companies | 100 | 97 | Forced reflow gone; one slow run (83) pulled the median down; the other runs scored 100 |
| Contact | 99 | 100 | Forced reflow gone |
| About | 97 | 99 | LCP 2.6 s → 2.0 s; headshots 103 KB and 92 KB JPEGs → 33 KB and 39 KB WebP |
| Sample Work | 100 | 98 | Forced reflow 220 ms → none; the score change is within run-to-run noise |

- **Forced reflow** is gone on five of the six pages. Home still shows a small one (2 to 89 ms)
  from another script.
- **The cause was the header-shadow check**, which read the scroll position straight after the
  card animations were set up. It now runs one frame later. The animations also read card
  positions from the observer, so that code can't trigger the same layout work.

### Fixes in this round

- **Descriptions:** Home, About, Contact and Services name all five regions. All are under 160
  characters. The Contact title is now "Contact Our Landmen".
- **`/favicon.ico`** added (16, 32 and 48 px, from the existing droplet icon).
- **404 page** links to Home, Mineral Owners, For Companies and Contact.
- **Structured data:**
  - Both landmen are listed as employees of the firm on every page, with the CPL credential
    recognised by the AAPL.
  - The states come from the Experience page.
  - The business description names all five regions.
- **Alt text:** About headshots read "Rickey Matherne, Jr., CPL" and "Shannon Matherne, CPL".

### Testing the forms after the fixes

**1. Short note:**
- Fill it in with an **email address** in "Phone or email".
- Under the button you will see "Your note goes straight to Rickey and Shannon. One of them will
  reach out."
- After sending, a green box reads "Thanks. Your note is on its way to us, and Rickey or Shannon
  will get back to you."
- The email arrives with the subject "New note from a landowner" and the sender "Petro Land
  Ventures". **Reply now goes to the address the visitor typed.** With a phone number instead,
  there is no reply-to.

**2. Project form:**
- Open the "I represent a company" tab. Under the heading is "Own the land or the minerals
  yourself? Send us a short note instead →". That link switches to the short note and puts the
  cursor in its first box.
- The State list runs Alabama to Wyoming with Alaska, Hawaii and District of Columbia, then
  "Other / not sure".
- After sending you will see "Thank you. Your message has been sent, and we will be in touch."
- The email subject is "New inquiry from website contact form", and Reply goes to the visitor.

**3. Empty form:**
- Press Send with nothing filled in. Each required box shows its own message in red, and the
  cursor jumps to the first one.

**4. Failure:**
- Turn Wi-Fi off just before pressing Send.
- The red box reads "Something went wrong. Please try again, or reach out directly by phone or
  email." What the visitor typed stays in the form.

**5. JavaScript off** (Chrome: Settings → Privacy and security → Site settings → JavaScript →
add plvinc.com under "Not allowed"):
- **Empty form:** the browser itself stops it and points at the first empty box.
- **Filled in:** after sending, you should land on plvinc.com/message-sent ("Thanks. Your Message
  Is on Its Way."). **This is the one part that depends on Web3Forms honouring the redirect**,
  which their docs say works on the free plan within the same domain. If you land on a
  web3forms.com page instead, tell me.
