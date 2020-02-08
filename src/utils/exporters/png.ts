
import { FramebufWithFont, FileFormatPng, RgbPalette } from '../../redux/types'
import { framebufToPixels, scalePixels, computeOutputImageDims } from './util'
import { electron, fs } from '../electronImports'

const nativeImage = electron.nativeImage

export function savePNG(filename: string, fb: FramebufWithFont, palette: RgbPalette, fmt: FileFormatPng): void {
  try {
    const options = fmt.exportOptions;

    const { imgWidth, imgHeight } = computeOutputImageDims(fb, options.borders);
    const scale = options.scale
    const buf = framebufToPixels(fb, palette, options.borders);
    const pixBuf = scale != 1 ? scalePixels(buf, imgWidth, imgHeight, scale) : buf;

    if (options.alphaPixel) {
      // TODO is this enough to fool png->jpeg transcoders heuristics?
      pixBuf[3] = 254;
    }
    const img = nativeImage.createFromBuffer(pixBuf, {
      width: scale*imgWidth, height: scale*imgHeight
    })
    fs.writeFileSync(filename, img.toPNG(), null);
  }
  catch(e) {
    alert(`Failed to save file '${filename}'!`);
    console.error(e);
  }
}

