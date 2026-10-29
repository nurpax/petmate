import React from 'react';
import ReactDOM from 'react-dom';
import Root from './containers/Root';
import './app.global.css';

import { loadSettings, promptProceedWithUnsavedChanges } from './utils';
import * as Screens from './redux/screens';
import * as settings  from './redux/settings';
import * as selectors from './redux/selectors';
import { Toolbar } from './redux/toolbar';
import * as ReduxRoot from './redux/root';

import configureStore from './store/configureStore';

// TODO prod builds
import { electron, isElectron } from './utils/electronImports';
import * as autosave from './utils/autosave';
import { runMenuCommand } from './menuCommands';

const store = configureStore();

const filename = isElectron ? electron.ipcRenderer.sendSync('get-open-args') : null;
if (filename) {
  // Load a .petmate file that the user clicked on Explorer (Windows only path).
  store.dispatch(ReduxRoot.actions.openWorkspace(filename));
} else if (!isElectron && autosave.restore(store.dispatch)) {
  // Browser build: continue with the autosaved workspace.
} else {
  // Create one screen/framebuffer so that we have a canvas to draw on
  store.dispatch(Screens.actions.newScreen());
  store.dispatch(ReduxRoot.actions.updateLastSavedSnapshot());
}


// Render the application
ReactDOM.render(
  React.createElement(Root, { store }, null),
  document.getElementById('root')
);

loadSettings((j) => store.dispatch(settings.actions.load(j)))

window.addEventListener('focus', () => {
  store.dispatch(Toolbar.actions.setShortcutsActive(true))
  store.dispatch(Toolbar.actions.clearModKeyState())
})
window.addEventListener('blur', () => {
  store.dispatch(Toolbar.actions.setShortcutsActive(false))
  store.dispatch(Toolbar.actions.clearModKeyState())
})

if (isElectron) {
  electron.ipcRenderer.on('window-blur', (_event: Event, _message: any) => {
    store.dispatch(Toolbar.actions.setShortcutsActive(false))
    store.dispatch(Toolbar.actions.clearModKeyState())
  });

  electron.ipcRenderer.on('window-focus', (_event: Event, _message: any) => {
    store.dispatch(Toolbar.actions.setShortcutsActive(true));
    store.dispatch(Toolbar.actions.clearModKeyState());
  });

  electron.ipcRenderer.on('prompt-unsaved', () => {
    if (promptProceedWithUnsavedChanges(store.getState(), {
      title: 'Quit',
      detail: 'Your changes will be lost if you don\'t save them.'
    })) {
      // OK to close now, ask the main process to quit:
      electron.ipcRenderer.send('closed');
    }
  });

  electron.ipcRenderer.on('open-petmate-file', (_event: Event, filename: string) => {
    // Load a .petmate file that was sent to the main process via the open-file
    // event (macOS).  This can be either a double-click on a .petmate file in
    // Finder or drag&drop a .petmate file on the app icon in the task bar.
    store.dispatch(ReduxRoot.actions.openWorkspace(filename));
  });

  // Listen to commands from the main process
  electron.ipcRenderer.on('menu', (_event: Event, message: string) => {
    runMenuCommand(store.dispatch, message)
  })
} else {
  autosave.start(store);

  // Browser build: the menu accelerators the native Electron menu provides.
  document.addEventListener('keydown', (e) => {
    if (!(e.metaKey || e.ctrlKey) || e.altKey || !store.getState().toolbar.shortcutsActive) {
      return;
    }
    const key = e.key.toLowerCase();
    const command =
      key === 'z' ? (e.shiftKey ? 'redo' : 'undo') :
      key === 'y' ? 'redo' :
      key === 's' ? (e.shiftKey ? 'save-as' : 'save') :
      key === 'o' ? 'open' :
      null;
    if (command !== null) {
      e.preventDefault();
      runMenuCommand(store.dispatch, command);
    }
  });

  // The workspace is autosaved, but desktop browsers still get a warning
  // about changes that haven't been saved to a file.
  window.addEventListener('beforeunload', (e) => {
    if (selectors.anyUnsavedChanges(store.getState())) {
      e.preventDefault();
      e.returnValue = '';
    }
  });
}
