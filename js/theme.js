/*
* Theme switcher (dark / light)
* Loaded in <head> so the saved theme is applied before the page paints.
* The colours for each theme live in css/main.css under "1b. Theme Colors".
*/
(function () {
  'use strict';

  var STORAGE_KEY = 'breezycv-theme';
  var DEFAULT_THEME = 'dark';
  var root = document.documentElement;

  function getSavedTheme() {
    try {
      var saved = localStorage.getItem(STORAGE_KEY);
      return (saved === 'dark' || saved === 'light') ? saved : null;
    } catch (e) {
      return null;
    }
  }

  function saveTheme(theme) {
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch (e) {}
  }

  function getTheme() {
    return root.getAttribute('data-theme') || DEFAULT_THEME;
  }

  function updateToggles(theme) {
    var toggles = document.querySelectorAll('.theme-toggle');
    for (var i = 0; i < toggles.length; i++) {
      toggles[i].setAttribute('aria-checked', theme === 'light' ? 'true' : 'false');
      toggles[i].setAttribute('title', theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme');
    }
  }

  // --- reCAPTCHA ---
  // The widget's theme can only be set when it is rendered, so it is
  // rendered explicitly (see "render=explicit" in index.html) and
  // re-rendered whenever the site theme changes.
  window.onRecaptchaLoad = function () {
    renderRecaptcha();
  };

  function renderRecaptcha() {
    if (!window.grecaptcha || !grecaptcha.render) return;

    var widgets = document.querySelectorAll('.g-recaptcha');
    for (var i = 0; i < widgets.length; i++) {
      var old = widgets[i];
      var fresh = document.createElement('div');
      fresh.className = old.className;
      fresh.setAttribute('data-sitekey', old.getAttribute('data-sitekey'));
      old.parentNode.replaceChild(fresh, old);

      grecaptcha.render(fresh, {
        sitekey: fresh.getAttribute('data-sitekey'),
        theme: getTheme()
      });
    }
  }

  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    saveTheme(theme);
    updateToggles(theme);
    renderRecaptcha();
  }

  // Cross-fades the whole page between themes. Uses the View Transitions API
  // (it can fade gradients too); older browsers get a CSS colour transition
  // instead. Timing is set in css/main.css, "11. Theme Toggle".
  function setTheme(theme) {
    var reduceMotion = window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduceMotion) {
      applyTheme(theme);
      return;
    }

    if (document.startViewTransition) {
      document.startViewTransition(function () {
        applyTheme(theme);
      });
      return;
    }

    root.classList.add('theme-transition');
    applyTheme(theme);
    clearTimeout(setTheme.timer);
    setTheme.timer = setTimeout(function () {
      root.classList.remove('theme-transition');
    }, 600);
  }

  // Apply the theme immediately (before first paint)
  root.setAttribute('data-theme', getSavedTheme() || DEFAULT_THEME);

  // Pick up a theme changed on another page: when coming Back to a page the
  // browser kept in memory (Firefox does this a lot), or from another tab
  function syncTheme() {
    var saved = getSavedTheme() || DEFAULT_THEME;
    if (saved !== getTheme()) {
      root.setAttribute('data-theme', saved);
      updateToggles(saved);
      renderRecaptcha();
    }
  }

  window.addEventListener('pageshow', syncTheme);
  window.addEventListener('storage', function (e) {
    if (e.key === STORAGE_KEY) syncTheme();
  });

  document.addEventListener('DOMContentLoaded', function () {
    updateToggles(getTheme());

    document.addEventListener('click', function (e) {
      var toggle = e.target.closest && e.target.closest('.theme-toggle');
      if (!toggle) return;
      e.preventDefault();
      setTheme(getTheme() === 'dark' ? 'light' : 'dark');
    });
  });
})();

/*
* Card width switch (original / wider / widest)
* Also loaded early so the saved width is applied before the page paints.
* The widths themselves are set in css/main.css under "14. Card Width".
*/
(function () {
  'use strict';

  var STORAGE_KEY = 'breezycv-card-width';
  var root = document.documentElement;

  function getSavedWidth() {
    try {
      var saved = localStorage.getItem(STORAGE_KEY);
      return (saved === '0' || saved === '1' || saved === '2') ? saved : '0';
    } catch (e) {
      return '0';
    }
  }

  function updateButtons(width) {
    var buttons = document.querySelectorAll('.card-width-switch button');
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].setAttribute('aria-pressed', buttons[i].getAttribute('data-width') === width ? 'true' : 'false');
    }
  }

  // Hide the switch when the screen isn't wide enough for it to make a difference
  // (mirrors the maths in css/main.css "14. Card Width")
  function updateAvailability() {
    var vw = window.innerWidth,
        vh = window.innerHeight,
        original = vw > 1280 ? Math.min(1280, vw - 200) : vw - 130,
        widest = vw - 2 * 0.1 * vh - 90;
    root.classList.toggle('card-width-unavailable', vw < 1025 || widest - original < 40);
  }

  function setWidth(width) {
    root.setAttribute('data-card-width', width);
    try {
      localStorage.setItem(STORAGE_KEY, width);
    } catch (e) {}
    updateButtons(width);

    // Let the site re-measure things (scrollbars etc.) once the card has resized
    setTimeout(function () {
      window.dispatchEvent(new Event('resize'));
    }, 500);
  }

  // Apply the saved width immediately (before first paint)
  root.setAttribute('data-card-width', getSavedWidth());
  updateAvailability();
  window.addEventListener('resize', updateAvailability);

  // Same as the theme: keep in step after Back, or a change in another tab
  function syncWidth() {
    var saved = getSavedWidth();
    if (saved !== root.getAttribute('data-card-width')) {
      root.setAttribute('data-card-width', saved);
      updateButtons(saved);
    }
  }

  window.addEventListener('pageshow', syncWidth);
  window.addEventListener('storage', function (e) {
    if (e.key === STORAGE_KEY) syncWidth();
  });

  document.addEventListener('DOMContentLoaded', function () {
    updateButtons(root.getAttribute('data-card-width'));

    document.addEventListener('click', function (e) {
      var button = e.target.closest && e.target.closest('.card-width-switch button');
      if (!button) return;
      setWidth(button.getAttribute('data-width'));
    });
  });
})();
