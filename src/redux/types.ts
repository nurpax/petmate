
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


export const TOOL_DRAW = 0
export const TOOL_COLORIZE = 1
export const TOOL_CHAR_DRAW = 2
export const TOOL_BRUSH = 3
export const TOOL_TEXT = 4

export type Tool = number;

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
  showExport: { show: boolean, type?: any}; // TODO ts
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

export type ExportOptions = any; // TODO ts
export type SettingsJson = any;
