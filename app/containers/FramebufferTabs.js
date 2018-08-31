
import React, { Component, PureComponent } from 'react';
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { SortableContainer, SortableElement, arrayMove } from '../external/react-sortable-hoc'

import classnames from 'classnames'

import ContextMenuArea from './ContextMenuArea'

import CharGrid from '../components/CharGrid'
import styles from './FramebufferTabs.css'
import { framebufIndexMergeProps }  from '../redux/utils'
import { Framebuffer } from '../redux/editor'
import { Toolbar } from '../redux/toolbar'
import * as Screens from '../redux/screens'
import * as selectors from '../redux/selectors'

import * as utils from '../utils'
import * as fp from '../utils/fp'

// This class is a bit funky with how it disables/enables keyboard shortcuts
// globally for the app while the input element has focus.  Maybe there'd be a
// better way to do this, but this seems to work.
class NameInput_ extends Component {
  state = {
    name: this.props.name
  }

  componentWillUnmount () {
    this.props.Toolbar.setShortcutsActive(true)
  }

  handleSubmit = (e) => {
    e.preventDefault()
    this.props.onSubmit(this.state.name)
    this.props.Toolbar.setShortcutsActive(true)
  }

  handleChange = (e) => {
    this.setState({ name: e.target.value })
  }

  handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      this.props.onCancel()
      this.props.Toolbar.setShortcutsActive(true)
    }
  }

  handleBlur = (e) => {
    this.props.onBlur()
    this.props.Toolbar.setShortcutsActive(true)
  }

  handleFocus = (e) => {
    this.props.Toolbar.setShortcutsActive(false)
    e.target.select()
  }

  render () {
    // Not the pattern field for the input.  Only accept screen names that
    // most assemblers can compile.  Otherwise the names may leak into .asm
    // export, the export succeeds, only for the user to find out much later
    // that his exported .asm file does not even compile.
    return (
      <div className={styles.tabNameEditor}>
        <form onSubmit={this.handleSubmit}>
          <input
            autoFocus
            onKeyDown={this.handleKeyDown}
            value={this.state.name}
            onChange={this.handleChange}
            onBlur={this.handleBlur}
            onFocus={this.handleFocus}
            type='text'
            pattern='[_a-zA-Z]+[a-zA-Z0-9_]*'
            size={14} />
        </form>
      </div>
    )
  }
}

const NameInput = connect(
  null,
  (dispatch, ownProps) => {
    return {
      Toolbar: Toolbar.bindDispatch(dispatch)
    }
  }
)(NameInput_)


class NameEditor extends Component {
  state = {
    editing: false,
  }

  handleEditingClick = () => {
    this.setState({ editing: true })
  }

  handleBlur = () => {
    this.setState({ editing: false})
  }

  handleSubmit = (name) => {
    this.setState({ editing: false})
    this.props.onNameSave(name)
  }

  handleCancel = () => {
    this.setState({ editing: false})
  }

  render () {
    if (this.state.editing) {
      return (
        <NameInput
          name={this.props.name}
          onSubmit={this.handleSubmit}
          onBlur={this.handleBlur}
          onCancel={this.handleCancel}
        />
      )
    }
    return (
      <div className={styles.tabName} onClick={this.handleEditingClick}>
        {this.props.name}
      </div>
    )
  }
}

class FramebufTab extends PureComponent {
  handleSelect = () => {
    this.props.onSetActiveTab(this.props.id)
  }

  handleMenuDuplicate = () => {
    this.props.onDuplicateTab(this.props.id)
  }

  handleMenuRemove = () => {
    this.props.onRemoveTab(this.props.id)
  }

  handleNameSave = (name) => {
    if (name !== '') {
      this.props.setName(name, this.props.framebufId)
    }
  }

