
import undoable from 'redux-undo'
import { Framebuffer } from '../redux/editor'

export const ADD_FRAMEBUF = 'ADD_FRAMEBUF'
export const REMOVE_FRAMEBUF = 'REMOVE_FRAMEBUF'

function framebufListReducer(reducer, actionTypes) {
  return function (state = [], action) {
    switch (action.type) {
    case actionTypes.add:
      return state.concat(reducer(undefined, action))
    case actionTypes.remove:
      return [...state.slice(0, action.index), ...state.slice(action.index + 1)]
    default:
      const { framebufIndex, ...rest } = action;
      if (typeof framebufIndex !== 'undefined') {
        return state.map((item, i) => {
          if (framebufIndex == i) {
            return reducer(item, rest)
          } else {
            return item
          }
        })
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
  }
}

const groupByUndoId = (action) => {
  if (action.undoId !== undefined) {
    return action.undoId
  }
  return null
}

const mkReducer = () => {
  const r = undoable(Framebuffer.reducer, {
    groupBy: groupByUndoId
  })
  return framebufListReducer(r, {
    add: ADD_FRAMEBUF,
    remove: REMOVE_FRAMEBUF
  })
}

export const reducer = mkReducer()
