// main.js

const { app, BrowserWindow, ipcMain, dialog, screen } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;
let timerId;

// Load konfigurasi dari file JSON
const configPath = path.join(__dirname, 'config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
const intervalInMinutes = config.scheduler.interval_minutes || 30;

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

        // Ubah lokasi penyimpanan ke direktori root aplikasi
        const csvFilePath = path.join(__dirname, filename);

        const header = 'Date,Nama,Project,Task,Sub Task,Location,Quantity,Aktivitas\n';

        const [nama, project, task, location, activity] = data;
        const date = today.toLocaleDateString('en-US'); // Format MM/DD/YYYY
        const quantity = formatDuration(intervalInMinutes);

        const row = `"${date}","${nama}","${project}","${task}","","${location}","${quantity}","${activity.replace(/"/g, '""')}"\n`;

        // Cek apakah file sudah ada atau belum untuk menambahkan header
        if (!fs.existsSync(csvFilePath)) {
            fs.writeFileSync(csvFilePath, header, 'utf-8');
        }

        // Menambahkan data baru ke file
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