# Cart redesign: Shopify handoff notes

Prototype files:
- `index.html`: your saved product page, unchanged, plus one added script tag that loads `new-cart/new-cart.js`.
- `new-cart/new-cart.js`: the new cart drawer. It removes the popup, hides the old drawer, and takes over the page's real Add to Cart buttons (main + sticky) and cart icons. The cart contents are mocked, since there is no Shopify backend locally.
- `page_files/`: the saved page's assets, renamed from the long `..._files` folder name.
- `standalone-cart.html`: the earlier cart-only mock.
Theme: FoxTheme-based, cart drawer section `sections/cart-drawer.liquid`.

## 1. Remove the Add to Cart popup

- Delete the **Pack Upsell Popup** section from the product template (`pack_upsell_popup`, section id `template--27803176304945__pack_upsell_popup_hVBYWJ`). This removes `#pack-upsell-popup`, `#pack-upsell-backdrop`, the `PackUpsellPopup` class and its `#pack-upsell-variants` JSON.
- Search the theme JS for calls to `intercept(` (product form / sticky ATC). Remove them, or make them return `true`, so Add to Cart goes straight to the drawer.

## 2. Inline Pack of 2 upgrade in the drawer

Show it right under a cart line when **all** of these are true:
- `item.product_id` is BioSolve Berberine
- `item.variant_id == 54028117803313` (Pack of 1)
- no Pack of 2 / Pack of 3 of this product is already in the cart

Copy (it's the popup's own claim, unchanged): "83% of our users reported better results after 2 months of regular use."
Perks are worked out from variant prices, so don't hard-code them:
- per bottle = `pack2.price / 2`
- saving vs 2 singles = `2 * pack1.price - pack2.price`
- the "unlocks free shipping" line only appears if `cart.total_price - pack1 line + pack2 price >= 150000`

**Upgrade button** (keep the quantity the same):
```js
await fetch('/cart/change.js', {method:'POST', headers:{'Content-Type':'application/json'},
  body: JSON.stringify({ id: line.key, quantity: 0 })});
await fetch('/cart/add.js', {method:'POST', headers:{'Content-Type':'application/json'},
  body: JSON.stringify({ items: [{ id: 54028117836081, quantity: line.quantity }] })});
// then re-render the drawer (FoxTheme: publish PUB_SUB_EVENTS.cartUpdate / fetch section)
```
The full card always shows while Pack of 1 is in the cart. There's no dismiss link, because carrying on with Pack of 1 just means clicking Checkout. The card goes away once Pack of 2 or 3 is in the cart.
Analytics: the same events as before, with `placement: 'cart_drawer'` added.
- `pack2_add_to_cart` / `accepted_upsell`
- `pack_add_to_cart` / `declined_upsell`

## 3. "Added to cart" confirmation

A green status strip at the top of the drawer (`role="status"`, `aria-live="polite"`). It shows "<product> · <variant> added to cart" and hides after about 3.5 s. This replaces the popup's interruption with a confirmation that doesn't block anything.

## 4. Trust / USP block (below line items)

| Item | Source | Status |
|---|---|---|
| Free shipping over ₹1,500 | Shipping policy | Verified |
| Ships in 1–2 business days, tracking by email | Shipping policy | Verified |
| Est. delivery date range (today + 6 to 9 business days) | Shipping policy: 1–2 day dispatch + 5–7 day standard transit | Verified |
| 30-day returns | Site header banner only | **Check against the refund policy before going live** |
| Secure checkout | GoKwik | Generic |

Checkout button sub-line: "Pay with UPI · Paytm · PhonePe · GPay". This matches the icons already on the GoKwik button. Add "COD" only if GoKwik COD is turned on.

Delivery estimate placement: in the drawer footer, directly above the Checkout button (below Estimated total).

## 4b. You may also like

The section goes below the line items and the Pack of 2 card, above the trust badges. Its products are this product's existing **Frequently Bought Together** picks:
- Liposomal Vitamin C, variant `53197029736753`, ₹599 (MRP ₹699)
- Clear Creatine + Taurine, variant `52401198006577`, ₹699 (MRP ₹1,199)

On the live theme, render these from the same FBT data (or from Shopify's `/recommendations/products?intent=complementary`) instead of hard-coding them. Leave out products already in the cart. **+ Add** posts to `/cart/add.js` with quantity 1 and re-renders the drawer.

Analytics: `add_to_cart` with `placement: 'cart_recommendation'`.

A non-Berberine item in the cart does **not** hide the Pack of 2 card. Only Berberine Pack of 2 or 3 does.

## 4c. Layout
- **Mobile (under 768px):** the cart is full-screen at 100vw × 100dvh on every phone width, with no 440px cap. Page scroll is locked while it's open.
- **Desktop (768px and up):** the cart is a 440px panel on the right with a dimmed overlay.

## 5. Kept as-is
- The existing milestone bar (`cart-milestone-progress`: ₹1,500 free shipping / ₹2,500 15% off / ₹4,500 20% off). It's the same component, design and messages, just placed at the top of the new drawer.
- GoKwik `onCheckoutClick(this)` on the checkout button.
- Order note can stay in the footer if you need it (it was left out of the prototype).
