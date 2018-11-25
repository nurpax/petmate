
// Make a new array and initialize with f(idx)
export const mkArray = <T>(n: number, f: (idx: number) => T): T[] => {
  let arr = Array(n).fill(0)
  for (let i = 0; i < n; i++) {
    arr[i] = f(i)
  }
  return arr
}

export const arraySet = <T>(arr: T[], idx: number, newVal: T): T[] => {
  return arr.map((v,i) => {
    if (i === idx) {
      return newVal
    }
    return v
  })
}

export const arrayInsertAt = <T>(arr: T[], idx: number, val: T): T[] => {
  return [...arr.slice(0, idx), val, ...arr.slice(idx)]
}

export const arrayRemoveAt = <T>(arr: T[], idx: number): T[] => {
  return [...arr.slice(0, idx), ...arr.slice(idx + 1)]
}

export const maybeDefault = <T>(val: (T | undefined | null), defaultVal: T): T => {
  if (val === undefined || val === null) {
    return defaultVal;
  }
  return val;
}

export const maybe = <T, S>(val: (T | undefined | null), defaultVal: S, f: (v: T) => S): S => {
  if (val === undefined || val === null) {
    return defaultVal
  }
  return f(val)
}
