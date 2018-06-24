// @flow
import React, { Component } from 'react';
import styles from './Editor.css';

const nativeImage = require('electron').nativeImage

type Props = {};

export default class Editor extends Component<Props> {
  props: Props;

  render() {
//    const buf = Buffer.from([0, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 0, 255, 0, 255])
//    const buf = Buffer.from([0, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 0, 255, 0, 255])
//    const buf = Buffer.from([2, 2, 255,255,255, 0,255,0, 255,0,0, 0,0,255])
    const buf = Buffer.from([255,0,0,255, 0,255,0,255, 0,0,255,255, 0,0,0,255])
    const img = nativeImage.createFromBuffer(buf, {width: 2, height: 2})
    console.log(img.toDataURL())

    return (
      <div>
        <div className={styles.container} data-tid="container">
          <h2>EDITOR</h2>
          <img className={styles.pixelated} width={64} height={64} src={img.toDataURL()} />
          foo
        </div>
      </div>
    );
  }
}
