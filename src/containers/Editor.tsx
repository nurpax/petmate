
import React, { Component, Fragment, CSSProperties, PointerEvent, WheelEvent } from 'react';
import { connect } from 'react-redux'
import classNames from 'classnames'

import ColorPicker from '../components/ColorPicker'
import CharGrid from '../components/CharGrid'
import CharPosOverlay, { TextCursorOverlay } from '../components/CharPosOverlay'
import GridOverlay from '../components/GridOverlay'
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
import * as utils from '../utils';
import * as matrix from '../utils/matrix';

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

const brushOverlayStyleBase: CSSProperties = {
  outlineColor: 'rgba(128, 255, 128, 0.5)',
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
          color='rgba(128, 255, 128, 0.5)'
        />
      )
    }
    const { min, max } = utils.sortRegion(this.props.brushRegion)
    const s: CSSProperties = {
      ...brushOverlayStyleBase,
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

  onCharPosChanged: (args: {isActive: boolean, charPos: Coord2}) => void;

  framebufLayout: {
    width: number, height: number,
    pixelScale: number
  };
}

interface FramebufferViewDispatch {
  Framebuffer: framebuf.PropsFromDispatch;
  Toolbar: toolbar.PropsFromDispatch;
}

interface FramebufferViewState {
  // Floor'd to int
  charPos: Coord2;
  isActive: boolean;
}

class FramebufferView extends Component<FramebufferViewProps & FramebufferViewDispatch, FramebufferViewState> {

