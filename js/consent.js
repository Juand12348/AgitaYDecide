/* ==========================================================================
   Banner de cookies + Consent Mode de Google (GTM)
   - El estado "denegado por defecto" se declara en el <head> (antes de GTM).
   - Aquí solo se muestra el banner y se actualiza el consentimiento.
   ========================================================================== */
(() => {
  const KEY = 'agita_consent_v1';
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }

  const read = () => { try { return localStorage.getItem(KEY); } catch (e) { return null; } };
  const save = (v) => { try { localStorage.setItem(KEY, v); } catch (e) {} };

  const applyConsent = (granted) => {
    const v = granted ? 'granted' : 'denied';
    gtag('consent', 'update', { analytics_storage: v, functionality_storage: v });
    window.dataLayer.push({ event: granted ? 'consent_granted' : 'consent_denied' });
  };

  let banner = null;
  const closeBanner = () => {
    if (!banner) return;
    banner.classList.remove('is-open');
    banner.setAttribute('aria-hidden', 'true');
  };
  const choose = (granted) => {
    save(granted ? 'granted' : 'denied');
    applyConsent(granted);
    closeBanner();
  };

  const openBanner = () => {
    if (!banner) {
      banner = document.createElement('div');
      banner.className = 'cookie-banner';
      banner.setAttribute('role', 'dialog');
      banner.setAttribute('aria-label', 'Preferencias de cookies');
      banner.innerHTML =
        '<p class="cookie-banner__text"><strong>Cookies, pero con permiso.</strong> ' +
        'Usamos cookies de analítica y de chat para mejorar la página. ' +
        'Tú decides. <a href="privacidad.html">Más información</a></p>' +
        '<div class="cookie-banner__actions">' +
        '<button type="button" class="cookie-btn cookie-btn--ghost" data-cookie="deny">Rechazar</button>' +
        '<button type="button" class="cookie-btn cookie-btn--accept" data-cookie="accept">Aceptar</button>' +
        '</div>';
      banner.addEventListener('click', (e) => {
        const b = e.target.closest('[data-cookie]');
        if (b) choose(b.dataset.cookie === 'accept');
      });
      document.body.appendChild(banner);
    }
    banner.setAttribute('aria-hidden', 'false');
    // pequeño retardo para que la transición de entrada se vea
    requestAnimationFrame(() => banner.classList.add('is-open'));
  };

  // Enlace del pie para cambiar la decisión: <button data-cookie-settings>
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-cookie-settings]')) openBanner();
  });

  // Primera visita: sin decisión guardada → mostrar banner.
  // Si ya había decisión, el script del <head> ya la restauró.
  if (!read()) openBanner();
})();