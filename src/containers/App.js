
import React, { Component, Fragment } from 'react';
import { connect } from 'react-redux'
import ResizeObserver from 'resize-observer-polyfill'

import Toolbar from './Toolbar'
import FramebufferTabs from './FramebufferTabs'
import Settings from './Settings'
import ExportModal from './ExportModal'
import Editor from './Editor';
import FileDrop from './FileDrop'

import * as reduxToolbar from '../redux/toolbar'
import { loadWorkspaceNoDialog } from '../utils'

import s from './App.module.css'

class DivSize extends Component {
  constructor (props) {
    super(props)
    this.ref = React.createRef()

    this.state = {
      containerSize: null
    }

    this.ro = new ResizeObserver(entries => {
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
    this.ro.observe(this.ref.current)
  }

  componentWillUnmount () {
    this.ro.unobserve(this.ref.current)
  }


  render () {
    const { children } = this.props;
    const childrenWithProps = React.Children.map(children, child =>
      React.cloneElement(child, { containerSize: this.state.containerSize }))
    return (
      <div
        className={this.props.className}
        ref={this.ref}
      >
        {childrenWithProps}
      </div>
    )
  }
}

class AppView extends Component {

  componentDidMount() {
    document.addEventListener('keydown', this.handleKeyDown);
    document.addEventListener('keyup', this.handleKeyUp);
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.handleKeyDown);
    document.removeEventListener('keyup', this.handleKeyUp);
  }

  handleKeyDown = (event) => {
    this.props.Toolbar.keyDown(event.key)
  }

  handleKeyUp = (event) => {
    this.props.Toolbar.keyUp(event.key)
  }

  handleLoadPetmate = (filename) => {
    const { dispatch } = this.props;
    const setWorkspaceFilename = (filename) => this.props.Toolbar.setWorkspaceFilename(filename);
    loadWorkspaceNoDialog(dispatch, filename, setWorkspaceFilename);
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
          <DivSize className={s.editor}>
            <Editor />
          </DivSize>
        </FileDrop>
        <Settings />
        <ExportModal />
      </Fragment>
    )
  }
}

const mapDispatchToProps = dispatch => {
  return {
    Toolbar: reduxToolbar.Toolbar.bindDispatch(dispatch),
    dispatch
  }
}

export default connect(
  null,
  mapDispatchToProps
)(AppView)
