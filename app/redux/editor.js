
import { bindActionCreators } from 'redux'

import { Toolbar } from './toolbar'

const FB_WIDTH = 40
const FB_HEIGHT = 25

function setChar(framebuf, {row, col, screencode, color}) {
  return framebuf.map((rowPixels,idx) => {
    if (row === idx) {
      return rowPixels.map((pix, x) => {
        if (col === x) {
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

export class Framebuffer {
  static SET_PIXEL = `${Framebuffer.name}/SET_PIXEL`
  static SET_BACKGROUND_COLOR = `${Framebuffer.name}/SET_BACKGROUND_COLOR`
  static SET_BORDER_COLOR = `${Framebuffer.name}/SET_BORDER_COLOR`

  static actions = {
    setPixel: ({row, col, screencode, color, undoId}) => {
      return {
        type: Framebuffer.SET_PIXEL,
        data: { row, col, screencode, color },
        undoId
      }
    },

    setBackgroundColor: (color) => {
      return {
        type: Framebuffer.SET_BACKGROUND_COLOR,
        data: { color },
        undoId: null
      }
    },

    setBorderColor: (color) => {
      return {
        type: Framebuffer.SET_BORDER_COLOR,
        data: { color },
        undoId: null
      }
    }
  }

  static reducer(state = {
      borderColor: 14,
      backgroundColor: 6,
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
      case Framebuffer.SET_BORDER_COLOR:
        return {
          ...state,
          borderColor: action.data.color
        }
      case Framebuffer.SET_BACKGROUND_COLOR:
        return {
          ...state,
          backgroundColor: action.data.color
        }
      default:
        return state;
    }
  }

  static bindDispatch (dispatch) {
    return bindActionCreators(Framebuffer.actions, dispatch)
  }
}
