// @flow
import { combineReducers } from 'redux'
import undoable from 'redux-undo'
import { routerReducer as router } from 'react-router-redux'
import { Toolbar } from '../redux/toolbar'
import { Framebuffer } from '../redux/editor'
import * as Screens from '../redux/screens'
import * as framebufList from '../redux/framebufList'

const rootReducer = combineReducers({
  framebufList: framebufList.reducer,
  toolbar: Toolbar.reducer,
  screens: Screens.reducer,
  router
})

const rootReducerTop = (state, action) => {
  if (action.type === Screens.ADD_SCREEN_AND_FRAMEBUF) {
    const newFramebufs =
      framebufList.reducer(state.framebufList, framebufList.actions.addFramebuf())
    const fbs = newFramebufs
    const newScreens =
      Screens.reducer(state.screens, Screens.actions.addScreen(fbs.length-1))
    let lastScreenId = newScreens.list.length-1
    const newScreens2 =
      Screens.reducer(newScreens, Screens.actions.setCurrentScreenIndex(lastScreenId))
    return {
      ...state,
      framebufList: newFramebufs,
      screens: newScreens2
    }
  }
  return rootReducer(state, action)
}

export default rootReducerTop
