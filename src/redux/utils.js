
function injectFramebufIndex(stateProps, dispatchProps) {
  let newDispatch = {}
  Object.keys(dispatchProps).map(key => {
    const c = dispatchProps[key]
    if (typeof c === 'function') {
      newDispatch[key] = (...args) => {
        c(...args, stateProps.framebufIndex)
      }
    } else {
      newDispatch[key] = {}
      const children = c
      Object.keys(children).map(ck => {
        const f = children[ck]
        newDispatch[key][ck] = (...args) => {
          f(...args, stateProps.framebufIndex)
        }
      })
    }
  })
  return newDispatch
}

export const framebufIndexMergeProps = (stateProps, dispatchProps, ownProps) => {
  return {
    ...ownProps,
    ...stateProps,
    ...injectFramebufIndex(stateProps, dispatchProps)
  }
}

export const makeScreenName = (idx) => {
  const str = `${idx + 1}`
  return `screen_${str.padStart(3, '0')}`
}
