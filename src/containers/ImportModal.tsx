import React, { Component, StatelessComponent as SFC, CSSProperties } from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux';
import memoize  from 'fast-memoize'
import { PNG } from 'pngjs'
import classnames from 'classnames'
import Modal from '../components/Modal'

import * as toolbar from '../redux/toolbar'
import * as ReduxRoot from '../redux/root'

import {
  getSettingsCurrentColorPalette
} from '../redux/settingsSelectors'

//import * as utils from '../utils'
import { FileFormat, RootState, Pixel, Rgb, Font, Framebuf, Charset } from '../redux/types';
import CharGrid from '../components/CharGrid';
import { getFontBits } from '../redux/selectors';
import { dialogReadFile, colorIndexToCssRgb } from '../utils';

import * as png2pet from '../utils/importers/png2petscii'
import { DEFAULT_BACKGROUND_COLOR, DEFAULT_BORDER_COLOR } from '../redux/editor';
import styles from './ImportModal.module.css'

const ModalTitle: SFC<{}> = ({children}) => <h2>{children}</h2>
const Title: SFC<{}> = ({children}) => <h4>{children}</h4>
const Error: SFC<{ msg: string }> = ({ msg }) => <div className={classnames(styles.error, styles.title)}>Error: <span className={classnames(styles.error, styles.msg)}>{msg}</span></div>

interface PngPreviewProps {
  colorPalette: Rgb[];
  font: Font;
  framebuf: Pixel[][];
  backgroundColor: number;
  borderColor: number;
  width: number;  // PETSCII width in chars
  height: number; // PETSCII height in chars
}

function convertScreencodes(
  width: number,
  height: number,
  screencodes: Uint8Array,
  colors: (number|undefined)[]
): Pixel[][] {
  const dst = Array(height);
  for (let y = 0; y < height; y++) {
    const row = Array(width);
    for (let x = 0; x < width; x++) {
      const code = screencodes[y*width + x];
      const color = colors[y*width + x];
      row[x] = { code, color: color == undefined ? DEFAULT_BACKGROUND_COLOR : color };
    }
    dst[y] = row;
  }
  return dst;
}

class PngPreview extends Component<PngPreviewProps> {
  render () {
    const { width, height, backgroundColor } = this.props;
    const scaleX = 1.0;
    const scaleY = 1.0;
    const scale: CSSProperties = {
      width: width*8,
      height: height*8,
      transform: `scale(${scaleX},${scaleY})`,
      transformOrigin: '0% 0%',
      imageRendering: 'pixelated'
    }
    return (
      <div style={{height:'100%'}}>
        <Title>Preview</Title>
        <div style={scale}>
          <CharGrid
            width={width}
            height={height}
            srcX={0}
            srcY={0}
            grid={false}
            font={this.props.font}
            backgroundColor={colorIndexToCssRgb(this.props.colorPalette, backgroundColor)}
            colorPalette={this.props.colorPalette}
            framebuf={this.props.framebuf}
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
  importFramebufsAppend: (framebufs: Framebuf[]) => void;
}

interface ImportModalState {
  preview?: {
    framebuf: Pixel[][];
    width: number;
    height: number;
    backgroundColor: number;
    borderColor: number;
    charset: Charset
  }
  error?: string;
}

function toFramebuf(fb: ImportModalState['preview']): Framebuf {
  const f = fb!;
  return {
    framebuf: f.framebuf,
    width: f.width,
    height: f.height,
    backgroundColor: f.backgroundColor,
    borderColor: f.borderColor,
    charset: f.charset
  };
}

class ImportModal_ extends Component<ImportModalProps & ImportModalDispatch, ImportModalState> {

  state: ImportModalState = {
  };

  handleOK = () => {
    //const { showImport } = this.props;
    this.props.Toolbar.setShowImport({show:false});
    if (this.state.preview) {
      this.props.importFramebufsAppend([toFramebuf(this.state.preview)]);
    }
  }

  handleCancel = () => {
    this.props.Toolbar.setShowImport({show:false})
  }

  handleSelectPng = () => {
    dialogReadFile(this.props.showImport.fmt!, (data) => {
      // TODO could use webworkers for converting to PETSCII if the
      // conversion is slow.
      // TODO call PETSCII conversion, set to state
      var png = PNG.sync.read(Buffer.from(data));
      console.log(JSON.stringify(png.data));
      console.log(png, png.data.length);
      const petscii = png2pet.png2petscii({
        width: png.width,
        height: png.height,
        data: png.data,
        rgbPalette: this.props.colorPalette,
        fontBits: Buffer.from(this.props.font.bits)
      });
      if (png2pet.isError(petscii)) {
        this.setState({ error: petscii.error, preview: undefined });
      } else {
        const { width, height, matches, borderColor } = petscii;
        const match = matches[0];
        this.setState({
          error: undefined,
          preview: {
            width,
            height,
            backgroundColor: match.backgroundColor,
            borderColor: borderColor != undefined ? borderColor : DEFAULT_BORDER_COLOR,
            framebuf: convertScreencodes(width, height, match.screencodes, match.colors),
            charset: 'upper' // TODO add modal option for this
          }
        });
      }
    });
  }

  render () {
    const { showImport } = this.props
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

              {this.state.preview &&
                <PngPreview
                  colorPalette={this.props.colorPalette}
                  font={this.props.font}
                  {...this.state.preview}
                />}
              {this.state.error && <Error msg={this.state.error} />}
              <br/>
              <button className='primary' onClick={this.handleSelectPng}>Choose PNG...</button>
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
      importFramebufsAppend: bindActionCreators(ReduxRoot.actions.importFramebufsAppend, dispatch)
    }
  }
)(ImportModal_)
