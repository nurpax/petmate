
// @flow
import React, { PureComponent } from 'react';

class CustomFontSelect extends React.Component<{
  customFonts: {id: string, name: string}[],
  current: string,
  setCharset: (name: string) => void
}> {

  handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    e.preventDefault();
    this.props.setCharset(e.target.value);
  }

  render () {
    const charsets = [
      {
        id: 'upper',
        name: 'ABC'
      },
      {
        id: 'lower',
        name: 'abc'
      }
    ].concat(this.props.customFonts);
    const options = charsets.map(cf => {
      let displayName = cf.name;
      return (
        <option
          key={name}
          value={cf.id}
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
  customFonts: { id: string, name: string}[];
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
          customFonts={this.props.customFonts}
          current={this.props.currentCharset}
          setCharset={this.props.setCharset}
        />
      </div>
    )
  }
}
