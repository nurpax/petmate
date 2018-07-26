
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
    let outlineColor = `rgba(255, 255, 255, ${this.props.opacity})`
    if (this.props.color !== undefined) {
      outlineColor = this.props.color
    }
    const s = {
      ...charPosOverlayStyleBase,
      outlineColor: outlineColor,
      position: 'absolute',
      left: charPos.col*scale,
      top: charPos.row*scale,
      width: `${8}px`,
      height: `${8}px`
    }
    return (
      <div style={s}>
      </div>
    )
  }
}

