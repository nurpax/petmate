
import React, { Component } from 'react'
import PropTypes from 'prop-types'

const charPosOverlayStyleBase = {
  outlineStyle: 'solid',
  outlineWidth: 0.5,
  backgroundColor: 'rgba(255,255,255,0)',
  zIndex: 1,
  pointerEvents:'none'
}

export default class CharPosOverlay extends Component {
  static propTypes = {
    framebufWidth: PropTypes.number.isRequired,
    framebufHeight: PropTypes.number.isRequired,
  }

  render () {
    const { charPos, grid, framebufWidth, framebufHeight } = this.props
    const scale = grid ? 9 : 8
    let outlineColor = `rgba(255, 255, 255, ${this.props.opacity})`
    if (this.props.color !== undefined) {
      outlineColor = this.props.color
    }
    if (charPos.row < 0 || charPos.row >= framebufHeight ||
        charPos.col < 0 || charPos.col >= framebufWidth) {
      return null
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

