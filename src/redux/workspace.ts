
import { ActionCreators } from 'redux-undo';

import * as fp from '../utils/fp'

import * as Screens from './screens'
import { Framebuffer } from './editor'
import { Framebuf } from './types'
import * as Root from './root'
import * as screensSelectors from './screensSelectors'

// TODO remove this
interface Workspace {
  screens: any[]; // TODO types
  framebufs: Framebuf[];
};

// TODO remove this
type RootState = any
// TODO remove this
type Action = any;
type DispatchThunkFunc = (dispatch: DispatchFunc, getState: GetStateFunc) => void;
type DispatchFunc = (arg: Action | DispatchThunkFunc) => void;
// TODO remove this
type GetStateFunc = () => RootState;
// TODO remove this
type ThunkActionCreator = any;

export function framebufFromJson(c: any): Framebuf {
  return {
    width: c.width,
    height: c.height,
    backgroundColor: c.backgroundColor,
    borderColor: c.borderColor,
    framebuf: c.framebuf,
    charset: fp.maybeDefault(c.charset, 'upper'),
    name: fp.maybeDefault(c.name, undefined)
  }
}

export function load(workspace: Workspace): ThunkActionCreator {
  return (dispatch: DispatchFunc, _getState: GetStateFunc) => {
    dispatch(Root.actions.resetState())

    const { screens, framebufs } = workspace
    screens.forEach((fbIdx, screenIdx) => {
      if (fbIdx !== screenIdx) {
        console.warn('fbidx should be screenIdx, this should be ensured by workspace save code')
      }
      dispatch(Screens.actions.newScreen())

      dispatch(Framebuffer.actions.importFile(
        framebufFromJson(framebufs[fbIdx]),
        fbIdx
      ))

      dispatch({
        ...ActionCreators.clearHistory(),
        framebufIndex: fbIdx
      })
    })
    dispatch(Screens.actions.setCurrentScreenIndex(0))
  }
}

// Typed wrapper until selectors are typed
function getCurrentScreenIndex(state: RootState): number {
  return screensSelectors.getCurrentScreenIndex(state);
}

export function importFramebufs(framebufs: Framebuf[], append: boolean): ThunkActionCreator {
  if (!append) {
    throw new Error('only appending is supported');
  }
  return (dispatch: DispatchFunc, _getState: GetStateFunc) => {
    let firstNewScreenIdx = -1;
    framebufs.forEach((framebuf) => {
      dispatch(Screens.actions.newScreen())
      dispatch((dispatch: DispatchFunc, getState: GetStateFunc) => {
        const state = getState()
        const newScreenIdx = getCurrentScreenIndex(state);
        if (firstNewScreenIdx === -1) {
          firstNewScreenIdx = newScreenIdx
        }
        const newFramebufIdx = screensSelectors.getScreens(state)[newScreenIdx]
        dispatch(Framebuffer.actions.importFile(framebuf, newFramebufIdx))
        dispatch({
          ...ActionCreators.clearHistory(),
          framebufIndex: newFramebufIdx
        })
      })
    })
    dispatch(Screens.actions.setCurrentScreenIndex(firstNewScreenIdx))
  };
}
