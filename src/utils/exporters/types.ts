
import { Font, Framebuf } from '../../redux/types'

// This is the basically the same as the redux Framebuf except
// that it's been amended with some extra fields with selectors
// when an export is initiated.
export interface FramebufWithFont extends Framebuf {
  font: Font;
}

export interface ExportOptions {
  currentScreenOnly: boolean;
  selectedFramebufIndex: number;
}

export interface AsmExportOptions extends ExportOptions {
  standalone: boolean;
  assembler: 'acme' | 'c64tass' | 'kickass';
}

export interface GifExportOptions extends ExportOptions {
  delayMS: string;
  animMode: 'single' | 'anim';
  loopMode: 'once' | 'loop' | 'pingpong';
}

export interface PngExportOptions extends ExportOptions {
  doublePixels: boolean;
  alphaPixel: boolean;
}
