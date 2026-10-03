/* ==========================================================================
   BRIGHT FITNESS STUDIO — site behaviour
   --------------------------------------------------------------------------
   Vanilla JavaScript only. No libraries, no build step.

   Every feature is an independent init function, so a missing element on the
   page never throws. Scroll-reveal and the mobile nav are progressive
   enhancements: the page stays fully usable if this file fails to load.

   Modules
     01. Config
     02. Helpers
     03. WhatsApp links
     04. Header (compact on scroll)
     05. Mobile navigation
     06. Scroll spy
     07. Scroll reveal
     08. Image fallbacks
     09. FAQ accordion
     10. Reviews carousel
     11. Current year
   ========================================================================== */

(function () {
  'use strict';

  /* ========================================================================
     01. CONFIG
     Edit these values to update the whole site.
     ======================================================================== */
  const CONFIG = {
    /** WhatsApp number in international format, digits only, no "+". */
    whatsappNumber: '917200251560',

    /** Primary phone number in international format for tel: links. */
    phoneNumber: '+917200251560',

    /** Brand name used when composing WhatsApp messages. */
    brand: 'DigiMaraa Fitness Studio',

    /**
     * Message templates.
     * {brand} and {product} are replaced at runtime, so a single template
     * serves every button.
     */
    messages: {
      general: 'Hi {brand}, I would like to know more about the gym.',
      join: 'Hi {brand}, I would like to join your gym. Please share the details.',
      product: 'Hi {brand}, I am interested in {product}. Please share the details.'
    }
  };

  /* ========================================================================
     02. HELPERS
     ======================================================================== */
  const $ = (selector, scope) => (scope || document).querySelector(selector);
  const $$ = (selector, scope) => Array.prototype.slice.call((scope || document).querySelectorAll(selector));

  const prefersReducedMotion = () =>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /** Fill {placeholders} in a message template. */
  function fillTemplate(template, values) {
    return template.replace(/\{(\w+)\}/g, (match, key) =>
      Object.prototype.hasOwnProperty.call(values, key) ? values[key] : match
    );
  }

  /**
   * Build a wa.me deep link.
   * @param {string} message - already-composed message text.
   * @returns {string} URL
   */
  function buildWhatsAppUrl(message) {
    return (
      'https://wa.me/' +
      CONFIG.whatsappNumber +
      '?text=' +
      encodeURIComponent(message)
    );
  }

  /* ========================================================================
     03. WHATSAPP LINKS
     Elements opt in with data-wa="<key>" or data-wa="product:<Name>".
     The real href is written on load, so links are crawlable and can be
     opened in a new tab or copied like any other link.
     ======================================================================== */
  function resolveMessage(key) {
    if (key.indexOf('product:') === 0) {
      const product = key.slice('product:'.length).trim();
      return fillTemplate(CONFIG.messages.product, {
        brand: CONFIG.brand,
        product: product
      });
    }
    const template = CONFIG.messages[key] || CONFIG.messages.general;
    return fillTemplate(template, { brand: CONFIG.brand });
  }

  function initWhatsAppLinks() {
    $$('[data-wa]').forEach((el) => {
      const key = el.getAttribute('data-wa') || 'general';
      el.setAttribute('href', buildWhatsAppUrl(resolveMessage(key)));
      el.setAttribute('rel', 'noopener');
      el.setAttribute('target', '_blank');
    });
  }

  /* ========================================================================
     04. HEADER
     Adds .is-stuck past a small scroll threshold so the bar gets more
     compact and more opaque.
     ======================================================================== */
  function initHeader() {
    const header = $('#siteHeader');
    if (!header) return;

    const threshold = 40;
    let ticking = false;

    const update = () => {
      header.classList.toggle('is-stuck', window.scrollY > threshold);
      ticking = false;
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ========================================================================
     05. MOBILE NAVIGATION
     ======================================================================== */
  function initMobileNav() {
    const toggle = $('#navToggle');
    const nav = $('#primaryNav');
    const scrim = $('#navScrim');
    if (!toggle || !nav) return;

    const desktop = window.matchMedia('(min-width: 1100px)');
    let isOpen = false;

    function openMenu() {
      isOpen = true;
      nav.classList.add('is-open');
      toggle.setAttribute('aria-expanded', 'true');
      if (scrim) {
        scrim.hidden = false;
        // Next frame so the opacity transition runs
        window.requestAnimationFrame(() => scrim.classList.add('is-visible'));
      }
      document.body.style.overflow = 'hidden';
    }

    function closeMenu() {
      if (!isOpen) return;
      isOpen = false;
      nav.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      if (scrim) {
        scrim.classList.remove('is-visible');
        window.setTimeout(() => { scrim.hidden = true; }, 300);
      }
      document.body.style.overflow = '';
    }

    toggle.addEventListener('click', function () {
      isOpen ? closeMenu() : openMenu();
    });

    if (scrim) scrim.addEventListener('click', closeMenu);

    // Close after choosing a destination
    $$('a', nav).forEach((link) => link.addEventListener('click', closeMenu));

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') {
        closeMenu();
        toggle.focus();
      }
    });

    // Reset cleanly when resizing up to the desktop layout
    const onChange = () => { if (desktop.matches) closeMenu(); };
    if (desktop.addEventListener) desktop.addEventListener('change', onChange);
    else desktop.addListener(onChange);
  }

  /* ========================================================================
     06. SCROLL SPY
     Highlights the nav link for the section currently in view.
     ======================================================================== */
  function initScrollSpy() {
    const links = $$('.nav__link');
    if (!links.length) return;

    const map = links
      .map((link) => {
        const id = link.getAttribute('href');
        if (!id || id.charAt(0) !== '#') return null;
        const section = document.querySelector(id);
        return section ? { link: link, section: section } : null;
      })
      .filter(Boolean);

    if (!map.length) return;

    let ticking = false;

    function update() {
      const marker = window.scrollY + (window.innerHeight * 0.32);
      let current = map[0];

      map.forEach((item) => {
        if (item.section.offsetTop <= marker) current = item;
      });

      // Pin the last item once the page bottom is reached
      if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 2) {
        current = map[map.length - 1];
      }

      map.forEach((item) => item.link.classList.remove('is-active'));
      if (current) current.link.classList.add('is-active');

      ticking = false;
    }

    function onScroll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    }

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
  }

  /* ========================================================================
     07. SCROLL REVEAL
     Adds .is-visible as elements enter the viewport. If
     IntersectionObserver is unavailable, reveal everything immediately.
     ======================================================================== */
  function initReveal() {
    const items = $$('[data-reveal]');
    if (!items.length) return;

    if (!('IntersectionObserver' in window) || prefersReducedMotion()) {
      items.forEach((el) => el.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          // Stagger siblings slightly for a softer cascade
          const delay = Number(entry.target.dataset.revealDelay || 0);
          window.setTimeout(() => {
            entry.target.classList.add('is-visible');
          }, delay);
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.12 }
    );

    items.forEach((el) => observer.observe(el));

    // Safety net: anything already on screen at load time is shown
    // immediately, in case the observer never delivers a first callback.
    window.addEventListener('load', function () {
      items.forEach(function (el) {
        if (el.classList.contains('is-visible')) return;
        if (el.getBoundingClientRect().top < window.innerHeight) {
          el.classList.add('is-visible');
          observer.unobserve(el);
        }
      });
    });
  }

  /* ========================================================================
     08. IMAGE FALLBACKS
     If a placeholder image is missing, reveal the branded panel behind it
     instead of showing a broken-image icon.
     ======================================================================== */
  function initImageFallbacks() {
    $$('img').forEach((img) => {
      const markBroken = () => {
        const frame = img.closest('.hero-image-placeholder, .media-frame, .product-card__media');
        if (frame) frame.classList.add('is-broken');
        img.setAttribute('aria-hidden', 'true');
      };

      // Only react once loading has genuinely failed
      if (img.complete && img.naturalWidth === 0) markBroken();
      img.addEventListener('error', markBroken);
    });
  }

  /* ========================================================================
     09. FAQ ACCORDION
     The markup is native <details>/<summary>, so every answer already works
     with JavaScript disabled. This module only adds the open/close
     transition and keeps aria-expanded in sync.

     The "toggle" event is the single source of truth: it fires whether the
     panel was opened by a click, by the keyboard, or programmatically, so
     there is no second code path to keep in sync.
     ======================================================================== */
  function initFaqAccordion() {
    const items = $$('.faq-item');
    if (!items.length) return;

    const DURATION = 340;

    items.forEach(function (item) {
      const panel = $('.faq-item__a', item);
      const summary = $('.faq-item__q', item);
      if (!panel || !summary) return;

      let timer = null;

      summary.setAttribute('aria-expanded', item.open ? 'true' : 'false');

      if (item.open) panel.classList.add('is-open');

      item.addEventListener('toggle', function () {
        const isOpen = item.open;
        summary.setAttribute('aria-expanded', isOpen ? 'true' : 'false');

        window.clearTimeout(timer);

        // Nothing to animate — let the CSS snap into place
        if (prefersReducedMotion()) {
          panel.classList.toggle('is-open', isOpen);
          panel.style.height = '';
          return;
        }

        if (isOpen) {
          panel.classList.add('is-open');
          // Release the fixed height so the panel can measure its content,
          // then animate from 0 up to that measured height.
          panel.style.height = '0px';
          const target = panel.scrollHeight;
          panel.style.height = target + 'px';
          timer = window.setTimeout(function () {
            // Hand control back to CSS so text resizes stay correct
            if (item.open) panel.style.height = 'auto';
          }, DURATION);
        } else {
          // Pin the current height, then animate down to a clipped zero.
          panel.style.height = panel.offsetHeight + 'px';
          panel.classList.remove('is-open');
          void panel.offsetHeight; // force reflow so the transition has a start value
          panel.style.height = '0px';
        }
      });
    });
  }

  /* ========================================================================
     10. REVIEWS CAROUSEL
     The track is a native scroll-snap container, so touch, trackpad and
     keyboard all work for free. These buttons just page it.
     ======================================================================== */
  function initReviewsCarousel() {
    const track = $('#reviewTrack');
    const prev = $('#reviewPrev');
    const next = $('#reviewNext');
    if (!track) return;

    const cards = $$('.review-card', track);
    const step = () => {
      if (cards.length < 2) return track.clientWidth;
      const gap = parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap) || 0;
      return cards[0].getBoundingClientRect().width + gap;
    };

    function updateButtons() {
      const max = track.scrollWidth - track.clientWidth - 1;
      if (prev) prev.disabled = track.scrollLeft <= 1;
      if (next) next.disabled = track.scrollLeft >= max;
    }

    function page(direction) {
      track.scrollBy({
        left: step() * direction,
        behavior: prefersReducedMotion() ? 'auto' : 'smooth'
      });
    }

    if (prev) prev.addEventListener('click', () => page(-1));
    if (next) next.addEventListener('click', () => page(1));

    track.addEventListener('scroll', function () {
      window.requestAnimationFrame(updateButtons);
    }, { passive: true });

    window.addEventListener('resize', updateButtons, { passive: true });

    // Hide the arrows when everything already fits on screen
    function updateVisibility() {
      const fits = track.scrollWidth - track.clientWidth <= 2;
      const controls = prev ? prev.parentElement : null;
      if (controls) controls.hidden = fits;
    }

    updateButtons();
    updateVisibility();
    window.addEventListener('resize', updateVisibility, { passive: true });
  }

  /* ========================================================================
     11. CURRENT YEAR
     ======================================================================== */
  function initCurrentYear() {
    const el = $('#currentYear');
    if (!el) return;
    el.textContent = String(new Date().getFullYear());
  }

  /* ========================================================================
     BOOT
     ======================================================================== */
  function init() {
    initWhatsAppLinks();
    initHeader();
    initMobileNav();
    initScrollSpy();
    initReveal();
    initImageFallbacks();
    initFaqAccordion();
    initReviewsCarousel();
    initCurrentYear();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
