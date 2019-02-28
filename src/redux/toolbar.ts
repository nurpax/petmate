
import { bindActionCreators, Dispatch } from 'redux'

import { Framebuffer } from './editor'
import * as Screens from './screens'
import { Toolbar as IToolbar, Transform, RootStateThunk, Coord2, Pixel, BrushRegion, Font, Brush, Tool, Angle360, FramebufUIState, DEFAULT_FB_WIDTH, DEFAULT_FB_HEIGHT } from './types'

import * as selectors from './selectors'
import * as screensSelectors from '../redux/screensSelectors'
import {
  getSettingsPaletteRemap
} from '../redux/settingsSelectors'
import * as utils from '../utils'
import * as brush from './brush'
import { ActionsUnion, createAction, updateField, DispatchPropsFromActions } from './typeUtils'
import { FileFormat } from './typesExport';
import * as matrix from '../utils/matrix';

const defaultFramebufUIState = {
  canvasTransform: matrix.ident()
};

const emptyTransform: Transform = {
  mirror: 0,
  rotate: 0
}

function rotate(transform: Transform): Transform {
  return {
    ...transform,
    rotate: ((transform.rotate + 90) % 360) as Angle360
  }
}

function mirror(transform: Transform, mirror: number) {
  return {
    ...transform,
    mirror: transform.mirror ^ mirror
  }
}

function dispatchForCurrentFramebuf (
  f: (dispatch: Dispatch, framebufIndex: number) => void
): RootStateThunk {
  return (dispatch, getState) => {
    const state = getState();
    const framebufIndex = screensSelectors.getCurrentScreenFramebufIndex(state);
    if (framebufIndex === null) {
      return;
    }
    f(dispatch, framebufIndex);
  }
}

const initialBrushValue = {
  brush: null as (Brush|null),
  brushRegion: null as (BrushRegion|null),
  brushTransform: emptyTransform
}

function moveTextCursor(curPos: Coord2, dir: Coord2, width: number, height: number) {
  const idx = (curPos.row + dir.row)*width + (curPos.col + dir.col) + width*height
  const wrapped = idx % (width*height)
  return {
    row: Math.floor(wrapped / width),
    col: Math.floor(wrapped % width)
  }
}

function asc2int(asc: string) {
  return asc.charCodeAt(0)
}

