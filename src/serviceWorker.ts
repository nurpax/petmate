// Register public/sw.js, which caches the app for offline use.  Only done in
// production builds so that the dev server's hot reloading isn't served from
// a stale cache.
export function registerServiceWorker() {
  if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) {
    return;
  }
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(e => {
      console.error('service worker registration failed', e);
    });
  });
}
