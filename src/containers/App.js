
import React, { Component, Fragment } from 'react';
import { connect } from 'react-redux'
import ResizeObserver from 'resize-observer-polyfill'

import Toolbar from './Toolbar'
import FramebufferTabs from './FramebufferTabs'
import Settings from './Settings'
import ExportModal from './ExportModal'
import Editor from './Editor';

import { Framebuffer } from '../redux/editor'
import * as reduxToolbar from '../redux/toolbar'

import s from './App.module.css'

class ExtLink extends Component {
  handleIconClick = (e) => {
    e.preventDefault()
    require('electron').shell.openExternal(this.props.href)
  }
  render () {
    return (
      <a
        onClick={this.handleIconClick}
        href={this.props.href}>
        {this.props.children}
      </a>
    )
  }
}

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

  render() {
    return (
      <Fragment>
        <div className={s.appGrid}>
          <div className={s.topmenu}>
            <FramebufferTabs />
          </div>
          <div className={s.leftmenubar}>
            <Toolbar />
          </div>
          <DivSize className={s.editor}>
            <Editor />
          </DivSize>
        </div>
        <Settings />
        <ExportModal />
      </Fragment>
    )
  }
}

const mapDispatchToProps = dispatch => {
  return {
    Toolbar: reduxToolbar.Toolbar.bindDispatch(dispatch)
  }
}

const mapStateToProps = state => {
  return {
  }
}

export default connect(
  null,
  mapDispatchToProps
)(AppView)
