import React, { Component } from 'react'

import { electron } from '../utils/electronImports'
const remote = electron.remote;

const { Menu } = remote;

interface ContextMenuAreaProps {
  menuItems: any[];
  style: React.CSSProperties;
};

// Copied from https://github.com/johot/react-electron-contextmenu (with some
// bug fixes like unregistering event handlers)
export default class ContextMenuArea extends Component<ContextMenuAreaProps> {
  private menu = new Menu();
  private rootElement = React.createRef<HTMLDivElement>();

  handleContextMenu = (e: Event) => {
    e.preventDefault();
    //self._rightClickPosition = { x: e.x, y: e.y };
    this.menu.popup(remote.getCurrentWindow())
  }

  componentDidMount() {
    this.menu = Menu.buildFromTemplate(this.props.menuItems)
    if (!this.rootElement.current) {
      throw new Error('should be impossible');
    }
    this.rootElement.current.addEventListener(
      "contextmenu",
      this.handleContextMenu
    )
  }

  componentWillUnmount() {
    if (!this.rootElement.current) {
      throw new Error('should be impossible');
    }
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

