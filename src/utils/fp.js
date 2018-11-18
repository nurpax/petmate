
// Make a new array and initialize with f(idx)
export const mkArray = (n, f) => {
  let arr = Array(n).fill()
  for (let i = 0; i < n; i++) {
    arr[i] = f(i)
  }
  return arr
}

export const arraySet = (arr, idx, newVal) => {
  return arr.map((v,i) => {
    if (i == idx) {
      return newVal
    }
    return v
  })
}

export const arrayInsertAt = (arr, idx, val) => {
  return [...arr.slice(0, idx), val, ...arr.slice(idx)]
}

export const arrayRemoveAt = (arr, idx) => {
  return [...arr.slice(0, idx), ...arr.slice(idx + 1)]
}

export const maybeDefault = (val, defaultVal) => {
  if (val === undefined || val === null) {
    return defaultVal
  }
  return val
}

export const maybe = (val, defaultVal, f) => {
  if (val === undefined || val === null) {
    return defaultVal
  }
  return f(val)
}
