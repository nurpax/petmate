
import React, { Component } from 'react';
import { connect } from 'react-redux'

import { selectChar, setFramebufChar } from '../actions/editor'
import Editor from '../components/Editor';

const selectedCharScreencode = ({row, col}) => {
  return row*16 + col
}

class EditorPage extends Component<Props> {
  props: Props;

  render() {
    return (
      <Editor
        framebuf={this.props.framebuf}
        selected={this.props.selected}
        curScreencode={this.props.curScreencode}
        setPixel={this.props.setPixel}
        setSelectedChar={this.props.setSelectedChar}
      />
    )
  }
}

const mapDispatchToProps = dispatch => {
  return {
    setSelectedChar: rowcol => {
      dispatch(selectChar(rowcol))
    },
    setPixel: rowcol => {
      dispatch(setFramebufChar(rowcol))
    }
  }
}

const mapStateToProps = state => {
  const selected = state.editor.selected
  return {
    framebuf: state.editor.framebuf,
    selected,
    curScreencode: selectedCharScreencode(selected)
  }
}
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(EditorPage)

