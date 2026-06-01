# Trev's Cafe and Restaurant website

Static website prototype for `trevsatdickson.com.au`.

## What is included

- Modern responsive restaurant storefront with a prominent Trev's logo and clear header.
- Dropdown menu navigation for Breakfast/Lunch, Dinner, Takeaway and Catering.
- Full menu category layout with Trev's Specials, cart, Pay at Counter and Pay Now flow.
- All 49 supplied client food photos copied into `assets/menu` and matched to the closest dish names.
- Monday 10% off popup, gift voucher link, booking link and catering section.
- Admin Portal for editing item names, descriptions, prices, photo paths, Square checkout link and viewing saved orders.
- Missing photos automatically fall back to `assets/trevs-logo.svg`.

## Free hosting options

This site can be hosted without monthly fees on GitHub Pages, Cloudflare Pages, Netlify free tier, or similar static hosting.

## Notes for production

The current admin portal and order manager use browser storage so the client can test the workflow immediately. For live multi-device order management, connect the same interface to a backend such as Square Online, Firebase free tier, Supabase free tier, or a small serverless database.

Card payment is ready to connect by adding a Square checkout URL in the Admin Portal.
