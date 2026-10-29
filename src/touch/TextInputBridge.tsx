import React, { Component } from 'react'
import { connect } from 'react-redux'

import { Toolbar } from '../redux/toolbar'
import { RootState, Tool } from '../redux/types'

// A hidden text input that brings up the on-screen keyboard for the text
// tool and feeds what's typed into the same handler as hardware key presses.
//
// iOS only shows the keyboard when an input is focused from within a user
// gesture, so the canvas calls focusTextInput() directly from its tap
// handler.

let inputElement: HTMLInputElement | null = null;

export function focusTextInput() {
  if (inputElement !== null) {
    inputElement.focus();
  }
}

// The input always holds this one character, so that a backspace on an
// "empty" field still shows up as a change.
const SENTINEL = ' ';

interface TextInputBridgeProps {
  active: boolean;
  shiftKey: boolean;
  Toolbar: any;
}

class TextInputBridge extends Component<TextInputBridgeProps> {
  private ref = React.createRef<HTMLInputElement>();

  componentDidMount () {
    inputElement = this.ref.current;
    if (inputElement !== null) {
      inputElement.value = SENTINEL;
      inputElement.addEventListener('keydown', this.handleNativeKeyDown);
    }
  }

  componentWillUnmount () {
    if (inputElement !== null) {
      inputElement.removeEventListener('keydown', this.handleNativeKeyDown);
    }
    inputElement = null;
  }

  componentDidUpdate () {
    if (!this.props.active && this.ref.current && document.activeElement === this.ref.current) {
      this.ref.current.blur();
    }
  }

  // Characters typed on a hardware keyboard arrive through the input event
  // below.  Keep them from also reaching the app's global key handler.
  // Arrows and Escape still go to the app.
  handleNativeKeyDown = (e: KeyboardEvent) => {
    if (e.key.length === 1 || e.key === 'Backspace') {
      e.stopPropagation();
    }
  }

  typeChar (c: string) {
    if (c !== c.toLowerCase()) {
      // The key handler picks upper case glyphs based on the shift key.
      const shift = this.props.shiftKey;
      this.props.Toolbar.setShiftKey(true);
      this.props.Toolbar.keyDown(c);
      this.props.Toolbar.setShiftKey(shift);
    } else {
      this.props.Toolbar.keyDown(c);
    }
  }

  handleInput = (e: React.FormEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const value = input.value;
    if (value.length < SENTINEL.length) {
      this.props.Toolbar.keyDown('Backspace');
    } else {
      const typed = value.startsWith(SENTINEL) ? value.substring(SENTINEL.length) : value;
      for (const c of Array.from(typed)) {
        this.typeChar(c);
      }
    }
    input.value = SENTINEL;
  }

  render () {
    return (
      <input
        ref={this.ref}
        type='text'
        aria-label='Text tool input'
        autoCapitalize='off'
        autoComplete='off'
        autoCorrect='off'
        spellCheck={false}
        onInput={this.handleInput}
        style={{
          position: 'fixed',
          left: 0,
          bottom: 0,
          width: 1,
          height: 1,
          opacity: 0,
          // 16px or larger keeps iOS from zooming in on focus
          fontSize: 16,
          border: 0,
          padding: 0,
          pointerEvents: 'none'
        }}
      />
    );
  }
}

export default connect(
  (state: RootState) => {
    return {
      active: state.toolbar.selectedTool === Tool.Text && state.toolbar.textCursorPos !== null,
      shiftKey: state.toolbar.shiftKey
    }
  },
  dispatch => {
    return {
      Toolbar: Toolbar.bindDispatch(dispatch)
    }
  }
)(TextInputBridge)
