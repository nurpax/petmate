
import React, { Component, Fragment, PureComponent } from 'react';
import { connect } from 'react-redux'
import classnames from 'classnames'

import ColorPicker from '../components/ColorPicker'
import CharGrid from '../components/CharGrid'
import CharPosOverlay from '../components/CharPosOverlay'

import CharSelect from './CharSelect'

import { withMouseCharPosition } from './hoc'

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
      return null
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
    this.dragging = false
    this.prevCoord = null
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
    const { selectedTool } = this.props
    if (selectedTool === TOOL_DRAW ||
        selectedTool === TOOL_COLORIZE) {
      this.setChar(coord)
    } else if (selectedTool === TOOL_BRUSH) {
      if (this.props.brush === null) {
        this.props.Toolbar.setBrushRegion({
          ...this.props.brushRegion,
          max: coord
        })
      } else {
        this.brushDraw(coord)
      }
    } else {
      console.error('not implemented')
    }
  }

  dragEnd = () => {
    const { selectedTool } = this.props
    if (selectedTool === TOOL_BRUSH && this.props.brush === null) {
      this.props.Toolbar.captureBrush(this.props.framebuf, this.props.brushRegion)
    }
    this.props.Toolbar.incUndoId()
  }

  handleMouseDown = (e) => {
    const { charPos } = this.props
    this.dragging = true
    this.prevCoord = charPos
    this.dragStart(charPos)
  }

  handleMouseUp = (e) => {
    const { charPos } = this.props
    this.dragging = false
    this.dragEnd()
  }

  handleMouseMove = (e) => {
    if (this.dragging) {
      const coord = this.props.charPos
      if (this.prevCoord.row !== coord.row ||
          this.prevCoord.col !== coord.col) {
        this.prevCoord = coord
        this.dragMove(coord)
      }
    }
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
    if (selectedTool === TOOL_BRUSH && this.props.isActive) {
      overlays =
        <Fragment>
          <BrushSelectOverlay
            brushRegion={this.props.brushRegion}
          />
          <BrushOverlay
            charPos={this.props.charPos}
            backgroundColor={backg}
            brush={this.props.brush}
            framebufWidth={this.props.framebufWidth}
            framebufHeight={this.props.framebufHeight}
          />
        </Fragment>
    } else if (selectedTool === TOOL_DRAW || selectedTool === TOOL_COLORIZE) {
      overlays = this.props.isActive ? <CharPosOverlay charPos={this.props.charPos} opacity={0.5} /> : null
    }
    const scale = {
      ...charGridScaleStyle,
      width: W*8,
      height: H*8
    }
    return (
      <div
        style={scale}
        onMouseMove={this.handleMouseMove}
        onMouseDown={this.handleMouseDown}
        onMouseUp={this.handleMouseUp}
      >
        <CharGrid
          width={W}
          height={H}
          grid={false}
          backgroundColor={backg}
          framebuf={this.props.framebuf}
        />
        {overlays}
      </div>
    )
  }
}
const FramebufferView = withMouseCharPosition(FramebufferView_)

const FramebufferCont = connect(
  state => {
    const selected = state.toolbar.selectedChar
    const framebuf = selectors.getCurrentFramebuf(state)
    return {
      framebufIndex: selectors.getCurrentFramebufIndex(state),
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
      brushRegion: state.toolbar.brushRegion
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
    const borderColor = utils.colorIndexToCssRgb(this.props.borderColor)
    const framebufStyle = {
      width: '640px', height:'400px',
      borderColor: borderColor
    }
    return (
      <div className={styles.editorLayoutContainer}>
        <div className={styles.fbContainer} style={framebufStyle}>
          <FramebufferCont />
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
    borderColor: framebuf.borderColor,
    textColor: state.toolbar.textColor
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Editor)

