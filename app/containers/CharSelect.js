
import React, { Component } from 'react';
import { connect } from 'react-redux'

import { Framebuffer } from '../redux/editor'
import {
  Toolbar,
  TOOL_DRAW,
  TOOL_COLORIZE,
  TOOL_BRUSH
} from '../redux/toolbar'

import CharGrid from '../components/CharGrid'
import CharPosOverlay from '../components/CharPosOverlay'
import { CharSelectStatusbar } from '../components/Statusbar'

import * as utils from '../utils'
import * as fp from '../utils/fp'
import * as selectors from '../redux/selectors'
import { CharPosition } from './hoc'

import styles from './CharSelect.css'
import { charGridScaleStyle }  from './inlineStyles'

class CharSelect extends Component {
  constructor (props) {
    super(props)
    this.computeCachedFb(0)

    this.state = {
      charPos: { row:0, col: 0 },
      isActive: false
    }
  }

  computeCachedFb(textColor) {
    this.fb = fp.mkArray(16, y => {
      return fp.mkArray(16, x => {
        return {
          code: utils.charScreencodeFromRowCol({row:y, col:x}),
          color: textColor
        }
      })
    })
    this.prevTextColor = textColor
  }

  handleClick = () => {
    this.props.Toolbar.setCurrentChar(this.state.charPos)
  }

  handleCharPosChanged = (charPos) => {
    this.setState({ charPos })
  }

  handleActivationChanged = ({isActive}) => {
    this.setState({ isActive })
  }

  render () {
    const W = 16
    const H = 16
    const { colorPalette } = this.props
    // Editor needs to specify a fixed width/height because the contents use
    // relative/absolute positioning and thus seem to break out of the CSS
    // grid.
    const w = `${2*8*16+32}px`
    const h = `${2*8*16+32}px`
    const backg = utils.colorIndexToCssRgb(
      colorPalette, this.props.backgroundColor
    )
    const s = {width: w, height:h}

    if (this.prevTextColor !== this.props.textColor) {
      this.computeCachedFb(this.props.textColor)
    }

    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column'
      }}>
        <CharPosition
          grid={true}
          onCharPosChanged={this.handleCharPosChanged}
          onActivationChanged={this.handleActivationChanged}
        >
          <div className={styles.csContainer} style={s}>
            <div
              style={{
                ...charGridScaleStyle,
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
        <CharSelectStatusbar curScreencode={this.props.curScreencode} />
      </div>
    )
  }
}

const mapDispatchToProps = dispatch => {
  return {
    Toolbar: Toolbar.bindDispatch(dispatch)
  }
}

const mapStateToProps = state => {
  const selected = state.toolbar.selectedChar
  const framebuf = selectors.getCurrentFramebuf(state)
  return {
    backgroundColor: framebuf.backgroundColor,
    selected,
    curScreencode: utils.charScreencodeFromRowCol(selected),
    textColor: state.toolbar.textColor,
    colorPalette: selectors.getSettingsCurrentColorPalette(state)
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(CharSelect)

