# CPI: Cleveland Property Inspectors website

A fast, mobile-friendly, single-page website. Plain HTML/CSS/JS with no build step.

## Files
- `index.html`: page content
- `styles.css`: design and layout
- `script.js`: mobile menu and form handling

## Preview
Open `index.html` in a browser, or run `python3 -m http.server` in this folder and visit http://localhost:8000.

## Before going live: replace the placeholders
| Placeholder | Where |
|---|---|
| Phone `(216) 555-0123` / `tel:+12165550123` | `index.html` (header, booking section) |
| Email `info@cpi-inspections.com` | `index.html` (booking section) and `BUSINESS_EMAIL` in `script.js` |
| License `#OHI.0000000` | `index.html` (footer) |
| Prices and add-on rates | `index.html`, `#pricing` section |
| Hours, service-area towns | `index.html`, `#book` and `#areas` sections |

## Forms
By default, the quote and booking forms open the visitor's email app with the request pre-filled. To receive submissions directly instead, sign up for a form service such as Formspree or Netlify Forms, set the form's `action` to the URL it gives you, and remove the `data-mailto-form` attribute.

## Hosting
Upload the folder to any static host: Netlify, GitHub Pages, Cloudflare Pages, or your web host's file manager.
