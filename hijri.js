/* hijri.js: konversi tanggal Masehi ke Hijriah.
 *
 * Tiga metode, dipilih lewat `metodeHijriah`:
 *   'mu'  Muhammadiyah. Sebelum 1 Muharram 1447 H memakai wujudul hilal (titik acuan Yogyakarta),
 *         sejak itu memakai KHGT (tinggi bulan >= 5 derajat, elongasi >= 8 derajat).
 *   'kg'  Kemenag. Kriteria MABIMS: tinggi bulan >= 3 derajat dan elongasi >= 6,4 derajat,
 *         dihitung di titik acuan Sabang, Aceh.
 *   'uq'  Umm al-Qura. Memakai kalender bawaan peramban (Intl), tidak dihitung di sini.
 *
 * Posisi bulan dan matahari dihitung sendiri dengan rumus Meeus yang disederhanakan,
 * jadi tidak butuh tabel atau jaringan.
 *
 * Dimuat sebelum app.js. `metodeHijriah` dan `koreksiHari` ada di sini; app.js hanya mengisi dan membacanya.
 * Fungsi yang dipakai app.js: tanggalHijriah(y, m, d) -> {d, m, y} atau null.
 */

let koreksiHari = 0; // koreksi manual tanggal Hijriah: -1, 0, atau +1 hari
let metodeHijriah = 'mu'; // metode: 'mu' | 'kg' | 'uq'

// ---------- Konstanta ----------

const DERAJAT = Math.PI / 180; // pengali derajat -> radian
const JD_J2000 = 2451545; // hari Julian pada 1 Jan 2000 12:00 TT
const JD_UNIX = 2440587.5; // hari Julian pada 1 Jan 1970 00:00 UTC
const WIB = 7 / 24; // selisih WIB terhadap UTC, dalam hari
const BULAN_SINODIS = 29.530589; // rata-rata satu bulan (hari), untuk perkiraan kasar
const TANPA_SYARAT = -Infinity; // dipakai bila suatu syarat tidak berlaku

// Patokan penomoran: lunasi k = 315 adalah ijtimak menjelang 1 Muharram 1447 H (sekitar 25 Jun 2025).
const LUNASI_ACUAN = 315;
const TANGGAL_ACUAN = Date.UTC(2025, 5, 25);
const BULAN_HIJRIAH_ACUAN = 1446 * 12; // jumlah bulan Hijriah yang sudah lewat sebelum 1 Muharram 1447 H

// Titik acuan pengamatan (lintang utara positif, bujur timur positif)
const SABANG = { lintang: 5.89, bujur: 95.32 }; // Kemenag: titik terbarat Indonesia
const YOGYAKARTA = { lintang: -7.8, bujur: 110.37 }; // Muhammadiyah (wujudul hilal)
const AUCKLAND = { lintang: -36.85, bujur: 174.76 }; // KHGT: batas fajar di Selandia Baru

// ---------- Umm al-Qura ----------

function ummAlQura(y, m, d) {
    try {
        const bagian = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', {
            day: 'numeric', month: 'numeric', year: 'numeric', timeZone: 'UTC'
        }).formatToParts(new Date(Date.UTC(y, m - 1, d + koreksiHari, 12)));
        const ambil = jenis => +bagian.find(x => x.type == jenis).value;
        const hasil = { d: ambil('day'), m: ambil('month'), y: ambil('year') };
        return hasil.d && hasil.m ? hasil : null;
    }
    catch (e) {
        return null; // peramban tanpa dukungan kalender ini
    }
}

// ---------- Metode hitungan: Muhammadiyah dan Kemenag ----------

