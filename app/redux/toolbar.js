
import { bindActionCreators } from 'redux'

import { settable, reduxSettables} from './settable'

const settables = reduxSettables([
  settable('Toolbar', 'textColor', 14),
  settable('Toolbar', 'selectedChar', {row: 0, col: 0})
])

export class Toolbar {
  static CLEAR_CANVAS = `${Toolbar.name}/CLEAR_CANVAS`
  static INC_UNDO_ID = `${Toolbar.name}/INC_UNDO_ID`

  static actions = {
    ...settables.actions,
    incUndoId: () => {
      return {
        type: Toolbar.INC_UNDO_ID
      }
    },
    clearCanvas: () => {
      return {
        type: Toolbar.CLEAR_CANVAS,
        data: {}
      }
    }
  }

  static reducer(state = {
      ...settables.initialValues,
      undoId: 0
    }, action) {
    switch (action.type) {
      case Toolbar.INC_UNDO_ID:
        return {
          ...state,
          undoId: state.undoId+1
        }
      // CLEAR_CANVAS is routed to the framebuf reducer
      default:
        return settables.reducer(state, action)
    }
  }

  static bindDispatch (dispatch) {
    return bindActionCreators(Toolbar.actions, dispatch)
  }
}
