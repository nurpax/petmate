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

function dispatchExport(type) {
  // Either open an export options modal or go to export directly if the
  // output format doesn't need any configuration.
  if (formats[type.ext].exportOptions) {
    store.dispatch(Toolbar.actions.setShowExport({show:true, type}))
  } else {
    store.dispatch(ReduxRoot.actions.fileExportAs(type, undefined))
  }
}

require('electron').ipcRenderer.on('window-blur', (event, message) => {
  store.dispatch(Toolbar.actions.setShortcutsActive(false))
  store.dispatch(Toolbar.actions.clearModKeyState())
})

window.addEventListener('focus', () => {
  store.dispatch(Toolbar.actions.setShortcutsActive(true))
  store.dispatch(Toolbar.actions.clearModKeyState())
})
window.addEventListener('blur', () => {
  store.dispatch(Toolbar.actions.setShortcutsActive(false))
  store.dispatch(Toolbar.actions.clearModKeyState())
})

// Listen to commands from the main process
require('electron').ipcRenderer.on('menu', (event, message) => {
  switch (message) {
    case 'undo':
      store.dispatch(ReduxRoot.actions.undo())
      return
    case 'redo':
      store.dispatch(ReduxRoot.actions.redo())
      return
    case 'new':
      const { dialog } = require('electron').remote
      if (dialog.showMessageBox({
        type: 'question',
        buttons: ['Reset', 'Cancel'],
        cancelId: 1,
        message: 'Reset workspace?',
        detail: 'This will empty your workspace.  This cannot be undone.'
      }) === 0) {
        store.dispatch(ReduxRoot.actions.resetState())
        store.dispatch(Screens.actions.newScreen())
      }
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
      dispatchExport(formats.png)
      return
    case 'export-marq-c':
      dispatchExport(formats.c)
      return
    case 'export-asm':
      dispatchExport(formats.asm)
      return
    case 'export-basic':
      dispatchExport(formats.bas)
      return
    case 'export-prg':
      dispatchExport(formats.prg)
      return
    case 'export-gif':
      dispatchExport(formats.gif)
      return
    case 'import-marq-c':
      store.dispatch(ReduxRoot.actions.fileImportAppend(formats.c))
      return
    case 'preferences':
      store.dispatch(Toolbar.actions.setShowSettings(true))
      return
    default:
      console.warn('unknown message from main process', message)
  }
})
