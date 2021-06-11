import React, { Component, StatelessComponent as SFC, CSSProperties } from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux';
import memoize  from 'fast-memoize'
import { PNG } from 'pngjs'
import classnames from 'classnames'
import Modal from '../components/Modal'

import * as toolbar from '../redux/toolbar'
import * as ReduxRoot from '../redux/root'

import { FileFormat, RootState, Pixel, Rgb, Framebuf } from '../redux/types';
import CharGrid from '../components/CharGrid';
import FontSelector from '../components/FontSelector';
import { getROMFontBits } from '../redux/selectors';
import { dialogReadFile, colorIndexToCssRgb, colorPalettes } from '../utils';

import * as png2pet from '../utils/importers/png2petscii'
import { DEFAULT_BACKGROUND_COLOR, DEFAULT_BORDER_COLOR } from '../redux/editor';
import { getSettingsCurrentColorPalette } from '../redux/settingsSelectors';
import ColorPicker from '../components/ColorPicker';

import styles from './ImportModal.module.css'

const ModalTitle: SFC<{}> = ({children}) => <h2>{children}</h2>
const Title: SFC<{}> = ({children}) => <h4>{children}</h4>
const ErrorMsg: SFC<{ msg: string }> = ({ msg }) => <div className={classnames(styles.error, styles.title)}>Error: <span className={classnames(styles.error, styles.msg)}>{msg}</span></div>
const Text: SFC<{}> = ({children}) => <div className={styles.text}>{children}</div>

const getROMFontBitsMemoized = memoize(getROMFontBits);
const petsciifyMemoized = memoize(petsciify);

interface PngPreviewProps {
  currentColorPalette: Rgb[];
  framebuf: Pixel[][];
  backgroundColor: number;
  borderColor: number;
  width: number;  // PETSCII width in chars
  height: number; // PETSCII height in chars
  charset: string;
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
      imageRendering: 'pixelated',
      borderColor: colorIndexToCssRgb(this.props.currentColorPalette, this.props.borderColor),
      borderWidth: '10px',
      borderStyle: 'solid',
    }
    const font = getROMFontBitsMemoized(this.props.charset);
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
            font={font}
            backgroundColor={colorIndexToCssRgb(this.props.currentColorPalette, backgroundColor)}
            colorPalette={this.props.currentColorPalette}
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
  currentColorPalette: Rgb[];
  colorPalettes: Rgb[][];
};

interface ImportModalDispatch {
  Toolbar: toolbar.PropsFromDispatch;
  importFramebufsAppend: (framebufs: Framebuf[]) => void;
}


interface ImportModalState {
  charset: string;
  png?: PNG;
  selectedBackgroundColor?: number;
}

function findMatchByBackgroundColor(
  matches: png2pet.Match[],
  backgroundColor: number | undefined
) {
  if (backgroundColor == undefined) {
    return matches[0];
  }
  for (let idx in matches) {
    if (matches[idx].backgroundColor == backgroundColor) {
      return matches[idx];
    }
  }
  throw new Error('impossible');
}

function toFramebuf(
  petscii: png2pet.Result,
  selectedBackgroundColor: number | undefined,
  charset: string
): Framebuf {
  const { width, height, matches, borderColor } = petscii;
  const match = findMatchByBackgroundColor(matches, selectedBackgroundColor);
  const f = petscii!;
  return {
    framebuf: convertScreencodes(width, height, match.screencodes, match.colors),
    width: f.width,
    height: f.height,
    backgroundColor: match.backgroundColor,
    borderColor: borderColor != undefined ? borderColor : DEFAULT_BORDER_COLOR,
    charset
  };
}

function petsciify(png: PNG|undefined, colorPalettes: Rgb[][], charset: string) {
  if (!png) {
    return undefined;
  }
  const petscii = png2pet.png2petscii({
    width: png.width,
    height: png.height,
    data: png.data,
    rgbPalettes: colorPalettes,
    fontBits: Buffer.from(getROMFontBitsMemoized(charset).bits)
  });
  return petscii;
}

class ImportModal_ extends Component<ImportModalProps & ImportModalDispatch, ImportModalState> {

  state: ImportModalState = {
    charset: 'upper',
    selectedBackgroundColor: undefined
  };

  setPNG = (png?: PNG) => {
    this.setState({
      png,
      charset: 'upper',
      selectedBackgroundColor: undefined
    });
  }

  handleOK = () => {
    this.props.Toolbar.setShowImport({show:false});
    const petscii = petsciifyMemoized(this.state.png, this.props.colorPalettes, this.state.charset);
    if (petscii != undefined && !png2pet.isError(petscii)) {
      this.props.importFramebufsAppend([toFramebuf(petscii, this.state.selectedBackgroundColor, this.state.charset)]);
    }
    this.setPNG();
  }

  handleCancel = () => {
    this.props.Toolbar.setShowImport({show:false})
    this.setPNG();
  }

  handleSetCharset = (c: string) => {
    this.setState({ charset: c });
  }

  handleSelectPng = () => {
    dialogReadFile(this.props.showImport.fmt!, (data) => {
      this.setPNG(PNG.sync.read(Buffer.from(data)));
    });
  }

  handleSelectBackgroundColor = (color: number) => {
    this.setState({selectedBackgroundColor: color});
  }

  render () {
    const { showImport } = this.props;
    const petscii = petsciifyMemoized(this.state.png, this.props.colorPalettes, this.state.charset);
    const matchedBackgroundColors = petscii && !png2pet.isError(petscii) ?
      petscii.matches.map((m) => m.backgroundColor) : [];
    const selectedBackground = petscii && !png2pet.isError(petscii) ?
      (this.state.selectedBackgroundColor == undefined ?
        matchedBackgroundColors[0] : this.state.selectedBackgroundColor) :
      0;
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

              {petscii && !png2pet.isError(petscii) &&
                <div>
                  <PngPreview
                    {...toFramebuf(petscii, this.state.selectedBackgroundColor, this.state.charset)}
                    currentColorPalette={this.props.currentColorPalette}
                    charset={this.state.charset}
                  />
                  {matchedBackgroundColors.length > 1 &&
                    <div>
                      <Text>This image can be converted to any of the following background colors.  Pick one:</Text>
                      <ColorPicker
                        scale={{scaleX:1, scaleY:1}}
                        paletteRemap={matchedBackgroundColors}
                        colorPalette={this.props.currentColorPalette}
                        selected={selectedBackground}
                        twoRows={false}
                        onSelectColor={this.handleSelectBackgroundColor}
                      />
                    </div>
                  }
                </div>}
              {petscii && png2pet.isError(petscii) && <ErrorMsg msg={petscii.error} />}
              {this.state.png &&
                <div style={{marginTop: '5px', marginBottom: '5px' }}>
                  <FontSelector
                    currentCharset={this.state.charset}
                    customFonts={[]}
                    setCharset={this.handleSetCharset} />
                </div>}
              <button className='secondary' onClick={this.handleSelectPng}>Select File...</button>
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

const getAllRgbPalettes = memoize(function (): Rgb[][] {
  return Object.values(colorPalettes);
});

export default connect(
  (state: RootState) => {
    return {
      showImport: state.toolbar.showImport,
      currentColorPalette: getSettingsCurrentColorPalette(state),
      colorPalettes: getAllRgbPalettes()
    }
  },
  (dispatch) => {
    return {
      Toolbar: bindActionCreators(toolbar.Toolbar.actions, dispatch),
      importFramebufsAppend: bindActionCreators(ReduxRoot.actions.importFramebufsAppend, dispatch)
    }
  }
)(ImportModal_)
