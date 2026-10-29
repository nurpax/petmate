import React, { useState } from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import classnames from 'classnames'

import CharGrid from '../components/CharGrid'
import ContextMenuArea from '../containers/ContextMenuArea'
import { Toolbar } from '../redux/toolbar'
import { Framebuffer } from '../redux/editor'
import * as screens from '../redux/screens'
import * as selectors from '../redux/selectors'
import * as screensSelectors from '../redux/screensSelectors'
import { getSettingsCurrentColorPalette, getSettingsPaletteRemap } from '../redux/settingsSelectors'
import { RootState, Framebuf, Font, Rgb } from '../redux/types'
import { arrayMove } from '../external/react-sortable-hoc'
import * as utils from '../utils'
import * as fp from '../utils/fp'
import { runMenuCommand } from '../menuCommands'

import * as icons from './icons'
import styles from './Touch.module.css'

const THUMB_WIDTH = 76;

function ScreenThumb (props: {
  framebuf: Framebuf,
  font: Font,
  colorPalette: Rgb[],
  active: boolean,
  onSelect: () => void,
  menuItems: { label: string, click: () => void, destructive?: boolean }[]
}) {
  const { framebuf, font, colorPalette } = props;
  const { width, height } = framebuf;
  const border = 5;
  const innerW = THUMB_WIDTH - 2 * border;
  const scaleX = innerW / (width * 8);
  const scaleY = scaleX / utils.screenPixelAspectX(width);
  const innerH = height * 8 * scaleY;
  return (
    <ContextMenuArea menuItems={props.menuItems}>
      <button className={styles.screenThumb} onClick={props.onSelect}>
        <div
          className={classnames(styles.thumb, props.active ? styles.active : null)}
          style={{
            width: THUMB_WIDTH,
            height: innerH + 2 * border,
            border: `${border}px solid ${utils.colorIndexToCssRgb(colorPalette, framebuf.borderColor)}`
          }}
        >
          <div style={{ transform: `scale(${scaleX}, ${scaleY})`, transformOrigin: '0 0', position: 'relative' }}>
            <CharGrid
              width={width}
              height={height}
              grid={false}
              backgroundColor={utils.colorIndexToCssRgb(colorPalette, framebuf.backgroundColor)}
              framebuf={framebuf.framebuf}
              font={font}
              colorPalette={colorPalette}
            />
          </div>
        </div>
        <span className={styles.thumbName}>{fp.maybeDefault(framebuf.name, 'Untitled' as string)}</span>
      </button>
    </ContextMenuArea>
  );
}

function Row (props: {
  label: string,
  detail?: string,
  icon?: React.ReactNode,
  chevron?: boolean,
  onClick: () => void
}) {
  return (
    <button className={styles.row} onClick={props.onClick}>
      {props.icon ? <span className={styles.accentIcon}>{props.icon}</span> : null}
      <span className={styles.label}>{props.label}</span>
      {props.detail ? <span className={styles.detail}>{props.detail}</span> : null}
      {props.chevron ? <span className={styles.chevron}><icons.ChevronRightIcon size={20} /></span> : null}
    </button>
  );
}

function SwitchRow (props: { label: string, on: boolean, onToggle: () => void }) {
  return (
    <button className={styles.row} role='switch' aria-checked={props.on} onClick={props.onToggle}>
      <span className={styles.label}>{props.label}</span>
      <span className={classnames(styles.switch, props.on ? styles.on : null)} />
    </button>
  );
}

function Swatches (props: {
  colorPalette: Rgb[],
  paletteRemap: number[],
  selected: number,
  onSelect: (color: number) => void
}) {
  return (
    <div className={styles.swatches}>
      {props.paletteRemap.map(idx =>
        <button
          key={idx}
          aria-label={`Color ${idx}`}
          aria-pressed={idx === props.selected}
          className={idx === props.selected ? styles.selected : undefined}
          style={{ backgroundColor: utils.colorIndexToCssRgb(props.colorPalette, idx) }}
          onClick={() => props.onSelect(idx)}
        />
      )}
    </div>
  );
}

const importItems = [
  { label: 'D64 disk image', command: 'import-d64' },
  { label: 'PETSCII .c', command: 'import-marq-c' },
  { label: 'PNG image', command: 'import-png' },
  { label: 'PETSCII .seq', command: 'import-seq' }
];

