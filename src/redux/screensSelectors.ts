import { RootState } from './types'

export function getScreens(state: RootState) {
  return state.screens.list
}

export function getCurrentScreenIndex(state: RootState) {
  return state.screens.current
}

export function getCurrentScreenFramebufIndex(state: RootState) {
  const idx = getCurrentScreenIndex(state)
  const screens = getScreens(state)
  if (idx !== null && idx < screens.length) {
    return screens[idx]
  }
  return null;
}

