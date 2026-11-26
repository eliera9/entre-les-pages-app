/* Keep browser chrome in sync with the visible screen, including manual theme changes. */
(() => {
  const edge = document.querySelector('.mobile-top-surface');
  const themeColor = document.querySelector('meta[name="theme-color"]');
  const launchColor = themeColor.content;
  const tablet = matchMedia('(min-width: 650px) and (min-height: 500px)');

  function syncThemeColor() {
    const color = tablet.matches ? launchColor : getComputedStyle(edge).backgroundColor;
    if (themeColor.content !== color) themeColor.content = color;
  }

  const observer = new MutationObserver(syncThemeColor);
  for (const screen of document.querySelectorAll('#app-lecture, #bibliotheque-app, #elp-connexion')) {
    observer.observe(screen, { attributes: true, attributeFilter: ['data-theme', 'hidden', 'data-starting'] });
  }
  tablet.addEventListener('change', syncThemeColor);
  syncThemeColor();
})();
