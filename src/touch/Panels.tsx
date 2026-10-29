import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import classnames from 'classnames'

import CharGrid from '../components/CharGrid'
import { Toolbar } from '../redux/toolbar'
import { Framebuffer, DEFAULT_BACKGROUND_COLOR } from '../redux/editor'
import * as selectors from '../redux/selectors'
import * as screensSelectors from '../redux/screensSelectors'
import { getSettingsCurrentColorPalette, getSettingsPaletteRemap } from '../redux/settingsSelectors'
import { RootState, Tool, Font, Rgb, Coord2 } from '../redux/types'
import * as utils from '../utils'
import * as fp from '../utils/fp'

import { transformCharOrBrush, pickAtCursor, moveCursor, CharTransformKind } from './actions'
import * as icons from './icons'
import styles from './Touch.module.css'

//---------------------------------------------------------------------
// Helpers

export function useElementSize<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [size, setSize] = useState<{ width: number, height: number } | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (el === null) {
      return;
    }
    const ro = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      setSize({ width, height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return { ref, size };
}

// A single character drawn at `size` pixels.
export function CharTile (props: {
  code: number,
  color: number,
  backgroundColor: number,
  font: Font,
  colorPalette: Rgb[],
  size: number
}) {
  const { code, color, font, colorPalette, size } = props;
  const framebuf = useMemo(() => [[{ code, color }]], [code, color]);
  const bg = utils.colorIndexToCssRgb(colorPalette, props.backgroundColor);
  return (
    <div style={{
      width: 8, height: 8,
      transform: `scale(${size / 8})`, transformOrigin: '0 0',
      position: 'relative'
    }}>
      <CharGrid
        width={1}
        height={1}
        grid={false}
        backgroundColor={bg}
        framebuf={framebuf}
        font={font}
        colorPalette={colorPalette}
      />
    </div>
  );
}

function currentCharState (state: RootState) {
  const { font, charset } = selectors.getCurrentFramebufFont(state);
  const fb = selectors.getCurrentFramebuf(state);
  return {
    font,
    charset,
    colorPalette: getSettingsCurrentColorPalette(state),
    textColor: state.toolbar.textColor,
    backgroundColor: fb ? fb.backgroundColor : DEFAULT_BACKGROUND_COLOR,
    screencode: selectors.getScreencodeWithTransform(state.toolbar.selectedChar, font, state.toolbar.charTransform)
  };
}

//---------------------------------------------------------------------
// Hold-or-toggle modifier button (stands in for the Alt and Shift keys)
//
// A quick tap latches the modifier on or off.  Pressing and holding keeps
// it on only while held, so on an iPad it can be held with one hand while
// drawing with the other.

const HOLD_MS = 300;

function ModifierButton (props: {
  active: boolean,
  setActive: (flag: boolean) => void,
  label: string,
  className: string,
  activeClassName: string,
  children: React.ReactNode
}) {
  const down = useRef<{ time: number, wasActive: boolean } | null>(null);
  const handleDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    down.current = { time: Date.now(), wasActive: props.active };
    props.setActive(true);
  };
  const handleUp = () => {
    if (down.current === null) {
      return;
    }
    const { time, wasActive } = down.current;
    down.current = null;
    props.setActive(Date.now() - time < HOLD_MS ? !wasActive : false);
  };
  return (
    <button
      aria-label={props.label}
      aria-pressed={props.active}
      className={classnames(props.className, props.active ? props.activeClassName : null)}
      style={{ touchAction: 'none' }}
      onPointerDown={handleDown}
      onPointerUp={handleUp}
      onPointerCancel={handleUp}
    >
      {props.children}
    </button>
  );
}

//---------------------------------------------------------------------
// Tools

const tools = [
  { tool: Tool.Draw, label: 'Draw', Icon: icons.DrawIcon },
  { tool: Tool.Colorize, label: 'Color', Icon: icons.ColorizeIcon },
  { tool: Tool.CharDraw, label: 'Char', Icon: icons.CharIcon },
  { tool: Tool.Brush, label: 'Brush', Icon: icons.BrushIcon },
  { tool: Tool.Text, label: 'Text', Icon: icons.TextIcon }
];