function convertAsciiToScreencode(asc: string) {
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
  const otherChars: {[index:string]: number} = {
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

const SET_SELECTED_CHAR = 'Toolbar/SET_SELECTED_CHAR'
const RESET_BRUSH = 'Toolbar/RESET_BRUSH'
const CAPTURE_BRUSH = 'Toolbar/CAPTURE_BRUSH'
const MIRROR_BRUSH = 'Toolbar/MIRROR_BRUSH'
const ROTATE_BRUSH = 'Toolbar/ROTATE_BRUSH'
const MIRROR_CHAR = 'Toolbar/MIRROR_CHAR'
const ROTATE_CHAR = 'Toolbar/ROTATE_CHAR'
const NEXT_CHARCODE = 'Toolbar/NEXT_CHARCODE'
const NEXT_COLOR = 'Toolbar/NEXT_COLOR'
const INVERT_CHAR = 'Toolbar/INVERT_CHAR'
const CLEAR_MOD_KEY_STATE = 'Toolbar/CLEAR_MOD_KEY_STATE'
const INC_UNDO_ID = 'Toolbar/INC_UNDO_ID'
const SET_FRAMEBUF_UI_STATE = 'Toolbar/SET_FRAMEBUF_UI_STATE'

function captureBrush(framebuf: Pixel[][], brushRegion: BrushRegion) {
  const { min, max } = utils.sortRegion(brushRegion)
  const h = max.row - min.row + 1
  const w = max.col - min.col + 1
  const capfb = Array(h)
  for (var y = 0; y < h; y++) {
    capfb[y] = framebuf[y + min.row].slice(min.col, max.col+1)
  }
  return createAction(CAPTURE_BRUSH, {
    framebuf: capfb,
    brushRegion: {
      min: { row: 0, col: 0 },
      max: { row: h-1, col: w-1 }
    }
  })
}

const actionCreators = {
  incUndoId: () => createAction(INC_UNDO_ID),
  resetBrush: () => createAction(RESET_BRUSH),
  setSelectedChar: (coord: Coord2) => createAction(SET_SELECTED_CHAR, coord),
  nextCharcodeAction: (dir: Coord2, font: Font) => createAction(NEXT_CHARCODE, { dir, font }),
  nextColorAction: (dir: number, paletteRemap: number[]) => createAction(NEXT_COLOR, { dir, paletteRemap }),
  invertCharAction: (font: Font) => createAction(INVERT_CHAR, font),
  clearModKeyState: () => createAction(CLEAR_MOD_KEY_STATE),
  captureBrush,
  mirrorBrush: (axis:number) => createAction(MIRROR_BRUSH, axis),
  rotateBrush: () => createAction(ROTATE_BRUSH),
  mirrorChar: (axis: number) => createAction(MIRROR_CHAR, axis),
  rotateChar: () => createAction(ROTATE_CHAR),

  setFramebufUIState: (framebufIndex: number, uiState?: FramebufUIState) => createAction(SET_FRAMEBUF_UI_STATE, { framebufIndex, uiState }),

  setTextColor: (c: number) => createAction('Toolbar/SET_TEXT_COLOR', c),
  setTextCursorPos: (pos: Coord2|null) => createAction('Toolbar/SET_TEXT_CURSOR_POS', pos),
  setSelectedTool: (t: Tool) => createAction('Toolbar/SET_SELECTED_TOOL', t),
  setBrushRegion: (br: BrushRegion) => createAction('Toolbar/SET_BRUSH_REGION', br),
  setBrush: (b: Brush) => createAction('Toolbar/SET_BRUSH', b),
  setWorkspaceFilename: (fname: string|null) => createAction('Toolbar/SET_WORKSPACE_FILENAME', fname),
  setAltKey: (flag: boolean) => createAction('Toolbar/SET_ALT_KEY', flag),
  setCtrlKey: (flag: boolean) => createAction('Toolbar/SET_CTRL_KEY', flag),
  setMetaKey: (flag: boolean) => createAction('Toolbar/SET_META_KEY', flag),
  setShiftKey: (flag: boolean) => createAction('Toolbar/SET_SHIFT_KEY', flag),
  setShowSettings: (flag: boolean) => createAction('Toolbar/SET_SHOW_SETTINGS', flag),
  setShowExport: (show: {show:boolean, fmt?:FileFormat}) => createAction('Toolbar/SET_SHOW_EXPORT', show),
  setShowImport: (show: {show:boolean, fmt?:FileFormat}) => createAction('Toolbar/SET_SHOW_IMPORT', show),
  setSelectedPaletteRemap: (remapIdx: number) => createAction('Toolbar/SET_SELECTED_PALETTE_REMAP', remapIdx),
  setCanvasGrid: (flag: boolean) => createAction('Toolbar/SET_CANVAS_GRID', flag),
  setShortcutsActive: (flag: boolean) => createAction('Toolbar/SET_SHORTCUTS_ACTIVE', flag),
  setNewScreenSize: (dims: { width: number, height: number }) => createAction('Toolbar/SET_NEW_SCREEN_SIZE', dims)
};

export type Actions = ActionsUnion<typeof actionCreators>;

export type PropsFromDispatch = DispatchPropsFromActions<typeof Toolbar.actions>;

export class Toolbar {

  static MIRROR_X = 1
  static MIRROR_Y = 2

  static actions = {
    ...actionCreators,

    keyDown: (k: string): RootStateThunk => {
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
          altKey,
          metaKey,
          ctrlKey,
          selectedTool,
          showSettings,
          showExport,
          showImport
        } = state.toolbar
        const noMods = !shiftKey && !metaKey && !ctrlKey
        const metaOrCtrl = metaKey || ctrlKey

        const inModal =
          state.toolbar.showExport.show ||
          state.toolbar.showImport.show ||
          state.toolbar.showSettings;

        if (inModal) {
          return
        }

        let width  = 1;
        let height = 1;
        const framebufIndex = screensSelectors.getCurrentScreenFramebufIndex(state)
        if (framebufIndex !== null) {
          const { width: w, height: h } = selectors.getFramebufByIndex(state, framebufIndex)!;
          width = w;
          height = h;
        }

        let inTextInput = selectedTool === Tool.Text && state.toolbar.textCursorPos !== null
        // These shortcuts should work regardless of what drawing tool is selected.
        if (noMods) {
          if (!inTextInput) {
            if (!altKey && key === 'ArrowLeft') {
              dispatch(Screens.actions.nextScreen(-1))
              return
            } else if (!altKey && key === 'ArrowRight') {
              dispatch(Screens.actions.nextScreen(+1))
              return
            } else if (key === 'q') {
              dispatch(Toolbar.actions.nextColor(-1))
              return
            } else if (key === 'e') {
              dispatch(Toolbar.actions.nextColor(+1))
              return
            } else if (key === 'x' || key === '1') {
              dispatch(Toolbar.actions.setSelectedTool(Tool.Draw))
              return
            } else if (key === 'c' || key === '2') {
              dispatch(Toolbar.actions.setSelectedTool(Tool.Colorize))
              return
            } else if (key === '3') {
              dispatch(Toolbar.actions.setSelectedTool(Tool.CharDraw))
              return
            } else if (key === 'b' || key === '4') {
              dispatch(Toolbar.actions.setSelectedTool(Tool.Brush))
              return
            } else if (key === 't' || key === '5') {
              dispatch(Toolbar.actions.setSelectedTool(Tool.Text))
              return
            } else if (key === 'z' || key === '6') {
              dispatch(Toolbar.actions.setSelectedTool(Tool.PanZoom))
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
            if (showImport) {
              dispatch(Toolbar.actions.setShowImport({show:false}))
            }
          }
        }

        if (selectedTool === Tool.Text) {
          if (key === 'Escape') {
            dispatch(Toolbar.actions.setTextCursorPos(null))
          }

          if (state.toolbar.textCursorPos !== null && !metaOrCtrl) {
            // Don't match shortcuts if we're in "text tool" mode.
            const { textCursorPos, textColor } = state.toolbar
            const c = convertAsciiToScreencode(shiftKey ? key.toUpperCase() : key)
            if (framebufIndex !== null) {
              if (c !== null) {
                dispatch(Framebuffer.actions.setPixel({
                  ...textCursorPos,
                  screencode: c,
                  color: textColor,
                }, null, framebufIndex));
                const newCursorPos = moveTextCursor(
                  textCursorPos,
                  { col: 1, row: 0 },
                  width, height
                )
                dispatch(Toolbar.actions.setTextCursorPos(newCursorPos))
              }
              if (key === 'Backspace') {
                const newCursorPos = moveTextCursor(
                  textCursorPos,
                  { col: -1, row: 0 },
                  width, height
                )
                dispatch(Toolbar.actions.setTextCursorPos(newCursorPos));
                dispatch(Framebuffer.actions.setPixel({
                  ...newCursorPos,
                  screencode: 0x20, // space
                  color: textColor,
                }, null, framebufIndex));
              }
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
        } else if (noMods) {
          if (key === 'Escape') {
            if (selectedTool === Tool.Brush) {
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
            if (selectedTool === Tool.Brush) {
              dispatch(Toolbar.actions.mirrorBrush(mirror))
            } else if (selectedTool === Tool.Draw || selectedTool === Tool.CharDraw) {
              dispatch(Toolbar.actions.mirrorChar(mirror))
            }
          } else if (key === 'f') {
            dispatch(Toolbar.actions.invertChar())
          } else if (key === 'r') {
            if (selectedTool === Tool.Brush) {
              dispatch(Toolbar.actions.rotateBrush())
            } else if (selectedTool === Tool.Draw || selectedTool === Tool.CharDraw) {
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

    keyUp: (key: string): RootStateThunk => {
      return (dispatch, _getState) => {
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

    clearCanvas: (): RootStateThunk => {
      return dispatchForCurrentFramebuf((dispatch, framebufIndex) => {
        dispatch(Framebuffer.actions.clearCanvas(framebufIndex))
      });
    },

    nextCharcode: (dir: Coord2): RootStateThunk => {
      return (dispatch, getState) => {
        const font = selectors.getCurrentFramebufFont(getState())
        dispatch(actionCreators.nextCharcodeAction(dir, font));
      }
    },

    invertChar: (): RootStateThunk => {
      return (dispatch, getState) => {
        const font = selectors.getCurrentFramebufFont(getState())
        dispatch(actionCreators.invertCharAction(font));
      }
    },

    nextColor: (dir: number): RootStateThunk => {
      return (dispatch, getState) => {
        const state = getState()
        dispatch(actionCreators.nextColorAction(dir, getSettingsPaletteRemap(state)));
      }
    },

    setScreencode: (code: number): RootStateThunk => {
      return (dispatch, getState) => {
        const state = getState()
        const font = selectors.getCurrentFramebufFont(state)
        const charPos = utils.rowColFromScreencode(font, code)
        dispatch(Toolbar.actions.setSelectedChar(charPos))
      }
    },

    setCurrentColor: (color: number): RootStateThunk => {
      return (dispatch, getState) => {
        const state = getState()
        dispatch(Toolbar.actions.setTextColor(color))
        if (state.toolbar.selectedTool === Tool.Brush ||
            state.toolbar.selectedTool === Tool.PanZoom) {
          dispatch(Toolbar.actions.setSelectedTool(Tool.Draw))
        }
      }
    },

    setCurrentChar: (charPos: Coord2): RootStateThunk => {
      return (dispatch, getState) => {
        const state = getState()
        dispatch(Toolbar.actions.setSelectedChar(charPos))
        if (state.toolbar.selectedTool === Tool.Brush ||
          state.toolbar.selectedTool === Tool.Colorize ||
          state.toolbar.selectedTool === Tool.Text ||
          state.toolbar.selectedTool === Tool.PanZoom) {
          dispatch(Toolbar.actions.setSelectedTool(Tool.Draw))
        }
      }
    },

    setCurrentScreencodeAndColor: (pix: Pixel): RootStateThunk => {
      return (dispatch, getState) => {
        const state = getState()
        dispatch(Toolbar.actions.setTextColor(pix.color))
        dispatch(Toolbar.actions.setScreencode(pix.code))
        if (state.toolbar.selectedTool === Tool.Brush ||
          state.toolbar.selectedTool === Tool.Text) {
          dispatch(Toolbar.actions.setSelectedTool(Tool.Draw))
        }
      }
    },

    shiftHorizontal: (dir: -1|1): RootStateThunk => {
      return dispatchForCurrentFramebuf((dispatch, framebufIndex) => {
        dispatch(Framebuffer.actions.shiftHorizontal(dir, framebufIndex))
      });
    },

    shiftVertical: (dir: -1|1) => {
      return dispatchForCurrentFramebuf((dispatch, framebufIndex) => {
        dispatch(Framebuffer.actions.shiftVertical(dir, framebufIndex))
      });
    },

    setCurrentFramebufUIState: (uiState: FramebufUIState): RootStateThunk => {
      return dispatchForCurrentFramebuf((dispatch, framebufIndex) => {
        dispatch(Toolbar.actions.setFramebufUIState(framebufIndex, uiState));
      });
    },

  }

  static reducer(state: IToolbar = {
      ...initialBrushValue,
      selectedChar: {row: 8, col: 0},
      charTransform: emptyTransform,
      undoId: 0,
      textColor: 14,
      textCursorPos: null as (Coord2|null),
      selectedTool: Tool.Draw,
      brushRegion: null as (BrushRegion|null),
      brush: null as (Brush|null),
      workspaceFilename: null as (string|null),
      altKey: false,
      ctrlKey: false,
      metaKey: false,
      shiftKey: false,
      showSettings: false,
      showExport: { show: false },
      showImport: { show: false },
      selectedPaletteRemap: 0,
      canvasGrid: false,
      shortcutsActive: true,
      newScreenSize: { width: DEFAULT_FB_WIDTH, height: DEFAULT_FB_HEIGHT },
      framebufUIState: {}
    }, action: Actions) {
    switch (action.type) {
      case RESET_BRUSH:
        return {
          ...state,
          ...initialBrushValue
        }
      case CAPTURE_BRUSH:
        return {
          ...state,
          ...initialBrushValue,
          brush: action.data
        }
      case SET_SELECTED_CHAR:
        const rc = action.data
        return {
          ...state,
          selectedChar: rc,
          charTransform: emptyTransform
        }
      case NEXT_CHARCODE: {
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
      case INVERT_CHAR: {
        const font = action.data
        const curScreencode = selectors.getScreencodeWithTransform(state.selectedChar, font, state.charTransform)
        const inverseRowCol = utils.rowColFromScreencode(font, brush.findInverseChar(font, curScreencode))
        return {
          ...state,
          selectedChar: inverseRowCol,
          charTransform: emptyTransform
        }
      }
      case NEXT_COLOR: {
        const remap = action.data.paletteRemap;
        const idx = remap.indexOf(state.textColor);
        const dir = action.data.dir;
        const nextIdx = Math.max(0, Math.min(15, idx + dir));
        return {
          ...state,
          textColor: remap[nextIdx]
        }
      }
      case INC_UNDO_ID:
        return {
          ...state,
          undoId: state.undoId+1
        }
      case SET_FRAMEBUF_UI_STATE: {
        return {
          ...state,
          framebufUIState: {
            ...state.framebufUIState,
            [action.data.framebufIndex]: action.data.uiState || defaultFramebufUIState
          }
        }
      }
      case MIRROR_BRUSH:
        return {
          ...state,
          brushTransform: mirror(state.brushTransform, action.data)
        }
      case ROTATE_BRUSH:
        return {
          ...state,
          brushTransform: rotate(state.brushTransform)
        }
      case MIRROR_CHAR:
        return {
          ...state,
          charTransform: mirror(state.charTransform, action.data)
        }
      case ROTATE_CHAR:
        return {
          ...state,
          charTransform: rotate(state.charTransform)
        }
      case CLEAR_MOD_KEY_STATE:
        return {
          ...state,
          altKey: false,
          ctrlKey: false,
          metaKey: false,
          shiftKey: false
        }
      case 'Toolbar/SET_TEXT_COLOR':
        return updateField(state, 'textColor', action.data);
      case 'Toolbar/SET_TEXT_CURSOR_POS':
        return updateField(state, 'textCursorPos', action.data);
      case 'Toolbar/SET_SELECTED_TOOL':
        return updateField(state, 'selectedTool', action.data);
      case 'Toolbar/SET_BRUSH_REGION':
        return updateField(state, 'brushRegion', action.data);
      case 'Toolbar/SET_BRUSH':
        return updateField(state, 'brush', action.data);
      case 'Toolbar/SET_WORKSPACE_FILENAME':
        return updateField(state, 'workspaceFilename', action.data);
      case 'Toolbar/SET_ALT_KEY':
        return updateField(state, 'altKey', action.data);
      case 'Toolbar/SET_CTRL_KEY':
        return updateField(state, 'ctrlKey', action.data);
      case 'Toolbar/SET_META_KEY':
        return updateField(state, 'metaKey', action.data);
      case 'Toolbar/SET_SHIFT_KEY':
        return updateField(state, 'shiftKey', action.data);
      case 'Toolbar/SET_SHOW_SETTINGS':
        return updateField(state, 'showSettings', action.data);
      case 'Toolbar/SET_SHOW_EXPORT':
        return updateField(state, 'showExport', action.data);
      case 'Toolbar/SET_SHOW_IMPORT':
        return updateField(state, 'showImport', action.data);
      case 'Toolbar/SET_SELECTED_PALETTE_REMAP':
        return updateField(state, 'selectedPaletteRemap', action.data);
      case 'Toolbar/SET_CANVAS_GRID':
        return updateField(state, 'canvasGrid', action.data);
      case 'Toolbar/SET_SHORTCUTS_ACTIVE':
        return updateField(state, 'shortcutsActive', action.data);
      case 'Toolbar/SET_NEW_SCREEN_SIZE':
        return updateField(state, 'newScreenSize', action.data);
      default:
        return state;
    }
  }

  static bindDispatch (dispatch: Dispatch) {
    return bindActionCreators(Toolbar.actions, dispatch)
  }
}
