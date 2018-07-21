// @flow
import { combineReducers } from 'redux'
import undoable from 'redux-undo'
import { routerReducer as router } from 'react-router-redux'
import { Toolbar } from '../redux/toolbar'
import { Framebuffer } from '../redux/editor'

const groupByUndoId = (action) => {
  if (action.undoId !== undefined) {
    return action.undoId
  }
  return null
}

function list(reducer, actionTypes) {
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

const rootReducer = combineReducers({
  framebufList: list(
    undoable(Framebuffer.reducer, {
      groupBy: groupByUndoId
    }),
    {
      add: 'ADD_FRAMEBUF',
      remove: 'REMOVE_FRAMEBUF'
    }
  ),
  toolbar: Toolbar.reducer,
  router
})

const rootReducerTop = (state, action) => {
  // Kind of hacky way to set framebuffer index to last created element
  if (action.type === 'Toolbar/SET_FRAMEBUFINDEX') {
    if (action.data == -1) {
      return {
        ...state,
        toolbar: {
          ...state.toolbar,
          framebufIndex: state.framebufList.length-1
        }
      }
    }
  }
  return rootReducer(state, action)
}

export default rootReducerTop
