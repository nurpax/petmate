
import * as selectors from './selectors'
import {
  Framebuffer,
  DEFAULT_BACKGROUND_COLOR,
  DEFAULT_BORDER_COLOR
} from './editor'

import { makeScreenName } from './utils'

import * as fp from '../utils/fp'

export const ADD_SCREEN = 'ADD_SCREEN'
export const ADD_SCREEN_AND_FRAMEBUF = 'ADD_SCREEN_AND_FRAMEBUF'
export const REMOVE_SCREEN = 'REMOVE_SCREEN'
export const SET_CURRENT_SCREEN_INDEX = 'SET_CURRENT_SCREEN_INDEX'
export const SET_SCREEN_ORDER = 'SET_SCREEN_ORDER'
export const NEXT_SCREEN = 'NEXT_SCREEN'

export function reducer(state = {current: 0, list: []}, action) {
  switch (action.type) {
  case ADD_SCREEN:
    const insertAfter = action.data.insertAfterIndex
    return {
      ...state,
      list: fp.arrayInsertAt(state.list, insertAfter+1, action.data.framebufId)
    }
  case REMOVE_SCREEN:
    return {
      ...state,
      list: fp.arrayRemoveAt(state.list, action.index)
    }
  case SET_CURRENT_SCREEN_INDEX:
    return {
      ...state,
      current: action.data
    }
  case SET_SCREEN_ORDER: {
    const newScreenIdx = action.data
    const newCurrentScreen = newScreenIdx.indexOf(state.list[state.current])
    return {
      ...state,
      list: newScreenIdx,
      current: newCurrentScreen
    }
  }
  case NEXT_SCREEN:
    return {
      ...state,
      current: Math.min(state.list.length-1, Math.max(0, state.current + action.data))
    }
  default:
    return state
  }
}

export const actions = {
  addScreen: (framebufId, insertAfterIndex) => {
    return {
      type: ADD_SCREEN,
      data: { framebufId, insertAfterIndex },
    }
  },
  removeScreen: (index) => {
    return (dispatch, getState) => {
      const state = getState()
      const numScreens = selectors.getScreens(state).length
      if (numScreens <= 1) {
        // Don't allow deletion of the last framebuffer
        return
      }
      dispatch(actions.setCurrentScreenIndex(index === numScreens - 1 ? numScreens - 2 : index))
      dispatch({
        type: REMOVE_SCREEN,
        index
      })
    }
  },
  cloneScreen: (index) => {
    return (dispatch, getState) => {
      const state = getState()
      const fbidx = selectors.getScreens(state)[index]
      const framebuf = selectors.getFramebufByIndex(state, fbidx)
      dispatch({
        type: ADD_SCREEN_AND_FRAMEBUF,
        insertAfterIndex: index
      })
      dispatch((dispatch, getState) => {
        const state = getState()
        const newScreenIdx = selectors.getCurrentScreenIndex(state)
        const newFramebufIdx = selectors.getScreens(state)[newScreenIdx]
        dispatch(Framebuffer.actions.copyFramebuf({
          ...framebuf,
          name: makeScreenName(newFramebufIdx)
        }, newFramebufIdx))
      })
    }
  },
  newScreen: () => {
    return (dispatch, getState) => {
      const state = getState()
      const index = state.screens.current
      const fbidx = selectors.getScreens(state)[index]
      const framebuf = selectors.getFramebufByIndex(state, fbidx)
      let colors = {
        backgroundColor: DEFAULT_BACKGROUND_COLOR,
        borderColor: DEFAULT_BORDER_COLOR
      }
      if (framebuf !== null) {
        colors = {
          backgroundColor: framebuf.backgroundColor,
          borderColor: framebuf.borderColor
        }
      }
      dispatch({
        type: ADD_SCREEN_AND_FRAMEBUF,
        data: null
      })
      dispatch((dispatch, getState) => {
        const state = getState()
        const newScreenIdx = selectors.getCurrentScreenIndex(state)
        const newFramebufIdx = selectors.getScreens(state)[newScreenIdx]
        dispatch(Framebuffer.actions.setFields({
          ...colors,
          name: makeScreenName(newFramebufIdx)
        }, newFramebufIdx))
      })
    }
  },

  setCurrentScreenIndex: (index) => {
    return {
      type: SET_CURRENT_SCREEN_INDEX,
      data: index
    }
  },

  setScreenOrder: (screens) => {
    return {
      type: SET_SCREEN_ORDER,
      data: screens
    }
  },

  nextScreen: (dir) => {
    return {
      type: NEXT_SCREEN,
      data: dir
    }
  }
}
