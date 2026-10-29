
import React, { Component, Fragment, CSSProperties, WheelEvent } from 'react';
import ReactDOM from 'react-dom';
import { connect } from 'react-redux'
import classNames from 'classnames'

import ColorPicker from '../components/ColorPicker'
import CharGrid from '../components/CharGrid'
import CharPosOverlay, { TextCursorOverlay } from '../components/CharPosOverlay'
import GridOverlay from '../components/GridOverlay'
import CrtOverlay, { CRT_FILTER_COLOR, CRT_FILTER_PET } from '../components/CrtOverlay'
import { CanvasStatusbar } from '../components/Statusbar'

import CharSelect from './CharSelect'

import * as framebuf from '../redux/editor'
import { Framebuffer } from '../redux/editor'
import * as selectors from '../redux/selectors'
import * as screensSelectors from '../redux/screensSelectors'
import {
  getSettingsPaletteRemap,
  getSettingsCurrentColorPalette,
  getSettingsIntegerScale
} from '../redux/settingsSelectors'


import { framebufIndexMergeProps }  from '../redux/utils'

import * as toolbar from '../redux/toolbar'
import { Toolbar } from '../redux/toolbar'
import * as ReduxRoot from '../redux/root'
import * as utils from '../utils';
import * as matrix from '../utils/matrix';
import { focusTextInput } from '../touch/TextInputBridge';

import styles from './Editor.module.css';
import {
  RootState,
  BrushRegion,
  Coord2,
  Rgb,
  Brush,
  Font,
  Tool,
  Pixel, Framebuf, FramebufUIState
} from '../redux/types'

const brushOutlineSelectingColor = 'rgba(128, 255, 128, 0.5)';

const gridColor = 'rgba(128, 128, 128, 1)'

const brushOverlayStyleBase: CSSProperties = {
  outlineColor: 'rgba(255, 255, 255, 0.5)',
  outlineStyle: 'solid',
  outlineWidth: 0.5,
  backgroundColor: 'rgba(255,255,255,0)',
  zIndex: 1,
  pointerEvents: 'none'
}

interface BrushSelectOverlayProps {
  framebufWidth: number;
  framebufHeight: number;
  brushRegion: BrushRegion | null;
  charPos: Coord2;
}

class BrushSelectOverlay extends Component<BrushSelectOverlayProps> {
  render () {
    if (this.props.brushRegion === null) {
      return (
        <CharPosOverlay
          charPos={this.props.charPos}
          framebufWidth={this.props.framebufWidth}
          framebufHeight={this.props.framebufHeight}
          color={brushOutlineSelectingColor}
        />
      )
    }
    const { min, max } = utils.sortRegion(this.props.brushRegion)
    const s: CSSProperties = {
      ...brushOverlayStyleBase,
      outlineColor: brushOutlineSelectingColor,
      position: 'absolute',
      left: min.col*8,
      top: min.row*8,
      width: `${(max.col-min.col+1)*8}px`,
      height: `${(max.row-min.row+1)*8}px`
    }
    return (
      <div style={s}>
      </div>
    )
  }
}

function computeBrushDstPos (charPos: Coord2, dims: { width: number, height: number }) {
  return {
    col: charPos.col - Math.floor(dims.width/2),
    row: charPos.row - Math.floor(dims.height/2)
  }
}

interface BrushOverlayProps {
  charPos: Coord2;
  framebufWidth: number;
  framebufHeight: number;
  backgroundColor: string;
  colorPalette: Rgb[];
  brush: Brush | null;
  font: Font;
}

class BrushOverlay extends Component<BrushOverlayProps> {
  render () {
    if (this.props.brush === null) {
      return null
    }
    const { charPos, backgroundColor, framebufWidth, framebufHeight } = this.props
    const { min, max } = utils.sortRegion(this.props.brush.brushRegion)
    const brushw = max.col - min.col + 1
    const brushh = max.row - min.row + 1
    let bw = brushw
    let bh = brushh
    const destPos = computeBrushDstPos(charPos, { width: bw, height: bh})
    let dstx = destPos.col
    let dsty = destPos.row
    if (bw + dstx > framebufWidth) {
      bw = framebufWidth - dstx
    }
    if (bh + dsty > framebufHeight) {
      bh = framebufHeight - dsty
    }
    let srcX = 0
    let srcY = 0
    if (dstx < 0) {
      srcX = -dstx
      bw -= srcX
      dstx = 0
    }
    if (dsty < 0) {
      srcY = -dsty
      bh -= srcY
      dsty = 0
    }
    if (bw <= 0 || bh <= 0) {
      return null
    }
    const s: CSSProperties = {
      ...brushOverlayStyleBase,
      position: 'absolute',
      left: dstx*8,
      top: dsty*8,
      width: `${bw*8}px`,
      height: `${bh*8}px`,
    }
    return (
      <div style={s}>
        <CharGrid
          width={bw}
          height={bh}
          srcX={srcX}
          srcY={srcY}
          grid={false}
          backgroundColor={backgroundColor}
          colorPalette={this.props.colorPalette}
          font={this.props.font}
          framebuf={this.props.brush.framebuf}
        />
      </div>
    )
  }
}

interface FramebufferViewProps {
  undoId: number | null;

  altKey: boolean;
  shiftKey: boolean;
  spacebarKey: boolean;

  textCursorPos: Coord2;

  framebuf: Pixel[][];
  framebufWidth: number;
  framebufHeight: number;
  selectedTool: Tool;
  brush: Brush | null;
  brushRegion: BrushRegion | null;
  // Scale and translation for pan/zoom
  framebufUIState: FramebufUIState;

  backgroundColor: number;
  textColor: number;
  curScreencode: number;
  colorPalette: Rgb[];

  font: Font;

  canvasGrid: boolean;

  cursorMode: boolean;
  cursorPos: Coord2;
  cursorDrawing: boolean;

