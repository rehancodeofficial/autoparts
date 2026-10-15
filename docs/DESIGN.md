# DESIGN.md — Storefront Design System

Visual reference: autostore.sa homepage, measured on desktop at 1440×900 (computed styles, October 2026).
The project copies the **styling** (colours, type, spacing, shapes, layout). Logo, brand name, images and copy are our own.

---

## 1. Colour tokens

### Brand
| Token | Hex | Used for |
| --- | --- | --- |
| `--primary` | `#E53935` | Search button, cart badge, promo bar, newsletter button, carousel arrows, accent lines, trust-strip top border |
| `--primary-600` | `#D32F2F` | Hover on primary |
| `--primary-700` | `#B71C1C` | Active/pressed primary |
| `--hero-red` | `#D42B2B` | Hero background, gradient start |
| `--orange` | `#FF6600` | Product badges, section underline, filter pills (active), blog tags, gradient end |
| `--orange-deep` | `#E8571F` | Category section accent line |
| `--amber` | `#F5A623` | "Trending" badge on deal cards (text `#1A1A1A`) |
| `--deal-blue` | `#1A5276` | Featured deal card background |
| `--whatsapp` | `#25D366` | WhatsApp buttons |

### Dark surfaces (header, nav, footer, "why choose us")
| Token | Hex | Used for |
| --- | --- | --- |
| `--ink-950` | `#0D0D0D` | Copyright bar |
| `--ink-900` | `#111111` | Utility top bar, "Why choose us" section, mobile drawer |
| `--ink-850` | `#141414` | Mega-menu bar, footer body |
| `--ink-800` | `#1A1A1A` | Main header bar, category cards, dark buttons, newsletter input |
| `--ink-750` | `#1E1E1E` | Footer trust strip |
| `--ink-700` | `#222222` | Social icon circles |
| `--ink-line` | `#2A2A2A` | Footer borders and dividers |
| `--ink-line-2` | `#333333` | Drawer dividers |

### Light surfaces and text
| Token | Hex | Used for |
| --- | --- | --- |
| `--page` | `#EEEEEE` | Page background behind sections |
| `--surface-alt` | `#F5F5F5` | Alternating sections (deals, blog) |
| `--surface-input` | `#F7F8F9` | Inputs, body fallback |
| `--white` | `#FFFFFF` | Cards, product sections |
| `--text-strong` | `#1A1A1A` | Headings, prices, card titles |
| `--text` | `#2B2D42` | Body text |
| `--text-product` | `#333333` | Product names |
| `--text-sub` | `#666666` | Card descriptions |
| `--text-muted` | `#888888` | Section subtitles, blog excerpts |
| `--text-on-dark-muted` | `#999999` | Footer links, utility links |
| `--text-on-dark-faint` | `#777777` | "Call us" label, copyright links |
| `--border` | `#DDDDDD` | Quick-link cards |
| `--border-2` | `#E0E0E0` | Brand cards |
| `--border-3` | `#EEEEEE` | Section header rule (2px) |

### Translucent (on dark)
- Card fill `rgba(255,255,255,0.03)`, card border `rgba(255,255,255,0.06)`
- Stats panel fill `rgba(255,255,255,0.02)`, border `rgba(255,255,255,0.08)`
- Icon box on dark `rgba(255,255,255,0.08)` + border `rgba(255,255,255,0.10)`
- Red icon box `rgba(229,57,53,0.10)` + border `rgba(229,57,53,0.15)`
- Promo chip `rgba(0,0,0,0.18)` on the red bar
- Text on dark: 0.85 (labels), 0.45 (body), 0.35 (small print)
- Overlays: `rgba(0,0,0,0.4)` modal, `rgba(0,0,0,0.6)` drawer

### Gradients
- `--grad-cta`: `linear-gradient(135deg, #D42B2B 0%, #FF6600 100%)` (bottom CTA band)
- `--grad-trending`: `linear-gradient(135deg, #FF6600 0%, #D42B2B 40%, #1A1A1A 100%)` (trending banner; the end stop is approximate)
- `--grad-stat`: `linear-gradient(135deg, #E53935, #FF6600)` applied as text fill on stat numbers
- Category card overlay: `linear-gradient(180deg, transparent 0%, rgba(0,0,0,.1) 35%, rgba(0,0,0,.85) 100%)` (the bottom stop is approximate)

---

## 2. Typography

All four are Google Fonts. Load them with `next/font/google` or `@import`.

| Role | Font | Notes |
| --- | --- | --- |
| UI / header / nav / footer | **DM Sans** 400, 500, 600, 700 | Default for chrome |
| Display headings | **Bebas Neue** 400 | Uppercase, letter-spacing |
| Section titles | **Poppins** 300, 500, 700, 900 | Heavy weights |
| Content (hero, cards, prices) | System stack: `-apple-system, system-ui, "Segoe UI", Roboto, Arial, sans-serif` | |
| Body fallback | **PT Sans** 400, 700 | Optional; the system stack can replace it |
| Arabic (our addition) | **IBM Plex Sans Arabic** or **Cairo** 400–700 | Fallback for every role above when the locale is `ar` |

---

## 3. Shape, depth, motion

| Token | Value | Used for |
| --- | --- | --- |
| `--r-xs` | 2px | Accent underline bars |
| `--r-sm` | 3–4px | Badges, promo chips, form fields |
| `--r-md` | 6px | Quick-link cards, search button (right side only) |
| `--r-lg` | 8px | Product images, blog cards, brand cards, mobile buttons |
| `--r-xl` | 12px | Icon boxes |
| `--r-2xl` | 14px | Why-us cards |
| `--r-3xl` | 16px | Category cards, stats panel |
| `--r-pill` | 50px | All CTA buttons and filter pills |
| `--r-full` | 50% | Cart badge, arrows, brand icon, social icons |

| Shadow | Value |
| --- | --- |
| `--shadow-sm` | `0 1px 4px rgba(0,0,0,.06)` (blog card) |
| `--shadow` | `0 2px 8px rgba(0,0,0,.08)` |
| `--shadow-card` | `0 2px 8px rgba(0,0,0,.12)` (quick-link card) |
| `--shadow-arrow` | `0 3px 10px rgba(0,0,0,.28)` (round carousel arrows) |
| `--shadow-lg` | `0 10px 40px rgba(0,0,0,.15)` (dropdowns, modals) |

Motion: `all .2s ease` on hover. Cards lift 2–4px with a stronger shadow, and images zoom 1.05 inside the card.
