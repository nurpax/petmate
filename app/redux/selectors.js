
// TODO memoize

export const getScreens = (state) => {
  return state.screens.list
}

export const getCurrentScreenIndex = (state) => {
  return state.screens.current
}

export const getCurrentScreenFramebufIndex = (state) => {
  const idx = getCurrentScreenIndex(state)
  const screens = getScreens(state)
  if (idx !== null && idx < screens.length) {
    return screens[idx]
  }
  return null
}

export const getFramebufByIndex = (state, idx) => {
  if (idx !== null && idx < state.framebufList.length) {
    return state.framebufList[idx].present
  }
  return null
}

export const getCurrentFramebuf = (state) => {
  return getFramebufByIndex(state, getCurrentScreenFramebufIndex(state))
}

export const getSettings = (state) => {
  return state.settings['saved']
}

export const getSettingsEditing = (state) => {
  return state.settings['editing']
}

export const getSettingsPaletteRemap = (state) => {
  const idx = state.toolbar.selectedPaletteRemap
  if (idx === undefined) {
    return undefined
  }
  const palettes = getSettings(state).palettes
  if (idx >= palettes.length) {
    console.error('trying to use an undefined palette idx', idx)
    return undefined
  }
  return palettes[idx]
}
