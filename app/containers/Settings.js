import React, { Component, Fragment } from 'react';
import { connect } from 'react-redux'

import Modal from '../components/Modal'
import { Toolbar } from '../redux/toolbar'
import { Settings } from '../redux/settings'

import * as selectors from '../redux/selectors'

import {
  ColorPalette,
  SortableColorPalette
} from '../components/ColorPicker'

import styles from './Settings.css'

const Title = ({children}) => <h4>{children}</h4>

const CustomPalette = ({idx, palette, setPalette}) => {
  return (
    <Fragment>
      <Title>Custom Palette {idx}:</Title>
      <SortableColorPalette
        palette={palette}
        setPalette={p => setPalette(idx, p)}
      />
    </Fragment>
  )
}

class Settings_ extends Component {
  handleOK = () => {
    this.props.Toolbar.setShowSettings(false)
    this.props.Settings.saveEdits()
  }

  handleCancel = () => {
    this.props.Toolbar.setShowSettings(false)
    this.props.Settings.cancelEdits()
  }

  render () {
    const setPalette = (idx, v) => {
      this.props.Settings.setPalette('editing', idx, v)
    }
    return (
      <div>
        <Modal showModal={this.props.showSettings}>
          <div style={{
            display: 'flex',
            height: '100%',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>

            <div>
              <h2>Preferences</h2>
              <Title>Default C64 palette (0-15):</Title>
              <ColorPalette />
              <CustomPalette idx={1} palette={this.props.palette0} setPalette={setPalette} />
              <CustomPalette idx={2} palette={this.props.palette1} setPalette={setPalette} />
              <CustomPalette idx={3} palette={this.props.palette2} setPalette={setPalette} />
            </div>

            <div style={{alignSelf: 'flex-end'}}>
              <button className='primary' onClick={this.handleOK}>OK</button>
              <button className='cancel' onClick={this.handleCancel}>Cancel</button>
            </div>
          </div>

        </Modal>
      </div>
    )
  }
}

export default connect(
  (state) => {
    return {
      showSettings: state.toolbar.showSettings,
      palette0: selectors.getSettingsEditing(state).palettes[1],
      palette1: selectors.getSettingsEditing(state).palettes[2],
      palette2: selectors.getSettingsEditing(state).palettes[3]
    }
  },
  (dispatch) => {
    return {
      Toolbar: Toolbar.bindDispatch(dispatch),
      Settings: Settings.bindDispatch(dispatch)
    }
  }
)(Settings_)
