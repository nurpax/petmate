// This needs to be completely stand-alone as it may be used
// as a web worker.

// Note: currently supports only 320x200 borderless or 384x272 bordered inputs.

const SCREEN_WIDTH = 320;
const SCREEN_HEIGHT = 200;

// These match the dimensions that VICE uses for PNG export.
const BORDER_LEFT_WIDTH = 32;
const BORDER_RIGHT_WIDTH = 32;
const BORDER_TOP_HEIGHT = 35;
const BORDER_BOTTOM_HEIGHT = 37;

type Rgb = {
  r: number,
  g: number,
  b: number
};

export interface Args {
  width: number;
  height: number;
  data: Uint8Array;
  fontBits: Uint8Array,
  rgbPalettes: Rgb[][];
}

export interface Match {
  backgroundColor: number;
  screencodes: Uint8Array;
  colors: (number|undefined)[];
};

export interface Result {
  width: number;
  height: number;
  hasBorder: boolean;
  borderColor?: number; // this is not set if the image didn't include border
  matches: Match[];
}

export interface Err {
  error: string;
}

export function isError(v: Result|Err): v is Err {
  return v.hasOwnProperty('error');
}

function sqr(a: number) {
  return a*a;
}

// Convert from RGB to our fixed C64 palette
function toIndexed(data: Uint8Array, rgbPalette: Rgb[], numPixels: number) {
  const indexed = new Uint8Array(numPixels);
  let mse = 0.0;
  for (let i = 0; i < numPixels; i++) {
    const rr = data[i*4+0];
    const rg = data[i*4+1];
    const rb = data[i*4+2];

    let minDist = 3*256*256;
    let minIdx  = 0;
    for (let ci = 0; ci < 16; ci++) {
      const dist = sqr(rr - rgbPalette[ci].r) + sqr(rg - rgbPalette[ci].g) + sqr(rb - rgbPalette[ci].b);
      if (dist < minDist) {
        minDist = dist;
        minIdx = ci;
      }
    }
    mse += minDist;
    indexed[i] = minIdx;
  }
  return {
    indexed,
    mse: mse / numPixels
  }
}

function crop(
  data: Uint8Array,
  stride: number,
  outWidth: number,
  outHeight: number,
  offsetX: number,
  offsetY: number
) {
  if (offsetX == 0 && offsetY == 0 && stride == outWidth) {
    return data;
  }
  const dst = new Uint8Array(outWidth * outHeight);
  let dstIdx = 0;
  for (let y = 0; y < outHeight; y++) {
    for (let x = 0; x < outWidth; x++, dstIdx++) {
      dst[dstIdx] = data[(y + offsetY) * stride + x + offsetX];
    }
  }
  return dst;
}

function findBorderColor(data: Uint8Array, hasBorder: boolean, width: number, height: number) {
  if (!hasBorder) {
    return undefined;
  }
  // Take a pixel from the middle of the left border (for a completely clean
  // input the location shouldn't really matter.)
  return data[Math.floor(BORDER_LEFT_WIDTH/2) + Math.floor((height/2))*width];
}

function getBlockBits(data: Uint8Array, offs: number, stride: number, bg: number) {
  const b = new Uint8Array(8);
  let yoffs = offs;
  let color = undefined;
  for (let y = 0; y < 8; y++, yoffs += stride) {
    let bits = 0;
    for (let x = 0; x < 8; x++) {
      const pix = data[yoffs + x];
      if (pix != bg) {
        bits |= 1 << (7 - x);
        // If there are multiple colors, then the background color must be wrong
        // and we should bail out from this decoding attempt.
        if (color != undefined) {
          if (color != pix) {
            return undefined;
          }
        }
        color = pix;
      }
    }
    b[y] = bits;
  }
  return {
    color,
    block: b
  };
}

function matchScreencode(fontBits: Uint8Array, blockBits: Uint8Array): number|undefined {
  for (let ci = 0; ci < 256; ci++) {
    const offs = ci*8;

    let found = true;
    for (let i = 0; i < 8; i++) {
      if (fontBits[offs + i] != blockBits[i]) {
        found = false;
        break;
      }
    }
    if (found) {
      return ci;
    }
  }
  return undefined;
}

