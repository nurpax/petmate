
const {
    app,
    systemPreferences,
    BrowserWindow,
    shell,
    ipcMain,
    Menu
} = require('electron');
const MenuBuilder = require('./menu');

if (process.platform == 'darwin') {
    systemPreferences.setUserDefault('NSDisabledDictationMenuItem', 'boolean', true)
    systemPreferences.setUserDefault('NSDisabledCharacterPaletteMenuItem', 'boolean', true)
}

const path = require('path');

let mainWindow;

createWindow = () => {
    mainWindow = new BrowserWindow({
        backgroundColor: '#F7F7F7',
        minWidth: 880,
        show: false,
//		titleBarStyle: 'hidden',
        webPreferences: {
            webSecurity: false,
            nodeIntegration: true
        },
        width: 1100,
        height: 680,
        minWidth: 768,
        minHeight: 500
    });

    mainWindow.on('page-title-updated', (event, message) => {
        event.preventDefault()
    })
    mainWindow.setTitle('Petmate')

    mainWindow.loadURL(
        !app.isPackaged
            ? 'http://localhost:3000'
            : `file://${path.join(__dirname, '../build/index.html')}`,
    );

    // @TODO: Use 'ready-to-show' event
    //        https://github.com/electron/electron/blob/master/docs/api/browser-window.md#using-ready-to-show-event
    mainWindow.webContents.on('did-finish-load', () => {
        if (!mainWindow) {
            throw new Error('"mainWindow" is not defined');
        }
        mainWindow.show();
        mainWindow.focus();
    });

    if (!app.isPackaged) {
        const {
            default: installExtension,
            REACT_DEVELOPER_TOOLS,
            REDUX_DEVTOOLS,
        } = require('electron-devtools-installer');

        installExtension(REACT_DEVELOPER_TOOLS)
            .then(name => {
                console.log(`Added Extension: ${name}`);
            })
            .catch(err => {
                console.log('An error occurred: ', err);
            });

        installExtension(REDUX_DEVTOOLS)
            .then(name => {
                console.log(`Added Extension: ${name}`);
            })
            .catch(err => {
                console.log('An error occurred: ', err);
            });
    }

    mainWindow.once('ready-to-show', () => {
        mainWindow.show();

        ipcMain.on('open-external-window', (event, arg) => {
            shell.openExternal(arg);
        });
    });
};

app.on('ready', () => {
    createWindow();

    const menuBuilder = new MenuBuilder(mainWindow);
    menuBuilder.buildMenu();
});

app.on('window-all-closed', () => {
    app.quit();
});

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});

// Handle browser window set window title requests
ipcMain.on('set-title', (event, arg) => {
    mainWindow.setTitle(arg)
})

app.on('browser-window-blur', () => {
    mainWindow.webContents.send('window-blur')
})

ipcMain.on('load-page', (event, arg) => {
    mainWindow.loadURL(arg);
});
