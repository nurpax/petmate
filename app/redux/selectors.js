
// TODO memoize

export const getCurrentFramebufIndex = (state) => {
  return state.toolbar.framebufIndex
}

export const getCurrentFramebuf = (state) => {
  const elt = state.framebufList.list[getCurrentFramebufIndex(state)]
  return {
    id: elt.id,
    ...elt.present
  }
}

export const getFramebufByIndex = (state, idx) => {
  const elt = state.framebufList.list[idx]
  return {
    id: elt.id,
    ...elt.present
  }
}

export const getFramebufs = (state) => {
  return state.framebufList.list.map(elt => {
    return {
      id: elt.id,
      ...elt.present
    }
  })
}
