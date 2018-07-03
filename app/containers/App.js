
import React, {Component } from 'react';

import s from './App.css'

export default class App extends Component {
  render() {
    return (
      <div className={s.appGrid}>
        <div className={s.empty} />
        <div className={s.topmenu}><h2>PETSCII EDITOR</h2></div>
        <div className={s.leftmenubar} />
        <div className={s.editor}>
          {this.props.children}
        </div>
      </div>
    )
  }
}
