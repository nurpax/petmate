
export const ADD_FRAMEBUF = 'ADD_FRAMEBUF'
export const REMOVE_FRAMEBUF = 'REMOVE_FRAMEBUF'
export const SET_CURRENT_FRAMEBUF_INDEX = 'SET_CURRENT_FRAMEBUF_INDEX'

function framebufListReducer(reducer, actionTypes) {
  return function (state = {
    list: [],
    idCount: 0
  }, action) {
    switch (action.type) {
    case actionTypes.add:
      return {
        ...state,
        idCount: state.idCount+1,
        list: [...state.list, {id:state.idCount, ...reducer(undefined, action)}]
      }
    case actionTypes.remove:
      return {
        ...state,
        list: [...state.list.slice(0, action.index), ...state.list.slice(action.index + 1)]
      }
    default:
      const { framebufIndex, ...rest } = action;
      if (typeof framebufIndex !== 'undefined') {
        return {
          ...state,
          list: state.list.map((item, i) => {
            if (framebufIndex == i) {
              return {
                id: item.id,
                ...reducer(item, rest)
              }
            } else {
              return item
            }
          })
        }
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
  removeFramebuf: (index) => {
    return {
      type: REMOVE_FRAMEBUF,
      index
    }
  },
  setCurrentFramebufIndex: (index) => {
    return {
      type: SET_CURRENT_FRAMEBUF_INDEX,
      data: index
    }
  }
}

export const reducer = (r) => {
  return framebufListReducer(r, {
    add: ADD_FRAMEBUF,
    remove: REMOVE_FRAMEBUF
  })
}
