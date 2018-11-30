
import { Reducer, Action, AnyAction } from 'redux'
import undoable, { StateWithHistory } from 'redux-undo'
import { Framebuffer } from '../redux/editor'
import { Framebuf, FbAction } from '../redux/types'

import * as fp from '../utils/fp'

export const ADD_FRAMEBUF = 'ADD_FRAMEBUF'
export const REMOVE_FRAMEBUF = 'REMOVE_FRAMEBUF'

interface FbListAddAction extends Action {
  type: 'ADD_FRAMEBUF';
  index: number;
}

interface FbListRemoveAction extends Action {
  type: 'REMOVE_FRAMEBUF';
  index: number;
}

type FbListActionTypes = FbListRemoveAction | FbListAddAction;

type UndoableFramebuf = StateWithHistory<Framebuf>;

function framebufListReducer(reducer: Reducer<UndoableFramebuf, FbAction<any> | FbListAddAction>): (state: UndoableFramebuf[], action: FbListActionTypes) => UndoableFramebuf[] {
  return function (state: UndoableFramebuf[] = [], action: FbListActionTypes): UndoableFramebuf[] {
    switch (action.type) {
    case ADD_FRAMEBUF:
      return state.concat(reducer(undefined, action));
    case REMOVE_FRAMEBUF: {
      const { index } = action as FbListRemoveAction;
      return fp.arrayRemoveAt(state, index);
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

export const actions = {
  addFramebuf: () => {
    return {
      type: ADD_FRAMEBUF
    } as FbListAddAction;
  },
  removeFramebuf: (index: number) => {
    return {
      type: REMOVE_FRAMEBUF,
      index
    } as FbListRemoveAction;
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
