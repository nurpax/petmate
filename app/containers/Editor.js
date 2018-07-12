
import React, { Component, PureComponent } from 'react';
import { connect } from 'react-redux'
import ReactCursorPosition from 'react-cursor-position'
import classnames from 'classnames'

import ColorPicker from '../components/ColorPicker'

import { Framebuffer } from '../redux/editor'
import { Toolbar, TOOL_DRAW, TOOL_COLORIZE } from '../redux/toolbar'
import { selectChar } from '../actions/editor'
import styles from './Editor.css';
import * as utils from '../utils';

const withMouseCharPosition = (C) => {
  class ToCharRowCol extends Component {
    constructor (props) {
      super(props)
    }
    render () {
      const { position, ...props} = this.props
      const col = Math.floor(this.props.position.x / 16)
      const row = Math.floor(this.props.position.y / 16)
      return <C charPos={{row, col}} {...props} />
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

var fs = require('fs')
const nativeImage = require('electron').nativeImage

// TODO use blob URIs instead of data URIs
class CharsetCache {
  constructor () {
    const data = fs.readFileSync('./app/assets/system-charset.bin')

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

function renderChar (key, cls, x, y, pix) {
  const s = {
    position: 'absolute',
    transform: `translate(${x*8}px, ${y*8}px)`
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

class CharGrid_ extends Component {
  constructor (props) {
    super(props)
    this.images  = Array(props.width*props.height).fill(null)
    this.classes = Array(props.width*props.height).fill(null)
    this.pix = Array(props.width*props.height).fill(null)

    this.dragging = false
    this.prevCoord = null
  }

  shouldComponentUpdate (nextProps, nextState) {
    return  (
      this.props.framebuf !== nextProps.framebuf ||
      this.props.selected !== nextProps.selected
    )
  }

  handleClick = (e) => {
    if (this.props.onClickChar !== undefined) {
      this.props.onClickChar(this.props.charPos)
    }
  }

  handleMouseDown = (e) => {
    const { charPos } = this.props
    this.dragging = true
    this.prevCoord = charPos
    if (this.props.onDragStart !== undefined) {
      this.props.onDragStart(charPos)
    }
  }

  handleMouseUp = (e) => {
    this.dragging = false
    if (this.props.onDragEnd !== undefined) {
      this.props.onDragEnd()
    }
  }

  handleMouseMove = (e) => {
    if (this.dragging) {
      const coord = this.props.charPos
      if (this.prevCoord.row !== coord.row ||
          this.prevCoord.col !== coord.col) {
        this.prevCoord = coord
        if (this.props.onDragMove !== undefined) {
          this.props.onDragMove(coord)
        }
      }
    }
  }

  render () {
    const { width, height, selected} = this.props

    for (var y = 0; y < height; y++) {
      const fbRow = this.props.framebuf[y]
      for (var x = 0; x < width; x++) {
        let cls = styles.char
        if (selected !== undefined) {
          const { row, col } = selected
          if (y === row && x === col) {
            cls = styles.charSelected
          }
        }

        const idx = y*width + x
        const pix = fbRow[x]

        if (this.images[idx] == null ||
            this.classes[idx] !== cls ||
            this.pix[idx] !== pix) {
          this.images[idx] = renderChar(idx, cls, x, y, pix)
          this.pix[idx] = pix
          this.classes[idx] = cls
        }
      }
    }
    const divStyle = {
      position: 'relative',
      transform: 'scale(2,2)',
      transformOrigin: '0% 0%',
    }
    return (
      <div
        onMouseDown={this.handleMouseDown}
        onMouseUp={this.handleMouseUp}
        onMouseMove={this.handleMouseMove}
        onClick={this.handleClick}
        style={divStyle}>
        {this.images}
      </div>
    )
  }
}

const CharGrid = withMouseCharPosition(CharGrid_)

class FramebufferView extends Component {
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
    }
  }

  handleDragStart = (coord) => {
    this.setChar(coord)
  }

  handleDragMove = (coord) => {
    this.setChar(coord)
  }

  handleDragEnd = () => {
    this.props.Toolbar.incUndoId()
  }

  render () {
    // Editor needs to specify a fixed width/height because the contents use
    // relative/absolute positioning and thus seem to break out of the CSS
    // grid.
    const backg = utils.colorIndexToCssRgb(this.props.backgroundColor)
    const border = utils.colorIndexToCssRgb(this.props.borderColor)
    const s = {
      width: '640px', height:'400px',
      backgroundColor: backg,
      borderColor: border
    }
    return (
      <div className={styles.fbContainer} style={s}>
        <CharGrid
          width={40}
          height={25}
          onDragStart={this.handleDragStart}
          onDragMove={this.handleDragMove}
          onDragEnd={this.handleDragEnd}
          framebuf={this.props.framebuf}
        />
      </div>
    )
  }
}

class CharSelect extends Component {
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

  render () {
    // Editor needs to specify a fixed width/height because the contents use
    // relative/absolute positioning and thus seem to break out of the CSS
    // grid.
    const backg = utils.colorIndexToCssRgb(this.props.backgroundColor)
    const s = {width: '256px', height:'256px', backgroundColor: backg}

    if (this.prevTextColor !== this.props.textColor) {
      this.computeCachedFb(this.props.textColor)
    }

    return (
      <div className={styles.csContainer} style={s}>
        <CharGrid
          width={16}
          height={16}
          framebuf={this.fb}
          selected={this.props.selected}
          onClickChar={this.props.setSelectedChar}
        />
      </div>
    )
  }
}

class Editor extends Component {
  render() {
    return (
      <div className={styles.editorLayoutContainer}>
        <FramebufferView
          Framebuffer={this.props.Framebuffer}
          Toolbar={this.props.Toolbar}
          undoId={this.props.undoId}
          curScreencode={this.props.curScreencode}
          curTextColor={this.props.textColor}
          selectedTool={this.props.selectedTool}
          framebuf={this.props.framebuf}
          backgroundColor={this.props.backgroundColor}
          borderColor={this.props.borderColor}
        />
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
    backgroundColor: framebuf.backgroundColor,
    borderColor: framebuf.borderColor,
    selected,
    undoId: state.toolbar.undoId,
    curScreencode: utils.charScreencodeFromRowCol(selected),
    selectedTool: state.toolbar.selectedTool,
    textColor: state.toolbar.textColor
  }
}
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Editor)

