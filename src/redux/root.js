
import * as selectors from './selectors'
import {
  getSettingsCurrentColorPalette
} from '../redux/settingsSelectors'

import { ActionCreators } from 'redux-undo';

import { Framebuffer } from './editor'
import { Settings } from './settings'
import { Toolbar } from './toolbar'
import {
  dialogLoadWorkspace,
  dialogSaveAsWorkspace,
  dialogExportFile,
  dialogImportFile,
  saveWorkspace,
  loadSettings
} from '../utils'

import { importFramebufs } from './workspace'

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

  fileImport: (type) => {
    return (dispatch, getState) => {
      const state = getState()
      const framebufIndex = selectors.getCurrentScreenFramebufIndex(state)
      dialogImportFile(type, framebufs => {
        dispatch(Framebuffer.actions.importFile(framebufs[0], framebufIndex))
      })
    }
  },

  fileImportAppend: (type) => {
    return (dispatch, getState) => {
      const state = getState()
      const framebufIndex = selectors.getCurrentScreenFramebufIndex(state)
      dialogImportFile(type, framebufs => {
        dispatch(importFramebufs(framebufs, true));
      })
    }
  },

  fileExportAs: (type, options) => {
    return (dispatch, getState) => {
      const state = getState()
      const screens = selectors.getScreens(state)
      let remappedFbIndex = 0
      const selectedFramebufIndex = selectors.getCurrentScreenFramebufIndex(state)
      const framebufs = screens.map((fbIdx, i) => {
        const framebuf = selectors.getFramebufByIndex(state, fbIdx)
        if (selectedFramebufIndex === fbIdx) {
          remappedFbIndex = i
        }
        return {
          ...framebuf,
          font: selectors.getFramebufFont(state, framebuf)
        }
      })
      const palette = getSettingsCurrentColorPalette(state)
      dialogExportFile(type, framebufs, palette, {
        ...options,
        selectedFramebufIndex: remappedFbIndex
      })
    }
  },

  resetState: () => {
    return (dispatch, getState) => {
      dispatch({
        type: RESET_STATE
      })
      loadSettings(j => dispatch(Settings.actions.load(j)))
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
