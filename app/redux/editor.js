
import { bindActionCreators } from 'redux'

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

export class Framebuffer {
  static SET_PIXEL = `${Framebuffer.name}/SET_PIXEL`

  static actions = {
    setPixel: ({row, col, screencode}) => {
      return {
        type: Framebuffer.SET_PIXEL,
        data: { row, col, screencode }
      }
    }
  }

  static reducer(state = {
      framebuf: Array(FB_HEIGHT).fill(Array(FB_WIDTH).fill(32))
    }, action) {
    switch (action.type) {
      case Framebuffer.SET_PIXEL:
        return {
          ...state,
          framebuf: setChar(state.framebuf, action.data)
        }
      default:
        return state;
    }
  }

  static bindDispatch (dispatch) {
    return bindActionCreators(Framebuffer.actions, dispatch)
  }
}
