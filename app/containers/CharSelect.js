
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
import * as utils from '../utils'
import * as selectors from '../redux/selectors'
import { withMouseCharPosition } from './hoc'

import styles from './CharSelect.css'
import { charGridScaleStyle }  from './inlineStyles'

class CharSelect_ extends Component {
  constructor (props) {
    super(props)
    this.computeCachedFb(0)
  }

  computeCachedFb(textColor) {
    this.fb = Array(16).fill({}).map((_, y) => {
      return Array(16).fill({}).map((_, x) => {
        return {
          code: utils.charScreencodeFromRowCol({row:y, col:x}),
          color: textColor
        }
      })
    })
    this.prevTextColor = textColor
  }

  handleClick = () => {
    this.props.Toolbar.setSelectedChar(this.props.charPos)
  }

  render () {
    // Editor needs to specify a fixed width/height because the contents use
    // relative/absolute positioning and thus seem to break out of the CSS
    // grid.
    const w = `${2*8*16+16}px`
    const h = `${2*8*16+16}px`
    const backg = utils.colorIndexToCssRgb(this.props.backgroundColor)
    const s = {width: w, height:h}

    if (this.prevTextColor !== this.props.textColor) {
      this.computeCachedFb(this.props.textColor)
    }

    return (
      <div className={styles.csContainer} style={s}>
        <div
          style={charGridScaleStyle}
          onClick={this.handleClick}
        >
          <CharGrid
            width={16}
            height={16}
            backgroundColor={backg}
            grid={true}
            framebuf={this.fb}
            selected={this.props.selected}
          />
        </div>
      </div>
    )
  }
}

const CharSelect = withMouseCharPosition(CharSelect_, {
  grid: true
})

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
    textColor: state.toolbar.textColor
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(CharSelect)

