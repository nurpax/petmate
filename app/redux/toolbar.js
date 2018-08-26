
import { bindActionCreators } from 'redux'

import { settable, reduxSettables } from './settable'
import { Framebuffer } from './editor'
import * as Screens from './screens'

import * as selectors from './selectors'
import * as utils from '../utils'
import * as brush from './brush'

export const TOOL_DRAW = 0
export const TOOL_COLORIZE = 1
export const TOOL_CHAR_DRAW = 2
export const TOOL_BRUSH = 3

const settables = reduxSettables([
  settable('Toolbar', 'textColor', 14),
  settable('Toolbar', 'selectedChar', {row: 8, col: 0}),
  settable('Toolbar', 'selectedTool', TOOL_DRAW),
  settable('Toolbar', 'brushRegion', null),
  settable('Toolbar', 'brush', null),
  settable('Toolbar', 'workspaceFilename', null),
  settable('Toolbar', 'altKey', false),
  settable('Toolbar', 'ctrlKey', false),
  settable('Toolbar', 'metaKey', false),
  settable('Toolbar', 'shiftKey', false),
  settable('Toolbar', 'showSettings', false),
  settable('Toolbar', 'showExport', {show: false}),
  settable('Toolbar', 'selectedPaletteRemap', 0),
  settable('Toolbar', 'canvasGrid', false),
  settable('Toolbar', 'shortcutsActive', true)
])

const initialBrushValue = {
  brush: null,
  brushRegion: null,
  brushTransform: {
    mirror: 0,
    rotate: 0
  }
}

export class Toolbar {
  static RESET_BRUSH = `${Toolbar.name}/RESET_BRUSH`
  static RESET_BRUSH_REGION = `${Toolbar.name}/RESET_BRUSH_REGION`
  static CAPTURE_BRUSH = `${Toolbar.name}/CAPTURE_BRUSH`
  static MIRROR_BRUSH =  `${Toolbar.name}/MIRROR_BRUSH`
  static ROTATE_BRUSH =  `${Toolbar.name}/ROTATE_BRUSH`
  static NEXT_CHARCODE = `${Toolbar.name}/NEXT_CHARCODE`
  static NEXT_COLOR = `${Toolbar.name}/NEXT_COLOR`
  static INVERT_CHAR = `${Toolbar.name}/INVERT_CHAR`
  static CLEAR_MOD_KEY_STATE = `${Toolbar.name}/CLEAR_MOD_KEY_STATE`
  static INC_UNDO_ID = `${Toolbar.name}/INC_UNDO_ID`

  static MIRROR_X = 1
  static MIRROR_Y = 2

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
        if (!state.toolbar.shortcutsActive) {
          return
        }
        const { shiftKey, metaKey, ctrlKey } = state.toolbar
        const noMods = !shiftKey && !metaKey && !ctrlKey
        const metaOrCtrl = metaKey || ctrlKey

