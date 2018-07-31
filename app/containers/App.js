
import React, { Component, Fragment } from 'react';
import { connect } from 'react-redux'

import Toolbar from './Toolbar'
import FramebufferTabs from './FramebufferTabs'
import Settings from './Settings'

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
      <a
        onClick={this.handleIconClick}
        href={this.props.href}>
        {this.props.children}
      </a>
    )
  }
}

class AppView extends Component {

  handleKeyDown = (event) => {
    this.props.Toolbar.keyDown(event.key)
  }

  handleKeyUp = (event) => {
    this.props.Toolbar.keyUp(event.key)
  }

  componentDidMount() {
    document.addEventListener('keydown', this.handleKeyDown);
    document.addEventListener('keyup', this.handleKeyUp);
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.handleKeyDown);
    document.removeEventListener('keyup', this.handleKeyUp);
  }

  render() {
    const icon = <img style={{paddingLeft:'3px'}}width={56} src={require('assets/appicon.png')} />
    return (
      <Fragment>
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
        <Settings />
      </Fragment>
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
