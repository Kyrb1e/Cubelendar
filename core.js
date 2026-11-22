/* core.js: model kubus, putaran, parser notasi, dan pemecah (dipakai halaman utama DAN worker.js).
   Jangan memakai document/window di sini. */
const DATA = [
    [1, 1, 1, 0, 1, 0, "0", 90, 2, 1, -1],
    [1, 1, 1, 0, 0, 1, "1", 180, 2, 1, 1],
    [1, 1, 1, 1, 0, 0, "2", 270, 2, -1, 1],
    [1, 1, -1, 0, 1, 0, "3", 180, 2, 1, 1],
    [1, 1, -1, 1, 0, 0, "2", 90, 2, 1, 1],
    [1, 1, -1, 0, 0, -1, "3", 180, 2, -1, 1],
    [1, -1, 1, 0, -1, 0, "0", 90, 2, 1, 1],
    [1, -1, 1, 1, 0, 0, "1", 270, 2, -1, -1],
    [1, -1, 1, 0, 0, 1, "4", 0, 2, 1, -1],
    [1, -1, -1, 0, -1, 0, "5", 0, 2, 1, -1],
    [1, -1, -1, 0, 0, -1, "6", 270, 2, -1, -1],
    [1, -1, -1, 1, 0, 0, "7", 0, 2, 1, -1],
    [-1, 1, 1, 0, 1, 0, "8", 270, 2, -1, -1],
    [-1, 1, 1, -1, 0, 0, "9", 90, 2, 1, 1],
    [-1, 1, 1, 0, 0, 1, "~", 0, 0, 0, 0],
    [-1, 1, -1, 0, 1, 0, "J", 0, 2, -1, 1],
    [-1, 1, -1, 0, 0, -1, "K", 270, 2, 1, 1],
    [-1, 1, -1, -1, 0, 0, "M", 0, 2, -1, 1],
    [-1, -1, 1, 0, -1, 0, "R", 0, 2, -1, 1],
    [-1, -1, 1, 0, 0, 1, "S", 90, 2, -1, -1],
    [-1, -1, 1, -1, 0, 0, "M", 270, 2, 1, -1],
    [-1, -1, -1, 0, -1, 0, "B", 180, 2, -1, -1],
    [-1, -1, -1, -1, 0, 0, "L", 180, 2, -1, -1],
    [-1, -1, -1, 0, 0, -1, "N", 270, 2, 1, -1],
    [1, 1, 0, 0, 1, 0, "/", 90, 1, 1, 0],
    [1, 1, 0, 1, 0, 0, "^", 0, 0, 0, 0],
    [1, 0, 1, 0, 0, 1, "A", 180, 1, 1, 0],
    [1, 0, 1, 1, 0, 0, "D", 0, 1, -1, 0],
    [1, 0, -1, 0, 0, -1, "F", 0, 1, -1, 0],
    [1, 0, -1, 1, 0, 0, "J", 180, 1, 1, 0],
    [1, -1, 0, 0, -1, 0, "M", 180, 1, 1, 0],
    [1, -1, 0, 1, 0, 0, "N", 90, 1, 0, -1],
    [0, 1, 1, 0, 1, 0, "O", 90, 1, 0, -1],
    [0, 1, 1, 0, 0, 1, "S", 270, 1, 0, 1],
    [0, 1, -1, 0, 1, 0, "B", 90, 1, 0, 1],
    [0, 1, -1, 0, 0, -1, "C", 90, 1, 0, 1],
    [0, -1, 1, 0, -1, 0, "G", 90, 1, 0, 1],
    [0, -1, 1, 0, 0, 1, "L", 270, 1, 0, -1],
    [0, -1, -1, 0, -1, 0, "N", 270, 1, 0, -1],
    [0, -1, -1, 0, 0, -1, "P", 270, 1, 0, -1],
    [-1, 1, 0, 0, 1, 0, "R", 180, 1, -1, 0],
    [-1, 1, 0, -1, 0, 0, "T", 90, 1, 0, 1],
    [-1, 0, 1, 0, 0, 1, "V", 180, 1, -1, 0],
    [-1, 0, 1, -1, 0, 0, "Y", 0, 1, 1, 0],
    [-1, 0, -1, 0, 0, -1, "A", 270, 1, 1, 0],
    [-1, 0, -1, -1, 0, 0, "E", 90, 1, -1, 0],
    [-1, -1, 0, 0, -1, 0, "I", 90, 1, -1, 0],
    [-1, -1, 0, -1, 0, 0, "U", 180, 1, 0, -1],
    [0, 1, 0, 0, 1, 0, "A", 0, 0, 0, 0],
    [0, -1, 0, 0, -1, 0, "C", 0, 0, 0, 0],
    [0, 0, 1, 0, 0, 1, "E", 0, 0, 0, 0],
    [0, 0, -1, 0, 0, -1, "O", 0, 0, 0, 0],
    [1, 0, 0, 1, 0, 0, "P", 0, 0, 0, 0],
    [-1, 0, 0, -1, 0, 0, "U", 0, 0, 0, 0]
];
const SUMBU_MUKA = {
    F: [[1, 0, 0], [0, 1, 0]], R: [[0, 0, -1], [0, 1, 0]], B: [[-1, 0, 0], [0, 1, 0]], L: [[0, 0, 1], [0, 1, 0]], U: [[1, 0, 0], [0, 0, -1]], D: [[1, 0, 0], [0, 0, 1]]
};
const NORMAL_MUKA = {
    U: [0, 1, 0], R: [1, 0, 0], F: [0, 0, 1], D: [0, -1, 0], L: [-1, 0, 0], B: [0, 0, -1]
};
const KODE_HARI = ['SEN', 'SEL', 'RAB', 'KAM', 'JUM', 'SAB', 'MIN'];
const KODE_BULAN = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const kaliVektor = (M, v) => M.map(r => Math.round(dot(r, v)) + 0);
const kaliMatriks = (A, B) => A.map(r => [0, 1, 2].map(j => Math.round(r[0] * B[0][j] + r[1] * B[1][j] + r[2] * B[2][j]) + 0));
const MATRIKS_IDENTITAS = [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1]
];
function matriksPutar(n, k) {
    const a = -Math.PI / 2 * k;
    const c = Math.cos(a);
    const s = Math.sin(a);
    const [x, y, z] = n;
    const K = [
        [0, -z, y],
        [z, 0, -x],
        [-y, x, 0]
    ];
    return [0, 1, 2].map(i => [0, 1, 2].map(j => Math.round(c * (i == j ? 1 : 0) + s * K[i][j] + (1 - c) * n[i] * n[j]) + 0));
}
function makeCube() {
    const P = {};
    for (const [px, py, pz, nx, ny, nz, ch, ang, k, vx, vy] of DATA) {
        const key = px + ',' + py + ',' + pz;
        const p = P[key] || (P[key] = {
            pos: [px, py, pz], p0: [px, py, pz], R: MATRIKS_IDENTITAS, st: []
        });
        const f = 'URFDLB'.split('').find(f => dot(NORMAL_MUKA[f], [nx, ny, nz]) == 1);
        const [r, u] = SUMBU_MUKA[f];
        p.st.push({
            n: [nx, ny, nz], r, u, ch, ang, k, v: [vx, vy]
        });
    }
    return Object.values(P);
}
function turn(cube, face, k) {
    const n = NORMAL_MUKA[face];
    const M = matriksPutar(n, k);
    cube.filter(p => dot(p.pos, n) == 1).forEach(p => {
        p.pos = kaliVektor(M, p.pos);
        p.R = kaliMatriks(M, p.R);
    });
}
const normMv = s => String(s).replace(/[\u2018\u2019\u2032\u00B4`]/g, "'").toUpperCase();
function parse(s) {
    return (normMv(s).match(/[URFDLB](?:2'?|'2?)?/g) || []).map(t => [t[0], t.includes('2') ? 2 : t.includes("'") ? 3 : 1]);
}
function badMv(s) {
    return normMv(s).replace(/[URFDLB](?:2'?|'2?)?/g, '').replace(/[\s,;]+/g, '');
}
function grid(cube, f, r, u) {
    const g = [
        [],
        [],
        []
    ];
    for (const p of cube)
        if (dot(p.pos, f) == 1)
            for (const s of p.st) {
                if (dot(kaliVektor(p.R, s.n), f) != 1)
                    continue;
                const sr = kaliVektor(p.R, s.r);
                const su = kaliVektor(p.R, s.u);
                const a = s.ang * Math.PI / 180;
                const c = [0, 1, 2].map(i => -Math.sin(a) * sr[i] + Math.cos(a) * su[i]);
                const deg = (Math.round(Math.atan2(-dot(c, r), dot(c, u)) * 180 / Math.PI) + 360) % 360;
                g[1 - dot(p.pos, u)][dot(p.pos, r) + 1] = { ch: s.ch, deg };
            }
    return g;
}
function axes(cube, X, Y) {
    const at = ch => cube.find(p => p.st.length == 1 && p.st[0].ch == ch).pos;
    const z = at(X);
    const y = at(Y);
    return {
        x: cross(y, z), y, z
    };
}
function targetTanggal(y, m, d) {
    const w = (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7;
    return {
        w, key: d + '-' + m + '-' + w, rows: [KODE_HARI[w], KODE_BULAN[m - 1], Math.floor(d / 10) + '/' + (d % 10)]
    };
}
function periksaMuka(cube, X, Y, rows) {
    const a = axes(cube, X, Y);
    const g = grid(cube, a.z, a.x, a.y);
    let ok = true;
    g.forEach((row, r) => row.forEach((c, i) => {
        c.bad = c.ch !== rows[r][i] || c.deg !== 0;
        if (c.bad)
            ok = false;
    }));
    return {
        g, ok, a
    };
}
const ROTASI_KUBUS = [];
for (const p of [
    [0, 1, 2],
    [0, 2, 1],
    [1, 0, 2],
    [1, 2, 0],
    [2, 0, 1],
    [2, 1, 0]
])
    for (const a of [1, -1])
        for (const b of [1, -1])
            for (const c of [1, -1]) {
                const s = [a, b, c];
                const M = [
                    [0, 0, 0],
                    [0, 0, 0],
                    [0, 0, 0]
                ];
                p.forEach((q, i) => M[i][q] = s[i]);
                const d = M[0][0] * (M[1][1] * M[2][2] - M[1][2] * M[2][1]) - M[0][1] * (M[1][0] * M[2][2] - M[1][2] * M[2][0]) + M[0][2] * (M[1][0] * M[2][1] - M[1][1] * M[2][0]);
                if (d == 1)
                    ROTASI_KUBUS.push(M);
            }
const kunciMatriks = M => M.flat().join();
const INDEKS_ROTASI = new Map(ROTASI_KUBUS.map((M, i) => [kunciMatriks(M), i]));
const kodePosisi = v => (v[0] + 1) * 9 + (v[1] + 1) * 3 + v[2] + 1;
const TABEL_GERAKAN = [];
for (const f of 'URFDLB')
    for (const k of [1, 2, 3]) {
        const n = NORMAL_MUKA[f];
        const M = matriksPutar(n, k);
        const np = [];
        const lay = [];
        for (let c = 0; c < 27; c++) {
            const v = [Math.floor(c / 9) - 1, Math.floor(c / 3) % 3 - 1, c % 3 - 1];
            lay.push(dot(v, n) == 1);
            np.push(lay[c] ? kodePosisi(kaliVektor(M, v)) : c);
        }
        TABEL_GERAKAN.push({
            f, k, np, lay, rm: ROTASI_KUBUS.map(R => INDEKS_ROTASI.get(kunciMatriks(kaliMatriks(M, R))))
        });
    }
const isHome = cube => cube.every(p => p.pos.join() == p.p0.join() && kunciMatriks(p.R) == kunciMatriks(MATRIKS_IDENTITAS));
function netText(cube) {
    return 'ULFRBD'.split('').map(f => {
        const g = grid(cube, NORMAL_MUKA[f], SUMBU_MUKA[f][0], SUMBU_MUKA[f][1]);
        return f + ' ' + g.flat().map(c => c.ch || '-').join('') + ' ' + g[1][1].deg / 90;
    }).join('\n');
}
function parseNet(txt, cube) {
    const cell = {};
    const cr = {};
    for (const ln of txt.trim().split('\n')) {
        const m = ln.trim().toUpperCase().match(/^([URFDLB])\s+(\S{9})\s*([0-3])?$/);
        if (!m)
            throw new Error('Baris tidak valid: ' + ln);
        const f = m[1];
        const [r, u] = SUMBU_MUKA[f];
        [...m[2]].forEach((ch, i) => {
            const pos = [0, 1, 2].map(j => NORMAL_MUKA[f][j] + (i % 3 - 1) * r[j] + (1 - (i / 3 | 0)) * u[j]);
            cell[pos + '|' + NORMAL_MUKA[f]] = ch == '-' ? '' : ch;
        });
        cr[f] = (+m[3] || 0) * 90;
    }
    if (Object.keys(cr).length < 6)
        throw new Error('Perlu 6 baris: U L F R B D');
    const used = new Set();
    const res = [];
    for (const p of cube) {
        let hit = null;
        for (const R of ROTASI_KUBUS) {
            const pos = kaliVektor(R, p.p0);
            let ok = true;
            for (const s of p.st) {
                const n = kaliVektor(R, s.n);
                if (cell[pos + '|' + n] !== s.ch) {
                    ok = false;
                    break;
                }
                if (p.st.length == 1) {
                    const sr = kaliVektor(R, s.r);
                    const su = kaliVektor(R, s.u);
                    const a = s.ang * Math.PI / 180;
                    const c = [0, 1, 2].map(i => -Math.sin(a) * sr[i] + Math.cos(a) * su[i]);
                    const f = 'URFDLB'.split('').find(f => dot(NORMAL_MUKA[f], n) == 1);
                    const [r, u] = SUMBU_MUKA[f];
                    if ((Math.round(Math.atan2(-dot(c, r), dot(c, u)) * 180 / Math.PI) + 360) % 360 !== cr[f]) {
                        ok = false;
                        break;
                    }
                }
            }
            if (ok) {
                hit = {
                    p, R, pos
                };
                break;
            }
        }
        if (!hit)
            throw new Error('Keping dengan stiker ' + p.st.map(s => s.ch || '-').join(' ') + ' tidak ditemukan. Cek huruf/posisinya.');
        if (used.has(hit.pos + ''))
            throw new Error('Dua keping menempati posisi yang sama: ' + hit.pos);
        used.add(hit.pos + '');
        res.push(hit);
    }
    res.forEach(h => {
        h.p.pos = h.pos;
        h.p.R = h.R;
    });
}
function enkodeKubus(cube) {
    const a = new Uint8Array(52);
    cube.forEach((p, i) => {
        a[2 * i] = kodePosisi(p.pos);
        a[2 * i + 1] = INDEKS_ROTASI.get(kunciMatriks(p.R));
    });
    return a;
}
function terapkanGerak(a, m) {
    const b = new Uint8Array(52);
    for (let i = 0; i < 26; i++) {
        const q = a[2 * i];
        if (m.lay[q]) {
            b[2 * i] = m.np[q];
            b[2 * i + 1] = m.rm[a[2 * i + 1]];
        }
        else {
            b[2 * i] = q;
            b[2 * i + 1] = a[2 * i + 1];
        }
    }
    return b;
}
function pulihkanKubus(cube, maxd = 5) {
    const key = a => String.fromCharCode.apply(null, a);
    const home = new Uint8Array(52);
    const inv = m => (m / 3 | 0) * 3 + 2 - m % 3;
    const ch = m => String.fromCharCode(65 + m);
    const fc = p => p ? ((p.charCodeAt(p.length - 1) - 65) / 3 | 0) : -1;
    cube.forEach((p, i) => {
        home[2 * i] = kodePosisi(p.p0);
        home[2 * i + 1] = INDEKS_ROTASI.get(kunciMatriks(MATRIKS_IDENTITAS));
    });
    const bw = pulihkanKubus.bw || (pulihkanKubus.bw = (() => {
        const mp = new Map([[key(home), '']]);
        let fb = [[home, '']];
        for (let d = 0; d < maxd; d++) {
            const nx = [];
            for (const [a, p] of fb)
                for (let m = 0; m < 18; m++) {
                    if (fc(p) === (m / 3 | 0))
                        continue;
                    const b = terapkanGerak(a, TABEL_GERAKAN[m]);
                    const k = key(b);
                    if (mp.has(k))
                        continue;
                    const q = p + ch(m);
                    mp.set(k, q);
                    nx.push([b, q]);
                }
            fb = nx;
        }
        return mp;
    })());
    const back = q => [...q].reverse().map(c => ch(inv(c.charCodeAt(0) - 65))).join('');
    const s = enkodeKubus(cube);
    const ks = key(s);
    let best = bw.has(ks) ? back(bw.get(ks)) : null;
    const seen = new Set([ks]);
    let ff = [[s, '']];
    for (let d = 1; d <= maxd && best === null; d++) {
        const nx = [];
        for (const [a, p] of ff)
            for (let m = 0; m < 18; m++) {
                if (fc(p) === (m / 3 | 0))
                    continue;
                const b = terapkanGerak(a, TABEL_GERAKAN[m]);
                const k = key(b);
                if (seen.has(k))
                    continue;
                seen.add(k);
                const q = p + ch(m);
                nx.push([b, q]);
                if (bw.has(k)) {
                    const t = q + back(bw.get(k));
                    if (best === null || t.length < best.length)
                        best = t;
                }
            }
        ff = nx;
    }
    return best === null ? null : [...best].map(c => {
        const m = TABEL_GERAKAN[c.charCodeAt(0) - 65];
        return m.f + ['', "2", "'"][m.k - 1];
    });
}
const kunciSel = (f, i) => {
    const [r, u] = SUMBU_MUKA[f];
    return [0, 1, 2].map(j => NORMAL_MUKA[f][j] + (i % 3 - 1) * r[j] + (1 - (i / 3 | 0)) * u[j]) + '|' + NORMAL_MUKA[f];
};
const selDariSolusi = sol => {
    const m = {};
    for (const h of sol)
        for (const s of h.p.st)
            m[h.pos + '|' + kaliVektor(h.R, s.n)] = s.ch;
    return m;
};
function paritasPermutasi(a) {
    let s = 0;
    const sn = [];
    for (let i = 0; i < a.length; i++) {
        if (sn[i])
            continue;
        let j = i;
        let l = 0;
        while (!sn[j]) {
            sn[j] = 1;
            j = a[j];
            l++;
        }
        s += l - 1;
    }
    return s & 1;
}
function valid(sol) {
    let tw = 0;
    let fl = 0;
    const pa = [[], []];
    const home = [[], []];
    for (const h of sol) {
        const p = h.p;
        const c = p.st.length == 3 ? 0 : 1;
        if (c == 0)
            tw += p.st.findIndex(s => kaliVektor(h.R, s.n)[1] != 0);
        else
            fl += kaliVektor(h.R, p.st[0].n)[h.pos[1] != 0 ? 1 : 2] != 0 ? 0 : 1;
        home[c].push(kodePosisi(p.p0));
        pa[c].push(kodePosisi(h.pos));
    }
    return tw % 3 == 0 && fl % 2 == 0 && paritasPermutasi(pa[0].map(x => home[0].indexOf(x))) == paritasPermutasi(pa[1].map(x => home[1].indexOf(x)));
}
function complete(cell, cube) {
    const P = cube.filter(p => p.st.length > 1);
    const C = P.map(p => {
        const o = [];
        for (const R of ROTASI_KUBUS) {
            const pos = kaliVektor(R, p.p0);
            let ok = true;
            for (const s of p.st) {
                const v = cell[pos + '|' + kaliVektor(R, s.n)];
                if (v !== undefined && v !== s.ch) {
                    ok = false;
                    break;
                }
            }
            if (ok)
                o.push({
                    p, R, pos
                });
        }
        return o;
    });
    const ord = C.map((c, i) => i).sort((a, b) => C[a].length - C[b].length);
    const used = new Set();
    const cur = [];
    const sols = [];
    let nodes = 0;
    (function go(k) {
        if (sols.length > 1 || nodes > 3e6)
            return;
        nodes++;
        if (k == ord.length) {
            if (valid(cur))
                sols.push(cur.slice());
            return;
        }
        for (const h of C[ord[k]]) {
            const key = h.pos + '';
            if (used.has(key))
                continue;
            used.add(key);
            cur.push(h);
            go(k + 1);
            cur.pop();
            used.delete(key);
        }
    })(0);
    return {
        n: sols.length, sols, capped: nodes > 3e6
    };
}
/* Pencocokan toleran: cari susunan kubus sah yang paling sedikit berbeda dari jaring (huruf salah baca / kosong) */
function fit(cell, cube, maxMis = 6, maxSols = 24) {
    const P = cube.filter(p => p.st.length > 1);
    const C = P.map(p => ROTASI_KUBUS.map(R => {
        const pos = kaliVektor(R, p.p0);
        let c = 0;
        for (const s of p.st) {
            const v = cell[pos + '|' + kaliVektor(R, s.n)];
            if (v !== undefined && v !== s.ch)
                c++;
        }
        return {
            p, R, pos, c
        };
    }));
    let nodes = 0;
    const LIM = 3e6;
    for (let b = 0; b <= maxMis; b++) {
        const L = C.map(o => o.filter(h => h.c <= b).sort((x, y) => x.c - y.c));
        if (L.some(l => !l.length))
            continue;
        const ord = L.map((l, i) => i).sort((x, y) => L[x].length - L[y].length);
        const used = new Set();
        const cur = [];
        const sols = [];
        (function go(k, cost) {
            if (sols.length >= maxSols || nodes > LIM)
                return;
            nodes++;
            if (k == ord.length) {
                if (valid(cur))
                    sols.push(cur.slice());
                return;
            }
            for (const h of L[ord[k]]) {
                if (cost + h.c > b)
                    continue;
                const key = h.pos + '';
                if (used.has(key))
                    continue;
                used.add(key);
                cur.push(h);
                go(k + 1, cost + h.c);
                cur.pop();
                used.delete(key);
            }
        })(0, 0);
        if (sols.length)
            return {
                n: sols.length, cost: b, sols
            };
        if (nodes > LIM)
            return { n: 0, capped: true };
    }
    return { n: 0 };
}
/* Pemecah langsung: susun muka tanggal dari susunan kubus mana pun, keping demi keping (IDA*), tanpa batas langkah */
function solveDate(cube, X, Y, alg) {
    const T = makeCube();
    for (const [f, k] of alg)
        turn(T, f, k);
    const aT = axes(T, X, Y);
    const aC = axes(cube, X, Y);
    const BT = [aT.x, aT.y, aT.z];
    const BC = [aC.x, aC.y, aC.z];
    // g = BC^T-basis * BT : memetakan bingkai target ke bingkai kubus saat ini
    const g = [0, 1, 2].map(i => [0, 1, 2].map(j => BC[0][i] * BT[0][j] + BC[1][i] * BT[1][j] + BC[2][i] * BT[2][j]));
    const idx = T.map((p, i) => i).filter(i => dot(T[i].pos, aT.z) == 1);
    const ord = idx.slice().sort((a, b) => {
        const ca = T[a].st.length;
        const cb = T[b].st.length;
        return ca - cb;
    }); // pusat, tepi, sudut
    const goal = ord.map(i => [kodePosisi(kaliVektor(g, T[i].pos)), INDEKS_ROTASI.get(kunciMatriks(kaliMatriks(g, T[i].R)))]);
    const N = ord.length;
    const cur = ord.map(i => [kodePosisi(cube[i].pos), INDEKS_ROTASI.get(kunciMatriks(cube[i].R))]);
    const S = cur.map(x => x[0] * 24 + x[1]);
    // jarak tiap keping sendirian ke tujuannya (BFS)
    const dist = goal.map(gl => {
        const d = new Int8Array(27 * 24).fill(-1);
        const g0 = gl[0] * 24 + gl[1];
        d[g0] = 0;
        let fr = [g0];
        while (fr.length) {
            const nx = [];
            for (const st of fr) {
                const q = (st / 24) | 0;
                const r = st % 24;
                for (const m of TABEL_GERAKAN) {
                    let q2 = q;
                    let r2 = r;
                    if (m.lay[q]) {
                        q2 = m.np[q];
                        r2 = m.rm[r];
                    }
                    const s2 = q2 * 24 + r2;
                    if (d[s2] < 0) {
                        d[s2] = d[st] + 1;
                        nx.push(s2);
                    }
                }
            }
            fr = nx;
        }
        return d;
    });
    const G = goal.map(x => x[0] * 24 + x[1]);
    const sol = [];
    let nodes = 0;
    for (let k = 1; k <= N; k++) {
        // tahap k: keping 0..k-1 harus di tempatnya
        const st = S.slice();
        let found = null;
        const path = [];
        const h = s => {
            let m = 0;
            for (let i = 0; i < k; i++) {
                const v = dist[i][s[i]];
                if (v > m)
                    m = v;
            }
            return m;
        };
        const dfs = (s, depth, bound, last) => {
            const hh = h(s);
            if (hh == 0 && depth >= 0)
                return true; // semua keping tahap ini sudah benar
            if (depth + hh > bound)
                return false;
            nodes++;
            for (let mi = 0; mi < 18; mi++) {
                const m = TABEL_GERAKAN[mi];
                const fi = mi / 3 | 0;
                if (last >= 0) {
                    if (fi == last)
                        continue;
                    if ((fi - last + 6) % 6 == 3 && fi < last)
                        continue;
                }
                const t = s.slice();
                for (let i = 0; i < k; i++) {
                    const q = (s[i] / 24) | 0;
                    const r = s[i] % 24;
                    if (m.lay[q])
                        t[i] = m.np[q] * 24 + m.rm[r];
                }
                path.push(mi);
                if (dfs(t, depth + 1, bound, fi))
                    return true;
                path.pop();
            }
            return false;
        };
        let b = h(st);
        for (;; b++) {
            path.length = 0;
            if (dfs(st, 0, b, -1)) {
                found = path.slice();
                break;
            }
            if (b > 16)
                throw new Error('terlalu dalam');
        }
        for (const mi of found) {
            const m = TABEL_GERAKAN[mi];
            sol.push([m.f, m.k]);
            for (let i = 0; i < N; i++) {
                const q = (S[i] / 24) | 0;
                const r = S[i] % 24;
                if (m.lay[q])
                    S[i] = m.np[q] * 24 + m.rm[r];
            }
        }
    }
    return {
        moves: sol, nodes, ok: S.every((v, i) => v == G[i])
    };
}
function mergeMoves(m) {
    const o = [];
    for (const [f, k] of m) {
        if (o.length && o[o.length - 1][0] == f) {
            const t = (o[o.length - 1][1] + k) % 4;
            o.pop();
            if (t)
                o.push([f, t]);
        }
        else
            o.push([f, k]);
    }
    return o;
}
