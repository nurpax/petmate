
import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'

export default class GridOverlay extends PureComponent {
  static propTypes = {
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired
  }
  render () {
    const { width, height } = this.props
    const pixWidth = width*8
    const pixHeight = height*8
    let lines = []
    let keyCount = 0
    const s = {
      stroke:'rgb(255,255,255)',
      strokeWidth:0.5
    }
    for (let y = 0; y <= height; y++, keyCount++) {
      lines.push(
        <line
          key={keyCount}
          x1={0} y1={y*8} x2={pixWidth} y2={y*8}
          style={s}
        />
      )
    }
    for (let x = 0; x <= width; x++, keyCount++) {
      lines.push(
        <line
          key={keyCount}
          x1={x*8} y1={0} x2={x*8} y2={pixHeight}
          style={s}
        />
      )
    }
    return (
      <div style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: pixWidth,
        height: pixHeight,
        opacity: 0.4,
        filter: 'hue-rotate(180deg)'
      }}>
        <svg width={pixWidth} height={pixHeight}>
          {lines}
        </svg>
      </div>
    )
  }
}

