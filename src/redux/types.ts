
import { Action } from 'redux'
import { StateWithHistory } from 'redux-undo'

interface ActionWithData<T extends string, D> extends Action<T> {
  data: D;
}

type FunctionType = (...args: any[]) => any;
export type ActionCreatorsMap = { [actionCreator: string]: FunctionType };
export type ActionsUnion<A extends ActionCreatorsMap> = ReturnType<A[keyof A]>;

type MapReturnToVoid<T> =
  T extends (...args: infer U) => any ? (...args: U) => void : T;

export type DispatchPropsFromActions<T> = {
   [P in keyof T]: MapReturnToVoid<T[P]>;
}

export function createAction<T extends string>(type: T): Action<T>
export function createAction<T extends string, D>(type: T, data: D): ActionWithData<T, D>
export function createAction<T extends string, D>(type: T, data?: D) {
  return data === undefined ? { type } : { type, data };
}

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

/////////////////////////////////////////////////////
export interface FbAction<T> extends Action {
  framebufIndex: number;
  undoId: number | undefined;
  data: T;
}

export type ExportOptions = any; // TODO ts
export type SettingsJson = any;
