// @flow
import React, { Component, PureComponent } from 'react';
import ReactCursorPosition from 'react-cursor-position';
import styles from './Editor.css';

var fs = require('fs')
const nativeImage = require('electron').nativeImage

type Props = {};

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
          const dark  = { r:71, g:55, b:172 }
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
    return <img draggable={false} style={s} className={styles.pixelated} width={8} height={8} src={charset.getDataURI(screencode)} />
  }
}

class CharGrid extends Component {
  render () {
    const W = this.props.width
    const H = this.props.height
    const colIdx = Math.floor(this.props.position.x / 16)
    const rowIdx = Math.floor(this.props.position.y / 16)
    let imgs = []
    for (var y = 0; y < H; y++) {
      for (var x = 0; x < W; x++) {
        const idx = y*W + x
        let screencode = (x + y*W) & 255
        if (colIdx === x && rowIdx === y) {
          screencode = 32
        }
        imgs.push(<Char key={idx} x={x} y={y} screencode={screencode} />)
      }
    }
    const divStyle = {
      position: 'relative',
      transform: 'scale(2,2)',
      transformOrigin: '0% 0%',
    }
    return (
      <div style={divStyle}>
        {imgs}
      </div>
    )
  }
}

class Framebuffer extends Component {
  render () {
    // Editor needs to specify a fixed width/height because the contents use
    // relative/absolute positioning and thus seem to break out of the CSS
    // grid.
    const s = {width: '640px', height:'400px', backgroundColor: 'rgb(71,55,172)'}
    return (
      <div className={styles.fbContainer} style={s}>
        <ReactCursorPosition>
          <CharGrid width={40} height={25} />
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
    return (
      <div className={styles.csContainer} style={s}>
        <ReactCursorPosition>
          <CharGrid width={16} height={16} />
        </ReactCursorPosition>
      </div>
    )
  }
}

export default class Editor extends Component<Props> {
  props: Props;

  render() {
    return (
      <div className={styles.editorLayoutContainer}>
        <Framebuffer />
        <CharSelect />
      </div>
    )
  }
}

