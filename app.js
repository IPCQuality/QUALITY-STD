let database = [];
let currentProductionState = {};

// 1. Load Database
fetch('database.json')
    .then(response => response.json())
    .then(data => {
        database = data;
    })
    .catch(error => {
        console.error("Gagal memuat database.json. Pastikan berjalan di server/localhost.", error);
    });

// 2. Sistem Pintar Waktu & Shift
const namaBulanSingkat = ['JAN', 'FEB', 'MAR', 'APR', 'MEI', 'JUN', 'JUL', 'AGU', 'SEP', 'OKT', 'NOV', 'DES'];
const pad = (num) => String(num).padStart(2, '0');

function updateClock() {
    const now = new Date();
    const day = now.getDay(); // 0 = Minggu, 6 = Sabtu
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const timeFloat = hours + minutes / 60;

    let shiftNum = 1;
    let shiftTxt = 'A'; // A, B, C menyesuaikan shift 1, 2, 3

    // Penentuan Shift
    if (day === 6) { 
        // Jadwal Hari Sabtu
        if (timeFloat >= 6 && timeFloat < 11) { shiftNum = 1; shiftTxt = 'A'; }
        else if (timeFloat >= 11 && timeFloat < 16) { shiftNum = 2; shiftTxt = 'B'; }
        else if (timeFloat >= 16 && timeFloat < 21) { shiftNum = 3; shiftTxt = 'C'; }
        else { shiftNum = 3; shiftTxt = 'C'; } // Di luar jam, ikut shift terakhir
    } else {
        // Jadwal Reguler (Senin - Jumat / Minggu)
        if (timeFloat >= 6 && timeFloat < 14) { shiftNum = 1; shiftTxt = 'A'; }
        else if (timeFloat >= 14 && timeFloat < 22) { shiftNum = 2; shiftTxt = 'B'; }
        else { shiftNum = 3; shiftTxt = 'C'; }
    }

    // Penentuan Tanggal Produksi (Batas pukul 06:00 pagi)
    // Shift 3 yang lewat tengah malam (00:00 - 06:00) masih menggunakan tanggal kemarin
    let prodDate = new Date(now);
    if (hours < 6) {
        prodDate.setDate(prodDate.getDate() - 1);
    }

    // Tanggal Expired (Contoh: +2 tahun)
    let exp2Date = new Date(prodDate);
    exp2Date.setFullYear(exp2Date.getFullYear() + 2);

    // Simpan State Produksi untuk diakses saat mencari format
    currentProductionState = {
        now: now,
        prodDate: prodDate,
        exp2Date: exp2Date,
        shiftNum: shiftNum,
        shiftTxt: shiftTxt,
        timeFormatted: pad(hours) + ':' + pad(minutes)
    };

    // Update UI Jam
    document.getElementById('clockDisplay').textContent = 
        pad(now.getHours()) + ':' + pad(now.getMinutes()) + ':' + pad(now.getSeconds());
    document.getElementById('dateDisplay').textContent = 
        pad(now.getDate()) + ' ' + namaBulanSingkat[now.getMonth()] + ' ' + now.getFullYear();
    document.getElementById('shiftDisplay').textContent = `Shift ${shiftNum}`;
}

setInterval(updateClock, 1000);
updateClock();

// 3. Engine Pengganti Variabel Cerdas
function injectVariables(formatString, mesin) {
    if (!formatString) return '-';
    
    const { prodDate, exp2Date, shiftNum, shiftTxt, timeFormatted } = currentProductionState;
    const mesinUpper = mesin.toUpperCase() || '';

    // Kumpulan kamus variabel mengikuti standar VARIABLE.csv
    const vars = {
        "{DD}": pad(prodDate.getDate()),
        "{MM}": pad(prodDate.getMonth() + 1),
        "{MMM}": namaBulanSingkat[prodDate.getMonth()],
        "{YY}": String(prodDate.getFullYear()).slice(-2),
        "{YYYY}": prodDate.getFullYear(),
        "{DDMMYY}": `${pad(prodDate.getDate())}${pad(prodDate.getMonth() + 1)}${String(prodDate.getFullYear()).slice(-2)}`,
        "{DDMMYYYY}": `${pad(prodDate.getDate())}${pad(prodDate.getMonth() + 1)}${prodDate.getFullYear()}`,
        
        // Expired Date (2 Tahun)
        "{EXP2_MMM}": namaBulanSingkat[exp2Date.getMonth()],
        "{EXP2_YYYY}": exp2Date.getFullYear(),
        "{EXP2_DDMMYY}": `${pad(exp2Date.getDate())}${pad(exp2Date.getMonth() + 1)}${String(exp2Date.getFullYear()).slice(-2)}`,
        "{EXP2_DDMMYYYY}": `${pad(exp2Date.getDate())}${pad(exp2Date.getMonth() + 1)}${exp2Date.getFullYear()}`,
        
        // Shift & Mesin
        "{NUM_SHIFT}": shiftNum,
        "{TXT_SHIFT}": shiftTxt,
        "{MC}": mesinUpper,
        "{LINE}": mesinUpper,
        "{TIMEPOUCH}": timeFormatted
    };

    let hasil = formatString;
    // Replace spesifik kata "TIME" (sesuai instruksi PRODUK.csv) jika tidak ada kurung kurawal
    hasil = hasil.replace(/\bTIME\b/g, timeFormatted); 
    
    // Ganti newline \n menjadi br tag untuk HTML
    hasil = hasil.replace(/\\n/g, '\n').replace(/\n/g, '<br>');

    // Inject semua variabel di kurung kurawal
    for (const [key, value] of Object.entries(vars)) {
        hasil = hasil.split(key).join(value);
    }
    
    return hasil;
}

// 4. Pencarian dan Rendering
document.getElementById('searchForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const midInput = document.getElementById('mid').value.trim();
    const mesinInput = document.getElementById('mesin').value.trim();
    
    const resultCard = document.getElementById('resultCard');
    const errorCard = document.getElementById('errorCard');

    // Pencarian di Database JSON
    const dataRow = database.find(item => item.MID === midInput);

    if (dataRow) {
        // Tampilkan Hasil
        document.getElementById('resMid').textContent = dataRow.MID;
        document.getElementById('resDeskripsi').textContent = dataRow.DESKRIPSI;
        
        document.getElementById('resPrimer').innerHTML = injectVariables(dataRow.PRIMER, mesinInput);
        document.getElementById('resSekunder').innerHTML = injectVariables(dataRow.SEKUNDER, mesinInput);
        
        document.getElementById('resKeterangan').textContent = dataRow.KETERANGAN || '-';

        // Logika Tampil Jumlah RCG (Hanya jika lebih dari 1)
        const rcgElement = document.getElementById('rcgContainer');
        const rcgValue = parseInt(dataRow.JUMLAH_RCG) || 0;
        
        if (rcgValue > 1) {
            rcgElement.classList.remove('hidden');
            document.getElementById('resRcg').textContent = rcgValue;
        } else {
            rcgElement.classList.add('hidden');
        }

        errorCard.classList.add('hidden');
        resultCard.classList.remove('hidden');
    } else {
        // Jika tidak ditemukan
        errorCard.classList.remove('hidden');
        resultCard.classList.add('hidden');
    }
});