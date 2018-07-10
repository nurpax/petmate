
import React, { Component } from 'react';
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import classnames from 'classnames'
import { ActionCreators } from 'redux-undo';

import ColorPicker from '../components/ColorPicker'
import * as utils from '../utils'
import { Toolbar } from '../redux/toolbar'
import { Framebuffer } from '../redux/editor'
import styles from './Toolbar.css';

class Icon extends Component {
  render () {
    return (
      <div className={styles.tooltip}>
        <i
          onClick={this.props.onIconClick}
          className={classnames(styles.icon, `fa ${this.props.iconName} fa-2x`)}
        />
        <span className={styles.tooltiptext}>{this.props.tooltip}</span>
      </div>
    )
  }
}

class FbColorPicker extends Component {

  constructor (props) {
    super(props)
    this.timerId = null
  }

  componentWillUnmount () {
    if (this.timerId !== null) {
      clearTimeout(this.timerId)
    }
  }

  handleColorPickActive = () => {
    const newIsActive = !this.props.active
    this.props.onActivatePicker(this.props.pickerId, newIsActive)
    if (this.timerId !== null) {
      this.clearHoverTimer()
    }
  }

  clearHoverTimer = () => {
    if (this.timerId !== null) {
      clearTimeout(this.timerId)
      this.timerId = null
    }
  }

  handleMouseEnter = () => {
    this.clearHoverTimer()
  }

  handleMouseLeave = () => {
    clearTimeout(this.timerId)
    this.timerId = setTimeout(() => {
      this.props.onActivatePicker(this.props.pickerId, false)
    }, 500)
  }

  handleSelectColor = (idx) => {
    this.props.onSelectColor(idx, null)
  }

  render () {
    const bg = utils.colorIndexToCssRgb(this.props.color)
    const s = {
      height: '40px',
      marginTop: '12px',
      backgroundColor: bg,
      flex: 1
    }
    let picker = null
    if (this.props.active) {
      picker =
        <div className={styles.colorpicker}>
          <div style={{transform: 'scale(2,2)', transformOrigin:'0% 0%'}}>
            <ColorPicker color={this.props.color} onSelectColor={this.handleSelectColor} />
          </div>
        </div>
    }
    return (
      <div
        className={classnames(styles.tooltip)}
        onMouseLeave={this.handleMouseLeave}
        onMouseEnter={this.handleMouseEnter}
      >
        <div style={s} onClick={this.handleColorPickActive} />
        {picker}
      </div>
    )
  }
}

class ToolbarView extends Component {

  state = {
    colorPickerActive: {
      border: false,
      background: false
    }
  }

  setColorPickerActive = (pickerId, val) => {
    this.setState(prevState => {
      return {
        colorPickerActive: {
          ...prevState.colorPickerActive,
          [pickerId]: val
        }
      }
    })
  }

  handleSelectBgColor = (color) => {
    this.setColorPickerActive('background', false)
    this.props.Framebuffer.setBackgroundColor(color)
  }

  handleSelectBorderColor = (color) => {
    this.setColorPickerActive('border', false)
    this.props.Framebuffer.setBorderColor(color)
  }

  render() {
    return (
      <div className={styles.toolbar}>
        <Icon
          onIconClick={this.props.Toolbar.clearCanvas}
          iconName='fa-trash' tooltip='Clear canvas'/>
        <Icon
          onIconClick={this.props.undo}
          iconName='fa-undo' tooltip='Undo'/>
        <Icon
          onIconClick={this.props.redo}
          iconName='fa-repeat' tooltip='Redo'/>
        <FbColorPicker
          pickerId='border'
          active={this.state.colorPickerActive.border}
          color={this.props.borderColor}
          onActivatePicker={this.setColorPickerActive}
          onSelectColor={this.handleSelectBorderColor}
        />
        <FbColorPicker
          pickerId='background'
          active={this.state.colorPickerActive.background}
          color={this.props.backgroundColor}
          onActivatePicker={this.setColorPickerActive}
          onSelectColor={this.handleSelectBgColor}
        />
      </div>
    )
  }
}

const mapDispatchToProps = {
  undo: ActionCreators.undo,
  redo: ActionCreators.redo,
}

const mdtp = dispatch => {
  return {
    ...bindActionCreators(mapDispatchToProps, dispatch),
    Toolbar: Toolbar.bindDispatch(dispatch),
    Framebuffer: Framebuffer.bindDispatch(dispatch)
  }
}

const mapStateToProps = state => {
  const framebuf = state.framebuf.present
  return {
    borderColor: framebuf.borderColor,
    backgroundColor: framebuf.backgroundColor
  }
}
export default connect(
  mapStateToProps,
  mdtp
)(ToolbarView)

