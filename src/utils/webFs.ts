// Minimal in-memory stand-ins for Node's fs and path modules, used when
// Petmate runs in a plain browser instead of Electron.
//
// Files picked by the user (or bundled app assets) are put into this
// filesystem before the rest of the app reads them with fs.readFileSync.
// Writing a file hands it to the registered write handler, which delivers it
// to the user as a download or through the share sheet.

const files = new Map<string, Uint8Array>();

type WriteHandler = (filename: string, data: Uint8Array) => void;
let writeHandler: WriteHandler = () => {};

export function setWriteHandler(handler: WriteHandler) {
  writeHandler = handler;
}

export function putFile(filename: string, data: Uint8Array) {
  files.set(filename, data);
}

function isTextEncoding(enc: any) {
  return enc === 'utf-8' || enc === 'utf8' || (enc && (enc.encoding === 'utf-8' || enc.encoding === 'utf8'));
}

function toBytes(data: any): Uint8Array {
  if (typeof data === 'string') {
    return new TextEncoder().encode(data);
  }
  if (data instanceof Uint8Array) {
    return new Uint8Array(data);
  }
  return new Uint8Array(data);
}

export const fs = {
  existsSync(filename: string): boolean {
    return files.has(filename);
  },

  readFileSync(filename: string, enc?: any): any {
    const data = files.get(filename);
    if (data === undefined) {
      throw new Error(`ENOENT: no such file '${filename}'`);
    }
    if (isTextEncoding(enc)) {
      return new TextDecoder().decode(data);
    }
    return Buffer.from(data);
  },

  writeFileSync(filename: string, data: any, _enc?: any) {
    const bytes = toBytes(data);
    files.set(filename, bytes);
    writeHandler(filename, bytes);
  }
};

function basename(p: string, ext?: string) {
  const base = p.substring(p.lastIndexOf('/') + 1);
  if (ext !== undefined && base.endsWith(ext)) {
    return base.substring(0, base.length - ext.length);
  }
  return base;
}

function extname(p: string) {
  const base = basename(p);
  const idx = base.lastIndexOf('.');
  return idx <= 0 ? '' : base.substring(idx);
}

function join(...parts: string[]) {
  return parts.join('/').replace(/\/+/g, '/');
}

export const path = {
  basename,
  extname,
  join,
  resolve: join
};
