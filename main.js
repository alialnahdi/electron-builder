const { app, BrowserWindow, ipcMain } = require('electron');
const { autoUpdater } = require('electron-updater');
const log = require('electron-log');

autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';

let mainWindow;
function createWindow() {
  if (process.platform === 'win32') {
    app.setAppUserModelId('com.alialnahdi.autoupdate');
  }
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });
  mainWindow.loadFile('index.html');
}

app.whenReady().then(() => {
  createWindow();
  ipcMain.handle('get-app-version', () => app.getVersion());
  autoUpdater.checkForUpdates();
});

// بدء التنزيل عند الطلب من الواجهة
ipcMain.handle('download_update', () => {
  autoUpdater.downloadUpdate();
});

// عند انتهاء التنزيل: يثبّت ويعيد تشغيل
autoUpdater.on('update-downloaded', () => {
  // مباشرة نثبت ثم نُعيد تشغيل
  autoUpdater.quitAndInstall();
});

// (تبقى بقية الأحداث للتسجيل في السجلّات فقط)
autoUpdater.on('checking-for-update', () => log.info('Checking for updates…'));
autoUpdater.on('update-available', info => {
  log.info(`Update available: ${info.version}`);
  if (mainWindow) mainWindow.webContents.send('update_available', info.version);
});
autoUpdater.on('update-not-available', () => log.info('No updates available.'));
autoUpdater.on('download-progress', progress => {
  log.info(`Download ${Math.round(progress.percent)}%`);
  if (mainWindow) mainWindow.setProgressBar(progress.percent / 100);
});
autoUpdater.on('error', err => log.error('Auto-updater error:', err));

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
