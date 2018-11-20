
import React, {
  Component,
  Fragment,
  DragEvent
} from 'react';

interface FileDropProps {
  className: string;
  loadDroppedFile: (filename: string) => void;
};

interface FileDropState {
  isDragging: boolean;
};

class FlashScreen extends Component {
  render () {
    return (
      <div
        draggable={false}
        style={{
          pointerEvents: 'none',
          position: 'absolute',
          left: 0,
          top: 0,
          width: '100%',
          height: '100%',
          zIndex: 30,
          backgroundColor: 'rgb(0, 0, 0)',
          opacity: 0.8
        }}>
      </div>
    )
  }
}

export default class FileDrop extends Component<FileDropProps, FileDropState> {
  state = {
    isDragging: false
  };

  dragCounter = 0;

  static hasFiles = (e: DragEvent) => {
    const types = e.dataTransfer.types;
    return types && types.indexOf('Files') != -1;
  }

  resetDragging = () => {
    this.setState({ isDragging: false });
    this.dragCounter = 0;
  }

  handleTreeDrag = (event: DragEvent) => {
    if (!FileDrop.hasFiles(event)) {
      return;
    }

    // Drag counter trick from https://github.com/sarink/react-file-drop/blob/master/src/FileDrop/FileDrop.tsx
    // Keep track of enter/leaves bubbling.
    this.dragCounter += (event.type === 'dragenter' ? 1 : -1);

    if (this.dragCounter == 1) {
      this.setState({ isDragging: true });
      return;
    }

    if (this.dragCounter == 0) {
      this.setState({ isDragging: false });
      return;
    }
  }

  handleDragOver = (event: DragEvent) => {
    event.preventDefault();
  }

  handleFileDrop = (event: DragEvent) => {
    if (FileDrop.hasFiles(event)) {
      this.resetDragging();

      const files = event.dataTransfer.files;
      if (files.length == 1) {
        const file0 = files[0] as any;
        this.props.loadDroppedFile(file0.path);
      }
    }
  }

  render () {
    return (
      <Fragment>
        <div
          draggable={false}
          onDragEnter={this.handleTreeDrag}
          onDragLeave={this.handleTreeDrag}
          onDragOver={this.handleDragOver}
          onDrop={this.handleFileDrop}
          className={this.props.className}
        >
          {this.props.children}
        </div>
        {this.state.isDragging && <FlashScreen />}
      </Fragment>
    )
  }
}