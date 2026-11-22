/* worker.js: hitung langkah di thread terpisah (halaman tetap responsif). Perlu core.js dan data.js di folder yang sama. */
importScripts('core.js', 'data.js');
onmessage = ev => {
    const { id, cube, e } = ev.data;
    let r = null;
    let err = null;
    try {
        const alg = parse(e[0]);
        let best = null;
        if (isHome(cube))
            best = {
                pre: [], m: alg, direct: false
            };
        else {
            try {
                const x = pulihkanKubus(cube);
                if (x !== null) {
                    const pre = parse(x.join(' '));
                    best = {
                        pre, m: pre.concat(alg), direct: false
                    };
                }
            }
            catch (q) {
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
            catch (q) {
            }
        }
        r = best;
    }
    catch (x) {
        err = String(x);
    }
    postMessage({
        id, r, err
    });
};
