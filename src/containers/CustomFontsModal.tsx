import React, {
  Component,
  StatelessComponent as SFC
} from 'react';
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux';

import { electron, fs } from '../utils/electronImports'
import Modal from '../components/Modal';
import { RootState, Font } from '../redux/types';
import { Toolbar } from '../redux/toolbar';
import * as customFonts from '../redux/customFonts';
import * as selectors from '../redux/selectors';

const ModalTitle: SFC<{}> = ({children}) => <h2>{children}</h2>
const Title4: SFC<{}> = ({children}) => <h4>{children}</h4>

function loadFont(filename: string): Font {
  const charOrder = [];

  const bb = fs.readFileSync(filename);
  const bits = bb.slice(2, 2048+2);

  for (let i = 0; i < 256; i++) {
    charOrder.push(i);
  }
  return { bits, charOrder };
}

export function openFileDialog() {
  const { dialog } = electron.remote;
  const window = electron.remote.getCurrentWindow();
  const filters = [
    { name: 'C64 font file', extensions: ['64c'] },
  ]
  const filename = dialog.showOpenDialog(window, { properties: ['openFile'], filters })
  if (filename === undefined || filename.length !== 1) {
    return undefined;
  }
  return filename[0];
}

interface CustomFontProps {
  name?: string;
  onLoadFont: (slotname: string|undefined, filename: string) => void;
}

class CustomFont extends Component<CustomFontProps> {
  handleLoadFont = () => {
    const filename = openFileDialog();
    if (filename !== undefined) {
      this.props.onLoadFont(this.props.name, filename);
    }
  }

  render () {
    if (this.props.name !== undefined) {
      return (
        <div style={{display: 'flex'}}>
          <div style={{minWidth: '100px'}}>{this.props.name}</div>
          <button className='secondary' onClick={() => this.handleLoadFont()}>Set Font...</button>
        </div>
      )
    } else {
      return (
        <div style={{display: 'flex'}}>
          <div style={{minWidth: '100px'}}>&nbsp;</div>
          <button className='secondary' onClick={() => this.handleLoadFont()}>New Custom Font...</button>
        </div>
      )
    }
  }
}

interface CustomFontsStateProps {
  showCustomFonts: boolean;
  customFonts: {[name: string]: Font };
};

interface CustomFontsDispatchProps  {
  CustomFonts: customFonts.PropsFromDispatch;
  Toolbar: any;
}

class CustomFontsModal_ extends Component<CustomFontsStateProps & CustomFontsDispatchProps> {
  handleOK = () => {
    this.props.Toolbar.setShowCustomFonts(false)
  }

  handleCancel = () => {
    this.props.Toolbar.setShowCustomFonts(false)
  }

  handleLoadFont = (customFontName: string | undefined, filename: string) => {
    const font = loadFont(filename);
    const slotname = customFontName === undefined ? `custom_${Object.entries(this.props.customFonts).length+1}` : customFontName;
    this.props.CustomFonts.addCustomFont(slotname, font);
  }

  render () {
    const fonts = Object.entries(this.props.customFonts).map(([name, _font]) => {
      return { name };
    });
    return (
      <div>
        <Modal showModal={this.props.showCustomFonts}>
          <div style={{
            display: 'flex',
            height: '100%',
            flexDirection: 'column',
            justifyContent: 'space-between',
            overflowY: 'auto'
          }}>

            <div>
              <ModalTitle>Custom Fonts</ModalTitle>

              <Title4>Load custom fonts</Title4>
              <br/>
              <div>
                {fonts.map(({ name }) => <CustomFont key={name} name={name} onLoadFont={this.handleLoadFont} />)}
                <CustomFont onLoadFont={this.handleLoadFont} />
              </div>
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
    return {
      showCustomFonts: state.toolbar.showCustomFonts,
      customFonts: selectors.getCustomFonts(state)
    }
  },
  (dispatch) => {
    return {
      Toolbar: Toolbar.bindDispatch(dispatch),
      CustomFonts: bindActionCreators(customFonts.actions, dispatch)
    }
  }
)(CustomFontsModal_)
