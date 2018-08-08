
import { systemFontData } from '../../utils'
import { chunkArray, executablePrgTemplate } from '../../utils'

import { saveAsm } from './asm'
import { saveBASIC } from './basic'

const nativeImage = require('electron').nativeImage

let fs = require('fs')

function doublePixels(buf, w, h) {
  const dstPitch = 2*w*4
  const dst = Buffer.alloc(2*w * 2*h * 4)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const srcOffs = (x + y*w)*4
      const dstOffs = (x*2*4 + 2*y*dstPitch)
      const b = buf[srcOffs + 0]
      const g = buf[srcOffs + 1]
      const r = buf[srcOffs + 2]
      const a = buf[srcOffs + 3]

      for (let o = 0; o < dstPitch*2; o+=dstPitch) {
        dst[o + dstOffs + 0] = b
        dst[o + dstOffs + 1] = g
        dst[o + dstOffs + 2] = r
        dst[o + dstOffs + 3] = a

        dst[o + dstOffs + 4] = b
        dst[o + dstOffs + 5] = g
        dst[o + dstOffs + 6] = r
        dst[o + dstOffs + 7] = a
      }
    }
  }
  return dst
}

const savePNG = (filename, fb, palette, options) => {
  try {
    const { width, height, framebuf, backgroundColor } = fb
    const dwidth = width*8
    const dheight = height*8
    const buf = Buffer.alloc(dwidth * dheight * 4)

    const bgColor = palette[backgroundColor]

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const pix = framebuf[y][x]
        const c = pix.code
        const col = pix.color
        const boffs = c*8
        const color = palette[col]

        for (let cy = 0; cy < 8; cy++) {
          const p = systemFontData[boffs + cy]
          for (let i = 0; i < 8; i++) {
            const set = ((128 >> i) & p) !== 0
            const offs = (y*8+cy) * dwidth + (x*8 + i)

            const col = set ? color : bgColor
            buf[offs * 4 + 0] = col.b
            buf[offs * 4 + 1] = col.g
            buf[offs * 4 + 2] = col.r
            buf[offs * 4 + 3] = 255
          }
        }
      }
    }

    const scale = options.doublePixels ? 2 : 1
    const pixBuf = options.doublePixels ?
      doublePixels(buf, dwidth, dheight) : buf
    if (options.alphaPixel) {
      // TODO is this enough to fool png->jpeg transcoders heuristics?
      pixBuf[3] = 254
    }
    const img = nativeImage.createFromBuffer(pixBuf, {
      width: scale*dwidth, height: scale*dheight
    })
    fs.writeFileSync(filename, img.toPNG(), null)
  }
  catch(e) {
    alert(`Failed to save file '${filename}'!`)
    console.error(e)
  }
}

function bytesToCommaDelimited(dstLines, bytes, bytesPerLine) {
  let lines = chunkArray(bytes, bytesPerLine)
  for (let i = 0; i < lines.length; i++) {
    const s = lines[i].join(',')
    if (i === lines.length-1) {
      dstLines.push(s)
    } else {
      dstLines.push(`${s},`)
    }
  }
}

function convertToMarqC(lines, fb, idx) {
  const { width, height, framebuf, backgroundColor, borderColor } = fb

  // TODO support multiple screens
  const num = String(idx).padStart(4, '0')
  lines.push(`unsigned char frame${num}[]={// border,bg,chars,colors`)

  let bytes = []
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      bytes.push(framebuf[y][x].code)
    }
  }
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      bytes.push(framebuf[y][x].color)
    }
  }
  lines.push(`${borderColor},${backgroundColor},`)
  bytesToCommaDelimited(lines, bytes, width)
  lines.push('};')
}

const saveMarqC = (filename, fbs, options) => {
  try {
    let lines = []
    fbs.forEach((fb,idx) => convertToMarqC(lines, fb, idx))
    let width = 0
    let height = 0
    if (fbs.length >= 1) {
      width = fbs[0].width
      height = fbs[0].height
    }
    lines.push(`// META: ${width} ${height} C64 upper`)
    fs.writeFileSync(filename, lines.join('\n') + '\n', null)
  }
  catch(e) {
    alert(`Failed to save file '${filename}'!`)
    console.error(e)
  }
}

const saveExecutablePRG = (filename, fb, options) => {
  try {
    const { width, height, framebuf, backgroundColor, borderColor } = fb

    if (width !== 40 || height !== 25) {
      throw 'Only 40x25 framebuffer widths are supported!'
    }

    let buf = executablePrgTemplate.slice(0)
    // Search for STA $d020
    const d020idx = buf.indexOf(Buffer.from([0x8d, 0x20, 0xd0]))
    buf[d020idx - 1] = borderColor
    // Search for STA $d021
    const d021idx = buf.indexOf(Buffer.from([0x8d, 0x21, 0xd0]))
    buf[d021idx - 1] = backgroundColor

    let screencodeOffs = 0x62
    let colorOffs = screencodeOffs + 1000

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        buf[screencodeOffs++] = framebuf[y][x].code
        buf[colorOffs++] = framebuf[y][x].color
      }
    }

    fs.writeFileSync(filename, buf, null)
  }
  catch(e) {
    alert(`Failed to save file '${filename}'!`)
    console.error(e)
  }
}

export {
  savePNG,
  saveMarqC,
  saveExecutablePRG,
  saveAsm,
  saveBASIC
}

