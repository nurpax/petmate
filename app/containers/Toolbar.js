
import React, { Component } from 'react';
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import classnames from 'classnames'
import { ActionCreators } from 'redux-undo';

import ColorPicker from '../components/ColorPicker'
import * as utils from '../utils'
import { Toolbar, TOOL_DRAW, TOOL_COLORIZE } from '../redux/toolbar'
import { Framebuffer } from '../redux/editor'
import styles from './Toolbar.css';

class Icon extends Component {
  render () {
    const selectedClass = this.props.selected !== undefined && this.props.selected ? styles.selectedTool : null
    return (
      <div className={classnames(styles.tooltip, selectedClass)}>
        <i
          onClick={this.props.onIconClick}
          className={classnames(styles.icon, `fas ${this.props.iconName}`)}
        />
        <span className={styles.tooltiptext}>{this.props.tooltip}</span>
      </div>
    )
  }
}

class SelectableTool extends Component {
  handleClick = () => {
    this.props.setSelectedTool(this.props.tool)
  }
  render () {
    const { tool, ...props } = this.props
    return (
      <Icon
        onIconClick={this.handleClick}
        selected={tool === this.props.selectedTool}
        {...props}
      />
    )
  }
}

class FbColorPicker extends Component {
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
    this.setState({fadeOut: false})
    this.clearHoverTimer()
  }

  handleMouseLeave = () => {
    clearTimeout(this.timerId)
    this.setState({fadeOut: true})
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
    let tooltip = null
    if (this.props.active) {
      picker =
        <div className={classnames(styles.colorpicker, this.state.fadeOut ? styles.fadeOut : null)}>
          <div style={{transform: 'scale(2,2)', transformOrigin:'0% 0%'}}>
            <ColorPicker color={this.props.color} onSelectColor={this.handleSelectColor} />
          </div>
        </div>
      tooltip = null
    } else {
      tooltip =
        <span className={styles.tooltiptext}>{this.props.tooltip}</span>
    }
    return (
      <div
        className={classnames(styles.tooltip)}
        onMouseLeave={this.handleMouseLeave}
        onMouseEnter={this.handleMouseEnter}
      >
        <div style={s} onClick={this.handleColorPickActive} />
        {picker}
        {tooltip}
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
    const tools = [
      {
        tool: TOOL_DRAW,
        iconName: 'fa-pencil-alt',
        tooltip: 'Draw'
      },
      {
        tool: TOOL_COLORIZE,
        iconName: 'fa-highlighter',
        tooltip: 'Colorize'
      }
    ].map(t => {
      return (
        <SelectableTool
          key={t.tool}
          tool={t.tool}
          setSelectedTool={this.props.Toolbar.setSelectedTool}
          selectedTool={this.props.selectedTool}
          iconName={t.iconName} tooltip={t.tooltip}
        />
      )
    })
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
          iconName='fa-redo' tooltip='Redo'/>
        {tools}
        <FbColorPicker
          pickerId='border'
          active={this.state.colorPickerActive.border}
          color={this.props.borderColor}
          onActivatePicker={this.setColorPickerActive}
          onSelectColor={this.handleSelectBorderColor}
          tooltip='Border'
        />
        <FbColorPicker
          pickerId='background'
          active={this.state.colorPickerActive.background}
          color={this.props.backgroundColor}
          onActivatePicker={this.setColorPickerActive}
          onSelectColor={this.handleSelectBgColor}
          tooltip='Background'
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
    backgroundColor: framebuf.backgroundColor,
    selectedTool: state.toolbar.selectedTool
  }
}
export default connect(
  mapStateToProps,
  mdtp
)(ToolbarView)
