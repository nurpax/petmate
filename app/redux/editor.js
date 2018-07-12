
import { bindActionCreators } from 'redux'

import { settable, reduxSettables } from './settable'
import { Toolbar } from './toolbar'

const FB_WIDTH = 40
const FB_HEIGHT = 25

function setChar(framebuf, {row, col, screencode, color}) {
  return framebuf.map((rowPixels,idx) => {
    if (row === idx) {
      return rowPixels.map((pix, x) => {
        if (col === x) {
          if (screencode === undefined) {
            return { ...pix, color }
          }
          return { code:screencode, color }
        }
        return pix
      })
    }
    return rowPixels
  })
}

function emptyFramebuf () {
  return Array(FB_HEIGHT).fill(Array(FB_WIDTH).fill({code: 32, color:14}))
}

const settables = reduxSettables([
  settable('Framebuffer', 'backgroundColor', 6),
  settable('Framebuffer', 'borderColor', 14)
])

export class Framebuffer {
  static SET_PIXEL = `${Framebuffer.name}/SET_PIXEL`

  static actions = {
    ...settables.actions,
    setPixel: ({row, col, screencode, color, undoId}) => {
      return {
        type: Framebuffer.SET_PIXEL,
        data: { row, col, screencode, color },
        undoId
      }
    }
  }

  static reducer(state = {
      ...settables.initialValues,
      framebuf: emptyFramebuf()
    }, action) {
    switch (action.type) {
      case Framebuffer.SET_PIXEL:
        return {
          ...state,
          framebuf: setChar(state.framebuf, action.data)
        }
      case Toolbar.CLEAR_CANVAS:
        return {
          ...state,
          framebuf: emptyFramebuf()
        }
      default:
        return settables.reducer(state, action)
    }
  }

  static bindDispatch (dispatch) {
    return bindActionCreators(Framebuffer.actions, dispatch)
  }
}
