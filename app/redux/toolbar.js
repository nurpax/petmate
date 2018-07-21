
import { bindActionCreators } from 'redux'

import { settable, reduxSettables} from './settable'

import * as utils from '../utils'

export const TOOL_DRAW = 0
export const TOOL_COLORIZE = 1
export const TOOL_BRUSH = 2

const settables = reduxSettables([
  settable('Toolbar', 'framebufIndex', 0),
  settable('Toolbar', 'textColor', 14),
  settable('Toolbar', 'selectedChar', {row: 0, col: 0}),
  settable('Toolbar', 'selectedTool', TOOL_DRAW),
  settable('Toolbar', 'brushRegion', null),
  settable('Toolbar', 'brush', null)
])

export class Toolbar {
  static CLEAR_CANVAS = `${Toolbar.name}/CLEAR_CANVAS`
  static CAPTURE_BRUSH = `${Toolbar.name}/CAPTURE_BRUSH`
  static INC_UNDO_ID = `${Toolbar.name}/INC_UNDO_ID`

  static actions = {
    ...settables.actions,
    incUndoId: () => {
      return {
        type: Toolbar.INC_UNDO_ID
      }
    },
    clearCanvas: () => {
      return {
        type: Toolbar.CLEAR_CANVAS,
        data: {}
      }
    },
    captureBrush: (framebuf, brushRegion) => {
      const { min, max } = utils.sortRegion(brushRegion)
      const h = max.row - min.row + 1
      const w = max.col - min.col + 1
      const capfb = Array(h)
      for (var y = 0; y < h; y++) {
        capfb[y] = framebuf[y + min.row].slice(min.col, max.col+1)
      }
      return {
        type: Toolbar.CAPTURE_BRUSH,
        data: {
          framebuf:capfb,
          brushRegion: {
            min: {row: 0, col: 0},
            max: {row: h-1, col: w-1}
          }
        }
      }
    }
  }

  static reducer(state = {
      ...settables.initialValues,
      undoId: 0
    }, action) {
    switch (action.type) {
      case Toolbar.CLEAR_CANVAS:
        return {
          ...state,
          brushRegion: null
        }
      case Toolbar.CAPTURE_BRUSH:
        return {
          ...state,
          brushRegion: null,
          brush: action.data
        }
      case Toolbar.INC_UNDO_ID:
        return {
          ...state,
          undoId: state.undoId+1
        }
      // CLEAR_CANVAS is routed to the framebuf reducer
      default:
        return settables.reducer(state, action)
    }
  }

  static bindDispatch (dispatch) {
    return bindActionCreators(Toolbar.actions, dispatch)
  }
}