function ToolButtons_ (props: {
  vertical: boolean,
  selectedTool: Tool,
  altKey: boolean,
  shiftKey: boolean,
  Toolbar: any
}) {
  const buttons = tools.map(({ tool, label, Icon }) =>
    <button
      key={tool}
      className={classnames(styles.tool, props.selectedTool === tool ? styles.on : null)}
      aria-pressed={props.selectedTool === tool}
      onClick={() => {
        if (tool === props.selectedTool && tool === Tool.Brush) {
          // Tapping the active brush tool again drops the current brush
          // (Esc on desktop).
          props.Toolbar.resetBrush();
        }
        props.Toolbar.setSelectedTool(tool);
      }}
    >
      <Icon size={24} />{label}
    </button>
  );
  if (!props.vertical) {
    return <div className={styles.toolBar}>{buttons}</div>;
  }
  return (
    <div className={styles.toolRail}>
      {buttons}
      <div className={styles.railSpacer} />
      <div className={styles.railLabel}>HOLD</div>
      <ModifierButton
        label='Pick character and color'
        active={props.altKey}
        setActive={props.Toolbar.setAltKey}
        className={classnames(styles.tool)}
        activeClassName={styles.held}
      >
        <icons.PickIcon size={24} />Pick
      </ModifierButton>
      <ModifierButton
        label='Axis lock'
        active={props.shiftKey}
        setActive={props.Toolbar.setShiftKey}
        className={classnames(styles.tool)}
        activeClassName={styles.held}
      >
        <icons.AxisLockIcon size={24} />Axis
      </ModifierButton>
    </div>
  );
}

export const ToolButtons = connect(
  (state: RootState) => ({
    selectedTool: state.toolbar.selectedTool,
    altKey: state.toolbar.altKey,
    shiftKey: state.toolbar.shiftKey
  }),
  dispatch => ({ Toolbar: Toolbar.bindDispatch(dispatch) })
)(ToolButtons_)

//---------------------------------------------------------------------
// Current char + char transforms (mirror, invert, rotate)

const charTransforms: { kind: CharTransformKind, label: string, Icon: (p: { size?: number }) => JSX.Element }[] = [
  { kind: 'mirrorX', label: 'Mirror horizontally', Icon: icons.MirrorXIcon },
  { kind: 'mirrorY', label: 'Mirror vertically', Icon: icons.MirrorYIcon },
  { kind: 'invert', label: 'Invert', Icon: icons.InvertIcon },
  { kind: 'rotate', label: 'Rotate', Icon: icons.RotateIcon }
];

function CharActions_ (props: ReturnType<typeof currentCharState> & {
  // Phone layout: the Pick and Axis modifiers live here instead of the
  // tool rail.
  showModifiers: boolean,
  altKey: boolean,
  shiftKey: boolean,
  Toolbar: any,
  transform: (kind: CharTransformKind) => void
}) {
  return (
    <div className={styles.charActions}>
      <div className={styles.charChip} aria-label={`Current character $${props.screencode.toString(16)}`}>
        <CharTile
          code={props.screencode}
          color={props.textColor}
          backgroundColor={props.backgroundColor}
          font={props.font}
          colorPalette={props.colorPalette}
          size={44}
        />
      </div>
      <div className={styles.divider} />
      {charTransforms.map(({ kind, label, Icon }) =>
        <button key={kind} className={styles.iconButton} aria-label={label} onClick={() => props.transform(kind)}>
          <Icon />
        </button>
      )}
      <div className={styles.spacer} />
      {props.showModifiers ?
        <>
          <ModifierButton
            label='Axis lock'
            active={props.shiftKey}
            setActive={props.Toolbar.setShiftKey}
            className={styles.iconButton}
            activeClassName={styles.accentOn}
          >
            <icons.AxisLockIcon />
          </ModifierButton>
          <ModifierButton
            label='Pick character and color'
            active={props.altKey}
            setActive={props.Toolbar.setAltKey}
            className={styles.iconButton}
            activeClassName={styles.accentOn}
          >
            <icons.PickIcon />
          </ModifierButton>
        </> :
        null}
    </div>
  );
}

export const CharActions = connect(
  (state: RootState) => ({
    ...currentCharState(state),
    altKey: state.toolbar.altKey,
    shiftKey: state.toolbar.shiftKey
  }),
  (dispatch: any) => ({
    Toolbar: Toolbar.bindDispatch(dispatch),
    transform: (kind: CharTransformKind) => dispatch(transformCharOrBrush(kind))
  })
)(CharActions_)

//---------------------------------------------------------------------
// Palette

