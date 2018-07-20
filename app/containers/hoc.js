
import React, { Component } from 'react';
import ReactCursorPosition from 'react-cursor-position'

export const withMouseCharPosition = (C, options) => {
  class ToCharRowCol extends Component {
    constructor (props) {
      super(props)
    }
    render () {
      const grid = options !== undefined ? options.grid : false
      const { position, ...props } = this.props
      const scl = grid ? 17 : 16
      const col = Math.floor(this.props.position.x / scl)
      const row = Math.floor(this.props.position.y / scl)
      return <C charPos={{row, col}} grid={grid} {...props} />
    }
  }
  return class extends Component {
    render () {
      return (
        <ReactCursorPosition>
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

