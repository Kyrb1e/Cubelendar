# Cubelendar

Susun kubus 3×3 sampai satu sisinya menampilkan hari, bulan, dan tanggal (Masehi atau Hijriah), lengkap dengan panduan langkah demi langkah.

Semua file ada di satu folder (tanpa subfolder), jadi cukup unggah semuanya ke root repo.
Buka lewat server (GitHub Pages atau `python3 -m http.server`), bukan dengan klik dua kali.

## Berkas

| File | Isi |
|---|---|
| `style.css` | semua gaya |
| `core.js` | model kubus, putaran, notasi, pemecah (juga dipakai `worker.js`) |
| `data.js` | tabel solusi tanggal (juga dipakai `worker.js`) |
| `assets.js` | logo, ikon, dan sprite sebagai data URI |
| `hijri.js` | konversi Hijriah: Muhammadiyah, Kemenag/MABIMS, Umm al-Qura |
| `app.js` | tampilan 3D, kalender, scan, panduan, UI |
| `worker.js` | hitung langkah di thread terpisah |
| `tes-hijriah.js` | uji untuk `hijri.js` |

`core.js` dan `data.js` harus tetap sefolder dengan `worker.js`.

## Metode Hijriah

| Metode | Kriteria |
|---|---|
| Muhammadiyah | KHGT (tinggi bulan 5°, elongasi 8°) sejak 1 Muharram 1447 H; sebelumnya wujudul hilal (Yogyakarta) |
| Kemenag | MABIMS: tinggi bulan minimal 3° dan elongasi minimal 6,4° saat magrib (titik acuan Sabang) |
| Umm al-Qura | kalender bawaan peramban (`Intl`), bukan dihitung di sini |

Posisi bulan dan matahari dihitung dengan rumus Meeus yang disederhanakan, tanpa jaringan.

## Uji

```
node tes-hijriah.js
```

Memeriksa sifat dasar kalender (bulan 29/30 hari, hari berurutan) dan beberapa tanggal acuan.
Tanggal acuan itu dicatat dari hasil program saat ini, bukan dari tabel resmi. Bandingkan juga dengan kalender resmi sebelum dipakai.

## Catatan kode

- `hijri.js` memakai nama Indonesia dan komentar yang menjelaskan tiap langkah.
- Bagian lain sudah diformat (satu pernyataan per baris). Semua nama tingkat atas di `core.js` dan `app.js` yang berupa singkatan sudah diberi nama Indonesia yang menjelaskan isinya (konstanta `HURUF_BESAR`, fungsi dan variabel `camelCase`). Variabel lokal di dalam fungsi (`i`, `c`, `x`, dan sejenisnya) sengaja dibiarkan.
- three.js r128 dimuat dari CDN (cdnjs, cadangan jsDelivr).
