// @flow
import * as React from 'react';

import s from './App.css'

type Props = {
  children: React.Node
};

export default class App extends React.Component<Props> {
  props: Props;

  render() {
    return (
      <div className={s.appGrid}>
        <div className={s.empty} />
        <div className={s.topmenu}><h2>PETSCII EDITOR</h2></div>
        <div className={s.leftmenubar}>Foo
        </div>
        <div className={s.editor}>
          {this.props.children}
        </div>
      </div>
    )
  }
}
