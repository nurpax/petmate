
import { Toolbar } from './toolbar'
import { Angle360, Brush, Pixel, Transform, Font } from './types'

import * as fp from '../utils/fp'

type CharsetBits = number[];  // TODO ts
type MirrorBits = number; // TODO ts

const MIRROR_X: MirrorBits = Toolbar.MIRROR_X
const MIRROR_Y: MirrorBits = Toolbar.MIRROR_Y

function reverseBits(b: number) {
  const b0 = (b & 1)
  const b1 = (b & 2) >> 1
  const b2 = (b & 4) >> 2
  const b3 = (b & 8) >> 3
  const b4 = (b & 16) >> 4
  const b5 = (b & 32) >> 5
  const b6 = (b & 64) >> 6
  const b7 = (b & 128) >> 7
  return (b0 << 7) | (b1 << 6) | (b2 << 5) | (b3 << 4) | (b4 << 3) | (b5 << 2) | (b6 << 1) | b7
}

function mirrorChar(bits: number[], mirror: MirrorBits) {
  if ((mirror & MIRROR_Y) !== 0) {
    bits.reverse()
  }
  if ((mirror & MIRROR_X) !== 0) {
    for (let i = 0; i < 8; i++) {
      bits[i] = reverseBits(bits[i])
    }
  }
  return bits
}

function rotateChar(charset: CharsetBits, code: number, angle: Angle360) {
  const offs = code*8
  let bits = [...charset.slice(offs, offs+8)]
  if (angle === 0) {
    return bits
  }
  if (angle === 90) {
    let res = Array(8).fill(0)
    for (let y = 0; y < 8; y++) {
      let c = bits[y]
      for (let i = 0; i < 8; i++) {
        res[i] |= ((c & (1<<i))>>i) << (7-y)
      }
    }
    return res
  }
  if (angle === 180) {
    return mirrorChar(bits, MIRROR_X | MIRROR_Y)
  }
  if (angle === 270) {
    let res = Array(8).fill(0)
    for (let y = 0; y < 8; y++) {
      let c = bits[y]
      for (let i = 0; i < 8; i++) {
        res[7-i] |= ((c & (1<<i))>>i) << y
      }
    }
    return res
  }
  return bits
}


function findTransformed(
  charset: CharsetBits,
  code: number,
  mirror: MirrorBits,
  angle: Angle360
) {
  // This identity check is a must-have here due to duplicate 8x8 blocks in
  // the character set.  If there's no transformation applied to the current
  // character, just return the original screencode rather than another one
  // that may be bit-wise equivalent.
  if (mirror === 0 && angle === 0) {
    return code
  }
  const rotchar = rotateChar(charset, code, angle)
  const flippedChar = mirrorChar(rotchar, mirror)
  for (let ci = 0; ci < 256; ci++) {
    let equals = true
    for (let i = 0; i < 8; i++) {
      if (charset[ci*8 + i] !== flippedChar[i]) {
        equals = false
        break
      }
    }
    if (equals) {
      return ci
    }
  }
  return code
}

export function findTransformedChar(font: Font, code: number, xform: Transform) {
  return findTransformed(font.bits, code, xform.mirror, xform.rotate)
}

export function findInverseChar(font: Font, code: number) {
  const fontData = font.bits
  const offs = code*8
  let bits = fontData.slice(offs, offs+8).map(v => (~v) & 255)

  for (let ci = 0; ci < 256; ci++) {
    let equals = true
    for (let i = 0; i < 8; i++) {
      if (fontData[ci*8 + i] !== bits[i]) {
        equals = false
        break
      }
    }
    if (equals) {
      return ci
    }
  }
  return code
}

export function mirrorBrush(brush: Brush, brushTransform: Transform, font: Font) {
  const fontData = font.bits
  if (brush === null) {
    return null
  }
  const { mirror, rotate } = brushTransform
  if (rotate === 0 && mirror === 0) {
    return brush
  }
  const { framebuf } = brush
  const charset = fontData
  const { max } = brush.brushRegion
  let width = max.col+1
  let height = max.row+1
  if (rotate === 90 || rotate === 270) {
    width = max.row+1
    height = max.col+1
  }

  const nullpix = { code: 0, color: 0 };
  const fb = fp.mkArray(height, () => fp.mkArray(width, () => nullpix));
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let pix = null
      if (rotate === 0) {
        pix = framebuf[y][x]
      } else if (rotate === 90) {
        pix = framebuf[x][height-y-1]
      } else if (rotate === 180) {
        pix = framebuf[height-y-1][width-x-1]
      } else if (rotate === 270) {
        pix = framebuf[width-x-1][y]
      }
      fb[y][x] = pix
    }
  }
  const rowsYFlipped =
    (mirror & MIRROR_Y) !== 0 ? [...fb].reverse() : fb

  const fbRows: Pixel[][] =
    (mirror & MIRROR_X) !== 0 ?
      rowsYFlipped.map(row => [...row].reverse()) :
      rowsYFlipped

  return {
    ...brush,
    brushRegion: {
      min: { row: 0, col: 0 },
      max: { row: height-1, col: width-1 }
    },
    framebuf: fbRows.map(row => {
      return row.map(({code, color}) => {
        return {
          code: findTransformed(charset, code, mirror, rotate),
          color
        }
      })
    })
  }
}
