// @flow
import React, { Component } from 'react';
import styles from './ColorPicker.css';
import * as utils from '../utils'

import { SortableContainer, SortableElement, arrayMove } from 'react-sortable-hoc';

const ColorBlock = ({ color }) => {
  const bg = utils.colorIndexToCssRgb(color)
  const style = {
    backgroundColor: bg,
    width: '16px',
    height: '16px',
    marginRight: '2px'
  }
  const cls = styles.box
  return (
    <div style={style} className={cls}/>
  )
}

const SortableItem = SortableElement(({color}) =>
  <ColorBlock color={color} />
)

const SortableList = SortableContainer(({items}) => {
  return (
    <div className={styles.container}>
      {items.map((value, index) => (
        <SortableItem key={`item-${index}`} index={index} color={value} />
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
        items={this.props.palette}
        onSortEnd={this.onSortEnd}
      />
    )
  }
}

export class ColorPalette extends Component {
  render () {
    const items = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'row'
      }}>
        {items.map((value,idx) => {
          return <ColorBlock key={idx} color={value} />
        })}
      </div>
    )
  }
}

export default class ColorPicker extends Component {
  static defaultProps = {
    paletteRemap: Array(16).fill().map((d,i) => i)
  }
  render() {
    const colors = this.props.paletteRemap.map((idx) => {
      const c = utils.palette[idx]
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
