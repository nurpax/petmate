
import { Action } from 'redux'
import { ThunkAction } from 'redux-thunk';

import { electron, path, fs } from '../utils/electronImports'

import {
  ActionsUnion,
  DispatchPropsFromActions,
  createAction,
  Settings as RSettings,
  EditSaved,
  EditBranch,
  PaletteName,
  RootState
} from './types'
import * as fp from '../utils/fp'

type SettingsJson = any;

const LOAD = 'LOAD'
const SET_PALETTE = 'SET_PALETTE'
const SAVE_EDITS = 'SAVE_EDITS'
const CANCEL_EDITS = 'CANCEL_EDITS'
const SET_SELECTED_COLOR_PALETTE = 'SET_SELECTED_COLOR_PALETTE'
const SET_INTEGER_SCALE = 'SET_INTEGER_SCALE'

//const CONFIG_FILE_VERSION = 1

const initialState: RSettings = {
  palettes: fp.mkArray(4, () => fp.mkArray(16, i => i)),
  selectedColorPalette: 'petmate',
  integerScale: false
}

function saveSettings(settings: RSettings) {
  let settingsFile = path.join(electron.remote.app.getPath('userData'), 'Settings')
  const j = JSON.stringify(settings)
  fs.writeFileSync(settingsFile, j, 'utf-8')
}

// Load settings from a JSON doc.  Handle version upgrades.
function fromJson(json: SettingsJson): RSettings {
  let version = undefined
  if (json.version === undefined || json.version === 1) {
    version = 1
  }
  if (version !== 1) {
    console.error('TODO upgrade settings format!')
  }
  const init = initialState
  return {
    palettes: json.palettes === undefined ? init.palettes : json.palettes,
    selectedColorPalette: json.selectedColorPalette === undefined ? init.selectedColorPalette : json.selectedColorPalette,
    integerScale: fp.maybeDefault(json.integerScale, false)
  }
}

function saveEdits (): ThunkAction<void, RootState, undefined, Action> {
  return (dispatch, _getState) => {
    dispatch(actions.saveEditsAction());
    dispatch((_dispatch, getState) => {
      const state = getState().settings
      saveSettings(state.saved)
    })
  }
}

interface BranchArgs {
  branch: EditBranch;
}

interface SetPaletteArgs extends BranchArgs {
  idx: number;
  palette: number[];
}

interface SetSelectedColorPaletteNameArgs extends BranchArgs {
  name: PaletteName;
}

interface SetIntegerScaleArgs extends BranchArgs {
  scale: boolean;
}

const actionCreators = {
  load: (data: SettingsJson) => createAction(LOAD, fromJson(data)),
  saveEditsAction: () => createAction(SAVE_EDITS),
  cancelEdits: () => createAction(CANCEL_EDITS),
  setPalette: (data: SetPaletteArgs) => createAction(SET_PALETTE, data),
  setSelectedColorPaletteName: (data: SetSelectedColorPaletteNameArgs) => createAction(SET_SELECTED_COLOR_PALETTE, data),
  setIntegerScale: (data: SetIntegerScaleArgs) => createAction(SET_INTEGER_SCALE, data)
};

type Actions = ActionsUnion<typeof actionCreators>

export const actions = {
  ...actionCreators,
  saveEdits,
};

export type PropsFromDispatch = DispatchPropsFromActions<typeof actions>;

function updateBranch(
  state:  EditSaved<RSettings>,
  branch: EditBranch,
  field:  Partial<RSettings>
): EditSaved<RSettings> {
  const s: RSettings = state[branch];
  return {
    ...state,
    [branch]: {
      ...s,
      ...field
    }
  }
}

export function reducer(
  state: EditSaved<RSettings> = {
    editing: initialState, // form state while editing
    saved: initialState    // final state for rest of UI and persistence
  },
  action: Actions
): EditSaved<RSettings> {
  switch (action.type) {
    case LOAD:
      let newSaved = action.data
      return {
        saved: newSaved,
        editing: newSaved
      }
    case SAVE_EDITS:
      return {
        ...state,
        saved: state.editing
      }
    case CANCEL_EDITS:
      return {
        ...state,
        editing: state.saved
      }
    case SET_PALETTE:
      const branch: EditBranch = action.data.branch;
      return updateBranch(state, action.data.branch, {
        palettes: fp.arraySet(state[branch].palettes, action.data.idx, action.data.palette)
      });
    case SET_INTEGER_SCALE: {
      return updateBranch(state, action.data.branch, {
        integerScale: action.data.scale
      });
    }
    case SET_SELECTED_COLOR_PALETTE: {
      return updateBranch(state, action.data.branch, {
        selectedColorPalette: action.data.name
      });
    }
    default:
      return state;
  }
}
