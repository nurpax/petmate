import React, {
  Component,
  StatelessComponent as SFC
} from 'react';
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux';

import { electron, fs, path } from '../utils/electronImports'
import Modal from '../components/Modal';
import { RootState, Font } from '../redux/types';
import { Toolbar } from '../redux/toolbar';
import * as customFonts from '../redux/customFonts';
import * as selectors from '../redux/selectors';

const ModalTitle: SFC<{}> = ({children}) => <h2>{children}</h2>
const Title4: SFC<{}> = ({children}) => <h4>{children}</h4>

function loadFont(filename: string): Font {
  const charOrder = [];

  const bb = fs.readFileSync(filename).slice(2, 2048+2);
  const bits = Array(256*8).fill(0);
  for (let i = 0; i < bb.length; i++) {
    bits[i] = bb[i];
  }
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
  id?: string;
  name?: string;
  onLoadFont: (id: string|undefined, filename: string) => void;
}

class CustomFont extends Component<CustomFontProps> {
  handleLoadFont = () => {
    const filename = openFileDialog();
    if (filename !== undefined) {
      this.props.onLoadFont(this.props.id, filename);
    }
  }

  render () {
    const { fontName, buttonText } = this.props.id !== undefined ? {
      fontName: this.props.name,
      buttonText: 'Load .64c..'
    } : {
      fontName: '',
      buttonText: 'New Font from .64c'
    };
    return (
      <div style={{display: 'flex', alignItems: 'center', marginBottom: '5px'}}>
        <button style={{margin:'0px', minWidth: '140px'}} className='secondary' onClick={() => this.handleLoadFont()}>{buttonText}</button>
        {fontName === '' ? null : <div style={{marginLeft: '10px'}}>{fontName}</div>}
      </div>
    );
  }
}

interface CustomFontsStateProps {
  showCustomFonts: boolean;
  customFonts: customFonts.CustomFonts;
};

interface CustomFontsDispatchProps  {
  CustomFonts: customFonts.PropsFromDispatch;
  Toolbar: any;
}

class CustomFontsModal_ extends Component<CustomFontsStateProps & CustomFontsDispatchProps> {
  handleOK = () => {
    this.props.Toolbar.setShowCustomFonts(false)
  }

  handleLoadFont = (customFontId: string | undefined, filename: string) => {
    const font = loadFont(filename);
    const fontId = customFontId === undefined ? `custom_${Object.entries(this.props.customFonts).length+1}` : customFontId;
    const fontName = path.basename(filename, '.64c');
    this.props.CustomFonts.addCustomFont(fontId, fontName, font);
  }

  render () {
    const fonts = Object.entries(this.props.customFonts).map(([id, { name }]) => {
      return { id, name };
    });
    return (
      <div>
        <Modal showModal={this.props.showCustomFonts}>
          <div style={{
            display: 'flex',
            height: '100%',
            flexDirection: 'column',
            justifyContent: 'space-between',
            overflowY: 'auto',
            color: 'var(--main-text-color)'
          }}>

            <div>
              <ModalTitle>Custom Fonts</ModalTitle>

              <Title4>Load custom fonts</Title4>
              <br/>
              <div>
                {fonts.map(({ id, name }) => <CustomFont key={id} id={id} name={name} onLoadFont={this.handleLoadFont} />)}
                <CustomFont onLoadFont={this.handleLoadFont} />
              </div>
            </div>

            <div style={{alignSelf: 'flex-end'}}>
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
