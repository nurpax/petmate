
import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'

import { Framebuf, Coord2 } from '../redux/types'

const FixedWidthCoord = (props: { axis: string, number: number|string|null }) => {
  const { axis, number } = props;
  return (
    <div style={{display: 'flex', flexDirection:'row'}}>
      <div style={{width: '15px', color:'var(--main-text-darker-color)'}}>{axis}:</div>
      <div style={{width: '25px', color:'var(--main-text-color)'}}>{number}</div>
    </div>
  )
}

interface CharSelectStatusbarProps {
  curScreencode: number | null;
}

export class CharSelectStatusbar extends PureComponent<CharSelectStatusbarProps> {
  render () {
    const { curScreencode } = this.props
    const screencodeStr = curScreencode !== null ?
      curScreencode.toString(16).toUpperCase() :
      null
    return (
      <div style={{fontSize: '0.8em', display: 'flex', flexDirection:'row'}}>
        <FixedWidthCoord axis='C' number={`$${screencodeStr}`} />
      </div>
    )
  }
}

interface CanvasStatusbarProps {
  framebuf: Framebuf;
  isActive: boolean;
  charPos:  Coord2 | null;
}

export class CanvasStatusbar extends PureComponent<CanvasStatusbarProps> {
  static propTypes = {
    framebuf: PropTypes.object.isRequired,
    isActive: PropTypes.bool,
    charPos: PropTypes.object
  }
  render () {
    const { isActive, charPos, framebuf } = this.props
    const { width, height } = framebuf
    const cp = isActive ? charPos : null
    let cc = null;
    if (cp !== null) {
      if ((cp.row >= 0 && cp.row < height) &&
          (cp.col >= 0 && cp.col < width)) {
            cc = framebuf.framebuf[cp.row][cp.col].code;
      }
    }
    return (
      <div style={{paddingTop: '4px', fontSize: '0.8em', display: 'flex', flexDirection:'row'}}>
        <FixedWidthCoord axis='X' number={cp !== null ? cp.col : null} />
        <FixedWidthCoord axis='Y' number={cp !== null ? cp.row : null} />
        <FixedWidthCoord axis='C' number={cc !== null ? `$${cc.toString(16).toUpperCase()}` : null} />
      </div>
    )
  }
}
