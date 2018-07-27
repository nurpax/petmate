
import { bindActionCreators } from 'redux'

import { settable, reduxSettables } from './settable'
import { Framebuffer } from './editor'
import * as Screens from './screens'

import * as selectors from './selectors'
import * as utils from '../utils'

export const TOOL_DRAW = 0
export const TOOL_COLORIZE = 1
export const TOOL_BRUSH = 2

const settables = reduxSettables([
  settable('Toolbar', 'textColor', 14),
  settable('Toolbar', 'selectedChar', {row: 0, col: 0}),
  settable('Toolbar', 'selectedTool', TOOL_DRAW),
  settable('Toolbar', 'brushRegion', null),
  settable('Toolbar', 'brush', null),
  settable('Toolbar', 'workspaceFilename', null)
])

export class Toolbar {
  static RESET_BRUSH = `${Toolbar.name}/RESET_BRUSH`
  static RESET_BRUSH_REGION = `${Toolbar.name}/RESET_BRUSH_REGION`
  static CAPTURE_BRUSH = `${Toolbar.name}/CAPTURE_BRUSH`
  static INC_UNDO_ID = `${Toolbar.name}/INC_UNDO_ID`

  static actions = {
    ...settables.actions,
    incUndoId: () => {
      return {
        type: Toolbar.INC_UNDO_ID
      }
    },

    keyDown: (key) => {
      return (dispatch, getState) => {
        const state = getState()
        if (key === 'Escape') {
          if (state.toolbar.selectedTool === TOOL_BRUSH) {
            dispatch(Toolbar.actions.resetBrush())
          }
        } else if (key === 'ArrowLeft') {
          dispatch(Screens.actions.nextScreen(-1))
        } else if (key === 'ArrowRight') {
          dispatch(Screens.actions.nextScreen(+1))
        }
      }
    },

    clearCanvas: () => {
      return (dispatch, getState) => {
        const state = getState()
        const framebufIndex = selectors.getCurrentScreenFramebufIndex(state)
        const undoId = state.undoId
        dispatch(Framebuffer.actions.clearCanvas(framebufIndex, undoId))
      }
    },

    resetBrush: () => {
      return {
        type: Toolbar.RESET_BRUSH
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
      case Toolbar.RESET_BRUSH:
        return {
          ...state,
          brush: null,
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
      default:
        return settables.reducer(state, action)
    }
  }

  static bindDispatch (dispatch) {
    return bindActionCreators(Toolbar.actions, dispatch)
  }
}
