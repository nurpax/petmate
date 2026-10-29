// See: https://github.com/electron/electron/issues/7300
//
// When running in a plain browser (the web/PWA build), there's no Node
// integration.  Fall back to the in-memory fs/path shims in that case and
// leave `electron` as null.  Code that needs Electron APIs should go through
// ./platform instead of using `electron` directly.

import * as webFs from './webFs'

const isElectron = typeof window.require === 'function'

const electron = isElectron ? window.require('electron') : null
const fs = isElectron ? window.require('fs') : webFs.fs
const path = isElectron ? window.require('path') : webFs.path

export { electron, fs, path, isElectron };
