const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const log = require('electron-log');

autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';

let mainWindow;
function createWindow() {
  if (process.platform === 'win32') {
    app.setAppUserModelId('com.alialnahdi.autoupdate');
  }
  mainWindow = new BrowserWindow({
    width: 800, height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });
  mainWindow.loadFile('index.html');
  // فتح DevTools مؤقتاً لتصحيح:
  // mainWindow.webContents.openDevTools();
}

app.whenReady().then(() => {
  createWindow();
  ipcMain.handle('get-app-version', () => app.getVersion());

  // ⚠️ فقط فحص التحديث، دون تحميل تلقائي
  autoUpdater.checkForUpdates();
});

// يستجيب لزرّ التحميل من الـ renderer
ipcMain.handle('download_update', () => {
  autoUpdater.downloadUpdate();
});

// باقي أحداث الـ autoUpdater تبقى كما هي...
autoUpdater.on('checking-for-update', () => log.info('Checking for updates…'));
autoUpdater.on('update-available', info => {
  log.info(`Update available: ${info.version}`);
  if (mainWindow) {
    mainWindow.webContents.send('update_available', info.version);
  }
});
autoUpdater.on('update-not-available', () => log.info('No updates available.'));
autoUpdater.on('download-progress', progress => {
  log.info(`Download ${Math.round(progress.percent)}%`);
  if (mainWindow) mainWindow.setProgressBar(progress.percent / 100);
});
autoUpdater.on('update-downloaded', () => {
  log.info('Update downloaded');
  if (mainWindow) mainWindow.webContents.send('update_downloaded');
});
autoUpdater.on('error', err => log.error('Auto-updater error:', err));

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
