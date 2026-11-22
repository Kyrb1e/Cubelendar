/* app.js: tampilan 3D, kalender, kamera/scan, panduan langkah, dan semua UI. Dimuat paling akhir. */
const $ = id => document.getElementById(id);
const LOGO = new Image();
const logoCb = [];
LOGO.onload = () => logoCb.forEach(f => f());
LOGO.src = LOGO_SRC;
const ORCA = new Image();
const TREE = new Image();
ORCA.onload = TREE.onload = () => logoCb.forEach(f => f());
ORCA.src = ORCA_SRC;
TREE.src = TREE_SRC;
const IMGS = {
    '/': LOGO, '~': ORCA, '^': TREE
};
const isImg = c => !!c && c in IMGS;
function drawLogo(x, size, ch) {
    const im = IMGS[ch || '/'];
    if (!im || !im.complete || !im.naturalWidth)
        return;
    const r = im.naturalWidth / im.naturalHeight;
    const s = size * (ch && ch != '/' ? .82 : .78);
    const w = r >= 1 ? s : s * r;
    const h = r >= 1 ? s / r : s;
    x.drawImage(im, -w / 2, -h / 2, w, h);
}
const stage = $('stage');
const JARAK_KEPING = 1.04;
const V3 = THREE.Vector3;
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
stage.appendChild(renderer.domElement);
renderer.domElement.setAttribute('role', 'img');
renderer.domElement.setAttribute('aria-label', 'Kubus 3D interaktif. Seret untuk memutar tampilan.');
let bingkaiIdle = 90;
const bangunkanRender = () => {
    bingkaiIdle = 90;
};
renderer.domElement.addEventListener('webglcontextlost', e => e.preventDefault());
renderer.domElement.addEventListener('webglcontextrestored', bangunkanRender);
const scene = new THREE.Scene();
const cam = new THREE.PerspectiveCamera(38, 1, .1, 100);
cam.position.set(0, 0, 10.5);
const root = new THREE.Group();
scene.add(root);
let rotasiTarget = new THREE.Quaternion();
let rotasiDasar = new THREE.Quaternion();
let modeKamera = 1;
function setView() {
    const t = new THREE.Quaternion();
    if (modeKamera == 3)
        t.setFromEuler(new THREE.Euler(25 * Math.PI / 180, -30 * Math.PI / 180, 0, 'XYZ'));
    rotasiTarget = t.multiply(rotasiDasar);
}
const cube = makeCube();
let cacheTekstur = {};
const hex2rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const campurWarna = (a, b, t) => {
    const A = hex2rgb(a);
    const B = hex2rgb(b);
    return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join('');
};
let WARNA_STIKER = { bg: '#ffffff', fg: '#111111' };
try {
    const j = JSON.parse(localStorage.getItem('cubelendar.sc') || 'null');
    if (j && /^#[0-9a-f]{6}$/i.test(j.bg) && /^#[0-9a-f]{6}$/i.test(j.fg))
        WARNA_STIKER = { bg: j.bg, fg: j.fg };
}
catch (e) {
}
const warnaTanda = () => campurWarna(WARNA_STIKER.bg, WARNA_STIKER.fg, .5);
const warnaPolos = () => campurWarna(WARNA_STIKER.bg, WARNA_STIKER.fg, .1);
function teksturStiker(s) {
    const key = [s.ch, s.ang, s.k, s.v].join('|');
    if (cacheTekstur[key])
        return cacheTekstur[key];
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const x = c.getContext('2d');
    x.fillStyle = WARNA_STIKER.bg;
    x.beginPath();
    x.roundRect ? x.roundRect(4, 4, 120, 120, 14) : x.rect(4, 4, 120, 120);
    x.fill();
    if (s.ch) {
        x.save();
        x.translate(64, 64);
        x.rotate(-s.ang * Math.PI / 180);
        x.fillStyle = WARNA_STIKER.fg;
        x.font = 'bold 84px Arial,sans-serif';
        x.textAlign = 'center';
        x.textBaseline = 'middle';
        if (isImg(s.ch))
            drawLogo(x, 120, s.ch);
        else
            x.fillText(s.ch, 0, 5);
        x.restore();
        x.fillStyle = warnaTanda();
        if (s.k == 2) {
            x.beginPath();
            x.arc(64 + 52 * s.v[0], 64 - 52 * s.v[1], 6, 0, 7);
            x.fill();
        }
        else if (s.k == 1) {
            if (s.v[0] == 0)
                x.fillRect(44, 64 - 56 * s.v[1] - 3, 40, 6);
            else
                x.fillRect(64 + 56 * s.v[0] - 3, 44, 6, 40);
        }
    }
    const t = new THREE.CanvasTexture(c);
    t.anisotropy = 4;
    if (isImg(s.ch) && !IMGS[s.ch].complete)
        logoCb.push(() => {
            delete cacheTekstur[key];
            const n = teksturStiker(s);
            t.image = n.image;
            t.needsUpdate = true;
            cacheTekstur[key] = t;
        });
    return cacheTekstur[key] = t;
}
const geoBadan = new THREE.BoxGeometry(.98, .98, .98);
const matBadan = new THREE.MeshLambertMaterial({ color: 0x1a1c1d });
const geoStiker = new THREE.PlaneGeometry(.86, .86);
scene.add(new THREE.AmbientLight(0xffffff, 1));
for (const p of cube) {
    const g = p.g = new THREE.Group();
    g.matrixAutoUpdate = false;
    g.add(new THREE.Mesh(geoBadan, matBadan));
    for (const s of p.st) {
        const m = new THREE.Mesh(geoStiker, new THREE.MeshBasicMaterial({ map: teksturStiker(s) }));
        m.userData.s = s;
        m.matrixAutoUpdate = false;
        m.matrix.makeBasis(new V3(...s.r), new V3(...s.u), new V3(...s.n)).setPosition(s.n[0] * .495, s.n[1] * .495, s.n[2] * .495);
        g.add(m);
    }
    root.add(g);
}
function matriksKeping(p) {
    const R = p.R;
    const m = new THREE.Matrix4();
    m.set(R[0][0], R[0][1], R[0][2], p.pos[0] * JARAK_KEPING, R[1][0], R[1][1], R[1][2], p.pos[1] * JARAK_KEPING, R[2][0], R[2][1], R[2][2], p.pos[2] * JARAK_KEPING, 0, 0, 0, 1);
    return m;
}
let modePratinjau = 0;
let teksHintAsli = '';
function sync() {
    if (modePratinjau) {
        modePratinjau = 0;
        rotasiDasar = new THREE.Quaternion();
        setView();
        const h = $('hint');
        if (h && teksHintAsli)
            h.textContent = teksHintAsli;
    }
    for (const p of cube) {
        p.g.matrix.copy(matriksKeping(p));
        p.g.matrixWorldNeedsUpdate = true;
    }
    bangunkanRender();
}
function resize() {
    const w = stage.clientWidth;
    const h = stage.clientHeight;
    if (!w || !h)
        return;
    bangunkanRender();
    renderer.setSize(w, h);
    cam.aspect = w / h;
    cam.updateProjectionMatrix();
}
addEventListener('resize', resize);
if (window.ResizeObserver)
    new ResizeObserver(resize).observe(stage);
['pointerdown', 'pointermove', 'pointerup', 'wheel', 'keydown', 'click', 'input', 'change', 'touchstart'].forEach(t => document.addEventListener(t, bangunkanRender, { passive: true, capture: true }));
document.addEventListener('visibilitychange', bangunkanRender);
addEventListener('load', () => {
    bangunkanRender();
    setTimeout(bangunkanRender, 800);
});
resize();
sync();
// animasi
let queue = [];
let gerakanAktif = null;
let saatSelesai = null;
let gerakCepat = 0;
function tick(now) {
    if (gerakanAktif || queue.length)
        bingkaiIdle = Math.max(bingkaiIdle, 30);
    if (!gerakanAktif && queue.length) {
        if (modePratinjau)
            sync();
        const [f, k] = queue.shift();
        gerakanAktif = {
            f, k, t0: now, L: cube.filter(p => dot(p.pos, NORMAL_MUKA[f]) == 1)
        };
    }
    if (gerakanAktif) {
        const d = gerakCepat ? 1 : gerakanAktif.k == 2 ? 520 : 340;
        const u = Math.min(1, (now - gerakanAktif.t0) / d);
        const e = u * u * (3 - 2 * u);
        const Ma = new THREE.Matrix4().makeRotationAxis(new V3(...NORMAL_MUKA[gerakanAktif.f]), -Math.PI / 2 * (gerakanAktif.k == 3 ? -1 : gerakanAktif.k) * e);
        for (const p of gerakanAktif.L) {
            p.g.matrix.multiplyMatrices(Ma, matriksKeping(p));
            p.g.matrixWorldNeedsUpdate = true;
        }
        if (u >= 1) {
            if (merekam)
                riwayat.push([gerakanAktif.f, gerakanAktif.k]);
            turn(cube, gerakanAktif.f, gerakanAktif.k);
            sync();
            window.sfx && window.sfx("move");
            gerakanAktif = null;
            perbaruiJaring();
            if (!queue.length && saatSelesai) {
                const f = saatSelesai;
                saatSelesai = null;
                f();
            }
        }
    }
    root.quaternion.slerp(rotasiTarget, .12);
    if (!document.hidden && !$('appv').hidden && (bingkaiIdle > 0 || root.quaternion.angleTo(rotasiTarget) > 1e-4)) {
        if (bingkaiIdle > 0)
            bingkaiIdle--;
        renderer.render(scene, cam);
    }
    requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
// seret
let drag = null;
stage.addEventListener('pointerdown', e => {
    drag = [e.clientX, e.clientY];
    stage.setPointerCapture(e.pointerId);
});
stage.addEventListener('pointerup', () => drag = null);
stage.addEventListener('pointermove', e => {
    if (!drag)
        return;
    const dx = e.clientX - drag[0];
    const dy = e.clientY - drag[1];
    drag = [e.clientX, e.clientY];
    const q = new THREE.Quaternion().multiplyQuaternions(new THREE.Quaternion().setFromAxisAngle(new V3(0, 1, 0), dx * .008), new THREE.Quaternion().setFromAxisAngle(new V3(1, 0, 0), dy * .008));
    root.quaternion.premultiply(q);
    rotasiTarget.copy(root.quaternion);
});
// UI
let jenisKalender = 'm';
const KODE_BULAN_HIJRIAH = ['MUR', 'SAR', 'AUL', 'AUR', 'JAL', 'JAR', 'JAB', 'SAN', 'MAN', 'SAL', 'DUL', 'JUL'];
const NAMA_BULAN_HIJRIAH = ['Muharram', 'Safar', 'Rabiul Awal', 'Rabiul Akhir', 'Jumadil Awal', 'Jumadil Akhir', 'Rajab', 'Syakban', 'Ramadan', 'Syawal', 'Zulkaidah', 'Zulhijah'];
function targetSaatIni() {
    const [y, m, d] = $('dt').value.split('-').map(Number);
    return targetUntukTanggal(y, m, d);
}
function targetUntukTanggal(y, m, d) {
    const w = targetTanggal(y, m, d);
    if (jenisKalender != 'h')
        return { ...w, e: TABLE[w.key] };
    const h = tanggalHijriah(y, m, d);
    if (!h)
        return {
            ...w, h: null, e: undefined
        };
    const wd = KODE_BULAN_HIJRIAH[h.m - 1];
    const mi = KODE_BULAN.indexOf(wd);
    const key = mi >= 0 ? h.d + '-' + (mi + 1) + '-' + w.w : wd + '-' + h.d + '-' + w.w;
    return {
        w: w.w, key, h, rows: [KODE_HARI[w.w], wd, Math.floor(h.d / 10) + '/' + (h.d % 10)], e: TABLE[key]
    };
}
function catatanHijriah(w) {
    return jenisKalender != 'h' ? '' : w.h ? `<b>Hijriah:</b> ${w.h.d} ${NAMA_BULAN_HIJRIAH[w.h.m - 1]} ${w.h.y} H · kode bulan <b>${KODE_BULAN_HIJRIAH[w.h.m - 1]}</b><br>` : 'Peramban ini tidak mendukung kalender Hijriah.<br>';
}
function rotasiPegang(X, Y) {
    const a = axes(cube, X, Y);
    const r = [a.x, a.y, a.z];
    const m = new THREE.Matrix4().set(...r[0], 0, ...r[1], 0, ...r[2], 0, 0, 0, 0, 1);
    return new THREE.Quaternion().setFromRotationMatrix(m);
}
const htmlLogo = ch => isImg(ch) ? '<img class="lg" src="' + IMGS[ch].src + '" alt="">' : ch;
function htmlSel(c, cls) {
    return `<div class="c ${c.ch ? '' : 'p'} ${cls || ''}"><span class="${isImg(c.ch) ? 'lw' : ''}" style="transform:rotate(${-c.deg}deg)">${htmlLogo(c.ch)}</span></div>`;
}
function htmlSelJaring(c) {
    if (c.ch === null)
        return `<div class="c u"><span>?</span></div>`;
    return htmlSel(c);
}
function netRender() { // jaring 6 sisi: ikut hasil scan/editor kalau ada perubahan, kalau tidak ikut kubus 3D
    const pos = {
        U: [2, 1], L: [1, 2], F: [2, 2], R: [3, 2], B: [4, 2], D: [2, 3]
    };
    const nm = {
        U: 'U atas', L: 'L kiri', F: 'F depan', R: 'R kanan', B: 'B belakang', D: 'D bawah'
    };
    const useE = dirty && typeof selEditor !== 'undefined' && selEditor.U && selEditor.L && selEditor.F && selEditor.R && selEditor.B && selEditor.D;
    $('net').innerHTML = Object.keys(pos).map(f => {
        const cells = useE ? selEditor[f] : grid(cube, NORMAL_MUKA[f], SUMBU_MUKA[f][0], SUMBU_MUKA[f][1]).flat();
        return `<div style="grid-column:${pos[f][0]};grid-row:${pos[f][1]}"><div class="t">${nm[f]}</div><div class="f"><div class="g3">${cells.map(c => htmlSelJaring(c)).join('')}</div></div></div>`;
    }).join('');
    const nt = $('netnote');
    if (nt)
        nt.textContent = useE ? 'Menampilkan hasil scan atau suntingan (belum diterapkan ke kubus 3D). Tekan Terapkan ke 3D (atau Cari langkah) untuk menyamakan.' : 'Menampilkan susunan kubus 3D saat ini.';
}
function perbaruiJaring() { // jaring
    if (!dirty)
        isiEditorDariKubus();
    else
        netRender();
}
function gambarMukaDepan() {
    tampilkanPratinjau();
    const w = targetSaatIni();
    const e = w.e;
    if (!e) {
        $('status').textContent = '';
        return;
    }
    const r = periksaMuka(cube, e[1], e[2], w.rows);
    $('front').innerHTML = r.g.flat().map(c => htmlSel(c, c.bad ? 'w' : '')).join('');
    $('status').innerHTML = r.ok ? '<span class="ok">COCOK ✓</span>' : '<span class="bad">Belum cocok</span>';
    $('want').textContent = 'Target: ' + w.rows.join(' · ');
}
function info() {
    const w = targetSaatIni();
    const e = w.e;
    $('info').innerHTML = catatanHijriah(w) + (e ? `Putaran (${parse(e[0]).length}):<span class="seq">${e[0].split(' ').map(m => `<code>${m}</code>`).join('')}</span>Lalu pegang kubus dengan pusat <b>${e[1]}</b> menghadap Anda dan pusat <b>${e[2]}</b> di atas.` : (jenisKalender == 'h' ? 'Kombinasi ini belum tersedia dalam tabel. Coba atur koreksi ±1 hari.' : 'Tanggal ini di luar cakupan tabel. Pilih tanggal lain.'));
    gambarMukaDepan();
    sinkronTanggal();
}
function reset() {
    endGuide();
    queue = [];
    gerakanAktif = null;
    riwayat = [];
    merekam = true;
    cube.forEach(p => {
        p.pos = p.p0;
        p.R = MATRIKS_IDENTITAS;
    });
    sync();
    rotasiDasar = new THREE.Quaternion();
    setView();
    perbaruiJaring();
    gambarMukaDepan();
}
const setKamera = n => {
    modeKamera = n;
    $('c1').className = n == 1 ? 'pri' : '';
    $('c3').className = n == 3 ? 'pri' : '';
    setView();
};
$('c1').onclick = () => setKamera(1);
$('c3').onclick = () => setKamera(3);
$('reset').onclick = reset;
$('dt').onchange = () => {
    endGuide();
    info();
};
$('hold').onclick = () => {
    const e = targetSaatIni().e;
    if (e) {
        if (modePratinjau) {
            tampilkanPratinjau();
            return;
        }
        rotasiDasar = rotasiPegang(e[1], e[2]);
        setView();
        gambarMukaDepan();
    }
};
$('go').onclick = () => {
    const e = targetSaatIni().e;
    if (!e) {
        noDate();
        return;
    }
    if (gerakanAktif || queue.length)
        return;
    const pl = planFromCurrent(e);
    if (!pl)
        return;
    endGuide();
    queue = pl.m.slice();
    riwayat = [];
    merekam = true;
    saatSelesai = () => {
        rotasiDasar = rotasiPegang(e[1], e[2]);
        setView();
        gambarMukaDepan();
    };
};
const pesanGerakan = (t, bad) => {
    const m = $('mvmsg');
    m.textContent = t;
    m.style.cssText = 'margin:6px 0 0;' + (t ? 'padding:6px 8px;border:1px solid var(--line);border-left:4px solid ' + (bad ? 'var(--bad)' : 'var(--ok)') + ';font-weight:600' : '');
};
function kembangkanGerakan(t) { // (R U)3 -> R U R U R U ; kurung bersarang didukung
    let s = normMv(t);
    let n = 0;
    const re = /[(\[]([^()\[\]]*)[)\]]\s*(\d{1,2})?/;
    while (re.test(s) && n++ < 20)
        s = s.replace(re, (_, g, k) => Array(Math.min(Math.max(+k || 1, 1), 20)).fill(g).join(' ') + ' ');
    return s;
}
$('run').onclick = () => {
    const raw = $('mv').value;
    const txt = kembangkanGerakan(raw);
    if (/[()\[\]]/.test(txt)) {
        pesanGerakan('Tanda kurung tidak seimbang. Contoh benar: (R U R\' U\')2', 1);
        return;
    }
    const bad = badMv(txt.replace(/[.|·•]/g, ' '));
    const mvs = parse(txt);
    if (bad) {
        pesanGerakan('Tidak ada yang dijalankan. Notasi tidak dikenali: "' + bad + '". Pakai huruf U D L R F B, boleh diikuti \' atau 2 (mis. R U\' F2); tanda kurung untuk pengulangan, mis. (R U)3.', 1);
        return;
    }
    if (!mvs.length) {
        pesanGerakan('Tulis putaran dulu, contoh: R U R\' U\'', 1);
        return;
    }
    if (mvs.length > 200) {
        pesanGerakan('Terlalu panjang (maks. 200 putaran sekali jalan).', 1);
        return;
    }
    endGuide();
    queue.push(...mvs);
    saatSelesai = gambarMukaDepan;
    pesanGerakan(mvs.length + ' putaran dijalankan: ' + mvs.map(([f, k]) => f + (k == 3 ? "'" : k == 2 ? '2' : '')).join(' '), 0);
};
$('mv').onkeydown = e => {
    if (e.key == 'Enter')
        $('run').click();
};
for (const f of 'URFDLB')
    for (const s of ['', "'", '2']) {
        const b = document.createElement('button');
        b.textContent = f + s;
        b.onclick = () => {
            endGuide();
            queue.push(...parse(f + s));
            saatSelesai = gambarMukaDepan;
            pesanGerakan('', 0);
        };
        $('mvs').appendChild(b);
    }
let riwayat = [];
let merekam = true;
const pesan = (t, bad) => {
    const m = $('msg');
    m.textContent = t;
    m.style.cssText = 'margin-top:6px;padding:6px 8px;border:1px solid var(--line);border-left:4px solid ' + (bad ? 'var(--bad)' : 'var(--ok)') + ';font-weight:600';
    try {
        m.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
    catch (e) {
    }
};
let selEditor = {};
let hurufDipilih = 'A';
let modeEditor = 'isi';
let dirty = false;
const DAFTAR_HURUF = [...new Set(DATA.map(d => d[6]).filter(Boolean))].sort().concat('-');
const DAFTAR_MUKA = 'URFDLB'.split('');
function isiEditorDariKubus() {
    for (const f of DAFTAR_MUKA)
        selEditor[f] = grid(cube, NORMAL_MUKA[f], SUMBU_MUKA[f][0], SUMBU_MUKA[f][1]).flat().map(c => ({
            ch: c.ch, deg: c.deg, inf: false
        }));
    dirty = false;
    gambarEditor();
}
function gambarEditor() {
    const pos = {
        U: [2, 1], L: [1, 2], F: [2, 2], R: [3, 2], B: [4, 2], D: [2, 3]
    };
    const nm = {
        U: 'U atas', L: 'L kiri', F: 'F depan', R: 'R kanan', B: 'B belakang', D: 'D bawah'
    };
    $('ed').innerHTML = Object.keys(pos).map(f => `<div style="grid-column:${pos[f][0]};grid-row:${pos[f][1]}"><div class="t">${nm[f]}</div><div class="f"><div class="g3">${selEditor[f].map((c, i) => `<div class="c ${c.ch === null ? 'u' : c.ch ? '' : 'p'}${i == 4 ? ' m' : ''}${c.inf ? ' i' : ''}" data-f="${f}" data-i="${i}"><span class="${isImg(c.ch) ? 'lw' : ''}" style="transform:rotate(${-c.deg}deg)">${c.ch === null ? '?' : htmlLogo(c.ch)}</span></div>`).join('')}</div></div></div>`).join('');
    $('chips').innerHTML = DAFTAR_MUKA.map(f => `<button class="chip ${selEditor[f].some(c => c.ch === null) ? 'x' : ''}" data-f="${f}">Kosongkan ${f}</button>`).join('') + '';
    netRender();
    liveSync();
}
const kosongkanMuka = f => selEditor[f].forEach((c, i) => {
    if (i != 4) {
        c.ch = null;
        c.inf = false;
    }
});
$('chips').onclick = e => {
    const b = e.target.closest('button');
    if (!b)
        return;
    kosongkanMuka(b.dataset.f);
    dirty = true;
    gambarEditor();
};
function gambarPalet() {
    $('pal').innerHTML = DAFTAR_HURUF.map(g => `<button class="${g == hurufDipilih ? 'pri' : ''}" data-g="${g}">${g == '-' ? 'polos' : htmlLogo(g)}</button>`).join('');
    $('mi').textContent = modeEditor == 'isi' ? 'Mode: Isi huruf' : 'Mode: Putar huruf';
    $('mi').className = modeEditor == 'isi' ? 'pri' : '';
}
$('pal').onclick = e => {
    const b = e.target.closest('button');
    if (!b)
        return;
    hurufDipilih = b.dataset.g;
    modeEditor = 'isi';
    gambarPalet();
};
$('mi').onclick = () => {
    modeEditor = modeEditor == 'isi' ? 'putar' : 'isi';
    gambarPalet();
};
$('ed').onclick = e => {
    const c = e.target.closest('.c');
    if (!c)
        return;
    const s = selEditor[c.dataset.f][+c.dataset.i];
    if (+c.dataset.i == 4 || modeEditor == 'putar')
        s.deg = (s.deg + 90) % 360;
    else {
        s.ch = hurufDipilih == '-' ? '' : hurufDipilih;
        s.inf = false;
        s.lk = true;
        s.cf = 1;
        s.w = false;
        if (s.pv && s.ch && window.__learn) {
            window.__learn(s.ch, s.pv);
            s.pv = null;
        }
    }
    dirty = true;
    gambarEditor();
};
const teksJaringEditor = () => {
    if (DAFTAR_MUKA.some(f => selEditor[f].some(c => c.ch === null)))
        throw new Error('Masih ada kotak kosong (?). Isi, atau klik Lengkapi sisi lain.');
    return 'ULFRBD'.split('').map(f => f + ' ' + selEditor[f].map(c => c.ch || '-').join('') + ' ' + selEditor[f][4].deg / 90).join('\n');
};
const panaskanPencarian = () => {
    if (!pulihkanKubus.bw)
        setTimeout(() => {
            try {
                pulihkanKubus(makeCube());
            }
            catch (e) {
            }
        }, 400);
}; // siapkan tabel pencari jalan di latar belakang agar klik pertama tidak macet
const selDariEditor = () => {
    const cell = {};
    for (const f of DAFTAR_MUKA)
        selEditor[f].forEach((c, i) => {
            if (c.ch !== null)
                cell[kunciSel(f, i)] = c.ch;
        });
    return cell;
};
function pickBest(sols) { // kalau ada beberapa kemungkinan, pilih yang mengubah kotak paling tidak yakin
    let best = sols[0];
    let bs = Infinity;
    for (const so of sols) {
        const m = selDariSolusi(so);
        let sc = 0;
        for (const f of DAFTAR_MUKA)
            selEditor[f].forEach((c, i) => {
                const k = kunciSel(f, i);
                if (c.ch !== null && m[k] !== undefined && m[k] !== c.ch)
                    sc += (c.w ? .1 : (c.cf == null ? .6 : c.cf)) + .01;
            });
        if (sc < bs) {
            bs = sc;
            best = so;
        }
    }
    return best;
}
function applyCorrected(sol) {
    const m = selDariSolusi(sol);
    let n = 0;
    for (const f of DAFTAR_MUKA)
        selEditor[f].forEach((c, i) => {
            const k = kunciSel(f, i);
            if (m[k] !== undefined && m[k] !== c.ch) {
                c.ch = m[k];
                c.inf = true;
                c.w = false;
                n++;
            }
        });
    return n;
}
function show3D() {
    rotasiDasar = new THREE.Quaternion();
    setView();
    bangunkanRender();
    resize();
} // sejajarkan tampilan 3D dengan jaring (F depan, U atas)
function verify3D() {
    let d = 0;
    for (const f of DAFTAR_MUKA) {
        const g = grid(cube, NORMAL_MUKA[f], SUMBU_MUKA[f][0], SUMBU_MUKA[f][1]).flat();
        g.forEach((c, i) => {
            if ((c.ch || '') !== (selEditor[f][i].ch || ''))
                d++;
        });
    }
    return d;
} // selisih jaring vs kubus 3D
const terapkanEditor = () => { // mencoba persis dulu; kalau ada huruf salah baca, dikoreksi otomatis lalu diterapkan
    let note = '';
    try {
        parseNet(teksJaringEditor(), cube);
    }
    catch (e) {
        if (!/^(Keping|Dua keping)/.test(e.message))
            throw e;
        const r = fit(selDariEditor(), cube, 6);
        if (!r.n)
            throw new Error(r.capped ? 'Terlalu banyak huruf yang tidak cocok. Scan ulang sisi yang ragu.' : 'Lebih dari 6 kotak tidak cocok dengan aturan kubus. Banyak huruf salah baca: scan ulang sisi yang ragu atau perbaiki di jaring.');
        const n = applyCorrected(pickBest(r.sols));
        gambarEditor();
        parseNet(teksJaringEditor(), cube);
        note = ' ' + n + ' kotak yang tidak cocok dengan aturan kubus dikoreksi otomatis (huruf biru).';
    }
    queue = [];
    gerakanAktif = null;
    riwayat = [];
    sync();
    show3D();
    perbaruiJaring();
    gambarMukaDepan();
    const dif = verify3D();
    dirty = false;
    gambarEditor();
    panaskanPencarian();
    if (dif)
        note += ' ⚠ ' + dif + ' kotak kubus 3D masih berbeda dari jaring.';
    return note;
};
function bukaLanjutan() {
    try {
        const d = $('adv');
        if (d && 'open' in d)
            d.open = true;
    }
    catch (e) {
    }
}
function autoApply(pm, doneSet) { // setelah scan: sisi yang tidak di-scan dikosongkan & dilengkapi dari aturan kubus, lalu diterapkan ke 3D
    if (!dirty)
        return;
    bukaLanjutan();
    try {
        let note = '';
        if (doneSet && doneSet.size && doneSet.size < 6) {
            DAFTAR_MUKA.forEach(f => {
                if (!doneSet.has(f))
                    kosongkanMuka(f);
            });
            gambarEditor();
        }
        if (DAFTAR_MUKA.some(f => selEditor[f].some(c => c.ch === null))) {
            autoFill(true);
            note = ' (sisi yang tidak di-scan/kosong dilengkapi otomatis, huruf biru)' + (lastAmb ? '. Ada lebih dari satu kemungkinan untuk sisi yang tidak di-scan; dipilih salah satu. Scan sisi tersebut agar pasti.' : '');
        }
        note += terapkanEditor();
        pesan('Hasil scan diterapkan ke kubus 3D ✓' + (pm || '') + note);
    }
    catch (e) {
        pesan('Belum bisa diterapkan ke 3D: ' + e.message, 1);
    }
}
let liveBusy = false;
function liveSync() { // sambungkan jaring <-> kubus 3D: kalau jaring lengkap & sah, langsung terapkan ke 3D
    if (liveBusy || !dirty || gerakanAktif || queue.length)
        return false;
    if (DAFTAR_MUKA.some(f => selEditor[f].some(c => c.ch === null)))
        return false;
    liveBusy = true;
    try {
        try {
            parseNet(teksJaringEditor(), cube);
        }
        catch (e) {
            pesan('Jaring belum valid menurut aturan kubus, sehingga tampilan 3D belum diubah (' + e.message + '). Tekan Terapkan ke 3D untuk koreksi otomatis.', 1);
            return false;
        }
        queue = [];
        gerakanAktif = null;
        riwayat = [];
        sync();
        show3D();
        gambarMukaDepan();
        dirty = false;
        gambarEditor();
        panaskanPencarian();
        pesan('Kubus 3D otomatis tersambung dengan jaring ✓');
        return true;
    }
    finally {
        liveBusy = false;
    }
}
let lastAmb = false;
function autoFill(amb) { // lengkapi kotak kosong (?) dari aturan kubus; lempar Error kalau gagal
    const cell = {};
    for (const f of DAFTAR_MUKA)
        selEditor[f].forEach((c, i) => {
            if (c.ch !== null)
                cell[kunciSel(f, i)] = c.ch;
        });
    let r = complete(cell, cube);
    let corr = false;
    if (r.n == 0 && !r.capped) {
        const q = fit(cell, cube, 6);
        if (q.n) {
            r = q;
            corr = true;
        }
    }
    if (r.n == 0)
        throw new Error(r.capped ? 'Terlalu rumit; isi lebih banyak sisi.' : 'Tidak ada susunan kubus yang cocok dengan huruf di jaring. Ada huruf yang salah baca/tertukar: periksa sisi yang masih kosong atau huruf yang mirip (mis. P/D, 6/9, N/Z, M/W).');
    const m1 = selDariSolusi(corr ? pickBest(r.sols) : r.sols[0]);
    lastAmb = r.n > 1 && !corr;
    if (r.n > 1 && !corr && !amb) {
        const m2 = selDariSolusi(r.sols[1]);
        const fs = new Set();
        for (const k in m1)
            if (m1[k] !== m2[k])
                fs.add(DAFTAR_MUKA.find(f => dot(NORMAL_MUKA[f], k.split('|')[1].split(',').map(Number)) == 1));
        throw new Error('Belum unik: ada lebih dari satu kemungkinan. Isi juga sisi: ' + [...fs].join(', ') + '.');
    }
    DAFTAR_MUKA.forEach(f => selEditor[f].forEach((c, i) => {
        const k = kunciSel(f, i);
        if (c.ch === null || (corr && m1[k] !== undefined && m1[k] !== c.ch)) {
            c.ch = m1[k];
            c.inf = true;
            c.w = false;
        }
    }));
    dirty = true;
    gambarEditor();
}
$('b1').onclick = () => {
    if (dirty && !confirm('Isi jaring/hasil scan akan diganti dengan susunan kubus 3D. Lanjut?'))
        return;
    isiEditorDariKubus();
    pesan('Jaring dimuat dari kubus 3D.');
};
$('b2').onclick = () => {
    try {
        let note = '';
        if (DAFTAR_MUKA.some(f => selEditor[f].some(c => c.ch === null))) {
            autoFill();
            note = ' (kotak kosong dilengkapi otomatis, huruf biru)';
        }
        note += terapkanEditor();
        pesan('Kubus 3D disamakan dengan jaring.' + note);
    }
    catch (e) {
        pesan(e.message, 1);
    }
};
$('b3').onclick = () => {
    if (dirty) {
        try {
            if (DAFTAR_MUKA.some(f => selEditor[f].some(c => c.ch === null)))
                autoFill();
            terapkanEditor();
        }
        catch (e) {
            pesan(e.message, 1);
            return;
        }
    }
    pesan('Menghitung (maks. 10 putaran)…');
    setTimeout(() => {
        const r = pulihkanKubus(cube);
        if (r === null) {
            pesan('Langkah tidak ditemukan dalam 10 putaran. Periksa kembali huruf di jaring, atau gunakan Urungkan dengan riwayat.');
            return;
        }
        if (!r.length) {
            pesan('Sudah di acuan.');
            return;
        }
        pesan('Perbaikan (' + r.length + '): ' + r.join(' '));
        riwayat = [];
        queue = parse(r.join(' '));
        saatSelesai = () => {
            pesan('Perbaikan (' + r.length + '): ' + r.join(' ') + ' → ' + (isHome(cube) ? 'kubus kembali ke acuan ✓' : 'belum kembali ke acuan'));
            gambarMukaDepan();
        };
    }, 30);
};
$('b4').onclick = () => {
    if (!riwayat.length) {
        pesan('Riwayat putaran masih kosong.');
        return;
    }
    merekam = false;
    queue = riwayat.slice().reverse().map(([f, k]) => [f, 4 - k]);
    saatSelesai = () => {
        merekam = true;
        riwayat = [];
        pesan(isHome(cube) ? 'Kembali ke acuan ✓' : 'Belum kembali ke acuan (kubus pernah diubah lewat teks).');
        gambarMukaDepan();
    };
};
// ===== Panduan langkah (pemula) =====
const NAMA_MUKA = {
    U: 'ATAS', D: 'BAWAH', L: 'KIRI', R: 'KANAN', F: 'DEPAN', B: 'BELAKANG'
};
let panduan = null;
const sedangBerjalan = () => gerakanAktif || queue.length;
const bidangSorot = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 3.2), new THREE.MeshBasicMaterial({
    color: 0xd5121c, transparent: true, opacity: .4, depthWrite: false, side: THREE.DoubleSide
}));
bidangSorot.visible = false;
root.add(bidangSorot);
function sorotMuka(f) {
    if (!f) {
        bidangSorot.visible = false;
        return;
    }
    const n = new V3(...NORMAL_MUKA[f]);
    bidangSorot.position.copy(n).multiplyScalar(1.6);
    bidangSorot.quaternion.setFromUnitVectors(new V3(0, 0, 1), n);
    bidangSorot.visible = true;
}
function arahkanKamera(f) {
    const n = new V3(...NORMAL_MUKA[f]);
    rotasiTarget = new THREE.Quaternion().setFromEuler(new THREE.Euler(25 * Math.PI / 180, -30 * Math.PI / 180, 0, 'XYZ')).multiply(new THREE.Quaternion().setFromUnitVectors(n, new V3(0, 0, 1)));
}
function endGuide() {
    panduan = null;
    $('guide').hidden = true;
    bidangSorot.visible = false;
}
function tampilkanLangkah() {
    const n = panduan.m.length;
    const i = panduan.i;
    const e = panduan.e;
    let big;
    let txt;
    $('gfill').style.width = (i / (n + 1) * 100) + '%';
    $('gnum').textContent = i == 0 ? 'Persiapan' : i <= n ? `Langkah ${i} dari ${n}` : 'Selesai!';
    sorotMuka(null);
    if (i == 0) {
        rotasiDasar = new THREE.Quaternion();
        setView();
        big = '<svg viewBox="0 0 64 64" style="width:44px;height:44px"><use href="#i-logo"/></svg>';
        txt = (panduan.direct ? 'Kubus di layar sama dengan kubus fisik hasil scan. <b>' + n + ' langkah</b> berikut menyusun muka tanggal langsung dari susunan itu (tanpa kembali ke acuan). ' : '') + (panduan.pre ? 'Kubus di layar sama dengan kubus fisik hasil scan. <b>' + panduan.pre + ' langkah pertama</b> mengembalikannya ke posisi acuan, lalu ' + (n - panduan.pre) + ' langkah menyusun tanggal. ' : '') + 'Target muka depan: <b>' + targetSaatIni().rows.join(' · ') + '</b>. ' + (panduan.pre || panduan.direct ? 'Pegang kubus fisik seperti saat Anda scan (sisi F menghadap Anda, U di atas).' : 'Pegang kubus asli seperti posisi awal:') + (panduan.pre || panduan.direct ? '' : ' pusat <b>E</b> menghadap Anda dan pusat <b>A</b> di atas. Pusat adalah kotak di tengah tiap sisi (tidak pernah berpindah). Kubus di layar sudah dalam posisi ini.') + '';
    }
    else if (i <= n) {
        const [f, k] = panduan.m[i - 1];
        big = `<span class="mvl">${f + (k == 3 ? "'" : k == 2 ? '2' : '')}</span><span>${k == 3 ? '↺' : k == 2 ? '↻↻' : '↻'}</span>`;
        txt = (i <= panduan.pre ? '<i>(Pemulihan ke acuan ' + i + '/' + panduan.pre + ')</i> ' : '') + `Putar sisi <b>${NAMA_MUKA[f]} (${f})</b> ${k == 2 ? '<b>180°</b> (dua kali 90°, arah bebas)' : k == 3 ? '<b>90° berlawanan jarum jam</b>' : '<b>90° searah jarum jam</b>'}, dilihat langsung dari sisi itu. Setelah memutar kubus asli, tekan Lanjut.`;
        sorotMuka(f);
        if ($('gcam').checked)
            arahkanKamera(f);
    }
    else {
        rotasiDasar = rotasiPegang(e[1], e[2]);
        setView();
        big = '✓';
        txt = `Putaran selesai. Pegang kubus: pusat <b>${e[1]}</b> menghadap Anda dan pusat <b>${e[2]}</b> di atas. Muka depan sekarang menunjukkan tanggalnya. Bandingkan dengan kotak Target; jika berbeda, tekan Sebelumnya dan periksa langkah terakhir.`;
    }
    $('gbig').innerHTML = big;
    $('gtxt').innerHTML = txt;
    $('gchips').innerHTML = panduan.m.map(([f, k], j) => `<span class="sc ${j < i - 1 ? 'd' : j == i - 1 ? 'n' : ''}">${f + (k == 3 ? "'" : k == 2 ? '2' : '')}</span>`).join('');
    $('gprev').disabled = i == 0;
    $('gnext').disabled = i > n;
    $('gnext').textContent = i == 0 ? 'Mulai ›' : 'Sudah, lanjut ›';
    $('gauto').disabled = i > n;
    $('greplay').disabled = i < 1 || i > n;
    gambarMukaDepan();
}
function planFromCurrent(e) { // mulai dari kubus 3D saat ini (mis. hasil scan), tanpa batas jumlah langkah
    if (dirty) {
        try {
            terapkanEditor();
        }
        catch (x) {
            $('info').innerHTML = '<span class="bad">Jaring belum bisa diterapkan ke 3D: ' + x.message + '</span>';
            return null;
        }
    }
    const alg = parse(e[0]);
    let best = null;
    if (isHome(cube))
        return {
            pre: [], m: alg, direct: false
        };
    try {
        const r = pulihkanKubus(cube);
        if (r !== null) {
            const pre = parse(r.join(' '));
            best = {
                pre, m: pre.concat(alg), direct: false
            };
        }
    }
    catch (x) {
    }
    try {
        const d = solveDate(cube, e[1], e[2], alg);
        if (d.ok) {
            const m = mergeMoves(d.moves);
            if (!best || m.length < best.m.length)
                best = {
                    pre: [], m, direct: true
                };
        }
    }
    catch (x) {
    }
    if (!best) {
        $('info').innerHTML = '<span class="bad">Susunan kubus ini tidak bisa diselesaikan (mungkin ada huruf yang salah baca di jaring). Periksa jaring, lalu coba lagi.</span>';
        return null;
    }
    return best;
}
$('gstart').onclick = () => {
    const e = targetSaatIni().e;
    if (!e) {
        noDate();
        return;
    }
    if (gerakanAktif || queue.length)
        return;
    const pl = planFromCurrent(e);
    if (!pl)
        return;
    queue = [];
    gerakanAktif = null;
    riwayat = [];
    merekam = true;
    saatSelesai = null;
    panduan = {
        m: pl.m, e, i: 0, pre: pl.pre.length, direct: pl.direct
    };
    $('guide').hidden = false;
    $('info').innerHTML = '';
    tampilkanLangkah();
};
$('gnext').onclick = () => {
    if (!panduan || sedangBerjalan())
        return;
    const n = panduan.m.length;
    if (panduan.i == 0) {
        panduan.i = 1;
        tampilkanLangkah();
    }
    else if (panduan.i <= n) {
        sorotMuka(null);
        queue.push(panduan.m[panduan.i - 1]);
        panduan.i++;
        saatSelesai = tampilkanLangkah;
    }
};
$('gprev').onclick = () => {
    if (!panduan || sedangBerjalan() || panduan.i == 0)
        return;
    if (panduan.i >= 2) {
        const [f, k] = panduan.m[panduan.i - 2];
        panduan.i--;
        sorotMuka(null);
        rotasiDasar = new THREE.Quaternion();
        setView();
        merekam = false;
        queue.push([f, 4 - k]);
        saatSelesai = () => {
            merekam = true;
            riwayat.pop();
            tampilkanLangkah();
        };
    }
    else {
        panduan.i = 0;
        tampilkanLangkah();
    }
};
$('gauto').onclick = () => {
    if (!panduan || sedangBerjalan())
        return;
    const n = panduan.m.length;
    if (panduan.i > n)
        return;
    sorotMuka(null);
    queue.push(...panduan.m.slice(Math.max(panduan.i - 1, 0)));
    panduan.i = n + 1;
    if (queue.length)
        saatSelesai = tampilkanLangkah;
    else
        tampilkanLangkah();
};
$('gcam').onchange = () => {
    if (panduan && panduan.i >= 1 && panduan.i <= panduan.m.length) {
        if ($('gcam').checked)
            arahkanKamera(panduan.m[panduan.i - 1][0]);
        else
            setView();
    }
};
function noDate() {
    $('info').innerHTML = '<span class="bad">Tanggal ini belum tersedia. Pilih tanggal lain.</span>';
}
$('greplay').onclick = () => {
    if (!panduan || sedangBerjalan() || panduan.i < 1 || panduan.i > panduan.m.length)
        return;
    const [f, k] = panduan.m[panduan.i - 1];
    sorotMuka(null);
    merekam = false;
    queue.push([f, k]);
    saatSelesai = () => {
        queue.push([f, 4 - k]);
        saatSelesai = () => {
            merekam = true;
            tampilkanLangkah();
        };
    };
};
addEventListener('keydown', e => {
    const a = document.activeElement;
    if (!panduan || $('appv').hidden || (a && (a.tagName == 'TEXTAREA' || (a.tagName == 'INPUT' && a.type != 'checkbox'))))
        return;
    if (e.key == 'ArrowRight')
        $('gnext').click();
    else if (e.key == 'ArrowLeft')
        $('gprev').click();
});
$('dt').value = new Date(Date.now() - new Date().getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
if (!targetSaatIni().e)
    $('dt').value = '2026-11-04';
// ===== Pengantar & latihan notasi =====
const DESKRIPSI_PUTARAN = {
    '': '90° searah jarum jam', "'": '90° berlawanan jarum jam', '2': '180°'
};
const DAFTAR_MUKA_KUIS = 'URFDLB'.split('');
const AKHIRAN_GERAKAN = ['', "'", '2'];
const pilihAcak = a => a[Math.random() * a.length | 0];
const deskripsiGerakan = (f, m) => `Sisi ${NAMA_MUKA[f]} ${DESKRIPSI_PUTARAN[m]}`;
// semua 18 notasi tunggal (6 sisi × 3 jenis putaran), setiap putaran latihan memuat ke-18 notasi, urutannya diacak
const SEMUA_GERAKAN = DAFTAR_MUKA_KUIS.flatMap(f => AKHIRAN_GERAKAN.map(m => [f, m]));
const kocok = a => {
    a = a.slice();
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.random() * (i + 1) | 0;
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
};
let sisaSoal = [];
const JUMLAH_SOAL = SEMUA_GERAKAN.length;
let kuis = {
    n: 0, ok: 0, ans: '', done: false
};
function soalBaru() {
    if (kuis.n >= JUMLAH_SOAL) {
        $('iq').innerHTML = `<div class="qbig" style="font-size:28px">Skor ${kuis.ok}/${JUMLAH_SOAL}</div><div class="sub">${kuis.ok >= Math.ceil(JUMLAH_SOAL * .8) ? 'Anda siap memakai panduan.' : 'Pelajari lagi notasi di atas, lalu coba sekali lagi.'}</div><button id="iretry">Ulangi latihan</button>`;
        return;
    }
    if (kuis.n == 0)
        sisaSoal = kocok(SEMUA_GERAKAN);
    const [f, m] = sisaSoal.pop();
    const a = deskripsiGerakan(f, m);
    const s = new Set([a]);
    s.add(deskripsiGerakan(f, pilihAcak(AKHIRAN_GERAKAN.filter(x => x != m))));
    s.add(deskripsiGerakan(pilihAcak(DAFTAR_MUKA_KUIS.filter(x => x != f)), m));
    while (s.size < 4)
        s.add(deskripsiGerakan(pilihAcak(DAFTAR_MUKA_KUIS), pilihAcak(AKHIRAN_GERAKAN)));
    kuis.ans = a;
    kuis.done = false;
    $('iq').innerHTML = `<div class="sub">Soal ${kuis.n + 1} dari ${JUMLAH_SOAL}: apa arti putaran ini?</div><div class="qbig">${f + m}</div><div class="qopts">${[...s].sort(() => Math.random() - .5).map(t => `<button data-t="${t}">${t}</button>`).join('')}</div><div id="ifb" class="sub" style="margin-top:8px"></div>`;
}
$('iq').onclick = e => {
    const b = e.target.closest('button');
    if (!b)
        return;
    if (b.id == 'iretry') {
        kuis = {
            n: 0, ok: 0, ans: '', done: false
        };
        soalBaru();
        return;
    }
    if (b.id == 'inext') {
        kuis.n++;
        soalBaru();
        return;
    }
    if (kuis.done || !b.dataset.t)
        return;
    kuis.done = true;
    const ok = b.dataset.t == kuis.ans;
    if (ok)
        kuis.ok++;
    b.classList.add(ok ? 'ok' : 'bad');
    if (!ok)
        [...$('iq').querySelectorAll('.qopts button')].find(x => x.dataset.t == kuis.ans).classList.add('ok');
    $('ifb').innerHTML = (ok ? '<b>Benar ✓</b> ' : '<b>Belum tepat.</b> Jawaban: ' + kuis.ans + '. ') + '<button id="inext">' + (kuis.n >= JUMLAH_SOAL - 1 ? 'Lihat skor' : 'Soal berikutnya') + ' ›</button>';
};
soalBaru();
function pindahTab(n, nohash) {
    $('home').hidden = n != 'home';
    $('intro').hidden = n != 'tut';
    $('appv').hidden = n != 'app';
    $('stk').hidden = n != 'stk';
    $('ttut').className = n == 'tut' ? 'on' : '';
    $('tapp').className = n == 'app' ? 'on' : '';
    $('tstk').className = n == 'stk' ? 'on' : '';
    $('ttut').setAttribute('aria-selected', n == 'tut');
    $('tapp').setAttribute('aria-selected', n == 'app');
    if (n == 'app')
        resize();
    if (n == 'stk')
        gambarLembarStiker();
    scrollTo(0, 0);
    $('tstk').setAttribute('aria-selected', n == 'stk');
    document.title = JUDUL_TAB[n];
    if (!nohash) {
        const h = HASH_TAB[n] ? '#' + HASH_TAB[n] : '';
        if ((location.hash || '') !== h) {
            try {
                history.pushState(null, '', h || location.pathname + location.search);
            }
            catch (e) {
            }
        }
    }
}
const HASH_TAB = {
    home: '', tut: 'tutorial', app: 'aplikasi', stk: 'stiker'
};
const JUDUL_TAB = {
    home: 'Cubelendar', tut: 'Tutorial · Cubelendar', app: 'Aplikasi utama · Cubelendar', stk: 'Stiker PNG · Cubelendar'
};
const fromHash = () => Object.keys(HASH_TAB).find(k => HASH_TAB[k] && '#' + HASH_TAB[k] == location.hash) || 'home';
addEventListener('popstate', () => pindahTab(fromHash(), 1));
$('thome').onclick = () => pindahTab('home');
$('tstk').onclick = $('hstk').onclick = () => pindahTab('stk');
function gambarStiker(x, X, Y, S, c, m, cut) {
    x.beginPath();
    x.roundRect ? x.roundRect(X, Y, S, S, .12 * S) : x.rect(X, Y, S, S);
    x.fillStyle = c.ch ? WARNA_STIKER.bg : warnaPolos();
    x.fill();
    if (cut) {
        x.strokeStyle = '#8a8a8a';
        x.lineWidth = Math.max(1, S * .012);
        x.stroke();
    }
    if (!c.ch)
        return;
    const cx = X + S / 2;
    const cy = Y + S / 2;
    x.save();
    x.translate(cx, cy);
    x.rotate(-c.deg * Math.PI / 180);
    x.fillStyle = WARNA_STIKER.fg;
    x.font = `bold ${.66 * S}px Arial,sans-serif`;
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    if (isImg(c.ch))
        drawLogo(x, S, c.ch);
    else
        x.fillText(c.ch, 0, .04 * S);
    x.restore();
    x.fillStyle = warnaTanda();
    const [vx, vy] = m.v;
    if (m.k == 2) {
        x.beginPath();
        x.arc(cx + .433 * S * vx, cy - .433 * S * vy, .05 * S, 0, 7);
        x.fill();
    }
    else if (m.k == 1) {
        if (vx == 0)
            x.fillRect(cx - .167 * S, cy - .467 * S * vy - .025 * S, .333 * S, .05 * S);
        else
            x.fillRect(cx + .467 * S * vx - .025 * S, cy - .167 * S, .05 * S, .333 * S);
    }
}
const PAPERS = {
    A0: [1189, 841, 150], A1: [841, 594, 200], A2: [594, 420, 300], A3: [420, 297, 300], A4: [297, 210, 300], A5: [210, 148, 300], A6: [148, 105, 300]
};
function ukuranStikerMaks() {
    const [w, h] = PAPERS[$('spp').value];
    return Math.floor(Math.min((h - 12) / 3, (w - 12) / 4) * 2) / 2;
}
function gambarLembarStiker() {
    const cv = $('scv');
    const pn = $('spp').value;
    const [PW, PH, dpi] = PAPERS[pn];
    const mx = ukuranStikerMaks();
    const mn = 25;
    $('ssz').max = mx;
    const rq = +$('ssz').value;
    const cu = Math.min(mx, Math.max(mn, rq || 56));
    const p = cu / 3;
    const smm = Math.round(p * .8 * 10) / 10;
    const cut = $('scut').checked;
    const k = dpi / 25.4;
    const W = Math.round(PW * k);
    const H = Math.round(PH * k);
    cv.width = W;
    cv.height = H;
    const x = cv.getContext('2d');
    x.fillStyle = '#fff';
    x.fillRect(0, 0, W, H);
    const w = 4 * cu;
    const h = 3 * cu;
    const ox = (PW - w) / 2;
    const oy = (PH - h) / 2;
    const hc = makeCube();
    const pos = {
        U: [2, 1], L: [1, 2], F: [2, 2], R: [3, 2], B: [4, 2], D: [2, 3]
    };
    const mk = {};
    for (const q of hc)
        for (const s of q.st) {
            const f = DAFTAR_MUKA_KUIS.find(f => dot(NORMAL_MUKA[f], s.n) == 1);
            const [r, u] = SUMBU_MUKA[f];
            mk[f + (dot(q.pos, r) + 1) + (1 - dot(q.pos, u))] = s;
        }
    for (const f of DAFTAR_MUKA_KUIS) {
        const g = grid(hc, NORMAL_MUKA[f], SUMBU_MUKA[f][0], SUMBU_MUKA[f][1]);
        const x0 = ox + (pos[f][0] - 1) * cu;
        const y0 = oy + (pos[f][1] - 1) * cu;
        x.fillStyle = '#666';
        x.font = `${Math.min(2.6, cu / 20) * k}px Arial,sans-serif`;
        x.textAlign = 'left';
        x.textBaseline = 'alphabetic';
        x.fillText(f + ' ' + NAMA_MUKA[f].toLowerCase(), (x0 + .5) * k, (y0 - 1) * k);
        if (cut) {
            x.save();
            x.strokeStyle = '#bbb';
            x.lineWidth = .15 * k;
            x.setLineDash([2 * k, 2 * k]);
            x.strokeRect(x0 * k, y0 * k, cu * k, cu * k);
            x.restore();
        }
        for (let j = 0; j < 3; j++)
            for (let i = 0; i < 3; i++)
                gambarStiker(x, (x0 + i * p + (p - smm) / 2) * k, (y0 + j * p + (p - smm) / 2) * k, smm * k, g[j][i], mk[f + i + j], cut);
    }
    x.fillStyle = '#666';
    x.font = `${2.4 * k}px Arial,sans-serif`;
    x.textAlign = 'left';
    x.textBaseline = 'alphabetic';
    x.fillText('Cubelendar · cetak skala 100% · kubus ' + cu + ' mm · stiker ' + smm + ' mm · acuan: center E di F (depan), A di U (atas)', 8 * k, (PH - 1.5) * k);
    $('snote').textContent = '' + (rq > mx ? 'Maksimum untuk ' + pn + ' = ' + mx + ' mm (agar peta 4×3 sisi muat di kertas). ' : (rq && rq < mn) ? 'Minimum ' + mn + ' mm. ' : '') + 'Peta seukuran kubus: satu sisi = ' + cu + ' mm, stiker = ' + smm + ' mm (jarak antar pusat stiker ' + (Math.round(p * 10) / 10) + ' mm). Lembar ' + pn + ' landscape (' + PW + '×' + PH + ' mm), ' + dpi + ' dpi, ' + W + '×' + H + ' px.';
}
logoCb.push(() => gambarLembarStiker());
$('ssz').oninput = gambarLembarStiker;
$('ssz').onchange = () => {
    const v = +$('ssz').value;
    if (v)
        $('ssz').value = Math.min(ukuranStikerMaks(), Math.max(25, v));
    gambarLembarStiker();
};
$('spp').onchange = () => {
    const v = +$('ssz').value;
    if (v > ukuranStikerMaks())
        $('ssz').value = ukuranStikerMaks();
    gambarLembarStiker();
};
$('scut').onchange = gambarLembarStiker;
$('sdl').onclick = async () => {
    try {
        const d = typeof claude == 'undefined' ? null : await claude.use('downloads');
        if (!d) {
            $('snote').textContent = 'Unduhan tidak tersedia di sini. Klik kanan (atau tekan lama) gambar lalu simpan.';
            return;
        }
        gambarLembarStiker();
        const b = await new Promise(r => $('scv').toBlob(r, 'image/png'));
        await d.save({ filename: "stiker_cubelendar_" + $("spp").value + ".png", data: b });
        $('snote').textContent = 'Tersimpan ✓';
    }
    catch (e) {
        if (e && e.code == 'declined')
            return;
        $('snote').textContent = 'Gagal menyimpan (' + ((e && e.code) || 'error') + '). Coba klik kanan atau tekan lama pada gambar.';
    }
};
$('ttut').onclick = $('htut').onclick = () => pindahTab('tut');
$('tapp').onclick = $('happ').onclick = $('istart').onclick = () => pindahTab('app');
function setKalender(c) {
    jenisKalender = c;
    try {
        localStorage.setItem('cubelendar.cal', c);
    }
    catch (e) {
    }
    $('mM').className = c == 'm' ? 'pri' : '';
    $('mH').className = c == 'h' ? 'pri' : '';
    $('hadj').hidden = c != 'h';
    $('hm').hidden = c != 'h';
    $('hleg').hidden = c != 'h';
    endGuide();
    info();
}
function setMetode(v) {
    metodeHijriah = v;
    $('hm').value = v;
    try {
        localStorage.setItem('cubelendar.meth', v);
    }
    catch (e) {
    }
    endGuide();
    info();
}
$('hm').onchange = e => setMetode(e.target.value);
function setKoreksi(n) {
    koreksiHari = Math.max(-2, Math.min(2, koreksiHari + n));
    try {
        localStorage.setItem('cubelendar.adj', koreksiHari);
    }
    catch (e) {
    }
    $('aV').textContent = 'Koreksi: ' + (koreksiHari > 0 ? '+' : '') + koreksiHari + ' hari';
    endGuide();
    info();
}
$('mM').onclick = () => setKalender('m');
$('mH').onclick = () => setKalender('h');
$('aM').onclick = () => setKoreksi(-1);
$('aP').onclick = () => setKoreksi(1);
(() => {
    const k = t => '<span class="k">' + t + '</span>';
    $('hleg').innerHTML = '<summary>Arti kode bulan Hijriah</summary><div class="hb"><ul class="hm">' + NAMA_BULAN_HIJRIAH.map((n, i) => '<li>' + k(KODE_BULAN_HIJRIAH[i]) + n + '</li>').join('') + '</ul><ul class="hr">'
        + '<li><b>Cara kode dibuat</b>Tiga huruf, disingkat dari huruf nama bulannya.</li>'
        + '<li><b>Awal dan Akhir</b>Dibedakan oleh huruf terakhir: ' + k('L') + ' untuk Awal, ' + k('R') + ' untuk Akhir. Contoh: ' + k('AUL') + '/' + k('AUR') + ' = Rabiul, ' + k('JAL') + '/' + k('JAR') + ' = Jumadil.</li>'
        + '<li class="w"><b>Tanpa stiker Z</b>Zulkaidah ditulis ' + k('DUL') + ' dan Zulhijah ' + k('JUL') + '. Kode ' + k('JUL') + ' tampil sama persis dengan Juli di mode Masehi, jadi lihat mode yang sedang dipilih.</li>'
        + '<li><b>Tanggal Hijriah</b>Metode dipilih di samping tombol Hijriah. Muhammadiyah: KHGT (tinggi bulan 5°, elongasi 8°) sejak 1 Muharram 1447 H, dan wujudul hilal untuk tanggal sebelumnya. Kemenag: kriteria MABIMS, yaitu tinggi bulan minimal 3° dan elongasi minimal 6,4° saat magrib. Umm al-Qura: kalender resmi Arab Saudi, bulan baru dimulai bila ijtimak terjadi sebelum magrib di Makkah dan bulan terbenam setelah matahari; datanya dari kalender bawaan peramban. Bila berbeda dengan kalender Anda, pakai tombol −1 / +1.</li>'
        + '<li><b>Setelah Magrib</b>Pilih tanggal Masehi esok harinya.</li></ul></div>';
})();
// ===== Komponen UI: dropdown, kalender, warna stiker =====
function dropdown(sel) {
    const w = sel.parentElement;
    const btn = document.createElement('button');
    const ul = document.createElement('ul');
    const opts = [...sel.options];
    let ai = 0;
    btn.type = 'button';
    btn.className = 'ctl';
    btn.setAttribute('aria-haspopup', 'listbox');
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-labelledby', sel.getAttribute('aria-labelledby'));
    ul.className = 'dd-list';
    ul.setAttribute('role', 'listbox');
    ul.tabIndex = -1;
    ul.hidden = true;
    ul.innerHTML = opts.map((o, i) => `<li role="option" id="ddo${i}" data-i="${i}"><span>${o.text}</span><small>${o.dataset.sub || ''}</small></li>`).join('');
    const lab = () => {
        const o = sel.selectedOptions[0];
        btn.innerHTML = `<span>${o.text}</span><small class="lbl">${o.dataset.sub || ''}</small><i class="chev"></i>`;
    };
    const paint = () => {
        [...ul.children].forEach((li, i) => {
            li.setAttribute('aria-selected', i == sel.selectedIndex);
            li.classList.toggle('act', i == ai);
        });
        ul.setAttribute('aria-activedescendant', 'ddo' + ai);
        ul.children[ai].scrollIntoView({ block: 'nearest' });
    };
    const open = () => {
        ai = sel.selectedIndex;
        ul.hidden = false;
        btn.setAttribute('aria-expanded', 'true');
        paint();
        ul.focus();
    };
    const close = f => {
        ul.hidden = true;
        btn.setAttribute('aria-expanded', 'false');
        if (f)
            btn.focus();
    };
    const pick = i => {
        if (sel.selectedIndex != i) {
            sel.selectedIndex = i;
            sel.dispatchEvent(new Event('change'));
        }
        lab();
        close(1);
    };
    btn.onclick = () => ul.hidden ? open() : close();
    btn.onkeydown = e => {
        if (e.key == 'ArrowDown' || e.key == 'ArrowUp') {
            e.preventDefault();
            open();
        }
    };
    ul.onclick = e => {
        const li = e.target.closest('li');
        if (li)
            pick(+li.dataset.i);
    };
    ul.onkeydown = e => {
        const k = e.key;
        const n = opts.length;
        if (k == 'Tab') {
            close();
            return;
        }
        e.stopPropagation();
        if (k == 'ArrowDown')
            ai = Math.min(n - 1, ai + 1);
        else if (k == 'ArrowUp')
            ai = Math.max(0, ai - 1);
        else if (k == 'Home')
            ai = 0;
        else if (k == 'End')
            ai = n - 1;
        else if (k == 'Enter' || k == ' ') {
            e.preventDefault();
            pick(ai);
            return;
        }
        else if (k == 'Escape') {
            close(1);
            return;
        }
        else
            return;
        e.preventDefault();
        paint();
    };
    document.addEventListener('pointerdown', e => {
        if (!w.contains(e.target))
            close();
    });
    w.append(btn, ul);
    lab();
}
dropdown($('spp'));
const ubahUkuran = n => {
    const i = $('ssz');
    n > 0 ? i.stepUp() : i.stepDown();
    i.dispatchEvent(new Event('input'));
    i.dispatchEvent(new Event('change'));
};
$('sup').onclick = () => ubahUkuran(1);
$('sdn').onclick = () => ubahUkuran(-1);
const NAMA_BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const NAMA_HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const SINGKAT_HARI = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
const duaDigit = n => String(n).padStart(2, '0');
const hariDalamBulan = (y, m) => new Date(Date.UTC(y, m, 0)).getUTCDate();
const tanggalDipilih = () => $('dt').value.split('-').map(Number);
let tampilanKalender = 'd';
let tahunTampil = 0;
let bulanTampil = 0;
let hariFokus = 1;
function setDate(y, m, d) {
    const t = new Date(Date.UTC(y, m - 1, d));
    $('dt').value = t.getUTCFullYear() + '-' + duaDigit(t.getUTCMonth() + 1) + '-' + duaDigit(t.getUTCDate());
    $('dt').dispatchEvent(new Event('change'));
}
function sinkronTanggal() {
    const [y, m, d] = tanggalDipilih();
    $('dtx').textContent = NAMA_HARI[new Date(Date.UTC(y, m - 1, d)).getUTCDay()] + ', ' + d + ' ' + NAMA_BULAN[m - 1] + ' ' + y;
}
function subHijriah(y, m, n) {
    const a = tanggalHijriah(y, m, 1);
    const b = tanggalHijriah(y, m, n);
    if (!a || !b)
        return '';
    const A = NAMA_BULAN_HIJRIAH[a.m - 1];
    const B = NAMA_BULAN_HIJRIAH[b.m - 1];
    const t = a.m == b.m && a.y == b.y ? A + ' ' + a.y : a.y == b.y ? A + ' – ' + B + ' ' + a.y : A + ' ' + a.y + ' – ' + B + ' ' + b.y;
    return '<small class="hs">' + t + ' H</small>';
}
function gambarKalender(f) {
    const c = $('cal');
    const [sy, sm, sd] = tanggalDipilih();
    const T = new Date();
    let h;
    if (tampilanKalender == 'm')
        h = `<div class="hd"><button data-a="py" aria-label="Tahun sebelumnya">‹</button><b>${tahunTampil}</b><button data-a="ny" aria-label="Tahun berikutnya">›</button></div><div class="g m">${NAMA_BULAN.map((n, i) => `<button data-mo="${i + 1}" aria-pressed="${tahunTampil == sy && i + 1 == sm}">${n}</button>`).join('')}</div>`;
    else {
        const n = hariDalamBulan(tahunTampil, bulanTampil);
        const first = (new Date(Date.UTC(tahunTampil, bulanTampil - 1, 1)).getUTCDay() + 6) % 7;
        h = `<div class="hd"><button data-a="pm" aria-label="Bulan sebelumnya">‹</button><button class="tt" data-a="tm" aria-label="Pilih bulan dan tahun">${NAMA_BULAN[bulanTampil - 1]} ${tahunTampil}${jenisKalender == 'h' ? subHijriah(tahunTampil, bulanTampil, n) : ''}</button><button data-a="nm" aria-label="Bulan berikutnya">›</button></div><div class="g">${SINGKAT_HARI.map(x => `<span>${x}</span>`).join('')}${'<i></i>'.repeat(first)}`;
        for (let d = 1; d <= n; d++) {
            const ok = !!targetUntukTanggal(tahunTampil, bulanTampil, d).e;
            const hj = jenisKalender == 'h' ? tanggalHijriah(tahunTampil, bulanTampil, d) : null;
            h += `<button data-d="${d}" tabindex="${d == hariFokus ? 0 : -1}" aria-pressed="${tahunTampil == sy && bulanTampil == sm && d == sd}" ${ok ? '' : 'aria-disabled="true" title="Belum ada di tabel"'} ${tahunTampil == T.getFullYear() && bulanTampil == T.getMonth() + 1 && d == T.getDate() ? 'aria-current="date"' : ''} aria-label="${d} ${NAMA_BULAN[bulanTampil - 1]} ${tahunTampil}">${d}${hj ? `<small>${hj.d}</small>` : ''}</button>`;
        }
        h += '</div>';
    }
    c.innerHTML = h + `<div class="ft"><button data-a="today">Hari ini</button>${jenisKalender == 'h' && tampilanKalender == 'd' ? '<span class="lbl">angka kecil = tanggal Hijriah</span>' : ''}<button data-a="x">Tutup</button></div>`;
    const t = f && c.querySelector(f);
    if (t)
        t.focus();
}
function bukaKalender() {
    [tahunTampil, bulanTampil, hariFokus] = tanggalDipilih();
    tampilanKalender = 'd';
    $('cal').hidden = false;
    $('dbtn').setAttribute('aria-expanded', 'true');
    gambarKalender('[data-d="' + hariFokus + '"]');
}
function tutupKalender(f) {
    $('cal').hidden = true;
    $('dbtn').setAttribute('aria-expanded', 'false');
    if (f)
        $('dbtn').focus();
}
$('dbtn').onclick = () => $('cal').hidden ? bukaKalender() : tutupKalender();
const geserTanggal = n => {
    const [y, m, d] = tanggalDipilih();
    setDate(y, m, d + n);
    if (!$('cal').hidden)
        tutupKalender();
};
$('dpv').onclick = () => geserTanggal(-1);
$('dnx').onclick = () => geserTanggal(1);
$('cal').onclick = e => {
    const b = e.target.closest('button');
    if (!b)
        return;
    const a = b.dataset.a;
    if (b.dataset.d) {
        if (!b.getAttribute('aria-disabled')) {
            setDate(tahunTampil, bulanTampil, +b.dataset.d);
            tutupKalender(1);
        }
        return;
    }
    if (b.dataset.mo) {
        bulanTampil = +b.dataset.mo;
        tampilanKalender = 'd';
        hariFokus = Math.min(hariFokus, hariDalamBulan(tahunTampil, bulanTampil));
        gambarKalender('[data-d="' + hariFokus + '"]');
        return;
    }
    if (a == 'pm' || a == 'nm') {
        bulanTampil += a == 'pm' ? -1 : 1;
        if (bulanTampil < 1) {
            bulanTampil = 12;
            tahunTampil--;
        }
        if (bulanTampil > 12) {
            bulanTampil = 1;
            tahunTampil++;
        }
        hariFokus = Math.min(hariFokus, hariDalamBulan(tahunTampil, bulanTampil));
        gambarKalender('[data-a="' + a + '"]');
    }
    else if (a == 'py' || a == 'ny') {
        tahunTampil += a == 'py' ? -1 : 1;
        gambarKalender('[data-a="' + a + '"]');
    }
    else if (a == 'tm') {
        tampilanKalender = 'm';
        gambarKalender('[data-mo="' + bulanTampil + '"]');
    }
    else if (a == 'today') {
        const t = new Date();
        setDate(t.getFullYear(), t.getMonth() + 1, t.getDate());
        tutupKalender(1);
    }
    else if (a == 'x')
        tutupKalender(1);
};
$('cal').onkeydown = e => {
    const k = e.key;
    if (k.startsWith('Arrow'))
        e.stopPropagation();
    if (k == 'Escape') {
        e.stopPropagation();
        tutupKalender(1);
        return;
    }
    if (tampilanKalender != 'd' || !e.target.dataset.d)
        return;
    let t;
    if (k == 'ArrowLeft' || k == 'ArrowRight' || k == 'ArrowUp' || k == 'ArrowDown')
        t = new Date(Date.UTC(tahunTampil, bulanTampil - 1, hariFokus + ({
            ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7
        })[k]));
    else if (k == 'PageUp' || k == 'PageDown') {
        t = new Date(Date.UTC(tahunTampil, bulanTampil - 1 + (k == 'PageUp' ? -1 : 1), 1));
        t = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), Math.min(hariFokus, hariDalamBulan(t.getUTCFullYear(), t.getUTCMonth() + 1))));
    }
    else
        return;
    e.preventDefault();
    tahunTampil = t.getUTCFullYear();
    bulanTampil = t.getUTCMonth() + 1;
    hariFokus = t.getUTCDate();
    gambarKalender('[data-d="' + hariFokus + '"]');
};
document.addEventListener('pointerdown', e => {
    if (!$('dtw').contains(e.target))
        tutupKalender();
});
const PILIHAN_WARNA = [
    ['Putih', '#ffffff', '#111111'],
    ['Krem', '#f6efdc', '#3b2f1e'],
    ['Abu muda', '#d4d4cf', '#1c1c1e'],
    ['Abu baja', '#8c9091', '#111111'],
    ['Abu tua', '#4a4f51', '#f5f5f0'],
    ['Hitam', '#1c1c1e', '#f5f5f5'],
    ['Merah muda', '#f1b9bd', '#4a1020'],
    ['Merah bata', '#8f1d1d', '#ffffff'],
    ['Merah', '#c62828', '#ffffff']
];
const luminans = h => {
    const c = hex2rgb(h).map(v => {
        v /= 255;
        return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4;
    });
    return .2126 * c[0] + .7152 * c[1] + .0722 * c[2];
};
function terapkanWarnaStiker(save) {
    const r = document.documentElement.style;
    r.setProperty('--sbg', WARNA_STIKER.bg);
    r.setProperty('--sfg', WARNA_STIKER.fg);
    r.setProperty('--spl', warnaPolos());
    for (const k in cacheTekstur) {
        if (cacheTekstur[k].dispose)
            cacheTekstur[k].dispose();
        delete cacheTekstur[k];
    }
    for (const p of cube)
        for (const m of p.g.children)
            if (m.userData.s) {
                m.material.map = teksturStiker(m.userData.s);
                m.material.needsUpdate = true;
            }
    if (save)
        try {
            localStorage.setItem('cubelendar.sc', JSON.stringify(WARNA_STIKER));
        }
        catch (e) {
        }
    $('sws').innerHTML = PILIHAN_WARNA.map(([n, b, f]) => `<button class="sw" title="${n}" aria-label="${n}" aria-pressed="${b == WARNA_STIKER.bg && f == WARNA_STIKER.fg}" data-b="${b}" data-f="${f}" style="background:${b};color:${f}">A</button>`).join('');
    $('cbg').value = WARNA_STIKER.bg;
    $('cfg').value = WARNA_STIKER.fg;
    $('hbg').textContent = WARNA_STIKER.bg;
    $('hfg').textContent = WARNA_STIKER.fg;
    const a = luminans(WARNA_STIKER.bg);
    const b = luminans(WARNA_STIKER.fg);
    $('cwarn').textContent = (Math.max(a, b) + .05) / (Math.min(a, b) + .05) < 3 ? 'Kontras rendah: huruf akan sulit dibaca. Pilih warna huruf yang lebih kontras.' : '';
    if (!$('stk').hidden)
        gambarLembarStiker();
}
let rafWarnaStiker = 0;
const tundaWarnaStiker = () => {
    if (!rafWarnaStiker)
        rafWarnaStiker = requestAnimationFrame(() => {
            rafWarnaStiker = 0;
            terapkanWarnaStiker(1);
        });
};
$('sws').onclick = e => {
    const b = e.target.closest('.sw');
    if (b) {
        WARNA_STIKER = { bg: b.dataset.b, fg: b.dataset.f };
        terapkanWarnaStiker(1);
    }
};
$('cbg').oninput = () => {
    WARNA_STIKER = { ...WARNA_STIKER, bg: $('cbg').value };
    tundaWarnaStiker();
};
$('cfg').oninput = () => {
    WARNA_STIKER = { ...WARNA_STIKER, fg: $('cfg').value };
    tundaWarnaStiker();
};
$('crs').onclick = () => {
    WARNA_STIKER = { bg: '#ffffff', fg: '#111111' };
    terapkanWarnaStiker(1);
};
terapkanWarnaStiker();
/* ===== Scan kamera v2: baca langsung (live), cari posisi huruf otomatis, suara terbanyak antar-bingkai ===== */
(() => {
    const N = 32;
    const R = 64;
    const ORD = ['F', 'R', 'B', 'L', 'U', 'D'];
    const INS = {
        F: 'Sisi F (depan) menghadap kamera, sisi U di atas.', R: 'Putar kubus: sisi R menghadap kamera, sisi U tetap di atas.', B: 'Sisi B (belakang) menghadap kamera, sisi U tetap di atas.', L: 'Sisi L (kiri) menghadap kamera, sisi U tetap di atas.', U: 'Sisi U menghadap kamera; tepi yang dekat sisi F ada di BAWAH (sisi B di atas).', D: 'Sisi D menghadap kamera; tepi yang dekat sisi F ada di ATAS.'
    };
    /* database: sudut (C) memuat angka & sebagian huruf, tepi (E) memuat huruf + gambar / ^, center (M) 6 huruf; tiap simbol punya jumlah tetap */
    const TYP = ['C', 'E', 'C', 'E', 'M', 'E', 'C', 'E', 'C'];
    const POOL = {
        C: {}, E: {}, M: {}
    };
    for (const d of DATA) {
        const n = [d[0], d[1], d[2]].filter(v => v).length;
        const t = n == 3 ? 'C' : n == 2 ? 'E' : 'M';
        if (d[6])
            POOL[t][d[6]] = (POOL[t][d[6]] || 0) + 1;
    }
    /* Data latih dari kamera: potongan stiker asli (video), diberi label; ditambah sampel yang dipelajari dari koreksi & kotak yang terbukti cocok dengan aturan kubus */
    const SEEDL = 'MPKDEY8I0MPKDEY8I0';
    const RS = new Image();
    RS.onload = () => {
        TP = null;
    };
    RS.src = SPRITE_SRC;
    const LK = 'cubelendar.learn';
    let LS = [];
    try {
        LS = JSON.parse(localStorage.getItem(LK) || '[]');
    }
    catch (e) {
    }
    const enc = v => {
        let t = '';
        for (let i = 0; i < v.length; i++)
            t += String.fromCharCode(Math.max(-127, Math.min(127, Math.round(v[i] * 300))) + 128);
        return btoa(t);
    };
    const dec = t => {
        const a = atob(t);
        const v = new Float32Array(a.length);
        for (let i = 0; i < a.length; i++)
            v[i] = (a.charCodeAt(i) - 128) / 300;
        return v;
    };
    function learnAdd(g, p) {
        if (!g || !p || !p.v || !(g in POOL.C || g in POOL.E || g in POOL.M))
            return;
        LS.push({
            g, v: enc(p.v), ar: p.ar, den: p.den
        });
        const mine = LS.filter(x => x.g == g);
        if (mine.length > 4)
            LS.splice(LS.indexOf(mine[0]), 1);
        try {
            localStorage.setItem(LK, JSON.stringify(LS));
        }
        catch (e) {
        }
        TP = null;
    }
    window.__learn = learnAdd;
    let fi = 0;
    let stream = null;
    let TP = null;
    let lastP = null;
    let done = new Set();
    let acc = null;
    let nfr = 0;
    let tm = 0;
    let busy = 0;
    let hold = 0;
    let frz = null;
    let shiftC = null;
    let scMode = 'tebak';
    const ALLSH = [];
    const vib = () => {
        try {
            navigator.vibrate && navigator.vibrate(25);
        }
        catch (e) {
        }
    };
    for (const a of [-.1, 0, .1])
        for (const b of [-.1, 0, .1])
            ALLSH.push([a, b]);
    const SH = () => shiftC && nfr % 8 ? [shiftC] : ALLSH;
    const gl = () => DAFTAR_HURUF.filter(g => g != '-');
    const ctrs = () => new Set(cube.filter(p => p.st.length == 1).map(p => p.st[0].ch));
    const gc = document.createElement('canvas');
    gc.width = gc.height = R;
    const gx = gc.getContext('2d', { willReadFrequently: true });
    /* jendela -> peta tinta 0..1, dinormalkan per kotak (tahan bayangan & beda cahaya) */
    function blur(a, r) {
        const t = new Float32Array(R * R);
        const o = new Float32Array(R * R);
        const n = 2 * r + 1;
        const cl = v => Math.min(R - 1, Math.max(0, v));
        for (let y = 0; y < R; y++) {
            let sm = 0;
            for (let k = -r; k <= r; k++)
                sm += a[y * R + cl(k)];
            for (let x = 0; x < R; x++) {
                t[y * R + x] = sm / n;
                sm += a[y * R + cl(x + r + 1)] - a[y * R + cl(x - r)];
            }
        }
        for (let x = 0; x < R; x++) {
            let sm = 0;
            for (let k = -r; k <= r; k++)
                sm += t[cl(k) * R + x];
            for (let y = 0; y < R; y++) {
                o[y * R + x] = sm / n;
                sm += t[cl(y + r + 1) * R + x] - t[cl(y - r) * R + x];
            }
        }
        return o;
    }
    function ink(src, sx, sy, sw, sh) {
        gx.fillStyle = '#fff';
        gx.fillRect(0, 0, R, R);
        gx.drawImage(src, sx, sy, sw, sh, 0, 0, R, R);
        const d = gx.getImageData(0, 0, R, R).data;
        const g = new Float32Array(R * R);
        for (let i = 0; i < R * R; i++)
            g[i] = .299 * d[4 * i] + .587 * d[4 * i + 1] + .114 * d[4 * i + 2];
        const bg = blur(g, 9);
        const s = Float32Array.from(g).sort();
        const hi = s[R * R * .75 | 0];
        const rg = Math.max(34, (hi - s[R * R * .01 | 0]) * .85);
        return g.map((v, i) => Math.min(1, Math.max(0, (Math.max(bg[i], .8 * hi) - v) / rg)));
    }
    function rot(a) {
        const o = new Float32Array(N * N);
        for (let r = 0; r < N; r++)
            for (let c = 0; c < N; c++)
                o[r * N + c] = a[c * N + (N - 1 - r)];
        return o;
    }
    /* buang tinta yang menyentuh tepi (garis celah stiker), potong tepat di sekitar huruf, skala ke NxN */
    function prep(o, fl) {
        if (!o)
            return null;
        const M = R * R;
        const rm = new Uint8Array(M);
        const st = [];
        const sd = i => {
            if (!rm[i] && o[i] > .25) {
                rm[i] = 1;
                st.push(i);
            }
        };
        if (fl) {
            for (let a = 0; a < R; a++)
                for (let b = 0; b < 2; b++) {
                    sd(b * R + a);
                    sd((R - 1 - b) * R + a);
                    sd(a * R + b);
                    sd(a * R + R - 1 - b);
                }
            while (st.length) {
                const i = st.pop();
                const x = i % R;
                const y = i / R | 0;
                if (x > 0)
                    sd(i - 1);
                if (x < R - 1)
                    sd(i + 1);
                if (y > 0)
                    sd(i - R);
                if (y < R - 1)
                    sd(i + R);
            }
        }
        else {
            for (let y = 0; y < R; y++)
                for (let x = 0; x < R; x++)
                    if (x < 8 || x > 55 || y < 8 || y > 55)
                        rm[y * R + x] = 1;
        }
        let x0 = R;
        let x1 = -1;
        let y0 = R;
        let y1 = -1;
        let tot = 0;
        for (let y = 0; y < R; y++)
            for (let x = 0; x < R; x++) {
                const i = y * R + x;
                if (rm[i]) {
                    o[i] = 0;
                    continue;
                }
                tot += o[i];
                if (o[i] > .3) {
                    if (x < x0)
                        x0 = x;
                    if (x > x1)
                        x1 = x;
                    if (y < y0)
                        y0 = y;
                    if (y > y1)
                        y1 = y;
                }
            }
        if (x1 < 0 || tot < M * .006 || (x1 - x0 < 4 && y1 - y0 < 4))
            return null;
        const w = x1 - x0 + 1;
        const h = y1 - y0 + 1;
        const s = Math.max(w, h) * 1.2 + 2;
        const cx = (x0 + x1 + 1) / 2;
        const cy = (y0 + y1 + 1) / 2;
        const v = new Float32Array(N * N);
        for (let r = 0; r < N; r++)
            for (let c = 0; c < N; c++) {
                let a = 0;
                for (let j = 0; j < 4; j++) {
                    const xi = Math.round(cx - s / 2 + (c + .25 + .5 * (j & 1)) * s / N - .5);
                    const yi = Math.round(cy - s / 2 + (r + .25 + .5 * (j >> 1)) * s / N - .5);
                    if (xi >= 0 && xi < R && yi >= 0 && yi < R)
                        a += o[yi * R + xi];
                }
                v[r * N + c] = a / 4;
            }
        const b = new Float32Array(N * N);
        for (let r = 0; r < N; r++)
            for (let c = 0; c < N; c++) {
                let a = 0;
                let n = 0;
                for (let dr = -1; dr <= 1; dr++)
                    for (let dc = -1; dc <= 1; dc++) {
                        const rr = r + dr;
                        const cc = c + dc;
                        if (rr >= 0 && rr < N && cc >= 0 && cc < N) {
                            a += v[rr * N + cc];
                            n++;
                        }
                    }
                b[r * N + c] = a / n;
            }
        let m = 0;
        for (const q of b)
            m += q;
        m /= b.length;
        let q2 = 0;
        for (let i = 0; i < b.length; i++) {
            b[i] -= m;
            q2 += b[i] * b[i];
        }
        q2 = Math.sqrt(q2) || 1;
        for (let i = 0; i < b.length; i++)
            b[i] /= q2;
        return {
            v: b, ar: Math.min(5, Math.max(.2, w / h)), den: Math.min(1, tot / (w * h))
        };
    }
    const prepA = o => prep(Float32Array.from(o), 1) || prep(o, 0);
    function templates() {
        if (TP)
            return TP;
        TP = {};
        for (const g of gl()) {
            const S = R;
            const c = document.createElement('canvas');
            c.width = c.height = S;
            const x = c.getContext('2d');
            x.fillStyle = '#fff';
            x.fillRect(0, 0, S, S);
            x.translate(S / 2, S / 2);
            x.fillStyle = '#111';
            x.font = `bold ${.5 * S}px Arial,sans-serif`;
            x.textAlign = 'center';
            x.textBaseline = 'middle';
            if (isImg(g))
                drawLogo(x, S, g);
            else
                x.fillText(g, 0, .03 * S);
            x.setTransform(1, 0, 0, 1, 0, 0);
            const p = prepA(ink(c, 0, 0, S, S));
            if (!p)
                continue;
            let a = p.v;
            TP[g] = [0, 1, 2, 3].map(k => {
                const e = {
                    v: a, ar: k % 2 ? 1 / p.ar : p.ar, den: p.den, k, syn: 1
                };
                a = rot(a);
                return e;
            });
        }
        const add = (g, p) => {
            const t = TP[g];
            if (!t || !p)
                return;
            let bk = 0;
            let bs = -9;
            for (let k = 0; k < 4; k++) {
                const e = t[k];
                let d = 0;
                for (let j = 0; j < N * N; j++)
                    d += p.v[j] * e.v[j];
                if (d > bs) {
                    bs = d;
                    bk = k;
                }
            }
            if (bs < .25)
                return;
            let a = p.v;
            for (let r = 0; r < (4 - bk) % 4; r++)
                a = rot(a);
            const ar = bk % 2 ? 1 / p.ar : p.ar;
            for (let k = 0; k < 4; k++) {
                t.push({
                    v: a, ar: k % 2 ? 1 / ar : ar, den: p.den, k, syn: 0
                });
                a = rot(a);
            }
        };
        if (RS.complete && RS.naturalWidth)
            for (let i = 0; i < SEEDL.length; i++)
                add(SEEDL[i], prepA(ink(RS, i * 64, 0, 64, 64)));
        for (const x of LS)
            add(x.g, {
                v: dec(x.v), ar: x.ar, den: x.den
            });
        return TP;
    }
    function scoreCell(p, ids, T, pen) {
        if (!p)
            return null;
        const out = [];
        for (const ch of ids) {
            const t = T[ch];
            if (!t)
                continue;
            const bk = {};
            for (const e of t) {
                let d = 0;
                for (let j = 0; j < N * N; j++)
                    d += p.v[j] * e.v[j];
                d -= .35 * Math.abs(Math.log(p.ar / e.ar)) + .5 * Math.abs(p.den - e.den) + (pen && pen.has(ch) ? .15 : 0);
                if (!(e.k in bk) || d > bk[e.k])
                    bk[e.k] = d;
            }
            for (const k in bk)
                out.push({
                    ch, k: +k, s: bk[k]
                });
        }
        out.sort((a, b) => b.s - a.s);
        return out.slice(0, 8);
    }
    /* coba beberapa geseran grid, pakai yang total kecocokannya paling tinggi */
    function readFace(sq) {
        const cs = sq.width / 3;
        const T = templates();
        const ID = {
            C: Object.keys(POOL.C), E: Object.keys(POOL.E), M: [...ctrs()]
        };
        let best = null;
        for (const [dy, dx] of SH()) {
            const cells = [];
            const ps = [];
            let sum = 0;
            for (let i = 0; i < 9; i++) {
                const r = i / 3 | 0;
                const c = i % 3;
                const p = prepA(ink(sq, (c + dx) * cs + cs * .03, (r + dy) * cs + cs * .03, cs * .94, cs * .94));
                const sc = scoreCell(p, ID[TYP[i]], T, null);
                ps.push(p);
                cells.push(sc);
                sum += sc ? sc[0].s * (i == 4 ? 3 : 1) : -.3;
            }
            if (!best || sum > best.sum)
                best = {
                    sum, cells, ps, dy, dx
                };
        }
        shiftC = [best.dy, best.dx];
        lastP = best.ps;
        return best.cells;
    }
    function resetAcc() {
        acc = null;
        nfr = 0;
        shiftC = null;
    }
    function addAcc(cells) {
        if (!acc)
            acc = cells.map(() => ({ m: new Map(), fw: 0 }));
        nfr++;
        cells.forEach((sc, i) => {
            const a = acc[i];
            if (!sc)
                return;
            a.fw = a.fw * .82 + 1;
            for (const e of a.m.values())
                e.s *= .82;
            for (const o of sc) {
                const key = o.ch + '|' + o.k;
                const e = a.m.get(key) || {
                    ch: o.ch, k: o.k, s: 0
                };
                e.s += o.s;
                a.m.set(key, e);
            }
        });
    }
    function reading() {
        const cs = acc.map(a => {
            if (!a.fw)
                return null;
            const L = [];
            const alt = {};
            for (const e of a.m.values()) {
                const ms = e.s / a.fw;
                L.push({
                    ch: e.ch, deg: 90 * e.k, ms
                });
                if (!(e.ch in alt) || ms > alt[e.ch])
                    alt[e.ch] = ms;
            }
            L.sort((x, y) => y.ms - x.ms);
            return { L, alt };
        });
        const use = {
            C: {}, E: {}, M: {}
        };
        for (const f of DAFTAR_MUKA)
            if (done.has(f))
                selEditor[f].forEach((c, i) => {
                    if (!c.w && c.ch) {
                        const t = TYP[i];
                        use[t][c.ch] = (use[t][c.ch] || 0) + 1;
                    }
                });
        const ord = cs.map((c, i) => i).filter(i => cs[i]).sort((a, b) => cs[b].L[0].ms - cs[a].L[0].ms);
        const res = [];
        for (const i of ord) {
            const t = TYP[i];
            const c = cs[i];
            let b = null;
            let bs = -9;
            for (const o of c.L) {
                const sc = o.ms - .2 * Math.max(0, (use[t][o.ch] || 0) + 1 - (POOL[t][o.ch] || 0));
                if (sc > bs) {
                    bs = sc;
                    b = o;
                }
            }
            use[t][b.ch] = (use[t][b.ch] || 0) + 1;
            const s2 = c.L.find(o => o.ch !== b.ch);
            res[i] = {
                ch: b.ch, deg: b.deg, conf: b.ms, gap: b.ms - (s2 ? s2.ms : -1), alt: c.alt, L: c.L
            };
        }
        return cs.map((c, i) => res[i] || {
            ch: null, deg: 0, conf: 0, gap: 0, alt: {}
        });
    }
    const weak = c => c.conf < .5 || c.gap < .04;
    function crop(src, w, h) {
        const side = Math.min(w, h) * .76;
        const sq = document.createElement('canvas');
        sq.width = sq.height = Math.round(Math.min(side, 540));
        sq.getContext('2d').drawImage(src, (w - side) / 2, (h - side) / 2, side, side, 0, 0, sq.width, sq.height);
        return sq;
    }
    function draw(res, v) {
        const z = !!frz && !v;
        $('crs3').innerHTML = res.map(c => htmlSel({ ch: c.ch === null ? '?' : c.ch, deg: c.deg }, z ? 'tp' + (weak(c) && !c.tp ? ' w' : '') : (!v && weak(c) ? 'w' : ''))).join('');
        if (z)
            [...$('crs3').children].forEach((e, i) => {
                e.dataset.i = i;
                e.tabIndex = 0;
                e.setAttribute('role', 'button');
                e.setAttribute('aria-label', 'Kotak ' + (i + 1) + ': ' + (res[i].ch === null ? 'kosong' : res[i].ch) + '. ' + (scMode == 'putar' ? 'Ketuk untuk memutar 90 derajat.' : 'Ketuk untuk menebak ulang.'));
            });
    }
    /* Mode bekukan: hasil bacaan dikunci (tidak berubah lagi), pengguna mengetuk kotak yang SALAH untuk menebak ulang, lalu konfirmasi */
    function cui() {
        const z = !!frz;
        $('csnap').textContent = z ? 'Konfirmasi & simpan sisi ini' : 'Simpan sisi ini';
        $('crd').hidden = !z;
        $('crot').hidden = !z;
        $('crot').textContent = scMode == 'putar' ? 'Mode: Putar kotak' : 'Mode: Tebak ulang';
        $('crot').className = scMode == 'putar' ? 'pri' : '';
        $('crs3').classList.toggle('fz', z);
    }
    function freeze(res) {
        frz = { res: res.map(c => ({ ...c, tp: false })), rej: res.map(() => new Set()) };
        scMode = 'tebak';
        cui();
        draw(frz.res);
        $('cres').textContent = 'Sisi ' + ORD[fi] + ' dibekukan. Ketuk kotak yang SALAH untuk menebak ulang (tiap ketukan = tebakan berikutnya), atau pakai Mode: Putar kotak untuk memutar huruf yang sudah benar tapi arahnya salah. Jika semua sudah benar, tekan "Konfirmasi & simpan sisi ini".';
    }
    function guess(i) {
        if (!frz)
            return;
        const r = frz.res[i];
        const t = TYP[i];
        const rej = frz.rej[i];
        const cf = ORD[fi];
        if (r.ch !== null)
            rej.add(r.ch);
        const use = {};
        frz.res.forEach((x, j) => {
            if (j != i && TYP[j] == t && x.ch)
                use[x.ch] = (use[x.ch] || 0) + 1;
        });
        for (const f of DAFTAR_MUKA)
            if (done.has(f) && f != cf)
                selEditor[f].forEach((c, j) => {
                    if (!c.w && c.ch && TYP[j] == t)
                        use[c.ch] = (use[c.ch] || 0) + 1;
                });
        const seen = new Set();
        const cands = [];
        for (const o of (r.L || [])) {
            if (seen.has(o.ch))
                continue;
            seen.add(o.ch);
            cands.push({
                ch: o.ch, deg: o.deg, s: o.ms
            });
        }
        for (const ch of (t == 'M' ? [...ctrs()] : Object.keys(POOL[t])))
            if (!seen.has(ch)) {
                seen.add(ch);
                cands.push({
                    ch, deg: r.deg || 0, s: -1
                });
            }
        const rk = o => o.s - .2 * Math.max(0, (use[o.ch] || 0) + 1 - (POOL[t][o.ch] || 0));
        const pick = () => cands.filter(o => !rej.has(o.ch)).sort((a, b) => rk(b) - rk(a))[0];
        let b = pick();
        if (!b) {
            rej.clear();
            if (r.ch !== null)
                rej.add(r.ch);
            b = pick();
        }
        if (!b)
            return;
        frz.res[i] = {
            ...r, ch: b.ch, deg: b.deg, tp: true
        };
        draw(frz.res);
        const el = $('crs3').children[i];
        if (el)
            el.focus();
        $('cres').textContent = 'Kotak ' + (i + 1) + ' ditebak ulang. Masih salah? Ketuk lagi. Sudah benar semua? Tekan "Konfirmasi & simpan sisi ini".';
    }
    function rotBox(i) {
        if (!frz)
            return;
        const r = frz.res[i];
        frz.res[i] = {
            ...r, deg: (r.deg + 90) % 360, tp: true
        };
        draw(frz.res);
        const el = $('crs3').children[i];
        if (el)
            el.focus();
        $('cres').textContent = 'Kotak ' + (i + 1) + ' diputar. Ketuk lagi untuk memutar lebih jauh. Sudah benar semua? Tekan "Konfirmasi & simpan sisi ini".';
    }
    $('crot').onclick = () => {
        if (!frz)
            return;
        scMode = scMode == 'putar' ? 'tebak' : 'putar';
        cui();
        $('cres').textContent = scMode == 'putar' ? 'Mode: Putar kotak aktif. Ketuk kotak yang hurufnya benar tapi arahnya salah untuk memutarnya 90°.' : 'Mode: Tebak ulang aktif. Ketuk kotak yang SALAH untuk menebak ulang.';
    };
    $('crs3').addEventListener('click', e => {
        const c = e.target.closest('.c');
        if (frz && c && c.dataset.i !== undefined) {
            if (scMode == 'putar')
                rotBox(+c.dataset.i);
            else
                guess(+c.dataset.i);
        }
    });
    $('crs3').addEventListener('keydown', e => {
        if (e.key != 'Enter' && e.key != ' ')
            return;
        const c = e.target.closest('.c');
        if (frz && c && c.dataset.i !== undefined) {
            e.preventDefault();
            if (scMode == 'putar')
                rotBox(+c.dataset.i);
            else
                guess(+c.dataset.i);
        }
    });
    $('crd').onclick = () => {
        frz = null;
        cui();
        resetAcc();
        $('crs3').innerHTML = '';
        $('cres').textContent = '';
    };
    function show() {
        const res = reading();
        draw(res);
        if (Date.now() < hold)
            return;
        const bad = res.filter(weak).length;
        $('cres').textContent = 'Sisi ' + ORD[fi] + ': ' + nfr + ' bingkai dibaca. ' + (bad ? bad + ' kotak masih ragu (berbingkai merah). Pegang kubus tegak lurus ke kamera, terang, lalu tunggu sebentar.' : 'Bacaan stabil. Tekan "Simpan sisi ini".');
    }
    /* Cek kualitas bingkai: gelap/silau, buram, tertutup jari, goyang. Bingkai buruk dilewati agar tidak merusak bacaan. */
    const qc = document.createElement('canvas');
    qc.width = qc.height = 96;
    const qx = qc.getContext('2d', { willReadFrequently: true });
    let qprev = null;
    function quality(sq) {
        qx.drawImage(sq, 0, 0, 96, 96);
        const d = qx.getImageData(0, 0, 96, 96).data;
        const g = new Float32Array(9216);
        let sum = 0;
        let skin = 0;
        for (let i = 0; i < 9216; i++) {
            const r = d[4 * i];
            const gg = d[4 * i + 1];
            const b = d[4 * i + 2];
            const y = .299 * r + .587 * gg + .114 * b;
            g[i] = y;
            sum += y;
            const mx = Math.max(r, gg, b);
            const mn = Math.min(r, gg, b);
            if (r > 95 && gg > 40 && b > 20 && r > gg && r > b && mx - mn > 15 && r - gg > 12)
                skin++;
        }
        const mean = sum / 9216;
        const s2 = Float32Array.from(g).sort();
        const lo = s2[460];
        const hi = s2[8755];
        let ge = 0;
        for (let y = 0; y < 95; y++)
            for (let x = 0; x < 95; x++) {
                const i = y * 96 + x;
                ge += Math.abs(g[i + 1] - g[i]) + Math.abs(g[i + 96] - g[i]);
            }
        const sharp = ge / 9025 / (hi - lo + 1);
        const sm = new Float32Array(576);
        for (let y = 0; y < 24; y++)
            for (let x = 0; x < 24; x++) {
                let a = 0;
                for (let j = 0; j < 4; j++)
                    for (let k = 0; k < 4; k++)
                        a += g[(y * 4 + j) * 96 + x * 4 + k];
                sm[y * 24 + x] = a / 16;
            }
        let mo = 0;
        if (qprev) {
            for (let i = 0; i < 576; i++)
                mo += Math.abs(sm[i] - qprev[i]);
            mo /= 576;
        }
        qprev = sm;
        if (mean < 70)
            return { ok: 0, msg: 'Terlalu gelap: tambah cahaya atau pindah ke tempat lebih terang.' };
        if (mean > 225)
            return { ok: 0, msg: 'Terlalu silau: kurangi pantulan cahaya pada kubus.' };
        if (skin / 9216 > .4)
            return { ok: 0, msg: 'Kubus tertutup jari/tangan: geser jari dari huruf.' };
        if (mo > 12)
            return { ok: 0, msg: 'Tahan kamera dan kubus lebih diam.' };
        if (sharp < .05)
            return { ok: 0, msg: 'Gambar buram: dekatkan/jauhkan sedikit sampai huruf tajam, tunggu fokus.' };
        return { ok: 1 };
    }
    function tick() {
        const v = $('cvid');
        if (busy || frz || $('cam').hidden || !v.videoWidth)
            return;
        busy = 1;
        try {
            const sq = crop(v, v.videoWidth, v.videoHeight);
            const k = quality(sq);
            const gd = document.querySelector('#cam .gd');
            gd.classList.toggle('bad', !k.ok);
            if (!k.ok) {
                if (Date.now() >= hold)
                    $('cres').textContent = k.msg;
            }
            else if (Date.now() >= hold) {
                addAcc(readFace(sq));
                show();
                if (!frz && nfr >= 6) {
                    const r = reading();
                    if (!r.some(weak) || nfr >= 24) {
                        freeze(r);
                        vib();
                    }
                }
            }
        }
        catch (e) {
        }
        busy = 0;
    }
    const POS = {
        F: [0, 0], R: [0, -90], B: [0, -180], L: [0, -270], U: [-90, -360], D: [-270, -360]
    };
    let dtm = 0;
    let dtT = [];
    const stopDir = () => {
        clearInterval(dtm);
        dtT.forEach(clearTimeout);
        dtT = [];
    };
    const STEPS = {
        F: [{
                p: [0, 0], d: '', t: 'Mulai: sisi F menghadap kamera, sisi U di atas.'
            }],
        R: [{
                p: [0, -90], d: 'l', t: 'Putar kubus ke KIRI 90\u00b0 (sisi R jadi menghadap kamera). Sisi U tetap di atas.'
            }],
        B: [{
                p: [0, -180], d: 'l', t: 'Putar lagi ke KIRI 90\u00b0 (sisi B menghadap kamera).'
            }],
        L: [{
                p: [0, -270], d: 'l', t: 'Putar lagi ke KIRI 90\u00b0 (sisi L menghadap kamera).'
            }],
        U: [{
                p: [0, -360], d: 'l', t: 'Langkah 1/2: putar kubus ke KIRI 90\u00b0 sampai sisi F kembali menghadap kamera (U di atas).'
            }, {
                p: [-90, -360], d: 'd', t: 'Langkah 2/2: miringkan kubus ke arah kamera (sisi atas mendekat) sampai sisi U menghadap kamera.'
            }],
        D: [{
                p: [0, -360], d: 'u', t: 'Langkah 1/2: miringkan balik sampai sisi F kembali menghadap kamera.'
            }, {
                p: [90, -360], d: 'u', t: 'Langkah 2/2: lanjutkan ke arah sebaliknya (sisi atas menjauh dari kamera) sampai sisi D menghadap kamera.'
            }]
    };
    const setCb = (p, an) => {
        const c = $('ccb');
        c.style.transition = an ? 'transform 1.2s cubic-bezier(.45,0,.2,1)' : 'none';
        c.style.transform = 'rotateX(' + p[0] + 'deg) rotateY(' + p[1] + 'deg)';
    };
    function dir() {
        stopDir();
        const f = ORD[fi];
        const S = STEPS[f];
        const from = fi ? POS[ORD[fi - 1]] : [-14, 55];
        const to = S[S.length - 1].p;
        const still = window.matchMedia && matchMedia('(prefers-reduced-motion:reduce)').matches;
        document.querySelectorAll('#ccb .fa').forEach(e => e.classList.toggle('on', e.dataset.f == f));
        $('ccb').closest('.sc3').dataset.f = f;
        const txt = k => {
            $('cdt').textContent = S[k].t;
            $('carr').dataset.d = S[k].d;
        };
        if (still) {
            setCb(to, 0);
            $('cdt').textContent = S.map(x => x.t).join(' ');
            $('carr').dataset.d = S[S.length - 1].d;
            return;
        }
        const GAP = 1700;
        const play = () => {
            dtT.forEach(clearTimeout);
            dtT = [];
            setCb(from, 0);
            void $('ccb').offsetWidth;
            txt(0);
            S.forEach((st, k) => dtT.push(setTimeout(() => {
                txt(k);
                setCb(st.p, 1);
            }, 300 + k * GAP)));
        };
        play();
        dtm = setInterval(play, 300 + S.length * GAP + 1200);
    }
    function nav() {
        $('cnv').innerHTML = ORD.map((f, i) => `<span class="${i == fi ? 'on' : done.has(f) ? 'd' : ''}">${f}</span>`).join('');
        $('cins').textContent = INS[ORD[fi]];
        dir();
    }
    function commit(res, v) {
        const f = ORD[fi];
        const bad = v ? res.filter(c => c.ch === null).length : res.filter(weak).length;
        selEditor[f] = res.map((c, i) => ({
            ch: c.ch, deg: c.deg, inf: false, w: v ? c.ch === null : weak(c), cf: v ? ((c.tp || weak(c)) && c.ch !== null ? 1 : Math.max(c.conf || 0, .6)) : c.conf, lk: !!v && c.ch !== null && (!!c.tp || weak(c)), alt: c.alt, pv: v && c.tp ? null : lastP && lastP[i]
        }));
        if (v)
            res.forEach((c, i) => {
                if (c.tp && c.ch && lastP && lastP[i])
                    learnAdd(c.ch, lastP[i]);
            });
        dirty = true;
        done.add(f);
        frz = null;
        cui();
        draw(res, 1);
        resetAcc();
        $('cres').textContent = 'Sisi ' + f + ' tersimpan' + (bad ? ' (' + bad + ' kotak ragu, periksa nanti di jaring)' : '') + '. ' + (fi < 5 ? 'Putar ke sisi berikutnya.' : 'Semua sisi selesai, tekan Selesai: kotak ragu akan diprediksi dari susunan kubus.');
        hold = Date.now() + 2800;
        if (fi < 5)
            fi++;
        nav();
    }
    /* Prediksi pintar: kotak ragu diisi dari aturan kubus (tiap keping punya kombinasi huruf tetap), bukan ditebak dari gambar */
    function predict() {
        const sf = DAFTAR_MUKA.filter(f => done.has(f));
        if (!sf.length)
            return '';
        const all = [];
        for (const f of sf)
            selEditor[f].forEach((c, i) => all.push({
                f, i, c, k: kunciSel(f, i)
            }));
        const nw = all.filter(x => x.c.w).length;
        const drop = new Set(all.filter(x => x.c.w).map(x => x.k));
        const rest = all.filter(x => !x.c.w && !x.c.lk).sort((a, b) => a.c.cf - b.c.cf);
        const run = () => {
            const cell = {};
            for (const x of all)
                if (!drop.has(x.k))
                    cell[x.k] = x.c.ch;
            return complete(cell, cube);
        };
        let r = run();
        let t = 0;
        while (r.n == 0 && !r.capped && t < 8 && rest.length) {
            drop.add(rest.shift().k);
            t++;
            r = run();
        }
        if (r.n == 0)
            return r.capped ? ' Terlalu banyak kotak ragu untuk diprediksi; scan ulang sisi yang ragu.' : ' Kotak ragu belum bisa diprediksi: ada huruf yang salah baca. Periksa jaring.';
        let sol = r.sols[0];
        let note = '';
        if (r.n > 1) {
            let bs = -1e9;
            for (const s of r.sols) {
                const m = selDariSolusi(s);
                let sc = 0;
                for (const x of all)
                    if (drop.has(x.k)) {
                        const a = x.c.alt && x.c.alt[m[x.k]];
                        sc += a == null ? -.3 : a;
                    }
                if (sc > bs) {
                    bs = sc;
                    sol = s;
                }
            }
            note = ' (ada beberapa kemungkinan; dipilih yang paling mirip bacaan kamera)';
        }
        const m = selDariSolusi(sol);
        if (r.n == 1)
            for (const x of all)
                if (!drop.has(x.k) && x.c.pv && x.c.ch && !x.c.w && x.c.cf >= .5) {
                    learnAdd(x.c.ch, x.c.pv);
                    x.c.pv = null;
                }
        let fix = 0;
        let fil = 0;
        for (const x of all)
            if (drop.has(x.k) && m[x.k] !== undefined) {
                const chg = x.c.w || m[x.k] !== x.c.ch;
                if (x.c.w)
                    fil++;
                else if (m[x.k] !== x.c.ch)
                    fix++;
                x.c.ch = m[x.k];
                if (chg)
                    x.c.inf = true;
                x.c.w = false;
            }
        return ' Prediksi: ' + fil + ' dari ' + nw + ' kotak ragu diisi' + (fix ? ', ' + fix + ' bacaan yang melanggar aturan kubus dikoreksi' : '') + ' (huruf biru)' + note + '.';
    }
    async function open() {
        panaskanPencarian();
        if (!selEditor.U)
            isiEditorDariKubus();
        fi = 0;
        done = new Set();
        resetAcc();
        hold = 0;
        frz = null;
        scMode = 'tebak';
        perbaruiJaring();
        $('cres').textContent = '';
        $('crs3').innerHTML = '';
        nav();
        $('cam').hidden = false;
        $('csnap').disabled = false;
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            try {
                stream = await navigator.mediaDevices.getUserMedia({ video: {
                        facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 }
                    }, audio: false });
                $('cvid').srcObject = stream;
                await $('cvid').play();
                try {
                    await stream.getVideoTracks()[0].applyConstraints({ advanced: [{ focusMode: 'continuous' }] });
                }
                catch (e) {
                }
                clearInterval(tm);
                tm = setInterval(tick, 250);
                return;
            }
            catch (e) {
            }
        }
        $('cvid').style.display = 'none';
        $('csnap').disabled = true;
        $('cres').textContent = 'Kamera langsung tidak tersedia (perlu izin kamera dan koneksi HTTPS). Gunakan "Unggah foto" untuk memotret atau memilih foto.';
    }
    function close() {
        frz = null;
        perbaruiJaring();
        clearInterval(tm);
        qprev = null;
        stopDir();
        if (stream) {
            stream.getTracks().forEach(t => t.stop());
            stream = null;
        }
        $('cvid').style.display = '';
        $('cam').hidden = true;
        let pm = '';
        try {
            pm = predict();
        }
        catch (e) {
        }
        dirty = true;
        liveBusy = true;
        try {
            gambarEditor();
        }
        finally {
            liveBusy = false;
        }
        autoApply(pm, done);
    }
    $('bcam').onclick = open;
    $('cend').onclick = close;
    $('cskip').onclick = () => {
        frz = null;
        perbaruiJaring();
        $('crs3').innerHTML = '';
        resetAcc();
        if (fi < 5)
            fi++;
        nav();
    };
    $('csnap').onclick = () => {
        if (frz) {
            commit(frz.res, 1);
            return;
        }
        const v = $('cvid');
        if (!acc && v.videoWidth)
            addAcc(readFace(crop(v, v.videoWidth, v.videoHeight)));
        if (acc)
            freeze(reading());
    };
    $('cup').onclick = () => $('cfile').click();
    $('cfile').onchange = e => {
        const fl = e.target.files[0];
        if (!fl)
            return;
        const im = new Image();
        im.onload = () => {
            resetAcc();
            const sq = crop(im, im.naturalWidth, im.naturalHeight);
            addAcc(readFace(sq));
            freeze(reading());
            URL.revokeObjectURL(im.src);
        };
        im.src = URL.createObjectURL(fl);
        e.target.value = '';
    };
})();
/* ===== Efek suara bertema WW2 (disintesis, tanpa file) ===== */
(() => {
    let AC = null;
    let on = true;
    let NB = null;
    try {
        on = localStorage.getItem('cubelendar.snd') !== '0';
    }
    catch (e) {
    }
    const ctx = () => {
        if (!on)
            return null;
        try {
            if (!AC) {
                AC = new (window.AudioContext || window.webkitAudioContext)();
                const n = AC.sampleRate * .5;
                const b = AC.createBuffer(1, n, AC.sampleRate);
                const d = b.getChannelData(0);
                for (let i = 0; i < n; i++)
                    d[i] = Math.random() * 2 - 1;
                NB = b;
            }
            if (AC.state === 'suspended')
                AC.resume();
            return AC;
        }
        catch (e) {
            return null;
        }
    };
    const env = (a, t, v, dur, at = .003) => {
        const g = a.createGain();
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(v, t + at);
        g.gain.exponentialRampToValueAtTime(.0001, t + dur);
        g.connect(a.destination);
        return g;
    };
    const noise = (a, t, dur, type, f, v, q = 1) => {
        const s = a.createBufferSource();
        s.buffer = NB;
        const fl = a.createBiquadFilter();
        fl.type = type;
        fl.frequency.value = f;
        fl.Q.value = q;
        s.connect(fl);
        fl.connect(env(a, t, v, dur));
        s.start(t, Math.random() * .3, dur + .02);
    };
    const tone = (a, t, f, dur, v, type = 'sine', f2) => {
        const o = a.createOscillator();
        o.type = type;
        o.frequency.setValueAtTime(f, t);
        if (f2)
            o.frequency.exponentialRampToValueAtTime(f2, t + dur);
        o.connect(env(a, t, v, dur));
        o.start(t);
        o.stop(t + dur + .02);
    };
    const morse = (a, t, pat, f = 760) => {
        let x = t;
        for (const c of pat) {
            const L = c == '-' ? .17 : .07;
            tone(a, x, f, L, .07, 'square');
            x += L + .06;
        }
    };
    const S = {
        hover(a, t) {
            noise(a, t, .016, 'bandpass', 3400 + Math.random() * 600, .07, 2);
            tone(a, t, 1150 + Math.random() * 120, .028, .035, 'triangle', 760);
        },
        click(a, t) {
            noise(a, t, .03, 'bandpass', 2200 + Math.random() * 500, .32, 1.2);
            tone(a, t, 150, .05, .28, 'sine', 70);
        },
        key(a, t) {
            noise(a, t, .035, 'bandpass', 1500 + Math.random() * 900, .38, 1.5);
            tone(a, t, 110 + Math.random() * 30, .06, .3, 'triangle', 60);
        },
        bell(a, t) {
            tone(a, t, 2350, .9, .12);
            tone(a, t, 3520, .5, .05);
            noise(a, t + .02, .12, 'highpass', 3000, .1);
        },
        move(a, t) {
            noise(a, t, .09, 'lowpass', 900, .5);
            tone(a, t, 95, .14, .5, 'sine', 45);
            noise(a, t + .1, .04, 'bandpass', 2600, .25, 2);
        },
        tele(a, t) {
            noise(a, t, .1, 'bandpass', 1800, .07, .6);
            morse(a, t + .02, '..');
        },
        stamp(a, t) {
            noise(a, t, .12, 'lowpass', 500, .7);
            tone(a, t, 70, .22, .7, 'sine', 35);
        },
        shutter(a, t) {
            noise(a, t, .025, 'bandpass', 3000, .4, 2);
            noise(a, t + .07, .03, 'bandpass', 2000, .4, 2);
        },
        ok(a, t) {
            S.bell(a, t);
            morse(a, t + .5, '...-', 820);
        },
        bad(a, t) {
            tone(a, t, 130, .22, .14, 'sawtooth', 90);
        }
    };
    window.sfx = n => {
        const a = ctx();
        if (a && S[n])
            S[n](a, a.currentTime + .005);
    };
    const TELE = new Set(['thome', 'ttut', 'tapp', 'tstk', 'happ', 'htut', 'hstk', 'istart']);
    document.addEventListener('click', e => {
        const b = e.target.closest('button,.hc,.sw,.dd-list li,.c');
        if (!b)
            return;
        if (b.id == 'tsnd') {
            on = !on;
            try {
                localStorage.setItem('cubelendar.snd', on ? '1' : '0');
            }
            catch (x) {
            }
            b.textContent = 'Suara: ' + (on ? 'ON' : 'OFF');
            b.setAttribute('aria-pressed', on);
            if (on)
                sfx('click');
            return;
        }
        sfx(b.id == 'thome' ? 'stamp' : TELE.has(b.id) ? 'tele' : b.id == 'csnap' ? 'shutter' : b.id == 'run' ? 'bell' : b.closest('#mvs,#pal,#ed,.sws') ? 'key' : 'click');
    }, true);
    let lastHv = 0;
    let lastEl = null;
    document.addEventListener('pointerover', e => {
        if (e.pointerType == 'touch' || e.buttons)
            return;
        const b = e.target.closest && e.target.closest('button,.hc,.sw,.dd-list li,.c,summary');
        if (!b || b === lastEl && b.contains(e.relatedTarget))
            return;
        if (b.contains(e.relatedTarget))
            return;
        if (b.disabled || b.getAttribute('aria-disabled') == 'true')
            return;
        const n = performance.now();
        if (n - lastHv < 45)
            return;
        lastHv = n;
        lastEl = b;
        sfx('hover');
    }, true);
    document.addEventListener('pointerout', e => {
        if (lastEl && !lastEl.contains(e.relatedTarget))
            lastEl = null;
    }, true);
    document.addEventListener('keydown', e => {
        if (e.target.id == 'mv' || e.target.id == 'ssz')
            sfx(e.key == 'Enter' ? 'bell' : e.key.length == 1 || e.key == 'Backspace' ? 'key' : '');
    }, true);
    $('tsnd').textContent = 'Suara: ' + (on ? 'ON' : 'OFF');
    $('tsnd').setAttribute('aria-pressed', on);
    const st = $('status');
    let was = false;
    new MutationObserver(() => {
        const ok = !!(st.classList.contains('ok') || st.querySelector('.ok'));
        if (ok && !was)
            sfx('ok');
        was = ok;
    }).observe(st, {
        childList: true, subtree: true, attributes: true, characterData: true
    });
})();
gambarPalet();
info();
perbaruiJaring();
// dialog kamera: Escape menutup, fokus dipindah masuk lalu dikembalikan (tanpa mengubah fungsi aslinya)
(() => {
    const cam = $('cam');
    let back = null;
    $('bcam').addEventListener('click', () => {
        back = document.activeElement;
        setTimeout(() => {
            if (!cam.hidden) {
                const t = $('csnap').disabled ? $('cup') : $('csnap');
                t && t.focus();
            }
        }, 350);
    });
    $('cend').addEventListener('click', () => {
        back && back.focus && back.focus();
    });
    document.addEventListener('keydown', e => {
        if (e.key == 'Escape' && !cam.hidden) {
            e.preventDefault();
            $('cend').click();
        }
    });
})();
// pembaca layar: umumkan hasil latihan dan info tanggal
$('iq').setAttribute('aria-live', 'polite');
$('info').setAttribute('aria-live', 'polite');
// pulihkan pilihan terakhir (mode Hijriah + koreksi) dan halaman dari alamat
try {
    if (localStorage.getItem('cubelendar.cal') == 'h') {
        const mv = localStorage.getItem('cubelendar.meth');
        if (mv && $('hm').querySelector('[value=' + mv + ']'))
            setMetode(mv);
        setKalender('h');
        const a = +localStorage.getItem('cubelendar.adj') || 0;
        if (a)
            setKoreksi(a);
    }
}
catch (e) {
}
(() => {
    const t = () => document.documentElement.style.setProperty('--tabh', $('tabs').offsetHeight + 'px');
    t();
    addEventListener('resize', t);
    const adv = $('adv');
    const wide = matchMedia('(min-width:1240px)');
    const sync = () => {
        if (wide.matches)
            adv.open = true;
    };
    sync();
    wide.addEventListener('change', sync);
    adv.addEventListener('toggle', sync);
})();
// ===== Perbaikan UI =====
const SUN = '<circle cx="12" cy="12" r="4"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8"/>';
const MOON = '<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z"/>';
// 1. pratinjau hasil akhir di kubus 3D (hanya visual; keadaan kubus logis tetap di acuan)
function tampilkanPratinjau() {
    try {
        const e = targetSaatIni().e;
        const ok = e && !panduan && !gerakanAktif && !queue.length && !(typeof dirty !== 'undefined' && dirty) && !$('appv').hidden && isHome(cube);
        if (!ok) {
            if (modePratinjau)
                sync();
            return;
        }
        const T = makeCube();
        for (const [f, k] of parse(e[0]))
            turn(T, f, k);
        T.forEach((p, i) => {
            cube[i].g.matrix.copy(matriksKeping(p));
            cube[i].g.matrixWorldNeedsUpdate = true;
        });
        const a = axes(T, e[1], e[2]);
        const r = [a.x, a.y, a.z];
        rotasiDasar = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().set(...r[0], 0, ...r[1], 0, ...r[2], 0, 0, 0, 0, 1));
        setView();
        const h = $('hint');
        if (!modePratinjau && h) {
            teksHintAsli = h.textContent;
        }
        if (h)
            h.textContent = 'Pratinjau hasil akhir untuk tanggal terpilih. Tekan Mulai panduan langkah untuk menyusunnya.';
        modePratinjau = 1;
        bangunkanRender();
    }
    catch (x) {
    }
}
{
    const _t = pindahTab;
    pindahTab = function (n, h) {
        _t(n, h);
        if (n == 'app')
            setTimeout(gambarMukaDepan, 0);
    };
}
// 2. lompat ke langkah
function lompatLangkah(t) {
    if (!panduan || isNaN(t) || t == panduan.i)
        return;
    if (sedangBerjalan()) {
        sinkronLompat();
        return;
    }
    const dn = i => Math.max(i - 1, 0);
    const a = dn(panduan.i);
    const b = dn(t);
    sorotMuka(null);
    gerakCepat = Math.abs(b - a) > 1;
    if (b > a) {
        queue.push(...panduan.m.slice(a, b));
        panduan.i = t;
        saatSelesai = tampilkanLangkah;
    }
    else if (b < a) {
        rotasiDasar = new THREE.Quaternion();
        setView();
        merekam = false;
        for (let s = a - 1; s >= b; s--) {
            const [f, k] = panduan.m[s];
            queue.push([f, 4 - k]);
        }
        panduan.i = t;
        saatSelesai = () => {
            merekam = true;
            riwayat.splice(riwayat.length - (a - b));
            tampilkanLangkah();
        };
    }
    else {
        panduan.i = t;
        tampilkanLangkah();
    }
}
function sinkronLompat() {
    if (!panduan)
        return;
    const s = $('gjump');
    const n = panduan.m.length;
    if (s._G !== panduan) {
        let o = '<option value="0">Persiapan</option>';
        panduan.m.forEach(([f, k], j) => {
            o += '<option value="' + (j + 1) + '">Langkah ' + (j + 1) + ' dari ' + n + ': ' + f + (k == 3 ? "'" : k == 2 ? '2' : '') + '</option>';
        });
        s.innerHTML = o + '<option value="' + (n + 1) + '">Selesai</option>';
        s._G = panduan;
    }
    s.value = panduan.i;
    $('gchips').querySelectorAll('.sc').forEach((c, j) => {
        c.dataset.j = j + 1;
        c.tabIndex = 0;
        c.setAttribute('role', 'button');
        c.title = 'Lompat ke langkah ' + (j + 1);
    });
}
$('gchips').insertAdjacentHTML('beforebegin', '<div class="row" id="gjmp"><label for="gjump">Lompat ke</label><select id="gjump"></select></div>');
$('gjump').onchange = e => lompatLangkah(+e.target.value);
$('gchips').addEventListener('click', e => {
    const c = e.target.closest('.sc');
    if (c)
        lompatLangkah(+c.dataset.j);
});
$('gchips').addEventListener('keydown', e => {
    const c = e.target.closest('.sc');
    if (c && (e.key == 'Enter' || e.key == ' ')) {
        e.preventDefault();
        lompatLangkah(+c.dataset.j);
    }
});
{
    const _g = tampilkanLangkah;
    tampilkanLangkah = function () {
        _g();
        sinkronLompat();
    };
}
// 4. tab Alat lanjutan: Isi jaring, Pindai, Hasil
(() => {
    const cs = $('adv').querySelectorAll('.card');
    const c1 = cs[0];
    const c2 = cs[1];
    const h2 = c1.querySelector('h2');
    const k = [...c1.children];
    const mk = () => {
        const d = document.createElement('div');
        d.className = 'apn';
        return d;
    };
    const P = [mk(), mk(), mk()];
    k.slice(1, 7).forEach(x => P[0].appendChild(x));
    const r1 = document.createElement('div');
    r1.className = 'row jf2';
    r1.append($('bcam'), $('b1'));
    P[1].innerHTML = '<div class="sub">Arahkan kamera ke tiap sisi kubus fisik. Hasil bacaan masuk ke jaring. Tombol <b>Muat dari 3D</b> menyalin susunan kubus di layar ke jaring.</div>';
    P[1].appendChild(r1);
    const r2 = document.createElement('div');
    r2.className = 'row jf2';
    r2.append($('b2'), $('b3'), $('b4'));
    P[2].appendChild(r2);
    [...c2.children].forEach(x => P[2].appendChild(x));
    c2.remove();
    const old = c1.querySelector('.jf2');
    if (old && !old.children.length)
        old.remove();
    const tl = document.createElement('div');
    tl.className = 'atabs';
    tl.setAttribute('role', 'tablist');
    const N = ['Isi jaring', 'Pindai', 'Hasil'];
    const B = N.map((n, i) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.textContent = n;
        b.setAttribute('role', 'tab');
        b.onclick = () => sel(i);
        tl.appendChild(b);
        return b;
    });
    const sel = i => {
        P.forEach((p, j) => {
            p.hidden = j != i;
            B[j].setAttribute('aria-selected', j == i);
        });
    };
    h2.after(tl);
    tl.after(P[0], P[1], P[2]);
    c1.insertBefore($('msg'), null);
    sel(0);
})();
// 5 + 9. Hijriah di samping tanggal, ikon matahari (Masehi) dan bulan (Hijriah)
$('dbtn').querySelector('svg').innerHTML = SUN;
$('dtw').insertAdjacentHTML('afterend', '<div id="hjn" aria-live="polite"></div>');
function tampilkanHijriah() {
    const el = $('hjn');
    let h = null;
    try {
        const [y, m, d] = tanggalDipilih();
        h = tanggalHijriah(y, m, d);
    }
    catch (e) {
    }
    el.innerHTML = h ? '<svg class="ic" style="width:16px;height:16px;vertical-align:-3px" viewBox="0 0 24 24" aria-hidden="true">' + MOON + '</svg> ' + h.d + ' ' + NAMA_BULAN_HIJRIAH[h.m - 1] + ' ' + h.y + ' H' : '';
    el.style.fontWeight = jenisKalender == 'h' ? '700' : '';
}
{
    const _d = sinkronTanggal;
    sinkronTanggal = function () {
        _d();
        tampilkanHijriah();
    };
}
// 6. mode terang/gelap manual
(() => {
    const r = document.documentElement;
    const b = $('tthm');
    const mq = matchMedia('(prefers-color-scheme:dark)');
    let t = null;
    try {
        t = localStorage.getItem('cubelendar.theme');
    }
    catch (e) {
    }
    const dark = () => t ? t == 'dark' : mq.matches;
    const ap = () => {
        if (t)
            r.dataset.theme = t;
        else
            r.removeAttribute('data-theme');
        const d = dark();
        b.innerHTML = '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">' + (d ? SUN : MOON) + '</svg>';
        b.setAttribute('aria-pressed', d);
        document.querySelectorAll('meta[name=theme-color]').forEach(m => m.content = d ? '#2a2d2e' : '#a9aaa7');
        b.title = d ? 'Ganti ke mode terang' : 'Ganti ke mode gelap';
    };
    b.onclick = () => {
        t = dark() ? 'light' : 'dark';
        try {
            localStorage.setItem('cubelendar.theme', t);
        }
        catch (e) {
        }
        ap();
        bangunkanRender();
    };
    mq.addEventListener && mq.addEventListener('change', ap);
    ap();
})();
sinkronTanggal();
gambarMukaDepan();
// ===== Perbaikan tahap 2 =====
const simpanLangkah = () => {
    try {
        localStorage.setItem('cubelendar.step', panduan && panduan.i <= panduan.m.length ? panduan.i : 0);
    }
    catch (e) {
    }
};
// 9. teks alternatif kanvas 3D
$('stage').setAttribute('role', 'img');
function labelStage() {
    $('stage').setAttribute('aria-label', 'Kubus 3D. ' + (panduan ? $('gnum').textContent + '. ' + $('gtxt').textContent : $('hint').textContent));
}
// 3, 5, 9: tampilkanLangkah tambahan (reset mode cepat, simpan langkah, label kanvas)
{
    const _g = tampilkanLangkah;
    tampilkanLangkah = function () {
        gerakCepat = 0;
        _g();
        labelStage();
        simpanLangkah();
    };
}
{
    const _e = endGuide;
    endGuide = function () {
        _e();
        try {
            localStorage.setItem('cubelendar.step', 0);
        }
        catch (e) {
        }
        labelStage();
    };
}
// 6. status saat pratinjau
{
    const _f = gambarMukaDepan;
    gambarMukaDepan = function () {
        _f();
        if (modePratinjau && $('status')) {
            $('status').innerHTML = '<span class="bad">Kubus Anda belum disusun</span>';
        }
    };
}
// 4. tombol cepat tanggal
$('hjn').insertAdjacentHTML('afterend', '<div class="row" id="qd"><button id="qt" type="button">Hari ini</button><button id="qb" type="button">Besok</button></div>');
const tanggalCepat = n => {
    const t = new Date();
    setDate(t.getFullYear(), t.getMonth() + 1, t.getDate() + n);
};
$('qt').onclick = () => tanggalCepat(0);
$('qb').onclick = () => tanggalCepat(1);
// 7. indikator "Menghitung" sebelum hitungan berat
// 10. tablist: Beranda bukan tab
{
    const nav = $('tabs');
    nav.removeAttribute('role');
    nav.setAttribute('aria-label', 'Menu utama');
    nav.querySelectorAll('[role=tab]').forEach(b => b.removeAttribute('role'));
    ['intro', 'stk', 'appv'].forEach(id => $(id).setAttribute('role', 'region'));
    const _t = pindahTab;
    const M = {
        home: 'thome', tut: 'ttut', app: 'tapp', stk: 'tstk'
    };
    pindahTab = function (n, h) {
        _t(n, h);
        nav.querySelectorAll('button').forEach(b => b.removeAttribute('aria-current'));
        M[n] && $(M[n]).setAttribute('aria-current', 'page');
    };
}
// 11. pintasan keyboard
$('gcam').closest('label').insertAdjacentHTML('afterend', '<div class="sub" id="kbd">Pintasan keyboard: panah kanan = langkah berikutnya, panah kiri = sebelumnya.</div>');
// 12. catatan metode Hijriah
{
    const _h = tampilkanHijriah;
    tampilkanHijriah = function () {
        _h();
        if (jenisKalender == 'h') {
            const o = $('hm').selectedOptions[0];
            $('hjn').insertAdjacentHTML('beforeend', '<div class="sub" style="font-size:12px;margin:4px 0 0">Metode: ' + (o ? o.textContent : '') + '. Jika beda satu hari dari kalender Anda, pakai koreksi ±1 hari.</div>');
        }
    };
}
// 5. simpan dan pulihkan tanggal + langkah panduan
$('dt').addEventListener('change', () => {
    try {
        localStorage.setItem('cubelendar.date', $('dt').value);
    }
    catch (e) {
    }
});
setTimeout(() => {
    try {
        const q = new URLSearchParams(location.search).get('tgl');
        const sd = q || localStorage.getItem('cubelendar.date');
        const st = q ? 0 : +localStorage.getItem('cubelendar.step') || 0;
        if (sd && /^\d{4}-\d\d-\d\d$/.test(sd)) {
            $('dt').value = sd;
            $('dt').dispatchEvent(new Event('change'));
            if (st > 0 && targetSaatIni().e) {
                $('gstart').click();
                setTimeout(() => {
                    if (panduan)
                        lompatLangkah(st);
                }, 200);
            }
        }
    }
    catch (e) {
    }
}, 60);
// perapian tampilan awal
$('hm').hidden = $('hadj').hidden = jenisKalender != 'h';
{
    const l = $('gcam').closest('label');
    l.style.flexWrap = 'nowrap';
    l.style.alignItems = 'flex-start';
    $('gcam').style.flex = 'none';
}
// ===== Perbaikan tahap 3 =====
// 2. kubus tidak menempel saat Alat lanjutan dibuka (HP)
$('adv').addEventListener('toggle', () => $('appv').classList.toggle('advo', $('adv').open));
// 3. layar tetap menyala selama panduan
let sentinelKunciLayar = null;
async function kunciLayar(on) {
    try {
        if (on && !sentinelKunciLayar && navigator.wakeLock) {
            sentinelKunciLayar = await navigator.wakeLock.request('screen');
            sentinelKunciLayar.addEventListener('release', () => {
                sentinelKunciLayar = null;
            });
        }
        else if (!on && sentinelKunciLayar) {
            const w = sentinelKunciLayar;
            sentinelKunciLayar = null;
            await w.release();
        }
    }
    catch (e) {
        sentinelKunciLayar = null;
    }
}
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && panduan && panduan.i <= panduan.m.length)
        kunciLayar(true);
});
{
    const _e = endGuide;
    endGuide = function () {
        _e();
        kunciLayar(false);
    };
}
// 4. layar Selesai: ulangi atau pilih tanggal lain
{
    const _g = tampilkanLangkah;
    tampilkanLangkah = function () {
        _g();
        if (panduan && panduan.i > panduan.m.length)
            $('gtxt').insertAdjacentHTML('beforeend', '<div class="row jf" style="margin-top:10px"><button type="button" data-a="again">Ulangi dari awal</button><button type="button" data-a="other">Pilih tanggal lain</button></div>');
        kunciLayar(!!panduan && panduan.i <= panduan.m.length);
    };
}
$('gtxt').addEventListener('click', e => {
    const b = e.target.closest('[data-a]');
    if (!b)
        return;
    if (b.dataset.a == 'again')
        lompatLangkah(0);
    else {
        reset();
        $('dbtn').scrollIntoView({ block: 'center' });
        $('dbtn').click();
    }
});
// 5. simpan pengaturan lain
try {
    const mv = localStorage.getItem('cubelendar.meth');
    if (mv && mv != metodeHijriah && $('hm').querySelector('[value=' + mv + ']'))
        setMetode(mv);
    const a = +localStorage.getItem('cubelendar.adj') || 0;
    if (a != koreksiHari)
        setKoreksi(a - koreksiHari);
    const gc = localStorage.getItem('cubelendar.gcam');
    if (gc !== null)
        $('gcam').checked = gc == '1';
}
catch (e) {
}
$('gcam').addEventListener('change', () => {
    try {
        localStorage.setItem('cubelendar.gcam', $('gcam').checked ? '1' : '0');
    }
    catch (e) {
    }
});
// 6. tautan yang bisa dibagikan (?tgl=AAAA-BB-HH)
$('dt').addEventListener('change', () => {
    try {
        history.replaceState(null, '', '?tgl=' + $('dt').value + location.hash);
    }
    catch (e) {
    }
});
// ===== Hitungan langkah di Web Worker (halaman tetap responsif) =====
let pekerja = null;
let idPekerjaan = 0;
const pekerjaanTertunda = {};
function runWorker(cs, e) {
    return new Promise((res, rej) => {
        try {
            if (!pekerja) {
                pekerja = new Worker('worker.js');
                pekerja.onmessage = ev => {
                    const p = pekerjaanTertunda[ev.data.id];
                    if (!p)
                        return;
                    delete pekerjaanTertunda[ev.data.id];
                    ev.data.err ? p.rej(new Error(ev.data.err)) : p.res(ev.data.r);
                };
                pekerja.onerror = () => {
                    const q = Object.values(pekerjaanTertunda);
                    for (const k in pekerjaanTertunda)
                        delete pekerjaanTertunda[k];
                    pekerja = null;
                    q.forEach(p => p.rej(new Error('worker')));
                };
            }
            const id = ++idPekerjaan;
            pekerjaanTertunda[id] = { res, rej };
            pekerja.postMessage({
                id, cube: cs, e
            });
        }
        catch (x) {
            rej(x);
        }
    });
}
let cacheRencana = null;
let sedangMerencanakan = false;
{
    const _p = planFromCurrent;
    planFromCurrent = function (e) {
        if (cacheRencana && cacheRencana.e === e) {
            const v = cacheRencana.v;
            cacheRencana = null;
            return v;
        }
        return _p(e);
    };
}
async function planAsync(e) {
    if (typeof dirty !== 'undefined' && dirty) {
        try {
            terapkanEditor();
        }
        catch (x) {
            $('info').innerHTML = '<span class="bad">Jaring belum bisa diterapkan ke 3D: ' + x.message + '</span>';
            return { v: null };
        }
    }
    let v;
    try {
        v = await runWorker(cube.map(p => ({
            pos: p.pos, p0: p.p0, R: p.R, st: p.st
        })), e);
    }
    catch (x) {
        return null;
    }
    if (!v)
        $('info').innerHTML = '<span class="bad">Susunan kubus ini tidak bisa diselesaikan (mungkin ada huruf yang salah baca di jaring). Periksa jaring, lalu coba lagi.</span>';
    return { v };
}
['gstart', 'go'].forEach(id => {
    const h = $(id).onclick;
    $(id).onclick = async function () {
        if (gerakanAktif || queue.length || sedangMerencanakan)
            return;
        const e = targetSaatIni().e;
        if (!e) {
            h.call(this);
            return;
        }
        sedangMerencanakan = true;
        $('info').textContent = 'Menghitung langkah…';
        $('gstart').disabled = $('go').disabled = true;
        try {
            const r = await planAsync(e);
            cacheRencana = r ? { e, v: r.v } : null;
        }
        catch (x) {
            cacheRencana = null;
        }
        $('gstart').disabled = $('go').disabled = false;
        sedangMerencanakan = false;
        if (cacheRencana && cacheRencana.v === null) {
            cacheRencana = null;
            return;
        }
        h.call(this);
        cacheRencana = null;
        if ($('info').textContent == 'Menghitung langkah…')
            info();
        if (id == 'gstart')
            revealGuide();
    };
});
function revealGuide() {
    const g = $('guide');
    if (!g || g.hidden)
        return;
    const top = $('appv').children[0];
    const sticky = getComputedStyle(top).position === 'sticky';
    g.style.scrollMarginTop = (sticky ? Math.round(top.getBoundingClientRect().bottom) + 8 : 8) + 'px';
    try {
        g.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion:reduce)').matches ? 'auto' : 'smooth' });
    }
    catch (e) {
        g.scrollIntoView();
    }
}
if (fromHash() != 'home')
    pindahTab(fromHash(), 1);
