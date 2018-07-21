
const uppercaseFirstChar = (str) => str.replace(/^\w/, c => c.toUpperCase())

class Settable {
  constructor (scope, name, initialValue) {
    this.initialValue = initialValue
    this.scope = scope
    this.name = name
    this.type =  `${scope}/SET_${name.toUpperCase()}`
  }

  static actions (settables) {
    return settables.reduce((acc, s) => {
      return {
        ...acc,
        [`set${uppercaseFirstChar(s.name)}`]: (v, framebufIndex) => {
          return {
            type: s.type,
            data: v,
            undoId: null,
            framebufIndex
          }
        }
      }
    }, {})
  }

  static initialValues (settables) {
    return settables.reduce((acc, s) => {
      return {
        ...acc,
        [s.name]: s.initialValue
      }
    }, {})
  }
}

export const settable = (scope, name, init) => {
  return new Settable(scope, name, init)
}

export const reduxSettables = (lst) => {
  return {
    actions: Settable.actions(lst),
    initialValues: Settable.initialValues(lst),
    reducer: (state, action) => {
      const r = lst.find((s) => s.type === action.type)
      if (r !== undefined) {
        return {
          ...state,
          [r.name]: action.data
        }
      }
      return state
    }
  }
}
