require('./server');
const {app, BrowserWindow, ipcMain} = require('electron');
const contextMenu                   = require('electron-context-menu');
const {initialize, enable}          = require('@electron/remote/main')
const path                          = require('path');

initialize();

let mainWindow;
const createWindow = () => {
    mainWindow = new BrowserWindow({
        width         : 1500,
        height        : 1200,
        frame         : false,
        minWidth      : 1200,
        minHeight     : 750,
        webPreferences: {
            plugins                    : true,
            webSecurity                : false,
            allowRunningInsecureContent: true,
            nodeIntegration            : true,
            contextIsolation           : false,
            enableRemoteModule         : true,
        },
    });

    enable(mainWindow.webContents);

    mainWindow.maximize();
    mainWindow.show();
    mainWindow.loadURL(`file://${path.join(__dirname, 'index.html')}`);
    mainWindow.on('closed', () => { mainWindow = null });
};

app.on('ready', createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (mainWindow === null) createWindow(); });

ipcMain.on('app-quit', (evt, arg) => { app.quit(); });
ipcMain.on('app-reload', (event, arg) => { mainWindow.reload(); });


contextMenu({
    append: (params, browserWindow) => [
        // {
        //     label: 'DevTools', click(item, focusedWindow) {
        //         focusedWindow.toggleDevTools();
        //     },
        // },
        {
            label: 'Reload', click() {
                mainWindow.reload();
            },
        },
        {
            label: 'Quit', click() {
                mainWindow.destroy();
                app.quit();
            },
        },
    ],
});