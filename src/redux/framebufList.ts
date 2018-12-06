
import { Reducer, Action, AnyAction } from 'redux'
import undoable from 'redux-undo'
import * as framebuffer from './editor'
import { Framebuffer } from './editor'
import {
  UndoableFramebuf,
  Framebuf
} from './types'
import { ActionsUnion, createAction } from './typeUtils'

import * as fp from '../utils/fp'

const ADD_FRAMEBUF = 'ADD_FRAMEBUF'
const REMOVE_FRAMEBUF = 'REMOVE_FRAMEBUF'

const actionCreators = {
  addFramebuf: () => createAction(ADD_FRAMEBUF),
  removeFramebuf: (index: number) => createAction(REMOVE_FRAMEBUF, index)
};

export type Actions = ActionsUnion<typeof actionCreators>

export const actions = actionCreators;

type UndoableFbReducer = (histFb: UndoableFramebuf|undefined, action: framebuffer.Actions) => UndoableFramebuf;

function framebufListReducer(reducer: UndoableFbReducer) {
  return function (state: UndoableFramebuf[] = [], action: Actions|framebuffer.Actions): UndoableFramebuf[] {
    switch (action.type) {
    case ADD_FRAMEBUF:
      const dummyAction: framebuffer.Actions = action as any;
      return state.concat(reducer(undefined, dummyAction));
    case REMOVE_FRAMEBUF: {
      return fp.arrayRemoveAt(state, action.data);
    }
    default:
      const framebufIndex = action.framebufIndex;
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
  const tmpAction = action as framebuffer.Actions;
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