const tanggalHijriah = (() => {
    // Suku periodik bujur bulan (Meeus, Astronomical Algorithms bab 47, disederhanakan).
    // Tiap baris: [pengali D, pengali M, pengali M', pengali F, koefisien dalam 1e-6 derajat].
    const SUKU_BUJUR = [
        [0, 0, 1, 0, 6288774],
        [2, 0, -1, 0, 1274027],
        [2, 0, 0, 0, 658314],
        [0, 0, 2, 0, 213618],
        [0, 1, 0, 0, -185116],
        [0, 0, 0, 2, -114332],
        [2, 0, -2, 0, 58793],
        [2, -1, -1, 0, 57066],
        [2, 0, 1, 0, 53322],
        [2, -1, 0, 0, 45758],
        [0, 1, -1, 0, -40923],
        [1, 0, 0, 0, -34720],
        [0, 1, 1, 0, -30383],
        [2, 0, 0, -2, 15327],
        [0, 0, 1, 2, -12528],
        [0, 0, 1, -2, 10980],
        [4, 0, -1, 0, 10675],
        [0, 0, 3, 0, 10034],
        [4, 0, -2, 0, 8548],
        [2, 1, -1, 0, -7888],
        [2, 1, 0, 0, -6766],
        [1, 0, -1, 0, -5163],
        [1, 1, 0, 0, 4987],
        [2, -1, 1, 0, 4036],
        [2, 0, 2, 0, 3994],
        [4, 0, 0, 0, 3861],
        [2, 0, -3, 0, 3665],
        [0, 1, -2, 0, -2689]
    ];
    // Suku periodik lintang bulan, format sama.
    const SUKU_LINTANG = [
        [0, 0, 0, 1, 5128122],
        [0, 0, 1, 1, 280602],
        [0, 0, 1, -1, 277693],
        [2, 0, 0, -1, 173237],
        [2, 0, -1, 1, 55413],
        [2, 0, -1, -1, 46271],
        [2, 0, 0, 1, 32573],
        [0, 0, 2, 1, 17198],
        [2, 0, 1, -1, 9266],
        [0, 0, 2, -1, 8822],
        [2, -1, 0, -1, 8216],
        [2, 0, -2, -1, 4324],
        [2, 0, 1, 1, 4200],
        [2, 1, 0, -1, -3359]
    ];
    const cacheAwalBulan = new Map(); // "metode+lunasi" -> nomor hari awal bulan

    // Posisi bulan dan matahari pada hari Julian `jd`.
    // Hasilnya: bujur ekliptika (bujurBulan, bujurMatahari), posisi katulistiwa
    // (rasi = right ascension, deklinasi), waktu sideris Greenwich (gmst, derajat),
    // dan elongasi bulan-matahari (derajat).
    function posisiBulanMatahari(jd) {
        const T = (jd - JD_J2000) / 36525; // abad Julian sejak J2000
        const keRadian = x => (((x % 360) + 360) % 360) * DERAJAT;
        // Notasi Meeus: L' bujur rata-rata bulan, D elongasi rata-rata, M anomali matahari,
        // M' anomali bulan, F argumen lintang bulan. A1..A3 koreksi tambahan.
        const Lp = keRadian(218.3164477 + 481267.88123421 * T);
        const D = keRadian(297.8501921 + 445267.1114034 * T);
        const M = keRadian(357.5291092 + 35999.0502909 * T);
        const Mp = keRadian(134.9633964 + 477198.8675055 * T);
        const F = keRadian(93.272095 + 483202.0175233 * T);
        const A1 = keRadian(119.75 + 131.849 * T);
        const A2 = keRadian(53.09 + 479264.29 * T);
        const A3 = keRadian(313.45 + 481266.484 * T);
        const E = 1 - .002516 * T; // koreksi eksentrisitas orbit bumi
        let jumlahBujur = 3958 * Math.sin(A1) + 1962 * Math.sin(Lp - F) + 318 * Math.sin(A2);
        let jumlahLintang = -2235 * Math.sin(Lp) + 382 * Math.sin(A3) + 175 * Math.sin(A1 - F) + 175 * Math.sin(A1 + F) + 127 * Math.sin(Lp - Mp) - 115 * Math.sin(Lp + Mp);
        for (const [a, b, c, d, v] of SUKU_BUJUR)
            jumlahBujur += v * E ** Math.abs(b) * Math.sin(a * D + b * M + c * Mp + d * F);
        for (const [a, b, c, d, v] of SUKU_LINTANG)
            jumlahLintang += v * E ** Math.abs(b) * Math.sin(a * D + b * M + c * Mp + d * F);
        const bujurBulan = Lp / DERAJAT + jumlahBujur / 1e6;
        const lintangBulan = jumlahLintang / 1e6;
        // Matahari: bujur ekliptika dari anomali rata-rata, dengan koreksi aberasi/nutasi sederhana
        const L0 = 280.46646 + 36000.76983 * T;
        const Ms = keRadian(357.52911 + 35999.05029 * T);
        const bujurMatahari = L0 + 1.914602 * Math.sin(Ms) + .019993 * Math.sin(2 * Ms) + .000289 * Math.sin(3 * Ms) - .00569;
        const kemiringan = (23.4393 - .013 * T) * DERAJAT; // kemiringan sumbu bumi
        // Koordinat ekliptika (bujur, lintang dalam derajat) -> [rasi, deklinasi] dalam radian
        const keKatulistiwa = (bujur, lintang) => {
            bujur *= DERAJAT;
            lintang *= DERAJAT;
            return [Math.atan2(Math.sin(bujur) * Math.cos(kemiringan) - Math.tan(lintang) * Math.sin(kemiringan), Math.cos(bujur)), Math.asin(Math.sin(lintang) * Math.cos(kemiringan) + Math.cos(lintang) * Math.sin(kemiringan) * Math.sin(bujur))];
        };
        const bulan = keKatulistiwa(bujurBulan, lintangBulan);
        const matahari = keKatulistiwa(bujurMatahari, 0);
        return {
            bujurBulan,
            bujurMatahari,
            rasiBulan: bulan[0],
            deklinasiBulan: bulan[1],
            rasiMatahari: matahari[0],
            deklinasiMatahari: matahari[1],
            gmst: 280.46061837 + 360.98564736629 * (jd - JD_J2000),
            elongasi: Math.acos(Math.sin(bulan[1]) * Math.sin(matahari[1]) + Math.cos(bulan[1]) * Math.cos(matahari[1]) * Math.cos(bulan[0] - matahari[0])) / DERAJAT
        };
    }

    // Tinggi bulan (atau matahari bila `matahari` benar) di atas ufuk, dalam derajat,
    // untuk pengamat di (lintang, bujur). `denganParalaks` mengoreksi paralaks bulan secara kasar.
    function tinggi(posisi, lintang, bujur, matahari, denganParalaks) {
        const sudutJam = (posisi.gmst + bujur) * DERAJAT;
        const rasi = matahari ? posisi.rasiMatahari : posisi.rasiBulan;
        const deklinasi = matahari ? posisi.deklinasiMatahari : posisi.deklinasiBulan;
        const lin = lintang * DERAJAT;
        const h = Math.asin(Math.sin(lin) * Math.sin(deklinasi) + Math.cos(lin) * Math.cos(deklinasi) * Math.cos(sudutJam - rasi)) / DERAJAT;
        return matahari || !denganParalaks ? h : h - .95 * Math.cos(h * DERAJAT);
    }

    // Waktu ijtimak (konjungsi) lunasi ke-k, dalam hari sejak 1970 (UTC, pecahan hari).
    // Mulai dari perkiraan rata-rata, lalu disempurnakan 5 kali.
    function ijtimak(k) {
        let jd = 2451550.09766 + 29.530588861 * k;
        for (let i = 0; i < 5; i++) {
            const p = posisiBulanMatahari(jd);
            jd -= ((((p.bujurBulan - p.bujurMatahari) % 360) + 540) % 360 - 180) / 12.19;
        }
        return jd - JD_UNIX;
    }

    // KHGT: adakah titik di bumi yang sedang magrib dengan tinggi bulan >= 5 derajat dan
    // elongasi >= 8 derajat pada rentang waktu t0..t1 (hari sejak 1970 UTC)?
    // Bila `hanyaAmerika`, hanya titik di benua Amerika (bujur -170 sampai -34) yang dihitung.
    function kriteriaKHGTTerpenuhi(t0, t1, hanyaAmerika) {
        for (let t = t0; t <= t1; t += 1 / 144) {
            const p = posisiBulanMatahari(t + JD_UNIX);
            if (p.elongasi < 8)
                continue;
            for (let lintang = -60; lintang <= 70; lintang += 4) {
                // sudut jam matahari saat terbenam (tinggi -0,833 derajat) di lintang ini
                const c = (Math.sin(-.833 * DERAJAT) - Math.sin(lintang * DERAJAT) * Math.sin(p.deklinasiMatahari)) / (Math.cos(lintang * DERAJAT) * Math.cos(p.deklinasiMatahari));
                if (Math.abs(c) > 1)
                    continue; // matahari tidak terbenam di lintang ini
                // bujur tempat yang matahari-nya sedang terbenam pada saat ini
                const bujur = ((p.rasiMatahari / DERAJAT + Math.acos(c) / DERAJAT - p.gmst) % 360 + 540) % 360 - 180;
                if (hanyaAmerika && (bujur < -170 || bujur > -34))
                    continue;
                if (tinggi(p, lintang, bujur, 0, 1) >= 5)
                    return 1;
            }
        }
        return 0;
    }

    // Waktu fajar (matahari mencapai -18 derajat) di Auckland pada hari `hari`, hari sejak 1970 UTC.
    function fajarAuckland(hari) {
        for (let t = hari + .5; t < hari + 1; t += 1 / 288)
            if (tinggi(posisiBulanMatahari(t + JD_UNIX), AUCKLAND.lintang, AUCKLAND.bujur, 1) >= -18)
                return t;
        return hari + 1;
    }

    // Awal bulan menurut kriteria di satu lokasi: ijtimak harus terjadi sebelum matahari terbenam
    // dan, saat terbenam, tinggi bulan >= tinggiMin serta elongasi >= elongasiMin.
    // Hasilnya nomor hari (sejak 1970, hari-hari WIB) tanggal 1 bulan baru: besok bila terpenuhi, lusa bila tidak.
    function awalBulanLokal(ijtimakHari, lokasi, tinggiMin, elongasiMin) {
        const hariWIB = Math.floor(ijtimakHari + WIB);
        let terbenam = hariWIB - WIB + .75; // cadangan bila pencarian gagal
        // cari saat matahari terbenam (tinggi < -0,833 derajat) antara kira-kira 14:24 dan 21:36 WIB
        for (let t = hariWIB - WIB + .6; t < hariWIB - WIB + .9; t += 1 / 288)
            if (tinggi(posisiBulanMatahari(t + JD_UNIX), lokasi.lintang, lokasi.bujur, 1) < -.833) {
                terbenam = t;
                break;
            }
        const p = posisiBulanMatahari(terbenam + JD_UNIX);
        const terpenuhi = ijtimakHari < terbenam && tinggi(p, lokasi.lintang, lokasi.bujur, 0, 0) >= tinggiMin && p.elongasi >= elongasiMin;
        return hariWIB + (terpenuhi ? 1 : 2);
    }

    // Nomor hari (sejak 1970) tanggal 1 bulan Hijriah ke-k, menurut metode `metodeHijriah`.
    function awalBulan(k) {
        const kunci = metodeHijriah + k;
        if (cacheAwalBulan.has(kunci))
            return cacheAwalBulan.get(kunci);
        const ijtimakHari = ijtimak(k);
        let awal;
        if (k >= LUNASI_ACUAN && metodeHijriah == 'mu') {
            // KHGT: berlaku mulai 1 Muharram 1447 H
            const hariUTC = Math.floor(ijtimakHari);
            let terpenuhi = kriteriaKHGTTerpenuhi(ijtimakHari, hariUTC + 1, 0);
            // belum terpenuhi sampai 24:00 UTC, tapi ijtimak sebelum fajar di Auckland:
            // periksa lagi sampai 12:00 UTC hari berikutnya, khusus di Amerika
            if (!terpenuhi && ijtimakHari < fajarAuckland(hariUTC))
                terpenuhi = kriteriaKHGTTerpenuhi(hariUTC + 1, hariUTC + 1.5, 1);
            awal = hariUTC + (terpenuhi ? 1 : 2);
        }
        else {
            awal = metodeHijriah == 'kg' ? awalBulanLokal(ijtimakHari, SABANG, 3, 6.4) : awalBulanLokal(ijtimakHari, YOGYAKARTA, 0, TANPA_SYARAT);
        }
        cacheAwalBulan.set(kunci, awal);
        return awal;
    }

    // Titik masuk: tanggal Masehi (y, m, d) -> {d, m, y} Hijriah menurut `metodeHijriah`, termasuk koreksi `koreksiHari`.
    return function (y, m, d) {
        if (metodeHijriah == 'uq')
            return ummAlQura(y, m, d);
        const hari = Math.floor(Date.UTC(y, m - 1, d + koreksiHari) / 864e5);
        // perkirakan lunasi dari patokan, lalu geser sampai `hari` jatuh di dalam bulannya
        let k = Math.round((hari - TANGGAL_ACUAN / 864e5) / BULAN_SINODIS) + LUNASI_ACUAN;
        while (awalBulan(k) > hari)
            k--;
        while (awalBulan(k + 1) <= hari)
            k++;
        const bulanKe = BULAN_HIJRIAH_ACUAN + k - LUNASI_ACUAN; // bulan sejak tahun 0
        return {
            d: hari - awalBulan(k) + 1,
            m: ((bulanKe % 12) + 12) % 12 + 1,
            y: Math.floor(bulanKe / 12) + 1
        };
    };
})();
