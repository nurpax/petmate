
import { bindActionCreators } from 'redux'

import { settable, reduxSettables } from './settable'
import { Toolbar } from './toolbar'
import { makeScreenName } from './utils'
import * as fp from '../utils/fp'

export const CHARSET_UPPER = 'upper'
export const CHARSET_LOWER = 'lower'

const FB_WIDTH = 40
const FB_HEIGHT = 25

function setChar(fbState, {row, col, screencode, color}) {
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

function setBrush(framebuf, {row, col, brush}) {
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

function emptyFramebuf () {
  return Array(FB_HEIGHT).fill(Array(FB_WIDTH).fill({code: 32, color:14}))
}

export const DEFAULT_BACKGROUND_COLOR = 6
export const DEFAULT_BORDER_COLOR = 14

const settables = reduxSettables([
  settable('Framebuffer', 'backgroundColor', DEFAULT_BACKGROUND_COLOR),
  settable('Framebuffer', 'borderColor', DEFAULT_BORDER_COLOR),
  settable('Framebuffer', 'charset', CHARSET_UPPER),
  settable('Framebuffer', 'name', null)
])

export class Framebuffer {
  static SET_PIXEL = `${Framebuffer.name}/SET_PIXEL`
  static SET_BRUSH = `${Framebuffer.name}/SET_BRUSH`
  static SET_FIELDS = `${Framebuffer.name}/SET_FIELDS`
  static IMPORT_FILE = `${Framebuffer.name}/IMPORT_FILE`
  static CLEAR_CANVAS = `${Framebuffer.name}/CLEAR_CANVAS`
  static COPY_FRAMEBUF = `${Framebuffer.name}/COPY_FRAMEBUF`

  static actions = {
    ...settables.actions,
    setPixel: ({row, col, screencode, color, undoId}, framebufIndex) => {
      return {
        type: Framebuffer.SET_PIXEL,
        data: { row, col, screencode, color },
        undoId,
        framebufIndex
      }
    },
    setBrush: ({row, col, brush, undoId}, framebufIndex) => {
      return {
        type: Framebuffer.SET_BRUSH,
        data: { row, col, brush },
        undoId,
        framebufIndex
      }
    },
    importFile: (contents, framebufIndex) => {
      return {
        type: Framebuffer.IMPORT_FILE,
        data: contents,
        framebufIndex
      }
    },
    clearCanvas: (framebufIndex, undoId) => {
      return {
        type: Framebuffer.CLEAR_CANVAS,
        undoId,
        framebufIndex
      }
    },
    setFields: (fields, framebufIndex, undoId) => {
      return {
        type: Framebuffer.SET_FIELDS,
        data: fields,
        undoId,
        framebufIndex
      }
    },
    copyFramebuf: (framebuf, framebufIndex) => {
      return {
        type: Framebuffer.COPY_FRAMEBUF,
        data: framebuf,
        undoId: null,
        framebufIndex
      }
    }
  }

  static reducer(state = {
      ...settables.initialValues,
      framebuf: emptyFramebuf(),
      width: 40,
      height: 25
    }, action) {
    switch (action.type) {
      case Framebuffer.SET_PIXEL:
        return {
          ...state,
          framebuf: setChar(state, action.data)
        }
      case Framebuffer.SET_BRUSH:
        return {
          ...state,
          framebuf: setBrush(state.framebuf, action.data)
        }
      case Framebuffer.CLEAR_CANVAS:
        return {
          ...state,
          framebuf: emptyFramebuf()
        }
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
        return settables.reducer(state, action)
    }
  }

  static bindDispatch (dispatch) {
    return bindActionCreators(Framebuffer.actions, dispatch)
  }
}
