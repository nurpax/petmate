
import * as Screens from '../redux/screens'
import { Framebuffer } from '../redux/editor'
import * as Root from '../redux/root'
import { ActionCreators } from 'redux-undo';

export function load(dispatch, workspace) {
  dispatch(Root.actions.resetState())

  const { screens, framebufs } = workspace
  workspace.screens.forEach((fbIdx, screenIdx) => {
    if (fbIdx !== screenIdx) {
      console.warn('fbidx should be screenIdx, this should be ensured by workspace save code')
    }
    dispatch(Screens.actions.newScreen())
    dispatch(Framebuffer.actions.importFile(framebufs[fbIdx], fbIdx))
    dispatch({
      ...ActionCreators.clearHistory(),
      framebufIndex: fbIdx
    })
  })
  dispatch(Screens.actions.setCurrentScreenIndex(0))
}
