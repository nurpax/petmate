
import { bindActionCreators } from 'redux'

import { Toolbar } from './toolbar'

const FB_WIDTH = 40
const FB_HEIGHT = 25

function setChar(framebuf, {row, col, screencode}) {
  return framebuf.map((rowPixels,idx) => {
    if (row === idx) {
      return rowPixels.map((pix, x) => {
        if (col === x) {
          return screencode
        }
        return pix
      })
    }
    return rowPixels
  })
}

function emptyFramebuf () {
  return Array(FB_HEIGHT).fill(Array(FB_WIDTH).fill(32))
}

export class Framebuffer {
  static SET_PIXEL = `${Framebuffer.name}/SET_PIXEL`

  static actions = {
    setPixel: ({row, col, screencode, undoId}) => {
      return {
        type: Framebuffer.SET_PIXEL,
        data: { row, col, screencode },
        undoId
      }
    }
  }

  static reducer(state = {
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
        return state;
    }
  }

  static bindDispatch (dispatch) {
    return bindActionCreators(Framebuffer.actions, dispatch)
  }
}
