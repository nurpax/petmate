import React, {
  Component,
  Fragment,
  StatelessComponent as SFC,
  MouseEvent
} from 'react';
import { connect } from 'react-redux'

import Modal from '../components/Modal'
import { CheckboxInput } from '../components/formHelpers'
import { RootState, Rgb, PaletteName, EditBranch } from '../redux/types'
import { Toolbar } from '../redux/toolbar'
import * as settings from '../redux/settings'

import * as selectors from '../redux/settingsSelectors'
// TODO ts need utils/index to be .ts
import * as utils from '../utils/palette'

import {
  ColorPalette,
  SortableColorPalette
} from '../components/ColorPicker'
import { bindActionCreators } from 'redux';

const ModalTitle: SFC<{}> = ({children}) => <h2>{children}</h2>
const Title3: SFC<{}> = ({children}) => <h3>{children}</h3>
const Title: SFC<{}> = ({children}) => <h4>{children}</h4>

interface CustomPaletteProps {
  idx: number;
  palette: number[];
  setPalette: (paletteIdx: number, order: number[]) => void;
  colorPalette: Rgb[];
}

const CustomPalette: SFC<CustomPaletteProps> = ({
  idx, palette, setPalette, colorPalette
}) => {
  return (
    <Fragment>
      <Title>Custom Palette {idx}:</Title>
      <SortableColorPalette
        palette={palette}
        setPalette={(p: number[]) => setPalette(idx, p)}
        colorPalette={colorPalette}
      />
    </Fragment>
  )
}

interface PaletteOptionProps {
  onClick: (e: MouseEvent<HTMLElement>) => void;
  selected: boolean;
  label: string;
  colorPalette: Rgb[];
}

const PaletteOption: SFC<PaletteOptionProps> = (props: PaletteOptionProps) => {
  return (
    <div
      onClick={props.onClick}
      style={{
        cursor: 'default',
        backgroundColor: 'rgb(40,40,40)',
        width:'95%',
        marginTop: '10px',
        padding: '7px 7px 7px 7px',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderStyle: 'solid',
        borderColor: props.selected ? 'rgba(255,255,255, 0.6)' : 'rgba(0,0,0,0)',
        borderWidth: '1px',
      }}>
      <div style={{width: '90px'}}>{props.label}</div>
      <ColorPalette colorPalette={props.colorPalette} />
    </div>
  )
}

interface ColorPaletteSelectorProps {
  colorPalette: Rgb[];
  selectedColorPaletteName: PaletteName;
  setSelectedColorPaletteName: (args: { branch: EditBranch, name: PaletteName}) => void;
};

class ColorPaletteSelector extends Component<ColorPaletteSelectorProps> {
  handleClick = (_e: MouseEvent<Element>, name: PaletteName) => {
    this.props.setSelectedColorPaletteName({
      branch: 'editing',
      name
    })
  }

  render () {
    const opts: PaletteName[] = [
      'petmate',
      'colodore',
      'pepto',
      'vice'
    ]
    const { selectedColorPaletteName } = this.props
    return (
      <Fragment>
        <Title3>Select C64 color palette:</Title3>
        {opts.map(desc => {
          return (
            <PaletteOption
              key={desc}
              label={desc}
              selected={selectedColorPaletteName === desc}
              colorPalette={utils.colorPalettes[desc]}
              onClick={(e: MouseEvent<Element>) => this.handleClick(e, desc)}
            />
          )
        })}
      </Fragment>
    )
  }
}

interface SettingsStateProps {
  showSettings: boolean;
  palette0: number[];
  palette1: number[];
  palette2: number[];
  colorPalette: Rgb[];
  selectedColorPaletteName: PaletteName;
  integerScale: boolean;
};

interface SettingsDispatchProps  {
  Settings: settings.PropsFromDispatch;
  Toolbar: any;  // TODO ts
}

class Settings_ extends Component<SettingsStateProps & SettingsDispatchProps> {
  handleOK = () => {
    this.props.Toolbar.setShowSettings(false)
    this.props.Settings.saveEdits()
  }

  handleCancel = () => {
    this.props.Toolbar.setShowSettings(false)
    this.props.Settings.cancelEdits()
  }

  handleIntegerScale = (e: any) => {
    this.props.Settings.setIntegerScale({
      branch: 'editing',
      scale: e.target.checked
    });
  }

  render () {
    const { colorPalette, selectedColorPaletteName } = this.props
    const setPalette = (idx: number, v: number[]) => {
      this.props.Settings.setPalette({
        branch: 'editing',
        idx,
        palette: v
      })
    }
    return (
      <div>
        <Modal showModal={this.props.showSettings}>
          <div style={{
            display: 'flex',
            height: '100%',
            flexDirection: 'column',
            justifyContent: 'space-between',
            overflowY: 'auto'
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

              <Title3>View</Title3>
              <div style={{marginTop: '9px'}}>
                <CheckboxInput
                  label='Snap window scale to integers to keep 1x1 pixels.'
                  checked={this.props.integerScale}
                  onChange={this.handleIntegerScale}
                />
              </div>
              <br/>
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
  (state: RootState) => {
    const { getSettingsEditing, getSettingsEditingCurrentColorPalette } = selectors;
    return {
      showSettings: state.toolbar.showSettings,
      palette0: getSettingsEditing(state).palettes[1],
      palette1: getSettingsEditing(state).palettes[2],
      palette2: getSettingsEditing(state).palettes[3],
      colorPalette: getSettingsEditingCurrentColorPalette(state),
      selectedColorPaletteName: getSettingsEditing(state).selectedColorPalette,
      integerScale: getSettingsEditing(state).integerScale
    }
  },
  (dispatch) => {
    return {
      Toolbar: Toolbar.bindDispatch(dispatch),
      Settings: bindActionCreators(settings.actions, dispatch)
    }
  }
)(Settings_)
