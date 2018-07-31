import React, { Component } from 'react';
import { connect } from 'react-redux'

import Modal from '../components/Modal'
import {
  Toolbar
} from '../redux/toolbar'

import styles from './Settings.css'

class Settings_ extends Component {

  handleOK = () => {
    this.props.Toolbar.setShowSettings(false)
  }

  handleCancel = () => {
    this.props.Toolbar.setShowSettings(false)
  }

  render () {
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
              <h3>Preferences</h3>
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
      showSettings: state.toolbar.showSettings
    }
  },
  (dispatch) => {
    return {
      Toolbar: Toolbar.bindDispatch(dispatch)
    }
  }
)(Settings_)