  render () {
    const {
      width,
      height,
      framebuf,
      backgroundColor,
      borderColor
    } = this.props.framebuf
    const font = this.props.font
    const colorPalette = this.props.colorPalette
    const backg = utils.colorIndexToCssRgb(colorPalette, backgroundColor)
    const bord = utils.colorIndexToCssRgb(colorPalette, borderColor)
    const scaleX = 1.0/4*1.5
    const scaleY = 1.0/4*1.5
    const s = {
      width: 40*2*1.5,
      height: 25*2*1.5,
      backgroundColor: '#000',
      borderStyle: 'solid',
      borderWidth: '5px',
      borderColor: bord
    }
    const scaleStyle = {
      transform: `scale(${scaleX}, ${scaleY})`,
      transformOrigin: '0% 0%'
    }

    const menuItems = [
      {
        label: "Duplicate",
        click: this.handleMenuDuplicate
      },
      {
        label: "Remove",
        click: this.handleMenuRemove
      }
    ]

    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        marginRight: '4px'
      }}>
        <ContextMenuArea menuItems={menuItems}>
          <div
            onClick={this.handleSelect}
            className={classnames(styles.tab, this.props.active ? styles.active : null)}
            style={s}
          >
            <div style={scaleStyle}>
              <CharGrid
                width={width}
                height={height}
                backgroundColor={backg}
                grid={false}
                framebuf={framebuf}
                font={font}
                colorPalette={colorPalette}
              />
            </div>
          </div>
        </ContextMenuArea>
        <NameEditor
          name={fp.maybeDefault(this.props.framebuf.name, 'Untitled')}
          onNameSave={this.handleNameSave}
        />
      </div>
    )
  }
}

const SortableFramebufTab = SortableElement((props) =>
  <FramebufTab {...props} />
)

const SortableTabList = SortableContainer(({children}) => {
  return (
    <div className={styles.tabs}>
      {children}
    </div>
  )
})

class FramebufferTabs_ extends Component {
  handleActiveClick = (idx) => {
    this.props.Screens.setCurrentScreenIndex(idx)
  }

  handleNewTab = () => {
    this.props.Screens.newScreen()
    // Context menu eats the ctrl key up event, so force it to false
    this.props.Toolbar.setCtrlKey(false)
  }

  handleRemoveTab = (idx) => {
    this.props.Screens.removeScreen(idx)
    // Context menu eats the ctrl key up event, so force it to false
    this.props.Toolbar.setCtrlKey(false)
  }

  handleDuplicateTab = (idx) => {
    this.props.Screens.cloneScreen(idx)
    // Context menu eats the ctrl key up event, so force it to false
    this.props.Toolbar.setCtrlKey(false)
  }

  onSortEnd = ({oldIndex, newIndex}) => {
    this.props.Screens.setScreenOrder(arrayMove(this.props.screens, oldIndex, newIndex))
  }

  render () {
    const lis = this.props.screens.map((framebufId, i) => {
      const framebuf = this.props.getFramebufByIndex(framebufId)
      return (
        <SortableFramebufTab
          key={framebufId}
          index={i}
          id={i}
          framebufId={framebufId}
          onSetActiveTab={this.handleActiveClick}
          onRemoveTab={this.handleRemoveTab}
          onDuplicateTab={this.handleDuplicateTab}
          framebuf={framebuf}
          active={i === this.props.activeScreen}
          font={this.props.getFont(framebuf)}
          colorPalette={this.props.colorPalette}
          setName={this.props.Framebuffer.setName}
        />
      )
    })
    return (
      <div className={styles.tabHeadings}>
        <SortableTabList
          distance={5}
          axis='x'
          lockAxis='x'
          onSortEnd={this.onSortEnd}
        >
          {lis}
          <div className={classnames(styles.tab, styles.newScreen)}>
            <i onClick={this.handleNewTab} className='fa fa-plus'></i>
          </div>
        </SortableTabList>
      </div>
    )
  }
}

const mapDispatchToProps = (dispatch, ownProps) => {
  return {
    Toolbar: Toolbar.bindDispatch(dispatch),
    Framebuffer: Framebuffer.bindDispatch(dispatch),
    Screens: bindActionCreators(Screens.actions, dispatch)
  }
}

const mapStateToProps = state => {
  return {
    activeScreen: selectors.getCurrentScreenIndex(state),
    screens: selectors.getScreens(state),
    getFramebufByIndex: (idx) => selectors.getFramebufByIndex(state, idx),
    getFont: (fb) => selectors.getFramebufFont(state, fb),
    colorPalette: selectors.getSettingsCurrentColorPalette(state)
  }
}
export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(FramebufferTabs_)
