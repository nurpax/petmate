
import React, { Component, Fragment, PureComponent } from 'react';
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import classnames from 'classnames'
import { ActionCreators } from 'redux-undo';

import ColorPicker from '../components/ColorPicker'
import * as utils from '../utils'
import * as fp from '../utils/fp'
import {
  Toolbar,
  TOOL_DRAW,
  TOOL_COLORIZE,
  TOOL_CHAR_DRAW,
  TOOL_BRUSH,
  TOOL_TEXT
} from '../redux/toolbar'
import { Framebuffer } from '../redux/editor'
import * as selectors from '../redux/selectors'
import { getSettingsPaletteRemap, getSettingsCurrentColorPalette } from '../redux/settingsSelectors'
import * as Root from '../redux/root'
import { framebufIndexMergeProps } from '../redux/utils'

import { withHoverFade } from './hoc'

import {
  faBrush, faPencilAlt, faFont, faUndo, faRedo, faBroom, faCog
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import styles from './Toolbar.module.css';

class Icon extends PureComponent {
  static defaultProps = {
    bottom: false,
    subIcon: null
  }
  render () {
    const selectedClass = this.props.selected !== undefined && this.props.selected ? styles.selectedTool : null
    const tooltip = this.props.tooltip !== null ?
      <span className={styles.tooltiptext}>{this.props.tooltip}</span> :
      null
    return (
      <div
        className={classnames(styles.tooltip, selectedClass, this.props.bottom ? styles.end : null)}
        onClick={() => this.props.onIconClick()}
      >
        <FontAwesomeIcon className={styles.icon} icon={this.props.iconName} />
        {this.props.subIcon !== null ? this.props.subIcon() : null}
        {tooltip}
      </div>
    )
  }
}

class SelectableTool extends PureComponent {
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

class FbColorPicker_ extends PureComponent {
  handleSelectColor = (idx) => {
    this.props.onSelectColor(idx, null)
  }

  render () {
    const { colorPalette } = this.props
    const bg = utils.colorIndexToCssRgb(colorPalette, this.props.color)
    const s = {
      height: '40px',
      marginTop: '10px',
      backgroundColor: bg,
      flex: 1
    }
    let picker = null
    let tooltip = null
    if (this.props.active) {
      picker =
        <div
          className={classnames(styles.colorpicker, this.props.fadeOut ? styles.fadeOut : null)}
          style={{
            top: '9px',
            filter: 'drop-shadow(2.5px 2.5px 1.5px rgba(0,0,0,0.5))',
          }}
        >
          <ColorPicker
            color={this.props.color}
            onSelectColor={this.handleSelectColor}
            paletteRemap={this.props.paletteRemap}
            colorPalette={colorPalette}
            scale={{scaleX:1.5, scaleY:1.5}}
            twoRows={true}
          />
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

const renderColorizeSubIcon = () => {
  return (
    <div style={{
      backgroundColor: '#d77',
      position: 'absolute',
      width: '9px',
      height: '9px',
      top: '24px',
      left: '30px',
      borderRadius:'50%'
    }}>
    </div>
  )
}

const renderCharSubIcon = () => {
  return (
    <div style={{
      position: 'absolute',
      width: '9px',
      height: '9px',
      top: '17px',
      left: '30px',
    }}>
      <i
        className='fas fa-font'
        style={{
          fontSize: '10px'
        }}
      />
    </div>
  )
}

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
  }

  handleSaveWorkspace = () => {
    this.props.fileSaveAsWorkspace()
  }

  handleLoadWorkspace = () => {
    this.props.fileOpenWorkspace()
  }

  render() {
    if (this.props.backgroundColor === null) {
      return null
    }
    const mkTool = ({ tool, iconName, tooltip, subIcon }) => {
      return (
        <SelectableTool
          key={tool}
          tool={tool}
          setSelectedTool={this.props.Toolbar.setSelectedTool}
          selectedTool={this.props.selectedTool}
          iconName={iconName}
          tooltip={tooltip}
          subIcon={subIcon}
        />
      )
    }
    const tools = [
      mkTool({
        tool: TOOL_DRAW,
        iconName: faPencilAlt,
        tooltip: 'Char & Color'
      }),
      mkTool({
        tool: TOOL_COLORIZE,
        iconName: faPencilAlt,
        tooltip: 'Color only',
        subIcon: renderColorizeSubIcon
      }),
      mkTool({
        tool: TOOL_CHAR_DRAW,
        iconName: faPencilAlt,
        tooltip: 'Char only',
        subIcon: renderCharSubIcon
      }),
      mkTool({
        tool: TOOL_BRUSH,
        iconName: faBrush,
        tooltip: 'Brush'
      }),
      mkTool({
        tool: TOOL_TEXT,
        iconName: faFont,
        tooltip: 'Text'
      })
    ]
    return (
      <div className={styles.toolbar}>
        <Icon
          onIconClick={this.props.undo}
          iconName={faUndo} tooltip='Undo'/>
        <Icon
          onIconClick={this.props.redo}
          iconName={faRedo} tooltip='Redo'/>
        <Icon
          onIconClick={this.props.Toolbar.clearCanvas}
          iconName={faBroom} tooltip='Clear canvas'/>
        {tools}
        <FbColorPicker
          pickerId='border'
          containerClassName={styles.tooltip}
          active={this.state.pickerActive.border}
          color={this.props.borderColor}
          onSetActive={this.setPickerActive}
          onSelectColor={this.handleSelectBorderColor}
          paletteRemap={this.props.paletteRemap}
          colorPalette={this.props.colorPalette}
          tooltip='Border'
        />
        <FbColorPicker
          pickerId='background'
          containerClassName={styles.tooltip}
          active={this.state.pickerActive.background}
          color={this.props.backgroundColor}
          onSetActive={this.setPickerActive}
          onSelectColor={this.handleSelectBgColor}
          paletteRemap={this.props.paletteRemap}
          colorPalette={this.props.colorPalette}
          tooltip='Background'
        />
        <Icon
          bottom={true}
          onIconClick={() => this.props.Toolbar.setShowSettings(true)}
          iconName={faCog} tooltip='Preferences'/>
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
    backgroundColor: fp.maybe(framebuf, null, fb => fb.backgroundColor),
    borderColor: fp.maybe(framebuf, null, fb => fb.borderColor),
    selectedTool: state.toolbar.selectedTool,
    paletteRemap: getSettingsPaletteRemap(state),
    colorPalette: getSettingsCurrentColorPalette(state)
  }
}
export default connect(
  mapStateToProps,
  mapDispatchToProps,
  framebufIndexMergeProps
)(ToolbarView)
