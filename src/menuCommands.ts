import { formats, promptProceedWithUnsavedChanges } from './utils';
import * as Screens from './redux/screens';
import { Toolbar } from './redux/toolbar';
import * as ReduxRoot from './redux/root';
import { FileFormat, RootState } from './redux/types';

type Dispatch = (action: any) => any;

function dispatchExport(dispatch: Dispatch, fmt: FileFormat) {
  // Either open an export options modal or go to export directly if the
  // output format doesn't need any configuration.
  if (formats[fmt.ext].exportOptions) {
    dispatch(Toolbar.actions.setShowExport({show:true, fmt}))
  } else {
    dispatch(ReduxRoot.actions.fileExportAs(fmt))
  }
}

// Run a command from the application menu.  The Electron build gets these
// from the native menu (see public/menu.js), the browser build from its
// in-app menus.
export function runMenuCommand(dispatch: Dispatch, message: string) {
  switch (message) {
    case 'undo':
      dispatch(ReduxRoot.actions.undo())
      return
    case 'redo':
      dispatch(ReduxRoot.actions.redo())
      return
    case 'new':
      dispatch((dispatch: any, getState: () => RootState) => {
        if (promptProceedWithUnsavedChanges(getState(), {
          title: 'Reset',
          detail: 'This will empty your workspace.  This cannot be undone.'
        })) {
          dispatch(ReduxRoot.actions.resetState())
          dispatch(Screens.actions.newScreen())
          dispatch(ReduxRoot.actions.updateLastSavedSnapshot());
        }
      });
      return
    case 'open':
      dispatch(ReduxRoot.actions.fileOpenWorkspace())
      return
    case 'save-as':
      dispatch(ReduxRoot.actions.fileSaveAsWorkspace())
      return
    case 'save':
      dispatch(ReduxRoot.actions.fileSaveWorkspace())
      return
    case 'export-png':
      dispatchExport(dispatch, formats.png)
      return
    case 'export-seq':
      dispatchExport(dispatch, formats.seq)
      return
    case 'export-marq-c':
      dispatchExport(dispatch, formats.c)
      return
    case 'export-asm':
      dispatchExport(dispatch, formats.asm)
      return
    case 'export-basic':
      dispatchExport(dispatch, formats.bas)
      return
    case 'export-prg':
      dispatchExport(dispatch, formats.prg)
      return
    case 'export-gif':
      dispatchExport(dispatch, formats.gif)
      return
    case 'export-json':
      dispatchExport(dispatch, formats.json)
      return
    case 'export-pet':
      dispatchExport(dispatch, formats.pet)
      return
    case 'export-pet-prg':
      dispatchExport(dispatch, formats.petprg)
      return
    case 'import-d64':
      dispatch(ReduxRoot.actions.fileImportAppend(formats.d64))
      return
    case 'import-marq-c':
      dispatch(ReduxRoot.actions.fileImportAppend(formats.c))
      return
    case 'import-png':
      dispatch(Toolbar.actions.setShowImport({show: true, fmt: formats.png}));
      return
    case 'import-seq':
      dispatch(ReduxRoot.actions.fileImportAppend(formats.seq));
      return
    case 'preferences':
      dispatch(Toolbar.actions.setShowSettings(true))
      return
    case 'new-screen':
      dispatch(Screens.actions.newScreen())
      return;
    case 'shift-screen-left':
      dispatch(Toolbar.actions.shiftHorizontal(-1))
      return;
    case 'shift-screen-right':
      dispatch(Toolbar.actions.shiftHorizontal(+1))
      return;
    case 'shift-screen-up':
      dispatch(Toolbar.actions.shiftVertical(-1))
      return;
    case 'shift-screen-down':
      dispatch(Toolbar.actions.shiftVertical(+1))
      return;
    case 'custom-fonts':
      dispatch(Toolbar.actions.setShowCustomFonts(true))
      return
    default:
      console.warn('unknown message from main process', message)
  }
}
