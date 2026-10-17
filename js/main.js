(() => {
  const $ = (s, ctx = document) => ctx.querySelector(s);
  const $$ = (s, ctx = document) => [...ctx.querySelectorAll(s)];
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  /* ---------- Header ---------- */
  const header = $('.site-header');
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 24);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const nav = $('#nav');
  const toggle = $('#menuToggle');
  const setMenu = (open) => {
    nav.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', open);
    toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    document.body.style.overflow = open ? 'hidden' : '';
  };
  toggle.addEventListener('click', () => setMenu(!nav.classList.contains('is-open')));
  $$('a', nav).forEach((a) => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', (e) => e.key === 'Escape' && setMenu(false));

  /* ---------- Subrayados a mano: se miden para poder dibujarlos ---------- */
  $$('.scribble path').forEach((path) => {
    path.style.setProperty('--len', Math.ceil(path.getTotalLength()) + 2);
  });

  /* ---------- Animaciones al hacer scroll ---------- */
  const revealIO = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      el.classList.add('is-in');
      el.addEventListener('transitionend', function done(e) {
        if (e.target !== el || e.propertyName !== 'opacity') return;
        el.classList.add('is-done');
        el.removeEventListener('transitionend', done);
      });
      revealIO.unobserve(el);
    });
  }, { threshold: 0.18, rootMargin: '0px 0px -40px 0px' });
  $$('[data-reveal]').forEach((el) => revealIO.observe(el));

  /* ---------- Demo: agitar y decidir ---------- */
  const COLORS = ['var(--lime)', 'var(--pink)', 'var(--cyan)', 'var(--violet)', 'var(--orange)'];
  const VERDICTS = ['Decidió el azar.', 'El azar ha hablado.', 'Sin apelaciones.', 'Asunto cerrado.', 'Y no se hable más.'];
  const MAX_OPTIONS = 6;

  const list = $('#optList');
  const form = $('#optForm');
  const input = $('#optInput');
  const shakeBtn = $('#shakeBtn');
  const phone = $('#demoPhone');
  const verdict = $('#verdict');
  const vIco = $('#verdictIco');
  const vName = $('#verdictName');
  const vSub = $('#verdictSub');
  const hint = $('#demoHint');

  let options = ['Pizza', 'Sushi', 'Tacos'];
  let busy = false;

  const randInt = (n) => {
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    return buf[0] % n;
  };

  // dado con la cara indicada
  const PIPS = { 1: [[16, 16]], 2: [[10, 10], [22, 22]], 3: [[9, 9], [16, 16], [23, 23]], 4: [[10, 10], [22, 10], [10, 22], [22, 22]], 5: [[9, 9], [23, 9], [16, 16], [9, 23], [23, 23]], 6: [[10, 8.5], [22, 8.5], [10, 16], [22, 16], [10, 23.5], [22, 23.5]] };
  const dice = (face) =>
    `<svg viewBox="0 0 32 32"><rect x="2.5" y="2.5" width="27" height="27" rx="7" fill="none" stroke="currentColor" stroke-width="2.4" transform="rotate(-8 16 16)"/><g transform="rotate(-8 16 16)" fill="currentColor">${PIPS[face].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.3"/>`).join('')}</g></svg>`;

  vIco.innerHTML = dice(5);

  const say = (msg) => {
    hint.textContent = msg;
    hint.classList.remove('flash');
    void hint.offsetWidth;
    if (msg) hint.classList.add('flash');
  };

  function render() {
    list.innerHTML = '';
    options.forEach((opt, i) => {
      const li = document.createElement('li');
      li.className = 'dp-item';
      li.style.setProperty('--c', COLORS[i % COLORS.length]);
      li.innerHTML = '<span class="dp-dot"></span><span class="dp-label"></span><button type="button" class="dp-del">×</button>';
      $('.dp-label', li).textContent = opt;
      const del = $('.dp-del', li);
      del.setAttribute('aria-label', `Quitar ${opt}`);
      del.addEventListener('click', () => {
        if (busy) return;
        options.splice(i, 1);
        say('');
        render();
      });
      list.appendChild(li);
    });
    form.hidden = options.length >= MAX_OPTIONS;
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const value = input.value.trim().replace(/\s+/g, ' ');
    if (!value || busy) return;
    if (options.some((o) => o.toLowerCase() === value.toLowerCase())) {
      say('Esa opción ya está en la lista.');
      return;
    }
    options.push(value);
    input.value = '';
    say('');
    render();
    if (!form.hidden) input.focus();
  });

  async function decide() {
    if (busy) return;
    if (options.length < 2) {
      say('Pon al menos dos opciones. Con una sola ya lo tienes decidido.');
      return;
    }
    busy = true;
    say('');
    shakeBtn.disabled = true;
    shakeBtn.textContent = 'Agitando…';
    phone.classList.add('is-shaking');
    verdict.classList.remove('is-revealed');
    verdict.classList.add('is-thinking');

    const items = $$('.dp-item', list);
    items.forEach((el) => el.classList.remove('is-pick'));
    const n = options.length;
    const pick = randInt(n);
    const total = n * 3 + pick;

    // recorre las opciones frenando poco a poco hasta caer en la elegida
    for (let k = 0; k <= total; k++) {
      items.forEach((el) => el.classList.remove('is-hot'));
      items[k % n].classList.add('is-hot');
      const t = k / total;
      await wait(reduced ? 0 : 50 + t * t * 280);
    }

    phone.classList.remove('is-shaking');
    items[pick].classList.remove('is-hot');
    items[pick].classList.add('is-pick');

    verdict.style.setProperty('--c', COLORS[pick % COLORS.length]);
    vIco.innerHTML = dice(randInt(6) + 1);
    vName.textContent = options[pick];
    vSub.textContent = VERDICTS[randInt(VERDICTS.length)];
    verdict.classList.remove('is-thinking');
    void verdict.offsetWidth;
    verdict.classList.add('is-revealed');

    shakeBtn.disabled = false;
    shakeBtn.textContent = 'Agitar otra vez';
    busy = false;
  }

  /* agitar el móvil de verdad (si el dispositivo lo permite) */
  let demoVisible = false;
  let motionOn = false;
  let lastShake = 0;

  new IntersectionObserver(([entry]) => { demoVisible = entry.isIntersecting; }, { threshold: 0.4 })
    .observe($('#pruebalo'));

  const onMotion = (e) => {
    const a = e.accelerationIncludingGravity;
    if (!a || !demoVisible) return;
    const force = Math.hypot(a.x || 0, a.y || 0, a.z || 0);
    if (force > 28 && Date.now() - lastShake > 2500) {
      lastShake = Date.now();
      decide();
    }
  };

  const enableMotion = () => {
    if (motionOn || typeof DeviceMotionEvent === 'undefined') return;
    if (typeof DeviceMotionEvent.requestPermission === 'function') {
      // iOS: el permiso solo se puede pedir tras un gesto del usuario
      DeviceMotionEvent.requestPermission()
        .then((state) => {
          if (state === 'granted' && !motionOn) {
            window.addEventListener('devicemotion', onMotion);
            motionOn = true;
          }
        })
        .catch(() => {});
    } else {
      window.addEventListener('devicemotion', onMotion);
      motionOn = true;
    }
  };

  if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission !== 'function') {
    enableMotion();
  }

  shakeBtn.addEventListener('click', () => {
    enableMotion();
    decide();
  });

  render();

  /* ---------- FAQ ---------- */
  const faqItems = $$('.faq-item');
  faqItems.forEach((item) => {
    const btn = $('.faq-q', item);
    btn.addEventListener('click', () => {
      const open = !item.classList.contains('is-open');
      faqItems.forEach((other) => {
        other.classList.remove('is-open');
        $('.faq-q', other).setAttribute('aria-expanded', 'false');
      });
      item.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', open);
    });
  });

  /* ---------- Modal de registro ----------
     Se abre desde cualquier elemento con el atributo data-lead-open. */
  const modal = $('#lead-modal');
  const modalPanel = $('.lead-modal__panel', modal);
  let lastFocus = null;

  const openModal = (e) => {
    e.preventDefault();
    setMenu(false);
    lastFocus = document.activeElement;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('lead-modal-open');
    modalPanel.focus();
  };

  const closeModal = () => {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('lead-modal-open');
    if (lastFocus) lastFocus.focus();
  };

  $$('[data-lead-open]').forEach((el) => el.addEventListener('click', openModal));
  $$('[data-lead-close]', modal).forEach((el) => el.addEventListener('click', closeModal));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('is-open')) closeModal();
  });

  /* ---------- Envío del formulario a HubSpot (Forms API pública) ---------- */
  const HUBSPOT_PORTAL_ID = '52177911';
  const HUBSPOT_FORM_ID = '568c5b1c-cb70-471b-af35-c376a8fe497e';
  const HUBSPOT_URL = `https://api.hsforms.com/submissions/v3/integration/submit/${HUBSPOT_PORTAL_ID}/${HUBSPOT_FORM_ID}`;

  const leadForm = $('#lead-form');
  const leadMsg = $('#lead-msg');
  const leadEmail = $('#lead-email');
  const leadSubmit = $('.lead-submit', leadForm);

  const setLeadMsg = (text, ok = false) => {
    leadMsg.textContent = text;
    leadMsg.classList.toggle('ok', ok);
  };

  leadEmail.addEventListener('input', () => {
    leadEmail.classList.remove('is-invalid');
    if (!leadMsg.classList.contains('ok')) setLeadMsg('');
  });

  leadForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const data = new FormData(leadForm);
    const email = String(data.get('email') || '').trim();

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      leadEmail.classList.add('is-invalid');
      setLeadMsg(email ? 'Escribe un correo válido.' : 'Rellena este campo obligatorio.');
      leadEmail.focus();
      return;
    }

    const payload = {
      fields: [
        { name: 'firstname', value: String(data.get('firstname') || '').trim() },
        { name: 'lastname', value: String(data.get('lastname') || '').trim() },
        { name: 'email', value: email }
      ],
      context: { pageUri: window.location.href, pageName: document.title }
    };

    leadSubmit.disabled = true;
    setLeadMsg('Enviando…', true);

    try {
      const res = await fetch(HUBSPOT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error(`HubSpot respondió ${res.status}`);

      leadForm.reset();
      setLeadMsg('¡Listo! Te avisaremos de las novedades.', true);
    } catch (err) {
      console.error(err);
      setLeadMsg('No se pudo enviar. Inténtalo de nuevo.');
    } finally {
      leadSubmit.disabled = false;
    }
  });

  /* ---------- Año ---------- */
  $('#year').textContent = new Date().getFullYear();
})();