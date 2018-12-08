
import { StateWithHistory } from 'redux-undo'
import { Action } from 'redux'
import { ThunkAction } from 'redux-thunk'

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

export interface FileFormat {
  name: string;
  ext: string;
  exportOptions: boolean;
}

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

export type Angle360 = 0 | 90 | 180 | 270;

export interface Transform {
  mirror: number; // TODO ts
  rotate: Angle360;
}

export interface BrushRegion {
  min: Coord2;
  max: Coord2;
}

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

export interface Screens {
  current: number;
  list: number[];
};

export type UndoableFramebuf = StateWithHistory<Framebuf>;

export interface RootState {
  settings: {
    saved: Settings;
    editing: Settings;
  };
  toolbar: any; // TODO
  screens: Screens;
  framebufList: UndoableFramebuf[];
};

export type RootStateThunk = ThunkAction<void, RootState, undefined, Action>;

export type ExportOptions = any; // TODO ts
export type SettingsJson = any;
