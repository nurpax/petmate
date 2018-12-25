
import React, { Component, PureComponent } from 'react';
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { SortableContainer, SortableElement, arrayMove } from '../external/react-sortable-hoc'

import classnames from 'classnames'

import ContextMenuArea from './ContextMenuArea'

import CharGrid from '../components/CharGrid'
import * as framebuf from '../redux/editor'
import * as toolbar from '../redux/toolbar'
import * as screens from '../redux/screens'
import * as selectors from '../redux/selectors'
import * as screensSelectors from '../redux/screensSelectors'
import { getSettingsCurrentColorPalette } from '../redux/settingsSelectors'

import * as utils from '../utils'
import * as fp from '../utils/fp'

import { faPlus } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import styles from './FramebufferTabs.module.css'
import { Framebuf, Rgb, Font, RootState, RootStateThunk } from '../redux/types';

interface NameInputDispatchProps {
  Toolbar: toolbar.PropsFromDispatch;
}

interface NameInputProps {
  name: string;

  onSubmit: (name: string) => void;
  onCancel: () => void;
  onBlur: () => void;
}

interface NameInputState {
  name: string;
}

// This class is a bit funky with how it disables/enables keyboard shortcuts
// globally for the app while the input element has focus.  Maybe there'd be a
// better way to do this, but this seems to work.
class NameInput_ extends Component<NameInputProps & NameInputDispatchProps, NameInputState> {
  state = {
    name: this.props.name
  }

  componentWillUnmount () {
    this.props.Toolbar.setShortcutsActive(true)
  }

  handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    this.props.onSubmit(this.state.name)
    this.props.Toolbar.setShortcutsActive(true)
  }

  handleChange = (e: React.FormEvent<EventTarget>) => {
    let target = e.target as HTMLInputElement;
    this.setState({ name: target.value })
  }

  handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      this.props.onCancel()
      this.props.Toolbar.setShortcutsActive(true)
    }
  }

  handleBlur = (_e: React.FormEvent<HTMLInputElement>) => {
    this.props.onBlur()
    this.props.Toolbar.setShortcutsActive(true)
  }

  handleFocus = (e: React.FormEvent<HTMLInputElement>) => {
    let target = e.target as HTMLInputElement;
    this.props.Toolbar.setShortcutsActive(false)
    target.select()
  }

  render () {
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
            size={14} />
        </form>
      </div>
    )
  }
}

const NameInput = connect(
  null,
  (dispatch) => {
    return {
      Toolbar: bindActionCreators(toolbar.Toolbar.actions, dispatch)
    }
  }
)(NameInput_)


interface NameEditorProps {
  name: string;

  onNameSave: (name: string) => void;
}

interface NameEditorState {
  editing: boolean;
}

class NameEditor extends Component<NameEditorProps, NameEditorState> {
  state = {
    editing: false
  }

  handleEditingClick = () => {
    this.setState({ editing: true })
  }

  handleBlur = () => {
    this.setState({ editing: false})
  }

  handleSubmit = (name: string) => {
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

interface FramebufTabProps {
  id: number;
  active: boolean;
  framebufId: number;
  framebuf: Framebuf;
  colorPalette: Rgb[];
  font: Font;

  setName: (name: string, framebufId: number) => void;
  onSetActiveTab: (id: number) => void;
  onDuplicateTab: (id: number) => void;
  onRemoveTab: (id: number) => void;
};

class FramebufTab extends PureComponent<FramebufTabProps> {
  handleSelect = () => {
    this.props.onSetActiveTab(this.props.id)
  }

  handleMenuDuplicate = () => {
    this.props.onDuplicateTab(this.props.id)
  }

  handleMenuRemove = () => {
    this.props.onRemoveTab(this.props.id)
  }

  handleNameSave = (name: string) => {
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
          name={fp.maybeDefault(this.props.framebuf.name, 'Untitled' as string)}
          onNameSave={this.handleNameSave}
        />
      </div>
    )
  }
}

const SortableFramebufTab = SortableElement((props: FramebufTabProps) =>
  <FramebufTab {...props} />
)

const SortableTabList = SortableContainer((props: {children: any}) => {
  return (
    <div className={styles.tabs}>
      {props.children}
    </div>
  )
})

interface FramebufferTabsDispatch {
  Screens: screens.PropsFromDispatch;
  Toolbar: toolbar.PropsFromDispatch;
}

interface FramebufferTabsProps {
  screens: number[];
  activeScreen: number;
  colorPalette: Rgb[];

  getFramebufByIndex: (framebufId: number) => Framebuf | null;
  getFont: (framebuf: Framebuf) => Font;
  setFramebufName: (name: string) => void;
}

class FramebufferTabs_ extends Component<FramebufferTabsProps & FramebufferTabsDispatch> {
  handleActiveClick = (idx: number) => {
    this.props.Screens.setCurrentScreenIndex(idx)
  }

  handleNewTab = () => {
    this.props.Screens.newScreen()
    // Context menu eats the ctrl key up event, so force it to false
    this.props.Toolbar.setCtrlKey(false)
  }

  handleRemoveTab = (idx: number) => {
    this.props.Screens.removeScreen(idx)
    // Context menu eats the ctrl key up event, so force it to false
    this.props.Toolbar.setCtrlKey(false)
  }

  handleDuplicateTab = (idx: number) => {
    this.props.Screens.cloneScreen(idx)
    // Context menu eats the ctrl key up event, so force it to false
    this.props.Toolbar.setCtrlKey(false)
  }

  onSortEnd = (args: {oldIndex: number, newIndex: number}) => {
    this.props.Screens.setScreenOrder(arrayMove(this.props.screens, args.oldIndex, args.newIndex))
  }

  render () {
    const lis = this.props.screens.map((framebufId, i) => {
      const framebuf = this.props.getFramebufByIndex(framebufId)!
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
          setName={this.props.setFramebufName}
        />
      )
    })
    // onClick is not in FontAwesomeIcon props and don't know how to pass
    // it otherwise.
    const typingWorkaround = { onClick: this.handleNewTab };
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
            <FontAwesomeIcon {...typingWorkaround} icon={faPlus} />
          </div>
        </SortableTabList>
      </div>
    )
  }
}

export default connect(
  (state: RootState) => {
    return {
      activeScreen: screensSelectors.getCurrentScreenIndex(state),
      screens: screensSelectors.getScreens(state),
      getFramebufByIndex: (idx: number) => selectors.getFramebufByIndex(state, idx),
      getFont: (fb: Framebuf) => selectors.getFramebufFont(state, fb),
      colorPalette: getSettingsCurrentColorPalette(state)
    }
  },
  (dispatch) => {
    function setFbName(name: string): RootStateThunk {
      return (dispatch, getState) => {
        const framebufIndex = screensSelectors.getCurrentScreenFramebufIndex(getState());
        if (framebufIndex != null) {
          dispatch(framebuf.actions.setName(name, framebufIndex));
        }
      }
    }
    return {
      Toolbar: toolbar.Toolbar.bindDispatch(dispatch),
      Screens: bindActionCreators(screens.actions, dispatch),
      setFramebufName: bindActionCreators(setFbName, dispatch)
    }
  }
)(FramebufferTabs_)
