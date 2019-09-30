import React, { Component, Fragment, StatelessComponent as SFC } from 'react'
import { connect } from 'react-redux'

import Modal from '../components/Modal'
import {
  connectFormState,
  Form,
  Checkbox,
  RadioButton,
  NumberInput
} from '../components/formHelpers'

import * as toolbar from '../redux/toolbar'
import * as ReduxRoot from '../redux/root'

import * as utils from '../utils'
import { FileFormatGif, FileFormatPng, FileFormatSeq, FileFormatAsm, FileFormatBas, FileFormatJson, FileFormat, RootState } from '../redux/types';
import { bindActionCreators } from 'redux';

const ModalTitle: SFC<{}> = ({children}) => <h2>{children}</h2>
const Title: SFC<{}> = ({children}) => <h4>{children}</h4>

interface ExportPropsBase {
  // Set via connectFormStateTyped
  setField: (name: string, value: string) => void;
}

interface GIFExportFormatProps extends ExportPropsBase {
  state: FileFormatGif['exportOptions'];
}

class GIFExportForm extends Component<GIFExportFormatProps> {
  render () {
    let fps: string|null = null
    const delayMS = this.props.state.delayMS
    if (delayMS !== '') {
      const delayInt = parseInt(this.props.state.delayMS, 10)
      if (delayInt !== 0 && !isNaN(delayInt)) {
        const f = 1000.0 / delayInt
        fps = `${f.toFixed(1)} fps`
      }
    }
    const animControls = () => {
      return (
        <Fragment>
          <label>Gif anim mode:</label>
          <br/>
          <br/>
          <RadioButton
            name='loopMode'
            value='once'
            label='Play once, no looping'
          />
          <RadioButton
            name='loopMode'
            value='loop'
            label='Loop'
          />
          <RadioButton
            name='loopMode'
            value='pingpong'
            label='Loop (ping pong)'
          />
          <div style={{display: 'flex', flexDirection: 'row'}}>
            <NumberInput
              name='delayMS'
              value={delayMS}
              label='Frame delay (ms)'
            />
            <label style={{marginLeft: '10px'}}>
             {fps}
            </label>
          </div>
        </Fragment>
      )
    }
    return (
      <Form state={this.props.state} setField={this.props.setField}>
        <Title>GIF export options</Title>
        <br/>
        <Checkbox name='borders' label='Include borders' />
        <br/>
        <label>Gif anim mode:</label>
        <br/>
        <br/>
        <RadioButton
          name='animMode'
          value='single'
          label='Current screen only'
        />
        <RadioButton
          name='animMode'
          value='anim'
          label='Export .gif anim'
        />
        <br/>
        {this.props.state.animMode === 'single' ? null : animControls()}
      </Form>
    )
  }
}

interface PNGExportFormatProps extends ExportPropsBase {
  state: FileFormatPng['exportOptions'];
}

class PNGExportForm extends Component<PNGExportFormatProps> {
  render () {
    return (
      <Form state={this.props.state} setField={this.props.setField}>
        <Title>PNG export options</Title>
        <br/>
        <br/>
        <Checkbox name='alphaPixel' label='Alpha pixel work-around for Twitter' />
        <Checkbox name='doublePixels' label='Double pixels' />
        <Checkbox name='borders' label='Include borders' />
      </Form>
    )
  }
}

interface SEQExportFormatProps extends ExportPropsBase {
  state: FileFormatSeq['exportOptions'];
}

class SEQExportForm extends Component<SEQExportFormatProps> {
  render () {
    return (
      <Form state={this.props.state} setField={this.props.setField}>
        <Title>SEQ export options</Title>
        <br/>
        <br/>
        <Checkbox name='insCR' label='Append Carriage Returns at end of rows'/><span></span>
        <Checkbox name='insClear' label='Insert CLS (0x93) at start of file' />
        <Checkbox name='stripBlanks' label='Optimize sequence' />
      </Form>
    )
  }
}


interface ASMExportFormatProps extends ExportPropsBase {
  state: FileFormatAsm['exportOptions'];
}

class ASMExportForm extends Component<ASMExportFormatProps> {
  render () {
    return (
      <Form state={this.props.state} setField={this.props.setField}>
        <Title>Assembler export options</Title>
        <br/>
        <br/>
        <RadioButton
          name='assembler'
          value='kickass'
          label='KickAssembler'
        />
        <RadioButton
          name='assembler'
          value='acme'
          label='ACME'
        />
        <RadioButton
          name='assembler'
          value='c64tass'
          label='64tass'
        />
        <br/>
        <Checkbox
          name='currentScreenOnly'
          label='Current screen only'
        />
        <Checkbox
          name='standalone'
          label='Make output compilable to a .prg'
        />
      </Form>
    )
  }
}

interface BASICExportFormatProps extends ExportPropsBase {
  state: FileFormatBas['exportOptions'];
}

