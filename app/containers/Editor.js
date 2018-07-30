
import React, { Component, Fragment, PureComponent } from 'react';
import { connect } from 'react-redux'
import classnames from 'classnames'

import ColorPicker from '../components/ColorPicker'
import CharGrid from '../components/CharGrid'
import CharPosOverlay from '../components/CharPosOverlay'

import CharSelect from './CharSelect'

import {
  withMouseCharPosition,
  withMouseCharPositionShiftLockAxis
} from './hoc'

import { Framebuffer } from '../redux/editor'
import * as selectors from '../redux/selectors'
import { framebufIndexMergeProps }  from '../redux/utils'

import {
  Toolbar,
  TOOL_DRAW,
  TOOL_COLORIZE,
  TOOL_BRUSH
} from '../redux/toolbar'
import { selectChar } from '../actions/editor'
import * as utils from '../utils';

import styles from './Editor.css';
import { charGridScaleStyle }  from './inlineStyles'

const brushOverlayStyleBase = {
  outlineColor: 'rgba(128, 255, 128, 0.5)',
  outlineStyle: 'solid',
  outlineWidth: 0.5,
  backgroundColor: 'rgba(255,255,255,0)',
  zIndex: 1,
  pointerEvents:'none'
}

class BrushSelectOverlay extends Component {
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
    const s = {
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

function computeBrushDstPos (charPos, { width, height }) {
  return {
    col: charPos.col - Math.floor(width/2),
    row: charPos.row - Math.floor(height/2)
  }
}

class BrushOverlay extends Component {
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
    const s = {
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
          framebuf={this.props.brush.framebuf}
        />
      </div>
    )
  }
}

class FramebufferView_ extends Component {

  constructor (props) {
    super(props)
  }

  setChar = (clickLoc) => {
    const params = {
      ...clickLoc,
      color: this.props.textColor,
      undoId: this.props.undoId
    }
    if (this.props.selectedTool === TOOL_DRAW) {
      this.props.Framebuffer.setPixel({
        ...params,
        screencode: this.props.curScreencode
      })
    } else if (this.props.selectedTool === TOOL_COLORIZE) {
      this.props.Framebuffer.setPixel(params)
    } else {
      console.error('shouldn\'t get here')
    }
  }

  brushDraw = (coord) => {
    const { min, max } = this.props.brush.brushRegion
    const area = {
      width: max.col - min.col + 1,
      height: max.row - min.row + 1
    }
    const destPos = computeBrushDstPos(coord, area)
    this.props.Framebuffer.setBrush({
      ...destPos,
      brush: this.props.brush,
      undoId: this.props.undoId
    })
  }

  dragStart = (coord) => {
    const { selectedTool } = this.props
    if (selectedTool === TOOL_DRAW ||
        selectedTool === TOOL_COLORIZE) {
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
    }
  }

  dragMove = (coord) => {
    const { selectedTool, brush, brushRegion } = this.props
    if (selectedTool === TOOL_DRAW ||
        selectedTool === TOOL_COLORIZE) {
      this.setChar(coord)
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

  render () {
    // Editor needs to specify a fixed width/height because the contents use
    // relative/absolute positioning and thus seem to break out of the CSS
    // grid.
    const W = 40
    const H = 25
    const backg = utils.colorIndexToCssRgb(this.props.backgroundColor)
    const { selectedTool } = this.props
    let overlays = null
    let screencodeHighlight = this.props.curScreencode
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
      } else if (selectedTool === TOOL_DRAW || selectedTool === TOOL_COLORIZE) {
        overlays =
          <CharPosOverlay
            framebufWidth={this.props.framebufWidth}
            framebufHeight={this.props.framebufHeight}
            charPos={this.props.charPos} opacity={0.5}
        />
        if (selectedTool === TOOL_COLORIZE) {
          screencodeHighlight = null
        }
      }
    }
    const scale = {
      ...charGridScaleStyle,
      width: W*8,
      height: H*8
    }
    return (
      <div
        style={scale}
        onPointerDown={(e) => this.props.onMouseDown(e, this.dragStart)}
        onPointerMove={(e) => this.props.onMouseMove(e, this.dragMove)}
        onPointerUp={(e) => this.props.onMouseUp(e, this.dragEnd)}
      >
        <CharGrid
          width={W}
          height={H}
          grid={false}
          backgroundColor={backg}
          framebuf={this.props.framebuf}
          charPos={this.props.isActive && highlightCharPos ? this.props.charPos : null}
          curScreencode={screencodeHighlight}
          textColor={this.props.textColor}
        />
        {overlays}
      </div>
    )
  }
}
const FramebufferView = withMouseCharPositionShiftLockAxis(FramebufferView_)

const FramebufferCont = connect(
  state => {
    const selected = state.toolbar.selectedChar
    const framebuf = selectors.getCurrentFramebuf(state)
    return {
      framebufIndex: selectors.getCurrentScreenFramebufIndex(state),
      framebuf: framebuf.framebuf,
      framebufWidth: framebuf.width,
      framebufHeight: framebuf.height,
      backgroundColor: framebuf.backgroundColor,
      selected,
      undoId: state.toolbar.undoId,
      curScreencode: utils.charScreencodeFromRowCol(selected),
      selectedTool: state.toolbar.selectedTool,
      textColor: state.toolbar.textColor,
      brush: state.toolbar.brush,
      brushRegion: state.toolbar.brushRegion,
      shiftKey: state.toolbar.shiftKey
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

class Editor extends Component {
  render() {
    if (this.props.framebuf === null) {
      return null
    }
    const borderColor = utils.colorIndexToCssRgb(this.props.framebuf.borderColor)
    const framebufStyle = {
      width: '640px', height:'400px',
      borderColor: borderColor
    }
    return (
      <div className={styles.editorLayoutContainer}>
        <div className={styles.fbContainer} style={framebufStyle}>
          {this.props.framebuf ? <FramebufferCont /> : null}
        </div>
        <div style={{marginLeft: '5px'}}>
          <CharSelect />
          <div style={{marginTop: '5px'}}>
            <ColorPicker
              selected={this.props.textColor}
              onSelectColor={this.props.Toolbar.setTextColor}
            />
          </div>
        </div>
      </div>
    )
  }
}

const mapDispatchToProps = dispatch => {
  return {
    Toolbar: Toolbar.bindDispatch(dispatch)
  }
}

const mapStateToProps = state => {
  const selected = state.toolbar.selectedChar
  const framebuf = selectors.getCurrentFramebuf(state)
  return {
    framebuf,
    textColor: state.toolbar.textColor
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Editor)

