
import * as selectors from './selectors'
import { ActionCreators } from 'redux-undo';

export const RESET_STATE = 'RESET_STATE'
export const LOAD_WORKSPACE = 'LOAD_WORKSPACE'

export const actions = {
  loadWorkspace: (data) => {
    return {
      type: LOAD_WORKSPACE,
      data
    }
  },
  resetState: () => {
    return {
      type: RESET_STATE
    }
  },
  undo: () => {
    return (dispatch, getState) => {
      const framebufIndex = selectors.getCurrentScreenFramebufIndex(getState())
      dispatch({
        ...ActionCreators.undo(),
        framebufIndex
      })
    }
  },
  redo: () => {
    return (dispatch, getState) => {
      const framebufIndex = selectors.getCurrentScreenFramebufIndex(getState())
      dispatch({
        ...ActionCreators.redo(),
        framebufIndex
      })
    }
  }
}
