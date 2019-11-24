
import memoize  from 'fast-memoize'
import {
  charScreencodeFromRowCol,
  rowColFromScreencode,
  systemFontData,
  systemFontDataLower,
  charOrderUpper,
  charOrderLower } from '../utils'

import { RootState, Font, Framebuf, Coord2, Transform, Brush, FramebufUIState } from './types'
import { mirrorBrush, findTransformedChar } from './brush'
import { CHARSET_UPPER, CHARSET_LOWER } from './editor'

import { getCurrentScreenFramebufIndex } from './screensSelectors'
import { CustomFonts } from './customFonts'

export const getFramebufByIndex = (state: RootState, idx: number | null) => {
  if (idx !== null && idx < state.framebufList.length) {
    return state.framebufList[idx].present
  }
  return null;
}

export const getCurrentFramebuf = (state: RootState) => {
  return getFramebufByIndex(state, getCurrentScreenFramebufIndex(state))
}

export const getROMFontBits = (charset: string): Font => {
  if (charset !== CHARSET_UPPER && charset !== CHARSET_LOWER) {
    throw new Error(`unknown charset ${charset}`);
  }
  if (charset === CHARSET_LOWER) {
    return {
      bits: systemFontDataLower,
      charOrder: charOrderLower,
    };
  } else {
    return {
      bits: systemFontData,
      charOrder: charOrderUpper,
    };
  }
}

// getFontBits returns a new object every time it's called.  This causes
// serious cache invalidates in rendering the canvas (since it thinks the font
// changed).  So memoize the returned object from getFontBits in case it's
// called with the same value.
const getROMFontBitsMemoized = memoize(getROMFontBits)

export const getFramebufFont = (state: RootState, framebuf: Framebuf): { charset: string, font: Font } => {
  if (framebuf.charset === CHARSET_UPPER || framebuf.charset === CHARSET_LOWER) {
    return {
      charset: framebuf.charset,
      font: getROMFontBitsMemoized(framebuf.charset)
    };
  }
  return {
    charset: framebuf.charset,
    font: state.customFonts[framebuf.charset].font
  };
}

export const getCurrentFramebufFont = (state: RootState) => {
  const fb = getCurrentFramebuf(state)
  if (!fb) {
    return {
      charset: CHARSET_UPPER,
      font: getROMFontBits(CHARSET_UPPER)
    };
  }
  return getFramebufFont(state, fb);
}

export function getCustomFonts (state: RootState): CustomFonts {
  return state.customFonts;
}

const rowColFromScreencodeMemoized_ = (f: Font, sc: number) => rowColFromScreencode(f, sc)
const rowColFromScreencodeMemoized = memoize(rowColFromScreencodeMemoized_)

const computeScreencodeWithTransform = (rowcol: Coord2, font: Font, transform: Transform) => {
  const sc = charScreencodeFromRowCol(font, rowcol)
  return findTransformedChar(font, sc!, transform)
}
const computeScreencodeWithTransformMemoized = memoize(computeScreencodeWithTransform)
export const getScreencodeWithTransform = (rowcol: Coord2, font: Font, transform: Transform) => {
  return computeScreencodeWithTransformMemoized(rowcol, font, transform)
}

export const getCharRowColWithTransform = (rowcol: Coord2, font: Font, transform: Transform) => {
  const char = getScreencodeWithTransform(rowcol, font, transform)
  return rowColFromScreencodeMemoized(font, char)
}

const transformBrushMemoized = memoize(mirrorBrush)
export const transformBrush = (brush: Brush, transform: Transform, font: Font) => {
  return transformBrushMemoized(brush, transform, font)
}

export const getFramebufUIState = (state: RootState, framebufIndex: number|null): FramebufUIState|undefined => {
  if (framebufIndex == null) {
    return undefined;
  }
  return state.toolbar.framebufUIState[framebufIndex];
}

// Are there any unsaved changes in the workspace?
export function anyUnsavedChanges (state: RootState): boolean {
  if (state.lastSavedSnapshot.screenList !== state.screens.list) {
    return true;
  }
  const lastSavedFbs = state.lastSavedSnapshot.framebufs;
  for (let i = 0; i < lastSavedFbs.length; i++) {
    if (lastSavedFbs[i] !== state.framebufList[i].present) {
      return true;
    }
  }
  return false;
}

// Are there any unsaved changes in a particular framebuf?
export function anyUnsavedChangesInFramebuf (state: RootState, fbIndex: number): boolean {
  const lastSavedFbs = state.lastSavedSnapshot.framebufs;
  if (fbIndex < lastSavedFbs.length) {
    return lastSavedFbs[fbIndex] !== state.framebufList[fbIndex].present
  }
  // FB didn't exist on last save, so interpret it as changed.
  // This sort of gives false positives for newly added screens
  // that haven't been touched yet but didn't exist on last save.
  return true;
}