function Palette_ (props: {
  grid: boolean,
  colorPalette: Rgb[],
  paletteRemap: number[],
  textColor: number,
  setCurrentColor: (c: number) => void
}) {
  return (
    <div className={props.grid ? styles.paletteGrid : styles.palette}>
      {props.paletteRemap.map(idx =>
        <button
          key={idx}
          aria-label={`Color ${idx}`}
          aria-pressed={idx === props.textColor}
          className={idx === props.textColor ? styles.selected : undefined}
          style={{ backgroundColor: utils.colorIndexToCssRgb(props.colorPalette, idx) }}
          onClick={() => props.setCurrentColor(idx)}
        />
      )}
    </div>
  );
}

export const Palette = connect(
  (state: RootState) => ({
    colorPalette: getSettingsCurrentColorPalette(state),
    paletteRemap: getSettingsPaletteRemap(state),
    textColor: state.toolbar.textColor
  }),
  dispatch => ({ setCurrentColor: Toolbar.bindDispatch(dispatch).setCurrentColor })
)(Palette_)

//---------------------------------------------------------------------
// Character picker

const charsetNames = [
  { id: 'upper', name: 'C64 ABC' },
  { id: 'lower', name: 'C64 abc' },
  { id: 'petUpper', name: 'PET ABC' },
  { id: 'petLower', name: 'PET abc' }
];

function CharPicker_ (props: ReturnType<typeof currentCharState> & {
  selected: Coord2,
  customFonts: { id: string, name: string }[],
  framebufIndex: number | null,
  onPicked?: () => void,
  setCurrentChar: (pos: Coord2) => void,
  setCharset: (charset: string, framebufIndex: number) => void
}) {
  const { ref, size } = useElementSize<HTMLDivElement>();
  const { font, textColor } = props;
  const fb = useMemo(() => {
    return fp.mkArray(16, y => fp.mkArray(16, x => ({
      code: utils.charScreencodeFromRowCol(font, { row: y, col: x })!,
      color: textColor
    })));
  }, [font, textColor]);

  const down = useRef<{ x: number, y: number } | null>(null);
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    down.current = { x: e.clientX, y: e.clientY };
  }, []);
  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (down.current === null) {
      return;
    }
    const dist = Math.hypot(e.clientX - down.current.x, e.clientY - down.current.y);
    down.current = null;
    if (dist > 10) {
      // Scrolled, not tapped
      return;
    }
    const bbox = e.currentTarget.getBoundingClientRect();
    const col = Math.floor((e.clientX - bbox.left) / bbox.width * 16);
    const row = Math.floor((e.clientY - bbox.top) / bbox.height * 16);
    if (row >= 0 && row < 16 && col >= 0 && col < 16) {
      props.setCurrentChar({ row, col });
      if (props.onPicked) {
        props.onPicked();
      }
    }
  };

  const scale = size !== null ? size.width / (16 * 9) : 1;
  const bg = utils.colorIndexToCssRgb(props.colorPalette, props.backgroundColor);
  const charsets = charsetNames.concat(props.customFonts);
  return (
    <div className={styles.charSection}>
      <div className={styles.sectionHeader}>
        <span>Characters · ${props.screencode.toString(16).toUpperCase().padStart(2, '0')}</span>
        <select
          aria-label='Character set'
          value={props.charset}
          onChange={e => {
            if (props.framebufIndex !== null) {
              props.setCharset(e.target.value, props.framebufIndex);
            }
          }}
        >
          {charsets.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <div className={styles.charScroller} ref={ref}>
        {size !== null ?
          <div
            className={styles.charGrid}
            style={{ width: size.width, height: 16 * 9 * scale, backgroundColor: bg }}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
          >
            <div style={{ width: 16 * 9, height: 16 * 9, transform: `scale(${scale})`, transformOrigin: '0 0', position: 'relative' }}>
              <CharGrid
                width={16}
                height={16}
                grid={true}
                backgroundColor={bg}
                framebuf={fb}
                font={font}
                colorPalette={props.colorPalette}
              />
              <div style={{
                position: 'absolute',
                left: props.selected.col * 9 - 0.5,
                top: props.selected.row * 9 - 0.5,
                width: 9, height: 9,
                boxSizing: 'border-box',
                border: `${Math.max(1, 2 / scale)}px solid #fff`,
                pointerEvents: 'none'
              }} />
            </div>
          </div> :
          null}
      </div>
    </div>
  );
}

