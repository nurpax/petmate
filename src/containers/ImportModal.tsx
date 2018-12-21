import React, { Component, StatelessComponent as SFC, CSSProperties } from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux';
import memoize  from 'fast-memoize'

import Modal from '../components/Modal'

import * as toolbar from '../redux/toolbar'
import * as ReduxRoot from '../redux/root'

import {
  getSettingsCurrentColorPalette
} from '../redux/settingsSelectors'

//import * as utils from '../utils'
import { FileFormat, RootState, Pixel, Rgb, Font } from '../redux/types';
import CharGrid from '../components/CharGrid';
import { getFontBits } from '../redux/selectors';
import { dialogReadFile } from '../utils';

const ModalTitle: SFC<{}> = ({children}) => <h2>{children}</h2>
const Title: SFC<{}> = ({children}) => <h4>{children}</h4>

interface PngPreviewProps {
  colorPalette: Rgb[];
  font: Font;
}

class PngPreview extends Component<PngPreviewProps> {
  render () {
    const fb: Pixel[][] = [
      [{code:0, color: 1}, {code:1, color: 2}
      ]
    ]
    const w = 2;
    const h = 1;
    const scaleX = 1.0;
    const scaleY = 1.0;
    const scale: CSSProperties = {
      width: w*8,
      height: h*8,
      transform: `scale(${scaleX},${scaleY})`,
      transformOrigin: '0% 0%',
      imageRendering: 'pixelated'
    }
    return (
      <div style={{height:'100%'}}>
        <Title>Preview</Title>
        <div style={scale}>
          <CharGrid
            width={w}
            height={h}
            srcX={0}
            srcY={0}
            grid={false}
            font={this.props.font}
            backgroundColor={'#777'}
            colorPalette={this.props.colorPalette}
            framebuf={fb}
          />
        </div>
      </div>
    )
  }
}

interface ImportModalProps {
  showImport: {
    show: boolean;
    fmt?: FileFormat; // undefined if show=false
  };
  colorPalette: Rgb[];
  font: Font;
};

interface ImportModalDispatch {
  Toolbar: toolbar.PropsFromDispatch;
  fileExportAs: (fmt: FileFormat) => void;
}

class ImportModal_ extends Component<ImportModalProps & ImportModalDispatch> {
  handleOK = () => {
    //const { showImport } = this.props;
    this.props.Toolbar.setShowImport({show:false});
    // TODO import append here based on what settings were
    // set in the modal
    //this.props.fileExportAs(amendedFmt as FileFormat);
  }

  handleCancel = () => {
    this.props.Toolbar.setShowImport({show:false})
  }

  handleSelectPng = () => {
    dialogReadFile(this.props.showImport.fmt!, (pngContents) => {
      console.log(pngContents.length);
    });
  }

  render () {
    const { showImport } = this.props
//    const exportType = showImport.show ? showImport.fmt : undefined
//    const _exportExt = exportType !== undefined ? exportType.ext : null
    return (
      <div>
        <Modal showModal={showImport.show}>
          <div style={{
            display: 'flex',
            height: '100%',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div>
              <ModalTitle>PNG Import Options</ModalTitle>

              <PngPreview
                colorPalette={this.props.colorPalette}
                font={this.props.font}
              />

              <button className='primary' onClick={this.handleSelectPng}>Load .png</button>
            </div>

            <div style={{alignSelf: 'flex-end'}}>
              <button className='cancel' onClick={this.handleCancel}>Cancel</button>
              <button className='primary' onClick={this.handleOK}>Import</button>
            </div>
          </div>

        </Modal>
      </div>
    )
  }
}

const getFontBitsMemoized = memoize(getFontBits);

export default connect(
  (state: RootState) => {
    return {
      showImport: state.toolbar.showImport,
      colorPalette: getSettingsCurrentColorPalette(state),
      font: getFontBitsMemoized('upper')
    }
  },
  (dispatch) => {
    return {
      Toolbar: bindActionCreators(toolbar.Toolbar.actions, dispatch),
      fileExportAs: bindActionCreators(ReduxRoot.actions.fileExportAs, dispatch)
    }
  }
)(ImportModal_)
