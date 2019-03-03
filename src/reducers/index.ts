
import { combineReducers } from 'redux'
import * as toolbar from '../redux/toolbar'
import * as settings from '../redux/settings'
import * as screens from '../redux/screens'
import * as framebufList from '../redux/framebufList'
import * as Root from '../redux/root'

import { RootState, LastSavedState } from '../redux/types'

const rootReducer = combineReducers({
  framebufList: framebufList.reducer,
  toolbar: toolbar.Toolbar.reducer,
  screens: screens.reducer,
  settings: settings.reducer,
  lastSavedSnapshot: lastSavedSnapshotDummyReducer
})

// This is because of the above combineReducers.  Every top-level
// field in rootReducer must have an accompanying reducer.  This is
// only used here for initializing this state branch to its init value.
function lastSavedSnapshotDummyReducer(state: LastSavedState = {
  screenList: [],
  framebufs: []
}, _action: any) {
  return state;
}

const rootReducerTop = (
  state: RootState,
  action: screens.Actions | Root.Actions | framebufList.Actions | toolbar.Actions
): RootState => {
  switch (action.type) {
    case Root.RESET_STATE:
      return rootReducer(undefined, action)
    case screens.ADD_SCREEN_AND_FRAMEBUF: {
      const newFramebufs =
        framebufList.reducer(state.framebufList, framebufList.actions.addFramebuf(state.toolbar.newScreenSize));
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
      const newToolbar =
        toolbar.Toolbar.reducer(state.toolbar, toolbar.Toolbar.actions.setFramebufUIState(fbidx, undefined));
      return {
        ...state,
        toolbar: newToolbar,
        framebufList: newFramebufs,
        screens: newScreens2
      }
    }
    case Root.UPDATE_LAST_SAVED_SNAPSHOT: {
      return {
        ...state,
        lastSavedSnapshot: {
          screenList: state.screens.list,
          framebufs: state.framebufList.map(fb => fb.present)
        }
      }
    }
  }
  return rootReducer(state, action)
}

export default rootReducerTop
