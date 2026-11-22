# Cubelendar

**Kubus Rubik 3×3 yang bisa jadi kalender.** Cubelendar adalah aplikasi web yang memandu Anda menyusun kubus sampai satu sisinya menampilkan **hari, bulan, dan tanggal** pilihan Anda, baik Masehi maupun Hijriah, langkah demi langkah dengan kubus 3D interaktif.

Tidak perlu hafal rumus atau mahir memutar kubus. Cukup pilih tanggal, lalu ikuti sisi yang disorot merah.

## Daftar isi

- [Mengapa proyek ini dibuat](#mengapa-proyek-ini-dibuat)
- [Fitur](#fitur)
- [Cara pakai singkat](#cara-pakai-singkat)
- [Kode di muka kubus](#kode-di-muka-kubus)
- [Cara kerja](#cara-kerja)
- [Metode Hijriah](#metode-hijriah)
- [Berkas](#berkas)
- [Menjalankan](#menjalankan)
- [Uji](#uji)
- [Catatan kode](#catatan-kode)

## Mengapa proyek ini dibuat

Kubus kalender (kubus 3×3 dengan stiker huruf dan angka, bukan warna) adalah teka-teki yang menarik, tetapi sulit bagi yang belum terbiasa. Tidak ada warna sebagai petunjuk, huruf di tiap stiker punya arah yang harus benar, dan setiap tanggal butuh urutan putaran yang berbeda.

Tujuan Cubelendar:

- **Membantu pemula** menyelesaikan kubus kalender tanpa harus mahir bermain Rubik.
- **Mengajarkan notasi putaran** (R, U', F2, dan seterusnya) lewat tutorial dan latihan singkat.
- **Berjalan dari kubus apa pun**, termasuk yang sudah teracak atau yang baru Anda putar sembarangan. Tidak harus mulai dari kondisi awal.
- **Mendukung Hijriah** dengan tiga metode penentuan tanggal.
- **Tetap sederhana**: tanpa akun, tanpa server khusus, semua hitungan jalan di peramban Anda.

## Fitur

- **Panduan langkah demi langkah.** Kubus 3D memutar dan menyorot sisi yang harus Anda putar. Ada tombol langkah berikutnya, sebelumnya, dan putar otomatis. Kamera 3D bisa mengikuti sisi yang sedang diputar.
- **Kalender Masehi dan Hijriah.** Pilih tanggal, lalu pilih metode Hijriah (lihat [Metode Hijriah](#metode-hijriah)). Tersedia koreksi manual ±1 hari.
- **Scan kubus lewat kamera.** Arahkan kamera ke tiap sisi. Kotak yang ragu dibaca diisi otomatis dari aturan kubus.
- **Editor jaring 6 sisi.** Isi atau koreksi susunan kubus Anda secara manual. Jaring dan kubus 3D saling tersinkron.
- **Tutorial untuk pemula.** Penjelasan cara kerja, cara membaca notasi, dan kuis latihan.
- **Stiker PNG siap cetak.** Ukuran kertas A0–A6 dan ukuran kubus bisa diatur, warna stiker bisa diubah, ada garis potong. Cocok untuk membuat kubus kalender sendiri dari kubus 3×3 biasa.
- **Nyaman dipakai.** Mode terang dan gelap, efek suara, layar tetap menyala selama panduan, serta pengaturan dan posisi langkah yang tersimpan di peramban. Tautan dengan `?tgl=2026-11-23` langsung membuka tanggal tertentu.

## Cara pakai singkat

1. Buka aplikasi lewat server (lihat [Menjalankan](#menjalankan)).
2. Buka tab **Tutorial** bila belum paham notasi putaran.
3. Di **Aplikasi utama**, pilih tanggal dan kalender (Masehi atau Hijriah).
4. Bila kubus Anda sudah teracak, salin susunannya lewat **scan kamera** atau **editor jaring**. Kubus 3D di layar harus sama dengan kubus di tangan Anda.
5. Tekan **Mulai panduan langkah**, lalu putar kubus asli persis seperti yang ditunjukkan.
6. Setelah langkah terakhir, pegang kubus sesuai petunjuk. Muka depan menampilkan tanggal Anda.

### Membaca notasi

Huruf menunjukkan sisi yang diputar:

| Huruf | Sisi |
|---|---|
| `U` | atas |
| `D` | bawah |
| `L` | kiri |
| `R` | kanan |
| `F` | depan |
| `B` | belakang |

Tanda setelah huruf menunjukkan arah putaran:

| Tanda | Arti |
|---|---|
| `R` | putar 90° searah jarum jam |
| `R'` | putar 90° berlawanan arah jarum jam |
| `R2` | putar 180° |

"Searah jarum jam" dihitung saat Anda **menghadap langsung ke sisi yang diputar**, bukan dari posisi Anda memegang kubus. Contoh: `R U' F2` berarti sisi kanan searah jarum jam, sisi atas berlawanan arah jarum jam, lalu sisi depan 180°.

## Kode di muka kubus

Kubus punya 26 keping (6 pusat, 12 tepi, 8 sudut) dengan 54 stiker. Tiap stiker bergambar huruf, angka, atau logo, dan punya **arah** (derajat putar). Sebuah susunan dianggap benar bila tiap stiker tepat **dan** arahnya 0°.

Muka depan yang benar tersusun dari tiga baris:

| Baris | Isi | Contoh |
|---|---|---|
| 1 | kode hari | `SEN` |
| 2 | kode bulan (Masehi atau Hijriah) | `NOV` atau `JAB` |
| 3 | angka puluhan, stiker logo, angka satuan | `2`, logo, `3` untuk tanggal 23; `0`, logo, `5` untuk tanggal 5 |

Pada baris 3, simbol `/` yang muncul di kode program hanyalah penanda stiker logo di tengah. Tanggal **bukan** ditulis dengan garis miring seperti `23/03`: tanggal dan bulan ada di baris yang berbeda, dan baris 3 hanya memuat dua digit tanggal.

### Kode hari

| Kode | Hari | | Kode | Hari |
|---|---|---|---|---|
| `SEN` | Senin | | `JUM` | Jumat |
| `SEL` | Selasa | | `SAB` | Sabtu |
| `RAB` | Rabu | | `MIN` | Minggu |
| `KAM` | Kamis | | | |

### Kode bulan Masehi

| Kode | Bulan | | Kode | Bulan |
|---|---|---|---|---|
| `JAN` | Januari | | `JUL` | Juli |
| `FEB` | Februari | | `AUG` | Agustus |
| `MAR` | Maret | | `SEP` | September |
| `APR` | April | | `OCT` | Oktober |
| `MAY` | Mei | | `NOV` | November |
| `JUN` | Juni | | `DEC` | Desember |

### Kode bulan Hijriah

| Kode | Bulan | | Kode | Bulan |
|---|---|---|---|---|
| `MUR` | Muharram | | `JAB` | Rajab |
| `SAR` | Safar | | `SAN` | Syakban |
| `AUL` | Rabiul Awal | | `MAN` | Ramadan |
| `AUR` | Rabiul Akhir | | `SAL` | Syawal |
| `JAL` | Jumadil Awal | | `DUL` | Zulkaidah |
| `JAR` | Jumadil Akhir | | `JUL` | Zulhijah |

Pada kode Hijriah, huruf terakhir `L` berarti "Awal" dan `R` berarti "Akhir" (`AUL`/`AUR` = Rabiul, `JAL`/`JAR` = Jumadil). Kode `JUL` dipakai bersama oleh Juli (Masehi) dan Zulhijah (Hijriah).

### Mengapa kode hari berbahasa Indonesia tetapi kode bulan berbahasa Inggris?

Kubus hanya punya 54 stiker, jadi jumlah tiap huruf terbatas (misalnya `K` dan `I` masing-masing hanya satu). Muka depan harus memuat kode hari dan kode bulan sekaligus. Bila bulan memakai kode Indonesia (`MEI`, `AGU`, `OKT`, `DES`), ada dua kombinasi yang mustahil tersusun: `KAM` + `OKT` (butuh dua `K`) dan `MIN` + `MEI` (butuh dua `I`). Dengan `MAY`, `AUG`, `OCT`, dan `DEC`, semua kombinasi 7 hari × 12 bulan bisa tersusun.

Ini hasil pemeriksaan jumlah huruf pada stiker. Batasan lain seperti letak dan arah keping tidak ikut diperiksa.

## Cara kerja

### Dari tanggal ke rumus

Ada 31 tanggal × 12 bulan × 7 hari, dan tiap kombinasi punya rumus sendiri. Rumus-rumus itu dihitung lebih dulu dan disimpan di `data.js` sebagai tabel yang dipadatkan. Kuncinya berbentuk `tanggal-bulan-hari` (misalnya `23-11-0`), dan isinya:

1. urutan putaran dari **kubus dalam keadaan awal** menuju muka tanggal itu, dan
2. dua stiker acuan yang menentukan bagaimana kubus dipegang di akhir.

Kalau kubus Anda masih dalam keadaan awal, rumus ini langsung dipakai.

### Kalau kubus sudah teracak

Rumus di tabel hanya berlaku dari keadaan awal, sedangkan kubus pengguna bisa berada di mana saja. Karena itu `core.js` mencoba dua jalur, lalu memakai yang **lebih pendek**:

1. **Pulihkan, lalu pakai rumus.** Pencarian dua arah mencari jalan singkat dari susunan sekarang kembali ke keadaan awal (sampai 5 langkah dari tiap ujung). Setelah itu rumus tabel dijalankan.
2. **Pemecah langsung (`solveDate`).** Muka tanggal disusun dari susunan sekarang, **keping demi keping**: pusat dulu, lalu tepi, lalu sudut. Tiap tahap memakai IDA\* (pencarian mendalam bertahap dengan batas bawah dari jarak tiap keping ke tempat tujuannya). Jalur ini tidak membatasi jumlah langkah.

Detail teknis yang membuat ini cepat:

- Tiap keping diwakili oleh **posisi (0–26) dan orientasi (satu dari 24 rotasi kubus)**. Satu putaran sisi cukup berupa pencarian di tabel (`TABEL_GERAKAN`).
- Hitungan berat berjalan di **Web Worker** (`worker.js`) supaya halaman tidak macet.

### Memvalidasi dan melengkapi hasil scan

Scan kamera tidak selalu membaca semua huruf dengan benar. Aturan kubus dipakai sebagai penyaring:

- **Keping punya kombinasi huruf yang tetap.** Bila sebuah kotak ragu, `complete()` mencari susunan sah yang cocok dengan kotak yang sudah pasti, lalu mengisi yang kosong.
- **Pencocokan toleran (`fit()`).** Bila ada huruf yang salah baca, dicari susunan sah yang paling sedikit berbeda dari bacaan.
- **Cek keabsahan (`valid()`).** Susunan harus memenuhi syarat fisik kubus (jumlah putaran sudut, pembalikan tepi, dan paritas permutasi). Tanpa itu, kubus tidak mungkin bisa dicapai dari keadaan awal.

Hasil prediksi ditandai dengan huruf biru supaya mudah Anda periksa di jaring.

## Metode Hijriah

| Metode | Kriteria |
|---|---|
| Muhammadiyah | KHGT (tinggi bulan 5°, elongasi 8°) sejak 1 Muharram 1447 H; sebelumnya wujudul hilal (Yogyakarta) |
| Kemenag | MABIMS: tinggi bulan minimal 3° dan elongasi minimal 6,4° saat magrib (titik acuan Sabang) |
| Umm al-Qura | kalender bawaan peramban (`Intl`), bukan dihitung di sini |

Posisi bulan dan matahari dihitung dengan rumus Meeus yang disederhanakan, tanpa jaringan. Hasil Muhammadiyah dan Kemenag adalah **perhitungan** dari kriteria di atas, bukan data resmi.

> **Penting:** untuk keperluan ibadah atau urusan resmi, selalu cocokkan dengan kalender dan pengumuman resmi (Kemenag, Muhammadiyah, atau lembaga terkait). Tanggal Hijriah yang sebenarnya juga bergantung pada ketetapan sidang isbat atau maklumat resmi.

## Berkas

Semua file ada di satu folder (tanpa subfolder), jadi cukup unggah semuanya ke root repo.

Urutan muat di `index.html` (jangan diubah):

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

## Menjalankan

Buka lewat server, **bukan** dengan klik dua kali pada `index.html`. Worker dan kamera tidak berfungsi dari `file://`.

```
python3 -m http.server
```

Lalu buka `http://localhost:8000`. Bisa juga diunggah ke GitHub Pages.

Catatan:

- **three.js r128** dimuat dari CDN (cdnjs, cadangan jsDelivr), jadi butuh internet untuk tampilan 3D.
- **Kamera** hanya bisa dipakai lewat `localhost` atau `https`.

## Uji

```
node tes-hijriah.js
```

Memeriksa sifat dasar kalender (bulan 29/30 hari, hari berurutan) dan beberapa tanggal acuan. Tanggal acuan itu dicatat dari hasil program saat ini, bukan dari tabel resmi. Bandingkan juga dengan kalender resmi sebelum dipakai.

## Catatan kode

- `hijri.js` memakai nama Indonesia dan komentar yang menjelaskan tiap langkah.
- Bagian lain sudah diformat (satu pernyataan per baris). Semua nama tingkat atas di `core.js` dan `app.js` yang berupa singkatan sudah diberi nama Indonesia yang menjelaskan isinya (konstanta `HURUF_BESAR`, fungsi dan variabel `camelCase`). Variabel lokal di dalam fungsi (`i`, `c`, `x`, dan sejenisnya) sengaja dibiarkan.
- `core.js` tidak boleh memakai `document` atau `window`, karena juga dimuat di dalam Web Worker.
