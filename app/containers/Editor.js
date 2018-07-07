
import React, { Component, PureComponent } from 'react';
import { connect } from 'react-redux'
import ReactCursorPosition from 'react-cursor-position'
import classnames from 'classnames'

import ColorPicker from '../components/ColorPicker'

import { Framebuffer } from '../redux/editor'
import { Toolbar } from '../redux/toolbar'
import { selectChar } from '../actions/editor'
import styles from './Editor.css';
import * as utils from '../utils';

const selectedCharScreencode = ({row, col}) => {
  return row*16 + col
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

function renderChar (key, cls, x, y, code, color) {
  const s = {
    position: 'absolute',
    top: 0,
    left: 0,
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
      src={charset.getDataURI(code, color)}
    />
  )
}

class CharGrid extends Component {
  constructor (props) {
    super(props)
    this.images  = Array(props.width*props.height).fill(null)
    this.classes = Array(props.width*props.height).fill(null)
    this.screencodes = Array(props.width*props.height).fill(0)
    this.colors = Array(props.width*props.height).fill(14)

    this.state = {
      dragging: false,
      prevCoord: null
    }
  }

  getMouseCoord () {
    const col = Math.floor(this.props.position.x / 16)
    const row = Math.floor(this.props.position.y / 16)
    return { row, col }
  }

  handleClick = (e) => {
    if (this.props.onClickChar !== undefined) {
      this.props.onClickChar(this.getMouseCoord())
    }
  }

  handleMouseDown = (e) => {
    const coord = this.getMouseCoord()
    this.setState({
      dragging: true,
      prevCoord: coord
    })
    if (this.props.onDragStart !== undefined) {
      this.props.onDragStart(coord)
    }
  }

  handleMouseUp = (e) => {
    this.setState({dragging: false})
    if (this.props.onDragEnd !== undefined) {
      this.props.onDragEnd()
    }
  }

  handleMouseMove = (e) => {
    if (this.state.dragging) {
      const coord = this.getMouseCoord()
      if (this.state.prevCoord.row !== coord.row ||
          this.state.prevCoord.col !== coord.col) {
        this.setState({prevCoord: coord})
        if (this.props.onDragMove !== undefined) {
          this.props.onDragMove(coord)
        }
      }
    }
  }

  render () {
    const w = this.props.width
    const h = this.props.height
    const mousepos = this.getMouseCoord()
    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        const idx = y*w + x
        const pix = this.props.framebuf[y][x]
        const screencode = pix.code
        const color = pix.color
        let cls = null
        if (this.props.isActive && mousepos.col === x && mousepos.row === y) {
          cls = styles.charHover
        }
        if (this.props.selected !== undefined) {
          const { row, col } = this.props.selected
          if (y === row && x === col) {
            cls = styles.charSelected
          }
        }

        if (this.images[idx] == null ||
            this.classes[idx] !== cls ||
            this.screencodes[idx] !== screencode ||
            this.colors[idx] !== color) {
          this.images[idx] = renderChar(idx, cls, x, y, screencode, color)
          this.screencodes[idx] = screencode
          this.colors[idx] = color
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

class FramebufferView extends Component {

  setChar = (clickLoc) => {
    this.props.Framebuffer.setPixel({
      ...clickLoc,
      screencode:this.props.curScreencode,
      color:this.props.curTextColor,
      undoId: this.props.undoId
    })
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
        <ReactCursorPosition>
          <CharGrid
            width={40}
            height={25}
            onDragStart={this.handleDragStart}
            onDragMove={this.handleDragMove}
            onDragEnd={this.handleDragEnd}
            framebuf={this.props.framebuf}
          />
        </ReactCursorPosition>
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
          code: (y*16+x) & 255,
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
        <ReactCursorPosition>
          <CharGrid
            width={16}
            height={16}
            framebuf={this.fb}
            selected={this.props.selected}
            onClickChar={this.props.setSelectedChar}
          />
        </ReactCursorPosition>
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
    curScreencode: selectedCharScreencode(selected),
    textColor: state.toolbar.textColor
  }
}
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Editor)

