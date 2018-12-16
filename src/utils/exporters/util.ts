
import { FramebufWithFont, RgbPalette } from '../../redux/types'

export function framebufToPixelsIndexed(fb: FramebufWithFont): Buffer  {
  const { width, height, framebuf, backgroundColor, font } = fb
  const fontData = font.bits
  const dwidth = width*8
  const dheight = height*8
  const buf = Buffer.alloc(dwidth * dheight)

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const pix = framebuf[y][x]
      const c = pix.code
      const col = pix.color
      const boffs = c*8

      for (let cy = 0; cy < 8; cy++) {
        const p = fontData[boffs + cy]
        for (let i = 0; i < 8; i++) {
          const set = ((128 >> i) & p) !== 0
          const offs = (y*8+cy) * dwidth + (x*8 + i)

          const c = set ? col : backgroundColor
          buf[offs] = c
        }
      }
    }
  }
  return buf
}

export function framebufToPixels(fb: FramebufWithFont, palette: RgbPalette): Buffer {
  const { width, height } = fb
  const dwidth = width*8
  const dheight = height*8

  const indexedBuf = framebufToPixelsIndexed(fb)
  const buf = Buffer.alloc(dwidth * dheight * 4)

  for (let y = 0; y < height*8; y++) {
    for (let x = 0; x < width*8; x++) {
      const offs = y*width*8 + x
      const col = palette[indexedBuf[offs]]
      buf[offs * 4 + 0] = col.b
      buf[offs * 4 + 1] = col.g
      buf[offs * 4 + 2] = col.r
      buf[offs * 4 + 3] = 255
    }
  }
  return buf
}

export function doublePixels(buf: Buffer, w: number, h: number): Buffer {
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

