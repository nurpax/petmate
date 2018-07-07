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

const rootReducer = combineReducers({
  framebuf: undoable(Framebuffer.reducer, {
    groupBy: groupByUndoId
  }),
  toolbar: Toolbar.reducer,
  router
});

export default rootReducer;
