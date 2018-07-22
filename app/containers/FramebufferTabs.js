
import React, { Component } from 'react';
import { connect } from 'react-redux'

import classnames from 'classnames'

import CharGrid from '../components/CharGrid'
import styles from './FramebufferTabs.css'
import { framebufIndexMergeProps }  from '../redux/utils'
import { Framebuffer } from '../redux/editor'
import { Toolbar } from '../redux/toolbar'
import * as selectors from '../redux/selectors'

import * as utils from '../utils'

class FramebufTab extends Component {
  handleSelect = () => {
    this.props.onSetActiveTab(this.props.id)
  }
  render () {
//    console.log(this.props.framebuf)
    const { width, height, framebuf, backgroundColor, borderColor } =
      this.props.framebuf
    const backg = utils.colorIndexToCssRgb(backgroundColor)
    const scaleX = 1.0/4
    const scaleY = 1.0/4
    const s = {
      width: 40*2,
      height: 25*2,
      backgroundColor: '#333',
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
    this.props.Toolbar.setFramebufIndex(idx)
  }

  handleNewTab = () => {
    this.props.newFramebuf()
    this.props.Toolbar.setFramebufIndex(-1)
  }

  render () {
    const lis = this.props.framebufList.map((t, i) => {
      const key = i
      const name = `Tab ${i}`
      const cls = classnames(i === this.props.framebufIndex ? styles.active : null)
      return (
        <FramebufTab
          key={key}
          id={i}
          onSetActiveTab={this.handleActiveClick}
          framebuf={this.props.getFramebufByIndex(i)}
          active={i === this.props.framebufIndex} />
      )
    })
    return (
      <div className={styles.tabHeadings}>
        <div className={styles.tabs}>
          {lis}
          <div className={styles.tab}>
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
    newFramebuf: () => { // TODO make an action creator function somewhere
      dispatch({
        type: 'ADD_FRAMEBUF'
      })
    }
  }
}

const mapStateToProps = state => {
  const framebuf = selectors.getCurrentFramebuf(state)
  return {
    framebufIndex: state.toolbar.framebufIndex,
    framebufList: state.framebufList,
    getFramebufByIndex: (idx) => selectors.getFramebufByIndex(state, idx)
  }
}
export default connect(
  mapStateToProps,
  mapDispatchToProps,
  framebufIndexMergeProps
)(FramebufferTabs_)
