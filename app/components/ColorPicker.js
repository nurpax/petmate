// @flow
import React, { Component } from 'react';
import styles from './ColorPicker.css';
import * as utils from '../utils'
import * as fp from '../utils/fp'

import { SortableContainer, SortableElement, arrayMove } from 'react-sortable-hoc';

const ColorBlock = ({ color, colorPalette, hover }) => {
  const bg = utils.colorIndexToCssRgb(colorPalette, color)
  const style = {
    backgroundColor: bg,
    width: '16px',
    height: '16px',
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
    paletteRemap: fp.mkArray(16, i => i)
  }
  render() {
    const colors = this.props.paletteRemap.map((idx) => {
      const c = this.props.colorPalette[idx]
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
