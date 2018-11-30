
import { Action } from 'redux'

export type Charset = 'upper' | 'lower';

export interface Coord2 {
  row: number;
  col: number;
};

export interface Pixel {
  code: number;
  color: number;
};

export interface Font {
  charset: Charset;
  bits: number[];
  charOrder: number[];
};

export interface Framebuf {
  readonly framebuf: Pixel[][];
  readonly width: number;
  readonly height: number;
  readonly backgroundColor: number;
  readonly borderColor: number;
  readonly charset: Charset;
  readonly name?: string;
};

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

export type RgbPalette = Rgb[];

// TODO
export type Brush = any;

export type PaletteName = 'petmate' | 'colodore' | 'pepto';

export type EditBranch = 'saved' | 'editing';

export type EditSaved<T> = {
  [k in EditBranch]: T;
};

export interface Settings {
  palettes: number[][];
  selectedColorPalette: PaletteName;
  integerScale: boolean;
};

export interface RootState {
  settings: {
    saved: Settings;
    editing: Settings;
  };
  toolbar: any; // TODO
};

/////////////////////////////////////////////////////
export interface FbAction<T> extends Action {
  framebufIndex: number;
  undoId: number | undefined;
  data: T;
}
