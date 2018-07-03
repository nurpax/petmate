
import { bindActionCreators } from 'redux'

export class Toolbar {
  static CLEAR_CANVAS = `${Toolbar.name}/CLEAR_CANVAS`

  static actions = {
    clearCanvas: () => {
      return {
        type: Toolbar.CLEAR_CANVAS,
        data: {}
      }
    }
  }

  static reducer(state = {
    }, action) {
    switch (action.type) {
      // CLEAR_CANVAS is routed to the framebuf reducer
      default:
        return state;
    }
  }

  static bindDispatch (dispatch) {
    return bindActionCreators(Toolbar.actions, dispatch)
  }
}
