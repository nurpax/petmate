
import React, { Component } from 'react';
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'

import classnames from 'classnames'

import CharGrid from '../components/CharGrid'
import styles from './FramebufferTabs.css'
import { framebufIndexMergeProps }  from '../redux/utils'
import { Framebuffer } from '../redux/editor'
import { Toolbar } from '../redux/toolbar'
import * as Screens from '../redux/screens'
import * as selectors from '../redux/selectors'

import * as utils from '../utils'

class FramebufTab extends Component {
  handleSelect = () => {
    this.props.onSetActiveTab(this.props.id)
  }
  render () {
    const { width, height, framebuf, backgroundColor, borderColor } =
      this.props.framebuf
    const backg = utils.colorIndexToCssRgb(backgroundColor)
    const scaleX = 1.0/4
    const scaleY = 1.0/4
    const s = {
      width: 40*2,
      height: 25*2,
      backgroundColor: '#000',
      marginRight: '3px',
    }
    const scaleStyle = {
      transform: `scale(${scaleX}, ${scaleY})`,
      transformOrigin: '0% 0%'
    }
    return (
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
          />
        </div>
      </div>
    )
  }
}

class FramebufferTabs_ extends Component {
  handleActiveClick = (idx) => {
    this.props.Screens.setCurrentScreenIndex(idx)
  }

  handleNewTab = () => {
    this.props.Screens.newScreen()
  }

  handleRemoveTab = (idx) => {
//    this.props.Framebufs.removeFramebuf(idx)
//    this.props.Toolbar.setFramebufIndex(-1)
  }

  render () {
    const disableRemove = this.props.screens.length == 1
    const lis = this.props.screens.map((framebufId, i) => {
      return (
        <FramebufTab
          key={framebufId}
          id={i}
          onSetActiveTab={this.handleActiveClick}
          framebuf={this.props.getFramebufByIndex(framebufId)}
          active={i === this.props.activeScreen} />
      )
    })
    return (
      <div className={styles.tabHeadings}>
        <div className={styles.tabs}>
          {lis}
          <div className={classnames(styles.tab, styles.newScreen)}>
            <i onClick={this.handleNewTab} className='fa fa-plus'></i>
          </div>
        </div>
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
    getFramebufByIndex: (idx) => selectors.getFramebufByIndex(state, idx)
  }
}
export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(FramebufferTabs_)
