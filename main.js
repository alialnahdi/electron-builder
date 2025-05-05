const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const log = require('electron-log');

// ضبط l ogger للـ auto-updater
autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';

let mainWindow;

function createWindow() {
  // على ويندوز: تأكد من تطابق الـ AppUserModelId مع الـ appId في build config
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

  // IPC للنسخة
  ipcMain.handle('get-app-version', () => {
    return app.getVersion();
  });

  // فحص وتنبيه بالتحديثات
  autoUpdater.checkForUpdatesAndNotify();
});

// IPC لإعادة التشغيل بعد التنزيل
ipcMain.handle('restart_app', () => {
  autoUpdater.quitAndInstall();
});

// أحداث الـ auto-updater
autoUpdater.on('checking-for-update', () => {
  log.info('Checking for updates…');
});

autoUpdater.on('update-available', info => {
  log.info(`Update available: ${info.version}`);
  if (mainWindow) {
    mainWindow.webContents.send('update_available', info.version);
  }
});

autoUpdater.on('update-not-available', () => {
  log.info('No updates available.');
});

autoUpdater.on('download-progress', progress => {
  log.info(`Download ${Math.round(progress.percent)}%`);
  if (mainWindow) {
    mainWindow.setProgressBar(progress.percent / 100);
  }
});

autoUpdater.on('update-downloaded', () => {
  log.info('Update downloaded');
  if (mainWindow) {
    mainWindow.webContents.send('update_downloaded');
  }
});

autoUpdater.on('error', err => {
  log.error('Auto-updater error:', err);
});

// إنهاء التطبيق
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
