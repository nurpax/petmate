
import React, { Component, Fragment, CSSProperties } from 'react';
import { connect } from 'react-redux'

import ColorPicker from '../components/ColorPicker'
import CharGrid from '../components/CharGrid'
import CharPosOverlay, { TextCursorOverlay } from '../components/CharPosOverlay'
import GridOverlay from '../components/GridOverlay'
import { CanvasStatusbar } from '../components/Statusbar'

import CharSelect from './CharSelect'

import { withMouseCharPositionShiftLockAxis, DragStartFunc, AltClickFunc, DragMoveFunc, DragEndFunc } from './hoc'

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

import styles from './Editor.module.css';
import {
  RootState,
  BrushRegion,
  Coord2,
  Rgb,
  Brush,
  Font,
  Tool,
  TOOL_DRAW, TOOL_COLORIZE, TOOL_CHAR_DRAW, TOOL_BRUSH, TOOL_TEXT, Pixel, Framebuf
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

  isActive: boolean;
  charPos: Coord2;
  onMouseDown: (e: any, dragStart: DragStartFunc, altClick: AltClickFunc) => void;
  onMouseMove: (e: any, dragMove: DragMoveFunc) => void;
  onMouseUp:   (e: any, dragEnd: DragEndFunc) => void;

  altKey: boolean;
  shiftKey: boolean;

  textCursorPos: Coord2;
  canvasScale: { scaleX: number, scaleY: number };

  framebuf: Pixel[][];
  framebufWidth: number;
  framebufHeight: number;
  selectedTool: Tool;
  brush: Brush | null;
  brushRegion: BrushRegion | null;

  backgroundColor: number;
  textColor: number;
  curScreencode: number;
  colorPalette: Rgb[];

  font: Font;

  canvasGrid: boolean;
}

interface FramebufferViewDispatch {
  Framebuffer: framebuf.PropsFromDispatch;
  Toolbar: toolbar.PropsFromDispatch;
}
class FramebufferView_ extends Component<FramebufferViewProps & FramebufferViewDispatch> {

  prevDragPos: Coord2|null = null;

