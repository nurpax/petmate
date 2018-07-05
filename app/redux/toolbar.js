
import { bindActionCreators } from 'redux'

export class Toolbar {
  static CLEAR_CANVAS = `${Toolbar.name}/CLEAR_CANVAS`
  static INC_UNDO_ID = `${Toolbar.name}/INC_UNDO_ID`
  static SET_TEXT_COLOR = `${Toolbar.name}/SET_TEXT_COLOR`

  static actions = {
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
    },
    setTextColor: (idx) => {
      return {
        type: Toolbar.SET_TEXT_COLOR,
        data: { color: idx }
      }
    }
  }

  static reducer(state = {
      undoId: 0,
      textColor: 14
    }, action) {
    switch (action.type) {
      case Toolbar.INC_UNDO_ID:
        return {
          ...state,
          undoId: state.undoId+1
        }
      case Toolbar.SET_TEXT_COLOR:
        return {
          ...state,
          textColor: action.data.color
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
