
import { framebufFromJson } from '../workspace'
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

/*
export const loadCalTxtFramebuf = (filename, importFile) => {
  try {
    const content = fs.readFileSync(filename, 'utf-8')
    const lines = content.split('\n')

    let mode = undefined
    let charcodes = []
    let colors = []
    lines.forEach(line => {
      if (line.match(/Character data/)) {
        mode = 'char'
        return
      }
      if (line.match(/Colour data/)) {
        mode = 'color'
        return
      }
      var m;
      if (m = /BYTE (.*)/.exec(line)) {
        let arr = JSON.parse(`[${m[1]}]`)
        arr.forEach(c => {
          if (mode === 'char') {
            charcodes.push(c)
          } else if (mode === 'color') {
            colors.push(c)
          } else {
            console.error('invalid mode')
          }
        })
      }
    })
    const codes = screencodeColorMap(charcodes, colors)
    importFile(framebufFromJson({
      width: 40,
      height: 25,
      backgroundColor: 0,
      borderColor: 0,
      framebuf: chunkArray(codes, 40)
    }))
  }
  catch(e) {
    alert(`Failed to load file '${filename}'!`)
  }
}
*/

export function loadMarqCFramebuf(filename: string, importFile: ImportDispatch) {
  try {
    const content = fs.readFileSync(filename, 'utf-8')
    const lines = content.split('\n')

    let frames = []
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
        break
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
