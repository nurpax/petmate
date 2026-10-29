// Browser build: keep the workspace in localStorage so that closing the tab,
// reloading or iOS evicting the PWA from memory doesn't lose any work.  In
// the browser, "Save" can only download a copy of the file, so this is what
// actually keeps the user's work around between sessions.

import { Store } from 'redux'

import { RootState } from '../redux/types'
import * as workspace from '../redux/workspace'
import * as Screens from '../redux/screens'
import { Toolbar } from '../redux/toolbar'
import * as selectors from '../redux/selectors'
import * as screensSelectors from '../redux/screensSelectors'
import { workspaceToJson, setWorkspaceFilenameWithTitle } from '.'

const AUTOSAVE_KEY = 'petmate.autosave'
const AUTOSAVE_DELAY_MS = 1000

interface Autosave {
  workspace: string;
  filename: string|null;
  currentScreen: number;
}

// Returns true if an autosaved workspace was restored.
export function restore(dispatch: any): boolean {
  let saved: Autosave
  try {
    const json = window.localStorage.getItem(AUTOSAVE_KEY)
    if (json === null) {
      return false
    }
    saved = JSON.parse(json)
    dispatch(workspace.load(JSON.parse(saved.workspace)))
  } catch (e) {
    console.error('failed to restore autosaved workspace', e)
    return false
  }
  dispatch(Screens.actions.setCurrentScreenIndex(saved.currentScreen))
  if (saved.filename !== null) {
    setWorkspaceFilenameWithTitle(
      (fname: string) => dispatch(Toolbar.actions.setWorkspaceFilename(fname)),
      saved.filename
    )
  }
  return true
}

function save(state: RootState) {
  const screens = screensSelectors.getScreens(state)
  const content: Autosave = {
    workspace: workspaceToJson(
      screens,
      (idx: number) => selectors.getFramebufByIndex(state, idx)!,
      selectors.getCustomFonts(state)
    ),
    filename: state.toolbar.workspaceFilename,
    currentScreen: screensSelectors.getCurrentScreenIndex(state)
  }
  try {
    window.localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(content))
  } catch (e) {
    console.error('autosave failed', e)
  }
}

export function start(store: Store<RootState>) {
  let timer: number|null = null
  let prev: RootState|null = null

  const flush = () => {
    if (timer !== null) {
      window.clearTimeout(timer)
      timer = null
      save(store.getState())
    }
  }

  store.subscribe(() => {
    const state = store.getState()
    if (prev !== null &&
      prev.framebufList === state.framebufList &&
      prev.screens === state.screens &&
      prev.customFonts === state.customFonts &&
      prev.toolbar.workspaceFilename === state.toolbar.workspaceFilename) {
      return
    }
    prev = state
    if (timer !== null) {
      window.clearTimeout(timer)
    }
    timer = window.setTimeout(() => {
      timer = null
      save(store.getState())
    }, AUTOSAVE_DELAY_MS)
  })

  // iOS may kill a backgrounded PWA without further notice.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      flush()
    }
  })
  window.addEventListener('pagehide', flush)
}
