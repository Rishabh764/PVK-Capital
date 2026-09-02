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
| `+91 99999 99999` and `tel:+919999999999` | Header/footer, contact page, form fallbacks |
| `contact@pvkcapital.in` | Footer, contact page |
| `919999999999` (WhatsApp) | `assets/js/forms.js` → `CONFIG.whatsapp` |
| `Office address to be added` | `contact.html`, "Visit us" card |
| LinkedIn `href="#"` | Footer of every page |

The phone number, email and WhatsApp number are also centralised in **`assets/js/forms.js`** at the top:

```js
var CONFIG = {
  endpoint: '',
  inbox: 'contact@pvkcapital.in',
  whatsapp: '919999999999'
};
```

Anything marked `data-inbox` or `data-whatsapp` in the HTML is filled in from that object automatically.

## Making the forms actually deliver

There are three forms: the consultation form on the home page, the long client enquiry form on the
contact page, and the short contact form below it.

**Right now** (`endpoint: ''`), submitting a form validates the input, saves a copy in the visitor's
browser (`localStorage`, key `pvk_enquiries`), and opens their mail app with every field pre-filled and
addressed to you. This works with zero setup but relies on the visitor pressing send.

**Recommended for production:** create a free form endpoint and paste it in. No backend required.

1. Sign up at [Formspree](https://formspree.io) (or Getform / Web3Forms — all work the same way).
2. Create a form and copy the endpoint URL, e.g. `https://formspree.io/f/abcdwxyz`.
3. Put it in `assets/js/forms.js`:

```js
var CONFIG = {
  endpoint: 'https://formspree.io/f/abcdwxyz',
  ...
};
```

Every submission then arrives in your inbox with the visitor's name, phone, email, city, address,
selected services, investor type, investment range, preferred call time and message.

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

The copy describes SEBI product categories and regulatory minimums (PMS ₹50 lakh, AIF ₹1 crore, SIF
₹10 lakh) as they stood when written. Confirm the current position — and PVK Capital's own registration
details, ARN and any disclosures required of you — before publishing. Placeholder headline figures on
the home page describe the offering (nine verticals, four asset classes) rather than claiming any AUM
or performance record, so nothing needs to be walked back.
