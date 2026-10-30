/* Villa Gourmand: the doors, the box, the counter. Page-local; the engine is untouched. */
(function () {
  'use strict';

  /* The shop's ordering line. Leave empty until the boutique confirms its
     WhatsApp number: orders then open as a copyable recap sent by Instagram. */
  var ORDER = { whatsapp: '212662725266', instagram: 'villa_gourmand' };

  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var smooth = function (a, b, v) { var t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

  var KEY = 'villa-gourmand-boite';
  var cart = [];
  try { cart = JSON.parse(localStorage.getItem(KEY) || '[]') || []; } catch (e) { cart = []; }

  /* ------------------------------------------------- opening date ---- */
  var opening = new Date('2026-10-31T00:00:00+01:00');
  document.querySelectorAll('[data-opening]').forEach(function (el) {
    el.textContent = Date.now() >= opening.getTime()
      ? 'Ouvert depuis le 31 octobre 2026, à Valfleuri.'
      : 'Ouverture le 31 octobre 2026, à Valfleuri.';
  });

  /* ------------------------------------------------- the threshold --- */
  var seuil = document.getElementById('seuil');
  var stage = seuil.querySelector('.seuil__stage');
  var bar = document.getElementById('bar');
  var boiteBtn = document.getElementById('boite-btn');
  var target = 0, shown = 0, running = false;

  function measure() {
    var r = seuil.getBoundingClientRect();
    var travel = Math.max(r.height - innerHeight, 1);
    target = clamp(-r.top / travel, 0, 1);
    var past = r.bottom < innerHeight * 0.5;
    bar.classList.toggle('is-solid', r.bottom < 72);
    boiteBtn.classList.toggle('is-shown', past || cartCount() > 0);
  }

  function paint(p) {
    var s = stage.style;
    var door = smooth(0.03, 0.4, p);
    var push = smooth(0.12, 0.94, p);
    var pushF = Math.pow(push, 1.7);
    s.setProperty('--door', (door * 84).toFixed(2));
    s.setProperty('--spill', door.toFixed(3));
    s.setProperty('--sF', (1 + 5.4 * pushF).toFixed(4));
    s.setProperty('--sI', (1 + 0.12 * push).toFixed(4));
    s.setProperty('--iY', (push * 30).toFixed(2) + 'svh');
    s.setProperty('--fO', (1 - smooth(0.84, 0.95, p)).toFixed(3));
    s.setProperty('--lx', (push * 48).toFixed(2) + 'vw');
    s.setProperty('--ls', (1 + push * 0.8).toFixed(4));
    s.setProperty('--lO', (1 - smooth(0.32, 0.6, p)).toFixed(3));
    var c1 = 1 - smooth(0.02, 0.2, p);
    s.setProperty('--c1', c1.toFixed(3));
    s.setProperty('--c1y', (-(1 - c1) * 30).toFixed(1) + 'px');
    var c2 = smooth(0.8, 0.93, p);
    s.setProperty('--c2', c2.toFixed(3));
    s.setProperty('--c2y', ((1 - c2) * 16).toFixed(1) + 'px');
    s.setProperty('--c2v', c2 > 0.01 ? 'visible' : 'hidden');
  }

  function tick() {
    shown += (target - shown) * (reduce ? 1 : 0.16);
    if (Math.abs(target - shown) < 0.0005) shown = target;
    paint(shown);
    if (shown !== target) requestAnimationFrame(tick); else running = false;
  }
  // Belt and braces for the engine's entry reveals: content must never stay
  // hidden because an observer was throttled (background tabs, previews).
  var pending = Array.prototype.slice.call(document.querySelectorAll('[data-sc-in]'));
  function revealCheck() {
    if (!pending.length) return;
    pending = pending.filter(function (el) {
      if (el.classList.contains('sc-in')) return false;
      if (el.getBoundingClientRect().top < innerHeight * 0.92) {
        el.classList.add('sc-in');
        var st = parseFloat(el.getAttribute('data-sc-stagger'));
        if (!isNaN(st)) Array.prototype.forEach.call(el.children, function (k, i) { k.style.transitionDelay = (i * st) + 'ms'; k.classList.add('sc-in'); });
        return false;
      }
      return true;
    });
  }

  function onScroll() {
    revealCheck();
    measure();
    if (reduce) return;
    if (!running) { running = true; requestAnimationFrame(tick); }
  }
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  measure();
  if (!reduce) { shown = target; paint(shown); }

  /* ------------------------------------------------------ the box ---- */
  function save() { try { localStorage.setItem(KEY, JSON.stringify(cart)); } catch (e) {} }
  function cartCount() { return cart.reduce(function (n, i) { return n + i.qty; }, 0); }
  function find(id) { return cart.filter(function (i) { return i.id === id; })[0]; }

  function add(item) {
    var have = find(item.id);
    if (have) have.qty += 1; else cart.push({ id: item.id, name: item.name, detail: item.detail || '', qty: 1 });
    save(); render();
  }
  function setQty(id, q) {
    var have = find(id); if (!have) return;
    have.qty = q;
    if (q <= 0) cart = cart.filter(function (i) { return i.id !== id; });
    save(); render();
  }

  var countEl = document.getElementById('boite-count');
  function renderList(ul, empty) {
    ul.textContent = '';
    cart.forEach(function (i) {
      var li = document.createElement('li');
      var name = document.createElement('span'); name.className = 'basket__name'; name.textContent = i.name;
      li.appendChild(name);
      var qty = document.createElement('span'); qty.className = 'qty';
      var minus = document.createElement('button'); minus.type = 'button'; minus.textContent = '−';
      minus.setAttribute('aria-label', 'Retirer un ' + i.name);
      var out = document.createElement('output'); out.textContent = i.qty;
      var plus = document.createElement('button'); plus.type = 'button'; plus.textContent = '+';
      plus.setAttribute('aria-label', 'Ajouter un ' + i.name);
      minus.addEventListener('click', function () { setQty(i.id, i.qty - 1); });
      plus.addEventListener('click', function () { setQty(i.id, i.qty + 1); });
      qty.append(minus, out, plus); li.appendChild(qty);
      if (i.detail) { var d = document.createElement('span'); d.className = 'basket__detail'; d.textContent = i.detail; li.appendChild(d); }
      ul.appendChild(li);
    });
    empty.hidden = cart.length > 0;
  }
  function render() {
    var n = cartCount();
    countEl.textContent = n;
    boiteBtn.setAttribute('aria-label', 'Ma boîte, ' + n + (n > 1 ? ' articles' : ' article'));
    renderList(document.getElementById('basket'), document.getElementById('basket-empty'));
    renderList(document.getElementById('drawer-list'), document.getElementById('drawer-empty'));
    document.querySelectorAll('.item').forEach(function (art) {
      var have = find(art.dataset.id);
      art.querySelector('.item__qty').textContent = have ? have.qty + ' dans la boîte' : '';
    });
    if (n > 0) boiteBtn.classList.add('is-shown');
  }

  function receive() {
    boiteBtn.classList.remove('is-bump'); void boiteBtn.offsetWidth;
    boiteBtn.classList.add('is-receiving', 'is-bump');
    setTimeout(function () { boiteBtn.classList.remove('is-receiving'); }, 420);
  }

  // The pastry leaves the counter and drops into the box.
  function fly(img, done) {
    boiteBtn.classList.add('is-shown');
    if (reduce || !img.animate) { done(); receive(); return; }
    var a = img.getBoundingClientRect();
    var b = boiteBtn.querySelector('.boite__art').getBoundingClientRect();
    var f = img.cloneNode(); f.removeAttribute('loading'); f.className = 'flyer'; f.alt = '';
    f.style.cssText = 'left:' + a.left + 'px;top:' + a.top + 'px;width:' + a.width + 'px;height:' + a.height + 'px;';
    document.body.appendChild(f);
    var dx = b.left + b.width / 2 - (a.left + a.width / 2);
    var dy = b.top + b.height / 2 - (a.top + a.height / 2);
    var k = 36 / a.width;
    boiteBtn.classList.add('is-receiving');
    f.animate([
      { transform: 'translate(0,0) scale(1)', opacity: 1 },
      { transform: 'translate(' + dx * 0.55 + 'px,' + (dy * 0.55 - 80) + 'px) scale(' + (0.45) + ')', opacity: 1, offset: 0.55 },
      { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(' + k + ')', opacity: 0.2 }
    ], { duration: 720, easing: 'cubic-bezier(0.45, 0, 0.25, 1)' }).onfinish = function () { f.remove(); done(); receive(); };
  }

  document.querySelectorAll('.item .add').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var art = btn.closest('.item');
      fly(art.querySelector('img'), function () { add({ id: art.dataset.id, name: art.dataset.name }); });
    });
  });

  /* ------------------------------------------------- dialogs --------- */
  var drawer = document.getElementById('boite');
  var recap = document.getElementById('recap');
  boiteBtn.addEventListener('click', function () { drawer.showModal(); });
  document.querySelectorAll('dialog').forEach(function (d) {
    d.addEventListener('click', function (e) {
      if (e.target === d || e.target.closest('[data-close]')) d.close();
    });
  });

  /* ------------------------------------------------- dates ----------- */
  function iso(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  var today = new Date(); var tomorrow = new Date(today.getTime() + 864e5);
  var cakeDate = document.getElementById('cake-date');
  var orderDate = document.getElementById('o-date');
  cakeDate.min = iso(new Date(today.getTime() + 2 * 864e5));
  orderDate.min = iso(today); orderDate.value = iso(tomorrow < opening ? opening : tomorrow);
  function fr(v) { if (!v) return ''; var p = v.split('-'); return p[2] + '/' + p[1] + '/' + p[0]; }

  /* ------------------------------------------------- custom cake ----- */
  var cake = document.getElementById('cake');
  cake.addEventListener('submit', function (e) {
    e.preventDefault();
    var err = cake.querySelector('.cake__error');
    if (!cakeDate.value || cakeDate.value < cakeDate.min) {
      err.hidden = false; cakeDate.setAttribute('aria-invalid', 'true'); cakeDate.focus(); return;
    }
    err.hidden = true; cakeDate.removeAttribute('aria-invalid');
    var f = new FormData(cake);
    var detail = f.get('occasion') + ' · ' + f.get('parts') + ' parts · pour le ' + fr(f.get('date')) +
      (f.get('inscription') ? ' · « ' + f.get('inscription') + ' »' : '');
    add({ id: 'gateau-' + Date.now(), name: 'Gâteau sur commande', detail: detail });
    receive();
    var btn = cake.querySelector('button[type=submit]');
    btn.textContent = 'Ajouté à la boîte';
    setTimeout(function () { btn.textContent = 'Ajouter à la boîte'; }, 1800);
    cake.reset();
  });

  /* ------------------------------------------------- the counter ----- */
  var comptoir = document.getElementById('comptoir');
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es, o) {
      es.forEach(function (en) {
        if (en.isIntersecting) {
          comptoir.classList.add('is-tied');
          setTimeout(function () { comptoir.classList.add('is-open'); }, 1500);
          o.disconnect();
        }
      });
    }, { threshold: 0.25 }).observe(comptoir);
  } else comptoir.classList.add('is-tied');

  var order = document.getElementById('order');
  var deliveryFields = order.querySelectorAll('[data-delivery]');
  function syncMode() {
    var delivery = order.mode.value === 'livraison';
    deliveryFields.forEach(function (f) { f.hidden = !delivery; });
    order.address.required = delivery;
  }
  order.querySelectorAll('input[name=mode]').forEach(function (r) { r.addEventListener('change', syncMode); });
  syncMode();

  order.addEventListener('submit', function (e) {
    e.preventDefault();
    var err = order.querySelector('.order__error');
    var bad = [];
    var phone = order.phone.value.replace(/[\s.-]/g, '');
    order.querySelectorAll('[aria-invalid]').forEach(function (el) { el.removeAttribute('aria-invalid'); });
    if (!cart.length) bad.push([null, 'Votre boîte est vide.']);
    if (!order.name.value.trim()) bad.push([order.name, 'Indiquez votre nom.']);
    if (!/^(\+212|00212|0)[5-7]\d{8}$/.test(phone)) bad.push([order.phone, 'Indiquez un numéro marocain valide.']);
    if (order.mode.value === 'livraison' && !order.address.value.trim()) bad.push([order.address, 'Indiquez l’adresse de livraison.']);
    if (!order.date.value) bad.push([order.date, 'Choisissez un jour.']);
    if (bad.length) {
      err.textContent = bad.map(function (b) { return b[1]; }).join(' ');
      err.hidden = false;
      bad.forEach(function (b) { if (b[0]) b[0].setAttribute('aria-invalid', 'true'); });
      var first = bad.filter(function (b) { return b[0]; })[0];
      if (first) first[0].focus();
      return;
    }
    err.hidden = true;

    var delivery = order.mode.value === 'livraison';
    var lines = ['Bonjour Villa Gourmand, je souhaite commander :', ''];
    cart.forEach(function (i) { lines.push('• ' + i.qty + ' × ' + i.name + (i.detail ? ' (' + i.detail + ')' : '')); });
    lines.push('', delivery ? 'Livraison à domicile, paiement en espèces à la livraison' : 'Retrait en boutique, paiement sur place');
    lines.push('Nom : ' + order.name.value.trim(), 'Téléphone : ' + order.phone.value.trim());
    if (delivery) lines.push('Adresse : ' + order.address.value.trim() + (order.area.value.trim() ? ', ' + order.area.value.trim() : ''));
    lines.push('Jour : ' + fr(order.date.value) + ', ' + order.slot.value.toLowerCase());
    if (order.note.value.trim()) lines.push('Précisions : ' + order.note.value.trim());
    var text = lines.join('\n');

    var send = document.getElementById('recap-send');
    document.getElementById('recap-text').value = text;
    if (ORDER.whatsapp) {
      document.getElementById('recap-note').textContent =
        'Envoyez ce message sur WhatsApp : la boutique vous confirme le prix, les frais et l’heure avant de préparer votre commande.';
      send.href = 'https://wa.me/' + ORDER.whatsapp + '?text=' + encodeURIComponent(text);
      send.textContent = 'Envoyer sur WhatsApp';
    } else {
      document.getElementById('recap-note').textContent =
        'Copiez ce récapitulatif et envoyez-le en message privé sur Instagram : la boutique vous confirme le prix et l’heure.';
      send.href = 'https://ig.me/m/' + ORDER.instagram;
      send.textContent = 'Envoyer sur Instagram';
    }
    recap.showModal();
  });

  document.getElementById('recap-copy').addEventListener('click', function () {
    var t = document.getElementById('recap-text'); var btn = this;
    var ok = function () { btn.textContent = 'Copié'; setTimeout(function () { btn.textContent = 'Copier le récapitulatif'; }, 1600); };
    if (navigator.clipboard) navigator.clipboard.writeText(t.value).then(ok, function () { t.select(); });
    else { t.select(); try { document.execCommand('copy'); ok(); } catch (e) {} }
  });

  render();
})();
