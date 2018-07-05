// @flow
import React, { Component } from 'react';
import styles from './ColorPicker.css';
import * as utils from '../utils'

export default class ColorPicker extends Component {
  render() {
    const colors = utils.palette.map((c, idx) => {
      const bg = utils.rgbToCssRgb(c)
      const style = {
        backgroundColor: bg,
        width: '16px',
        height: '16px'
      }
      const cls = this.props.selected === idx ? styles.boxSelected : styles.box
      return (
        <div
          key={idx}
          onClick={() => this.props.onSelectColor(idx)}
          style={style}
          className={cls}/>
      )
    })
    return (
      <div className={styles.container}>
        {colors}
      </div>
    );
  }
}
