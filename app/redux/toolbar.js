
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
  settable('Toolbar', 'workspaceFilename', null),
  settable('Toolbar', 'shiftKey', false),
  settable('Toolbar', 'metaKey', false),
  settable('Toolbar', 'ctrlKey', false),
  settable('Toolbar', 'showSettings', false),
  settable('Toolbar', 'selectedPaletteRemap', 0),
])

export class Toolbar {
  static RESET_BRUSH = `${Toolbar.name}/RESET_BRUSH`
  static RESET_BRUSH_REGION = `${Toolbar.name}/RESET_BRUSH_REGION`
  static CAPTURE_BRUSH = `${Toolbar.name}/CAPTURE_BRUSH`
  static NEXT_CHARCODE = `${Toolbar.name}/NEXT_CHARCODE`
  static NEXT_COLOR = `${Toolbar.name}/NEXT_COLOR`
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
        const { shiftKey, metaKey, ctrlKey } = state.toolbar
        const noMods = !shiftKey && !metaKey && !ctrlKey
        const metaOrCtrl = metaKey || ctrlKey

        // No shift, meta or ctrl
        if (noMods) {
          if (key === 'Escape') {
            if (state.toolbar.selectedTool === TOOL_BRUSH) {
              dispatch(Toolbar.actions.resetBrush())
            }
          } else if (noMods && key === 'ArrowLeft') {
            dispatch(Screens.actions.nextScreen(-1))
          } else if (noMods && key === 'ArrowRight') {
            dispatch(Screens.actions.nextScreen(+1))
          } else if (key === 'a') {
            dispatch(Toolbar.actions.nextCharcode({ row: 0, col: -1}))
          } else if (key === 'd') {
            dispatch(Toolbar.actions.nextCharcode({ row: 0, col: +1}))
          } else if (key === 's') {
            dispatch(Toolbar.actions.nextCharcode({ row: +1, col: 0}))
          } else if (key === 'w') {
            dispatch(Toolbar.actions.nextCharcode({ row: -1, col: 0}))
          }
        }

        // Meta only
        if (metaOrCtrl) {
          if (key === 'ArrowLeft') {
            dispatch(Toolbar.actions.nextColor(-1))
          } else if (key === 'ArrowRight') {
            dispatch(Toolbar.actions.nextColor(+1))
          }
        }

        if (key === 'Shift') {
          dispatch(Toolbar.actions.setShiftKey(true))
        } else if (key === 'Meta') {
          dispatch(Toolbar.actions.setMetaKey(true))
        } else if (key === 'Control') {
          dispatch(Toolbar.actions.setCtrlKey(true))
        }

        if (metaOrCtrl) {
          switch(key) {
            case '1':
              dispatch(Toolbar.actions.setSelectedPaletteRemap(0))
              break
            case '2':
              dispatch(Toolbar.actions.setSelectedPaletteRemap(1))
              break
            case '3':
              dispatch(Toolbar.actions.setSelectedPaletteRemap(2))
              break
            case '4':
              dispatch(Toolbar.actions.setSelectedPaletteRemap(3))
              break
          }
        }
      }
    },

    keyUp: (key) => {
      return (dispatch, getState) => {
        const state = getState()
        if (key === 'Shift') {
          dispatch(Toolbar.actions.setShiftKey(false))
        } else if (key === 'Meta') {
          dispatch(Toolbar.actions.setMetaKey(false))
        } else if (key === 'Control') {
          dispatch(Toolbar.actions.setCtrlKey(false))
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

    nextCharcode: (dir) => {
      return {
        type: Toolbar.NEXT_CHARCODE,
        data: dir
      }
    },

    nextColor: (dir) => {
      return (dispatch, getState) => {
        const state = getState()
        dispatch({
          type: Toolbar.NEXT_COLOR,
          data: dir,
          paletteRemap: selectors.getSettingsPaletteRemap(state)
        })
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
      case Toolbar.NEXT_CHARCODE:
        const dir = action.data
        return {
          ...state,
          selectedChar: {
            row: Math.max(0, Math.min(15, state.selectedChar.row + dir.row)),
            col: Math.max(0, Math.min(15, state.selectedChar.col + dir.col)),
          }
        }
      case Toolbar.NEXT_COLOR: {
          const remap = action.paletteRemap
          const idx = remap.indexOf(state.textColor)
          const dir = action.data
          const nextIdx = Math.max(0, Math.min(15, idx + dir))
          return {
            ...state,
            textColor: remap[nextIdx]
          }
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
