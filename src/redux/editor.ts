
import { Action, Dispatch, bindActionCreators } from 'redux'

import {
  Brush,
  Charset,
  Coord2,
  Framebuf,
  Pixel,
  DEFAULT_FB_HEIGHT,
  DEFAULT_FB_WIDTH
} from './types'

import * as fp from '../utils/fp'
import { makeScreenName } from './utils'
import { ActionsUnion, updateField } from './typeUtils'

export const CHARSET_UPPER = 'upper'
export const CHARSET_LOWER = 'lower'

export const DEFAULT_BACKGROUND_COLOR = 6
export const DEFAULT_BORDER_COLOR = 14

export interface FbActionWithData<T extends string, D> extends Action<T> {
  data: D;
  undoId: number | null;
  framebufIndex: number;
}

// Fb actions are handled specially as these actions are always tagged
// with a framebufIndex and an undoId.
export function createFbAction<T extends string>(type: T, framebufIndex: number, undoId: number|null): FbActionWithData<T, undefined>
export function createFbAction<T extends string, D>(type: T, framebufIndex: number, undoId: number|null, data: D): FbActionWithData<T, D>
export function createFbAction<T extends string, D>(type: T, framebufIndex: number, undoId: number|null, data?: D) {
  return data === undefined ?
    { type, framebufIndex, undoId } :
    { type, data, framebufIndex, undoId };
}

type SetCharParams = Coord2 & { screencode?: number, color?: number };
type SetBrushParams = Coord2 & { brush: Brush };
type ImportFileParams = any // TODO ts

const SET_PIXEL = 'Framebuffer/SET_PIXEL'
const SET_BRUSH = 'Framebuffer/SET_BRUSH'
const SET_FIELDS = 'Framebuffer/SET_FIELDS'
const IMPORT_FILE = 'Framebuffer/IMPORT_FILE'
const CLEAR_CANVAS = 'Framebuffer/CLEAR_CANVAS'
const COPY_FRAMEBUF = 'Framebuffer/COPY_FRAMEBUF'
const SHIFT_HORIZONTAL = 'Framebuffer/SHIFT_HORIZONTAL'
const SHIFT_VERTICAL = 'Framebuffer/SHIFT_VERTICAL'

const SET_BACKGROUND_COLOR = 'Framebuffer/SET_BACKGROUND_COLOR'
const SET_BORDER_COLOR = 'Framebuffer/SET_BORDER_COLOR'
const SET_CHARSET = 'Framebuffer/SET_CHARSET'
const SET_NAME = 'Framebuffer/SET_NAME'
const SET_DIMS = 'Framebuffer/SET_DIMS'

const actionCreators = {
  setPixel: (data: SetCharParams, undoId: number|null, framebufIndex: number) => createFbAction(SET_PIXEL, framebufIndex, undoId, data),
  setBrush: (data: SetBrushParams, undoId: number|null, framebufIndex: number) => createFbAction(SET_BRUSH, framebufIndex, undoId, data),
  importFile: (data: ImportFileParams, framebufIndex: number) => createFbAction(IMPORT_FILE, framebufIndex, null, data),
  clearCanvas: (framebufIndex: number) => createFbAction(CLEAR_CANVAS, framebufIndex, null),
  copyFramebuf: (data: Framebuf, framebufIndex: number) => createFbAction(COPY_FRAMEBUF, framebufIndex, null, data),
  setFields: (data: any, framebufIndex: number) => createFbAction(SET_FIELDS, framebufIndex, null, data),
  shiftHorizontal: (data: -1|1, framebufIndex: number) => createFbAction(SHIFT_HORIZONTAL, framebufIndex, null, data),
  shiftVertical: (data: -1|1, framebufIndex: number) => createFbAction(SHIFT_VERTICAL, framebufIndex, null, data),

  setBackgroundColor: (data: number, framebufIndex: number) => createFbAction(SET_BACKGROUND_COLOR, framebufIndex, null, data),
  setBorderColor: (data: number, framebufIndex: number) => createFbAction(SET_BORDER_COLOR, framebufIndex, null, data),
  setCharset: (data: Charset, framebufIndex: number) => createFbAction(SET_CHARSET, framebufIndex, null, data),
  setName: (data: string|undefined, framebufIndex: number) => createFbAction(SET_NAME, framebufIndex, null, data),

  setDims: (data: { width: number, height: number }, framebufIndex: number) => createFbAction(SET_DIMS, framebufIndex, null, data),
};

export const actions = actionCreators;

// Map action dispatch functions to something that can be used
// in React components.  This drops the last framebufIndex from the
// type as it's implicitly plugged in by the connect() merge props
// option.
type MapReturnToVoidFB<T> =
  T extends (framebufIndex: number) => any ? () => void :
  T extends (a0: infer U, framebufIndex: number) => any ? (a0: U) => void :
  T extends (a0: infer U, a1: infer V, framebufIndex: number) => any ? (a0: U, a1: V) => void :
  T extends (a0: infer U, a1: infer V, a2: infer S, framebufIndex: number) => any ? (a0: U, a1: V, a2: S) => void : T;

