
import { RootState, Settings, PaletteName } from './types'
import { colorPalettes } from '../utils'

export function getSettings(state: RootState): Settings {
  return state.settings['saved']
}

export const getSettingsEditing = (state: RootState) => {
  return state.settings['editing']
}

export const getSettingsPaletteRemap = (state: RootState) => {
  const idx = state.toolbar.selectedPaletteRemap
  const palettes = getSettings(state).palettes
  if (idx >= palettes.length) {
    throw new Error(`trying to use an undefined palette idx=${idx}`);
  }
  return palettes[idx]
}

export const getSettingsColorPaletteByName = (_state: RootState, name: PaletteName) => {
  return colorPalettes[name];
}

export const getSettingsCurrentColorPalette = (state: RootState) => {
  const settings = getSettings(state)
  return getSettingsColorPaletteByName(state, settings.selectedColorPalette)
}

export const getSettingsIntegerScale = (state: RootState) => {
  const settings = getSettings(state)
  return settings.integerScale
}

export const getSettingsEditingCurrentColorPalette = (state: RootState) => {
  const settings = getSettingsEditing(state)
  return getSettingsColorPaletteByName(state, settings.selectedColorPalette)
}

