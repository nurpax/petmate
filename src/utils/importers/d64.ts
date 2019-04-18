
import { fs } from '../electronImports';
import * as c1541 from 'c1541';
import { framebufFromJson } from '../../redux/workspace';
import { DEFAULT_BACKGROUND_COLOR, DEFAULT_BORDER_COLOR } from '../../redux/editor';
import { Pixel } from '../../redux/types';

export function loadD64Framebuf(filename: string) {
  try {
    const d64 = fs.readFileSync(filename)
    const dirEntries = c1541.readDirectory(d64);
    return framebufFromJson({
      width: 16,
      height: dirEntries.length,
      backgroundColor: DEFAULT_BACKGROUND_COLOR,
      borderColor: DEFAULT_BORDER_COLOR,
      framebuf: dirEntries.map((de) => {
        const pixels: Pixel[] = [];
        de.screencodeName.forEach(code => {
          pixels.push({ code, color: DEFAULT_BORDER_COLOR });
        });
        return pixels;
      })
    })
  } catch(e) {
    alert(`Failed to load file '${filename}'!`)
    console.error(e)
    return undefined;
  }
}
