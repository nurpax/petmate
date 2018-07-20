
import React, { Component } from 'react';
import classnames from 'classnames'

import * as utils from '../utils'
import styles from './CharGrid.css'

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

export default class CharGrid extends Component {
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

