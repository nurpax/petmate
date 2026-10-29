import React, { Component, Fragment } from 'react'
import ReactDOM from 'react-dom'

import { electron, isElectron } from '../utils/electronImports'

import styles from './ContextMenuArea.module.css'

interface MenuItem {
  label: string;
  click: () => void;
  destructive?: boolean;
}

interface ContextMenuAreaProps {
  menuItems: MenuItem[];
  style?: React.CSSProperties;
};

interface ContextMenuAreaState {
  // Position of the HTML menu (browser build only)
  menuPos: { x: number, y: number } | null;
}

const LONG_PRESS_MS = 500;

// Copied from https://github.com/johot/react-electron-contextmenu (with some
// bug fixes like unregistering event handlers)
//
// In the browser build, the menu is rendered as HTML and also opens on a
// long-press, since touch devices have no right-click.
export default class ContextMenuArea extends Component<ContextMenuAreaProps, ContextMenuAreaState> {
  state: ContextMenuAreaState = {
    menuPos: null
  };

  private menu: any = null;
  private rootElement = React.createRef<HTMLDivElement>();
  private longPressTimer: number | null = null;
  private longPressStart: { x: number, y: number } | null = null;

  openMenu (x: number, y: number) {
    if (isElectron) {
      this.menu.popup(electron.remote.getCurrentWindow())
    } else {
      this.setState({ menuPos: { x, y } })
    }
  }

  handleContextMenu = (e: MouseEvent) => {
    e.preventDefault();
    this.openMenu(e.clientX, e.clientY)
  }

  cancelLongPress = () => {
    if (this.longPressTimer !== null) {
      window.clearTimeout(this.longPressTimer)
      this.longPressTimer = null
    }
  }

  handlePointerDown = (e: PointerEvent) => {
    if (e.pointerType !== 'touch') {
      return
    }
    this.cancelLongPress()
    const { clientX: x, clientY: y } = e
    this.longPressStart = { x, y }
    this.longPressTimer = window.setTimeout(() => {
      this.longPressTimer = null
      this.openMenu(x, y)
    }, LONG_PRESS_MS)
  }

  handlePointerMove = (e: PointerEvent) => {
    if (this.longPressTimer !== null && this.longPressStart !== null) {
      const dx = e.clientX - this.longPressStart.x
      const dy = e.clientY - this.longPressStart.y
      if (dx*dx + dy*dy > 10*10) {
        this.cancelLongPress()
      }
    }
  }

  // Swallow the click that ends a long-press so it doesn't also activate
  // whatever is under the finger.
  handleClickCapture = (e: MouseEvent) => {
    if (this.state.menuPos !== null) {
      e.stopPropagation()
      e.preventDefault()
    }
  }

  handleItemClick = (item: MenuItem) => {
    this.setState({ menuPos: null })
    item.click()
  }

  componentDidMount() {
    if (isElectron) {
      this.menu = electron.remote.Menu.buildFromTemplate(this.props.menuItems)
    }
    const el = this.rootElement.current
    if (!el) {
      throw new Error('should be impossible');
    }
    el.addEventListener("contextmenu", this.handleContextMenu)
    if (!isElectron) {
      el.addEventListener('pointerdown', this.handlePointerDown)
      el.addEventListener('pointermove', this.handlePointerMove)
      el.addEventListener('pointerup', this.cancelLongPress)
      el.addEventListener('pointercancel', this.cancelLongPress)
      el.addEventListener('click', this.handleClickCapture, true)
    }
  }

  componentWillUnmount() {
    const el = this.rootElement.current
    if (!el) {
      throw new Error('should be impossible');
    }
    this.cancelLongPress()
    el.removeEventListener("contextmenu", this.handleContextMenu)
    if (!isElectron) {
      el.removeEventListener('pointerdown', this.handlePointerDown)
      el.removeEventListener('pointermove', this.handlePointerMove)
      el.removeEventListener('pointerup', this.cancelLongPress)
      el.removeEventListener('pointercancel', this.cancelLongPress)
      el.removeEventListener('click', this.handleClickCapture, true)
    }
  }

  renderMenu () {
    const { menuPos } = this.state
    if (menuPos === null) {
      return null
    }
    const width = 220
    const left = Math.max(8, Math.min(menuPos.x, window.innerWidth - width - 8))
    const top = Math.max(8, Math.min(menuPos.y, window.innerHeight - 52 * this.props.menuItems.length - 8))
    return ReactDOM.createPortal(
      <Fragment>
        <div
          className={styles.backdrop}
          onPointerDown={() => this.setState({ menuPos: null })}
        />
        <div className={styles.menu} role='menu' style={{ left, top, width }}>
          {this.props.menuItems.map(item =>
            <button
              key={item.label}
              role='menuitem'
              className={item.destructive ? styles.destructive : undefined}
              onClick={() => this.handleItemClick(item)}
            >
              {item.label}
            </button>
          )}
        </div>
      </Fragment>,
      document.body
    )
  }

  render() {
    return (
      <div style={{ ...this.props.style }} ref={this.rootElement}>
        {this.props.children}
        {this.renderMenu()}
      </div>
    );
  }
}
