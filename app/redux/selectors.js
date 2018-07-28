
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
