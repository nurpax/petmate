
import React, { Component } from 'react';
import classnames from 'classnames'

import * as utils from '../utils'

const systemFontData = utils.systemFontData

class CharsetCache {
  constructor (ctx) {
    const data = systemFontData
    this.images = Array(16)

    for (let colorIdx = 0; colorIdx < 16; colorIdx++) {
      const color = utils.palette[colorIdx]
      this.images[colorIdx] = []

      for (let c = 0; c < 256; c++) {
        const boffs = c*8;
        const char = []

        let dstIdx = 0
        let img = ctx.createImageData(8, 8);
        let bits = img.data

        for (let y = 0; y < 8; y++) {
          const p = data[boffs+y]
          for (let i = 0; i < 8; i++) {
            const v = ((128 >> i) & p) ? 255 : 0
            bits[dstIdx+0] = color.r
            bits[dstIdx+1] = color.g
            bits[dstIdx+2] = color.b
            bits[dstIdx+3] = v
            dstIdx += 4
          }
        }
        this.images[colorIdx].push(img)
      }
    }
  }

  getImage(screencode, color) {
    return this.images[color][screencode]
  }
}

export default class CharGrid extends Component {
  static defaultProps = {
    srcX: 0,
    srcY: 0,
    charPos: null
  }

  constructor (props) {
    super(props)
    this.canvasRef = React.createRef();
    this.font = null
  }

  componentDidMount() {
    this.draw()
  }

  componentDidUpdate (prevProps) {
    if (this.props.width !== prevProps.width ||
      this.props.height !== prevProps.height ||
      this.props.srcX !== prevProps.srcX ||
      this.props.srcY !== prevProps.srcY ||
      this.props.framebuf !== prevProps.framebuf ||
      this.props.charPos !== prevProps.charPos ||
      this.props.curScreencode !== prevProps.curScreencode ||
      this.props.textColor !== prevProps.textColor ||
      this.props.backgroundColor !== prevProps.backgroundColor) {
      this.draw(prevProps)
    }
  }

  draw (prevProps) {
    const canvas = this.canvasRef.current
    const ctx = canvas.getContext("2d")

    if (this.font === null) {
      this.font = new CharsetCache(ctx)
    }

    const { grid, srcX, srcY } = this.props

    const xScale = grid ? 9 : 8
    const yScale = grid ? 9 : 8

    const dstSrcChanged =
      prevProps !== undefined ?
        (this.props.width !== prevProps.width ||
         this.props.height !== prevProps.height ||
         this.props.srcX !== prevProps.srcX ||
         this.props.srcY !== prevProps.srcY)
        :
        true
    for (var y = 0; y < this.props.height; y++) {
      const charRow = this.props.framebuf[y + srcY]
      if (!dstSrcChanged && charRow === prevProps.framebuf[y + srcY]) {
        continue
      }
      for (var x = 0; x < this.props.width; x++) {
        const c = charRow[x + srcX]
        const img = this.font.getImage(c.code, c.color)
        ctx.putImageData(img, x*xScale, y*yScale)
      }
    }

    // Delete previous char highlighter
    if (prevProps !== undefined && prevProps.charPos !== null) {
      const charPos = prevProps.charPos
      if (charPos.row < this.props.height && charPos.col < this.props.width) {
        const c = this.props.framebuf[charPos.row][charPos.col]
        const img = this.font.getImage(c.code, c.color)
        ctx.putImageData(img, charPos.col*xScale, charPos.row*yScale)
      }
    }
    // Render current char highlighter
    if (this.props.charPos !== null) {
      const charPos = this.props.charPos
      if (charPos.row < this.props.height && charPos.col < this.props.width) {
        const c = {
          code: this.props.curScreencode !== null ?
            this.props.curScreencode :
            this.props.framebuf[charPos.row][charPos.col].code,
          color: this.props.textColor
        }
        const img = this.font.getImage(c.code, c.color)
        ctx.putImageData(img, charPos.col*xScale, charPos.row*yScale)
      }
    }

    if (grid) {
      ctx.fillStyle = 'rgba(0,0,0,255)'
      for (var y = 0; y < this.props.height; y++) {
        ctx.fillRect(0, y*yScale+8, this.props.width*xScale, 1)
      }
      for (var x = 0; x < this.props.width; x++) {
        ctx.fillRect(x*xScale+8, 0, 1, this.props.height*yScale)
      }
    }
  }

  render () {
    const scale = this.props.grid ? 9 : 8
    return (
      <canvas
        ref={this.canvasRef}
        style={{
          backgroundColor: this.props.backgroundColor,
          position: 'absolute',
          top: '0px',
          left: '0px',
          width: `${this.props.width*scale}px`,
          height: `${this.props.height*scale}px`,
        }}
        width={this.props.width*scale}
        height={this.props.height*scale}>
      </canvas>
    )
  }
}
