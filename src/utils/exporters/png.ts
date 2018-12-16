
import { FramebufWithFont, FileFormatPng, RgbPalette } from '../../redux/types'
import { framebufToPixels, doublePixels } from './util'
import { electron, fs } from '../electronImports'

const nativeImage = electron.nativeImage

export function savePNG(filename: string, fb: FramebufWithFont, palette: RgbPalette, fmt: FileFormatPng): void {
  try {
    const options = fmt.exportOptions;
    const { width, height } = fb
    const dwidth = width*8
    const dheight = height*8

    const buf = framebufToPixels(fb, palette);
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

