
import React, { Component, PureComponent } from 'react';
import { connect } from 'react-redux'
import ReactCursorPosition from 'react-cursor-position'
import classnames from 'classnames'

import { Framebuffer } from '../redux/editor'
import { selectChar } from '../actions/editor'
import styles from './Editor.css';

const selectedCharScreencode = ({row, col}) => {
  return row*16 + col
}

var fs = require('fs')
const nativeImage = require('electron').nativeImage

class CharsetCache {
  constructor () {
    const data = fs.readFileSync('./app/assets/system-charset.bin')

    this.chars = []
    this.dataURIs = []

    for (let c = 0; c < 256; c++) {
      const boffs = c*8;
      const char = []

      for (let y = 0; y < 8; y++) {
        const p = data[boffs+y]
        for (let i = 0; i < 8; i++) {
          const v = ((128 >> i) & p) ? 255 : 0
          const light = { r:123, g:113, b:202 }
          char.push(light.b)
          char.push(light.g)
          char.push(light.r)
          char.push(v)
        }
      }
      this.chars.push(char)
      const img = nativeImage.createFromBuffer(Buffer.from(char), {width: 8, height: 8})
      this.dataURIs.push(img.toDataURL())
    }
  }

  getDataURI(screencode) {
    return this.dataURIs[screencode]
  }
}

const charset = new CharsetCache()

class Char extends PureComponent {
  render () {
    const { x, y, screencode } = this.props
    const s = {
      position: 'absolute',
      top: 0,
      left: 0,
      transform: `translate(${x*8}px, ${y*8}px)`
    }
    const cls = classnames(this.props.hoverClass, styles.pixelated)
    return <img draggable={false} style={s} className={cls} width={8} height={8} src={charset.getDataURI(screencode)} />
  }
}

class CharGrid extends Component {
  constructor (props) {
    super(props)
    this.images  = Array(props.width*props.height).fill(null)
    this.classes = Array(props.width*props.height).fill(null)
    this.screencodes = Array(props.width*props.height).fill(0)
  }

  getMouseRowCol () {
    const col = Math.floor(this.props.position.x / 16)
    const row = Math.floor(this.props.position.y / 16)
    return { row, col }
  }

  handleClick = (e) => {
    this.props.onClickChar(this.getMouseRowCol())
  }

  render () {
    const w = this.props.width
    const h = this.props.height
    const rowcol = this.getMouseRowCol()
    const colIdx = rowcol.col
    const rowIdx = rowcol.row
    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        const idx = y*w + x
        let screencode = this.props.screencodes[x + y*w]
        let cls = null
        if (colIdx === x && rowIdx === y) {
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
            this.screencodes[idx] !== screencode) {
          this.images[idx] = <Char key={idx} hoverClass={cls} x={x} y={y} screencode={screencode} />
          this.screencodes[idx] = screencode
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
      <div onClick={this.handleClick} style={divStyle}>
        {this.images}
      </div>
    )
  }
}

class FramebufferView extends Component {

  handleClickChar = (clickLoc) => {
    this.props.Framebuffer.setPixel({...clickLoc, screencode:this.props.curScreencode})
  }

  render () {
    // Editor needs to specify a fixed width/height because the contents use
    // relative/absolute positioning and thus seem to break out of the CSS
    // grid.
    const s = {width: '640px', height:'400px', backgroundColor: 'rgb(71,55,172)'}
    const W = 40
    const H = 25
    console.log(this.props)
    const screencodes = Array(W*H)
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        screencodes[y*W + x] = this.props.framebuf[y][x]
      }
    }
    return (
      <div className={styles.fbContainer} style={s}>
        <ReactCursorPosition>
          <CharGrid
            width={40}
            height={25}
            onClickChar={this.handleClickChar}
            screencodes={screencodes}/>
        </ReactCursorPosition>
      </div>
    )
  }
}

class CharSelect extends Component {
  render () {
    // Editor needs to specify a fixed width/height because the contents use
    // relative/absolute positioning and thus seem to break out of the CSS
    // grid.
    const s = {width: '256px', height:'256px', backgroundColor: 'rgb(71,55,172)'}
    const W = 16
    const H = 16
    const screencodes = Array(W*H)
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        screencodes[y*W + x] = (y*W+x) & 255
      }
    }
    return (
      <div className={styles.csContainer} style={s}>
        <ReactCursorPosition>
          <CharGrid
            width={16}
            height={16}
            screencodes={screencodes}
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
          curScreencode={this.props.curScreencode}
          framebuf={this.props.framebuf} />
        <CharSelect
          selected={this.props.selected}
          setSelectedChar={this.props.setSelectedChar}
        />
      </div>
    )
  }
}

const mapDispatchToProps = dispatch => {
  return {
    setSelectedChar: rowcol => {
      dispatch(selectChar(rowcol))
    },
    Framebuffer: Framebuffer.bindDispatch(dispatch)
  }
}

const mapStateToProps = state => {
  const selected = state.editor.selected
  return {
    framebuf: state.framebuf.framebuf,
    selected,
    curScreencode: selectedCharScreencode(selected)
  }
}
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Editor)

