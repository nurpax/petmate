import React, { useState, useEffect, useRef } from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import classnames from 'classnames'

import { TouchScreen } from '../containers/Editor'
import Settings from '../containers/Settings'
import CustomFontsModal from '../containers/CustomFontsModal'
import ExportModal from '../containers/ExportModal'
import ImportModal from '../containers/ImportModal'
import { Toolbar } from '../redux/toolbar'
import * as ReduxRoot from '../redux/root'
import * as screens from '../redux/screens'
import * as selectors from '../redux/selectors'
import * as screensSelectors from '../redux/screensSelectors'
import { RootState } from '../redux/types'
import * as utils from '../utils'
import * as fp from '../utils/fp'

import { ToolButtons, CharActions, Palette, CharPicker, CursorDock, useElementSize } from './Panels'
import WorkspaceSheet from './WorkspaceSheet'
import TextInputBridge from './TextInputBridge'
import * as icons from './icons'
import styles from './Touch.module.css'

// Narrower than this gets the phone layout: canvas on top, docks below.
const TABLET_MIN_WIDTH = 768;

// Should the touch UI be used instead of the desktop one?  `?touch` in the
// URL forces it on for testing in a desktop browser, `?desktop` off.
export function isTouchLayout(): boolean {
  const params = new URLSearchParams(window.location.search);
  if (params.has('touch')) {
    return true;
  }
  if (params.has('desktop')) {
    return false;
  }
  return window.matchMedia('(pointer: coarse)').matches;
}

