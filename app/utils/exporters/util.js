
export const framebufToPixels = (fb, palette, options) => {
  const { width, height, framebuf, backgroundColor, font } = fb
  const fontData = font.bits
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
        const p = fontData[boffs + cy]
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
  return buf
}

