// Copyright (c) 2025 @drclcomputers. All rights reserved.
//
// This work is licensed under the terms of the MIT license.
// For a copy, see <https://opensource.org/licenses/MIT>.

const os = require('os');
const { app, BrowserWindow, dialog, ipcMain, nativeTheme } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

const sessionFile = path.join(os.tmpdir(), '.foodstats_session');

let mainWindow;
let backendProcess;
let serverReady = false;

function isDev() {
    return !app.isPackaged;
}

function getBackendPath() {
    const platform = process.platform;
    const executableName = platform === 'win32' ? 'FoodStats.exe' : 'FoodStats';

    if (isDev()) {
        return path.join(__dirname, 'backend', executableName);
    }
    return path.join(process.resourcesPath, 'backend', executableName);
}

function waitForServer(callback) {
    const maxAttempts = 20;
    let attempts = 0;

    const checkServer = () => {
        fetch('http://localhost:8080/api/ingredients')
            .then(() => {
                serverReady = true;
                callback();
            })
            .catch(() => {
                attempts++;
                if (attempts < maxAttempts) {
                    setTimeout(checkServer, 400); // Check every 500ms
                } else {
                    dialog.showErrorBox(
                        'Server Error',
                        'Could not connect to the backend server. Please restart the application.'
                    );
                    app.quit();
                }
            });
    };

    setTimeout(checkServer, 1000);
}

function createWindow() {
    if (!fs.existsSync(sessionFile)) {
        fs.writeFileSync(sessionFile, 'active', { flag: 'w' });
    }

    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        show: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
            //preload: path.join(__dirname, 'preload.js')
        },
    });

    mainWindow.loadFile(path.join(__dirname, 'frontend/index.html'));

    mainWindow.webContents.on('did-finish-load', () => {
        mainWindow.webContents.executeJavaScript(`
            (function() {
                try {
                    const fs = require('fs');
                    const os = require('os');
                    const path = require('path');
                    const sessionFile = path.join(os.tmpdir(), '.foodstats_session');
                    if (fs.existsSync(sessionFile)) {
                        localStorage.removeItem('currentRecipe');
                        try { fs.unlinkSync(sessionFile); } catch {}
                    }
                } catch (e) { /* ignore */ }
            })();
        `);
});

    waitForServer(() => {
        if (mainWindow) {
            mainWindow.show();
        }
    });

    mainWindow.webContents.on('did-fail-load', () => {
        dialog.showErrorBox(
            'Loading Error',
            'Failed to load the application interface.'
        );
    });

    if (!fs.existsSync(sessionFile)) {
        fs.writeFileSync(sessionFile, 'active', { flag: 'w' });
    }
}

function startBackend() {
    const backendPath = getBackendPath();
    const backendDir = path.dirname(backendPath);

    if (process.platform !== 'win32') {
        try {
            fs.chmodSync(backendPath, '755');
        } catch (err) {
            console.error('Error making backend executable:', err);
        }
    }

    console.log('Starting backend from:', backendPath);
    console.log('Backend directory:', backendDir);
    console.log('Working directory:', process.cwd());

    if (!isDev()) {
        const dbSource = path.join(process.resourcesPath, 'database', 'nutrition_data.db');
        const dbDest = path.join(backendDir, 'database', 'nutrition_data.db');

        fs.mkdirSync(path.join(backendDir, 'database'), { recursive: true });

        try {
            fs.copyFileSync(dbSource, dbDest);
            console.log('Database copied successfully');
        } catch (err) {
            console.error('Error copying database:', err);
        }
    }

    backendProcess = spawn(backendPath, [], {
        cwd: backendDir,
        windowsHide: false
    });


    backendProcess.stdout.on('data', (data) => {
        console.log(`Backend output: ${data}`);
    });

    backendProcess.stderr.on('data', (data) => {
        console.error(`Backend error: ${data}`);
    });

    backendProcess.on('error', (err) => {
        console.error('Failed to start backend:', err);
        dialog.showErrorBox(
            'Server Error',
            'Failed to start the backend server. Error: ' + err.message
        );
        app.quit();
    });

    backendProcess.on('close', (code) => {
        if (code !== 0 && !app.isQuitting) {
            dialog.showErrorBox(
                'Server Error',
                'The backend server stopped unexpectedly. Please restart the application.'
            );
            app.quit();
        }
    });
}

app.whenReady().then(() => {
    startBackend();
    setTimeout(createWindow, 1000);

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.isQuitting = true;
        if (backendProcess) {
            backendProcess.kill();
        }
        app.quit();
    }
});

app.on('before-quit', () => {
    try { fs.unlinkSync(sessionFile); } catch {}
    app.isQuitting = true;
    if (backendProcess) {
        backendProcess.kill();
    }
});

ipcMain.handle('dark-mode:toggle', () => {
    if (nativeTheme.shouldUseDarkColors) {
        nativeTheme.themeSource = 'light';
    } else {
        nativeTheme.themeSource = 'dark';
    }
    return nativeTheme.shouldUseDarkColors;
});

ipcMain.handle('dark-mode:system', () => {
    nativeTheme.themeSource = 'system';
});
