
export const SELECT_CHAR = 'SELECT_CHAR'
export const SET_FRAMEBUF_CHAR = 'SET_FRAMEBUF_CHAR'

export function selectChar({row, col}) {
  return {
    type: SELECT_CHAR,
    data: { row, col }
  }
}

export function setFramebufChar({row, col, screencode}) {
  return {
    type: SET_FRAMEBUF_CHAR,
    data: { row, col, screencode }
  }
}
