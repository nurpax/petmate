
import React, { Component, Fragment } from 'react'
import PropTypes from 'prop-types'
import ReactDOM from 'react-dom'
import classnames from 'classnames'

import styles from './Modal.css'

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

export default class Modal extends Component {
  handleModalClose = () => {
    this.props.onModalClose()
  }

  render () {
    return (
      <ModalBase>
        <div className={classnames(styles.modalBackground, this.props.showModal ? styles.show : styles.hide)}>
          <div
            onKeyDown={this.props.onKeyDown}
            className={classnames(styles.modal, this.props.showModal ? styles.show : styles.hide)}>
            {this.props.children}
          </div>
        </div>
      </ModalBase>
    )
  }
}
