
import { framebufToPixelsIndexed } from './util'

var GifEncoder = require('gif-encoder');

const exportGIF = (encoder, fb, palette, options) => {
  const pixels = framebufToPixelsIndexed(fb, palette, options)
  encoder.addFrame(pixels)
}

export const saveGIF = (filename, fbs, palette, options) => {
  try {
    const selectedFb = fbs[options.selectedFramebufIndex]

    const gifPalette = Array(16*3).fill(0)
    palette.forEach(({r, g, b}, idx) => {
      gifPalette[idx*3 + 0] = r
      gifPalette[idx*3 + 1] = g
      gifPalette[idx*3 + 2] = b
    })

    let encoder = new GifEncoder(selectedFb.width*8, selectedFb.height*8, {
      palette: gifPalette,
      highWaterMark:1024*256
    })

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
      encoder.setRepeat(-1) // TODO options
    } else if (options.loopMode === 'loop' || options.loopMode === 'pingpong') {
      encoder.setRepeat(0) // TODO options
    } else {
      console.error('invalid loop mode', options.loopMode)
    }

    let file = require('fs').createWriteStream(filename);
    encoder.pipe(file);

    encoder.writeHeader();
    if (options.animMode !== 'anim' || fbs.length == 1) {
      exportGIF(encoder, selectedFb, palette, options)
    } else {
      for (let fidx = 0; fidx < fbs.length; fidx++) {
        exportGIF(encoder, fbs[fidx], palette, options)
      }
      // Skip last and first frames when looping back to beginning.
      if (options.loopMode === 'pingpong') {
        for (let fidx = fbs.length-2; fidx >= 1; fidx--) {
          exportGIF(encoder, fbs[fidx], palette, options)
        }
      }
    }
    encoder.finish()
  } catch(e) {
    alert(`Failed to save file '${filename}'!`)
    console.error(e)
  }
}
