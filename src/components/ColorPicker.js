// @flow
import React, { Component } from 'react';
import * as utils from '../utils'
import * as fp from '../utils/fp'

import { SortableContainer, SortableElement, arrayMove } from '../external/react-sortable-hoc'

import styles from './ColorPicker.module.css';

const ColorBlock = ({ color, colorPalette, hover }) => {
  const bg = utils.colorIndexToCssRgb(colorPalette, color)
  const style = {
    backgroundColor: bg,
    width: '13px',
    height: '13px',
    marginRight: '2px'
  }
  const cls = hover ? styles.box : styles.boxNoHover
  return (
    <div style={style} className={cls}/>
  )
}

const SortableItem = SortableElement(({color, colorPalette}) =>
  <ColorBlock color={color} hover={true} colorPalette={colorPalette} />
)

const SortableList = SortableContainer(({items, colorPalette}) => {
  return (
    <div className={styles.container}>
      {items.map((value, index) => (
        <SortableItem
          key={`item-${index}`}
          index={index}
          color={value}
          colorPalette={colorPalette}
        />
      ))}
    </div>
  );
})

export class SortableColorPalette extends Component {
  onSortEnd = ({oldIndex, newIndex}) => {
    const newArr = arrayMove(this.props.palette, oldIndex, newIndex)
    this.props.setPalette(newArr)
  }
  render () {
    return (
      <SortableList
        helperClass={styles.sortableHelper}
        axis='x'
        lockAxis='x'
        items={this.props.palette}
        colorPalette={this.props.colorPalette}
        onSortEnd={this.onSortEnd}
      />
    )
  }
}

export class ColorPalette extends Component {
  render () {
    const items = fp.mkArray(16, i => i)
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'row'
      }}>
        {items.map((value,idx) => {
          return (
            <ColorBlock
              key={idx}
              color={value}
              hover={false}
              colorPalette={this.props.colorPalette}
            />
          )
        })}
      </div>
    )
  }
}

export default class ColorPicker extends Component {
  static defaultProps = {
    paletteRemap: fp.mkArray(16, i => i),
    twoRows: false,
    scale: { scaleX:1, scaleY:1 }
  }
  render() {
    const { scaleX, scaleY } = this.props.scale
    const w = Math.floor(scaleX * 18 * 8)
    const h = Math.floor(scaleY * 4 * 8) + 2*2
    const blockWidth = (w / 8) - 4
    const blockHeight = blockWidth
    const colors = this.props.paletteRemap.map((idx) => {
      const c = this.props.colorPalette[idx]
      const bg = utils.rgbToCssRgb(c)
      const style = {
        backgroundColor: bg,
        width: `${blockWidth}px`,
        height: `${blockHeight}px`
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
    let doubleRowsStyle = {}
    if (this.props.twoRows) {
      doubleRowsStyle = {
        width: `${w}px`,
        height: `${h}px`,
        flexWrap: 'wrap'
      }
    }
    return (
      <div
        className={styles.container}
        style={doubleRowsStyle}
      >
        {colors}
      </div>
    );
  }
}
