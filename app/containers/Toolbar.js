
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
  state = {
    colorPickActive: false
  }

  handleColorPickActive = () => {
    this.setState((prevState) => {
      return {
        colorPickActive: !prevState.colorPickActive
      }
    })
  }

  handleSelectColor = (idx) => {
    this.props.onSelectColor(idx, null)
    this.setState({colorPickActive: false})
  }

  render () {
    const bg = utils.colorIndexToCssRgb(this.props.color)
    const s = {
      height: '40px',
      marginTop: '12px',
      backgroundColor: bg,
      flex: 1
    }
    return (
      <div className={classnames(styles.tooltip)}>
        <div style={s} onClick={this.handleColorPickActive} />
        <div className={classnames(styles.colorpicker, this.state.colorPickActive ? styles.active : null)}>
          <div style={{transform: 'scale(2,2)', transformOrigin:'0% 0%'}}>
            <ColorPicker color={this.props.color} onSelectColor={this.handleSelectColor} />
          </div>
        </div>
      </div>
    )
  }
}

class ToolbarView extends Component {

  handleSelectBgColor = (color) => {
    this.props.Framebuffer.setBackgroundColor(color)
  }

  handleSelectBorderColor = (color) => {
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
          color={this.props.borderColor}
          onSelectColor={this.handleSelectBorderColor}
        />
        <FbColorPicker
          color={this.props.backgroundColor}
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

