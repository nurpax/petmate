
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
      borderColor: bord,
      marginRight: '4px'
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
          onSetActiveTab={this.handleActiveClick}
          onRemoveTab={this.handleRemoveTab}
          onDuplicateTab={this.handleDuplicateTab}
          framebuf={framebuf}
          active={i === this.props.activeScreen}
          font={this.props.getFont(framebuf)}
          colorPalette={this.props.colorPalette} />
      )
    })
    return (
      <div className={styles.tabHeadings}>
        <SortableTabList
          distance={5}
          axis='x'
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