export const CharPicker = connect(
  (state: RootState) => {
    const charState = currentCharState(state);
    return {
      ...charState,
      selected: selectors.getCharRowColWithTransform(state.toolbar.selectedChar, charState.font, state.toolbar.charTransform),
      customFonts: Object.entries(selectors.getCustomFonts(state)).map(([id, { name }]) => ({ id, name })),
      framebufIndex: screensSelectors.getCurrentScreenFramebufIndex(state)
    };
  },
  dispatch => ({
    setCurrentChar: Toolbar.bindDispatch(dispatch).setCurrentChar,
    setCharset: bindActionCreators(Framebuffer.actions, dispatch).setCharset
  })
)(CharPicker_)

//---------------------------------------------------------------------
// Cursor mode dock: recent chars, touch pad and draw/pick buttons

// Recently used characters, most recent first.  Module level so it survives
// toggling cursor mode on and off.
let recentChars: number[] = [];
const MAX_RECENT = 8;
// Finger travel on the pad that moves the cursor by one cell.
const PAD_CELL_PX = 16;

function CursorDock_ (props: ReturnType<typeof currentCharState> & {
  compact: boolean,
  cursorDrawing: boolean,
  onShowAllChars: () => void,
  Toolbar: any,
  pick: () => void,
  move: (dx: number, dy: number) => void
}) {
  const [, forceUpdate] = useState(0);
  const { screencode } = props;
  useEffect(() => {
    recentChars = [screencode].concat(recentChars.filter(c => c !== screencode)).slice(0, MAX_RECENT);
    forceUpdate(n => n + 1);
  }, [screencode]);

  const padPos = useRef<{ x: number, y: number } | null>(null);
  const handlePadDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    padPos.current = { x: e.clientX, y: e.clientY };
  };
  const handlePadMove = (e: React.PointerEvent) => {
    if (padPos.current === null) {
      return;
    }
    const dx = Math.trunc((e.clientX - padPos.current.x) / PAD_CELL_PX);
    const dy = Math.trunc((e.clientY - padPos.current.y) / PAD_CELL_PX);
    if (dx !== 0 || dy !== 0) {
      props.move(dx, dy);
      padPos.current = {
        x: padPos.current.x + dx * PAD_CELL_PX,
        y: padPos.current.y + dy * PAD_CELL_PX
      };
    }
  };
  const handlePadUp = () => {
    padPos.current = null;
  };

  const setDrawing = (flag: boolean) => (e: React.PointerEvent) => {
    if (flag) {
      e.currentTarget.setPointerCapture(e.pointerId);
    }
    props.Toolbar.setCursorDrawing(flag);
  };

  return (
    <>
      {props.compact ?
        <div className={styles.recentRow}>
          {recentChars.map(code =>
            <button
              key={code}
              aria-label={`Character $${code.toString(16)}`}
              className={classnames(styles.recentChar, code === screencode ? styles.selected : null)}
              onClick={() => props.Toolbar.setScreencode(code)}
            >
              <CharTile
                code={code}
                color={props.textColor}
                backgroundColor={props.backgroundColor}
                font={props.font}
                colorPalette={props.colorPalette}
                size={36}
              />
            </button>
          )}
          <div className={styles.spacer} />
          <button className={styles.textButton} onClick={props.onShowAllChars}>All 256</button>
        </div> :
        null}
      <div className={styles.cursorDock}>
        <div
          className={styles.pad}
          aria-label='Cursor pad'
          onPointerDown={handlePadDown}
          onPointerMove={handlePadMove}
          onPointerUp={handlePadUp}
          onPointerCancel={handlePadUp}
        >
          <icons.MoveIcon size={40} />
          <span>Drag to move the cursor</span>
        </div>
        <div className={styles.padButtons}>
          <button
            className={classnames(styles.drawButton, props.cursorDrawing ? styles.active : null)}
            onPointerDown={setDrawing(true)}
            onPointerUp={setDrawing(false)}
            onPointerCancel={setDrawing(false)}
          >
            <icons.DrawIcon size={28} />
            <span>Hold to draw</span>
          </button>
          <button className={styles.pickButton} onClick={props.pick}>
            <icons.PickIcon size={20} />
            <span>Pick</span>
          </button>
        </div>
      </div>
    </>
  );
}

export const CursorDock = connect(
  (state: RootState) => ({
    ...currentCharState(state),
    cursorDrawing: state.toolbar.cursorDrawing
  }),
  (dispatch: any) => ({
    Toolbar: Toolbar.bindDispatch(dispatch),
    pick: () => dispatch(pickAtCursor()),
    move: (dx: number, dy: number) => dispatch(moveCursor(dx, dy))
  })
)(CursorDock_)