  onCharPosChanged: (args: {isActive: boolean, charPos: Coord2}) => void;

  framebufLayout: {
    width: number, height: number,
    pixelScaleX: number,
    pixelScaleY: number
  };
}

interface FramebufferViewDispatch {
  Framebuffer: framebuf.PropsFromDispatch;
  Toolbar: toolbar.PropsFromDispatch;
  undo: () => void;
  redo: () => void;
}

interface FramebufferViewState {
  // Floor'd to int
  charPos: Coord2;
  isActive: boolean;
  // Touch long-press color & char picker
  loupe: { charPos: Coord2, clientX: number, clientY: number } | null;
}

// How long a finger has to rest on a cell for the loupe/picker to open.
const LONG_PRESS_MS = 400;
// Two or three finger taps (undo/redo) must be shorter than this.
const MULTI_TAP_MS = 300;
const MAX_ZOOM = 24;

// Once an Apple Pencil (or other stylus) has been used, a single finger pans
// the canvas instead of drawing, like in most iPad drawing apps.
let penSeen = false;

type TouchState = 'idle' | 'pending' | 'drawing' | 'picking' | 'gesture' | 'cursor';

class FramebufferView extends Component<FramebufferViewProps & FramebufferViewDispatch, FramebufferViewState> {

  state: FramebufferViewState = {
    charPos: { row: -1, col: 0 },
    isActive: false,
    loupe: null
  }

  prevDragPos: Coord2|null = null;

  setChar = (clickLoc: Coord2) => {
    const { undoId } = this.props;
    const params = {
      ...clickLoc,
    }
    if (this.props.selectedTool === Tool.Draw) {
      this.props.Framebuffer.setPixel({
        ...params,
        color: this.props.textColor,
        screencode: this.props.curScreencode
      }, undoId)
    } else if (this.props.selectedTool === Tool.Colorize) {
      this.props.Framebuffer.setPixel({
        ...params,
        color: this.props.textColor,
      }, undoId)
    } else if (this.props.selectedTool === Tool.CharDraw) {
      this.props.Framebuffer.setPixel({
        ...params,
        screencode: this.props.curScreencode
      }, undoId)
    } else {
      console.error('shouldn\'t get here')
    }
  }

  brushDraw = (coord: Coord2) => {
    const { min, max } = this.props.brush.brushRegion
    const area = {
      width: max.col - min.col + 1,
      height: max.row - min.row + 1
    }
    const destPos = computeBrushDstPos(coord, area)
    this.props.Framebuffer.setBrush({
      ...destPos,
      brush: this.props.brush,
    }, this.props.undoId)
  }

  dragStart = (coord: Coord2) => {
    const { selectedTool } = this.props
    if (selectedTool === Tool.Draw ||
        selectedTool === Tool.Colorize ||
        selectedTool === Tool.CharDraw) {
      this.setChar(coord)
    } else if (selectedTool === Tool.Brush) {
      if (this.props.brush === null) {
        this.props.Toolbar.setBrushRegion({
          min: coord,
          max: coord
        })
      } else {
        this.brushDraw(coord)
      }
    } else if (selectedTool === Tool.Text) {
      this.props.Toolbar.setTextCursorPos(coord)
    }
    this.prevDragPos = coord
  }

  dragMove = (coord: Coord2) => {
    const prevDragPos = this.prevDragPos!; // set in dragStart
    const { selectedTool, brush, brushRegion } = this.props
    if (selectedTool === Tool.Draw ||
        selectedTool === Tool.Colorize ||
        selectedTool === Tool.CharDraw) {
      utils.drawLine((x,y) => {
        this.setChar({ row:y, col:x })
      }, prevDragPos.col, prevDragPos.row, coord.col, coord.row)
    } else if (selectedTool === Tool.Brush) {
      if (brush !== null) {
        this.brushDraw(coord)
      } else if (brushRegion !== null) {
        const clamped = {
          row: Math.max(0, Math.min(coord.row, this.props.framebufHeight-1)),
          col: Math.max(0, Math.min(coord.col, this.props.framebufWidth-1))
        }
        this.props.Toolbar.setBrushRegion({
          ...brushRegion,
          max: clamped
        })
      }
    } else {
      console.error('not implemented')
    }

    this.prevDragPos = coord
  }

  dragEnd = () => {
    const { selectedTool, brush, brushRegion } = this.props
    if (selectedTool === Tool.Brush) {
      if (brush === null && brushRegion !== null) {
        this.props.Toolbar.captureBrush(this.props.framebuf, brushRegion)
      }
    }
    this.props.Toolbar.incUndoId()
  }

  altClick = (charPos: Coord2) => {
    const x = charPos.col
    const y = charPos.row
    if (y >= 0 && y < this.props.framebufHeight &&
      x >= 0 && x < this.props.framebufWidth) {
      const pix = this.props.framebuf[y][x]
      this.props.Toolbar.setCurrentScreencodeAndColor(pix)
    }
  }

  //---------------------------------------------------------------------
  // Mechanics of tracking pointer drags with mouse coordinate -> canvas char pos
  // transformation.

  private ref = React.createRef<HTMLDivElement>();
  private prevCharPos: Coord2|null = null;
  private prevCoord: Coord2|null = null;
  private lockStartCoord: Coord2|null = null;
  private shiftLockAxis: 'shift'|'row'|'col'|null = null;
  private dragging = false;

  currentCharPos (e: any): { charPos: Coord2 } {
    if (!this.ref.current) {
      throw new Error('impossible?');
    }

    const bbox = this.ref.current.getBoundingClientRect();
    const xx = (e.clientX - bbox.left) / this.props.framebufLayout.pixelScaleX;
    const yy = (e.clientY - bbox.top) / this.props.framebufLayout.pixelScaleY;

    const invXform = matrix.invert(this.props.framebufUIState.canvasTransform);
    let [x, y] = matrix.multVect3(invXform, [xx, yy, 1]);
    x /= 8;
    y /= 8;

    return {
      charPos: { row: Math.floor(y), col: Math.floor(x) }
    }
  }

