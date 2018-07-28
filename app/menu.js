// @flow
import { app, Menu, shell, BrowserWindow } from 'electron';

const importers = [
  { label: 'PETSCII (.c)', cmd: 'import-marq-c' }
]

const exporters = [
  { label: 'PNG (.png)', cmd: 'export-png' },
  { label: 'PETSCII (.c)', cmd: 'export-marq-c' },
  { label: 'Executable (.prg)', cmd: 'export-prg' },
  { label: 'KickAssembler source (.asm)', cmd: 'export-kickass' }
]

export default class MenuBuilder {
  mainWindow: BrowserWindow;

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow;
  }

  sendMenuCommand (msg) {
    this.mainWindow.webContents.send('menu', msg)
  }

  buildMenu() {
    if (
      process.env.NODE_ENV === 'development' ||
      process.env.DEBUG_PROD === 'true'
    ) {
      this.setupDevelopmentEnvironment();
    }

    const template = process.platform === 'darwin'
      ? this.buildDarwinTemplate()
      : this.buildDefaultTemplate();

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);

    return menu;
  }

  mkImportCmd (label, cmd) {
    return {
      label,
      click: () => {
        this.sendMenuCommand(cmd)
      }
    }
  }

  mkExportCmd (label, cmd) {
    return {
      label,
      click: () => {
        this.sendMenuCommand(cmd)
      }
    }
  }

  setupDevelopmentEnvironment() {
    this.mainWindow.openDevTools();
    this.mainWindow.webContents.on('context-menu', (e, props) => {
      const { x, y } = props;

      Menu.buildFromTemplate([
        {
          label: 'Inspect element',
          click: () => {
            this.mainWindow.inspectElement(x, y);
          }
        }
      ]).popup(this.mainWindow);
    });
  }

  buildDarwinTemplate() {
    const subMenuAbout = {
      label: 'Petmate',
      submenu: [
        {
          label: 'About Petmate',
          selector: 'orderFrontStandardAboutPanel:'
        },
        { type: 'separator' },
        { label: 'Services', submenu: [] },
        { type: 'separator' },
        {
          label: 'Hide Petmate',
          accelerator: 'Command+H',
          selector: 'hide:'
        },
        {
          label: 'Hide Others',
          accelerator: 'Command+Shift+H',
          selector: 'hideOtherApplications:'
        },
        { label: 'Show All', selector: 'unhideAllApplications:' },
        { type: 'separator' },
        {
          label: 'Quit',
          accelerator: 'Command+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    };
    const subMenuFile = {
      label: 'File',
      submenu: [
        { label: 'Open File...', accelerator: 'Command+O',
          click: () => {
            this.sendMenuCommand('open')
          }
        },
        { type: 'separator' },
        { label: 'Save...', accelerator: 'Command+S',
          click: () => {
            this.sendMenuCommand('save')
          }
        },
        { label: 'Save As...', accelerator: 'Command+Shift+S',
          click: () => {
            this.sendMenuCommand('save-as')
          }
        },
        { type: 'separator' },
        { label: 'Import...',
          submenu: importers.map(decl => this.mkImportCmd(decl.label, decl.cmd))
        },
        { label: 'Export As...',
          submenu: exporters.map(decl => this.mkExportCmd(decl.label, decl.cmd))
        }
      ]
    };
    const subMenuEdit = {
      label: 'Edit',
      submenu: [
        { label: 'Undo', accelerator: 'Command+Z', selector: 'undo:',
          click: () => {
            this.sendMenuCommand('undo')
          }
        },
        { label: 'Redo', accelerator: 'Shift+Command+Z', selector: 'redo:',
          click: () => {
            this.sendMenuCommand('redo')
          }
        },
      ]
    };
    const subMenuViewDev = {
      label: 'View',
      submenu: [
        {
          label: 'Reload',
          accelerator: 'Command+R',
          click: () => {
            this.mainWindow.webContents.reload();
          }
        },
        {
          label: 'Toggle Full Screen',
          accelerator: 'Ctrl+Command+F',
          click: () => {
            this.mainWindow.setFullScreen(!this.mainWindow.isFullScreen());
          }
        },
        {
          label: 'Toggle Developer Tools',
          accelerator: 'Alt+Command+I',
          click: () => {
            this.mainWindow.toggleDevTools();
          }
        }
      ]
    };
    const subMenuViewProd = {
      label: 'View',
      submenu: [
        {
          label: 'Toggle Full Screen',
          accelerator: 'Ctrl+Command+F',
          click: () => {
            this.mainWindow.setFullScreen(!this.mainWindow.isFullScreen());
          }
        }
      ]
    };
    const subMenuWindow = {
      label: 'Window',
      submenu: [
        {
          label: 'Minimize',
          accelerator: 'Command+M',
          selector: 'performMiniaturize:'
        },
        { label: 'Close', accelerator: 'Command+W', selector: 'performClose:' },
        { type: 'separator' },
        { label: 'Bring All to Front', selector: 'arrangeInFront:' }
      ]
    };
    const subMenuHelp = {
      label: 'Help',
      submenu: [
        {
          label: 'Documentation',
          click() {
            shell.openExternal(
              'https://nurpax.github.io/petmate/'
            );
          }
        },
        {
          label: 'Search Issues',
          click() {
            shell.openExternal('https://github.com/nurpax/petmate/issues');
          }
        }
      ]
    };

    const subMenuView =
      process.env.NODE_ENV === 'development' ? subMenuViewDev : subMenuViewProd;

    return [subMenuAbout, subMenuFile, subMenuEdit, subMenuView, subMenuWindow, subMenuHelp];
  }

  buildDefaultTemplate() {
    const templateDefault = [
      {
        label: '&File',
        submenu: [
          {
            label: '&Open',
            accelerator: 'Ctrl+O'
          },
          {
            label: '&Close',
            accelerator: 'Ctrl+W',
            click: () => {
              this.mainWindow.close();
            }
          }
        ]
      },
      {
        label: '&View',
        submenu:
          process.env.NODE_ENV === 'development'
            ? [
                {
                  label: '&Reload',
                  accelerator: 'Ctrl+R',
                  click: () => {
                    this.mainWindow.webContents.reload();
                  }
                },
                {
                  label: 'Toggle &Full Screen',
                  accelerator: 'F11',
                  click: () => {
                    this.mainWindow.setFullScreen(
                      !this.mainWindow.isFullScreen()
                    );
                  }
                },
                {
                  label: 'Toggle &Developer Tools',
                  accelerator: 'Alt+Ctrl+I',
                  click: () => {
                    this.mainWindow.toggleDevTools();
                  }
                }
              ]
            : [
                {
                  label: 'Toggle &Full Screen',
                  accelerator: 'F11',
                  click: () => {
                    this.mainWindow.setFullScreen(
                      !this.mainWindow.isFullScreen()
                    );
                  }
                }
              ]
      },
      {
        label: 'Help',
        submenu: [
          {
            label: 'Documentation',
            click() {
              shell.openExternal(
                'https://nurpax.github.io/petmate/'
              );
            }
          },
          {
            label: 'Search Issues',
            click() {
              shell.openExternal('https://github.com/nurpax/petmate/issues');
            }
          }
        ]
      }
    ];

    return templateDefault;
  }
}
