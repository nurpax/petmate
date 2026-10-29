// Everything that differs between the Electron app and the web/PWA build.
//
// File dialogs are asynchronous here because a browser can't block on a file
// picker.  In the browser, a picked file is copied into the in-memory
// filesystem (./webFs) and the dialog resolves to its path there, so the rest
// of the app can keep reading files with fs.readFileSync(filename).

import { electron, fs, path, isElectron } from './electronImports'
import * as webFs from './webFs'

export { isElectron }

export interface FileFilter {
  name: string;
  extensions: string[];
}

const APP_FILES_PREFIX = '/app/';
const SETTINGS_KEY = 'petmate.settings';

const mimeTypes: { [ext: string]: string } = {
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.json': 'application/json',
  '.c': 'text/plain',
  '.asm': 'text/plain',
  '.bas': 'text/plain'
};

export function isTouchDevice(): boolean {
  return typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0;
}

//---------------------------------------------------------------------
// File dialogs

function readBrowserFile(file: File): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(new Uint8Array(reader.result as ArrayBuffer));
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}

// Copy a browser File object into the in-memory filesystem and return its
// path there.
export function putBrowserFile(file: File): Promise<string> {
  return readBrowserFile(file).then(data => {
    const filename = '/' + file.name;
    webFs.putFile(filename, data);
    return filename;
  });
}

function pickBrowserFile(filters: FileFilter[]): Promise<string|undefined> {
  return new Promise(resolve => {
    const input = document.createElement('input');
    input.type = 'file';
    input.style.display = 'none';
    // iOS greys out files whose extension it doesn't know (.petmate, .seq,
    // .d64, ..) when `accept` lists them, so only filter by known types.
    const exts = filters.reduce((acc: string[], f) => acc.concat(f.extensions), []);
    if (exts.length > 0 && exts.every(e => e === 'png')) {
      input.accept = 'image/png,.png';
    }
    input.addEventListener('change', () => {
      const file = input.files && input.files[0];
      document.body.removeChild(input);
      if (!file) {
        resolve(undefined);
        return;
      }
      putBrowserFile(file).then(resolve, e => {
        console.error(e);
        alert(`Failed to read file '${file.name}'!`);
        resolve(undefined);
      });
    });
    document.body.appendChild(input);
    input.click();
  });
}

export function showOpenDialog(filters: FileFilter[]): Promise<string|undefined> {
  if (isElectron) {
    const { dialog } = electron.remote;
    const window = electron.remote.getCurrentWindow();
    const filenames = dialog.showOpenDialogSync(window, { properties: ['openFile'], filters });
    if (filenames === undefined || filenames.length !== 1) {
      return Promise.resolve(undefined);
    }
    return Promise.resolve(filenames[0]);
  }
  return pickBrowserFile(filters);
}

// In the browser there's no save dialog: the file goes to the user's
// downloads (or the share sheet on iOS) under `defaultName`.  With
// `askName`, the user gets to type the name first.
export function showSaveDialog(
  filters: FileFilter[],
  defaultName: string,
  askName = false
): Promise<string|undefined> {
  if (isElectron) {
    const { dialog } = electron.remote;
    const window = electron.remote.getCurrentWindow();
    return Promise.resolve(dialog.showSaveDialogSync(window, { properties: ['openFile'], filters }));
  }
  let name: string|null = defaultName;
  if (askName) {
    name = window.prompt('Save as', defaultName);
    if (name === null || name.trim() === '') {
      return Promise.resolve(undefined);
    }
    name = name.trim();
    const ext = filters.length > 0 ? `.${filters[0].extensions[0]}` : '';
    if (ext !== '' && path.extname(name) !== ext) {
      name += ext;
    }
  }
  return Promise.resolve('/' + name);
}

function downloadFile(file: File) {
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 60 * 1000);
}

// Hand a file written by the app over to the user.
function deliverFile(filename: string, data: Uint8Array) {
  const name = path.basename(filename);
  const type = mimeTypes[path.extname(name).toLowerCase()] || 'application/octet-stream';
  const file = new File([data], name, { type });
  const nav = navigator as any;
  if (isTouchDevice() && nav.canShare && nav.canShare({ files: [file] })) {
    nav.share({ files: [file] }).catch((e: any) => {
      if (e && e.name === 'AbortError') {
        return;
      }
      downloadFile(file);
    });
    return;
  }
  downloadFile(file);
}

if (!isElectron) {
  webFs.setWriteHandler(deliverFile);
}

//---------------------------------------------------------------------
// Message boxes

export function confirmDialog(msg: { title: string, message: string, detail: string }): boolean {
  if (isElectron) {
    const { dialog } = electron.remote;
    return dialog.showMessageBoxSync({
      type: 'question',
      buttons: [msg.title, 'Cancel'],
      cancelId: 1,
      message: msg.message,
      detail: msg.detail
    }) === 0;
  }
  return window.confirm(`${msg.message}\n\n${msg.detail}`);
}

//---------------------------------------------------------------------
// Window & OS integration

export function setTitle(title: string) {
  if (isElectron) {
    electron.ipcRenderer.send('set-title', title);
  } else {
    document.title = title;
  }
}

export function addRecentDocument(filename: string) {
  if (isElectron) {
    electron.remote.app.addRecentDocument(filename);
  }
}

//---------------------------------------------------------------------
// Settings

function settingsFile() {
  return path.join(electron.remote.app.getPath('userData'), 'Settings');
}

export function readSettings(): string|null {
  if (isElectron) {
    const f = settingsFile();
    return fs.existsSync(f) ? fs.readFileSync(f, 'utf-8') : null;
  }
  try {
    return window.localStorage.getItem(SETTINGS_KEY);
  } catch (e) {
    return null;
  }
}

export function writeSettings(json: string) {
  if (isElectron) {
    fs.writeFileSync(settingsFile(), json, 'utf-8');
    return;
  }
  try {
    window.localStorage.setItem(SETTINGS_KEY, json);
  } catch (e) {
    console.error('failed to save settings', e);
  }
}

//---------------------------------------------------------------------
// Bundled app files (charsets, PRG template)

export const appFiles = [
  'assets/system-charset.bin',
  'assets/system-charset-lower.bin',
  'assets/pet-charset-upper.bin',
  'assets/pet-charset-lower.bin',
  'assets/template.prg'
];

// The browser can only fetch app files asynchronously, so they're fetched
// into the in-memory filesystem before the app modules (which read them on
// load) are imported.
export function preloadAppFiles(): Promise<void> {
  if (isElectron) {
    return Promise.resolve();
  }
  return Promise.all(appFiles.map(name => {
    return fetch(name)
      .then(res => {
        if (!res.ok) {
          throw new Error(`failed to fetch ${name}: ${res.status}`);
        }
        return res.arrayBuffer();
      })
      .then(buf => webFs.putFile(APP_FILES_PREFIX + name, new Uint8Array(buf)));
  })).then(() => undefined);
}

export function loadAppFile(filename: string): any {
  if (isElectron) {
    const appPath = electron.remote.app.getAppPath();
    return fs.readFileSync(path.resolve(appPath, filename));
  }
  return fs.readFileSync(APP_FILES_PREFIX + filename);
}
