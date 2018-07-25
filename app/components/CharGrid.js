
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
    srcY: 0
  }

  constructor (props) {
    super(props)
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
      this.props.backgroundColor !== prevProps.backgroundColor) {
      this.draw(prevProps)
    }
  }

  draw (prevProps) {
    const canvas = this.refs.canvas
    const ctx = canvas.getContext("2d")

    if (this.font === null) {
      this.font = new CharsetCache(ctx)
    }

    const { grid, srcX, srcY } = this.props

    const xScale = grid ? 9 : 8
    const yScale = grid ? 9 : 8

    for (var y = 0; y < this.props.height; y++) {
      const charRow = this.props.framebuf[y + srcY]
      for (var x = 0; x < this.props.width; x++) {
        const c = charRow[x + srcX]
        const img = this.font.getImage(c.code, c.color)
        ctx.putImageData(img, x*xScale, y*yScale)
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
        ref='canvas'
        style={{
          backgroundColor: this.props.backgroundColor
        }}
        width={this.props.width*scale}
        height={this.props.height*scale}>
      </canvas>
    )
  }
}
