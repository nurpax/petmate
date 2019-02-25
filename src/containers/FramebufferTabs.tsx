
import React, { Component, PureComponent, useState, useCallback } from 'react';
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
import { Framebuf, Rgb, Font, RootState } from '../redux/types';

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
    const nameElts = this.state.editing ?
      <NameInput
        name={this.props.name}
        onSubmit={this.handleSubmit}
        onBlur={this.handleBlur}
        onCancel={this.handleCancel}
      /> :
      <div className={styles.tabName} onClick={this.handleEditingClick}>
        {this.props.name}
      </div>
    return (
      <div className={styles.tabNameContainer}>
        {nameElts}
      </div>
    )
  }
}

function computeContainerSize(fb: Framebuf, maxHeight: number) {
  const pixWidth = fb.width * 8;
  const pixHeight = fb.height * 8;
  // TODO if height is bigger than maxHeight, need to scale differently
  // to fit the box.
  const s = maxHeight / pixHeight;
  return {
    divWidth: pixWidth * s,
    divHeight: maxHeight,
    scaleX: s,
    scaleY: s
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
    const maxHeight = 25*2*1.5;
    const {
      divWidth, divHeight, scaleX, scaleY
    } = computeContainerSize(this.props.framebuf, maxHeight);
    const s = {
      width: divWidth,
      height: divHeight,
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

type ScreenDimsProps = {
  dims: {
    width: number,
    height: number
  };
  Toolbar: toolbar.PropsFromDispatch;
};

type ScreenDimsEditProps = {
  stopEditing: () => void;
};

function ScreenDimsEdit (props: ScreenDimsProps & ScreenDimsEditProps) {
  const { width, height } = props.dims;
  const [dimsText, setDimsText] = useState(`${width}x${height}`);

  const handleBlur = useCallback(() => {
    props.stopEditing();
  }, []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    props.stopEditing();
    const numsRe = /^([0-9]+)x([0-9]+)/;
    const matches = numsRe.exec(dimsText);
    if (matches) {
      props.Toolbar.setNewScreenSize({
        width: parseInt(matches[1]),
        height: parseInt(matches[2])
      })
    }
  }, [dimsText]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setDimsText(e.target.value);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      props.stopEditing();
    }
  }, []);

  const handleFocus = useCallback((e: React.FormEvent<HTMLInputElement>) => {
    let target = e.target as HTMLInputElement;
    props.Toolbar.setShortcutsActive(false);
    target.select();
  }, []);

  return (
    <div className={styles.tabNameEditor}>
      <form
        onSubmit={handleSubmit}
      >
        <input
          autoFocus
          type='text'
          pattern='[0-9]+x[0-9]+'
          title='Specify screen width x height (e.g., 40x25)'
          value={dimsText}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          onFocus={handleFocus}
          onChange={handleChange}
        />
      </form>
    </div>
  );
}

function ScreenDims (props: ScreenDimsProps) {
  const [editing, setEditing] = useState(false);
  const stopEditing = useCallback(() => {
    setEditing(false);
    props.Toolbar.setShortcutsActive(true);
  }, []);
  return (
    <div
      className={styles.screenDimContainer}
      onClick={() => setEditing(true)}
    >
      {editing ?
        <ScreenDimsEdit
          {...props}
          stopEditing={stopEditing}
        /> :
        <div className={styles.screenDimText}>{props.dims.width}x{props.dims.height}</div>}
    </div>
  );
}

function NewTabButton (props: {
  dims: { width: number, height: number },
  onClick: () => void,
  Toolbar: toolbar.PropsFromDispatch
}) {
  // onClick is not in FontAwesomeIcon props and don't know how to pass
  // it otherwise.
  const typingWorkaround = { onClick: props.onClick };
  return (
    <div className={classnames(styles.tab, styles.newScreen)}>
      <FontAwesomeIcon {...typingWorkaround} icon={faPlus} />
      <ScreenDims
        dims={props.dims}
        Toolbar={props.Toolbar}
      />
    </div>
  )
}

interface FramebufferTabsDispatch {
  Screens: screens.PropsFromDispatch;
  Toolbar: toolbar.PropsFromDispatch;
}

interface FramebufferTabsProps {
  screens: number[];
  activeScreen: number;
  colorPalette: Rgb[];
  newScreenSize: { width: number, height: number };

  getFramebufByIndex: (framebufId: number) => Framebuf | null;
  getFont: (framebuf: Framebuf) => Font;
  setFramebufName: (name: string, framebufIndex: number) => void;
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
    return (
      <div className={styles.tabHeadings}>
        <SortableTabList
          distance={5}
          axis='x'
          lockAxis='x'
          onSortEnd={this.onSortEnd}
        >
          {lis}
          <NewTabButton
            dims={this.props.newScreenSize}
            Toolbar={this.props.Toolbar}
            onClick={this.handleNewTab}
          />
        </SortableTabList>
      </div>
    )
  }
}

export default connect(
  (state: RootState) => {
    return {
      newScreenSize: state.toolbar.newScreenSize,
      activeScreen: screensSelectors.getCurrentScreenIndex(state),
      screens: screensSelectors.getScreens(state),
      getFramebufByIndex: (idx: number) => selectors.getFramebufByIndex(state, idx),
      getFont: (fb: Framebuf) => selectors.getFramebufFont(state, fb),
      colorPalette: getSettingsCurrentColorPalette(state)
    }
  },
  (dispatch) => {
    return {
      Toolbar: toolbar.Toolbar.bindDispatch(dispatch),
      Screens: bindActionCreators(screens.actions, dispatch),
      setFramebufName: bindActionCreators(framebuf.actions.setName, dispatch)
    }
  }
)(FramebufferTabs_)
