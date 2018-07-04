
import { bindActionCreators } from 'redux'

export class Toolbar {
  static CLEAR_CANVAS = `${Toolbar.name}/CLEAR_CANVAS`
  static INC_UNDO_ID = `${Toolbar.name}/INC_UNDO_ID`

  static actions = {
    clearCanvas: () => {
      return {
        type: Toolbar.CLEAR_CANVAS,
        data: {}
      }
    },
    incUndoId: () => {
      return {
        type: Toolbar.INC_UNDO_ID
      }
    }
  }

  static reducer(state = {
      undoId: 0,
    }, action) {
    switch (action.type) {
      case Toolbar.INC_UNDO_ID:
        return {
          ...state,
          undoId: state.undoId+1
        }
      // CLEAR_CANVAS is routed to the framebuf reducer
      default:
        return state;
    }
  }

  static bindDispatch (dispatch) {
    return bindActionCreators(Toolbar.actions, dispatch)
  }
}
