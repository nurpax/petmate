import { isElectron, preloadAppFiles } from './utils/platform';
import { registerServiceWorker } from './serviceWorker';

// The app modules read bundled charsets synchronously when they're loaded.
// The browser build can only fetch them asynchronously, so fetch them first
// and only then load the app.
preloadAppFiles()
  .then(() => import('./main'))
  .catch(e => {
    console.error(e);
    document.body.textContent = 'Petmate failed to start: ' + e;
  });

if (!isElectron) {
  registerServiceWorker();
}
