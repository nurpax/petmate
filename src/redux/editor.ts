
import { bindActionCreators } from 'redux'

import {
  Brush,
  Coord2,
  Framebuf,
  Pixel,
  FbAction
} from './types'

import { settable, reduxSettables } from './settable'
import * as fp from '../utils/fp'
import { makeScreenName } from './utils'

export const CHARSET_UPPER = 'upper'
export const CHARSET_LOWER = 'lower'

export const DEFAULT_BACKGROUND_COLOR = 6
export const DEFAULT_BORDER_COLOR = 14

const settables = reduxSettables([
  settable('Framebuffer', 'backgroundColor', DEFAULT_BACKGROUND_COLOR),
  settable('Framebuffer', 'borderColor', DEFAULT_BORDER_COLOR),
  settable('Framebuffer', 'charset', CHARSET_UPPER),
  settable('Framebuffer', 'name', null)
])

function mkActionCreator0(type: string) {
  return (framebufIndex: number) => {
    return {
      type,
      undoId: null,
      framebufIndex: framebufIndex
    }
  }
}

function mkActionCreator(type: string) {
  return (args: any, framebufIndex: number) => {
    const { undoId = null, ...rest } = args;
    return {
      type,
      data: rest,
      undoId,
      framebufIndex: framebufIndex
    }
  }
}

export class Framebuffer {
  static SET_PIXEL = 'Framebuffer/SET_PIXEL'
  static SET_BRUSH = 'Framebuffer/SET_BRUSH'
  static SET_FIELDS = 'Framebuffer/SET_FIELDS'
  static IMPORT_FILE = 'Framebuffer/IMPORT_FILE'
  static CLEAR_CANVAS = 'Framebuffer/CLEAR_CANVAS'
  static COPY_FRAMEBUF = 'Framebuffer/COPY_FRAMEBUF'
  static SHIFT_HORIZONTAL = 'Framebuffer/SHIFT_HORIZONTAL'
  static SHIFT_VERTICAL = 'Framebuffer/SHIFT_VERTICAL'

  static actions = {
    ...settables.actions,
    setPixel:        mkActionCreator(Framebuffer.SET_PIXEL),
    setBrush:        mkActionCreator(Framebuffer.SET_BRUSH),
    importFile:      mkActionCreator(Framebuffer.IMPORT_FILE),
    clearCanvas:     mkActionCreator0(Framebuffer.CLEAR_CANVAS),
    copyFramebuf:    mkActionCreator(Framebuffer.COPY_FRAMEBUF),
    setFields:       mkActionCreator(Framebuffer.SET_FIELDS),
    shiftHorizontal: mkActionCreator(Framebuffer.SHIFT_HORIZONTAL),
    shiftVertical:   mkActionCreator(Framebuffer.SHIFT_VERTICAL)
  }

  static reducer = fbReducer

  static bindDispatch (dispatch: any) {
    return bindActionCreators(Framebuffer.actions, dispatch)
  }
}

const FB_WIDTH = 40;
const FB_HEIGHT = 25;

type SetCharParams = Coord2 & { screencode: number, color: number };

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
            return { ...pix, color }
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

type SetBrushParams = Coord2 & { brush: Brush };

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

function emptyFramebuf(): Pixel[][] {
  return Array(FB_HEIGHT).fill(Array(FB_WIDTH).fill({code: 32, color:14}))
}

function mapPixels(fb: Framebuf, mapFn: (fb: Framebuf) => Pixel[][]) {
  return {
    ...fb,
    framebuf: mapFn(fb)
  }
}

export const fieldSetters = [
  {
    name: 'backgroundColor',
    type: 'Framebuffer/SET_BACKGROUNDCOLOR'
  },
  {
    name: 'borderColor',
    type: 'Framebuffer/SET_BORDERCOLOR'
  },
  {
    name: 'charset',
    type: 'Framebuffer/SET_CHARSET'
  },
  {
    name: 'name', type: 'Framebuffer/SET_NAME'
  },
]

export function fbReducer(state: Framebuf = {
  framebuf: emptyFramebuf(),
  width: 40,
  height: 25,
  backgroundColor: DEFAULT_BACKGROUND_COLOR,
  borderColor: DEFAULT_BORDER_COLOR,
  charset: 'upper',
  name: undefined
}, action: FbAction<any>): Framebuf {
  switch (action.type) {
    case Framebuffer.SET_PIXEL:
      return mapPixels(state, fb => setChar(fb, action.data));
    case Framebuffer.SET_BRUSH:
      return mapPixels(state, fb => setBrush(fb.framebuf, action.data));
    case Framebuffer.CLEAR_CANVAS:
      return mapPixels(state, _fb => emptyFramebuf());
    case Framebuffer.SHIFT_HORIZONTAL:
      return mapPixels(state, fb => shiftHorizontal(fb.framebuf, action.data));
    case Framebuffer.SHIFT_VERTICAL:
      return mapPixels(state, fb => shiftVertical(fb.framebuf, action.data));
    case Framebuffer.SET_FIELDS:
      return {
        ...state,
        ...action.data
      }
    case Framebuffer.COPY_FRAMEBUF:
      return {
        ...state,
        ...action.data
      }
    case Framebuffer.IMPORT_FILE:
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
    default:
      return fieldSetters.reduce((acc, cur) => {
        if (cur.type === action.type) {
          return {
            ...state,
            [cur.name]: action.data
          }
        }
        return acc;
      }, state);
  }
}
