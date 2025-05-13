const { app, BrowserWindow, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
let mainWindow;
let backendProcess;
let serverReady = false;

function isDev() {
    return !app.isPackaged;
}

function getBackendPath() {
    if (isDev()) {
        return path.join(__dirname, 'backend', 'FoodStats.exe');
    }
    return path.join(process.resourcesPath, 'backend', 'FoodStats.exe');
}

function waitForServer(callback) {
    const maxAttempts = 30; // 30 attempts = 15 seconds
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
                    setTimeout(checkServer, 500); // Check every 500ms
                } else {
                    dialog.showErrorBox(
                        'Server Error',
                        'Could not connect to the backend server. Please restart the application.'
                    );
                    app.quit();
                }
            });
    };

    setTimeout(checkServer, 1000); // Give the server a second to start
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        },
        show: false // Don't show window until server is ready
    });

    mainWindow.loadFile(path.join(__dirname, 'frontend/index.html'));

    // Only show window when server is ready
    waitForServer(() => {
        mainWindow.show();
    });
}

function startBackend() {
    const backendPath = getBackendPath();
    console.log('Starting backend from:', backendPath);

    const backendDir = path.dirname(backendPath);

    backendProcess = spawn(backendPath, [], {
        cwd: backendDir
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
            'Failed to start the backend server. Please check if the server executable exists.'
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
    createWindow();

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
    app.isQuitting = true;
    if (backendProcess) {
        backendProcess.kill();
    }
});