  setCharPos (isActive: boolean, charPos: Coord2) {
    this.setState({ isActive, charPos });
    this.props.onCharPosChanged({ isActive, charPos });
  }

  handleMouseEnter = (e: any) => {
    const { charPos } = this.currentCharPos(e);
    this.setCharPos(true, charPos);
  }

  handleMouseLeave = (e: any) => {
    const { charPos } = this.currentCharPos(e);
    this.setCharPos(false, charPos);
  }

  handlePointerDown = (e: any) => {
    if (e.pointerType === 'touch') {
      this.handleTouchDown(e);
      return;
    }
    if (e.pointerType === 'pen') {
      penSeen = true;
      this.penDown = true;
      this.cancelTouches();
    }

    if (this.props.selectedTool == Tool.PanZoom ||
      (this.props.selectedTool !== Tool.Text && this.props.spacebarKey)) {
      this.handlePanZoomPointerDown(e);
      return;
    }

    const { charPos } = this.currentCharPos(e);
    this.setCharPos(true, charPos);

    // alt-left click doesn't start dragging
    if (this.props.altKey) {
      this.dragging = false;
      this.altClick(charPos);
      return;
    }

    this.dragging = true
    e.target.setPointerCapture(e.pointerId);
    this.strokeStart(charPos)
  }

  handlePointerUp = (e: any) => {
    if (e.pointerType === 'touch') {
      this.handleTouchUp(e, false);
      return;
    }
    if (e.pointerType === 'pen') {
      this.penDown = false;
    }

    if (this.props.selectedTool == Tool.PanZoom || this.panZoomDragging) {
      this.handlePanZoomPointerUp(e);
      return;
    }

    if (this.dragging) {
      this.dragEnd()
    }

    this.dragging = false
    this.lockStartCoord = null
    this.shiftLockAxis = null
  }

  handlePointerCancel = (e: any) => {
    if (e.pointerType === 'touch') {
      this.handleTouchUp(e, true);
      return;
    }
    this.handlePointerUp(e);
  }

  handlePointerMove = (e: any) => {
    if (e.pointerType === 'touch') {
      this.handleTouchMove(e);
      return;
    }

    if (this.props.selectedTool == Tool.PanZoom ||
      (this.props.selectedTool !== Tool.Text && this.props.spacebarKey)) {
      this.handlePanZoomPointerMove(e);
      return;
    }

    const { charPos } = this.currentCharPos(e)
    this.setCharPos(true, charPos);

    if (this.prevCharPos === null ||
      this.prevCharPos.row !== charPos.row ||
      this.prevCharPos.col !== charPos.col) {
      this.prevCharPos = {...charPos}
        this.props.onCharPosChanged({isActive:this.state.isActive, charPos})
    }

    if (!this.dragging) {
      return
    }
    this.strokeMove(charPos)
  }

  // Start a drawing stroke at charPos.  Holding shift (or the touch UI's
  // axis lock) locks the stroke to a row or a column.
  strokeStart (charPos: Coord2) {
    this.prevCoord = charPos
    this.dragStart(charPos)

    const lock = this.props.shiftKey
    this.shiftLockAxis = lock ? 'shift' : null
    if (lock) {
      this.lockStartCoord = {
        ...charPos
      }
    }
  }

  strokeMove (charPos: Coord2) {
    // Note: prevCoord is known to be not null here as it's been set
    // in strokeStart
    const coord = charPos;
    if (this.prevCoord!.row !== coord.row || this.prevCoord!.col !== coord.col) {

      if (this.shiftLockAxis === 'shift') {
        if (this.prevCoord!.row === coord.row) {
          this.shiftLockAxis = 'row'
        } else if (this.prevCoord!.col === coord.col) {
          this.shiftLockAxis = 'col'
        }
      }

      if (this.shiftLockAxis !== null) {
        let lockedCharPos = {
          ...this.lockStartCoord!
        }

        if (this.shiftLockAxis === 'row') {
          lockedCharPos.col = charPos.col
        } else if (this.shiftLockAxis === 'col') {
          lockedCharPos.row = charPos.row
        }
        this.dragMove(lockedCharPos)
      } else {
        this.dragMove(charPos)
      }
      this.prevCoord = charPos
    }
  }

  strokeEnd () {
    this.dragEnd()
    this.dragging = false
    this.lockStartCoord = null
    this.shiftLockAxis = null
  }

  //---------------------------------------------------------------------
  // Touch gestures
  //
  // - One finger draws with the current tool.  The stroke only starts once
  //   the finger moves to another cell, or on lift (a tap), so that resting
  //   a finger on a cell can open the picker loupe instead.
  // - Long-press opens a loupe; lifting the finger picks the char & color.
  // - Two fingers pinch-zoom and pan.  A quick two-finger tap undoes, a
  //   three-finger tap redoes.
  // - In cursor mode, a finger on the canvas moves the drawing cursor.
  // - After a pen has been used, one finger pans and fingers never draw.

  private touches = new Map<number, { x: number, y: number }>();
  private touchState: TouchState = 'idle';
  private touchStart: { charPos: Coord2, time: number } | null = null;
  private longPressTimer: number | null = null;
  private gesture = { startTime: 0, maxTouches: 0, moved: 0 };
  private penDown = false;

