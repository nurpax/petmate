
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
export const TOOL_TEXT = 4

const emptyTransform = {
  mirror: 0,
  rotate: 0
}


function rotate(transform) {
  return {
    ...transform,
    rotate: (transform.rotate + 90) % 360
  }
}

function mirror(transform, mirror) {
  return {
    ...transform,
    mirror: transform.mirror ^ mirror
  }
}

const settables = reduxSettables([
  settable('Toolbar', 'textColor', 14),
  settable('Toolbar', 'textCursorPos', null),
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
  brushTransform: emptyTransform
}

function moveTextCursor(curPos, dir, width, height) {
  const idx = (curPos.row + dir.row)*width + (curPos.col + dir.col) + width*height
  const wrapped = idx % (width*height)
  return {
    row: Math.floor(wrapped / width),
    col: Math.floor(wrapped % width)
  }
}

function asc2int(asc) {
  return asc.charCodeAt(0)
}

function convertAsciiToScreencode(asc) {
  if (asc.length !== 1) {
    return null
  }
  if (asc >= 'a' && asc <= 'z') {
    return asc2int(asc) - asc2int('a') + 1
  }
  if (asc >= 'A' && asc <= 'Z') {
    return asc2int(asc) - asc2int('A') + 0x41
  }
  if (asc >= '0' && asc <= '9') {
    return asc2int(asc) - asc2int('0') + 0x30
  }
  const otherChars = {
    '@': 0,
    ' ': 0x20,
    '!': 0x21,
    '"': 0x22,
    '#': 0x23,
    '$': 0x24,
    '%': 0x25,
    '&': 0x26,
    '(': 0x28,
    ')': 0x29,
    '*': 0x2a,
    '+': 0x2b,
    ',': 0x2c,
    '-': 0x2d,
    '.': 0x2e,
    '/': 0x2f,
    ':': 0x3a,
    ';': 0x3b,
    '<': 0x3c,
    '=': 0x3d,
    '>': 0x3e,
    '?': 0x3f
  }
  if (asc in otherChars) {
    return otherChars[asc]
  }
  return null
}

export class Toolbar {
  static SET_SELECTED_CHAR = `${Toolbar.name}/SET_SELECTED_CHAR`
  static RESET_BRUSH = `${Toolbar.name}/RESET_BRUSH`
  static RESET_BRUSH_REGION = `${Toolbar.name}/RESET_BRUSH_REGION`
  static CAPTURE_BRUSH = `${Toolbar.name}/CAPTURE_BRUSH`
  static MIRROR_BRUSH = `${Toolbar.name}/MIRROR_BRUSH`
  static ROTATE_BRUSH = `${Toolbar.name}/ROTATE_BRUSH`
  static MIRROR_CHAR = `${Toolbar.name}/MIRROR_CHAR`
  static ROTATE_CHAR = `${Toolbar.name}/ROTATE_CHAR`
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

    keyDown: (k) => {
      // Lower-case single keys in case the caps-lock is on.
      // Doing this for single char keys only to keep the other
      // keys (like 'ArrowLeft') in their original values.
      const key = k.length == 1 ? k.toLowerCase() : k;
      return (dispatch, getState) => {
        const state = getState()
        if (!state.toolbar.shortcutsActive) {
          return
        }
        const {
          shiftKey,
          metaKey,
          ctrlKey,
          selectedTool,
          showSettings,
          showExport
        } = state.toolbar
        const noMods = !shiftKey && !metaKey && !ctrlKey
        const metaOrCtrl = metaKey || ctrlKey

        const inModal =
          state.toolbar.showExport.show ||
          state.toolbar.showSettings

        if (inModal) {
          return
        }

        let inTextInput = selectedTool === TOOL_TEXT && state.toolbar.textCursorPos !== null
        // These shortcuts should work regardless of what drawing tool is selected.
        if (noMods) {
          if (!inTextInput) {
            if (key === 'ArrowLeft') {
              dispatch(Screens.actions.nextScreen(-1))
              return
            } else if (key === 'ArrowRight') {
              dispatch(Screens.actions.nextScreen(+1))
              return
            } else if (key === 'q') {
              dispatch(Toolbar.actions.nextColor(-1))
              return
            } else if (key === 'e') {
              dispatch(Toolbar.actions.nextColor(+1))
              return
            } else if (key === 'x' || key === '1') {
              dispatch(Toolbar.actions.setSelectedTool(TOOL_DRAW))
              return
            } else if (key === 'c' || key === '2') {
              dispatch(Toolbar.actions.setSelectedTool(TOOL_COLORIZE))
              return
            } else if (key === '3') {
              dispatch(Toolbar.actions.setSelectedTool(TOOL_CHAR_DRAW))
              return
            } else if (key === 'b' || key === '4') {
              dispatch(Toolbar.actions.setSelectedTool(TOOL_BRUSH))
              return
            } else if (key === 't' || key === '5') {
              dispatch(Toolbar.actions.setSelectedTool(TOOL_TEXT))
              return
            } else if (key === 'g') {
              return dispatch((dispatch, getState) => {
                const { canvasGrid } = getState().toolbar
                dispatch(Toolbar.actions.setCanvasGrid(!canvasGrid))
              })
            }
          }
          // These shouldn't early exit this function since we check for other
          // conditions for Esc later.
          if (key === 'Escape') {
            if (showSettings) {
              dispatch(Toolbar.actions.setShowSettings(false))
            }
            if (showExport) {
              dispatch(Toolbar.actions.setShowExport({show:false}))
            }
          }
        }

        if (selectedTool === TOOL_TEXT) {
          if (key === 'Escape') {
            dispatch(Toolbar.actions.setTextCursorPos(null))
          }

          if (state.toolbar.textCursorPos !== null && !metaOrCtrl) {
            // Don't match shortcuts if we're in "text tool" mode.
            const { textCursorPos, textColor } = state.toolbar
            const framebufIndex = selectors.getCurrentScreenFramebufIndex(state)
            const { width, height } = selectors.getFramebufByIndex(state, framebufIndex)
            if (textCursorPos !== null) {
              const c = convertAsciiToScreencode(shiftKey ? key.toUpperCase() : key)
              if (c !== null) {
                dispatch(Framebuffer.actions.setPixel({
                  ...textCursorPos,
                  screencode: c,
                  color: textColor,
                  undoId: null
                }, framebufIndex))
                const newCursorPos = moveTextCursor(
                  textCursorPos,
                  { col: 1, row: 0 },
                  width, height
                )
                dispatch(Toolbar.actions.setTextCursorPos(newCursorPos))
              }
              if (key === 'ArrowLeft' || key === 'ArrowRight') {
                dispatch(Toolbar.actions.setTextCursorPos(
                  moveTextCursor(
                    textCursorPos,
                    { col: key === 'ArrowLeft' ? -1 : 1, row: 0},
                    width, height
                  )
                ))
              } else if (key === 'ArrowUp' || key === 'ArrowDown') {
                dispatch(Toolbar.actions.setTextCursorPos(
                  moveTextCursor(
                    textCursorPos,
                    { row: key === 'ArrowUp' ? -1 : 1, col: 0},
                    width, height
                  )
                ))
              }
            }
          }
        } else if (noMods) {
          if (key === 'Escape') {
            if (selectedTool === TOOL_BRUSH) {
              dispatch(Toolbar.actions.resetBrush())
            }
          } else if (key === 'a') {
            dispatch(Toolbar.actions.nextCharcode({ row: 0, col: -1}))
          } else if (key === 'd') {
            dispatch(Toolbar.actions.nextCharcode({ row: 0, col: +1}))
          } else if (key === 's') {
            dispatch(Toolbar.actions.nextCharcode({ row: +1, col: 0}))
          } else if (key === 'w') {
            dispatch(Toolbar.actions.nextCharcode({ row: -1, col: 0}))
          } else if (key === 'v' || key === 'h') {
            let mirror = Toolbar.MIRROR_Y
            if (key === 'h') {
              mirror = Toolbar.MIRROR_X
            }
            if (selectedTool === TOOL_BRUSH) {
              dispatch(Toolbar.actions.mirrorBrush(mirror))
            } else if (selectedTool === TOOL_DRAW || selectedTool === TOOL_CHAR_DRAW) {
              dispatch(Toolbar.actions.mirrorChar(mirror))
            }
          } else if (key === 'f') {
            dispatch(Toolbar.actions.invertChar())
          } else if (key === 'r') {
            if (selectedTool === TOOL_BRUSH) {
              dispatch(Toolbar.actions.rotateBrush())
            } else if (selectedTool === TOOL_DRAW || selectedTool === TOOL_CHAR_DRAW) {
              dispatch(Toolbar.actions.rotateChar())
            }
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
            default:
              break;
          }
        }
      }
    },

    keyUp: (key) => {
      return (dispatch, getState) => {
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

    setSelectedChar: (rc) => {
      return {
        type: Toolbar.SET_SELECTED_CHAR,
        data: rc
      }
    },

    nextCharcode: (dir) => {
      return (dispatch, getState) => {
        const font = selectors.getCurrentFramebufFont(getState())
        dispatch({
          type: Toolbar.NEXT_CHARCODE,
          data: {
            dir,
            font
          }
        })
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
          state.toolbar.selectedTool === TOOL_COLORIZE ||
          state.toolbar.selectedTool === TOOL_TEXT) {
          dispatch(Toolbar.actions.setSelectedTool(TOOL_DRAW))
        }
      }
    },

    setCurrentScreencodeAndColor: (pix) => {
      return (dispatch, getState) => {
        const state = getState()
        dispatch(Toolbar.actions.setTextColor(pix.color))
        dispatch(Toolbar.actions.setScreencode(pix.code))
        if (state.toolbar.selectedTool === TOOL_BRUSH ||
          state.toolbar.selectedTool === TOOL_TEXT) {
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
    },

    mirrorChar: (axis) => {
      return {
        type: Toolbar.MIRROR_CHAR,
        data: {
          mirror: axis
        }
      }
    },

    rotateChar: () => {
      return {
        type: Toolbar.ROTATE_CHAR,
      }
    }
  }

  static reducer(state = {
      ...settables.initialValues,
      ...initialBrushValue,
      selectedChar: {row: 8, col: 0},
      charTransform: emptyTransform,
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
      case Toolbar.SET_SELECTED_CHAR:
        const rc = action.data
        return {
          ...state,
          selectedChar: rc,
          charTransform: emptyTransform
        }
      case Toolbar.NEXT_CHARCODE: {
        const { dir, font } = action.data
        const rc = selectors.getCharRowColWithTransform(state.selectedChar, font, state.charTransform)
        return {
          ...state,
          selectedChar: {
            row: Math.max(0, Math.min(15, rc.row + dir.row)),
            col: Math.max(0, Math.min(15, rc.col + dir.col)),
          },
          charTransform: emptyTransform
        }
      }
      case Toolbar.INVERT_CHAR: {
        const { font } = action.data
        const curScreencode = selectors.getScreencodeWithTransform(state.selectedChar, font, state.charTransform)
        const inverseRowCol = utils.rowColFromScreencode(font, brush.findInverseChar(action.data.font, curScreencode))
        return {
          ...state,
          selectedChar: inverseRowCol,
          charTransform: emptyTransform
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
          brushTransform: mirror(state.brushTransform, action.data.mirror)
        }
      case Toolbar.ROTATE_BRUSH:
        return {
          ...state,
          brushTransform: rotate(state.brushTransform)
        }
      case Toolbar.MIRROR_CHAR:
        return {
          ...state,
          charTransform: mirror(state.charTransform, action.data.mirror)
        }
      case Toolbar.ROTATE_CHAR:
        return {
          ...state,
          charTransform: rotate(state.charTransform)
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
