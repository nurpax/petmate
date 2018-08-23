
import * as Screens from '../redux/screens'
import { Framebuffer } from '../redux/editor'
import * as Root from '../redux/root'
import * as selectors from '../redux/selectors'
import { ActionCreators } from 'redux-undo';

import * as fp from './fp'

export const framebufFromJson = (c) => {
  return {
    width: c.width,
    height: c.height,
    backgroundColor: c.backgroundColor,
    borderColor: c.borderColor,
    framebuf: c.framebuf,
    charset: fp.maybeDefault(c.charset, 'upper')
  }
}


// TODO this should in fact be a thunk action creator and reside under redux
export function load(dispatch, workspace) {
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

// TODO this should in fact be a thunk action creator and reside under redux
export function importFramebufs(dispatch, framebufs, append) {
  if (!append) {
    console.error('FAIL! unsupported')
  }
  let firstNewScreenIdx = null
  framebufs.forEach((framebuf, sourceFbIdx) => {
    dispatch(Screens.actions.newScreen())
    dispatch((dispatch, getState) => {
      const state = getState()
      const newScreenIdx = selectors.getCurrentScreenIndex(state)
      if (firstNewScreenIdx === null) {
        firstNewScreenIdx = newScreenIdx
      }
      const newFramebufIdx = selectors.getScreens(state)[newScreenIdx]
      dispatch(Framebuffer.actions.importFile(framebufs[sourceFbIdx], newFramebufIdx))
      dispatch({
        ...ActionCreators.clearHistory(),
        framebufIndex: newFramebufIdx
      })
    })
  })
  dispatch(Screens.actions.setCurrentScreenIndex(firstNewScreenIdx))
}