  state: FramebufferViewState = {
    charPos: { row: -1, col: 0 },
    isActive: false
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
    const xx = (e.clientX - bbox.left) / this.props.framebufLayout.pixelScale;
    const yy = (e.clientY - bbox.top) / this.props.framebufLayout.pixelScale;

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
    if (this.props.selectedTool == Tool.PanZoom) {
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

  handlePointerUp = (e: PointerEvent) => {
    if (this.props.selectedTool == Tool.PanZoom) {
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

  handlePointerMove = (e: PointerEvent) => {
    if (this.props.selectedTool == Tool.PanZoom) {
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

    // Note: prevCoord is known to be not null here as it's been set
    // in mouse down
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
  //---------------------------------------------------------------------
  // Pan/zoom mouse event handlers.  Called by the bound handlePointerDown/Move/Up
  // functions if the pan/zoom tool is selected.

  private panZoomDragging = true;

  handlePanZoomPointerDown (e: any) {
    this.panZoomDragging = true;
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  handlePanZoomPointerUp (_e: any) {
    this.panZoomDragging = false;
  }

  // Mutable dst
  clampToWindow (xform: matrix.Matrix3x3) {
    // Clamp translation so that the canvas doesn't go out of the window
    let tx = xform.v[0][2];
    let ty = xform.v[1][2];
    tx = Math.min(tx, 0);
    ty = Math.min(ty, 0);
    const [swidth, sheight] = matrix.multVect3(xform, [this.props.framebufWidth*8, this.props.framebufHeight*8, 0]);
    tx = Math.max(tx, -(swidth - this.props.framebufWidth*8));
    ty = Math.max(ty, -(sheight - this.props.framebufHeight*8));
    xform.v[0][2] = tx;
    xform.v[1][2] = ty;
  }

  handlePanZoomPointerMove (e: any) {
    if (this.panZoomDragging) {
      const dx = e.nativeEvent.movementX / this.props.framebufLayout.pixelScale;
      const dy = e.nativeEvent.movementY / this.props.framebufLayout.pixelScale;

      const prevUIState = this.props.framebufUIState;
      const prevTransform = prevUIState.canvasTransform;

      const invXform = matrix.invert(prevTransform);
      const srcDxDy = matrix.multVect3(invXform, [dx, dy, 0]);

      const xform =
        matrix.mult(
          prevTransform,
          matrix.translate(srcDxDy[0], srcDxDy[1])
        );
      this.clampToWindow(xform);

      this.props.Toolbar.setCurrentFramebufUIState({
        ...prevUIState,
        canvasTransform: xform
      });
    }
  }

  handleWheel = (e: WheelEvent) => {
    if (this.props.selectedTool != Tool.PanZoom) {
      return;
    }
    if (!this.ref.current) {
      return;
    }

    const scaleDelta = 1 - (e.deltaY / 150.0);

    const bbox = this.ref.current.getBoundingClientRect();
    const mouseX = (e.nativeEvent.clientX - bbox.left) / this.props.framebufLayout.pixelScale;
    const mouseY = (e.nativeEvent.clientY - bbox.top) / this.props.framebufLayout.pixelScale;

    const prevUIState = this.props.framebufUIState;

    const invXform = matrix.invert(prevUIState.canvasTransform);
    const srcPos = matrix.multVect3(invXform, [mouseX, mouseY, 1]);

    let xform =
      matrix.mult(
        prevUIState.canvasTransform,
        matrix.mult(
          matrix.translate(srcPos[0]-scaleDelta*srcPos[0], srcPos[1]-scaleDelta*srcPos[1]),
          matrix.scale(scaleDelta)
        )
      )

    // Clamp scale to 1.0
    if (xform.v[0][0] < 1.0 || xform.v[1][1] < 1.0) {
      const invScale = matrix.scale(1.0 / xform.v[0][0]);
      xform = matrix.mult(xform, invScale);
      // scale is roughly 1.0 now but let's force float values
      // to exact 1.0
      xform.v[0][0] = 1.0;
      xform.v[1][1] = 1.0;
    }

    this.clampToWindow(xform);

    this.props.Toolbar.setCurrentFramebufUIState({
      ...prevUIState,
      canvasTransform: xform
    })
  }

  render () {
    // Editor needs to specify a fixed width/height because the contents use
    // relative/absolute positioning and thus seem to break out of the CSS
    // grid.
    const charWidth = this.props.framebufWidth;
    const charHeight = this.props.framebufHeight;
    const backg = utils.colorIndexToCssRgb(this.props.colorPalette, this.props.backgroundColor)
    const { selectedTool } = this.props
    let overlays = null
    let screencodeHighlight: number|undefined = this.props.curScreencode
    let colorHighlight: number|undefined = this.props.textColor
    let highlightCharPos = true
    if (this.state.isActive) {
      if (selectedTool === Tool.Brush) {
        highlightCharPos = false
        if (this.props.brush !== null) {
          overlays =
            <BrushOverlay
              charPos={this.state.charPos}
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
              charPos={this.state.charPos}
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
            charPos={this.state.charPos}
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
          {this.state.isActive ?
            <CharPosOverlay
              framebufWidth={this.props.framebufWidth}
              framebufHeight={this.props.framebufHeight}
              charPos={this.state.charPos}
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
      overflowY: 'hidden'
    }
    return (
      <div
        style={scale}
        ref={this.ref}
        onWheel={this.handleWheel}
        onMouseEnter={this.handleMouseEnter}
        onMouseLeave={this.handleMouseLeave}
        onPointerDown={(e) => this.handlePointerDown(e)}
        onPointerMove={(e) => this.handlePointerMove(e)}
        onPointerUp={(e) => this.handlePointerUp(e)}
      >
        <div
          style={{transform: matrix.toCss(
            matrix.mult(
              matrix.scale(this.props.framebufLayout.pixelScale),
              transform
            ))}}
        >
          <CharGrid
            width={charWidth}
            height={charHeight}
            grid={false}
            backgroundColor={backg}
            framebuf={this.props.framebuf}
            charPos={this.state.isActive && highlightCharPos ? this.state.charPos : undefined}
            curScreencode={screencodeHighlight}
            textColor={colorHighlight}
            font={this.props.font}
            colorPalette={this.props.colorPalette}
          />
          {overlays}
          {this.props.canvasGrid ? <GridOverlay width={charWidth} height={charHeight} /> : null}
        </div>
      </div>
    )
  }
}

function computeFramebufLayout(args: {
  containerSize: { width: number, height: number },
  framebufSize: { charWidth: number, charHeight: number }
}) {
  const { charWidth, charHeight } = args.framebufSize;
  const maxWidth = 515;
  const maxHeight = 400;
  const canvasWidth = charWidth * 8;
  const canvasHeight = charHeight * 8;
  if (canvasHeight > canvasWidth) {
    const ws = maxHeight / canvasHeight;
    return {
      width: canvasWidth * ws,
      height: canvasHeight * ws,
      pixelScale: ws
    }
  }
  const ws = maxWidth / canvasWidth;
  return {
    width: canvasWidth * ws,
    height: canvasHeight * ws,
    pixelScale: ws
  };
}

const FramebufferCont = connect(
  (state: RootState) => {
    const selected = state.toolbar.selectedChar
    const charTransform = state.toolbar.charTransform
    const framebufIndex = screensSelectors.getCurrentScreenFramebufIndex(state);
    const framebuf = selectors.getCurrentFramebuf(state)!
    if (framebuf == null) {
      throw new Error('cannot render FramebufferCont with a null framebuf, see Editor checks.')
    }
    const font = selectors.getCurrentFramebufFont(state)
    return {
      framebufIndex: screensSelectors.getCurrentScreenFramebufIndex(state),
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
      font,
      colorPalette: getSettingsCurrentColorPalette(state),
      canvasGrid: state.toolbar.canvasGrid,
      framebufUIState: selectors.getFramebufUIState(state, framebufIndex!)
    }
  },
  dispatch => {
    return {
      Framebuffer: Framebuffer.bindDispatch(dispatch),
      Toolbar: Toolbar.bindDispatch(dispatch)
    }
  },
  framebufIndexMergeProps
)(FramebufferView)

interface EditorProps {
  framebuf: Framebuf | null;
  textColor: number;
  colorPalette: Rgb[];
  paletteRemap: number[];
  selectedTool: Tool;

  integerScale: boolean;
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
    if (this.props.framebuf === null || this.props.containerSize == null) {
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
      }
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
    return (
      <div
        className={styles.editorLayoutContainer}
      >
        <div>
          <div
            className={fbContainerClass}
            style={framebufStyle}>
            {this.props.framebuf ?
              <FramebufferCont
                framebufLayout={framebufSize}
                onCharPosChanged={this.handleCharPosChanged} /> :
              null}
          </div>
          <CanvasStatusbar
            framebuf={this.props.framebuf}
            isActive={this.state.isActive}
            charPos={this.state.charPos}
          />
        </div>
        <div style={{marginLeft: '8px'}}>
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
    return {
      framebuf,
      textColor: state.toolbar.textColor,
      selectedTool: state.toolbar.selectedTool,
      paletteRemap: getSettingsPaletteRemap(state),
      colorPalette: getSettingsCurrentColorPalette(state),
      integerScale: getSettingsIntegerScale(state)
    }
  },
  dispatch => {
    return {
      Toolbar: Toolbar.bindDispatch(dispatch)
    }
  }
)(Editor)

