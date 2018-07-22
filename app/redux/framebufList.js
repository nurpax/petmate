
const ADD_FRAMEBUF = 'ADD_FRAMEBUF'
const REMOVE_FRAMEBUF = 'REMOVE_FRAMEBUF'

function framebufListReducer(reducer, actionTypes) {
  return function (state = [], action) {
    switch (action.type) {
    case actionTypes.add:
      return [...state, reducer(undefined, action)];
    case actionTypes.remove:
      return [...state.slice(0, action.framebufIndex), ...state.slice(action.framebufIndex + 1)];
    default:
      const { framebufIndex, ...rest } = action;
      if (typeof framebufIndex !== 'undefined') {
        return state.map((item, i) => {
          if (framebufIndex == i) {
            return reducer(item, rest)
          } else {
            return item
          }
        });
      }
      return state;
    }
  }
}

export const actions = {
  addFramebuf: () => {
    return {
      type: ADD_FRAMEBUF
    }
  },
  removeFramebuf: (framebufIdx) => {
    return {
      type: REMOVE_FRAMEBUF,
      framebufIndex
    }
  }
}

export const reducer = (r) => {
  return framebufListReducer(r, {
    add: ADD_FRAMEBUF,
    remove: REMOVE_FRAMEBUF
  })
}
