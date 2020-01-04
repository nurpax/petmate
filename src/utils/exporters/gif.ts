
import { framebufToPixelsIndexed, computeOutputImageDims } from './util'

import { fs } from '../electronImports'
import { FramebufWithFont, RgbPalette, FileFormatGif } from  '../../redux/types';

type GifEncoder = any;
const GifEncoder: GifEncoder = require('gif-encoder');

export function saveGIF(filename: string, fbs: FramebufWithFont[], palette: RgbPalette, fmt: FileFormatGif): void {
  const options = fmt.exportOptions;
  try {
    const selectedFb = fbs[fmt.commonExportParams.selectedFramebufIndex]

    const gifPalette = Array(16*3).fill(0)
    palette.forEach(({r, g, b}, idx) => {
      gifPalette[idx*3 + 0] = r
      gifPalette[idx*3 + 1] = g
      gifPalette[idx*3 + 2] = b
    });

    const { imgWidth, imgHeight } = computeOutputImageDims(selectedFb, options.borders);

    let encoder = new GifEncoder(imgWidth, imgHeight, {
      palette: gifPalette,
      highWaterMark: 1024*256
    })

    function exportGIF(fb: FramebufWithFont) {
      // Note: read() is a work-around for https://github.com/twolfson/gif-encoder/issues/10
      encoder.read(1024*128);
      const pixels = framebufToPixelsIndexed(fb, options.borders)
      encoder.addFrame(pixels)
    }

    encoder.setQuality(20)
    const delayMS = options.delayMS
    if (delayMS !== '') {
      const delay = parseInt(delayMS, 10)
      if (!isNaN(delay) && delay > 0 && delay < 10*1000) {
        encoder.setDelay(delay)
      }
    } else {
      encoder.setDelay(250)
    }

    if (options.loopMode === 'once') {
      encoder.setRepeat(-1);
    } else if (options.loopMode === 'loop' || options.loopMode === 'pingpong') {
      encoder.setRepeat(0);
    } else {
      console.error('invalid loop mode', options.loopMode)
    }

    let file = fs.createWriteStream(filename);
    encoder.pipe(file);

    encoder.writeHeader();
    if (options.animMode !== 'anim' || fbs.length == 1) {
      exportGIF(selectedFb);
    } else {
      for (let fidx = 0; fidx < fbs.length; fidx++) {
        exportGIF(fbs[fidx]);
      }
      // Skip last and first frames when looping back to beginning.
      if (options.loopMode === 'pingpong') {
        for (let fidx = fbs.length-2; fidx >= 1; fidx--) {
          exportGIF(fbs[fidx]);
        }
      }
    }
    encoder.finish()
  } catch(e) {
    alert(`Failed to save file '${filename}'!`)
    console.error(e)
  }
}
