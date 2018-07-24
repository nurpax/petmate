
// TODO memoize

export const getScreens = (state) => {
  return state.screens.list
}

export const getCurrentScreenIndex = (state) => {
  return state.screens.current
}

export const getCurrentScreenFramebufIndex = (state) => {
  return getScreens(state)[getCurrentScreenIndex(state)]
}

export const getFramebufByIndex = (state, idx) => {
  return state.framebufList[idx].present
}

export const getCurrentFramebuf = (state) => {
  return getFramebufByIndex(state, getCurrentScreenFramebufIndex(state))
}
