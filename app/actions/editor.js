export const SELECT_CHAR = 'SELECT_CHAR'

export function selectChar(row, col) {
  return {
    type: SELECT_CHAR,
    data: { row, col }
  }
}

