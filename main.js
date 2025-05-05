// main.js
const { app, BrowserWindow, dialog, ipcMain } = require('electron')
const { autoUpdater } = require('electron-updater')
const path = require('path')

let mainWindow

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  })
  mainWindow.loadFile('index.html')
}

app.whenReady().then(() => {
  createWindow()

  // IPC: يرد على طلب version من الـ renderer
  ipcMain.handle('get-app-version', () => {
    return app.getVersion()
  })

  // فحص التحديثات وتنزيلها تلقائياً ثم إشعار المستخدم
  autoUpdater.checkForUpdatesAndNotify()
})

// أحداث التحديث
autoUpdater.on('checking-for-update', () => {
  console.log('Checking for updates...')
})

autoUpdater.on('update-available', info => {
  dialog.showMessageBox({
    type: 'info',
    title: 'تحديث متوفر',
    message: `الإصدار ${info.version} جاهز للتحميل.`,
  })
})

autoUpdater.on('update-not-available', () => {
  console.log('No updates available.')
})

autoUpdater.on('download-progress', progress => {
  console.log(`Download ${Math.round(progress.percent)}%`)
  if (mainWindow) {
    mainWindow.setProgressBar(progress.percent / 100)
  }
})

autoUpdater.on('update-downloaded', () => {
  dialog.showMessageBox({
    type: 'question',
    buttons: ['نعم','لا'],
    defaultId: 0,
    title: 'تثبيت التحديث',
    message: 'تم تنزيل التحديث. هل تريد إعادة تشغيل التطبيق للتثبيت الآن؟'
  }).then(({ response }) => {
    if (response === 0) {
      autoUpdater.quitAndInstall()
    }
  })
})

autoUpdater.on('error', err => {
  console.error('Auto-updater error:', err)
})

// إنهاء التطبيق
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})
