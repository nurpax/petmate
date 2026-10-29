
import { fs } from '../electronImports'
import { FramebufWithFont, FileFormatPet, Pixel } from  '../../redux/types';

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

export function savePET(filename: string, fbs: FramebufWithFont[], fmt: FileFormatPet): void {
  try {
    const fb = fbs[fmt.commonExportParams.selectedFramebufIndex]
    let bytes:number[] = []

    bytes.push(fb.width)
    bytes.push(fb.height)
    bytes.push(fb.borderColor)
    bytes.push(fb.backgroundColor)
    bytes.push(fb.charset === 'lower' ? 0 : 1)
    Array.prototype.push.apply(bytes, flatten2d(fb.framebuf, 'code'))
    Array.prototype.push.apply(bytes, flatten2d(fb.framebuf, 'color'))

    fs.writeFileSync(filename, Buffer.from(bytes), null);
  } catch(e) {
    alert(`Failed to save file '${filename}'!`)
    console.error(e)
  }
}

// Commodore PET screen RAM dump as a .prg: a $8000 load address followed
// by the screencodes, so LOAD"NAME",8,1 puts the picture on screen.  A
// 40-column PET screen is 1000 bytes, 80-column 2000 bytes.
const PET_SCREEN_RAM = 0x8000;

export function savePetPrg(filename: string, fb: FramebufWithFont): void {
  try {
    const bytes = [PET_SCREEN_RAM & 0xff, PET_SCREEN_RAM >> 8];
    Array.prototype.push.apply(bytes, flatten2d(fb.framebuf, 'code'));
    fs.writeFileSync(filename, Buffer.from(bytes), null);
  } catch(e) {
    alert(`Failed to save file '${filename}'!`)
    console.error(e)
  }
}
