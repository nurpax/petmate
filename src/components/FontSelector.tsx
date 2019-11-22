
// @flow
import React, { PureComponent } from 'react';

class CustomFontSelect extends React.Component<{
  customFontNames: string[],
  current: string,
  setCharset: (name: string) => void
}> {

  handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    e.preventDefault();
    this.props.setCharset(e.target.value);
  }

  render () {
    const displayNames: {[n: string]: string|undefined} = {
      'upper': 'ABC',
      'lower': 'abc'
    };
    const charsets = ['upper', 'lower'].concat(this.props.customFontNames);
    const options = charsets.map(name => {
      let displayName = displayNames[name];
      if (displayName === undefined) {
        displayName = name;
      }
      return (
        <option
          key={name}
          value={name}
        >
          {displayName}
        </option>
      );
    })
    return (
      <div style={{marginLeft: '5px'}}>
        <select style={{
          borderStyle: 'solid',
          borderWidth: '0px',
          borderColor: 'rgba(255,255,255, 0.0)'
        }}
          value={this.props.current}
          onChange={this.handleSelectChange}
        >
          {options}
        </select>
      </div>
    )
  }
}

interface FontSelectorProps {
  currentCharset: string;
  setCharset: (c: string) => void;
  customFontNames: string[];
}

export default class FontSelector extends PureComponent<FontSelectorProps> {
  render () {
    // TODO some smarter way of layouting the custom font list.. they don't fit
    // horizontally
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        fontSize: '0.8em',
        color: 'rgb(120,120,120)'
      }}>
        <div>Charset: </div>
        <CustomFontSelect
          customFontNames={this.props.customFontNames}
          current={this.props.currentCharset}
          setCharset={this.props.setCharset}
        />
      </div>
    )
  }
}