function useWindowSize() {
  const [size, setSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  useEffect(() => {
    const handleResize = () => setSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return size;
}

//---------------------------------------------------------------------
// Top bar

interface TopBarProps {
  tablet: boolean;
  onShowWorkspace: () => void;

  screenNames: string;  // '\n' separated, keeps connect's shallow compare cheap
  currentScreen: number;
  fbWidth: number;
  fbHeight: number;
  cursorMode: boolean;
  canvasGrid: boolean;
  crtEffect: boolean;

  Toolbar: any;
  Screens: screens.PropsFromDispatch;
  undo: () => void;
  redo: () => void;
}

const SWIPE_PX = 40;

function TopBar_ (props: TopBarProps) {
  const names = props.screenNames.split('\n');
  const swipeStart = useRef<number | null>(null);

  const cursorButton =
    <button
      className={classnames(styles.iconButton, props.cursorMode ? styles.accentOn : null)}
      aria-label='Cursor mode'
      aria-pressed={props.cursorMode}
      onClick={() => props.Toolbar.setCursorMode(!props.cursorMode)}
    >
      <icons.CursorIcon />
    </button>;
  const undoRedo = <>
    <button className={styles.iconButton} aria-label='Undo' onClick={props.undo}><icons.UndoIcon /></button>
    <button className={styles.iconButton} aria-label='Redo' onClick={props.redo}><icons.RedoIcon /></button>
  </>;
  const menuButton =
    <button className={styles.iconButton} aria-label='Workspace menu' onClick={props.onShowWorkspace}>
      <icons.MenuIcon />
    </button>;

  if (props.tablet) {
    return (
      <div className={styles.topBar}>
        {menuButton}
        <div className={styles.tabs}>
          {names.map((name, i) =>
            <button
              key={i}
              className={classnames(styles.tab, i === props.currentScreen ? styles.on : null)}
              onClick={() => props.Screens.setCurrentScreenIndex(i)}
            >
              {name}
            </button>
          )}
          <button className={styles.iconButton} aria-label='New screen' onClick={() => props.Screens.newScreen()}>
            <icons.PlusIcon />
          </button>
        </div>
        {cursorButton}
        <button
          className={classnames(styles.iconButton, props.canvasGrid ? styles.on : null)}
          aria-label='Grid'
          aria-pressed={props.canvasGrid}
          onClick={() => props.Toolbar.setCanvasGrid(!props.canvasGrid)}
        >
          <icons.GridIcon />
        </button>
        <button
          className={classnames(styles.iconButton, props.crtEffect ? styles.on : null)}
          aria-label='CRT filter'
          aria-pressed={props.crtEffect}
          onClick={() => props.Toolbar.setCrtEffect(!props.crtEffect)}
        >
          <icons.CrtIcon />
        </button>
        <div className={styles.divider} />
        {undoRedo}
      </div>
    );
  }

  // Phone: the screen title opens the workspace sheet, swiping it left or
  // right switches screens.
  return (
    <div className={styles.topBar}>
      {menuButton}
      <button
        className={styles.screenTitle}
        onPointerDown={e => { swipeStart.current = e.clientX; }}
        onPointerUp={e => {
          if (swipeStart.current === null) {
            return;
          }
          const dx = e.clientX - swipeStart.current;
          swipeStart.current = null;
          if (Math.abs(dx) > SWIPE_PX) {
            props.Screens.nextScreen(dx < 0 ? 1 : -1);
          } else {
            props.onShowWorkspace();
          }
        }}
      >
        <span className={styles.name}>{names[props.currentScreen]}</span>
        <span className={styles.meta}>{props.currentScreen + 1}/{names.length} · {props.fbWidth}×{props.fbHeight}</span>
        <icons.ChevronDownIcon size={16} />
      </button>
      {cursorButton}
      {undoRedo}
    </div>
  );
}

const TopBar = connect(
  (state: RootState) => {
    const fb = selectors.getCurrentFramebuf(state);
    return {
      screenNames: screensSelectors.getScreens(state).map(idx => {
        const f = selectors.getFramebufByIndex(state, idx);
        return f ? fp.maybeDefault(f.name, 'Untitled' as string) : '';
      }).join('\n'),
      currentScreen: screensSelectors.getCurrentScreenIndex(state),
      fbWidth: fb ? fb.width : 0,
      fbHeight: fb ? fb.height : 0,
      cursorMode: state.toolbar.cursorMode,
      canvasGrid: state.toolbar.canvasGrid,
      crtEffect: state.toolbar.crtEffect
    };
  },
  (dispatch: any) => ({
    Toolbar: Toolbar.bindDispatch(dispatch),
    Screens: bindActionCreators(screens.actions, dispatch),
    undo: () => dispatch(ReduxRoot.actions.undo()),
    redo: () => dispatch(ReduxRoot.actions.redo())
  })
)(TopBar_)

//---------------------------------------------------------------------
// The canvas, sized to its container

function Canvas (props: { style?: React.CSSProperties, borderWidth: number }) {
  const { ref, size } = useElementSize<HTMLDivElement>();
  return (
    <div className={styles.canvasArea} style={props.style}>
      <div ref={ref}>
        <TouchScreen containerSize={size} borderWidth={props.borderWidth} />
      </div>
    </div>
  );
}

//---------------------------------------------------------------------
// All characters sheet (cursor mode on phones)

function CharSheet (props: { onClose: () => void }) {
  return (
    <>
      <div className={styles.sheetBackdrop} onClick={props.onClose} />
      <div className={styles.sheet} role='dialog' aria-label='Characters' style={{ height: '70%' }}>
        <div className={styles.grabber} />
        <div className={styles.sheetHeader}>
          <h1>Characters</h1>
          <button className={styles.doneButton} onClick={props.onClose}>Done</button>
        </div>
        <CharPicker onPicked={props.onClose} />
      </div>
    </>
  );
}

//---------------------------------------------------------------------

interface TouchAppProps {
  fbWidth: number;
  fbHeight: number;
  cursorMode: boolean;
}

function TouchApp_ (props: TouchAppProps) {
  const win = useWindowSize();
  const [showWorkspace, setShowWorkspace] = useState(false);
  const [showChars, setShowChars] = useState(false);
  const tablet = win.width >= TABLET_MIN_WIDTH;

  useEffect(() => {
    // Keep Safari from zooming the whole page on pinch; pinch zooms the
    // canvas instead.
    const prevent = (e: Event) => e.preventDefault();
    document.addEventListener('gesturestart', prevent);
    document.body.style.setProperty('overscroll-behavior', 'none');
    return () => document.removeEventListener('gesturestart', prevent);
  }, []);

  const modals = <>
    {showWorkspace ? <WorkspaceSheet onClose={() => setShowWorkspace(false)} /> : null}
    {showChars ? <CharSheet onClose={() => setShowChars(false)} /> : null}
    <Settings />
    <CustomFontsModal />
    <ExportModal />
    <ImportModal />
    <TextInputBridge />
  </>;

  if (tablet) {
    return (
      <div className={classnames(styles.app, styles.tablet)}>
        <TopBar tablet={true} onShowWorkspace={() => setShowWorkspace(true)} />
        <div className={styles.tabletBody}>
          <ToolButtons vertical={true} />
          <Canvas style={{ flex: 1, minWidth: 0 }} borderWidth={16} />
          <div className={styles.sidePanel}>
            <CharActions showModifiers={false} />
            <Palette grid={true} />
            <CharPicker />
            {props.cursorMode ? <CursorDock compact={false} onShowAllChars={() => {}} /> : null}
          </div>
        </div>
        {modals}
      </div>
    );
  }

  // Phone: the canvas gets the height its aspect ratio needs at full width,
  // but at most half the screen.
  const border = 8;
  const aspectX = utils.screenPixelAspectX(props.fbWidth);
  const screenHeight = props.fbWidth > 0 ?
    (win.width - 2 * border) * props.fbHeight / (props.fbWidth * aspectX) + 2 * border :
    0;
  const canvasHeight = Math.round(Math.min(win.height * 0.5, screenHeight + 8));
  return (
    <div className={classnames(styles.app, styles.phone)}>
      <TopBar tablet={false} onShowWorkspace={() => setShowWorkspace(true)} />
      <Canvas style={{ flex: 'none', height: canvasHeight }} borderWidth={border} />
      {props.cursorMode ?
        <>
          <Palette grid={false} />
          <CursorDock compact={true} onShowAllChars={() => setShowChars(true)} />
        </> :
        <>
          <CharActions showModifiers={true} />
          <Palette grid={false} />
          <CharPicker />
        </>}
      <ToolButtons vertical={false} />
      {modals}
    </div>
  );
}

export default connect(
  (state: RootState) => {
    const fb = selectors.getCurrentFramebuf(state);
    return {
      fbWidth: fb ? fb.width : 0,
      fbHeight: fb ? fb.height : 0,
      cursorMode: state.toolbar.cursorMode
    };
  }
)(TouchApp_)

// Menu button for the desktop layout in a browser.
export function WebMenuButton () {
  const [show, setShow] = useState(false);
  return (
    <>
      <button className={styles.webMenuButton} aria-label='Workspace menu' onClick={() => setShow(true)}>
        <icons.MenuIcon />
      </button>
      {show ? <WorkspaceSheet onClose={() => setShow(false)} /> : null}
    </>
  );
}
