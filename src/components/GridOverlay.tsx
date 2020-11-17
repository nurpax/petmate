
import React, { PureComponent } from 'react'

interface GridOverlayProps {
  width: number;
  height: number;
  color?: string;
}

export default class GridOverlay extends PureComponent<GridOverlayProps> {
  render () {
    const { width, height, color } = this.props
    const pixWidth = width*8
    const pixHeight = height*8
    let lines = []
    let keyCount = 0
    const styles: { [key: string]: React.CSSProperties } = {
      line: {
        stroke: color || 'rgb(255,255,255)',
        strokeWidth:0.3
      },
      blend: {
        mixBlendMode: 'normal'
      },
      mainDiv: {
        position: 'absolute',
        left: 0,
        top: 0,
        width: pixWidth,
        height: pixHeight,
        filter: 'hue-rotate(180deg)',
        mixBlendMode: 'difference'
      }
    };
    for (let y = 0; y <= height; y++, keyCount++) {
      lines.push(
        <line
          key={keyCount}
          x1={0} y1={y*8} x2={pixWidth} y2={y*8}
          style={styles.line}
        />
      )
    }
    for (let x = 0; x <= width; x++, keyCount++) {
      lines.push(
        <line
          key={keyCount}
          x1={x*8} y1={0} x2={x*8} y2={pixHeight}
          style={styles.line}
        />
      )
    }
    return (
      <div style={styles.mainDiv}>
        <svg width={pixWidth} height={pixHeight} style={styles.blend}>
          {lines}
        </svg>
      </div>
    )
  }
}

