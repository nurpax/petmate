import React, { Component, Fragment } from 'react';
import { connect } from 'react-redux'

import Modal from '../components/Modal'
import { Toolbar } from '../redux/toolbar'
import { Settings } from '../redux/settings'

import * as selectors from '../redux/selectors'
import * as utils from '../utils'

import {
  ColorPalette,
  SortableColorPalette
} from '../components/ColorPicker'

import styles from './Settings.css'

const ModalTitle = ({children}) => <h2>{children}</h2>
const Title3 = ({children}) => <h3>{children}</h3>
const Title = ({children}) => <h4>{children}</h4>

const CustomPalette = ({idx, palette, setPalette, colorPalette}) => {
  return (
    <Fragment>
      <Title>Custom Palette {idx}:</Title>
      <SortableColorPalette
        palette={palette}
        setPalette={p => setPalette(idx, p)}
        colorPalette={colorPalette}
      />
    </Fragment>
  )
}

const PaletteOption = ({ onClick, selected, value, label, colorPalette }) => {
  return (
    <div
      onClick={onClick}
      style={{
        cursor: 'default',
        backgroundColor: 'rgb(40,40,40)',
        marginTop: '10px',
        paddingLeft: '8px',
        paddingTop: '6px',
        paddingBottom: '6px',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        outlineStyle: 'solid',
        outlineColor: selected ? 'rgba(255,255,255, 0.6)' : 'rgba(0,0,0,0)',
        outlineWidth: '1px',
      }}>
      <div style={{width: '90px'}}>{label}</div>
      <ColorPalette colorPalette={colorPalette} />
    </div>
  )
}

class ColorPaletteSelector extends Component {
  handleClick = (e, name) => {
    this.props.setSelectedColorPaletteName('editing', name)
  }

  render () {
    const opts = [
      { value: 'petmate' },
      { value: 'colodore' },
      { value: 'pepto' }
    ]
    const options = opts.map(({value}) => {
      return { value, label: value, colorPalette: utils.colorPalettes[value]}
    })
    const { selectedColorPaletteName } = this.props
    console.log()
    return (
      <Fragment>
        <Title3>Select C64 color palette:</Title3>
        {opts.map(desc => {
          return (
            <PaletteOption
              key={desc.value}
              name={desc.value}
              label={desc.value}
              selected={selectedColorPaletteName === desc.value}
              colorPalette={utils.colorPalettes[desc.value]}
              onClick={(e) => this.handleClick(e, desc.value)}
            />
          )
        })}
      </Fragment>
    )
  }
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
    const { colorPalette, selectedColorPaletteName } = this.props
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
              <ModalTitle>Preferences</ModalTitle>

              <ColorPaletteSelector
                colorPalette={colorPalette}
                selectedColorPaletteName={selectedColorPaletteName}
                setSelectedColorPaletteName={this.props.Settings.setSelectedColorPaletteName}
              />

              <br/>

              <Title3>Customize palette order</Title3>

              <CustomPalette
                idx={1}
                palette={this.props.palette0}
                setPalette={setPalette}
                colorPalette={colorPalette}
              />
              <CustomPalette
                idx={2}
                palette={this.props.palette1}
                setPalette={setPalette}
                colorPalette={colorPalette}
              />
              <CustomPalette
                idx={3}
                palette={this.props.palette2}
                setPalette={setPalette}
                colorPalette={colorPalette}
              />
            </div>

            <div style={{alignSelf: 'flex-end'}}>
              <button className='cancel' onClick={this.handleCancel}>Cancel</button>
              <button className='primary' onClick={this.handleOK}>OK</button>
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
      palette2: selectors.getSettingsEditing(state).palettes[3],
      colorPalette: selectors.getSettingsEditingCurrentColorPalette(state),
      selectedColorPaletteName: selectors.getSettingsEditing(state).selectedColorPalette
    }
  },
  (dispatch) => {
    return {
      Toolbar: Toolbar.bindDispatch(dispatch),
      Settings: Settings.bindDispatch(dispatch)
    }
  }
)(Settings_)
