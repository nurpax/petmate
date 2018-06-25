// @flow
import React, { Component } from 'react';
import styles from './Editor.css';

var fs = require('fs')
const nativeImage = require('electron').nativeImage

type Props = {};

class CharsetCache {
  constructor () {
    const data = fs.readFileSync('app/assets/system-charset.bin')

    this.chars = []
    this.dataURIs = []

    for (let c = 0; c < 256; c++) {
      const boffs = c*8;
      const char = []

      for (let y = 0; y < 8; y++) {
        const p = data[boffs+y]
        for (let i = 0; i < 8; i++) {
          const v = ((128 >> i) & p) ? 255 : 0
          char.push(v)
          char.push(v)
          char.push(v)
          char.push(255)
        }
      }
      this.chars.push(char)
      const img = nativeImage.createFromBuffer(Buffer.from(char), {width: 8, height: 8})
      this.dataURIs.push(img.toDataURL())
    }
  }

  getDataURI(screencode) {
    return this.dataURIs[screencode]
  }
}

const charset = new CharsetCache()

export default class Editor extends Component<Props> {
  props: Props;

  render() {
    const imgs = Array(256).fill(0).map((elt,idx) => {
      return <img key={idx} className={styles.pixelated} width={16} height={16} src={charset.getDataURI(idx)} />
    })
    return (
      <div>
        <div className={styles.container} data-tid="container">
          <h2>EDITOR</h2>
          {imgs}
        </div>
      </div>
    );
  }
}
