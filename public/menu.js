
const { app, Menu, shell } = require('electron');

const importers = [
  { label: 'D64 disk image (.d64)', cmd: 'import-d64' },
  { label: 'PETSCII (.c)', cmd: 'import-marq-c' },
  { label: 'PNG (.png)', cmd: 'import-png' },
  { label: 'SEQ (.seq)', cmd: 'import-seq' }
]

const exporters = [
  { label: 'Assembler source (.asm)', cmd: 'export-asm' },
  { label: 'BASIC (.bas)', cmd: 'export-basic' },
  { label: 'Executable (.prg)', cmd: 'export-prg' },
  { label: 'GIF (.gif)', cmd: 'export-gif' },
  { label: 'JSON (.json)', cmd: 'export-json' },
  { label: 'PETSCII (.c)', cmd: 'export-marq-c' },
  { label: 'PNG (.png)', cmd: 'export-png' },
  { label: 'SEQ (.seq)', cmd: 'export-seq' }
]

module.exports = class MenuBuilder {
  constructor(mainWindow) {
    this.mainWindow = mainWindow;
  }

  sendMenuCommand (msg) {
    this.mainWindow.webContents.send('menu', msg)
  }

  buildMenu() {
    if (!app.isPackaged) {
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
        { label: 'Preferences...',
          accelerator: 'Command+,',
          click: () => {
            this.sendMenuCommand('preferences');
          }
        },
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
        { label: 'New', accelerator: 'Command+N',
          click: () => {
            this.sendMenuCommand('new');
          }
        },
        { label: 'New Screen', accelerator: 'Command+T',
          click: () => {
            this.sendMenuCommand('new-screen');
          }
        },
        { type: 'separator' },
        { label: 'Open File...', accelerator: 'Command+O',
          click: () => {
            this.sendMenuCommand('open');
          }
        },
        { type: 'separator' },
        { label: 'Save', accelerator: 'Command+S',
          click: () => {
            this.sendMenuCommand('save');
          }
        },
        { label: 'Save As...', accelerator: 'Command+Shift+S',
          click: () => {
            this.sendMenuCommand('save-as');
          }
        },
        { type: 'separator' },
        { label: 'Import...',
          submenu: importers.map(decl => this.mkImportCmd(decl.label, decl.cmd))
        },
        { label: 'Export As...',
          submenu: exporters.map(decl => this.mkExportCmd(decl.label, decl.cmd))
        },
        { type: 'separator' },
        { label: 'Fonts...',
          click: () => {
            this.sendMenuCommand('custom-fonts');
          }
        },
      ]
    };
    const subMenuEdit = {
      label: 'Edit',
      submenu: [
        { label: 'Undo', accelerator: 'Command+Z', selector: 'undo:',
          click: () => {
            this.sendMenuCommand('undo');
          }
        },
        { label: 'Redo', accelerator: 'Shift+Command+Z', selector: 'redo:',
          click: () => {
            this.sendMenuCommand('redo');
          }
        },
        { type: 'separator' },
        { label: 'Shift Left', accelerator: 'Alt+Left',
          click: () => {
            this.sendMenuCommand('shift-screen-left');
          }
        },
        { label: 'Shift Right', accelerator: 'Alt+Right',
          click: () => {
            this.sendMenuCommand('shift-screen-right');
          }
        },
        { label: 'Shift Up', accelerator: 'Alt+Up',
          click: () => {
            this.sendMenuCommand('shift-screen-up');
          }
        },
        { label: 'Shift Down', accelerator: 'Alt+Down',
          click: () => {
            this.sendMenuCommand('shift-screen-down');
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
      !app.isPackaged ? subMenuViewDev : subMenuViewProd;

    return [subMenuAbout, subMenuFile, subMenuEdit, subMenuView, subMenuWindow, subMenuHelp];
  }

  buildDefaultTemplate() {
    const templateDefault = [
      {
        label: '&File',
        submenu: [
          { label: 'New',
            click: () => {
              this.sendMenuCommand('new');
            }
          },
          { label: 'New Screen', accelerator: 'Ctrl+T',
            click: () => {
              this.sendMenuCommand('new-screen');
            }
          },
          { type: 'separator' },
          { label: '&Open', accelerator: 'Ctrl+O',
            click: () => {
              this.sendMenuCommand('open');
            }
          },
          { type: 'separator' },
          { label: '&Save', accelerator: 'Ctrl+S',
            click: () => {
              this.sendMenuCommand('save');
            }
          },
          { label: 'Save As...', accelerator: 'Ctrl+Shift+S',
            click: () => {
              this.sendMenuCommand('save-as');
            }
          },
          { type: 'separator' },
          { label: 'Import',
            submenu: importers.map(decl => this.mkImportCmd(decl.label, decl.cmd))
          },
          { label: 'Export As',
            submenu: exporters.map(decl => this.mkExportCmd(decl.label, decl.cmd))
          },
          { type: 'separator' },
          { label: 'Fonts...',
            click: () => {
              this.sendMenuCommand('custom-fonts');
            }
          },
          { type: 'separator' },
          { label: 'E&xit',
            accelerator: 'CmdOrCtrl+Q',
            click: () => {
              app.quit();
            }
          },
        ]
      },
      {
        label: '&Edit',
        submenu: [
          { label: '&Undo', accelerator: 'Ctrl+Z', selector: 'undo:',
            click: () => {
              this.sendMenuCommand('undo');
            }
          },
          { label: '&Redo', accelerator: 'Ctrl+Y', selector: 'redo:',
            click: () => {
              this.sendMenuCommand('redo');
            }
          },
          { type: 'separator' },
          { label: 'Shift Left', accelerator: 'Alt+Left',
            click: () => {
              this.sendMenuCommand('shift-screen-left');
            }
          },
          { label: 'Shift Right', accelerator: 'Alt+Right',
            click: () => {
              this.sendMenuCommand('shift-screen-right');
            }
          },
          { label: 'Shift Up', accelerator: 'Alt+Up',
            click: () => {
              this.sendMenuCommand('shift-screen-up');
            }
          },
          { label: 'Shift Down', accelerator: 'Alt+Down',
            click: () => {
              this.sendMenuCommand('shift-screen-down');
            }
          },
          { type: 'separator' },
          { label: 'Preferences', accelerator: 'Ctrl+P',
            click: () => {
              this.sendMenuCommand('preferences');
            }
          }
        ]
      },
      {
        label: '&View',
        submenu:
          !app.isPackaged
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
          },
          { type: 'separator' },
          {
            label: 'About',
            click() {
              app.setAboutPanelOptions({
                applicationName: app.name,
                applicationVersion: app.getVersion(),
                copyright: "Copyright (c) 2018-2020, Janne Hellsten",
              });
              app.showAboutPanel();
            }
          },
        ]
      }
    ];

    return templateDefault;
  }
}
