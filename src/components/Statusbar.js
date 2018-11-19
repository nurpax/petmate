
import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'

const FixedWidthCoord = ({axis, number}) => {
  return (
    <div style={{display: 'flex', flexDirection:'row'}}>
      <div style={{width: '15px', color:'rgb(120,120,120)'}}>{axis}:</div>
      <div style={{width: '25px', color:'rgb(173,173,173)'}}>{number !== null ? number : null}</div>
    </div>
  )
}

export class CharSelectStatusbar extends PureComponent {
  static propTypes = {
    curScreencode: PropTypes.number
  }
  render () {
    const { curScreencode } = this.props
    const screencodeStr = curScreencode !== null ?
      curScreencode.toString(16).toUpperCase() :
      null
    return (
      <div style={{fontSize: '0.8em', display: 'flex', flexDirection:'row'}}>
        <FixedWidthCoord axis='C' number={`$${screencodeStr}`}
        />
      </div>
    )
  }
}

export class CanvasStatusbar extends PureComponent {
  static propTypes = {
    framebuf: PropTypes.object.isRequired,
    isActive: PropTypes.bool,
    charPos: PropTypes.object
  }
  render () {
    const { isActive, charPos, framebuf } = this.props
    const { width, height } = framebuf
    let insideViewport = false
    const cp = isActive ? charPos : null
    if (cp !== null) {
      insideViewport =
        (cp.row >= 0 && cp.row < height) &&
        (cp.col >= 0 && cp.col < width)
    }
    const cc = insideViewport ? framebuf.framebuf[cp.row][cp.col].code : null
    return (
      <div style={{paddingTop: '4px', fontSize: '0.8em', display: 'flex', flexDirection:'row'}}>
        <FixedWidthCoord axis='X' number={cp !== null ? cp.col : null} />
        <FixedWidthCoord axis='Y' number={cp !== null ? cp.row : null} />
        <FixedWidthCoord axis='C' number={cc !== null ? `$${cc.toString(16).toUpperCase()}` : null} />
      </div>
    )
  }
}