function findScreencodes(
  fontBits: Uint8Array,
  screenPixels: Uint8Array,
  width: number,
  height: number,
  backgroundColor: number
): Match|undefined {
  const blockWidth  = Math.floor(width / 8);
  const blockHeight = Math.floor(height / 8);
  const numBlocks   = blockWidth * blockHeight;
  const stride = width;

  const dstScreencode = new Uint8Array(numBlocks);
  const dstColor = Array(numBlocks).fill(undefined);

  for (let by = 0; by < blockHeight; by++) {
    for (let bx = 0; bx < blockWidth; bx++) {
      const offs = by*8*stride + bx*8;
      const blockBits = getBlockBits(screenPixels, offs, stride, backgroundColor);
      if (!blockBits) {
        return undefined;
      }
      const { color, block } = blockBits;
      const screencode = matchScreencode(fontBits, block);
      if (screencode == undefined) {
        return undefined;
      }
      const dstOffs = by*blockWidth + bx;
      dstScreencode[dstOffs] = screencode;
      dstColor[dstOffs] = color;
    }
  }
  return {
    backgroundColor,
    screencodes: dstScreencode,
    colors: dstColor
  };
}

// Pick the RGB->indexed variant that minimizes MSE error between original RGBs
// and the index quantized version.  There could be a faster way to do this, but
// this works decently.  The reason we're doing this is that there exist many
// flavors of the C64 palette and some PETSCII PNGs use a palette that maps
// color indices to different values if quantized against the default Petmate
// color palette.
function convertToIndexed(data: Uint8Array, rgbPalettes: Rgb[][], numPixels: number) {
  let indexedBitmap: Uint8Array;
  let minMse = Infinity;
  for (let paletteIdx in rgbPalettes) {
    const { indexed, mse } = toIndexed(data, rgbPalettes[paletteIdx], numPixels);
    if (mse < minMse) {
      indexedBitmap = indexed;
      minMse = mse;
    }
  }
  return indexedBitmap!;
}

export function png2petscii(args: Args): Err|Result  {
  let hasBorder = false;
  const { width, height } = args;
  if (width == SCREEN_WIDTH + BORDER_LEFT_WIDTH + BORDER_RIGHT_WIDTH &&
      height == SCREEN_HEIGHT + BORDER_TOP_HEIGHT + BORDER_BOTTOM_HEIGHT) {
    hasBorder = true;
  } else {
    if (width != SCREEN_WIDTH || height !== SCREEN_HEIGHT) {
      return { error: `Only 320x200 borderless or 384x272 bordered inputs are supported.  Got ${width}x${height}` };
    }
  }
  const outWidth = 40;
  const outHeight = 25;
  const indexedBitmap = convertToIndexed(args.data, args.rgbPalettes, width*height);
  const [offsetX, offsetY] = hasBorder ? [BORDER_LEFT_WIDTH, BORDER_TOP_HEIGHT] : [0, 0];
  const [screenWidth, screenHeight] = hasBorder ? [width - BORDER_LEFT_WIDTH - BORDER_RIGHT_WIDTH, height - BORDER_TOP_HEIGHT - BORDER_BOTTOM_HEIGHT] : [width, height];
  const screenOnlyIndexed = crop(indexedBitmap, width, SCREEN_WIDTH, SCREEN_HEIGHT, offsetX, offsetY);
  const borderColor = findBorderColor(indexedBitmap, hasBorder, width, height);
  const results: Match[] = [];
  // Try all 16 background colors and see which ones match.
  for (let bg = 0; bg < 16; bg++) {
    const fb = findScreencodes(args.fontBits, screenOnlyIndexed, screenWidth, screenHeight, bg);
    if (fb != undefined) {
      results.push(fb);
    }
  }
  if (results.length == 0) {
    return {
      error: 'Could not match to PETSCII for any background color.  Likely reason: the image is not aligned to 8x8 blocks or is resized to non-1x1 pixel size.'
    };
  }
  return {
    width: outWidth,
    height: outHeight,
    hasBorder: hasBorder,
    borderColor,
    matches: results
  }
}