  clearLongPressTimer () {
    if (this.longPressTimer !== null) {
      window.clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
  }

  cancelTouches () {
    this.clearLongPressTimer();
    if (this.touchState === 'drawing') {
      this.strokeEnd();
    }
    this.touches.clear();
    this.touchState = 'idle';
    if (this.state.loupe !== null) {
      this.setState({ loupe: null });
    }
  }

  startGesture () {
    this.clearLongPressTimer();
    if (this.touchState === 'drawing') {
      this.strokeEnd();
    }
    if (this.state.loupe !== null) {
      this.setState({ loupe: null });
    }
    if (this.touchState !== 'gesture') {
      this.gesture = {
        startTime: this.touchStart !== null ? this.touchStart.time : Date.now(),
        maxTouches: this.touches.size,
        moved: 0
      };
    }
    this.touchState = 'gesture';
    this.setCharPos(false, this.state.charPos);
  }

  handleTouchDown (e: any) {
    if (this.penDown) {
      return;
    }
    e.currentTarget.setPointerCapture(e.pointerId);
    this.touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (this.touches.size >= 2) {
      this.startGesture();
      this.gesture.maxTouches = Math.max(this.gesture.maxTouches, this.touches.size);
      return;
    }

    const { charPos } = this.currentCharPos(e);
    this.touchStart = { charPos, time: Date.now() };

    if (penSeen) {
      this.startGesture();
      return;
    }
    if (this.props.cursorMode) {
      this.touchState = 'cursor';
      this.props.Toolbar.setCursorPos(this.clampToFramebuf(charPos));
      return;
    }
    if (this.props.selectedTool === Tool.PanZoom) {
      this.startGesture();
      return;
    }

    this.touchState = 'pending';
    this.setCharPos(true, charPos);
    const { clientX, clientY } = e;
    this.longPressTimer = window.setTimeout(() => {
      this.longPressTimer = null;
      if (this.touchState === 'pending') {
        this.touchState = 'picking';
        this.setCharPos(false, charPos);
        this.setState({ loupe: { charPos, clientX, clientY } });
      }
    }, LONG_PRESS_MS);
  }

  handleTouchMove (e: any) {
    const prev = this.touches.get(e.pointerId);
    if (prev === undefined) {
      return;
    }
    const cur = { x: e.clientX, y: e.clientY };

    if (this.touchState === 'gesture') {
      if (this.touches.size >= 2) {
        const [id0, id1] = Array.from(this.touches.keys());
        const p0 = this.touches.get(id0)!;
        const p1 = this.touches.get(id1)!;
        const n0 = id0 === e.pointerId ? cur : p0;
        const n1 = id1 === e.pointerId ? cur : p1;
        const prevMid = { x: (p0.x + p1.x) / 2, y: (p0.y + p1.y) / 2 };
        const mid = { x: (n0.x + n1.x) / 2, y: (n0.y + n1.y) / 2 };
        const prevDist = Math.hypot(p0.x - p1.x, p0.y - p1.y);
        const dist = Math.hypot(n0.x - n1.x, n0.y - n1.y);
        const scale = prevDist > 0 ? dist / prevDist : 1;
        this.gesture.moved += Math.hypot(mid.x - prevMid.x, mid.y - prevMid.y) + Math.abs(dist - prevDist);
        this.panZoom(mid.x - prevMid.x, mid.y - prevMid.y, scale, mid.x, mid.y);
      } else {
        this.gesture.moved += Math.hypot(cur.x - prev.x, cur.y - prev.y);
        this.panZoom(cur.x - prev.x, cur.y - prev.y, 1, cur.x, cur.y);
      }
      this.touches.set(e.pointerId, cur);
      return;
    }
    this.touches.set(e.pointerId, cur);

    const { charPos } = this.currentCharPos(e);
    if (this.touchState === 'cursor') {
      this.props.Toolbar.setCursorPos(this.clampToFramebuf(charPos));
    } else if (this.touchState === 'picking') {
      this.setState({ loupe: { charPos, clientX: e.clientX, clientY: e.clientY } });
    } else if (this.touchState === 'pending') {
      const start = this.touchStart!.charPos;
      this.setCharPos(true, charPos);
      if (start.row !== charPos.row || start.col !== charPos.col) {
        this.clearLongPressTimer();
        this.touchState = 'drawing';
        this.dragging = true;
        this.strokeStart(start);
        this.strokeMove(charPos);
      }
    } else if (this.touchState === 'drawing') {
      this.setCharPos(true, charPos);
      this.strokeMove(charPos);
    }
  }

  handleTouchUp (e: any, cancelled: boolean) {
    if (!this.touches.has(e.pointerId)) {
      return;
    }
    this.touches.delete(e.pointerId);
    const remaining = this.touches.size;

    switch (this.touchState) {
      case 'pending': {
        this.clearLongPressTimer();
        this.touchState = 'idle';
        this.setCharPos(false, this.state.charPos);
        if (cancelled) {
          break;
        }
        // A tap
        const charPos = this.touchStart!.charPos;
        if (this.props.altKey) {
          this.altClick(charPos);
          this.props.Toolbar.setAltKey(false);
        } else if (this.props.selectedTool === Tool.Text) {
          this.dragStart(charPos);
          focusTextInput();
        } else {
          this.dragging = true;
          this.strokeStart(charPos);
          this.strokeEnd();
        }
        break;
      }
      case 'drawing':
        if (remaining === 0) {
          this.strokeEnd();
          this.touchState = 'idle';
          this.setCharPos(false, this.state.charPos);
        }
        break;
      case 'picking':
        if (!cancelled && this.state.loupe !== null) {
          this.altClick(this.state.loupe.charPos);
          this.props.Toolbar.setAltKey(false);
        }
        this.setState({ loupe: null });
        this.touchState = 'idle';
        break;
      case 'cursor':
        if (remaining === 0) {
          this.touchState = 'idle';
        }
        break;
      case 'gesture':
        if (remaining === 0) {
          const { startTime, maxTouches, moved } = this.gesture;
          if (!cancelled && !penSeen && moved < 20 && Date.now() - startTime < MULTI_TAP_MS) {
            if (maxTouches === 2) {
              this.props.undo();
            } else if (maxTouches === 3) {
              this.props.redo();
            }
          }
          this.touchState = 'idle';
        }
        break;
      default:
        break;
    }
  }

  clampToFramebuf (charPos: Coord2): Coord2 {
    return {
      row: Math.max(0, Math.min(this.props.framebufHeight - 1, charPos.row)),
      col: Math.max(0, Math.min(this.props.framebufWidth - 1, charPos.col))
    };
  }

  // Cursor mode: the cursor pad's draw button drives strokes at the cursor.
  componentDidUpdate (prevProps: FramebufferViewProps) {
    if (!this.props.cursorMode) {
      if (prevProps.cursorDrawing && this.dragging) {
        this.strokeEnd();
      }
      return;
    }
    const { cursorPos, cursorDrawing } = this.props;
    if (cursorDrawing && !prevProps.cursorDrawing) {
      this.dragging = true;
      this.strokeStart(cursorPos);
    } else if (cursorDrawing && cursorPos !== prevProps.cursorPos && this.dragging) {
      this.strokeMove(cursorPos);
    } else if (!cursorDrawing && prevProps.cursorDrawing && this.dragging) {
      this.strokeEnd();
    }
  }

  //---------------------------------------------------------------------
  // Pan/zoom mouse event handlers.  Called by the bound handlePointerDown/Move/Up
  // functions if the pan/zoom tool is selected.

  private panZoomDragging = false;

  handlePanZoomPointerDown (e: any) {
    this.panZoomDragging = true;
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  handlePanZoomPointerUp (_e: any) {
    this.panZoomDragging = false;
  }

  // Mutable dst
  clampToWindow (xform: matrix.Matrix3x3): matrix.Matrix3x3 {
    const xf = matrix.copy(xform);
    // Clamp translation so that the canvas doesn't go out of the window
    let tx = xf.v[0][2];
    let ty = xf.v[1][2];
    tx = Math.min(tx, 0);
    ty = Math.min(ty, 0);
    const xx = this.props.framebufLayout.width / this.props.framebufLayout.pixelScaleX;
    const yy = this.props.framebufLayout.height / this.props.framebufLayout.pixelScaleY;
    const [swidth, sheight] = matrix.multVect3(xform, [this.props.framebufWidth*8, this.props.framebufHeight*8, 0]);
    tx = Math.max(tx, -(swidth - xx));
    ty = Math.max(ty, -(sheight - yy));
    xf.v[0][2] = tx;
    xf.v[1][2] = ty;
    return xf;
  }

  // Pan by (dx, dy) screen pixels, then zoom by scaleDelta around the
  // (clientX, clientY) screen position.
  panZoom (dx: number, dy: number, scaleDelta: number, clientX: number, clientY: number) {
    if (!this.ref.current) {
      return;
    }
    const { pixelScaleX, pixelScaleY } = this.props.framebufLayout;
    const prevUIState = this.props.framebufUIState;
    const prevTransform = prevUIState.canvasTransform;

    const srcDxDy = matrix.multVect3(matrix.invert(prevTransform), [dx / pixelScaleX, dy / pixelScaleY, 0]);
    let xform = matrix.mult(prevTransform, matrix.translate(srcDxDy[0], srcDxDy[1]));

    if (scaleDelta !== 1) {
      const curScale = xform.v[0][0];
      const s = Math.max(1.0 / curScale, Math.min(MAX_ZOOM / curScale, scaleDelta));
      const bbox = this.ref.current.getBoundingClientRect();
      const mouseX = (clientX - bbox.left) / pixelScaleX;
      const mouseY = (clientY - bbox.top) / pixelScaleY;
      const srcPos = matrix.multVect3(matrix.invert(xform), [mouseX, mouseY, 1]);
      xform =
        matrix.mult(
          xform,
          matrix.mult(
            matrix.translate(srcPos[0]-s*srcPos[0], srcPos[1]-s*srcPos[1]),
            matrix.scale(s)
          )
        )
      if (xform.v[0][0] < 1.0 || xform.v[1][1] < 1.0) {
        xform.v[0][0] = 1.0;
        xform.v[1][1] = 1.0;
      }
    }

    this.props.Toolbar.setCurrentFramebufUIState({
      ...prevUIState,
      canvasTransform: this.clampToWindow(xform)
    });
  }

  handlePanZoomPointerMove (e: any) {
    if (this.panZoomDragging) {
      this.panZoom(e.nativeEvent.movementX, e.nativeEvent.movementY, 1, 0, 0);
    }
  }

  // Reset canvas scale transform to identity on double click.
  handleDoubleClick = () => {
    if (this.props.selectedTool != Tool.PanZoom) {
      return;
    }
    const prevUIState = this.props.framebufUIState;
    this.props.Toolbar.setCurrentFramebufUIState({
      ...prevUIState,
      canvasTransform: matrix.ident()
    })
  }

  handleWheel = (e: WheelEvent) => {
    if (!(this.props.selectedTool == Tool.PanZoom ||
        (this.props.selectedTool !== Tool.Text && this.props.altKey))) {
      return;
    }
    if (e.deltaY == 0) {
      return;
    }
    const wheelScale = 200.0;
    const delta = Math.min(Math.abs(e.deltaY), wheelScale);
    const scaleDelta = e.deltaY < 0 ?
      1.0/(1 - (delta / (wheelScale+1))) : (1 - (delta / (wheelScale+1)));
    this.panZoom(0, 0, scaleDelta, e.nativeEvent.clientX, e.nativeEvent.clientY);
  }

  // Magnified view of the cells around a long-pressed cell, shown above the
  // finger so that the finger doesn't cover it.
  renderLoupe (backgroundColor: string) {
    const { loupe } = this.state
    if (loupe === null) {
      return null
    }
    const N = 5
    const size = 132
    const srcX = Math.max(0, Math.min(this.props.framebufWidth - N, loupe.charPos.col - 2))
    const srcY = Math.max(0, Math.min(this.props.framebufHeight - N, loupe.charPos.row - 2))
    const w = Math.min(N, this.props.framebufWidth)
    const h = Math.min(N, this.props.framebufHeight)
    const scaleY = size / (N * 8)
    const scaleX = scaleY * utils.screenPixelAspectX(this.props.framebufWidth)
    const inside = loupe.charPos.row >= 0 && loupe.charPos.row < this.props.framebufHeight &&
      loupe.charPos.col >= 0 && loupe.charPos.col < this.props.framebufWidth
    const left = Math.max(8, Math.min(window.innerWidth - size - 8, loupe.clientX - size / 2))
    const top = loupe.clientY - size - 48 > 8 ? loupe.clientY - size - 48 : loupe.clientY + 48
    return ReactDOM.createPortal(
      <div style={{
        position: 'fixed', left, top, width: size, height: size, zIndex: 20,
        borderRadius: '50%', overflow: 'hidden', pointerEvents: 'none',
        backgroundColor, boxShadow: '0 0 0 3px #fff, 0 8px 30px rgba(0,0,0,0.6)'
      }}>
        <div style={{
          position: 'absolute',
          left: size / 2 - (loupe.charPos.col - srcX + 0.5) * 8 * scaleX,
          top: size / 2 - (loupe.charPos.row - srcY + 0.5) * 8 * scaleY,
          width: w * 8, height: h * 8,
          transform: `scale(${scaleX}, ${scaleY})`, transformOrigin: '0 0',
          imageRendering: 'pixelated'
        }}>
          <CharGrid
            width={w}
            height={h}
            srcX={srcX}
            srcY={srcY}
            grid={false}
            backgroundColor={backgroundColor}
            colorPalette={this.props.colorPalette}
            font={this.props.font}
            framebuf={this.props.framebuf}
          />
          {inside ?
            <div style={{
              position: 'absolute',
              left: (loupe.charPos.col - srcX) * 8, top: (loupe.charPos.row - srcY) * 8,
              width: 8, height: 8, outline: `${2.5 / scaleY}px solid #fff`
            }} /> :
            null}
        </div>
      </div>,
      document.body
    )
  }

  render () {
    // Editor needs to specify a fixed width/height because the contents use
    // relative/absolute positioning and thus seem to break out of the CSS
    // grid.
    const charWidth = this.props.framebufWidth;
    const charHeight = this.props.framebufHeight;
    const backg = utils.colorIndexToCssRgb(this.props.colorPalette, this.props.backgroundColor)
    const { selectedTool } = this.props
    // In cursor mode, the cursor stands in for the mouse pointer.
    const { isActive, charPos } = this.props.cursorMode ?
      { isActive: true, charPos: this.props.cursorPos } :
      this.state
    let overlays = null
    let screencodeHighlight: number|undefined = this.props.curScreencode
    let colorHighlight: number|undefined = this.props.textColor
    let highlightCharPos = true
    if (isActive) {
      if (selectedTool === Tool.Brush) {
        highlightCharPos = false
        if (this.props.brush !== null) {
          overlays =
            <BrushOverlay
              charPos={charPos}
              framebufWidth={this.props.framebufWidth}
              framebufHeight={this.props.framebufHeight}
              backgroundColor={backg}
              colorPalette={this.props.colorPalette}
              font={this.props.font}
              brush={this.props.brush}
            />
        } else {
          overlays =
            <BrushSelectOverlay
              charPos={charPos}
              framebufWidth={this.props.framebufWidth}
              framebufHeight={this.props.framebufHeight}
              brushRegion={this.props.brushRegion}
            />
        }
      } else if (
        selectedTool === Tool.Draw ||
        selectedTool === Tool.Colorize ||
        selectedTool === Tool.CharDraw
      ) {
        overlays =
          <CharPosOverlay
            framebufWidth={this.props.framebufWidth}
            framebufHeight={this.props.framebufHeight}
            charPos={charPos}
            opacity={0.5}
          />
        if (selectedTool === Tool.Colorize) {
          screencodeHighlight = undefined;
        } else if (selectedTool === Tool.CharDraw) {
          colorHighlight = undefined;
        }
        // Don't show current char/color when the ALT color/char picker is active
        if (this.props.altKey) {
          highlightCharPos = false;
        }
      } else {
        highlightCharPos = false;
        screencodeHighlight = undefined;
        colorHighlight = undefined;
      }
    }

    if (selectedTool === Tool.Text) {
      screencodeHighlight = undefined;
      colorHighlight = undefined;
      const { textCursorPos, textColor } = this.props
      let textCursorOverlay = null
      if (textCursorPos !== null) {
        const color = utils.colorIndexToCssRgb(this.props.colorPalette, textColor)
        textCursorOverlay =
          <TextCursorOverlay
            framebufWidth={this.props.framebufWidth}
            framebufHeight={this.props.framebufHeight}
            charPos={textCursorPos}
            fillColor={color}
            opacity={0.5}
          />
      }
      overlays =
        <Fragment>
          {textCursorOverlay}
          {isActive ?
            <CharPosOverlay
              framebufWidth={this.props.framebufWidth}
              framebufHeight={this.props.framebufHeight}
              charPos={charPos}
              opacity={0.5}
            />
            :
            null}
        </Fragment>
    }

    const cx = '100%';
    const cy = '100%';
    // TODO scaleX and Y
    const transform = this.props.framebufUIState.canvasTransform;
    const scale: CSSProperties = {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'flex-start',
      width: `${this.props.framebufLayout.width}px`,
      height: `${this.props.framebufLayout.height}px`,
      imageRendering: 'pixelated',
      clipPath: `polygon(0% 0%, ${cx} 0%, ${cx} ${cy}, 0% ${cy})`,
      overflowX: 'hidden',
      overflowY: 'hidden',
      touchAction: 'none'
    }
    const canvasContainerStyle: CSSProperties = {
      transform: matrix.toCss(
        matrix.mult(
          matrix.scale(this.props.framebufLayout.pixelScaleX, this.props.framebufLayout.pixelScaleY),
            this.clampToWindow(transform)
        )
      )
    };

    return (
      <div
        style={scale}
        ref={this.ref}
        onWheel={this.handleWheel}
        onDoubleClick={this.handleDoubleClick}
        onMouseEnter={this.handleMouseEnter}
        onMouseLeave={this.handleMouseLeave}
        onPointerDown={(e) => this.handlePointerDown(e)}
        onPointerMove={(e) => this.handlePointerMove(e)}
        onPointerUp={(e) => this.handlePointerUp(e)}
        onPointerCancel={(e) => this.handlePointerCancel(e)}
      >
        <div style={canvasContainerStyle}>
          <CharGrid
            width={charWidth}
            height={charHeight}
            grid={false}
            backgroundColor={backg}
            framebuf={this.props.framebuf}
            charPos={isActive && highlightCharPos ? charPos : undefined}
            curScreencode={screencodeHighlight}
            textColor={colorHighlight}
            font={this.props.font}
            colorPalette={this.props.colorPalette}
          />
          {overlays}
          {this.props.canvasGrid ? <GridOverlay width={charWidth} height={charHeight} color={gridColor}   /> : null}
          {this.props.cursorMode ?
            <CharPosOverlay
              framebufWidth={this.props.framebufWidth}
              framebufHeight={this.props.framebufHeight}
              charPos={this.props.cursorPos}
              color='rgba(255,255,255,1)'
            /> :
            null}
        </div>
        {this.renderLoupe(backg)}
      </div>
    )
  }
}

function computeFramebufLayout(args: {
  containerSize: { width: number, height: number },
  framebufSize: { charWidth: number, charHeight: number },
  canvasFit: FramebufUIState['canvasFit'],
  pad?: { right: number, bottom: number }
}) {
  const { bottom: bottomPad, right: rightPad } = args.pad || { bottom: 60, right: 320 };
  const { charWidth, charHeight } = args.framebufSize;
  const maxWidth = args.containerSize.width - rightPad;
  const maxHeight = args.containerSize.height - bottomPad;

  const canvasWidth = charWidth * 8;
  const canvasHeight = charHeight * 8;
  // 80-column glyphs stay 8 dots wide, but occupy half the horizontal space
  // so the screen is the same width as a 40-column screen.
  const aspectX = utils.screenPixelAspectX(charWidth);
  const visualWidth = canvasWidth * aspectX;

  let ws =  maxWidth / visualWidth;
  let divWidth = visualWidth * ws;
  let divHeight = canvasHeight * ws;

  const fitWidth = args.canvasFit == 'fitWidth';
  if (fitWidth) {
    if (divHeight > maxHeight) {
      divHeight = maxHeight;
    }
  } else {
    // If height is now larger than what we can fit in vertically, scale further
    if (divHeight > maxHeight) {
      const s = maxHeight  / divHeight;
      divWidth *= s;
      divHeight *= s;
      ws *= s;
    }
  }

  return {
    width: divWidth,
    height: divHeight,
    pixelScaleX: ws * aspectX,
    pixelScaleY: ws
  }
}

const FramebufferCont = connect(
  (state: RootState) => {
    const selected = state.toolbar.selectedChar
    const charTransform = state.toolbar.charTransform
    const framebuf = selectors.getCurrentFramebuf(state)!
    if (framebuf == null) {
      throw new Error('cannot render FramebufferCont with a null framebuf, see Editor checks.')
    }
    const framebufIndex = screensSelectors.getCurrentScreenFramebufIndex(state);
    const { font } = selectors.getCurrentFramebufFont(state)
    return {
      framebufIndex,
      framebuf: framebuf.framebuf,
      framebufWidth: framebuf.width,
      framebufHeight: framebuf.height,
      backgroundColor: framebuf.backgroundColor,
      undoId: state.toolbar.undoId,
      curScreencode: selectors.getScreencodeWithTransform(selected, font, charTransform),
      selectedTool: state.toolbar.selectedTool,
      textColor: state.toolbar.textColor,
      brush: selectors.transformBrush(state.toolbar.brush, state.toolbar.brushTransform, font),
      brushRegion: state.toolbar.brushRegion,
      textCursorPos: state.toolbar.textCursorPos,
      shiftKey: state.toolbar.shiftKey,
      altKey: state.toolbar.altKey,
      spacebarKey: state.toolbar.spacebarKey,
      font,
      colorPalette: getSettingsCurrentColorPalette(state),
      canvasGrid: state.toolbar.canvasGrid,
      cursorMode: state.toolbar.cursorMode,
      cursorPos: state.toolbar.cursorPos,
      cursorDrawing: state.toolbar.cursorDrawing
    }
  },
  (dispatch: any) => {
    return {
      Framebuffer: Framebuffer.bindDispatch(dispatch),
      Toolbar: Toolbar.bindDispatch(dispatch),
      undo: () => dispatch(ReduxRoot.actions.undo()),
      redo: () => dispatch(ReduxRoot.actions.redo())
    }
  },
  framebufIndexMergeProps
)(FramebufferView)

interface TouchScreenProps {
  framebuf: Framebuf | null;
  framebufUIState: FramebufUIState | undefined;
  colorPalette: Rgb[];
  crtEffect: boolean;
  containerSize: { width: number, height: number } | null;
  borderWidth: number;
}

// The touch UI's canvas: just the screen and its border, fit and centered
// into the container.  (The desktop Editor below also lays out the color
// picker and character selector next to it.)
class TouchScreenView extends Component<TouchScreenProps> {
  render () {
    const { framebuf: fb, framebufUIState, containerSize, colorPalette, borderWidth } = this.props
    if (fb === null || containerSize === null || !framebufUIState) {
      return null
    }
    const layout = computeFramebufLayout({
      containerSize,
      framebufSize: { charWidth: fb.width, charHeight: fb.height },
      canvasFit: 'fitWidthHeight',
      pad: { right: 2*borderWidth, bottom: 2*borderWidth }
    })
    const petScreen = fb.charset === framebuf.CHARSET_PET_UPPER
      || fb.charset === framebuf.CHARSET_PET_LOWER
    const screenStyle: CSSProperties = {
      width: `${layout.width}px`,
      height: `${layout.height}px`,
      borderColor: utils.colorIndexToCssRgb(colorPalette, fb.borderColor),
      borderStyle: 'solid',
      borderWidth: `${borderWidth}px`,
      filter: this.props.crtEffect ? `url(#${petScreen ? CRT_FILTER_PET : CRT_FILTER_COLOR})` : undefined
    }
    return (
      <div className={styles.fbContainer}>
        <div style={screenStyle}>
          <FramebufferCont
            framebufLayout={layout}
            framebufUIState={framebufUIState}
            onCharPosChanged={() => {}} />
        </div>
        {this.props.crtEffect ? <CrtOverlay green={petScreen} /> : null}
      </div>
    )
  }
}

export const TouchScreen = connect(
  (state: RootState) => {
    const framebufIndex = screensSelectors.getCurrentScreenFramebufIndex(state);
    return {
      framebuf: selectors.getCurrentFramebuf(state),
      colorPalette: getSettingsCurrentColorPalette(state),
      crtEffect: state.toolbar.crtEffect,
      framebufUIState: selectors.getFramebufUIState(state, framebufIndex)
    }
  }
)(TouchScreenView)

interface EditorProps {
  framebuf: Framebuf | null;
  framebufUIState: FramebufUIState | undefined;
  textColor: number;
  colorPalette: Rgb[];
  paletteRemap: number[];
  selectedTool: Tool;

  integerScale: boolean;
  crtEffect: boolean;
  containerSize: { width: number, height: number };
}

interface EditorDispatch {
  Toolbar: toolbar.PropsFromDispatch;
}

class Editor extends Component<EditorProps & EditorDispatch> {
  state = {
    isActive: false,
    charPos: { row: -1, col: 0 }
  }

  handleSetColor = (color: number) => {
    this.props.Toolbar.setCurrentColor(color)
  }

  handleCharPosChanged = (args: { isActive: boolean, charPos: Coord2 }) => {
    this.setState({
      charPos: args.charPos,
      isActive: args.isActive
    })
  }

  render() {
    if (this.props.framebuf === null
      || this.props.containerSize == null
      || !this.props.framebufUIState) {
      return null
    }
    const { colorPalette } = this.props
    const borderColor =
      utils.colorIndexToCssRgb(colorPalette, this.props.framebuf.borderColor)

    const framebufSize = computeFramebufLayout({
      containerSize: this.props.containerSize,
      framebufSize: {
        charWidth: this.props.framebuf.width,
        charHeight: this.props.framebuf.height
      },
      canvasFit: this.props.framebufUIState.canvasFit
    });

    const framebufStyle = {
      width: `${framebufSize.width}px`,
      height: `${framebufSize.height}px`,
      borderColor: borderColor,
      borderStyle: 'solid',
      borderWidth: `${16}px` // TODO scale border width
    };
    const scaleX = 1.8;
    const scaleY = scaleX;
    const fbContainerClass =
      classNames(styles.fbContainer, this.props.selectedTool == Tool.PanZoom ? styles.panzoom : null);
    const petScreen = this.props.framebuf.charset === framebuf.CHARSET_PET_UPPER
      || this.props.framebuf.charset === framebuf.CHARSET_PET_LOWER;
    const screenStyle = this.props.crtEffect ?
      { ...framebufStyle, filter: `url(#${petScreen ? CRT_FILTER_PET : CRT_FILTER_COLOR})` } :
      framebufStyle;
    return (
      <div
        className={styles.editorLayoutContainer}
      >
        <div>
          <div
            className={fbContainerClass}
          >
            <div style={screenStyle}>
              {this.props.framebuf ?
                <FramebufferCont
                  framebufLayout={framebufSize}
                  framebufUIState={this.props.framebufUIState}
                  onCharPosChanged={this.handleCharPosChanged} /> :
                null}
            </div>
            {this.props.crtEffect ? <CrtOverlay green={petScreen} /> : null}
          </div>
          <CanvasStatusbar
            framebuf={this.props.framebuf}
            isActive={this.state.isActive}
            charPos={this.state.charPos}
          />
        </div>
        <div style={{marginLeft: '8px', marginRight: '16px'}}>
          <div style={{marginBottom: '10px'}}>
            <ColorPicker
              selected={this.props.textColor}
              paletteRemap={this.props.paletteRemap}
              colorPalette={colorPalette}
              onSelectColor={this.handleSetColor}
              twoRows={true}
              scale={{scaleX, scaleY}}
            />
          </div>
          <CharSelect canvasScale={{scaleX, scaleY}}/>
        </div>
      </div>
    )
  }
}

export default connect(
  (state: RootState) => {
    const framebuf = selectors.getCurrentFramebuf(state)
    const framebufIndex = screensSelectors.getCurrentScreenFramebufIndex(state);
    return {
      framebuf,
      textColor: state.toolbar.textColor,
      selectedTool: state.toolbar.selectedTool,
      paletteRemap: getSettingsPaletteRemap(state),
      colorPalette: getSettingsCurrentColorPalette(state),
      integerScale: getSettingsIntegerScale(state),
      crtEffect: state.toolbar.crtEffect,
      framebufUIState: selectors.getFramebufUIState(state, framebufIndex)
    }
  },
  dispatch => {
    return {
      Toolbar: Toolbar.bindDispatch(dispatch)
    }
  }
)(Editor)
