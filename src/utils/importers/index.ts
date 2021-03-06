
import { framebufFromJson } from '../../redux/workspace'
import { chunkArray } from '../../utils'

import { fs } from '../electronImports'

// TODO get rid of this
type ImportDispatch = any

function screencodeColorMap(charcodes: number[], colors: number[]) {
  return charcodes.map((c,i) => {
    return {
      code: c,
      color: colors[i]
    }
  })
}

export function loadMarqCFramebuf(filename: string, importFile: ImportDispatch) {
  try {
    const content = fs.readFileSync(filename, 'utf-8')
    const lines = content.split('\n')

    let frames = [];
    let charset = 'upper';
    let bytes: number[] = []
    for (let li = 0; li < lines.length; li++) {
      let line = lines[li]
      if (/unsigned char (.*)\[\].*/.exec(line)) {
        continue
      }
      if (/};.*/.exec(line)) {
        frames.push(bytes)
        bytes = []
        continue
      }
      if (/\/\/ META:/.exec(line)) {
        const parts = line.split(' ');
        // Emit only upper/lower.  If charset is unknown, default to upper.
        if (parts.length > 0) {
          if (parts[parts.length-1] === 'lower') {
            charset = 'lower';
          }
        }
        break;
      }

      let str = line.trim()
      if (str[str.length-1] === ',') {
        str = str.substring(0, str.length - 1);
      }
      let arr = JSON.parse(`[${str}]`)
      arr.forEach((byte: number) => {
        bytes.push(byte)
      })
    }

    // TODO support parsing the META tag after the array for machine make,
    // width, height
    const framebufs = frames.map(frame => {
      const bytes = frame
      const charcodes = bytes.slice(2, 1002)
      const colors = bytes.slice(1002, 2002)
      const codes = screencodeColorMap(charcodes, colors)
      return framebufFromJson({
        width: 40,
        height: 25,
        backgroundColor: bytes[1],
        borderColor: bytes[0],
        charset,
        framebuf: chunkArray(codes, 40)
      })
    })
    // TODO don't call importFile here, just return the framebuf array
    importFile(framebufs)
  } catch(e) {
    alert(`Failed to load file '${filename}'!`)
    console.error(e)
  }
}

export { loadD64Framebuf } from './d64'
export { loadSeq } from './seq2petscii'
