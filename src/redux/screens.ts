
import { Action } from 'redux'
import { ThunkAction } from 'redux-thunk';

import * as selectors from './selectors'
import {
  getScreens,
  getCurrentScreenIndex,
  getCurrentScreenFramebufIndex
} from './screensSelectors'

import {
  Framebuffer,
  DEFAULT_BACKGROUND_COLOR,
  DEFAULT_BORDER_COLOR
} from './editor'

import {
  ActionsUnion,
  createAction,
  RootState,
  Screens
} from './types'

import { makeScreenName } from './utils'

import * as fp from '../utils/fp'

export const ADD_SCREEN_AND_FRAMEBUF = 'ADD_SCREEN_AND_FRAMEBUF'

const ADD_SCREEN = 'ADD_SCREEN'
const REMOVE_SCREEN = 'REMOVE_SCREEN'
const SET_CURRENT_SCREEN_INDEX = 'SET_CURRENT_SCREEN_INDEX'
const SET_SCREEN_ORDER = 'SET_SCREEN_ORDER'
const NEXT_SCREEN = 'NEXT_SCREEN'

interface AddScreenArgs {
  framebufId: number;
  insertAfterIndex: number;
};

const actionCreators = {
  addScreen: (framebufId: number, insertAfterIndex: number) => createAction(ADD_SCREEN, { framebufId, insertAfterIndex } as AddScreenArgs),
  addScreenAndFramebuf: (insertAfterIndex?: number) => createAction(ADD_SCREEN_AND_FRAMEBUF, insertAfterIndex),
  removeScreenAction: (index: number) => createAction(REMOVE_SCREEN, index),
  setCurrentScreenIndex: (index: number) => createAction(SET_CURRENT_SCREEN_INDEX, index),
  setScreenOrder: (screens: number[]) => createAction(SET_SCREEN_ORDER, screens),
  nextScreen: (dir: number) => createAction(NEXT_SCREEN, dir)
};

function removeScreen(index: number): ThunkAction<void, RootState, undefined, Action>  {
  return (dispatch, getState) => {
    const state = getState()
    const numScreens = getScreens(state).length
    if (numScreens <= 1) {
      // Don't allow deletion of the last framebuffer
      return
    }
    dispatch(actions.setCurrentScreenIndex(index === numScreens - 1 ? numScreens - 2 : index))
    dispatch(actions.removeScreenAction(index));
  }
}

function cloneScreen(index: number): ThunkAction<void, RootState, undefined, Action>  {
  return (dispatch, getState) => {
    const state = getState()
    const fbidx = getScreens(state)[index]
    const framebuf = selectors.getFramebufByIndex(state, fbidx)
    dispatch(actionCreators.addScreenAndFramebuf(index));
    dispatch((dispatch, getState) => {
      const state = getState()
      const newScreenIdx = getCurrentScreenIndex(state)
      const newFramebufIdx = getScreens(state)[newScreenIdx]
      dispatch(Framebuffer.actions.copyFramebuf({
        ...framebuf,
        name: makeScreenName(newFramebufIdx)
      }, newFramebufIdx))
    })
  }
}

function newScreen(): ThunkAction<void, RootState, undefined, Action> {
  return (dispatch, getState) => {
    const state = getState()
    const fbidx = getCurrentScreenFramebufIndex(state);
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
    dispatch(actions.addScreenAndFramebuf());
    dispatch((dispatch, getState) => {
      const state = getState()
      const newFramebufIdx = getCurrentScreenFramebufIndex(state)
      dispatch(Framebuffer.actions.setFields({
        ...colors,
        name: makeScreenName(newFramebufIdx)
      }, newFramebufIdx))
    })
  }
}

export const actions = {
  ...actionCreators,
  removeScreen,
  cloneScreen,
  newScreen
}

export type Actions = ActionsUnion<typeof actionCreators>;

export function reducer(state: Screens = {current: 0, list: []}, action: Actions): Screens {
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
      list: fp.arrayRemoveAt(state.list, action.data)
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
