let globalData = {};

// Load JSON Data
fetch('data.json')
  .then(res => res.json())
  .then(data => {
    globalData = data;
    setupMesinAutocomplete(data.machines);
  })
  .catch(err => console.error("Gagal memuat data database:", err));

// Autocomplete Mesin
function setupMesinAutocomplete(machines) {
  const input = document.getElementById('mesinInput');
  const dropdown = document.getElementById('mesinDropdown');

  input.addEventListener('input', () => {
    const val = input.value.toLowerCase();
    dropdown.innerHTML = '';
    if (!val) {
      dropdown.classList.add('hidden');
      return;
    }

    const filtered = machines.filter(m => m.toLowerCase().includes(val));
    if (filtered.length > 0) {
      dropdown.classList.remove('hidden');
      filtered.forEach(item => {
        const div = document.createElement('div');
        div.className = 'dropdown-item';
        div.textContent = item;
        div.onclick = () => {
          input.value = item;
          dropdown.classList.add('hidden');
        };
        dropdown.appendChild(div);
      });
    } else {
      dropdown.classList.add('hidden');
    }
  });
}

// Tombol Cari Standar
document.getElementById('searchBtn').addEventListener('click', () => {
  const mid = document.getElementById('midInput').value.trim();
  const tanggal = document.getElementById('tanggalInput').value;
  const shift = document.getElementById('shiftInput').value;
  const mesin = document.getElementById('mesinInput').value.trim();

  if (!mid || !tanggal || !shift || !mesin) {
    alert("Harap lengkapi semua kolom pencarian (MID, Tanggal, Shift, dan Mesin)!");
    return;
  }

  // Cari produk berdasarkan MID
  const found = globalData.products.find(p => p.mid === mid);
  const resultSection = document.getElementById('resultSection');

  if (found) {
    document.getElementById('resInkjet1').textContent = found.inkjet.line1.replace('[DD]-[MM]-[YYYY]', tanggal);
    document.getElementById('resInkjet2').textContent = found.inkjet.line2.replace('[Shift]', shift).replace('[Mesin]', mesin);
    document.getElementById('resInkjet3').textContent = found.inkjet.line3;
    document.getElementById('resEmboss').textContent = found.emboss;

    if (found.noteText) {
      document.getElementById('formatNoteBox').classList.remove('hidden');
      document.getElementById('noteKey').textContent = found.noteKey + ":";
      document.getElementById('noteText').textContent = found.noteText;
    } else {
      document.getElementById('formatNoteBox').classList.add('hidden');
    }

    resultSection.classList.remove('hidden');
    resultSection.scrollIntoView({ behavior: 'smooth' });
  } else {
    alert("Data dengan MID tersebut tidak ditemukan di sistem L3.");
    resultSection.classList.add('hidden');
  }
});

// Tombol Print
document.getElementById('printBtn').addEventListener('click', () => {
  window.print();
});
