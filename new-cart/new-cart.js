/*
 * GATACA new cart drawer (prototype layer for the saved product page).
 * - Removes the Pack Upsell popup
 * - Hides the old theme cart drawer
 * - Sends the page's real Add to Cart buttons (main form + sticky bar) and cart icons to this drawer
 * Everything is namespaced with "gc-" so it can't clash with theme CSS.
 */
(() => {
  const PRODUCT = 'BioSolve Berberine';
  const IMG = './page_files/Berberine_bottle.jpg';
  const VARIANTS = {
    54028117803313:{key:'p1',name:PRODUCT,img:IMG,title:'Pack of 1',supply:'1-month supply',price:149900,mrp:180000},
    54028117836081:{key:'p2',name:PRODUCT,img:IMG,title:'Pack of 2',supply:'2-month supply',price:269900,mrp:360000},
    54028117868849:{key:'p3',name:PRODUCT,img:IMG,title:'Pack of 3',supply:'3-month supply',price:399900,mrp:540000},
  };
  // "You may also like": the store's own Frequently Bought Together picks for this product (saved page data).
  const RECS = {
    53197029736753:{name:'Liposomal Vitamin C',title:'Liposomal Vitamin C',supply:'Immunity, skin & iron absorption',img:'./page_files/image_dc4494cc-2fcf-4c30-8008-a3c7c837e3ba.png',url:'https://gataca.in/products/liposomal-vitamin-c',price:59900,mrp:69900},
    52401198006577:{name:'Clear Creatine + Taurine',title:'Clear Creatine + Taurine',supply:'Strength, power & recovery',img:'./page_files/First.png',url:'https://gataca.in/products/clear-creatine-taurine',price:69900,mrp:119900},
  };
  const BY_TITLE = Object.fromEntries(Object.entries(VARIANTS).map(([id,v]) => [v.title.toLowerCase(), +id]));
  Object.assign(VARIANTS, RECS); // after BY_TITLE so pack-radio matching only sees Berberine packs
  const P1 = 54028117803313, P2 = 54028117836081;
  const MILESTONES = [150000, 250000, 450000];

  const state = { lines: [], justUpgraded: false };
  const inr = p => '₹' + Math.round(p/100).toLocaleString('en-IN');
  const track = (n, p) => { if (typeof gtag !== 'undefined') try { gtag('event', n, p); } catch(e){} };

  /* ---------------- 1. Kill the popup + old drawer ---------------- */
  function neuterOld(){
    window.packUpsell = null; // theme's capture listener bails out when this is falsy
    document.getElementById('pack-upsell-popup')?.remove();
    document.getElementById('pack-upsell-backdrop')?.remove();
    const old = document.getElementById('CartDrawer');
    if (old) { old.setAttribute('hidden',''); old.style.display = 'none'; }
  }

  /* ---------------- 2. Styles ---------------- */
  const css = `
  #gc-root{--gc-fg:#000;--gc-muted:#666;--gc-subtle:#8a8a8a;--gc-border:#e6e6e6;--gc-border-strong:#cfcfcf;--gc-soft:#f7f7f7;--gc-field:#f5f5f5;--gc-accent:#d63a2f;--gc-success:#1f7a4d;--gc-success-bg:#eaf6ef;--gc-up-bg:#fff8f0;--gc-up-border:#f3d9bf;--gc-r:12px;--gc-rs:8px;--gc-ease:cubic-bezier(.2,.8,.2,1);
    font-family:Poppins,system-ui,sans-serif;font-size:14px;line-height:1.5;color:var(--gc-fg);letter-spacing:normal;-webkit-font-smoothing:antialiased}
  #gc-root *{box-sizing:border-box;letter-spacing:normal;text-transform:none}
  #gc-root [hidden]{display:none!important}
  #gc-root p,#gc-root h2,#gc-root ul{margin:0}
  #gc-root button{font-family:inherit;color:inherit;cursor:pointer;margin:0;text-transform:none;letter-spacing:normal}
  #gc-root img{display:block;max-width:100%;height:auto}
  #gc-root :focus-visible{outline:2px solid #000;outline-offset:2px}
  body.gc-open{overflow:hidden}
  .gc-overlay{position:fixed;inset:0;background:rgba(20,20,20,.45);opacity:0;visibility:hidden;transition:opacity .3s var(--gc-ease),visibility .3s;z-index:2147483000}
  .gc-drawer{position:fixed;top:0;right:0;height:100%;height:100dvh;width:100%;max-width:440px;background:#fff;box-shadow:-12px 0 40px rgba(0,0,0,.12);transform:translateX(100%);transition:transform .38s var(--gc-ease);z-index:2147483001;display:flex;flex-direction:column}
  /* Mobile: full-screen cart on any phone width, not capped at 440px */
  @media (max-width:767px){
    .gc-drawer{inset:0;width:100vw;max-width:none;height:100vh;height:100dvh;box-shadow:none}
    html.gc-lock,html.gc-lock body{overflow:hidden!important;overscroll-behavior:none}
  }
  body.gc-open .gc-overlay{opacity:1;visibility:visible}
  body.gc-open .gc-drawer{transform:none}
  .gc-head{padding:18px 20px 14px;border-bottom:1px solid var(--gc-border)}
  .gc-title-row{display:flex;align-items:center;justify-content:space-between}
  .gc-title{font-size:18px!important;font-weight:600!important;line-height:1.3!important;display:flex;align-items:center;gap:8px;font-family:inherit!important}
  .gc-pill{background:#000;color:#fff;font-size:11px;font-weight:600;border-radius:999px;min-width:22px;height:22px;padding:0 7px;display:inline-grid;place-items:center}
  .gc-x{background:none;border:0;width:40px;height:40px;border-radius:50%;display:grid;place-items:center;margin-right:-10px;padding:0}
  .gc-x:hover{background:var(--gc-soft)}
  .gc-added{display:flex;align-items:center;gap:10px;background:var(--gc-success-bg);color:var(--gc-success);border-radius:var(--gc-rs);font-size:13px;font-weight:500;margin-top:12px;overflow:hidden;max-height:0;opacity:0;padding:0 12px;transition:max-height .35s var(--gc-ease),opacity .25s,padding .35s var(--gc-ease)}
  .gc-added.is-on{max-height:60px;opacity:1;padding:10px 12px}
  .gc-added svg{flex:none}
  .gc-ms{margin-top:14px}
  .gc-ms-msg{font-size:13px;margin:0 0 10px!important;font-weight:500}
  .gc-ms-msg strong{color:var(--gc-accent);font-weight:600}
  .gc-track{position:relative;height:6px;background:var(--gc-field);border-radius:999px;margin:0 6px 26px}
  .gc-fill{position:absolute;top:0;bottom:0;left:0;width:0;background:#000;border-radius:inherit;transition:width .6s var(--gc-ease)}
  .gc-stop{position:absolute;top:50%;transform:translate(-50%,-50%);display:flex;flex-direction:column;align-items:center}
  .gc-dot{width:16px;height:16px;border-radius:50%;background:#fff;border:2px solid var(--gc-border-strong);display:grid;place-items:center;transition:all .3s}
  .gc-stop.is-done .gc-dot{background:#000;border-color:#000}
  .gc-dot svg{opacity:0}
  .gc-stop.is-done .gc-dot svg{opacity:1}
  .gc-lbl{position:absolute;top:18px;white-space:nowrap;font-size:10.5px;font-weight:600;color:var(--gc-subtle);text-transform:uppercase!important;letter-spacing:.02em!important}
  .gc-stop.is-done .gc-lbl{color:#000}
  .gc-stop:last-child .gc-lbl{right:-6px}
  .gc-body{flex:1;overflow-y:auto;padding:16px 20px 20px;display:flex;flex-direction:column;gap:16px;overscroll-behavior:contain}
  .gc-line{display:grid;grid-template-columns:76px 1fr;gap:14px}
  .gc-img{width:76px;height:76px;border-radius:var(--gc-rs);background:var(--gc-soft);overflow:hidden}
  .gc-img img{width:100%;height:100%!important;object-fit:cover}
  .gc-top{display:flex;justify-content:space-between;gap:8px}
  .gc-name{font-weight:600;font-size:14px;line-height:1.35}
  .gc-var{color:var(--gc-muted);font-size:12.5px;margin-top:2px!important;display:flex;flex-wrap:wrap;align-items:center;gap:4px 6px}
  .gc-tag{display:inline-block;font-size:10.5px;font-weight:600;border-radius:4px;padding:1px 6px;background:var(--gc-success-bg);color:var(--gc-success)}
  .gc-bottom{display:flex;align-items:center;justify-content:space-between;margin-top:10px}
  .gc-qty{display:inline-flex;align-items:center;border:1px solid var(--gc-border);border-radius:999px;height:34px}
  .gc-qty button{width:34px;height:32px;border:0;background:none;font-size:16px;border-radius:999px;padding:0;line-height:1}
  .gc-qty button:hover{background:var(--gc-soft)}
  .gc-qty span{min-width:22px;text-align:center;font-weight:500;font-size:13px}
  .gc-price{text-align:right;line-height:1.25}
  .gc-price b{font-weight:600}
  .gc-price s{display:block;color:var(--gc-subtle);font-size:12px}
  .gc-rm{background:none;border:0;color:var(--gc-subtle);padding:2px;height:24px}
  .gc-rm:hover{color:#000}
  .gc-up{border:1.5px solid var(--gc-up-border);background:var(--gc-up-bg);border-radius:var(--gc-r);padding:14px;position:relative;animation:gc-rise .4s var(--gc-ease) both}
  @keyframes gc-rise{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
  .gc-badge{position:absolute;top:-10px;left:14px;background:var(--gc-accent);color:#fff;font-size:10.5px;font-weight:600;letter-spacing:.04em!important;text-transform:uppercase!important;border-radius:999px;padding:3px 10px}
  .gc-up-head{display:flex;gap:12px;align-items:flex-start;margin-top:4px}
  .gc-thumb{position:relative;width:52px;height:52px;flex:none}
  .gc-thumb img{width:40px;height:40px!important;border-radius:6px;object-fit:cover;position:absolute;background:#fff;border:1px solid var(--gc-border)}
  .gc-thumb img:first-child{top:0;left:0}
  .gc-thumb img:last-child{bottom:0;right:0}
  .gc-up-title{font-weight:600;font-size:14.5px;line-height:1.35}
  .gc-up-proof{font-size:12.5px;color:var(--gc-muted);margin-top:3px!important}
  .gc-up-proof b{color:#000;font-weight:600}
  .gc-perks{list-style:none;margin:12px 0!important;padding:0;display:grid;gap:6px;font-size:12.5px}
  .gc-perks li{display:flex;gap:8px;align-items:center;margin:0}
  .gc-perks svg{flex:none;color:var(--gc-success)}
  .gc-btn-up{width:100%;display:flex;align-items:center;justify-content:center;gap:6px;border:0;border-radius:var(--gc-rs);background:#000;color:#fff!important;min-height:44px;padding:0 14px;font-size:14px;font-weight:600}
  .gc-btn-up:hover{background:#222}
  .gc-btn-up small{font-weight:400;opacity:.8;font-size:12px}
  .gc-done{display:flex;gap:8px;align-items:center;font-size:12.5px;color:var(--gc-success);background:var(--gc-success-bg);border-radius:var(--gc-rs);padding:8px 12px;animation:gc-rise .35s var(--gc-ease) both}
  .gc-eta{display:flex;gap:10px;align-items:center;background:var(--gc-soft);border-radius:var(--gc-rs);padding:9px 12px}
  .gc-eta svg{flex:none}
  .gc-eta p{font-size:12.5px;line-height:1.35}
  .gc-eta strong{font-weight:600}
  .gc-eta span{color:var(--gc-muted);font-size:11.5px}
  .gc-recs{display:grid;gap:10px}
  .gc-recs-h{font-size:15px;font-weight:600}
  .gc-recs-row{display:grid;gap:10px}
  .gc-rec{display:grid;grid-template-columns:60px 1fr auto;gap:12px;align-items:center;border:1px solid var(--gc-border);border-radius:var(--gc-r);padding:10px}
  .gc-rec-img{width:60px;height:60px;border-radius:var(--gc-rs);background:var(--gc-soft);overflow:hidden;display:block}
  .gc-rec-img img{width:100%;height:100%!important;object-fit:cover}
  .gc-rec-info{min-width:0}
  .gc-rec-name{display:block;font-size:13px;font-weight:600;line-height:1.3;color:#000;text-decoration:none}
  .gc-rec-name:hover{text-decoration:underline}
  .gc-rec-sub{font-size:11.5px;color:var(--gc-muted);margin-top:1px!important}
  .gc-rec-price{font-size:13px;margin-top:3px!important}
  .gc-rec-price b{font-weight:600}
  .gc-rec-price s{color:var(--gc-subtle);font-size:11.5px;margin-left:4px}
  .gc-rec-add{border:1.5px solid #000;background:#fff;border-radius:999px;height:34px;padding:0 14px;font-size:12.5px;font-weight:600;white-space:nowrap}
  .gc-rec-add:hover{background:#000;color:#fff!important}
  .gc-trust{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
  .gc-ti{border:1px solid var(--gc-border);border-radius:var(--gc-rs);padding:12px 8px;text-align:center;display:flex;flex-direction:column;align-items:center;gap:6px}
  .gc-ti svg{width:22px;height:22px}
  .gc-ti b{font-size:12px;font-weight:600;line-height:1.25}
  .gc-ti span,.gc-ti a{font-size:11px;color:var(--gc-muted);line-height:1.3}
  .gc-ti a{text-decoration:underline}
  .gc-empty{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:12px;padding:40px 20px;color:var(--gc-muted)}
  .gc-empty b{color:#000;font-size:17px;font-weight:600}
  .gc-foot{border-top:1px solid var(--gc-border);padding:14px 20px calc(16px + env(safe-area-inset-bottom));display:grid;gap:10px;background:#fff}
  .gc-row{display:flex;justify-content:space-between;align-items:baseline;font-size:13px}
  .gc-save{color:var(--gc-success);font-weight:500}
  .gc-total{font-size:16px;font-weight:600}
  .gc-checkout{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;border:0;border-radius:var(--gc-rs);background:#000;color:#fff!important;min-height:54px;width:100%;font-size:16px;font-weight:600;line-height:1.2}
  .gc-checkout:hover{background:#222}
  .gc-checkout small{font-size:11px;font-weight:400;opacity:.8}
  .gc-checkout .gc-lock{position:absolute;left:16px;top:50%;transform:translateY(-50%)}
  .gc-note{font-size:11.5px;color:var(--gc-muted);text-align:center}
  .gc-note a{color:inherit;text-decoration:underline}
  @media (prefers-reduced-motion:reduce){#gc-root *{animation:none!important;transition:none!important}}
  `;

  /* ---------------- 3. Markup ---------------- */
  const tick = '<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="4"><path d="m5 12 5 5 9-10"/></svg>';
  const check = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 5 5 9-10"/></svg>';
  const shell = `
    <div class="gc-overlay" data-gc-close></div>
    <aside class="gc-drawer" role="dialog" aria-modal="true" aria-labelledby="gc-title" aria-hidden="true">
      <header class="gc-head">
        <div class="gc-title-row">
          <h2 class="gc-title" id="gc-title">Your cart <span class="gc-pill" id="gc-count">0</span></h2>
          <button class="gc-x" type="button" data-gc-close aria-label="Close cart"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg></button>
        </div>
        <div class="gc-added" id="gc-added" role="status" aria-live="polite">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m8 12 3 3 5-6"/></svg>
          <span id="gc-added-text"></span>
        </div>
        <div class="gc-ms" id="gc-ms">
          <div id="gc-ms-own">
          <p class="gc-ms-msg" id="gc-ms-msg"></p>
          <div class="gc-track" aria-hidden="true">
            <div class="gc-fill" id="gc-fill"></div>
            <div class="gc-stop" style="left:33.33%" data-at="150000"><div class="gc-dot">${tick}</div><span class="gc-lbl">Free shipping</span></div>
            <div class="gc-stop" style="left:66.66%" data-at="250000"><div class="gc-dot">${tick}</div><span class="gc-lbl">15% off</span></div>
            <div class="gc-stop" style="left:100%" data-at="450000"><div class="gc-dot">${tick}</div><span class="gc-lbl">20% off</span></div>
          </div>
          </div>
        </div>
      </header>
      <div class="gc-body" id="gc-body"></div>
      <footer class="gc-foot" id="gc-foot">
        <div class="gc-row gc-save" id="gc-save-row"><span>You're saving</span><span id="gc-save"></span></div>
        <div class="gc-row gc-total"><span>Estimated total</span><span id="gc-total">₹0</span></div>
        <div class="gc-eta">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7h11v9H3zM14 10h4l3 3v3h-7"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/></svg>
          <p><strong id="gc-eta-text"></strong><br><span>Ships in 1–2 business days. Tracking link sent by email.</span></p>
        </div>
        <button class="gc-checkout" type="button">
          <svg class="gc-lock" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>
          Checkout<small>Pay with UPI · Paytm · PhonePe · GPay</small>
        </button>
        <p class="gc-note">Tax included. Shipping &amp; discounts calculated at checkout. <a href="https://gataca.in/policies/shipping-policy">Shipping policy</a></p>
      </footer>
    </aside>`;

  /* ---------------- 4. Helpers ---------------- */
  function addBiz(n){ const d = new Date(); while(n > 0){ d.setDate(d.getDate()+1); const w = d.getDay(); if (w && w !== 6) n--; } return d; }
  const fmt = d => d.toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short'});
  const etaFrom = addBiz(1+5), etaTo = addBiz(2+7);
  const $ = id => document.getElementById(id);

  function add(id, qty){ const l = state.lines.find(x => x.id === id); l ? l.qty += qty : state.lines.push({id, qty}); }
  function setQty(id, qty){
    if (qty <= 0) state.lines = state.lines.filter(l => l.id !== id);
    else state.lines.find(l => l.id === id).qty = qty;
    render();
  }
  function upgrade(){
    const l1 = state.lines.find(l => l.id === P1); if (!l1) return;
    const existing = state.lines.find(l => l.id === P2);
    if (existing) { existing.qty += l1.qty; state.lines = state.lines.filter(l => l.id !== P1); }
    else l1.id = P2; // swap in place so it keeps its position in the list
    state.justUpgraded = true;
    track('pack2_add_to_cart',{event_category:'ecommerce',event_label:'Cart upgrade to Pack 2',action:'accepted_upsell',pack_selected:'pack_2',placement:'cart_drawer'});
    render(); flash(`Upgraded to Pack of 2`);
  }
  const totals = () => state.lines.reduce((t,l) => { const v = VARIANTS[l.id]; t.price += v.price*l.qty; t.mrp += v.mrp*l.qty; t.count += l.qty; return t; }, {price:0,mrp:0,count:0});

  /* ---------------- 5. Render ---------------- */
  function lineHTML(l){
    const v = VARIANTS[l.id];
    return `<div class="gc-line">
      <div class="gc-img"><img src="${v.img}" alt=""></div>
      <div>
        <div class="gc-top">
          <div><p class="gc-name">${v.name}</p><p class="gc-var">${v.key ? `${v.title} · ` : ''}${v.supply}${v.key && l.id !== P1 ? ' <span class="gc-tag">Best results</span>' : ''}</p></div>
          <button class="gc-rm" type="button" data-gc-rm="${l.id}" aria-label="Remove ${v.title}"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M10 11v6M14 11v6M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/></svg></button>
        </div>
        <div class="gc-bottom">
          <div class="gc-qty" role="group" aria-label="Quantity"><button type="button" data-gc-dec="${l.id}" aria-label="Decrease quantity">−</button><span>${l.qty}</span><button type="button" data-gc-inc="${l.id}" aria-label="Increase quantity">+</button></div>
          <div class="gc-price"><b>${inr(v.price*l.qty)}</b><s>${inr(v.mrp*l.qty)}</s></div>
        </div>
      </div>
    </div>`;
  }
  function upsellHTML(q){
    const p1 = VARIANTS[P1], p2 = VARIANTS[P2];
    return `<section class="gc-up" aria-label="Upgrade suggestion">
      <span class="gc-badge">Most chosen</span>
      <div class="gc-up-head">
        <div class="gc-thumb"><img src="${IMG}" alt=""><img src="${IMG}" alt=""></div>
        <div><p class="gc-up-title">Switch to Pack of 2 for better results</p>
        <p class="gc-up-proof"><b>83% of our users</b> reported better results after 2 months of regular use.</p></div>
      </div>
      <ul class="gc-perks">
        <li>${check} Full 2-month course, ${inr(p2.price/2)} per bottle</li>
        <li>${check} Save ${inr((p1.price*2 - p2.price)*q)} vs buying 2 single packs</li>
        <li>${check} Unlocks free shipping on this order</li>
      </ul>
      <button class="gc-btn-up" type="button" data-gc-upgrade>Upgrade to Pack of 2 <small>+${inr((p2.price-p1.price)*q)}</small></button>
    </section>`;
  }
  function recsHTML(){
    const list = Object.entries(RECS).filter(([id]) => !state.lines.some(l => l.id === +id));
    if (!list.length) return '';
    return `<section class="gc-recs" aria-label="You may also like">
      <p class="gc-recs-h">You may also like</p>
      <div class="gc-recs-row">${list.map(([id,r]) => `
        <div class="gc-rec">
          <a class="gc-rec-img" href="${r.url}"><img src="${r.img}" alt="${r.name}" loading="lazy"></a>
          <div class="gc-rec-info">
            <a class="gc-rec-name" href="${r.url}">${r.name}</a>
            <p class="gc-rec-sub">${r.supply}</p>
            <p class="gc-rec-price"><b>${inr(r.price)}</b> <s>${inr(r.mrp)}</s></p>
          </div>
          <button class="gc-rec-add" type="button" data-gc-add="${id}" aria-label="Add ${r.name} to cart">+ Add</button>
        </div>`).join('')}
      </div>
    </section>`;
  }
  function trustHTML(){
    return `<div class="gc-trust" role="list">
        <div class="gc-ti" role="listitem"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8 12 3 3 8v8l9 5 9-5z"/><path d="m3 8 9 5 9-5M12 13v8"/></svg><b>Free shipping</b><span>On orders over ₹1,500</span></div>
        <div class="gc-ti" role="listitem"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></svg><b>30-day returns</b><a href="https://gataca.in/policies/refund-policy">See refund policy</a></div>
        <div class="gc-ti" role="listitem"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 4 6v6c0 4.5 3.4 8.3 8 9 4.6-.7 8-4.5 8-9V6z"/><path d="m9 12 2 2 4-4"/></svg><b>Secure checkout</b><span>Encrypted payments</span></div>
      </div>`;
  }
  // Use the store's own milestone bar (cart-milestone-progress) when it's on the page.
  let themeBar = null;
  function adoptThemeBar(){
    const wrap = document.querySelector('#CartDrawer .cart-milestone-wrapper') || document.querySelector('.cart-milestone-wrapper');
    const bar = wrap?.querySelector('cart-milestone-progress');
    if (!wrap || !bar) return;
    wrap.classList.remove('hidden');
    wrap.style.padding = '0';
    $('gc-ms-own').remove();
    $('gc-ms').appendChild(wrap);
    themeBar = bar;
  }
  function milestones(total){
    if (themeBar){
      if (typeof themeBar.updateProgressBar === 'function') themeBar.updateProgressBar(total);
      else document.dispatchEvent(new CustomEvent('cart:updated', {detail:{cart:{total_price: total}}}));
      return;
    }
    const [m1,m2,m3] = MILESTONES; let pct, msg;
    if (total >= m3){ pct = 100; msg = `<strong>You've unlocked 20% off 🎉</strong>`; }
    else if (total >= m2){ pct = 66.66 + (total-m2)/(m3-m2)*33.33; msg = `<strong>15% off unlocked.</strong> Add ${inr(m3-total)} more for 20% off`; }
    else if (total >= m1){ pct = 33.33 + (total-m1)/(m2-m1)*33.33; msg = `<strong>Free shipping unlocked.</strong> Add ${inr(m2-total)} more for 15% off`; }
    else { pct = total/m1*33.33; msg = `You're <strong>${inr(m1-total)}</strong> away from free shipping`; }
    $('gc-fill').style.width = Math.min(pct,100) + '%';
    $('gc-ms-msg').innerHTML = msg;
    document.querySelectorAll('#gc-root .gc-stop').forEach(s => s.classList.toggle('is-done', total >= +s.dataset.at));
  }
  function render(){
    const t = totals();
    $('gc-count').textContent = t.count;
    $('gc-ms').hidden = !t.count; $('gc-foot').hidden = !t.count;
    milestones(t.price);
    const body = $('gc-body');
    if (!t.count){ body.innerHTML = `<div class="gc-empty"><b>Your cart is empty</b><p>Pick a pack to get started.</p></div>`; return; }
    const hasMulti = state.lines.some(l => VARIANTS[l.id].key && l.id !== P1); // Berberine Pack of 2/3 only
    let html = '';
    state.lines.forEach(l => { html += lineHTML(l); if (l.id === P1 && !hasMulti) html += upsellHTML(l.qty); });
    if (state.justUpgraded && !state.lines.some(l => l.id === P1)) html += `<div class="gc-done">${check} Nice choice. You're set for the full 2-month course.</div>`;
    html += recsHTML() + trustHTML();
    body.innerHTML = html;
    const save = t.mrp - t.price;
    $('gc-save-row').hidden = save <= 0;
    $('gc-save').textContent = '−' + inr(save);
    $('gc-total').textContent = inr(t.price);
    // keep the theme's header/sticky cart badges in sync
    document.querySelectorAll('cart-count').forEach(c => { c.textContent = t.count; c.hidden = !t.count; });
  }

  /* ---------------- 6. Open / close ---------------- */
  let lastFocus = null, flashT = null;
  function open(){ lastFocus = document.activeElement; document.body.classList.add('gc-open'); document.documentElement.classList.add('gc-lock'); document.querySelector('#gc-root .gc-drawer').setAttribute('aria-hidden','false'); setTimeout(() => document.querySelector('#gc-root .gc-x').focus(), 60); }
  function close(){ document.body.classList.remove('gc-open'); document.documentElement.classList.remove('gc-lock'); document.querySelector('#gc-root .gc-drawer').setAttribute('aria-hidden','true'); lastFocus?.focus?.(); }
  function flash(text){ $('gc-added-text').textContent = text; const el = $('gc-added'); el.classList.add('is-on'); clearTimeout(flashT); flashT = setTimeout(() => el.classList.remove('is-on'), 3500); }

  /* ---------------- 7. Read the page's selected pack ---------------- */
  function selectedVariant(form){
    // Sticky bar uses <select name="id">
    const sel = form.querySelector('select[name="id"]');
    if (sel && VARIANTS[+sel.value]) return +sel.value;
    // Main form: the visible pack radios are the source of truth
    const radio = document.querySelector('variant-selects input[type="radio"]:checked');
    if (radio && BY_TITLE[radio.value.trim().toLowerCase()]) return BY_TITLE[radio.value.trim().toLowerCase()];
    const hid = form.querySelector('input[name="id"]');
    return hid && VARIANTS[+hid.value] ? +hid.value : null;
  }
  function selectedQty(form){
    const q = form.querySelector('input[name="quantity"]') || (form.id && document.querySelector(`input[name="quantity"][form="${form.id}"]`));
    return Math.max(1, parseInt(q?.value, 10) || 1);
  }

  function onAtc(e){
    const btn = e.target.closest?.('button[name="add"], .product-form__submit');
    if (!btn) return;
    const form = btn.closest('form') || (btn.form);
    if (!form || !String(form.action).includes('/cart/add')) return;
    const id = selectedVariant(form);
    if (!id) return; // not this product: leave it alone
    e.preventDefault(); e.stopImmediatePropagation();
    add(id, selectedQty(form));
    state.justUpgraded = false;
    track(id === P1 ? 'pack_add_to_cart' : 'pack2_add_to_cart', {event_category:'ecommerce',pack_selected:VARIANTS[id].key.replace('p','pack_')});
    render(); open(); flash(`${PRODUCT} · ${VARIANTS[id].title} added to cart`);
  }
  function onCartIcon(e){
    const a = e.target.closest?.('.cart-drawer-button, a[href$="/cart"], [aria-controls="CartDrawer"]');
    if (!a || a.closest('#gc-root')) return;
    e.preventDefault(); e.stopImmediatePropagation();
    render(); open();
  }

  /* ---------------- 8. Boot ---------------- */
  function boot(){
    neuterOld();
    const style = document.createElement('style'); style.id = 'gc-style'; style.textContent = css; document.head.appendChild(style);
    const root = document.createElement('div'); root.id = 'gc-root'; root.innerHTML = shell; document.body.appendChild(root);
    adoptThemeBar();
    $('gc-eta-text').textContent = `Estimated delivery: ${fmt(etaFrom)} – ${fmt(etaTo)}`;
    root.addEventListener('click', e => {
      const t = e.target.closest('button, .gc-overlay'); if (!t) return;
      if (t.matches('[data-gc-close]')) return close();
      if (t.dataset.gcInc) { const l = state.lines.find(x => x.id === +t.dataset.gcInc); return setQty(l.id, l.qty+1); }
      if (t.dataset.gcDec) { const l = state.lines.find(x => x.id === +t.dataset.gcDec); return setQty(l.id, l.qty-1); }
      if (t.dataset.gcRm) return setQty(+t.dataset.gcRm, 0);
      if (t.matches('[data-gc-upgrade]')) return upgrade();
      if (t.dataset.gcAdd) {
        const id = +t.dataset.gcAdd, r = RECS[id];
        add(id, 1);
        track('add_to_cart', {event_category:'ecommerce', event_label:r.name, placement:'cart_recommendation'});
        render(); flash(`${r.name} added to cart`);
        return;
      }
    });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && document.body.classList.contains('gc-open')) close(); });
    render();
    // Theme scripts can re-create these later; keep them gone.
    setTimeout(neuterOld, 1500);
  }
  // Window-level capture runs before the theme's document-level capture handlers (incl. the old popup).
  window.addEventListener('click', onAtc, true);
  window.addEventListener('click', onCartIcon, true);
  window.addEventListener('submit', e => {
    if (String(e.target.action).includes('/cart/add') && selectedVariant(e.target)) { e.preventDefault(); e.stopImmediatePropagation(); }
  }, true);
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', boot) : boot();
})();
