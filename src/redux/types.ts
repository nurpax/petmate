
import { Action } from 'redux'

interface ActionWithData<T extends string, D> extends Action<T> {
  data: D;
}

export type FunctionType = (...args: any[]) => any;
export type ActionCreatorsMap = { [actionCreator: string]: FunctionType };
export type ActionsUnion<A extends ActionCreatorsMap> = ReturnType<A[keyof A]>;

export type MapReturnToVoid<T> =
  T extends (...args: infer U) => any ? (...args: U) => void : T;

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
