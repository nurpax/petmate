// @flow
import { combineReducers } from 'redux'
import undoable from 'redux-undo'
import { routerReducer as router } from 'react-router-redux'
import { Toolbar } from '../redux/toolbar'
import { Framebuffer } from '../redux/editor'
import { Settings } from '../redux/settings'
import * as Screens from '../redux/screens'
import * as framebufList from '../redux/framebufList'
import * as Root from '../redux/root'

const rootReducer = combineReducers({
  framebufList: framebufList.reducer,
  toolbar: Toolbar.reducer,
  screens: Screens.reducer,
  settings: Settings.reducer,
  router
})

const rootReducerTop = (state, action) => {
  if (action.type === Root.RESET_STATE) {
    return rootReducer(undefined, action)
  }
  if (action.type === Screens.ADD_SCREEN_AND_FRAMEBUF) {
    const newFramebufs =
      framebufList.reducer(state.framebufList, framebufList.actions.addFramebuf())
    const fbs = newFramebufs
    const fbidx = fbs.length-1
    let insertAfterIndex = action.insertAfterIndex
    if (insertAfterIndex === undefined) {
      insertAfterIndex = state.screens.list.length-1
    }
    const newScreens =
      Screens.reducer(state.screens, Screens.actions.addScreen(fbidx, insertAfterIndex))
    const newScreens2 =
      Screens.reducer(newScreens, Screens.actions.setCurrentScreenIndex(insertAfterIndex+1))
    return {
      ...state,
      framebufList: newFramebufs,
      screens: newScreens2
    }
  }
  return rootReducer(state, action)
}

export default rootReducerTop
