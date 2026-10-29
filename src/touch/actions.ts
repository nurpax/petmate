// Touch UI actions that the desktop build triggers with keyboard shortcuts.

import { Toolbar } from '../redux/toolbar'
import * as selectors from '../redux/selectors'
import { RootStateThunk, Tool } from '../redux/types'

export type CharTransformKind = 'mirrorX' | 'mirrorY' | 'rotate' | 'invert';

// Same as the H, V, R and F shortcuts: transform the brush when the brush
// tool is active, otherwise the current character.
export function transformCharOrBrush(kind: CharTransformKind): RootStateThunk {
  return (dispatch, getState) => {
    const brushActive = getState().toolbar.selectedTool === Tool.Brush;
    switch (kind) {
      case 'mirrorX':
        dispatch(brushActive ?
          Toolbar.actions.mirrorBrush(Toolbar.MIRROR_X) :
          Toolbar.actions.mirrorChar(Toolbar.MIRROR_X));
        break;
      case 'mirrorY':
        dispatch(brushActive ?
          Toolbar.actions.mirrorBrush(Toolbar.MIRROR_Y) :
          Toolbar.actions.mirrorChar(Toolbar.MIRROR_Y));
        break;
      case 'rotate':
        dispatch(brushActive ? Toolbar.actions.rotateBrush() : Toolbar.actions.rotateChar());
        break;
      case 'invert':
        dispatch(Toolbar.actions.invertChar());
        break;
    }
  }
}

// Pick up the character and color under the cursor (cursor mode).
export function pickAtCursor(): RootStateThunk {
  return (dispatch, getState) => {
    const state = getState();
    const fb = selectors.getCurrentFramebuf(state);
    const { row, col } = state.toolbar.cursorPos;
    if (fb === null || row < 0 || row >= fb.height || col < 0 || col >= fb.width) {
      return;
    }
    dispatch(Toolbar.actions.setCurrentScreencodeAndColor(fb.framebuf[row][col]));
  }
}

// Move the cursor by (dx, dy) cells, clamped to the screen.
export function moveCursor(dx: number, dy: number): RootStateThunk {
  return (dispatch, getState) => {
    const state = getState();
    const fb = selectors.getCurrentFramebuf(state);
    if (fb === null) {
      return;
    }
    const { row, col } = state.toolbar.cursorPos;
    dispatch(Toolbar.actions.setCursorPos({
      row: Math.max(0, Math.min(fb.height - 1, row + dy)),
      col: Math.max(0, Math.min(fb.width - 1, col + dx))
    }));
  }
}
