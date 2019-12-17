
import { fs } from '../electronImports'
import { FramebufWithFont, FileFormatJson, Pixel } from  '../../redux/types';
import { CustomFonts } from  '../../redux/customFonts';

function flatten2d(arr: Pixel[][], field: 'code' | 'color'): number[] {
  const res = [];
  for (let y = 0; y < arr.length; y++) {
    const row = arr[y];
    for (let x = 0; x < row.length; x++) {
      res.push(row[x][field]);
    }
  }
  return res;
}

function convertFb(fb: FramebufWithFont) {
  return {
    width: fb.width,
    height: fb.height,
    backgroundColor: fb.backgroundColor,
    borderColor: fb.borderColor,
    charset: fb.charset ? fb.charset : 'upper',
    name: fb.name ? fb.name : undefined,
    screencodes: flatten2d(fb.framebuf, 'code'),
    colors: flatten2d(fb.framebuf, 'color')
  }
}

export function saveJSON(filename: string, fbs: FramebufWithFont[], customFonts: CustomFonts, fmt: FileFormatJson): void {
  try {
    const selectedFb = fbs[fmt.commonExportParams.selectedFramebufIndex]
    const fbarr = fmt.exportOptions.currentScreenOnly ? [selectedFb] : fbs;

    //---------------------------------------------------------------
    // Figure out what custom fonts were used and transform to export
    // JSON format.
    const usedFonts = new Set<string>();
    for (let fb of fbarr) {
      if (fb.charset !== 'upper' && fb.charset !== 'lower') {
        usedFonts.add(fb.charset);
      }
    }
    const customFontData: {[charset: string]: { name: string, bits: number[] }} = {};
    for (let charset of usedFonts) {
      customFontData[charset] = {
        name: customFonts[charset].name,
        bits: customFonts[charset].font.bits
      }
    }

    //---------------------------------------------------------------
    // Convert to JSNO and save out
    const json = {
      version: 1,
      framebufs: fbarr.map(convertFb),
      charsets: customFontData
    };

    fs.writeFileSync(filename, JSON.stringify(json));
  } catch(e) {
    alert(`Failed to save file '${filename}'!`)
    console.error(e)
  }
}
