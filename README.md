# Petmate PETSCII Editor

A Commodore 64 PETSCII graphics editor written in React/Redux/Electron.

Documentation & downloads: [https://nurpax.github.io/petmate/](https://nurpax.github.io/petmate/)

The rest of this document is intended for Petmate developers.

## Building and running on Linux

These instructions assume Node.js v18+ and npm. `yarn` is not required.

### System dependencies

Building a `.deb` package requires `fakeroot` and `dpkg-dev`:

```bash
sudo apt install fakeroot dpkg-dev
```

### Install Node dependencies

```bash
npm install
```

### Run in development mode

```bash
npm start
```

This starts the React dev server and launches Electron pointing at it.

> **Note:** The `start` script sets `NODE_OPTIONS=--openssl-legacy-provider` scoped to the React dev server only (required for webpack compatibility with Node.js v17+), and passes `--no-sandbox` to Electron (required on Linux systems where the Chrome sandbox setuid binary is not configured).

### Package as a .deb

First build the production React bundle, then run electron-builder:

```bash
npm run build
npm run dist-linux
```

This produces a `.deb` package at `dist/petmate_<version>_amd64.deb`.

To install it:

```bash
sudo apt install ./dist/petmate_*_amd64.deb
```