const exportItems = [
  { label: 'PNG image', command: 'export-png' },
  { label: 'GIF animation', command: 'export-gif' },
  { label: 'Executable .prg', command: 'export-prg' },
  { label: 'PETSCII .seq', command: 'export-seq' },
  { label: 'PETSCII .c', command: 'export-marq-c' },
  { label: 'Assembler source .asm', command: 'export-asm' },
  { label: 'BASIC listing .bas', command: 'export-basic' },
  { label: 'JSON', command: 'export-json' },
  { label: 'PET screen RAM .prg', command: 'export-pet-prg' },
  { label: 'C64 Raster Effect Editor .pet', command: 'export-pet' }
];

interface WorkspaceSheetProps {
  onClose: () => void;

  screenList: number[];
  currentScreen: number;
  framebufIndex: number | null;
  framebuf: Framebuf | null;
  getFramebufByIndex: (idx: number) => Framebuf | null;
  getFont: (fb: Framebuf) => { font: Font };
  colorPalette: Rgb[];
  paletteRemap: number[];
  newScreenSize: { width: number, height: number };
  workspaceFilename: string | null;
  canvasGrid: boolean;
  crtEffect: boolean;

  dispatch: any;
  Toolbar: any;
  Screens: screens.PropsFromDispatch;
  Framebuffer: typeof Framebuffer.actions;
}

type Page = 'main' | 'import' | 'export';

