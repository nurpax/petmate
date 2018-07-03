
import { SELECT_CHAR } from '../actions/editor';

export default function editor(state = {
    selected: {
      row: 0,
      col: 0
    }
  }, action) {
  switch (action.type) {
    case SELECT_CHAR:
      return {
        ...state,
        selected: {
          row: action.data.row,
          col: action.data.col,
        }
      }
    default:
      return state;
  }
}
