
// Create a 10 x 10 gif
var GifEncoder = require('gif-encoder');

import { framebufToPixelsIndexed } from './util'

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
    encoder.setDelay(250)

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
    if (options.animMode !== 'anim') {
      exportGIF(encoder, selectedFb, palette, options)
    } else {
      for (let fidx = 0; fidx < fbs.length; fidx++) {
        exportGIF(encoder, fbs[fidx], palette, options)
      }
      // TODO maybe we should skip the last and first frames here?
      if (options.loopMode === 'pingpong') {
        for (let fidx = fbs.length-1; fidx >= 0; fidx--) {
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
