const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
try {
  if (require('electron-squirrel-startup')) {
    app.quit();
  }
} catch (e) {
  console.log('No electron-squirrel-startup found, continuing...');
}
function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 960,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      // It's recommended to keep nodeIntegration false and contextIsolation true for security.
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }

  // Open the DevTools for debugging, you can remove this in production.
  // mainWindow.webContents.openDevTools();
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set up IPC handlers for file operations
  ipcMain.handle('save-project', async (event, data, defaultPath) => {
    const window = BrowserWindow.getFocusedWindow();
    const { filePath } = await dialog.showSaveDialog(window, {
      title: 'Save Project',
      defaultPath: defaultPath || 'photolog-project.json',
      filters: [{ name: 'JSON Files', extensions: ['json'] }],
    });

    if (filePath) {
      try {
        fs.writeFileSync(filePath, data);
        return { success: true, path: filePath };
      } catch (err) {
        console.error('Failed to save project file:', err);
        return { success: false, error: err.message };
      }
    }
    return { success: false };
  });

  ipcMain.handle('load-project', async () => {
    const window = BrowserWindow.getFocusedWindow();
    const { filePaths } = await dialog.showOpenDialog(window, {
      title: 'Open Project',
      properties: ['openFile'],
      filters: [{ name: 'JSON Files', extensions: ['json'] }],
    });

    if (filePaths && filePaths.length > 0) {
      try {
        const data = fs.readFileSync(filePaths[0], 'utf-8');
        return data;
      } catch (err) {
        console.error('Failed to read project file:', err);
        return null;
      }
    }
    return null;
  });

  ipcMain.handle('save-pdf', async (event, data, defaultPath) => {
    const window = BrowserWindow.getFocusedWindow();
    const { filePath } = await dialog.showSaveDialog(window, {
      title: 'Save PDF',
      defaultPath: defaultPath || 'photolog.pdf',
      filters: [{ name: 'PDF Files', extensions: ['pdf'] }],
    });

    if (filePath) {
      try {
        fs.writeFileSync(filePath, Buffer.from(data));
        return { success: true, path: filePath };
      } catch (err) {
        console.error('Failed to save PDF file:', err);
        return { success: false, error: err.message };
      }
    }
    return { success: false };
  });


  createWindow();

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
