import React, { Component, Fragment } from 'react';
import { connect } from 'react-redux'

import Modal from '../components/Modal'
import { Checkbox, RadioButton } from '../components/formHelpers'

import { Toolbar } from '../redux/toolbar'
import { Settings } from '../redux/settings'
import * as ReduxRoot from '../redux/root'

import * as selectors from '../redux/selectors'
import * as utils from '../utils'

const ModalTitle = ({children}) => <h2>{children}</h2>
const Title3 = ({children}) => <h3>{children}</h3>
const Title = ({children}) => <h4>{children}</h4>

class PNGExportForm extends Component {
  handleChangeAlpha = (e) => {
    this.props.setFormState('png', { alphaPixel: e.target.checked })
  }
  handleDoubleSize = (e) => {
    this.props.setFormState('png', { doublePixels: e.target.checked })
  }
  render () {
    return (
      <Fragment>
        <Title>PNG export options</Title>
        <br/>
        <br/>
        <Checkbox
          onChange={this.handleChangeAlpha}
          checked={this.props.png.alphaPixel}
          label='Alpha pixel work-around for Twitter'
        />
        <Checkbox
          onChange={this.handleDoubleSize}
          checked={this.props.png.doublePixels}
          label='Double pixels'
        />
      </Fragment>
    )
  }
}

class ASMExportForm extends Component {
  handleChangeAssembler = (e) => {
    this.props.setFormState('asm', { assembler: e.target.value })
  }
  handleCurrentScreenOnly = (e) => {
    this.props.setFormState('asm', { currentScreenOnly: e.target.checked })
  }
  handleStandalone = (e) => {
    this.props.setFormState('asm', { standalone: e.target.checked })
  }
  render () {
    return (
      <Fragment>
        <Title>Assembler export options</Title>
        <br/>
        <br/>
        <RadioButton
          label='KickAssembler'
          value='kickass'
          onChange={this.handleChangeAssembler}
          checked={this.props.asm.assembler === 'kickass'}
        />
        <RadioButton
          label='ACME'
          value='acme'
          onChange={this.handleChangeAssembler}
          checked={this.props.asm.assembler === 'acme'}
        />
        <br/>
        <Checkbox
          onChange={this.handleCurrentScreenOnly}
          checked={this.props.asm.currentScreenOnly}
          label='Current screen only'
        />
        <Checkbox
          onChange={this.handleStandalone}
          checked={this.props.asm.standalone}
          label='Make output compilable to a .prg'
        />
      </Fragment>
    )
  }
}

/*
*/

class ExportForm extends Component {
  render () {
    if (this.props.ext === null) {
      return null
    }
    switch (this.props.ext) {
      case 'c':
        return null
      case 'prg':
        return null
      case 'png':
        return (
          <PNGExportForm
            setFormState={this.props.setFormState}
            png={this.props.formatState.png}
          />
        )
      case 'asm':
        return (
          <ASMExportForm
            setFormState={this.props.setFormState}
            asm={this.props.formatState.asm}
          />
        )
    }
  }
}

class ExportModal_ extends Component {
  state = {
    png: {
      alphaPixel: false,
      doublePixels: false
    },
    asm: {
      assembler: 'kickass',
      currentScreenOnly: true,
      standalone: false
    },
  }

  handleSetFormState = (subtree, values) => {
    this.setState(state => {
      return {
        [subtree]: {
          ...state[subtree],
          ...values
        }
      }
    })
  }

  handleOK = () => {
    const { showExport } = this.props
    this.props.Toolbar.setShowExport({show:false})
    const ext = showExport.type.ext
    this.props.fileExportAs(showExport.type, this.state[ext])
  }

  handleCancel = () => {
    this.props.Toolbar.setShowExport({show:false})
  }

  render () {
    const { showExport } = this.props
    const exportType = showExport.show ? showExport.type : null
    const exportExt = exportType !== null ? exportType.ext : null
    return (
      <div>
        <Modal showModal={this.props.showExport.show}>
          <div style={{
            display: 'flex',
            height: '100%',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div>
              <ModalTitle>Export Options</ModalTitle>
              <ExportForm
                ext={exportExt}
                formatState={this.state}
                setFormState={this.handleSetFormState}
              />
            </div>

            <div style={{alignSelf: 'flex-end'}}>
              <button className='primary' onClick={this.handleOK}>Export</button>
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
      showExport: state.toolbar.showExport,
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
      Settings: Settings.bindDispatch(dispatch),
      fileExportAs: (fmt, options) => dispatch(ReduxRoot.actions.fileExportAs(fmt, options))
    }
  }
)(ExportModal_)
