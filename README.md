# GATACA Berberine cart design

A redesigned cart drawer for the GATACA **BioSolve Berberine** product page. It does three things:

- **Removes** the Pack Upsell popup that used to block Add to Cart.
- **Moves** the "Switch to Pack of 2 for better results" offer into the cart, directly under Pack of 1.
- **Adds** trust signals (delivery estimate, free shipping, 30-day returns, secure checkout) and a "You may also like" section.

## View it

Serve the folder with any static server and open `index.html`. The saved product page loads exactly as it is on the live site, with the new cart added on top through `new-cart/new-cart.js`.

1. Click **Add to cart** (main button or sticky bar) to open the new cart.
2. The cart contents are mocked, since there is no Shopify backend.

| File | What it is |
|---|---|
| `index.html` | Saved product page plus one `<script>` tag for the new cart |
| `new-cart/new-cart.js` | The new cart drawer: removes the popup, hides the old drawer, takes over the page's real Add to Cart buttons |
| `page_files/` | The saved page's assets |
| `standalone-cart.html` | An early cart-only mock |
| `IMPLEMENTATION.md` | Handoff notes for building this in the Shopify theme |

## Before going live

- Check the "30-day returns" badge against the refund policy. It currently comes from the site's header banner only.
- Only show COD if GoKwik COD is enabled.
