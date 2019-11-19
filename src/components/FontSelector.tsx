
// @flow
import React, { PureComponent, FunctionComponent as SFC } from 'react';

import styles from './FontSelector.module.css';

interface SelectButtonProps {
  name: string;
  current: string;
  setCharset: (c: string) => void;
  children: {};
}

const SelectButton: SFC<SelectButtonProps> = (props: SelectButtonProps) => {
  const { name, current, setCharset, children } = props;
  return (
    <div className={styles.charsetSelectButton} style={{
      borderStyle: 'solid',
      borderWidth: '1px',
      borderColor: name === current ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.0)'
    }}
    onClick={() => setCharset(name)}
    >
      {children}
    </div>
  )
}

interface FontSelectorProps {
  currentCharset: string;
  setCharset: (c: string) => void;
}

export default class FontSelector extends PureComponent<FontSelectorProps> {
  render () {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        fontSize: '0.8em',
        color: 'rgb(120,120,120)'
      }}>
        <div>Charset: </div>
        <SelectButton
          name='upper'
          current={this.props.currentCharset}
          setCharset={this.props.setCharset}>
          ABC
        </SelectButton>
        <SelectButton
          name='lower'
          current={this.props.currentCharset}
          setCharset={this.props.setCharset}>
          abc
        </SelectButton>
        <SelectButton
          name='custom_1'
          current={this.props.currentCharset}
          setCharset={this.props.setCharset}>
          custom_1
        </SelectButton>
      </div>
    )
  }
}
