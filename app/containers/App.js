
import React, {Component } from 'react';
import { connect } from 'react-redux'

import Toolbar from './Toolbar'
import FramebufferTabs from './FramebufferTabs'

import { Framebuffer } from '../redux/editor'
import * as reduxToolbar from '../redux/toolbar'

import s from './App.css'

class ExtLink extends Component {
  handleIconClick = (e) => {
    e.preventDefault()
    require('electron').shell.openExternal(this.props.href)
  }
  render () {
    return (
      <a onClick={this.handleIconClick} href={this.props.href}>
        {this.props.children}
      </a>
    )
  }
}

class AppView extends Component {

  handleKeyDown = (event) => {
    this.props.Toolbar.keyDown(event.key)
  }

  componentDidMount() {
    document.addEventListener('keydown', this.handleKeyDown);
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.handleKeyDown);
  }

  render() {
    const icon = null
    return (
      <div className={s.appGrid}>
        <div className={s.empty}>
          <ExtLink href='https://nurpax.github.io/petmate/'>
            {icon}
          </ExtLink>
        </div>
        <div className={s.topmenu}>
          <FramebufferTabs />
        </div>
        <div className={s.leftmenubar}>
          <Toolbar />
        </div>
        <div className={s.editor}>
          {this.props.children}
        </div>
      </div>
    )
  }
}

const mapDispatchToProps = dispatch => {
  return {
    Toolbar: reduxToolbar.Toolbar.bindDispatch(dispatch)
  }
}

const mapStateToProps = state => {
  return {
  }
}

export default connect(
  null,
  mapDispatchToProps
)(AppView)