function WorkspaceSheet_ (props: WorkspaceSheetProps) {
  const [page, setPage] = useState<Page>('main');
  const { dispatch, framebufIndex, framebuf } = props;

  const run = (command: string) => {
    props.onClose();
    runMenuCommand(dispatch, command);
  };

  const screenMenu = (screenIdx: number, fbIdx: number) => {
    const fb = props.getFramebufByIndex(fbIdx)!;
    const items = [
      { label: 'Duplicate', click: () => props.Screens.cloneScreen(screenIdx) },
      {
        label: 'Rename',
        click: () => {
          const name = window.prompt('Screen name', fp.maybeDefault(fb.name, '') as string);
          if (name !== null && name.trim() !== '') {
            props.Framebuffer.setName(name.trim(), fbIdx);
          }
        }
      }
    ];
    if (screenIdx > 0) {
      items.push({ label: 'Move left', click: () => props.Screens.setScreenOrder(arrayMove(props.screenList, screenIdx, screenIdx - 1)) });
    }
    if (screenIdx < props.screenList.length - 1) {
      items.push({ label: 'Move right', click: () => props.Screens.setScreenOrder(arrayMove(props.screenList, screenIdx, screenIdx + 1)) });
    }
    return items.concat([
      { label: 'Delete', click: () => props.Screens.removeScreen(screenIdx), destructive: true } as any
    ]);
  };

  let body = null;
  if (page === 'main') {
    const { width: newW, height: newH } = props.newScreenSize;
    body = (
      <>
        <div>
          <div className={styles.caption}>Screens</div>
          <div className={styles.screens}>
            {props.screenList.map((fbIdx, i) => {
              const fb = props.getFramebufByIndex(fbIdx)!;
              return (
                <ScreenThumb
                  key={fbIdx}
                  framebuf={fb}
                  font={props.getFont(fb).font}
                  colorPalette={props.colorPalette}
                  active={i === props.currentScreen}
                  onSelect={() => { props.Screens.setCurrentScreenIndex(i); props.onClose(); }}
                  menuItems={screenMenu(i, fbIdx)}
                />
              );
            })}
            <div className={styles.newScreen}>
              <button aria-label='New screen' onClick={() => { props.Screens.newScreen(); props.onClose(); }}>
                <icons.PlusIcon />
              </button>
              <div className={styles.segmented}>
                {[40, 80].map(w =>
                  <button
                    key={w}
                    className={newW === w ? styles.on : undefined}
                    onClick={() => props.Toolbar.setNewScreenSize({ width: w, height: newH })}
                  >
                    {w}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className={styles.caption}>File</div>
          <div className={styles.group}>
            <Row label='New workspace' icon={<icons.PlusIcon size={20} />} onClick={() => run('new')} />
            <Row label='Open from Files…' icon={<icons.FolderIcon size={20} />} onClick={() => run('open')} />
            <Row
              label='Save'
              detail={props.workspaceFilename !== null ? utils.workspaceBaseName(props.workspaceFilename) + '.petmate' : undefined}
              icon={<icons.SaveIcon size={20} />}
              onClick={() => run('save')}
            />
            <Row label='Save as…' icon={<icons.SaveIcon size={20} />} onClick={() => run('save-as')} />
            <Row label='Import' detail='D64, PNG, SEQ, .c' chevron onClick={() => setPage('import')} />
            <Row label='Export' detail='PNG, GIF, PRG…' chevron onClick={() => setPage('export')} />
          </div>
        </div>

        {framebuf !== null && framebufIndex !== null ?
          <div>
            <div className={styles.caption}>Screen</div>
            <div className={styles.group}>
              <div className={styles.swatchLabel}>Border</div>
              <Swatches
                colorPalette={props.colorPalette}
                paletteRemap={props.paletteRemap}
                selected={framebuf.borderColor}
                onSelect={c => props.Framebuffer.setBorderColor(c, framebufIndex)}
              />
              <div className={styles.swatchLabel}>Background</div>
              <Swatches
                colorPalette={props.colorPalette}
                paletteRemap={props.paletteRemap}
                selected={framebuf.backgroundColor}
                onSelect={c => props.Framebuffer.setBackgroundColor(c, framebufIndex)}
              />
              <div className={styles.row}>
                <span className={styles.label}>Shift contents</span>
                <div className={styles.shiftButtons}>
                  <button aria-label='Shift left' onClick={() => props.Toolbar.shiftHorizontal(-1)}><icons.ChevronLeftIcon size={20} /></button>
                  <button aria-label='Shift right' onClick={() => props.Toolbar.shiftHorizontal(1)}><icons.ChevronRightIcon size={20} /></button>
                  <button aria-label='Shift up' onClick={() => props.Toolbar.shiftVertical(-1)}><span style={{ display: 'flex', transform: 'rotate(180deg)' }}><icons.ChevronDownIcon size={20} /></span></button>
                  <button aria-label='Shift down' onClick={() => props.Toolbar.shiftVertical(1)}><icons.ChevronDownIcon size={20} /></button>
                </div>
              </div>
              <Row
                label='Clear screen'
                onClick={() => {
                  if (window.confirm('Clear this screen?')) {
                    props.Toolbar.clearCanvas();
                    props.onClose();
                  }
                }}
              />
            </div>
          </div> :
          null}

        <div>
          <div className={styles.caption}>View</div>
          <div className={styles.group}>
            <SwitchRow label='Grid' on={props.canvasGrid} onToggle={() => props.Toolbar.setCanvasGrid(!props.canvasGrid)} />
            <SwitchRow label='CRT filter' on={props.crtEffect} onToggle={() => props.Toolbar.setCrtEffect(!props.crtEffect)} />
          </div>
        </div>

        <div className={styles.group}>
          <Row label='Custom fonts' chevron onClick={() => run('custom-fonts')} />
          <Row label='Preferences' chevron onClick={() => run('preferences')} />
        </div>

        <p className={styles.footnote}>Your workspace is autosaved on this device.</p>
      </>
    );
  } else {
    const items = page === 'import' ? importItems : exportItems;
    body = (
      <div className={styles.group}>
        {items.map(item => <Row key={item.command} label={item.label} onClick={() => run(item.command)} />)}
      </div>
    );
  }

  return (
    <>
      <div className={styles.sheetBackdrop} onClick={props.onClose} />
      <div className={styles.sheet} role='dialog' aria-label='Workspace'>
        <div className={styles.grabber} />
        <div className={styles.sheetHeader}>
          {page === 'main' ?
            <h1>Workspace</h1> :
            <button className={styles.doneButton} onClick={() => setPage('main')}>‹ {page === 'import' ? 'Import' : 'Export'}</button>}
          <button className={styles.doneButton} onClick={props.onClose}>Done</button>
        </div>
        <div className={styles.sheetBody}>
          {body}
        </div>
      </div>
    </>
  );
}

export default connect(
  (state: RootState) => {
    const framebufIndex = screensSelectors.getCurrentScreenFramebufIndex(state);
    return {
      screenList: screensSelectors.getScreens(state),
      currentScreen: screensSelectors.getCurrentScreenIndex(state),
      framebufIndex,
      framebuf: selectors.getCurrentFramebuf(state),
      getFramebufByIndex: (idx: number) => selectors.getFramebufByIndex(state, idx),
      getFont: (fb: Framebuf) => selectors.getFramebufFont(state, fb),
      colorPalette: getSettingsCurrentColorPalette(state),
      paletteRemap: getSettingsPaletteRemap(state),
      newScreenSize: state.toolbar.newScreenSize,
      workspaceFilename: state.toolbar.workspaceFilename,
      canvasGrid: state.toolbar.canvasGrid,
      crtEffect: state.toolbar.crtEffect
    };
  },
  dispatch => ({
    dispatch,
    Toolbar: Toolbar.bindDispatch(dispatch),
    Screens: bindActionCreators(screens.actions, dispatch),
    Framebuffer: bindActionCreators(Framebuffer.actions, dispatch)
  })
)(WorkspaceSheet_)
