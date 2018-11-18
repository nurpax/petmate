
import React, { Component } from 'react';
import ReactCursorPosition from 'react-cursor-position'
import PropTypes from 'prop-types'

export class CharPosition extends Component {

  constructor (props) {
    super(props)
    this.prevCharPos = null
  }

  toCharPos = ({position, elementDimensions}) => {
    if (elementDimensions === null) {
      return null
    }
    const { x, y } = position
    const { width, height } = elementDimensions
    const col = Math.floor(x / width * 16)
    const row = Math.floor(y / height * 16)
    return { row, col }
  }

  // The parent component needs to know if the cursor is active (inside the
  // child div) to conditionally render sibling components like cursor pos,
  // char under cursor, etc.
  handleActivationChanged = ({isActive})  => {
    this.props.onActivationChanged({isActive})
  }

  // The parent component needs to know what the current charpos is inside the
  // child div).
  handlePositionChanged = (vals)  => {
    if (vals.elementDimensions === undefined) {
      return
    }
    const { row, col } = this.toCharPos(vals)
    if (this.prevCharPos === null ||
      row !== this.prevCharPos.row ||
      col !== this.prevCharPos.col) {
      this.props.onCharPosChanged(this.toCharPos(vals))
      this.prevCharPos = { row, col }
    }
  }

  render () {
    return (
      <ReactCursorPosition
        onActivationChanged={this.handleActivationChanged}
        onPositionChanged={this.handlePositionChanged}
        shouldDecorateChildren={false}
      >
        {this.props.children}
      </ReactCursorPosition>
    )
  }
}

export const withMouseCharPositionShiftLockAxis = C => {
  class ToCharRowCol extends Component {
    static propTypes = {
      altKey: PropTypes.bool.isRequired,
      shiftKey: PropTypes.bool.isRequired
    }
    constructor (props) {
      super(props)

      this.prevCharPos = null
      this.dragging = false
      this.prevCoord = null
      this.lockStartCoord = null
      this.lockedCharPos = null
      this.shiftLockAxis = null
    }

    currentCharPos = () => {
      const {
        position,
        elementDimensions,
        framebufWidth,
        framebufHeight
      } = this.props
      const { width, height } = elementDimensions
      return {
        col: Math.floor(position.x / width * framebufWidth),
        row: Math.floor(position.y / height * framebufHeight)
      }
    }

    handleMouseDown = (e, dragStart, altClick) => {
      const charPos = this.currentCharPos()
      // alt-left click doesn't start dragging
      if (this.props.altKey) {
        this.dragging = false
        altClick(charPos)
        return
      }

      this.dragging = true
      e.target.setPointerCapture(e.pointerId);
      this.prevCoord = charPos
      dragStart(charPos)

      const lock = this.props.shiftKey
      this.shiftLockAxis = lock ? 'shift' : null
      if (lock) {
        this.lockStartCoord = {
          ...charPos
        }
      }
    }

    handleMouseUp = (e, dragEnd) => {
      if (this.dragging) {
        dragEnd()
      }

      this.dragging = false
      this.lockStartCoord = null
      this.shiftLockAxis = null
    }

    handleMouseMove = (e, dragMove) => {
      const charPos = this.currentCharPos()

      if (this.prevCharPos === null ||
        this.prevCharPos.row !== charPos.row ||
        this.prevCharPos.col !== charPos.col) {
        this.prevCharPos = {...charPos}
        this.props.onCharPosChange({isActive:this.props.isActive, charPos})
      }

      if (!this.dragging) {
        return
      }

      const coord = charPos
      if (this.prevCoord.row !== coord.row ||
          this.prevCoord.col !== coord.col) {

        if (this.shiftLockAxis === 'shift') {
          if (this.prevCoord.row === coord.row) {
            this.shiftLockAxis = 'row'
          } else if (this.prevCoord.col === coord.col) {
            this.shiftLockAxis = 'col'
          }
        }

        if (this.shiftLockAxis !== null) {
          let lockedCharPos = {
            ...this.lockStartCoord
          }

          if (this.shiftLockAxis === 'row') {
            lockedCharPos.col = charPos.col
          } else if (this.shiftLockAxis === 'col') {
            lockedCharPos.row = charPos.row
          }
          this.lockedCharPos = lockedCharPos
          dragMove(lockedCharPos)
        } else {
          dragMove(charPos)
        }
        this.prevCoord = charPos
      }
    }

    render () {
      const { framebufWidth, framebufHeight } = this.props
      const { position, elementDimensions, ...props } = this.props
      const { width, height } = elementDimensions
      const col = Math.floor(this.props.position.x / width * framebufWidth)
      const row = Math.floor(this.props.position.y / height * framebufHeight)
      const locked = this.shiftLockAxis === 'row' || this.shiftLockAxis === 'col'
      const charPos = locked ? this.lockedCharPos : {row, col}
      return (
        <C
          charPos={charPos}
          onMouseDown={this.handleMouseDown}
          onMouseUp={this.handleMouseUp}
          onMouseMove={this.handleMouseMove}
          {...props}
        />
      )
    }
  }
  return class extends Component {
    render () {
      return (
        <ReactCursorPosition
          style={{
            ...this.props.containerSize
          }}
          onActivationChanged={this.props.onActivationChanged}>
          <ToCharRowCol {...this.props}/>
        </ReactCursorPosition>
      )
    }
  }
}

export const withHoverFade = (C, options) => {
  return class extends Component {
    constructor (props) {
      super(props)
      this.timerId = null
      this.state = {
        fadeOut: false
      }
    }

    componentWillUnmount () {
      if (this.timerId !== null) {
        clearTimeout(this.timerId)
      }
    }

    clearHoverTimer = () => {
      if (this.timerId !== null) {
        clearTimeout(this.timerId)
        this.timerId = null
      }
    }

    handleMouseEnter = () => {
      this.setState({fadeOut: false})
      this.clearHoverTimer()
    }

    handleMouseLeave = () => {
      clearTimeout(this.timerId)
      this.setState({fadeOut: true})
      this.timerId = setTimeout(() => {
        this.props.onSetActive(this.props.pickerId, false)
      }, 500)
    }

    handleToggleActive = () => {
      const newIsActive = !this.props.active
      this.props.onSetActive(this.props.pickerId, newIsActive)
      if (this.timerId !== null) {
        this.clearHoverTimer()
      }
    }

    render () {
      return (
        <div
          className={this.props.containerClassName}
          onMouseLeave={this.handleMouseLeave}
          onMouseEnter={this.handleMouseEnter}
        >
          <C
            onToggleActive={this.handleToggleActive}
            fadeOut={this.state.fadeOut}
            {...this.props}
          />
        </div>
      )
    }
  }
}

