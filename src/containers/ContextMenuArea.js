import React, { Component } from 'react'
import PropTypes from 'prop-types'

import { electron } from '../utils/electronImports'
const remote = electron.remote;

const { Menu } = remote;

// Copied from https://github.com/johot/react-electron-contextmenu (with some
// bug fixes like unregistering event handlers)
export default class ContextMenuArea extends Component {
  static propTypes = {
      menuItems: PropTypes.arrayOf(PropTypes.object.isRequired).isRequired,
      style: PropTypes.object
  }

  constructor (props) {
    super(props)
    this.menu = new Menu()
    this.rootElement = React.createRef()
  }

  handleContextMenu = (e) => {
    e.preventDefault();
    //self._rightClickPosition = { x: e.x, y: e.y };
    this.menu.popup(remote.getCurrentWindow())
  }

  componentDidMount() {
    this.menu = Menu.buildFromTemplate(this.props.menuItems)
    this.rootElement.current.addEventListener(
      "contextmenu",
      this.handleContextMenu
    )
  }

  componentWillUnmount() {
    this.rootElement.current.removeEventListener("contextmenu", this.handleContextMenu)
  }

  render() {
    return (
      <div style={{ ...this.props.style }} ref={this.rootElement}>
        {this.props.children}
      </div>
    );
  }
}

