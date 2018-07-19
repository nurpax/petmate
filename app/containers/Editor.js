
import React, { Component, Fragment, PureComponent } from 'react';
import { connect } from 'react-redux'
import ReactCursorPosition from 'react-cursor-position'
import classnames from 'classnames'

import ColorPicker from '../components/ColorPicker'

import { Framebuffer } from '../redux/editor'
import {
  Toolbar,
  TOOL_DRAW,
  TOOL_COLORIZE,
  TOOL_BRUSH
} from '../redux/toolbar'
import { selectChar } from '../actions/editor'
import styles from './Editor.css';
import * as utils from '../utils';

const charGridScaleStyle = {
  position: 'relative',
  transform: 'scale(2,2)',
  transformOrigin: '0% 0%'
}

const withMouseCharPosition = (C, options) => {
  class ToCharRowCol extends Component {
    constructor (props) {
      super(props)
    }
    render () {
      const grid = options !== undefined ? options.grid : false
      const { position, ...props } = this.props
      const scl = grid ? 17 : 16
      const col = Math.floor(this.props.position.x / scl)
      const row = Math.floor(this.props.position.y / scl)
      return <C charPos={{row, col}} grid={grid} {...props} />
    }
  }
  return class extends Component {
    render () {
      return (
        <ReactCursorPosition>
          <ToCharRowCol {...this.props}/>
        </ReactCursorPosition>
      )
    }
  }
}

const nativeImage = require('electron').nativeImage

// TODO use blob URIs instead of data URIs
class CharsetCache {
  constructor () {
    const data = utils.loadAppFile('./assets/system-charset.bin')
    this.dataURIs = Array(16)

    for (let colorIdx = 0; colorIdx < 16; colorIdx++) {
      const color = utils.palette[colorIdx]
      this.dataURIs[colorIdx] = []

      for (let c = 0; c < 256; c++) {
        const boffs = c*8;
        const char = []

        for (let y = 0; y < 8; y++) {
          const p = data[boffs+y]
          for (let i = 0; i < 8; i++) {
            const v = ((128 >> i) & p) ? 255 : 0
            char.push(color.b)
            char.push(color.g)
            char.push(color.r)
            char.push(v)
          }
        }
        const img = nativeImage.createFromBuffer(Buffer.from(char), {width: 8, height: 8})
        this.dataURIs[colorIdx].push(img.toDataURL())
      }
    }
  }

  getDataURI(screencode, color) {
    return this.dataURIs[color][screencode]
  }
}

const charset = new CharsetCache()

function renderChar (key, cls, x, y, pix, grid, bg) {
  const scl = grid ? 8.5 : 8
  const s = {
    position: 'absolute',
    transform: `translate(${x*scl}px, ${y*scl}px)`,
    backgroundColor: bg
  }
  return (
    <img
      key={key}
      draggable={false}
      style={s}
      className={classnames(styles.pixelated, cls)}
      width={8}
      height={8}
      src={charset.getDataURI(pix.code, pix.color)}
    />
  )
}

class CharGrid extends Component {
  constructor (props) {
    super(props)
    this.resetCache(props)
  }

  shouldComponentUpdate (nextProps, nextState) {
    return  (
      this.props.width !== nextProps.width ||
      this.props.height !== nextProps.height ||
      this.props.srcX !== nextProps.srcX ||
      this.props.srcY !== nextProps.srcY ||
      this.props.framebuf !== nextProps.framebuf ||
      this.props.backgroundColor !== nextProps.backgroundColor ||
      this.props.selected !== nextProps.selected
    )
  }

  resetCache (props) {
    this.cachedWidth = props.width
    this.cachedHeight = props.height
    this.images  = Array(props.width*props.height).fill(null)
    this.classes = Array(props.width*props.height).fill(null)
    this.pix = Array(props.width*props.height).fill(null)
    this.prevBackgroundColor = null
  }