type DispatchPropsFromActionsFB<T> = {
  [P in keyof T]: MapReturnToVoidFB<T[P]>;
}

export type PropsFromDispatch = DispatchPropsFromActionsFB<typeof actions>;

export type Actions = ActionsUnion<typeof actionCreators>;

export class Framebuffer {

  static actions = actions;

  static reducer = fbReducer

  static bindDispatch (dispatch: Dispatch) {
    return bindActionCreators(Framebuffer.actions, dispatch)
  }
}

function setChar(fbState: Framebuf, {row, col, screencode, color}: SetCharParams): Pixel[][] {
  const { framebuf, width, height } = fbState
  if (row < 0 || row >= height ||
      col < 0 || col >= width) {
    return framebuf
  }
  return framebuf.map((pixelRow, idx) => {
    if (row === idx) {
      return pixelRow.map((pix, x) => {
        if (col === x) {
          if (screencode === undefined) {
            return { ...pix, color: color! }
          }
          if (color === undefined) {
            return { ...pix, code:screencode }
          }
          return { code:screencode, color }
        }
        return pix
      })
    }
    return pixelRow
  })
}

function setBrush(framebuf: Pixel[][], {row, col, brush}: SetBrushParams): Pixel[][] {
  const { min, max } = brush.brushRegion
  return framebuf.map((pixelRow, y) => {
    const yo = y - row
    if (yo >= min.row && yo <= max.row) {
      return pixelRow.map((pix, x) => {
        const xo = x - col
        if (xo  >= min.col && xo <= max.col) {
          const bpix = brush.framebuf[yo - min.row][xo - min.col]
          return {
            code: bpix.code,
            color: bpix.color
          }
        }
        return pix
      })
    }
    return pixelRow
  })
}

function rotateArr<T>(arr: T[], dir: -1 | 1) {
  if (dir == -1) {
    return [...arr.slice(1, arr.length), arr[0]];
  }
  return [arr[arr.length-1], ...arr.slice(0, arr.length-1)];

}

function shiftHorizontal(framebuf: Pixel[][], dir: -1 | 1) {
  return framebuf.map((row) => rotateArr(row, dir))
}

function shiftVertical(framebuf: Pixel[][], dir: -1 | 1) {
  return rotateArr(framebuf, dir);
}

function emptyFramebuf(width: number, height: number): Pixel[][] {
  return Array(height).fill(Array(width).fill({code: 32, color:14}))
}

function mapPixels(fb: Framebuf, mapFn: (fb: Framebuf) => Pixel[][]) {
  return {
    ...fb,
    framebuf: mapFn(fb)
  }
}

export function fbReducer(state: Framebuf = {
  framebuf: emptyFramebuf(DEFAULT_FB_WIDTH, DEFAULT_FB_HEIGHT),
  width: DEFAULT_FB_WIDTH,
  height: DEFAULT_FB_HEIGHT,
  backgroundColor: DEFAULT_BACKGROUND_COLOR,
  borderColor: DEFAULT_BORDER_COLOR,
  charset: CHARSET_UPPER,
  name: undefined
}, action: Actions): Framebuf {
  switch (action.type) {
    case SET_PIXEL:
      return mapPixels(state, fb => setChar(fb, action.data));
    case SET_BRUSH:
      return mapPixels(state, fb => setBrush(fb.framebuf, action.data));
    case CLEAR_CANVAS:
      return mapPixels(state, _fb => emptyFramebuf(state.width, state.height));
    case SHIFT_HORIZONTAL:
      return mapPixels(state, fb => shiftHorizontal(fb.framebuf, action.data));
    case SHIFT_VERTICAL:
      return mapPixels(state, fb => shiftVertical(fb.framebuf, action.data));
    case SET_FIELDS:
      return {
        ...state,
        ...action.data
      }
    case COPY_FRAMEBUF:
      return {
        ...state,
        ...action.data
      }
    case IMPORT_FILE:
      const c = action.data
      const name = fp.maybeDefault(c.name, makeScreenName(action.framebufIndex))
      return {
        framebuf: c.framebuf,
        width: c.width,
        height: c.height,
        backgroundColor: c.backgroundColor,
        borderColor: c.borderColor,
        charset: c.charset,
        name
      }
    case SET_BACKGROUND_COLOR:
      return updateField(state, 'backgroundColor', action.data);
    case SET_BORDER_COLOR:
      return updateField(state, 'borderColor', action.data);
    case SET_CHARSET:
      return updateField(state, 'charset', action.data);
    case SET_NAME:
      return updateField(state, 'name', action.data);
    case SET_DIMS: {
        const { width, height } = action.data;
        return {
          ...state,
          width: action.data.width,
          height: action.data.height,
          framebuf: emptyFramebuf(width, height)
        }
      }
    default:
      return state;
  }
}
