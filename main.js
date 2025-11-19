const { app, BrowserWindow, ipcMain, dialog, screen } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;
let timerId;
let config;

// Fungsi untuk memuat konfigurasi dari lokasi yang benar
function loadConfig() {
  const timesheetsDir = path.join(app.getPath('home'), 'timesheets');
  const userConfigPath = path.join(timesheetsDir, 'config.json');

  if (!fs.existsSync(timesheetsDir)) {
    fs.mkdirSync(timesheetsDir);
  }

  if (fs.existsSync(userConfigPath)) {
    config = JSON.parse(fs.readFileSync(userConfigPath, 'utf-8'));
  } else {
    const defaultConfigPath = path.join(__dirname, 'config.json');
    config = JSON.parse(fs.readFileSync(defaultConfigPath, 'utf-8'));
    fs.writeFileSync(userConfigPath, JSON.stringify(config, null, 2));
  }
}

function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  mainWindow = new BrowserWindow({
    width,
    height,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    icon: path.join(__dirname, 'assets', 'icon.png'), // <- update custom icon di sini
    frame: false,
    alwaysOnTop: true,
    show: false,
    resizable: false,
  });

  mainWindow.loadFile('index.html');
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  app.setLoginItemSettings({
    openAtLogin: true
  });

  ipcMain.on('close-window', () => {
    mainWindow.hide();
  });

  function formatDuration(minutes) {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    const pad = (num) => String(num).padStart(2, '0');
    return `${pad(hours)}:${pad(remainingMinutes)}`;
  }

  function formatQuantity(minutes) {
    return (minutes / 60).toString();
  }

  function getIndonesianMonthName(date) {
    const monthNames = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    return monthNames[date.getMonth()];
  }

  ipcMain.on('save-activity', (event, data) => {
    if (process.platform === 'darwin') {
      mainWindow.minimize();
    } else {
      mainWindow.hide();
    }

    const today = new Date();
    const monthName = getIndonesianMonthName(today);
    const filename = `${monthName}-timesheets.csv`;
    const timesheetsDir = path.join(app.getPath('home'), 'timesheets');
    const csvFilePath = path.join(timesheetsDir, filename);

    const header = 'Date,Employee,Project,Task,Sub Task,Location,Quantity,Activity\n';
    
    const [nama, project, task, location, activity] = data;
    const date = today.toLocaleDateString('en-US'); 
    const intervalInMinutes = config.scheduler.interval_minutes || 30;
    const quantity = formatQuantity(intervalInMinutes); // sudah aturan baru
    
    const row = `"${date}","${nama}","${project}","${task}","","${location}","${quantity}","${activity.replace(/"/g, '""')}"\n`;

    if (!fs.existsSync(csvFilePath)) {
      fs.writeFileSync(csvFilePath, header, 'utf-8');
    }

    fs.appendFile(csvFilePath, row, (err) => {
      if (err) {
        console.error('Gagal menulis file CSV:', err);
        dialog.showErrorBox('Gagal Menyimpan', 'Terjadi kesalahan saat menyimpan file.');
      } else {
        console.log('Data berhasil disimpan ke ' + csvFilePath);
      }
    });
  });
}

function startScheduler() {
  clearInterval(timerId);
  const intervalInMinutes = config.scheduler.interval_minutes || 30;
  const intervalInMilliseconds = intervalInMinutes * 60 * 1000;
  
  timerId = setInterval(() => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.show();
      mainWindow.focus();
    }
  }, intervalInMilliseconds);
}

ipcMain.handle('get-config', () => {
  return config;
});

app.whenReady().then(() => {
  loadConfig();
  createWindow();
  startScheduler();
  
  app.on('activate', () => {
    if (mainWindow) {
      if (!mainWindow.isVisible()) {
        mainWindow.show();
      }
      mainWindow.focus();
    } else {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  // Biarkan proses tetap berjalan di latar belakang
  // Jangan panggil app.quit()
});
