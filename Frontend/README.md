# PVK Capital — Website

Static website (HTML / CSS / vanilla JS, no build step). Open `index.html` in a browser, or serve the
folder with any static server.

```
python -m http.server 8000      # then visit http://localhost:8000
```

## Pages

| File | What it contains |
| --- | --- |
| `index.html` | Hero, three principles, all nine services, embedded SIP calculator, founder section, 5-step process, who we serve, enquiry form |
| `about.html` | Vedant Shah's story, the Preservation / Value / Knowledge philosophy, six commitments, FAQ |
| `services.html` | Full detail on all nine mandates, each with an "at a glance" fact panel and a direct enquiry link |
| `calculators.html` | SIP (with optional annual step-up) and lumpsum calculators, both in INR, plus the formulas used |
| `contact.html` | Contact details, the long client enquiry form, a short contact form, and a practical FAQ |

## Files to add

**1. The founder's photograph** — save it as:

```
assets/img/founder.jpg
```

Portrait orientation, 4:5 ratio, at least 800 × 1000 px. It appears on `index.html` and `about.html`.
Until the file exists, an elegant placeholder is shown automatically (no broken image icon), so you can
drop it in at any time with no code changes.

The logo ships as two transparent SVGs (no white box, sits naturally on any background — cream, white,
or the dark footer):

- `assets/img/pvk-icon.svg` — emblem only (shield + PVK monogram). Used in the nav, footer and browser
  tab icon, everywhere the "PVK Capital" wordmark already appears as live text beside it.
- `assets/img/pvk-logo.svg` — full lockup (emblem + "PVK Capital" + tagline). Used once, standalone, in
  the homepage hero.

## Details to replace before going live

These placeholders appear across the site. Search and replace them everywhere:

| Placeholder | Where |
| --- | --- |
| `+91 95108 09046` and `tel:+919510809046` | Header/footer, contact page, form fallbacks |
| `pvkcapital.in@gmail.com` | Footer, contact page |
| LinkedIn `href="#"` | Footer of every page |

The phone number and email are also centralised in **`assets/js/forms.js`** at the top:

```js
var CONFIG = {
  endpoint: '',
  inbox: 'pvkcapital.in@gmail.com',
  phone: '9510809046'
};
```

Anything marked `data-inbox` in the HTML is filled in from that object automatically.

## Making the forms actually deliver

There are two forms: the consultation form on the home page and the long client enquiry form on the
contact page. Both post to the same `CONFIG.endpoint`.

**Right now** (`endpoint: ''`), submitting a form validates the input, saves a copy in the visitor's
browser (`localStorage`, key `pvk_enquiries`), and opens their mail app with every field pre-filled and
addressed to you. This works with zero setup but relies on the visitor pressing send.

**Recommended for production: Google Apps Script.** On every submission it emails the founder with the
full enquiry details *and* sends the visitor a confirmation email — no third-party service, no backend
to host, free on a personal Google account.

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
    ├── js/main.js           nav, scroll reveal, counters, accordions, timeline
    ├── js/calculators.js    SIP + lumpsum maths, donut and bar chart rendering
    ├── js/forms.js          validation, submission, URL prefill, contact config
    └── img/
        ├── pvk-icon.svg     emblem only — transparent, nav/footer/favicon
        ├── pvk-logo.svg     full lockup — transparent, hero only
        └── founder.jpg      ← to be added
```

## Design notes

Colours are sampled from the logo: burgundy `#7C1B24`, gold `#C6892C` → `#E7BE63`, warm cream
`#FBF8F3`, near-black ink `#1B120F`. Type is Cormorant Garamond (display) with Inter (body), both from
Google Fonts with local fallbacks.

Everything is defined as CSS custom properties at the top of `style.css` — change the palette there and
it updates across all five pages.

Motion: entrance animations on the hero, scroll-triggered reveals, animated counters, a scroll-linked
progress line on the process timeline, hover lift on cards, and a reading-progress bar. All of it is
disabled automatically for visitors who have `prefers-reduced-motion` set.

## Note on content

The copy describes SEBI product categories and regulatory minimums (AIF ₹1 crore) as they stood when
written. Confirm the current position — and PVK Capital's own registration details, ARN and any
disclosures required of you — before publishing. Placeholder headline figures on the home page describe
the offering (seven verticals, four asset classes) rather than claiming any AUM or performance record,
so nothing needs to be walked back.
