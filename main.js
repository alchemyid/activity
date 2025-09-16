// main.js

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
    // Gunakan width dan height layar untuk ukuran jendela
    width,
    height,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    frame: false, // Jendela tanpa border
    alwaysOnTop: true, // Pastikan jendela selalu di atas
    show: true, // Ubah menjadi TRUE agar jendela langsung muncul
    resizable: false, // Jendela tidak dapat diubah ukurannya
  });

  mainWindow.loadFile('index.html');
  
  // Panggil startScheduler() langsung setelah jendela dibuat
  startScheduler();

  app.setLoginItemSettings({
    openAtLogin: true,
    path: process.execPath,
    args: ['--processStart', `"${path.basename(process.execPath)}"`]
  });

  ipcMain.on('close-window', () => {
    // Sembunyikan jendela saat tombol 'Tutup' diklik
    mainWindow.hide();
  });

  function formatDuration(minutes) {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    const pad = (num) => String(num).padStart(2, '0');
    return `${pad(hours)}:${pad(remainingMinutes)}`;
  }

  function getIndonesianMonthName(date) {
    const monthNames = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    return monthNames[date.getMonth()];
  }

  ipcMain.on('save-activity', (event, data) => {
    // Segera sembunyikan atau minimize jendela setelah tombol Simpan ditekan
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

    const header = 'Date,Nama,Project,Task,Sub Task,Location,Quantity,Activity\n';
    
    const [nama, project, task, location, activity] = data;
    const date = today.toLocaleDateString('en-US'); 
    const intervalInMinutes = config.scheduler.interval_minutes || 30;
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
  const intervalInMinutes = config.scheduler.interval_minutes || 30;
  const intervalInMilliseconds = intervalInMinutes * 60 * 1000;
  timerId = setInterval(() => {
    if (mainWindow && !mainWindow.isDestroyed() && !mainWindow.isVisible()) {
      // Gunakan show() untuk menampilkan kembali jendela
      mainWindow.show();
      // Tambahkan fokus agar jendela muncul di atas semua aplikasi
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

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// HAPUS BLOK KODE INI
// app.on('window-all-closed', () => {
//   if (process.platform !== 'darwin') {
//     app.quit();
//   }
// });