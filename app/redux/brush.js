
const reverseBits = (b) => {
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

const findHFlippedChar = (charset, code) => {
  const offs = code*8
  const origBits = charset.slice(offs, offs+8)
  for (let ci = 0; ci < 256; ci++) {
    let equals = true
    for (let i = 0; i < 8; i++) {
      if (reverseBits(charset[ci*8+i]) !== origBits[i]) {
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

const findVFlippedChar = (charset, code) => {
  const offs = code*8
  const origBits = charset.slice(offs, offs+8)
  for (let ci = 0; ci < 256; ci++) {
    let equals = true
    for (let i = 0; i < 8; i++) {
      if (charset[ci*8 + (7-i)] !== origBits[i]) {
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

export const mirrorBrush = (brush, { charset, axis }) => {
  if (brush === null) {
    return brush
  }
  if (axis === 'v') {
    return {
      ...brush,
      framebuf: [...brush.framebuf].reverse().map(row => {
        return row.map(({code, color}) => {
          return {
            code: findVFlippedChar(charset, code),
            color
          }
        })
      })
    }
  }
  return {
    ...brush,
    framebuf: brush.framebuf.map(row => [...row].reverse().map(({code, color}) => {
      return {
        code: findHFlippedChar(charset, code),
        color
      }
    }))
  }
}