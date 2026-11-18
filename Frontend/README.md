# PVK Capital — Website

Static website (HTML / CSS / vanilla JS, no build step). Open `index.html` in a browser, or serve the
folder with any static server.

```
python -m http.server 8000      # then visit http://localhost:8000
```

## Pages

| File | What it contains |
| --- | --- |
| `index.html` | Hero, three principles, all seven services, embedded SIP calculator, founder section, 5-step process, who we serve, enquiry form |
| `about.html` | Vedant Shah's story, the Preservation / Value / Knowledge philosophy, six commitments, FAQ |
| `services.html` | Full detail on all seven mandates, each with an "at a glance" fact panel and a direct enquiry link |
| `calculators.html` | SIP (with optional annual step-up) and lumpsum calculators, both in INR, plus the formulas used |
| `contact.html` | Contact details, the client enquiry form, and a practical FAQ |

## Images

The pages use small, web-optimized images. The large originals are kept as masters to re-export from:

| Used on the site | Master | What it is |
| --- | --- | --- |
| `assets/img/founder.webp` (1000 px wide) | `founder.jpg` | Founder portrait on `index.html` and `about.html`. If it fails to load, a styled placeholder is shown instead. |
| `assets/img/pvk-icon.webp` (240 px wide) | `pvk-icon.svg` | Emblem only — nav and footer, next to the live "PVK CAPITAL" text. |
| `assets/img/pvk-logo.webp` (700 px wide) | `pvk-logo.svg` | Full lockup (emblem + name + tagline) — homepage hero. |

All logo images are transparent, so they sit naturally on cream, white or the dark footer. If you replace a
master, re-export the matching `.webp` at the width above (any converter works; keep the transparency).

Icons and sharing images:

- `favicon.ico` (16/32/48 px), `assets/img/icon-192.png`, `assets/img/apple-touch-icon.png` — browser tab,
  Google search result and phone home-screen icons.
- `assets/img/og-image.jpg` (1200 × 630) — preview image when a page is shared on WhatsApp, LinkedIn, etc.

## SEO

Every page's `<head>` carries its own title, meta description, canonical URL (`https://pvkcapital.com/...`,
without `.html` — the form Netlify serves), Open Graph / Twitter sharing tags, and a JSON-LD block that
describes the firm (FinancialService, Vadodara), the founder, breadcrumbs, the FAQs on the About and
Contact pages, the services and the calculator. If you change a page's FAQ wording, phone number,
address or services, update the JSON-LD on that page to match — Google requires it to match the visible
text. `sitemap.xml` lists the five canonical URLs; update its `<lastmod>` dates when content changes.
`_headers` (read by Netlify, not served) keeps `README.md` and the Apps Script source out of search results.

## Contact details

The phone number (`+91 95108 09046` / `tel:+919510809046`) and email (`pvkcapital.in@gmail.com`) appear
in the header/footer and on the contact page of every page. If they change, search and replace them
everywhere.

The LinkedIn icon in the footer of every page links to https://www.linkedin.com/company/pvk-capital/
(opens in a new tab).

The phone number and email are also centralised in **`assets/js/forms.js`** at the top:

```js
var CONFIG = {
  endpoint: 'https://script.google.com/macros/s/.../exec',
  inbox: 'pvkcapital.in@gmail.com',
  phone: '9510809046'
};
```

Anything marked `data-inbox` in the HTML is filled in from that object automatically.

## How the forms deliver

There are two forms: the consultation form on the home page and the client enquiry form on the
contact page. Both post to the same `CONFIG.endpoint`.

`CONFIG.endpoint` is set to a deployed **Google Apps Script** web app. On every submission it emails the
founder with the full enquiry details *and* sends the visitor a confirmation email — no third-party
service, no backend to host, free on a personal Google account. Every submission is also saved in the
visitor's browser (`localStorage`, key `pvk_enquiries`).

If `endpoint` is ever set back to `''`, submitting a form instead opens the visitor's mail app with every
field pre-filled and addressed to you — this works with zero setup but relies on the visitor pressing send.

