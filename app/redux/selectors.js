export const getCurrentFramebuf = (state) => {
  return state.framebufList[state.toolbar.framebufIndex].present
}

export const getFramebufByIndex = (state, idx) => {
  return state.framebufList[idx].present
}
