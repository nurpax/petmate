
export const ADD_SCREEN = 'ADD_SCREEN'
export const ADD_SCREEN_AND_FRAMEBUF = 'ADD_SCREEN_AND_FRAMEBUF'
export const REMOVE_SCREEN = 'REMOVE_SCREEN'
export const SET_CURRENT_SCREEN_INDEX = 'SET_CURRENT_SCREEN_INDEX'

export function reducer(state = {current: 0, list: [0]}, action) {
  switch (action.type) {
  case ADD_SCREEN:
    return {
      ...state,
      list: state.list.concat(action.data.framebufId)
    }
  case REMOVE_SCREEN:
    return {
      ...state,
      list: [...state.list.slice(0, action.index), ...state.list.slice(action.index + 1)]
    }
  case SET_CURRENT_SCREEN_INDEX:
    return {
      ...state,
      current: action.data
    }
  default:
    return state
  }
}

export const actions = {
  addScreen: (framebufId) => {
    return {
      type: ADD_SCREEN,
      data: {framebufId}
    }
  },
  removeScreen: (index) => {
    return {
      type: REMOVE_SCREEN,
      index
    }
  },
  newScreen: () => {
    return {
      type: ADD_SCREEN_AND_FRAMEBUF,
      data: null
    }
  },
  setCurrentScreenIndex: (index) => {
    return {
      type: SET_CURRENT_SCREEN_INDEX,
      data: index
    }
  }
}
