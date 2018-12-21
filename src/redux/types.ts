
import { StateWithHistory } from 'redux-undo'
import { Action } from 'redux'
import { ThunkAction } from 'redux-thunk'
import { FileFormat } from './typesExport';

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

// This is the basically the same as the redux Framebuf except
// that it's been amended with some extra fields with selectors
// when an export is initiated.
export interface FramebufWithFont extends Framebuf {
  font: Font;
}

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

export type PaletteName = 'petmate' | 'colodore' | 'pepto' | 'vice';

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


export enum Tool {
  Draw = 0,
  Colorize = 1,
  CharDraw = 2,
  Brush = 3,
  Text = 4
};

export interface Toolbar {
  brush: Brush | null;
  brushRegion: BrushRegion | null;
  brushTransform: Transform;
  selectedChar: Coord2;
  charTransform: Transform;
  undoId: number;
  textColor: number;
  textCursorPos: Coord2|null;
  selectedTool: Tool;
  workspaceFilename: string|null;
  altKey: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
  shiftKey: boolean;
  showSettings: boolean;
  showExport: { show: boolean, fmt?: FileFormat}; // fmt undefined only when show=false
  showImport: { show: boolean, fmt?: FileFormat}; // fmt undefined only when show=false
  selectedPaletteRemap: number;
  canvasGrid: boolean;
  shortcutsActive: boolean;
}

export type UndoableFramebuf = StateWithHistory<Framebuf>;

export interface RootState {
  settings: {
    saved: Settings;
    editing: Settings;
  };
  toolbar: Toolbar; // TODO
  screens: Screens;
  framebufList: UndoableFramebuf[];
};

export type RootStateThunk = ThunkAction<void, RootState, undefined, Action>;

export type SettingsJson = any;

export * from './typesExport'
