
import { Action } from 'redux'
import { ThunkAction } from 'redux-thunk';
import { ActionCreators } from 'redux-undo';

import * as selectors from './selectors'
import {
  getSettingsCurrentColorPalette
} from '../redux/settingsSelectors'

import {
  Framebuf,
  RootState,
  FileFormat,
  SettingsJson,
  ExportOptions
} from './types'
import { ActionsUnion, createAction } from './typeUtils'
import { Framebuffer } from './editor'
import * as settings from './settings'
import * as screensSelectors from '../redux/screensSelectors'
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

function saveAsWorkspace(): ThunkAction<void, RootState, undefined, Action> {
  return (dispatch, getState) => {
    const state = getState()
    const screens = screensSelectors.getScreens(state)
    const getFramebufByIndex = (idx: number) => selectors.getFramebufByIndex(state, idx)
    dialogSaveAsWorkspace(
      dispatch,
      screens,
      getFramebufByIndex,
      (filename: string) => dispatch(Toolbar.actions.setWorkspaceFilename(filename))
    )
  }
}

export const actionCreators = {
  loadWorkspace: (data: any) => createAction(LOAD_WORKSPACE, data),
  resetStateAction: () => createAction(RESET_STATE)
};

export type Actions = ActionsUnion<typeof actionCreators>

export const actions = {
  ...actionCreators,

  fileOpenWorkspace: (): ThunkAction<void, RootState, undefined, Action> => {
    return (dispatch, _getState) => {
      const setWorkspaceFilename = (filename: string) => dispatch(Toolbar.actions.setWorkspaceFilename(filename))
      dialogLoadWorkspace(dispatch, setWorkspaceFilename)
    }
  },

  fileSaveAsWorkspace: saveAsWorkspace,

  fileSaveWorkspace: (): ThunkAction<void, RootState, undefined, Action> => {
    return (dispatch, getState) => {
      const state = getState()
      const screens = screensSelectors.getScreens(state)
      const getFramebufByIndex = (idx: number) => selectors.getFramebufByIndex(state, idx)
      const filename = state.toolbar.workspaceFilename
      if (filename === null) {
        return dispatch(saveAsWorkspace())
      }
      saveWorkspace(filename, screens, getFramebufByIndex)
    }
  },

  fileImport: (type: FileFormat): ThunkAction<void, RootState, undefined, Action> => {
    return (dispatch, getState) => {
      const state = getState()
      const framebufIndex = screensSelectors.getCurrentScreenFramebufIndex(state)
      if (framebufIndex === null) {
        return;
      }
      dialogImportFile(type, (framebufs: Framebuf[]) => {
        dispatch(Framebuffer.actions.importFile(framebufs[0], framebufIndex))
      })
    }
  },

  fileImportAppend: (type: FileFormat): ThunkAction<void, RootState, undefined, Action> => {
    return (dispatch, _getState) => {
      dialogImportFile(type, (framebufs: Framebuf[]) => {
        dispatch(importFramebufs(framebufs, true));
      })
    }
  },

  fileExportAs: (type: FileFormat, options: ExportOptions): ThunkAction<void, RootState, undefined, Action> => {
    return (_dispatch, getState) => {
      const state = getState()
      const screens = screensSelectors.getScreens(state)
      let remappedFbIndex = 0
      const selectedFramebufIndex = screensSelectors.getCurrentScreenFramebufIndex(state)
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

  resetState: (): ThunkAction<void, RootState, undefined, Action> => {
    return (dispatch, _getState) => {
      dispatch(actionCreators.resetStateAction());
      loadSettings((j: SettingsJson) => dispatch(settings.actions.load(j)))
    }
  },

  undo: (): ThunkAction<void, RootState, undefined, Action> => {
    return (dispatch, getState) => {
      const framebufIndex = screensSelectors.getCurrentScreenFramebufIndex(getState())
      dispatch({
        ...ActionCreators.undo(),
        framebufIndex
      })
    }
  },
  redo: (): ThunkAction<void, RootState, undefined, Action> => {
    return (dispatch, getState) => {
      const framebufIndex = screensSelectors.getCurrentScreenFramebufIndex(getState())
      dispatch({
        ...ActionCreators.redo(),
        framebufIndex
      })
    }
  }
}