To set up (or re-create) the Apps Script endpoint:

1. Go to [script.google.com](https://script.google.com) and create a new project.
2. Delete the placeholder code and paste in the contents of `google-apps-script/Code.gs` from this repo.
3. Change `FOUNDER_EMAIL` at the top of the script if it should differ from the site's contact address.
4. **Deploy ▸ New deployment ▸** type **Web app**, with **Execute as: Me** and **Who has access: Anyone**.
5. Authorize the script when Google prompts you — it needs permission to send email on your behalf.
6. Copy the resulting URL (it ends in `/exec`) and paste it into `assets/js/forms.js`:

```js
var CONFIG = {
  endpoint: 'https://script.google.com/macros/s/XXXXXXXXXXXX/exec',
  ...
};
```

7. Submit a test enquiry on the live site and confirm both the founder notification and the visitor
   confirmation email arrive.

Whenever you edit `Code.gs` afterwards, create a new deployment version (**Manage deployments ▸ edit ▸
new version**) — editing the script alone does not update the live `/exec` URL.

Every submission emails the visitor's name, phone, email, city, address, selected services, investor
type, investment range, preferred call time and message to the founder, and a shorter confirmation
back to the visitor.

*Alternative:* any JSON-accepting form endpoint works the same way — Formspree, Getform, Web3Forms, or
your own API — just paste its URL into `CONFIG.endpoint` instead. Only Apps Script sends the visitor a
confirmation email automatically; the others just forward the submission to your inbox.

## The calculators

All amounts are in Indian Rupees, formatted with the Indian numbering system (lakh / crore).

- **SIP** — annuity-due: contributions at the start of each month, compounding monthly.
  `FV = P × [((1+i)ⁿ − 1) ÷ i] × (1+i)`
- **Step-up SIP** — computed month by month, raising the contribution by the chosen percentage after
  every twelve instalments.
- **Lumpsum** — `FV = P × (1 + r)^y`, compounded annually.

Each calculator's "Discuss this plan with us" button carries the current numbers into the contact form
via URL parameters, so an enquiry arrives with the scenario the visitor was modelling.

## Structure

```
Frontend/
├── index.html
├── about.html
├── services.html
├── calculators.html
├── contact.html
├── README.md
└── assets/
    ├── css/style.css        design tokens, components, responsive rules
    ├── js/main.js           nav, scroll reveal, accordions, timeline
    ├── js/calculators.js    SIP + lumpsum maths, donut and bar chart rendering
    ├── js/forms.js          validation, submission, URL prefill, contact config
    └── img/
        ├── pvk-icon.webp    emblem only — nav/footer (master: pvk-icon.svg)
        ├── pvk-logo.webp    full lockup — hero (master: pvk-logo.svg)
        ├── founder.webp     founder portrait (master: founder.jpg)
        ├── og-image.jpg     link-sharing preview image
        └── icon-192.png, apple-touch-icon.png   app/search icons (favicon.ico sits at the site root)
```

## Design notes

Colours are sampled from the logo: burgundy `#7C1B24`, gold `#C6892C` → `#E7BE63`, warm cream
`#FBF8F3`, near-black ink `#1B120F`. Type is Cormorant Garamond (display) with Inter (body), both from
Google Fonts with local fallbacks.

Everything is defined as CSS custom properties at the top of `style.css` — change the palette there and
it updates across all five pages.

Motion: entrance animations on the hero, scroll-triggered reveals, a scroll-linked
progress line on the process timeline, hover lift on cards, and a reading-progress bar. All of it is
disabled automatically for visitors who have `prefers-reduced-motion` set.

## Note on content

The copy describes SEBI product categories and regulatory minimums (AIF ₹1 crore) as they stood when
written. Confirm the current position — and PVK Capital's own registration details, ARN and any
disclosures required of you — before publishing. Headline figures on the home page describe the
offering (seven solution verticals) rather than claiming any AUM or performance record, so nothing
needs to be walked back.
