/* Mobile navigation. The only script on the site. */
(function () {
  var header = document.querySelector('[data-nav]');
  if (!header) return;

  var toggle = header.querySelector('.nav-toggle');
  var panel = header.querySelector('.nav-panel');
  if (!toggle || !panel) return;

  function setOpen(open) {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    panel.hidden = !open;
    document.body.style.overflow = open ? 'hidden' : '';
  }

  toggle.addEventListener('click', function () {
    setOpen(toggle.getAttribute('aria-expanded') !== 'true');
  });

  // Following a link inside the panel should close it.
  panel.addEventListener('click', function (event) {
    if (event.target.closest('a')) setOpen(false);
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
      setOpen(false);
      toggle.focus();
    }
  });

  // Resizing up to the desktop breakpoint leaves the panel stranded open.
  var desktop = window.matchMedia('(min-width: 901px)');
  var onChange = function (event) { if (event.matches) setOpen(false); };
  if (desktop.addEventListener) desktop.addEventListener('change', onChange);
  else desktop.addListener(onChange);
})();