class BASICExportForm extends Component<BASICExportFormatProps> {
  render () {
    return (
      <Form state={this.props.state} setField={this.props.setField}>
        <Title>BASIC export options</Title>
        <br/>
        <br/>
        <Checkbox
          name='currentScreenOnly'
          label='Current screen only'
        />
        <Checkbox
          name='standalone'
          label='Add BASIC code to display the image'
        />
      </Form>
    )
  }
}

interface JsonExportFormatProps extends ExportPropsBase {
  state: FileFormatJson['exportOptions'];
}

class JsonExportForm extends Component<JsonExportFormatProps> {
  render () {
    return (
      <Form state={this.props.state} setField={this.props.setField}>
        <Title>JSON export options</Title>
        <br/>
        <br/>
        <Checkbox
          name='currentScreenOnly'
          label='Current screen only'
        />
      </Form>
    )
  }
}

interface ExportModalState {
  [key: string]: FileFormat['exportOptions'];
  seq: FileFormatSeq['exportOptions'];
  png: FileFormatPng['exportOptions'];
  asm: FileFormatAsm['exportOptions'];
  bas: FileFormatBas['exportOptions'];
  gif: FileFormatGif['exportOptions'];
  json: FileFormatJson['exportOptions'];
}

// Type to select one format branch from ExportModalState
type State<T extends keyof ExportModalState> = {
  state: ExportModalState[T];
  setState: any; // TODO ts
}

export function connectFormStateTyped<T extends FileFormat['ext']>({state, setState}: State<T>, subtree: T) {
  return connectFormState({state, setState}, subtree);
}

interface ExportFormProps {
  ext: string | null;
  state: ExportModalState;
  setState: any;
}

class ExportForm extends Component<ExportFormProps> {
  render () {
    if (this.props.ext === null) {
      return null
    }
    if (!utils.formats[this.props.ext].exportOptions) {
      return null
    }
    switch (this.props.ext) {
      case 'c':
        return null
      case 'prg':
        return null
      case 'png':
        return (
          <PNGExportForm {...connectFormState(this.props, 'png')} />
        )
      case 'seq':
        return (
          <SEQExportForm {...connectFormState(this.props, 'seq')} />
        )
      case 'asm':
        return (
          <ASMExportForm {...connectFormState(this.props, 'asm')} />
        )
      case 'bas':
        return (
          <BASICExportForm {...connectFormState(this.props, 'bas')} />
        )
      case 'gif':
        return (
          <GIFExportForm {...connectFormState(this.props, 'gif')} />
        )
      case 'json':
        return (
          <JsonExportForm {...connectFormState(this.props, 'json')} />
        )
      default:
        throw new Error(`unknown export format ${this.props.ext}`);
    }
  }
}

interface ExportModalProps {
  showExport: {
    show: boolean;
    fmt?: FileFormat; // undefined if show=false
  };
};

interface ExportModalDispatch {
  Toolbar: toolbar.PropsFromDispatch;
  fileExportAs: (fmt: FileFormat) => void;
}

class ExportModal_ extends Component<ExportModalProps & ExportModalDispatch, ExportModalState> {
  state: ExportModalState = {
    seq: {
      insCR: false,
      insClear: true,
      stripBlanks: false
    },
    png: {
      borders: true,
      alphaPixel: false,
      doublePixels: false
    },
    asm: {
      assembler: 'kickass',
      currentScreenOnly: true,
      standalone: false
    },
    bas: {
      currentScreenOnly: true,
      standalone: false
    },
    gif: {
      borders: true,
      animMode: 'single',
      loopMode: 'loop',
      delayMS: '250'
    },
    json: {
      currentScreenOnly: true
    },
  }

  handleOK = () => {
    const { showExport } = this.props;
    this.props.Toolbar.setShowExport({show:false});
    const fmt = showExport.fmt!;
    const ext = fmt.ext;
    if (fmt.exportOptions == undefined) {
      // We shouldn't be here if there are no export UI options
      return;
    }
    const amendedFmt = {
      ...showExport.fmt,
      exportOptions: {
        ...this.state[ext]
      }
    };
    this.props.fileExportAs(amendedFmt as FileFormat);
  }

  handleCancel = () => {
    this.props.Toolbar.setShowExport({show:false})
  }

  handleSetState = (cb: (s: ExportModalState) => void) => {
    this.setState(prevState => {
      return cb(prevState)
    })
  }

  render () {
    const { showExport } = this.props
    const exportType = showExport.show ? showExport.fmt : undefined
    const exportExt = exportType !== undefined ? exportType.ext : null
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
                state={this.state}
                setState={this.handleSetState}
              />
            </div>

            <div style={{alignSelf: 'flex-end'}}>
              <button className='cancel' onClick={this.handleCancel}>Cancel</button>
              <button className='primary' onClick={this.handleOK}>Export</button>
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
      showExport: state.toolbar.showExport
    }
  },
  (dispatch) => {
    return {
      Toolbar: bindActionCreators(toolbar.Toolbar.actions, dispatch),
      fileExportAs: bindActionCreators(ReduxRoot.actions.fileExportAs, dispatch)
    }
  }
)(ExportModal_)
