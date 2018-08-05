import React from 'react';
import { render } from 'react-dom';
import { AppContainer } from 'react-hot-loader';
import Root from './containers/Root';
import { configureStore, history } from './store/configureStore';
import './app.global.css';

import { formats, loadSettings } from './utils'
import * as Screens from './redux/screens'
import { Settings } from './redux/settings'
import { Toolbar } from './redux/toolbar'
import * as ReduxRoot from './redux/root'

const store = configureStore();
// Create one screen/framebuffer so that we have a canvas to draw on
store.dispatch(Screens.actions.newScreen())

render(
  <AppContainer>
    <Root store={store} history={history} />
  </AppContainer>,
  document.getElementById('root')
);

loadSettings((j) => store.dispatch(Settings.actions.load(j)))

if (module.hot) {
  module.hot.accept('./containers/Root', () => {
    const NextRoot = require('./containers/Root'); // eslint-disable-line global-require
    render(
      <AppContainer>
        <NextRoot store={store} history={history} />
      </AppContainer>,
      document.getElementById('root')
    );
  });
}

// Listen to commands from the main process
require('electron').ipcRenderer.on('menu', (event, message) => {
  switch (message) {
    case 'undo':
      store.dispatch(ReduxRoot.actions.undo())
      return
    case 'redo':
      store.dispatch(ReduxRoot.actions.redo())
      return
    case 'open':
      store.dispatch(ReduxRoot.actions.fileOpenWorkspace())
      return
    case 'save-as':
      store.dispatch(ReduxRoot.actions.fileSaveAsWorkspace())
      return
    case 'save':
      store.dispatch(ReduxRoot.actions.fileSaveWorkspace())
      return
    case 'export-png':
      store.dispatch(ReduxRoot.actions.fileExportAs(formats.png))
      return
    case 'export-marq-c':
      store.dispatch(ReduxRoot.actions.fileExportAs(formats.c))
      return
    case 'export-kickass':
      alert('KickAssembler source export not implemented yet')
      return
    case 'export-prg':
      store.dispatch(ReduxRoot.actions.fileExportAs(formats.prg))
      return
    case 'import-marq-c':
      store.dispatch(ReduxRoot.actions.fileImport(formats.c))
      return
    case 'preferences':
      store.dispatch(Toolbar.actions.setShowSettings(true))
      return
    default:
      console.warn('unknown message from main process', message)
  }
})
