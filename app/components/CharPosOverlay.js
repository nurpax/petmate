
import React, { Component } from 'react'

const charPosOverlayStyleBase = {
  outlineStyle: 'solid',
  outlineWidth: 0.5,
  backgroundColor: 'rgba(255,255,255,0)',
  zIndex: 1,
  pointerEvents:'none'
}

export default class CharPosOverlay extends Component {
  render () {
    const { charPos, grid } = this.props
    const scale = grid ? 9 : 8
    const s = {
      ...charPosOverlayStyleBase,
      outlineColor: `rgba(255, 255, 255, ${this.props.opacity})`,
      position: 'absolute',
      left: charPos.col*scale-0.5,
      top: charPos.row*scale-0.5,
      width: `${8}px`,
      height: `${8}px`
    }
    return (
      <div style={s}>
      </div>
    )
  }
}

