
import React, { Component } from 'react';
import { connect } from 'react-redux'

import classnames from 'classnames'

import styles from './FramebufferTabs.css'
import { framebufIndexMergeProps }  from '../redux/utils'
import { Framebuffer } from '../redux/editor'
import { Toolbar } from '../redux/toolbar'
import * as selectors from '../redux/selectors'

class FramebufferTabs_ extends Component {
  handleActiveClick = (idx) => (e) => {
    e.preventDefault()
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
      return <li key={key} className={cls}><a href='/#' onClick={this.handleActiveClick(i)}>{name}</a></li>
    })
    return (
      <div className={styles.tabHeadings}>
        <ul className={styles.tabs}>
          {lis}
          <li><i onClick={this.handleNewTab} className='fa fa-plus'></i></li>
        </ul>
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
    framebufList: state.framebufList
  }
}
export default connect(
  mapStateToProps,
  mapDispatchToProps,
  framebufIndexMergeProps
)(FramebufferTabs_)
