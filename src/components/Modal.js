
import React, { Component, Fragment } from 'react'
import PropTypes from 'prop-types'
import ReactDOM from 'react-dom'
import classnames from 'classnames'

import styles from './Modal.module.css'

const modalRoot = document.getElementById('modal-root')

class ModalBase extends Component {
  constructor(props) {
    super(props)
    this.el = document.createElement('div')
  }

  componentDidMount() {
    // The portal element is inserted in the DOM tree after
    // the Modal's children are mounted, meaning that children
    // will be mounted on a detached DOM node. If a child
    // component requires to be attached to the DOM tree
    // immediately when mounted, for example to measure a
    // DOM node, or uses 'autoFocus' in a descendant, add
    // state to Modal and only render the children when Modal
    // is inserted in the DOM tree.
    modalRoot.appendChild(this.el)
  }

  componentWillUnmount() {
    modalRoot.removeChild(this.el)
  }

  render() {
    return ReactDOM.createPortal(
      this.props.children,
      this.el
    )
  }
}

class ModalAnimWrapper extends Component {
  state = {
    init: true
  }
  constructor (props) {
    super(props)
    this.ref = null
  }

  componentDidMount () {
    // This is required to trigger the CSS animation
    const ANIMATION_TIMEOUT = 20
    setTimeout(() => {
      // This is for to force a repaint,
      // which is necessary in order to transition styles.
      // (jjhellst: or so I think..  From https://github.com/reactjs/react-transition-group/blob/780e8e5bf62efa655a2683c216cdabd7f7a09897/src/CSSTransition.js#L210-L217)
      /* eslint-disable no-unused-expressions */
      this.ref && this.ref.scrollTop
      /* eslint-enable no-unused-expressions */
      this.setState({init: false})
    }, ANIMATION_TIMEOUT)
  }

  render () {
    return (
      <Fragment>
        <div ref={(r) => this.ref = r}>
          <div
            className={styles.modalBackground}
            style={{
              opacity: this.state.init ? 0.0 : 1.0,
              transition: 'opacity 0.2s linear'
            }}
          />
          <div
            onKeyDown={this.props.onKeyDown}
            className={styles.modal}
            style={{
              opacity: this.state.init ? 0.0 : 1.0,
              transform: this.state.init ? 'translate(-50%, -40%)' : 'translate(-50%, -50%)',
              transition: 'opacity 0.2s linear, transform 0.2s linear'
            }}>
            {this.props.children}
          </div>
        </div>
      </Fragment>
    )
  }
}

export default class Modal extends Component {
  handleModalClose = () => {
    this.props.onModalClose()
  }

  modalBody = () => {
    return (
      <ModalAnimWrapper>
        {this.props.children}
      </ModalAnimWrapper>
    )
  }

  render () {
    return (
      <ModalBase>
        {this.props.showModal ? this.modalBody() : null}
      </ModalBase>
    )
  }
}
