
import React, {Component } from 'react';
import Toolbar from './Toolbar'
import FramebufferTabs from './FramebufferTabs'

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

export default class App extends Component {
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
