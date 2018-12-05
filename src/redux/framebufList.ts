
import { Reducer, Action, AnyAction } from 'redux'
import undoable, { StateWithHistory } from 'redux-undo'
import { Framebuffer } from '../redux/editor'
import {
  ActionsUnion,
  createAction,
  Framebuf, FbAction
} from './types'

import * as fp from '../utils/fp'

const ADD_FRAMEBUF = 'ADD_FRAMEBUF'
const REMOVE_FRAMEBUF = 'REMOVE_FRAMEBUF'

const actionCreators = {
  addFramebuf: () => createAction(ADD_FRAMEBUF),
  removeFramebuf: (index: number) => createAction(REMOVE_FRAMEBUF, index)
};

type Actions = ActionsUnion<typeof actionCreators>

export const actions = actionCreators;

type UndoableFramebuf = StateWithHistory<Framebuf>;

function framebufListReducer(reducer: Reducer<UndoableFramebuf, FbAction<any>>): (state: UndoableFramebuf[], action: Actions) => UndoableFramebuf[] {
  return function (state: UndoableFramebuf[] = [], action: Actions): UndoableFramebuf[] {
    switch (action.type) {
    case ADD_FRAMEBUF:
      const dummyAction = action as FbAction<any>;
      return state.concat(reducer(undefined, dummyAction));
    case REMOVE_FRAMEBUF: {
      return fp.arrayRemoveAt(state, action.data);
    }
    default:
      const { framebufIndex } = action as FbAction<any>;
      if (typeof framebufIndex !== 'undefined') {
        return state.map((item, i) => {
          if (framebufIndex === i) {
            return reducer(item, action);
          } else {
            return item;
          }
        })
      }
      return state;
    }
  }
}

const groupByUndoId = (action: Action<any>) => {
  const tmpAction = action as FbAction<any>;
  if (tmpAction.undoId !== undefined) {
    return tmpAction.undoId;
  }
  return null;
}

const mkReducer = () => {
  const r = undoable(Framebuffer.reducer as Reducer<Framebuf, AnyAction>, {
    groupBy: groupByUndoId
  });
  return framebufListReducer(r);
}

export const reducer = mkReducer();
