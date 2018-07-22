// @flow
import { combineReducers } from 'redux'
import undoable from 'redux-undo'
import { routerReducer as router } from 'react-router-redux'
import { Toolbar } from '../redux/toolbar'
import { Framebuffer } from '../redux/editor'
import * as framebufList from '../redux/framebufList'

const groupByUndoId = (action) => {
  if (action.undoId !== undefined) {
    return action.undoId
  }
  return null
}

const rootReducer = combineReducers({
  framebufList: framebufList.reducer(
    undoable(Framebuffer.reducer, {
      groupBy: groupByUndoId
    })
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
          framebufIndex: state.framebufList.list.length-1
        }
      }
    }
  }
  return rootReducer(state, action)
}

export default rootReducerTop
