
import { bindActionCreators } from 'redux'

export const SET_PALETTE = 'SET_PALETTE'
export const SAVE_EDITS = 'SAVE_EDITS'
export const CANCEL_EDITS = 'CANCEL_EDITS'

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

export class Settings {
  static actions = {
    saveEdits: () => {
      return {
        type: SAVE_EDITS
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
      case SAVE_EDITS:
        // TODO persist here?  Or use thunk?
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
