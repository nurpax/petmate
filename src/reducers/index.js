// @flow
import { combineReducers } from 'redux'
import { Toolbar } from '../redux/toolbar'
import { Framebuffer } from '../redux/editor'
import * as settings from '../redux/settings'
import * as screens from '../redux/screens'
import * as framebufList from '../redux/framebufList'
import * as Root from '../redux/root'

const rootReducer = combineReducers({
  framebufList: framebufList.reducer,
  toolbar: Toolbar.reducer,
  screens: screens.reducer,
  settings: settings.reducer
})

const rootReducerTop = (state, action) => {
  if (action.type === Root.RESET_STATE) {
    return rootReducer(undefined, action)
  }
  if (action.type === screens.ADD_SCREEN_AND_FRAMEBUF) {
    const newFramebufs =
      framebufList.reducer(state.framebufList, framebufList.actions.addFramebuf())
    const fbs = newFramebufs
    const fbidx = fbs.length-1
    let insertAfterIndex = action.data;
    if (insertAfterIndex === undefined) {
      insertAfterIndex = state.screens.list.length-1
    }
    const newScreens =
      screens.reducer(state.screens, screens.actions.addScreen(fbidx, insertAfterIndex))
    const newScreens2 =
      screens.reducer(newScreens, screens.actions.setCurrentScreenIndex(insertAfterIndex+1))
    return {
      ...state,
      framebufList: newFramebufs,
      screens: newScreens2
    }
  }
  return rootReducer(state, action)
}

export default rootReducerTop
