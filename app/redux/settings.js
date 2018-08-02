
import { bindActionCreators } from 'redux'

export const LOAD = 'LOAD'
export const SET_PALETTE = 'SET_PALETTE'
export const SAVE_EDITS = 'SAVE_EDITS'
export const CANCEL_EDITS = 'CANCEL_EDITS'

const CONFIG_FILE_VERSION = 1

const mk16 = () => Array(16).fill().map((d,i) => i)

const initialState = {
  palettes: Array(4).fill().map((d, pi) => mk16())
}

const arrSet = (arr, idx, newVal) => {
  return arr.map((v,i) => {
    if (i == idx) {
      return newVal
    }
    return v
  })
}

function saveSettings(settings) {
  const electron = require('electron')
  const path = require('path')
  var fs = require('fs');
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
    palettes: json.palettes === undefined ? init.palettes : json.palettes
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
            palettes: arrSet(state[branch].palettes, action.idx, action.palette)
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
