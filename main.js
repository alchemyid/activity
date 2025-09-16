// main.js

const { app, BrowserWindow, ipcMain, dialog, screen } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;
let timerId;
let config; // Variabel global untuk menyimpan konfigurasi

// Fungsi untuk memuat konfigurasi dari lokasi yang benar
function loadConfig() {
  // 1. Tentukan jalur ke folder timesheets di direktori home pengguna
  const timesheetsDir = path.join(app.getPath('home'), 'timesheets');
  const userConfigPath = path.join(timesheetsDir, 'config.json');

  // 2. Buat direktori jika belum ada
  if (!fs.existsSync(timesheetsDir)) {
    fs.mkdirSync(timesheetsDir);
  }

  // 3. Cek apakah file konfigurasi pengguna sudah ada
  if (fs.existsSync(userConfigPath)) {
    // Jika ada, muat dari direktori pengguna
    config = JSON.parse(fs.readFileSync(userConfigPath, 'utf-8'));
  } else {
    // Jika tidak ada, muat dari bundel aplikasi (default) dan salin
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
    frame: false,
    alwaysOnTop: true,
    fullscreen: true,
    show: false,
    resizable: false,
  });

  mainWindow.loadFile('index.html');

  mainWindow.once('ready-to-show', () => {
    startScheduler();
  });
  
  app.setLoginItemSettings({
    openAtLogin: true,
    path: process.execPath,
    args: ['--processStart', `"${path.basename(process.execPath)}"`]
  });

  // Listener dari renderer process untuk menutup jendela
  ipcMain.on('close-window', () => {
    mainWindow.hide();
  });

  // Fungsi untuk memformat durasi menjadi HH:MM
  function formatDuration(minutes) {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    const pad = (num) => String(num).padStart(2, '0');
    return `${pad(hours)}:${pad(remainingMinutes)}`;
  }

  // Fungsi untuk mendapatkan nama bulan dalam bahasa Indonesia
  function getIndonesianMonthName(date) {
    const monthNames = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    return monthNames[date.getMonth()];
  }

  // Listener dari renderer process untuk menyimpan aktivitas
  ipcMain.on('save-activity', (event, data) => {
    const today = new Date();
    const monthName = getIndonesianMonthName(today);
    const filename = `${monthName}-timesheets.csv`;
    const timesheetsDir = path.join(app.getPath('home'), 'timesheets');
    const csvFilePath = path.join(timesheetsDir, filename);

    const header = 'Date,Nama,Project,Task,Sub Task,Location,Quantity,Activity\n';
    
    const [nama, project, task, location, activity] = data;
    const date = today.toLocaleDateString('en-US'); // Format MM/DD/YYYY
    const intervalInMinutes = config.scheduler.interval_minutes || 30; // Ambil nilai dari konfigurasi
    const quantity = formatDuration(intervalInMinutes);
    
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
  const intervalInMinutes = config.scheduler.interval_minutes || 30; // Ambil nilai dari konfigurasi
  const intervalInMilliseconds = intervalInMinutes * 60 * 1000;
  timerId = setInterval(() => {
    if (!mainWindow.isVisible()) {
      mainWindow.show();
    }
  }, intervalInMilliseconds);
}

// Tambahkan data konfigurasi ke renderer
ipcMain.handle('get-config', () => {
  return config;
});

app.whenReady().then(() => {
  loadConfig(); // Panggil loadConfig() di sini
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
