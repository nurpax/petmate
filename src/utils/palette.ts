
import { Rgb, PaletteName } from '../redux/types'

const palette: Rgb[] = [
  {r:0x00, g:0x00, b:0x00},
  {r:0xff, g:0xff, b:0xff},
  {r:146, g:74, b:64},
  {r:132, g:197, b:204},
  {r:147, g:81, b:182},
  {r:114, g:177, b:75},
  {r:72, g:58, b:164},
  {r:213, g:223, b:124},
  {r:153, g:105, b:45},
  {r:103, g:82, b:1},
  {r:192, g:129, b:120},
  {r:96, g:96, b:96},
  {r:138, g:138, b:138},
  {r:178, g:236, b:145},
  {r:134, g:122, b:222},
  {r:174, g:174, b:174},
];

function hexToRgb(hex: string): Rgb {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    throw new Error('hexToRgb: impossible -- must mean a syntax error in color defs in palette.ts');
  }
  return {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
  };
}

const colodore = [
  "#000000","#ffffff","#813338","#75cec8",
  "#8e3c97","#56ac4d","#2e2c9b","#edf171",
  "#8e5029","#553800","#c46c71","#4a4a4a",
  "#7b7b7b","#a9ff9f","#706deb","#b2b2b2"
];

const pepto = [
  "#000000","#ffffff","#67372d","#73a3b1",
  "#6e3e83","#5b8d48","#362976","#b7c576",
  "#6c4f2a","#423908","#98675b","#444444",
  "#6c6c6c","#9dd28a","#6d5fb0","#959595"
];

const vice = [
  "#000000","#ffffff","#b96a54","#acf3fe",
  "#be73f8","#9ae35b","#695af1","#fffd84",
  "#c5913c","#8c7817","#f3ab98","#818181",
  "#b6b6b6","#dcfea3","#b1a0fc","#e0e0e0"
];

export const colorPalettes: {[k in PaletteName]: Rgb[]} = {
  'petmate': palette,
  'colodore': colodore.map(hexToRgb),
  'pepto': pepto.map(hexToRgb),
  'vice': vice.map(hexToRgb)
};