        // No shift, meta or ctrl
        if (noMods) {
          if (key === 'Escape') {
            if (state.toolbar.selectedTool === TOOL_BRUSH) {
              dispatch(Toolbar.actions.resetBrush())
            }
            if (state.toolbar.showSettings) {
              dispatch(Toolbar.actions.setShowSettings(false))
            }
            if (state.toolbar.showExport) {
              dispatch(Toolbar.actions.setShowExport({show:false}))
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
          } else if (key === 'v') {
            dispatch(Toolbar.actions.mirrorBrush(Toolbar.MIRROR_Y))
          } else if (key === 'h') {
            dispatch(Toolbar.actions.mirrorBrush(Toolbar.MIRROR_X))
          } else if (key === 'f') {
            dispatch(Toolbar.actions.invertChar())
          } else if (key === 'r') {
            dispatch(Toolbar.actions.rotateBrush())
          } else if (key === 'q') {
            dispatch(Toolbar.actions.nextColor(-1))
          } else if (key === 'e') {
            dispatch(Toolbar.actions.nextColor(+1))
          } else if (key === 'x' || key == '1') {
            dispatch(Toolbar.actions.setSelectedTool(TOOL_DRAW))
          } else if (key === 'c' || key == '2') {
            dispatch(Toolbar.actions.setSelectedTool(TOOL_COLORIZE))
          } else if (key == '3') {
            dispatch(Toolbar.actions.setSelectedTool(TOOL_CHAR_DRAW))
          } else if (key === 'b' || key == '4') {
            dispatch(Toolbar.actions.setSelectedTool(TOOL_BRUSH))
          } else if (key === 'g') {
            dispatch((dispatch, getState) => {
              const { canvasGrid } = getState().toolbar
              dispatch(Toolbar.actions.setCanvasGrid(!canvasGrid))
            })
          }
        }

        if (key === 'Shift') {
          dispatch(Toolbar.actions.setShiftKey(true))
        } else if (key === 'Meta') {
          dispatch(Toolbar.actions.setMetaKey(true))
        } else if (key === 'Control') {
          dispatch(Toolbar.actions.setCtrlKey(true))
        } else if (key === 'Alt') {
          dispatch(Toolbar.actions.setAltKey(true))
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
        } else if (key === 'Alt') {
          dispatch(Toolbar.actions.setAltKey(false))
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

    invertChar: () => {
      return (dispatch, getState) => {
        const font = selectors.getCurrentFramebufFont(getState())
        dispatch({
          type: Toolbar.INVERT_CHAR,
          data: {
            font
          }
        })
      }
    },

    clearModKeyState: () => {
      return {
        type: Toolbar.CLEAR_MOD_KEY_STATE
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

    setScreencode: (code) => {
      return (dispatch, getState) => {
        const state = getState()
        const font = selectors.getCurrentFramebufFont(state)
        const charPos = utils.rowColFromScreencode(font, code)
        dispatch(Toolbar.actions.setSelectedChar(charPos))
      }
    },

    setCurrentColor: (color) => {
      return (dispatch, getState) => {
        const state = getState()
        dispatch(Toolbar.actions.setTextColor(color))
        if (state.toolbar.selectedTool === TOOL_BRUSH) {
          dispatch(Toolbar.actions.setSelectedTool(TOOL_DRAW))
        }
      }
    },

    setCurrentChar: (charPos) => {
      return (dispatch, getState) => {
        const state = getState()
        dispatch(Toolbar.actions.setSelectedChar(charPos))
        if (state.toolbar.selectedTool === TOOL_BRUSH ||
          state.toolbar.selectedTool === TOOL_COLORIZE) {
          dispatch(Toolbar.actions.setSelectedTool(TOOL_DRAW))
        }
      }
    },

    setCurrentScreencodeAndColor: (pix) => {
      return (dispatch, getState) => {
        const state = getState()
        dispatch(Toolbar.actions.setTextColor(pix.color))
        dispatch(Toolbar.actions.setScreencode(pix.code))
        if (state.toolbar.selectedTool === TOOL_BRUSH) {
          dispatch(Toolbar.actions.setSelectedTool(TOOL_DRAW))
        }
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
          framebuf: capfb,
          brushRegion: {
            min: { row: 0, col: 0 },
            max: { row: h-1, col: w-1 }
          }
        }
      }
    },

    mirrorBrush: (axis) => {
      return {
        type: Toolbar.MIRROR_BRUSH,
        data: {
          mirror: axis
        }
      }
    },

    rotateBrush: () => {
      return {
        type: Toolbar.ROTATE_BRUSH,
      }
    }
  }

  static reducer(state = {
      ...settables.initialValues,
      ...initialBrushValue,
      undoId: 0
    }, action) {
    switch (action.type) {
      case Toolbar.RESET_BRUSH:
        return {
          ...state,
          ...initialBrushValue
        }
      case Toolbar.CAPTURE_BRUSH:
        return {
          ...state,
          ...initialBrushValue,
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
      case Toolbar.INVERT_CHAR: {
        const { font } = action.data
        const curScreencode = utils.charScreencodeFromRowCol(font, state.selectedChar)
        const inverseRowCol = utils.rowColFromScreencode(font, brush.findInverseChar(action.data.font, curScreencode))
        return {
          ...state,
          selectedChar: inverseRowCol
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
      case Toolbar.MIRROR_BRUSH:
        return {
          ...state,
          brushTransform: {
            ...state.brushTransform,
            mirror: state.brushTransform.mirror ^ action.data.mirror
          }
        }
      case Toolbar.ROTATE_BRUSH:
        return {
          ...state,
          brushTransform: {
            ...state.brushTransform,
            rotate: (state.brushTransform.rotate + 90) % 360
          }
        }
      case Toolbar.CLEAR_MOD_KEY_STATE:
        return {
          ...state,
          altKey: false,
          ctrlKey: false,
          metaKey: false,
          shiftKey: false
        }
      default:
        return settables.reducer(state, action)
    }
  }

  static bindDispatch (dispatch) {
    return bindActionCreators(Toolbar.actions, dispatch)
  }
}
