// Uji untuk hijri.js. Jalankan:  node tes-hijriah.js
// Memuat hijri.js apa adanya (tanpa peramban), lalu memeriksa:
//   1. sifat dasar kalender: panjang bulan 29/30 hari, hari berurutan, tahun naik setelah bulan ke-12;
//   2. uji regresi: beberapa tanggal yang hasilnya dicatat dari versi saat ini (BUKAN dari tabel resmi,
//      jadi bila sengaja mengubah kriteria, perbarui nilainya).
const fs = require('fs'), vm = require('vm'), path = require('path');
const konteks = { Math, Date, Intl, Map, Set, Object, Array, Number, String };
vm.createContext(konteks);
vm.runInContext(fs.readFileSync(path.join(__dirname, 'hijri.js'), 'utf8'), konteks);
const hijriah = (metode, y, m, d, koreksi = 0) =>
    vm.runInContext(`metodeHijriah=${JSON.stringify(metode)};koreksiHari=${koreksi};tanggalHijriah(${y},${m},${d})`, konteks);

let gagal = 0;
const cek = (ok, pesan) => { if (!ok) { gagal++; console.log('GAGAL:', pesan); } };

// 1. Sifat dasar, 2024-2032, semua metode
for (const metode of ['mu', 'kg', 'uq']) {
    let sebelum = null, panjangBulan = 0;
    for (let t = Date.UTC(2024, 0, 1); t < Date.UTC(2032, 0, 1); t += 864e5) {
        const x = new Date(t), tgl = hijriah(metode, x.getUTCFullYear(), x.getUTCMonth() + 1, x.getUTCDate());
        cek(tgl && tgl.d >= 1 && tgl.d <= 30 && tgl.m >= 1 && tgl.m <= 12, `${metode} ${x.toISOString().slice(0, 10)}: ${JSON.stringify(tgl)}`);
        if (sebelum && tgl.d !== 1) {
            cek(tgl.d === sebelum.d + 1 && tgl.m === sebelum.m && tgl.y === sebelum.y, `${metode} lompat di ${x.toISOString().slice(0, 10)}`);
        } else if (sebelum) {
            cek(panjangBulan === 29 || panjangBulan === 30, `${metode} bulan ${sebelum.m}/${sebelum.y} berumur ${panjangBulan} hari`);
            const bulanBerikut = sebelum.m % 12 + 1, tahunBerikut = sebelum.y + (sebelum.m === 12 ? 1 : 0);
            cek(tgl.m === bulanBerikut && tgl.y === tahunBerikut, `${metode} urutan bulan salah di ${x.toISOString().slice(0, 10)}`);
        }
        panjangBulan = tgl.d; sebelum = tgl;
    }
}

// 2. Regresi
const catatan = [
    ['mu', 2026, 6, 17, '2/1/1448'], ['mu', 2026, 11, 22, '13/6/1448'], ['mu', 2027, 3, 10, '2/10/1448'], ['mu', 2028, 1, 1, '4/8/1449'],
    ['kg', 2026, 6, 17, '2/1/1448'], ['kg', 2026, 11, 22, '12/6/1448'], ['kg', 2027, 3, 10, '1/10/1448'], ['kg', 2028, 1, 1, '4/8/1449'],
    ['uq', 2026, 6, 17, '2/1/1448'], ['uq', 2026, 11, 22, '12/6/1448'], ['uq', 2027, 3, 10, '2/10/1448'], ['uq', 2028, 1, 1, '4/8/1449'],
];
for (const [metode, y, m, d, harapan] of catatan) {
    const t = hijriah(metode, y, m, d), hasil = t && `${t.d}/${t.m}/${t.y}`;
    cek(hasil === harapan, `${metode} ${y}-${m}-${d}: dapat ${hasil}, seharusnya ${harapan}`);
}

// Koreksi hari: +1 harus sama dengan tanggal berikutnya
const a = hijriah('kg', 2026, 11, 23), b = hijriah('kg', 2026, 11, 22, 1);
cek(JSON.stringify(a) === JSON.stringify(b), 'koreksi +1 hari tidak sama dengan tanggal berikutnya');

console.log(gagal ? `${gagal} pemeriksaan gagal` : 'semua pemeriksaan lolos');
process.exit(gagal ? 1 : 0);