  setChar = (clickLoc: Coord2) => {
    const { undoId } = this.props;
    const params = {
      ...clickLoc,
    }
    if (this.props.selectedTool === TOOL_DRAW) {
      this.props.Framebuffer.setPixel({
        ...params,
        color: this.props.textColor,
        screencode: this.props.curScreencode
      }, undoId)
    } else if (this.props.selectedTool === TOOL_COLORIZE) {
      this.props.Framebuffer.setPixel({
        ...params,
        color: this.props.textColor,
      }, undoId)
    } else if (this.props.selectedTool === TOOL_CHAR_DRAW) {
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
    if (selectedTool === TOOL_DRAW ||
        selectedTool === TOOL_COLORIZE ||
        selectedTool === TOOL_CHAR_DRAW) {
      this.setChar(coord)
    } else if (selectedTool === TOOL_BRUSH) {
      if (this.props.brush === null) {
        this.props.Toolbar.setBrushRegion({
          min: coord,
          max: coord
        })
      } else {
        this.brushDraw(coord)
      }
    } else if (selectedTool === TOOL_TEXT) {
      this.props.Toolbar.setTextCursorPos(coord)
    }
    this.prevDragPos = coord
  }

  dragMove = (coord: Coord2) => {
    const prevDragPos = this.prevDragPos!; // set in dragStart
    const { selectedTool, brush, brushRegion } = this.props
    if (selectedTool === TOOL_DRAW ||
        selectedTool === TOOL_COLORIZE ||
        selectedTool === TOOL_CHAR_DRAW) {
      utils.drawLine((x,y) => {
        this.setChar({ row:y, col:x })
      }, prevDragPos.col, prevDragPos.row, coord.col, coord.row)
    } else if (selectedTool === TOOL_BRUSH) {
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
    if (selectedTool === TOOL_BRUSH) {
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

  render () {
    // Editor needs to specify a fixed width/height because the contents use
    // relative/absolute positioning and thus seem to break out of the CSS
    // grid.
    const W = 40
    const H = 25
    const backg = utils.colorIndexToCssRgb(this.props.colorPalette, this.props.backgroundColor)
    const { selectedTool } = this.props
    let overlays = null
    let screencodeHighlight: number|undefined = this.props.curScreencode
    let colorHighlight: number|undefined = this.props.textColor
    let highlightCharPos = true
    if (this.props.isActive) {
      if (selectedTool === TOOL_BRUSH) {
        highlightCharPos = false
        if (this.props.brush !== null) {
          overlays =
            <BrushOverlay
              charPos={this.props.charPos}
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
              charPos={this.props.charPos}
              framebufWidth={this.props.framebufWidth}
              framebufHeight={this.props.framebufHeight}
              brushRegion={this.props.brushRegion}
            />
        }
      } else if (
        selectedTool === TOOL_DRAW ||
        selectedTool === TOOL_COLORIZE ||
        selectedTool === TOOL_CHAR_DRAW
      ) {
        overlays =
          <CharPosOverlay
            framebufWidth={this.props.framebufWidth}
            framebufHeight={this.props.framebufHeight}
            charPos={this.props.charPos}
            opacity={0.5}
          />
        if (selectedTool === TOOL_COLORIZE) {
          screencodeHighlight = undefined;
        } else if (selectedTool === TOOL_CHAR_DRAW) {
          colorHighlight = undefined;
        }
        // Don't show current char/color when the ALT color/char picker is active
        if (this.props.altKey) {
          highlightCharPos = false;
        }
      }
    }

    if (selectedTool === TOOL_TEXT) {
      screencodeHighlight = undefined;
      colorHighlight = undefined;
      const { textCursorPos, charPos, textColor } = this.props
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
          {this.props.isActive ?
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

    const { scaleX, scaleY } = this.props.canvasScale
    const scale: CSSProperties = {
      width: W*8,
      height: H*8,
      transform: `scale(${scaleX},${scaleY})`,
      transformOrigin: '0% 0%',
      imageRendering: 'pixelated'
    }
    return (
      <div
        style={scale}
        onPointerDown={(e) => this.props.onMouseDown(e, this.dragStart, this.altClick)}
        onPointerMove={(e) => this.props.onMouseMove(e, this.dragMove)}
        onPointerUp={(e) => this.props.onMouseUp(e, this.dragEnd)}
      >
        <CharGrid
          width={W}
          height={H}
          grid={false}
          backgroundColor={backg}
          framebuf={this.props.framebuf}
          charPos={this.props.isActive && highlightCharPos ? this.props.charPos : undefined}
          curScreencode={screencodeHighlight}
          textColor={colorHighlight}
          font={this.props.font}
          colorPalette={this.props.colorPalette}
        />
        {overlays}
        {this.props.canvasGrid ? <GridOverlay width={W} height={H} /> : null}
      </div>
    )
  }
}
const FramebufferView = withMouseCharPositionShiftLockAxis(FramebufferView_)

const FramebufferCont = connect(
  (state: RootState) => {
    const selected = state.toolbar.selectedChar
    const charTransform = state.toolbar.charTransform
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
      canvasGrid: state.toolbar.canvasGrid
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

  integerScale: boolean;
  containerSize: { width: number, height: number };
}

interface EditorDispatch {
  Toolbar: toolbar.PropsFromDispatch;
}

class Editor extends Component<EditorProps & EditorDispatch> {
  state = {
    isActive: false,
    charPos: null
  }

  handleSetColor = (color: number) => {
    this.props.Toolbar.setCurrentColor(color)
  }

  handleCharPosChange = (args: { charPos: Coord2 }) => {
    this.setState({
      charPos: args.charPos
    })
  }

  handleActivationChanged = (args: {isActive: boolean}) => {
    this.setState({
      isActive: args.isActive
    })
  }

  render() {
    if (this.props.framebuf === null) {
      return null
    }
    const { colorPalette } = this.props
    const borderColor =
      utils.colorIndexToCssRgb(colorPalette, this.props.framebuf.borderColor)

    let scaleX = 1
    if (this.props.containerSize !== null) {
      scaleX = this.props.containerSize.width/515.0
    }
    if (this.props.integerScale) {
      // TOOD this depends on the desktop resolution.  On macOS this produces
      // reasonable resoluts in the 1.5x scale case.  If we don't
      // floor(x*2)/2, there will be fewer scale steps when resizing the
      // window.  This feels a bit confusing.
      scaleX = Math.floor(scaleX*2)
      scaleX /= 2
    }
    const scaleY = scaleX
    const { width: charW, height: charH } = this.props.framebuf
    const fbWidth = Math.floor(charW*8 * scaleX)
    const fbHeight = Math.floor(charH*8 * scaleY)
    const framebufSize = {
      width: `${fbWidth}px`,
      height: `${fbHeight}px`,
    }
    const framebufStyle = {
      ...framebufSize,
      borderColor: borderColor,
      borderStyle: 'solid',
      borderWidth: `${scaleX*16}px`
    }
    return (
      <div
        className={styles.editorLayoutContainer}
      >
        <div>
          <div
            className={styles.fbContainer}
            style={framebufStyle}>
            {this.props.framebuf ?
              <FramebufferCont
                containerSize={framebufSize}
                canvasScale={{scaleX, scaleY}}
                onActivationChanged={this.handleActivationChanged}
                onCharPosChange={this.handleCharPosChange} /> :
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

