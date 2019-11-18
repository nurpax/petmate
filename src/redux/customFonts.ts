
import { Font } from './types';
import { ActionsUnion, createAction, DispatchPropsFromActions } from './typeUtils'

const ADD_CUSTOM_FONT = 'ADD_CUSTOM_FONT'

interface AddCustomFontArgs {
  id: string;
  name: string;
  font: Font;
};

const actionCreators = {
  addCustomFont: (id: string, name: string, font: Font) => createAction(ADD_CUSTOM_FONT, { id, name, font  } as AddCustomFontArgs)
};

export const actions = {
  ...actionCreators,
}

export type Actions = ActionsUnion<typeof actionCreators>;
export type PropsFromDispatch = DispatchPropsFromActions<typeof actions>;
export type CustomFonts = { [id: string]: { font: Font, name: string } };

export function reducer(state: CustomFonts = {}, action: Actions): CustomFonts {
  switch (action.type) {
  case ADD_CUSTOM_FONT:
    // TODO handle existing name
    return {
      ...state,
      [action.data.id]: {
        name: action.data.name,
        font: action.data.font
      }
    }
  default:
    return state
  }
}
