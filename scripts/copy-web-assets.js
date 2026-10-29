// Copy the bundled charsets and PRG template into public/ so the browser
// build can fetch them.  (Electron reads them straight from assets/.)
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const dst = path.join(root, 'public', 'assets');
fs.mkdirSync(dst, { recursive: true });
for (const name of fs.readdirSync(path.join(root, 'assets'))) {
  if (name.endsWith('.bin') || name.endsWith('.prg')) {
    fs.copyFileSync(path.join(root, 'assets', name), path.join(dst, name));
  }
}
