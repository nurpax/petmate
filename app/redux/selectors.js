export const getCurrentFramebuf = (state) => {
  return state.framebufList[state.toolbar.framebufIndex].present
}
