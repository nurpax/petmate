
import { bindActionCreators } from 'redux'

import { electron, path, fs } from '../utils/electronImports'

import * as fp from '../utils/fp'

export const LOAD = 'LOAD'
export const SET_PALETTE = 'SET_PALETTE'
export const SAVE_EDITS = 'SAVE_EDITS'
export const CANCEL_EDITS = 'CANCEL_EDITS'
export const SET_SELECTED_COLOR_PALETTE = 'SET_SELECTED_COLOR_PALETTE'
export const SET_INTEGER_SCALE = 'SET_INTEGER_SCALE'

const CONFIG_FILE_VERSION = 1

const initialState = {
  palettes: fp.mkArray(4, () => fp.mkArray(16, i => i)),
  selectedColorPalette: 'petmate',
  integerScale: false
}

function saveSettings(settings) {
  let settingsFile = path.join(electron.remote.app.getPath('userData'), 'Settings')
  const j = JSON.stringify(settings)
  fs.writeFileSync(settingsFile, j, 'utf-8')
}

// Load settings from a JSON doc.  Handle version upgrades.
function fromJson(json) {
  let version = undefined
  if (json.version === undefined || json.version === 1) {
    version = 1
  }
  if (version !== 1) {
    console.error('TODO upgrade settings format!')
  }
  const init = initialState
  return {
    ...initialState,
    palettes: json.palettes === undefined ? init.palettes : json.palettes,
    selectedColorPalette: json.selectedColorPalette === undefined ? init.selectedColorPalette : json.selectedColorPalette,
    integerScale: fp.maybeDefault(json.integerScale, false)
  }
}

export class Settings {
  static actions = {
    load: (json) => {
      return {
        type: LOAD,
        data: fromJson(json)
      }
    },
    saveEdits: () => {
      return (dispatch, getState) => {
        dispatch({
          type: SAVE_EDITS
        })
        dispatch((dispatch, getState) => {
          const state = getState().settings
          saveSettings(state.saved)
        })
      }
    },
    cancelEdits: () => {
      return {
        type: CANCEL_EDITS
      }
    },
    setPalette: (branch, idx, palette) => {
      if (!(branch === 'editing' || branch === 'saved')) {
        console.error('editing or saved', branch)
      }
      return {
        type: SET_PALETTE,
        branch,
        idx,
        palette
      }
    },
    setSelectedColorPaletteName: (branch, name) => {
      return {
        type: SET_SELECTED_COLOR_PALETTE,
        branch,
        data: name
      }
    },
    setIntegerScale: (branch, scale) => {
      return {
        type: SET_INTEGER_SCALE,
        branch,
        data: scale
      }
    }
  }

  static reducer(state = {
    editing: initialState, // form state while editing
    saved: initialState    // final state for rest of UI and persistence
    }, action) {
    switch (action.type) {
      case LOAD:
        let newSaved = action.data
        return {
          saved: newSaved,
          editing: newSaved
        }
      case SAVE_EDITS:
        return {
          ...state,
          saved: state.editing
        }
      case CANCEL_EDITS:
        return {
          ...state,
          editing: state.saved
        }
      case SET_PALETTE:
        const branch = action.branch
        return {
          ...state,
          [branch]: {
            ...state[branch],
            palettes: fp.arraySet(state[branch].palettes, action.idx, action.palette)
          }
        }
      case SET_INTEGER_SCALE: {
          const branch = action.branch
          return {
            ...state,
            [branch]: {
              ...state[branch],
              integerScale: action.data
            }
          }
        }
      case SET_SELECTED_COLOR_PALETTE: {
          const branch = action.branch
          return {
            ...state,
            [branch]: {
              ...state[branch],
              selectedColorPalette: action.data
            }
          }
        }
      default:
        return state
    }
  }

  static bindDispatch (dispatch) {
    return bindActionCreators(Settings.actions, dispatch)
  }
}
