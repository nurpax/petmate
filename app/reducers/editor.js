
import { SELECT_CHAR, SET_FRAMEBUF_CHAR } from '../actions/editor';

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

export default function editor(state = {
  framebuf: Array(FB_HEIGHT).fill(Array(FB_WIDTH).fill(32)),
  selected: {
    row: 0,
    col: 0
  }
}, action) {
  switch (action.type) {
    case SELECT_CHAR:
      return {
        ...state,
        selected: {
          row: action.data.row,
          col: action.data.col,
        }
      }
    case SET_FRAMEBUF_CHAR:
      return {
        ...state,
        framebuf: setChar(state.framebuf, action.data)
      }
    default:
      return state;
  }
}
