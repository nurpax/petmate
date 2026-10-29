
import { FramebufWithFont, FileFormatPng, RgbPalette } from '../../redux/types'
import { framebufToPixels, scalePixels, computeOutputImageDims } from './util'
import { fs } from '../electronImports'
import { PNG } from 'pngjs'

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
    // pixBuf is BGRA, PNG wants RGBA.
    for (let i = 0; i < pixBuf.length; i += 4) {
      const b = pixBuf[i];
      pixBuf[i] = pixBuf[i+2];
      pixBuf[i+2] = b;
    }
    const img = new PNG({ width: scale*imgWidth, height: scale*imgHeight });
    img.data = pixBuf;
    fs.writeFileSync(filename, PNG.sync.write(img), null);
  }
  catch(e) {
    alert(`Failed to save file '${filename}'!`);
    console.error(e);
  }
}

