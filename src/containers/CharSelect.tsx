
import React, { Component, useRef, useCallback, useState, MouseEvent, CSSProperties } from 'react';
import { connect } from 'react-redux'
import { Dispatch, bindActionCreators } from 'redux'

import { RootState, Font, Pixel, Coord2, Rgb, Charset } from '../redux/types'
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

import FontSelector from '../components/FontSelector'

import styles from './CharSelect.module.css'

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
}

// Char position & click hook
function useCharPos(
  charWidth: number,
  charHeight: number,
  initialCharPos: Coord2 | null
) {
  const ref = useRef<HTMLDivElement>(null);
  let [isActive, setIsActive] = useState(true);
  let [charPos, setCharPos] = useState<Coord2|null>(initialCharPos);
  let onMouseMove = useCallback(function(event: MouseEvent) {
    if (isActive && ref.current != null) {
      const bbox = ref.current.getBoundingClientRect();
      const x = Math.floor((event.clientX - bbox.left)/bbox.width * charWidth);
      const y = Math.floor((event.clientY - bbox.top)/bbox.height * charHeight);
      if (x >= 0 && x < charWidth && y >= 0 && y < charHeight) {
        setCharPos({row: y, col: x});
      } else {
        setCharPos(null);
      }
    }
  }, []);

  let onMouseEnter = useCallback(function() {
    setIsActive(true);
  }, []);

  let onMouseLeave = useCallback(function() {
    setIsActive(false);
    setCharPos(null);
  }, []);

  return {
    charPos,
    divProps: {
      ref,
      onMouseMove,
      onMouseEnter,
      onMouseLeave
    }
  };
}

function CharSelectView(props: {
  font: Font;
  canvasScale: {
    scaleX: number, scaleY: number
  };
  colorPalette: Rgb[];
  selected: Coord2;
  backgroundColor: string;
  style: CSSProperties;

  fb: Pixel[][];
  onCharSelected: (pos: Coord2|null) => void;
  setCharset: (charset: Charset) => void;
}) {
  const W = 16
  const H = 16
  const { scaleX, scaleY } = props.canvasScale;

  const { charPos, divProps } = useCharPos(W, H, props.selected);

  let screencode: number|null = utils.charScreencodeFromRowCol(props.font, props.selected);
  if (charPos !== null) {
    screencode = utils.charScreencodeFromRowCol(props.font, charPos);
  }

  let handleOnClick = useCallback(function() {
    props.onCharSelected(charPos);
  }, [charPos]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div className={styles.csContainer} style={props.style}>
        <div
          style={{
            imageRendering: 'pixelated',
            transform: `scale(${scaleX}, ${scaleY})`,
            transformOrigin: '0% 0%',
            width: W*9,
            height: H*9
          }}
          {...divProps}
          onClick={handleOnClick}
        >
          <CharGrid
            width={W}
            height={H}
            backgroundColor={props.backgroundColor}
            grid={true}
            framebuf={props.fb}
            font={props.font}
            colorPalette={props.colorPalette}
          />
          {charPos !== null ?
            <CharPosOverlay
              framebufWidth={W}
              framebufHeight={H}
              grid={true}
              opacity={0.5}
              charPos={charPos!}
            />
            : null}
          {props.selected ?
            <CharPosOverlay
              framebufWidth={W}
              framebufHeight={H}
              grid={true}
              opacity={1.0}
              charPos={props.selected} />
            : null}
        </div>
      </div>

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
          currentCharset={props.font.charset}
          setCharset={props.setCharset}
        />
      </div>
    </div>
  )
}

class CharSelect extends Component<CharSelectProps> {

  fb: Pixel[][]|null = null;
  font: Font|null = null;
  prevTextColor = -1;

  constructor (props: CharSelectProps) {
    super(props)
    this.computeCachedFb(0)
  }

  computeCachedFb(textColor: number) {
    const { font } = this.props
    this.fb = fp.mkArray(16, y => {
      return fp.mkArray(16, x => {
        return {
          code: utils.charScreencodeFromRowCol(font, {row:y, col:x})!,
          color: textColor
        }
      })
    })
    this.prevTextColor = textColor
    this.font = font
  }

  handleClick = (charPos: Coord2 | null) => {
    this.props.Toolbar.setCurrentChar(charPos)
  }

  render () {
    const { colorPalette } = this.props
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
    if (!this.fb) {
      throw new Error('FB cannot be null here');
    }
    return (
      <CharSelectView
        canvasScale={this.props.canvasScale}
        backgroundColor={backg}
        style={s}
        fb={this.fb}
        font={this.props.font}
        colorPalette={colorPalette}
        selected={this.props.selected!}
        onCharSelected={this.handleClick}
        setCharset={this.props.Framebuffer.setCharset}
      />
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