  render () {
    const { width, height, selected } = this.props
    const srcX = this.props.srcX !== undefined ? this.props.srcX : 0
    const srcY = this.props.srcY !== undefined ? this.props.srcY : 0

    if (width !== this.cachedWidth || height !== this.cachedHeight) {
      this.resetCache(this.props)
    }

    for (var y = 0; y < height; y++) {
      const fbRow = this.props.framebuf[y + srcY]
      for (var x = 0; x < width; x++) {
        let cls = styles.char
        if (selected !== undefined) {
          const { row, col } = selected
          if (y === row && x === col) {
            cls = styles.charSelected
          }
        }

        const idx = y*width + x
        const pix = fbRow[x + srcX]

        if (this.images[idx] == null ||
            this.classes[idx] !== cls ||
            this.prevBackgroundColor !== this.props.backgroundColor ||
            this.pix[idx] !== pix) {
          this.images[idx] = renderChar(idx, cls, x, y, pix, this.props.grid, this.props.backgroundColor)
          this.pix[idx] = pix
          this.classes[idx] = cls
        }
      }
    }
    this.prevBackgroundColor = this.props.backgroundColor
    return this.images
  }
}

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
      color: this.props.curTextColor,
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
    let brushOverlays = null
    if (selectedTool === TOOL_BRUSH) {
      brushOverlays =
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
    }
    return (
      <div
        style={charGridScaleStyle}
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
        {brushOverlays}
      </div>
    )
  }
}
const FramebufferView = withMouseCharPosition(FramebufferView_)

class CharSelect_ extends Component {
  constructor (props) {
    super(props)
    this.computeCachedFb(0)
  }

  computeCachedFb(textColor) {
    this.fb = Array(16).fill({}).map((_, y) => {
      return Array(16).fill({}).map((_, x) => {
        return {
          code: utils.charScreencodeFromRowCol({row:y, col:x}),
          color: textColor
        }
      })
    })
    this.prevTextColor = textColor
  }

  handleClick = () => {
    this.props.setSelectedChar(this.props.charPos)
  }

  render () {
    // Editor needs to specify a fixed width/height because the contents use
    // relative/absolute positioning and thus seem to break out of the CSS
    // grid.
    const w = `${2*8*16+16}px`
    const h = `${2*8*16+16}px`
    const backg = utils.colorIndexToCssRgb(this.props.backgroundColor)
    const s = {width: w, height:h}

    if (this.prevTextColor !== this.props.textColor) {
      this.computeCachedFb(this.props.textColor)
    }

    return (
      <div className={styles.csContainer} style={s}>
        <div
          style={charGridScaleStyle}
          onClick={this.handleClick}
        >
          <CharGrid
            width={16}
            height={16}
            backgroundColor={backg}
            grid={true}
            framebuf={this.fb}
            selected={this.props.selected}
          />
        </div>
      </div>
    )
  }
}
const CharSelect = withMouseCharPosition(CharSelect_, {
  grid: true
})

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
          <FramebufferView
            Framebuffer={this.props.Framebuffer}
            Toolbar={this.props.Toolbar}
            undoId={this.props.undoId}
            curScreencode={this.props.curScreencode}
            curTextColor={this.props.textColor}
            selectedTool={this.props.selectedTool}
            framebuf={this.props.framebuf}
            framebufWidth={this.props.framebufWidth}
            framebufHeight={this.props.framebufHeight}
            backgroundColor={this.props.backgroundColor}
            brushRegion={this.props.brushRegion}
            brush={this.props.brush}
            captureBrush={this.props.captureBrush}
          />
        </div>
        <div style={{marginLeft: '5px'}}>
          <CharSelect
            selected={this.props.selected}
            setSelectedChar={this.props.Toolbar.setSelectedChar}
            textColor={this.props.textColor}
            backgroundColor={this.props.backgroundColor}
          />
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
    Framebuffer: Framebuffer.bindDispatch(dispatch),
    Toolbar: Toolbar.bindDispatch(dispatch)
  }
}

const mapStateToProps = state => {
  const selected = state.toolbar.selectedChar
  const framebuf = state.framebuf.present
  return {
    framebuf: framebuf.framebuf,
    framebufWidth: framebuf.width,
    framebufHeight: framebuf.height,
    backgroundColor: framebuf.backgroundColor,
    borderColor: framebuf.borderColor,
    selected,
    undoId: state.toolbar.undoId,
    curScreencode: utils.charScreencodeFromRowCol(selected),
    selectedTool: state.toolbar.selectedTool,
    textColor: state.toolbar.textColor,
    brush: state.toolbar.brush,
    brushRegion: state.toolbar.brushRegion
  }
}
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Editor)

