
import React, { Component, Fragment, ReactNode } from 'react';
import { connect } from 'react-redux'
import { Dispatch } from 'redux'

import Toolbar from './Toolbar'
import FramebufferTabs from './FramebufferTabs'
import Settings from './Settings'
import CustomFontsModal from './CustomFontsModal';
import ExportModal from './ExportModal'
import ImportModal from './ImportModal'
import Editor from './Editor';
import FileDrop from './FileDrop'

import * as reduxToolbar from '../redux/toolbar'
import { loadWorkspaceNoDialog } from '../utils'

import s from './App.module.css'

interface Dims {
  width: number;
  height: number;
}

interface DivSizeProps {
  className: string;
  render: (props: Dims) => ReactNode;
}

interface DivSizeState {
  containerSize: Dims | null;
}

class DivSize extends Component<DivSizeProps, DivSizeState> {

  private ref = React.createRef<HTMLDivElement>();
  private ro: ResizeObserver | null = null;
  state = {
    containerSize: null
  };

  constructor (props: DivSizeProps) {
    super(props)

    this.ro = new ResizeObserver((entries: ResizeObserverEntry[]) => {
      const e = entries[0]
      this.setState({
        containerSize: {
          width: e.contentRect.width,
          height: e.contentRect.height
        }
      })
    })
  }

  componentDidMount () {
    if (this.ro && this.ref.current) {
      this.ro.observe(this.ref.current)
    }
  }

  componentWillUnmount () {
    if (this.ro && this.ref.current) {
      this.ro.unobserve(this.ref.current);
    }
  }


  render () {
    return (
      <div
        className={this.props.className}
        ref={this.ref}
      >
        {this.props.render(this.state.containerSize!)}
      </div>
    )
  }
}

interface AppViewProps {
  Toolbar: reduxToolbar.PropsFromDispatch;
  dispatch: Dispatch
}

class AppView extends Component<AppViewProps> {

  componentDidMount() {
    document.addEventListener('keydown', this.handleKeyDown);
    document.addEventListener('keyup', this.handleKeyUp);
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.handleKeyDown);
    document.removeEventListener('keyup', this.handleKeyUp);
  }

  handleKeyDown = (event: KeyboardEvent) => {
    this.props.Toolbar.keyDown(event.key)
  }

  handleKeyUp = (event: KeyboardEvent) => {
    this.props.Toolbar.keyUp(event.key)
  }

  handleLoadPetmate = (filename: string) => {
    const { dispatch } = this.props;
    loadWorkspaceNoDialog(dispatch, filename);
  }

  render() {
    return (
      <Fragment>
        <FileDrop
          className={s.appGrid}
          loadDroppedFile={this.handleLoadPetmate}
        >
          <div className={s.topmenu}>
            <FramebufferTabs />
          </div>
          <div className={s.leftmenubar}>
            <Toolbar />
          </div>
          <DivSize
            className={s.editor}
            render={(containerSize: Dims) => <Editor containerSize={containerSize} />}
          />
        </FileDrop>
        <Settings />
        <CustomFontsModal />
        <ExportModal />
        <ImportModal />
      </Fragment>
    )
  }
}

export default connect(
  null,
  dispatch => {
    return {
      Toolbar: reduxToolbar.Toolbar.bindDispatch(dispatch),
      dispatch
    }
  })(AppView)
