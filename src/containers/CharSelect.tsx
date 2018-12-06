
import React, { Component, PureComponent, StatelessComponent as SFC } from 'react';
import { connect } from 'react-redux'
import { Dispatch, bindActionCreators } from 'redux'

import { RootState, Charset, Font, Pixel, Coord2, Rgb } from '../redux/types'
import * as framebuffer from '../redux/editor'

import { Toolbar } from '../redux/toolbar'
import { framebufIndexMergeProps } from '../redux/utils'

import CharGrid from '../components/CharGrid'
import CharPosOverlay from '../components/CharPosOverlay'
import { CharSelectStatusbar } from '../components/Statusbar'

import * as utils from '../utils'
import * as fp from '../utils/fp'
import * as selectors from '../redux/selectors'
import * as screensSelectors from '../redux/screensSelectors'
import {
  getSettingsCurrentColorPalette
} from '../redux/settingsSelectors'

import { CharPosition } from './hoc'

import styles from './CharSelect.module.css'

interface SelectButtonProps {
  name: Charset;
  current: Charset;
  setCharset: (c: Charset) => void;
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
  currentCharset: Charset;
  setCharset: (c: Charset) => void;
}

class FontSelector extends PureComponent<FontSelectorProps> {
  render () {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        paddingLeft: '10px',
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
      </div>
    )
  }
}

interface CharSelectProps {
  Toolbar: any; // TODO ts
  Framebuffer: framebuffer.PropsFromDispatch;
  font: Font;
  canvasScale: {
    scaleX: number, scaleY: number
  };
  colorPalette: Rgb[];
  selected: Coord2 | null;
  backgroundColor: number;
  textColor: number;
  curScreencode: number;
}

interface CharSelectState {
  charPos: Coord2;
  isActive: boolean;
}

class CharSelect extends Component<CharSelectProps, CharSelectState> {

  fb: Pixel[][]|null = null;
  font: Font|null = null;
  prevTextColor = -1;

  constructor (props: CharSelectProps) {
    super(props)
    this.computeCachedFb(0)

    this.state = {
      charPos: { row:0, col: 0 },
      isActive: false
    }
  }

  computeCachedFb(textColor: number) {
    const { font } = this.props
    this.fb = fp.mkArray(16, y => {
      return fp.mkArray(16, x => {
        return {
          code: utils.charScreencodeFromRowCol(font, {row:y, col:x}),
          color: textColor
        }
      })
    })
    this.prevTextColor = textColor
    this.font = font
  }

  handleClick = () => {
    this.props.Toolbar.setCurrentChar(this.state.charPos)
  }

  handleCharPosChanged = (charPos: Coord2) => {
    this.setState({ charPos })
  }

  handleActivationChanged = (args: { isActive: boolean}) => {
    this.setState({ isActive: args.isActive })
  }

  render () {
    const W = 16
    const H = 16
    const { colorPalette, font } = this.props
    // Editor needs to specify a fixed width/height because the contents use
    // relative/absolute positioning and thus seem to break out of the CSS
    // grid.
    const { scaleX, scaleY } = this.props.canvasScale
    const w = `${Math.floor(scaleX*8*16+scaleX*16)}px`
    const h = `${Math.floor(scaleY*8*16+scaleY*16)}px`
    const backg = utils.colorIndexToCssRgb(
      colorPalette, this.props.backgroundColor
    )
    const s = {width: w, height:h}
    if (this.prevTextColor !== this.props.textColor ||
      this.font !== this.props.font) {
      this.computeCachedFb(this.props.textColor)
    }
    let screencode = this.props.curScreencode
    if (this.state.isActive) {
      screencode = utils.charScreencodeFromRowCol(font, this.state.charPos)
    }
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column'
      }}>
        <CharPosition
          onCharPosChanged={this.handleCharPosChanged}
          onActivationChanged={this.handleActivationChanged}
        >
          <div className={styles.csContainer} style={s}>
            <div
              style={{
                imageRendering: 'pixelated',
                transform: `scale(${scaleX}, ${scaleY})`,
                transformOrigin: '0% 0%',
                width: W*9,
                height: H*9
              }}
              onClick={this.handleClick}
            >
              <CharGrid
                width={W}
                height={H}
                backgroundColor={backg}
                grid={true}
                framebuf={this.fb}
                selected={this.props.selected}
                font={this.props.font}
                colorPalette={colorPalette}
              />
              {this.state.isActive ?
                <CharPosOverlay
                  framebufWidth={W}
                  framebufHeight={H}
                  grid={true}
                  opacity={0.5}
                  charPos={this.state.charPos}
                />
                : null}
              {this.props.selected ?
                <CharPosOverlay
                  framebufWidth={W}
                  framebufHeight={H}
                  grid={true}
                  opacity={1.0}
                  charPos={this.props.selected} />
                : null}
            </div>
          </div>
        </CharPosition>
        <div style={{
          display: 'flex',
          flexDirection: 'row',
          marginTop:'4px',
          alignItems:'center',
          justifyContent: 'space-between'
        }}>
          <CharSelectStatusbar
            curScreencode={screencode}
          />
          <FontSelector
            currentCharset={font.charset}
            setCharset={this.props.Framebuffer.setCharset}
          />
        </div>
      </div>
    )
  }
}

const mapDispatchToProps = (dispatch: Dispatch) => {
  return {
    Framebuffer: bindActionCreators(framebuffer.actions, dispatch),
    Toolbar: Toolbar.bindDispatch(dispatch)
  }
}

const mapStateToProps = (state: RootState) => {
  const framebuf = selectors.getCurrentFramebuf(state)
  const font = selectors.getCurrentFramebufFont(state)
  const selected =
    selectors.getCharRowColWithTransform(
      state.toolbar.selectedChar,
      font,
      state.toolbar.charTransform
    )
  return {
    framebufIndex: screensSelectors.getCurrentScreenFramebufIndex(state),
    backgroundColor: framebuf ? framebuf.backgroundColor : framebuffer.DEFAULT_BACKGROUND_COLOR,
    selected,
    curScreencode: utils.charScreencodeFromRowCol(font, selected),
    textColor: state.toolbar.textColor,
    font,
    colorPalette: getSettingsCurrentColorPalette(state)
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
  framebufIndexMergeProps
)(CharSelect)

