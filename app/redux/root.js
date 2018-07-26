
import * as selectors from './selectors'
import { ActionCreators } from 'redux-undo';

import { Toolbar } from './toolbar'
import { dialogLoadWorkspace, dialogSaveAsWorkspace, saveWorkspace } from '../utils'

export const RESET_STATE = 'RESET_STATE'
export const LOAD_WORKSPACE = 'LOAD_WORKSPACE'

const saveAsWorkspace = () => {
  return (dispatch, getState) => {
    const state = getState()
    const screens = selectors.getScreens(state)
    const getFramebufByIndex = (idx) => selectors.getFramebufByIndex(state, idx)
    dialogSaveAsWorkspace(
      dispatch,
      screens,
      getFramebufByIndex,
      (filename) => dispatch(Toolbar.actions.setWorkspaceFilename(filename))
    )
  }
}

export const actions = {
  fileOpenWorkspace: () => {
    return (dispatch, getState) => {
      const setWorkspaceFilename = (filename) => dispatch(Toolbar.actions.setWorkspaceFilename(filename))
      dialogLoadWorkspace(dispatch, setWorkspaceFilename)
    }
  },

  fileSaveAsWorkspace: saveAsWorkspace,

  fileSaveWorkspace: () => {
    return (dispatch, getState) => {
      const state = getState()
      const screens = selectors.getScreens(state)
      const getFramebufByIndex = (idx) => selectors.getFramebufByIndex(state, idx)
      const filename = state.toolbar.workspaceFilename
      console.log('save workspace', filename)
      if (filename === null) {
        return dispatch(saveAsWorkspace())
      }
      saveWorkspace(filename, screens, getFramebufByIndex)
    }
  },

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
