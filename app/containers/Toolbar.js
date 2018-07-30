
import React, { Component, Fragment } from 'react';
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import classnames from 'classnames'
import { ActionCreators } from 'redux-undo';

import ColorPicker from '../components/ColorPicker'
import * as utils from '../utils'
import {
  Toolbar,
  TOOL_DRAW,
  TOOL_COLORIZE,
  TOOL_BRUSH
} from '../redux/toolbar'
import { Framebuffer } from '../redux/editor'
import * as selectors from '../redux/selectors'
import * as Root from '../redux/root'
import { framebufIndexMergeProps } from '../redux/utils'
import styles from './Toolbar.css';

import { withHoverFade } from './hoc'

class Icon extends Component {
  render () {
    const selectedClass = this.props.selected !== undefined && this.props.selected ? styles.selectedTool : null
    const tooltip = this.props.tooltip !== null ?
      <span className={styles.tooltiptext}>{this.props.tooltip}</span> :
      null
    return (
      <div
        className={classnames(styles.tooltip, selectedClass)}
        onClick={() => this.props.onIconClick()}
      >
        <i
          className={classnames(styles.icon, `fas ${this.props.iconName}`)}
        />
        {tooltip}
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

class FbColorPicker_ extends Component {
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
        <div className={classnames(styles.colorpicker, this.props.fadeOut ? styles.fadeOut : null)}>
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
      <Fragment>
        <div style={s} onClick={this.props.onToggleActive} />
        {picker}
        {tooltip}
      </Fragment>
    )
  }
}
const FbColorPicker = withHoverFade(FbColorPicker_)

class BrushMenu_ extends Component {
  handleClick = () => {
    this.props.setSelectedTool(this.props.tool)
    this.props.onToggleActive()
  }

  handleClickBrushSelect = () => {
    this.props.onClickBrushSelect('select')
  }

  render () {
    const { tool, active, ...props } = this.props
    const buttons =
      <div
        className={classnames(styles.brushMenuContainer, this.props.fadeOut ? styles.fadeOut : null)}
        onClick={this.handleClickBrushSelect}
      >
        <i
          className={classnames(styles.icon, styles.brushButton, 'fas fa-crop-alt')}
        />
      </div>
    // tooltip    {active ? null : 'Brush'}
    return (
      <Fragment>
        <Icon
          iconName='fa-brush'
          tooltip={null}
          onIconClick={this.handleClick}
          {...props}
        />
        {active ? buttons : null}
      </Fragment>
    )
  }
}
const BrushMenu = withHoverFade(BrushMenu_)

class ToolbarView extends Component {
  state = {
    pickerActive: {
      border: false,
      background: false,
      brush: false
    }
  }

  setPickerActive = (pickerId, val) => {
    this.setState(prevState => {
      return {
        pickerActive: {
          ...prevState.pickerActive,
          [pickerId]: val
        }
      }
    })
  }

  handleSelectBgColor = (color) => {
    this.setPickerActive('background', false)
    this.props.Framebuffer.setBackgroundColor(color)
  }

  handleSelectBorderColor = (color) => {
    this.setPickerActive('border', false)
    this.props.Framebuffer.setBorderColor(color)
  }

  handleClickBrushSelect = (sub) => {
    this.setPickerActive('brush', false)
    if (sub === 'select') {
      this.props.Toolbar.setBrush(null)
    }
  }

  handleSaveWorkspace = () => {
    this.props.fileSaveAsWorkspace()
  }

  handleLoadWorkspace = () => {
    this.props.fileOpenWorkspace()
  }

  render() {
    if (this.props.framebuf === null) {
      return null
    }
    const brushMenu = (key) => {
      const selectedClass = this.props.selectedTool === TOOL_BRUSH ? styles.selectedTool : null
      return (
        <BrushMenu
          key={key}
          pickerId='brush'
          containerClassName={classnames(styles.tooltip, selectedClass)}
          tool={TOOL_BRUSH}
          setSelectedTool={this.props.Toolbar.setSelectedTool}
          selectedTool={this.props.selectedTool}
          active={this.state.pickerActive.brush}
          onSetActive={this.setPickerActive}
          onClickBrushSelect={this.handleClickBrushSelect}
        />
      )
    }
    const mkTool = ({ tool, iconName, tooltip }) => {
      return (
        <SelectableTool
          key={tool}
          tool={tool}
          setSelectedTool={this.props.Toolbar.setSelectedTool}
          selectedTool={this.props.selectedTool}
          iconName={iconName}
          tooltip={tooltip}
        />
      )
    }
    const tools = [
      mkTool({
        tool: TOOL_DRAW,
        iconName: 'fa-pencil-alt',
        tooltip: 'Draw'
      }),
      mkTool({
        tool: TOOL_COLORIZE,
        iconName: 'fa-highlighter',
        tooltip: 'Colorize'
      }),
      brushMenu(TOOL_BRUSH)
    ]
    return (
      <div className={styles.toolbar}>
        <Icon
          onIconClick={this.props.undo}
          iconName='fa-undo' tooltip='Undo'/>
        <Icon
          onIconClick={this.props.redo}
          iconName='fa-redo' tooltip='Redo'/>
        <Icon
          onIconClick={this.props.Toolbar.clearCanvas}
          iconName='fa-broom' tooltip='Clear canvas'/>
        {tools}
        <FbColorPicker
          pickerId='border'
          containerClassName={styles.tooltip}
          active={this.state.pickerActive.border}
          color={this.props.framebuf.borderColor}
          onSetActive={this.setPickerActive}
          onSelectColor={this.handleSelectBorderColor}
          tooltip='Border'
        />
        <FbColorPicker
          pickerId='background'
          containerClassName={styles.tooltip}
          active={this.state.pickerActive.background}
          color={this.props.framebuf.backgroundColor}
          onSetActive={this.setPickerActive}
          onSelectColor={this.handleSelectBgColor}
          tooltip='Background'
        />
      </div>
    )
  }
}

const undoActions = {
  undo: (framebufIndex) => {
    return {
      ...ActionCreators.undo(),
      framebufIndex
    }
  },
  redo: (framebufIndex) => {
    return {
      ...ActionCreators.redo(),
      framebufIndex
    }
  }
}
const mapDispatchToProps = (dispatch, ownProps) => {
  return {
    ...bindActionCreators(undoActions, dispatch),
    ...bindActionCreators(Root.actions, dispatch),
    dispatch: (action) => dispatch(action),
    Toolbar: Toolbar.bindDispatch(dispatch),
    Framebuffer: Framebuffer.bindDispatch(dispatch)
  }
}

const mapStateToProps = state => {
  const framebuf = selectors.getCurrentFramebuf(state)
  return {
    framebufIndex: selectors.getCurrentScreenFramebufIndex(state),
    screens: selectors.getScreens(state),
    getFramebufByIndex: fid => selectors.getFramebufByIndex(state, fid),
    framebuf: framebuf,
    selectedTool: state.toolbar.selectedTool
  }
}
export default connect(
  mapStateToProps,
  mapDispatchToProps,
  framebufIndexMergeProps
)(ToolbarView)
