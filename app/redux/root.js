
export const RESET_STATE = 'RESET_STATE'
export const LOAD_WORKSPACE = 'LOAD_WORKSPACE'

export const actions = {
  loadWorkspace: (data) => {
    return {
      type: LOAD_WORKSPACE,
      data
    }
  },
  resetState: () => {
    return {
      type: RESET_STATE
    }
  }
}
