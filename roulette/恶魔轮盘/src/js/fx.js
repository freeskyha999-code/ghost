// ============================================================
// fx.js —— 沉浸式音效 + 屏幕特效
// WebAudio 程序化合成（枪声/电击/心跳/除颤）+ DOM 叠层（闪白/血边/闪电/抖动）
// 摄像机抖动由 SceneManager.shakeCamera / kickFov 实现。
// ============================================================
const FX = (() => {
    let ctx = null, master = null, reverbSend = null, noiseBuf = null;

    function bgm() { return (typeof audioMgr !== 'undefined' && audioMgr) ? audioMgr : null; }

    function ensure() {
        try {
            if (!ctx) {
                const AC = window.AudioContext || window.webkitAudioContext;
                if (!AC) return null;
                ctx = new AC();
                master = ctx.createGain();
                master.gain.value = 0.95;
                const comp = ctx.createDynamicsCompressor();
                comp.threshold.value = -8; comp.knee.value = 12; comp.ratio.value = 8;
                comp.attack.value = 0.002; comp.release.value = 0.2;
                master.connect(comp); comp.connect(ctx.destination);

                const conv = ctx.createConvolver();
                conv.buffer = makeImpulse(1.9, 2.4);
                reverbSend = ctx.createGain();
                const rv = ctx.createGain(); rv.gain.value = 0.34;
                reverbSend.connect(conv); conv.connect(rv); rv.connect(master);

                noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
                const d = noiseBuf.getChannelData(0);
                for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
            }
            if (ctx.state === 'suspended') ctx.resume();
            return ctx;
        } catch (e) { return null; }
    }

    function makeImpulse(sec, decay) {
        const len = Math.floor(ctx.sampleRate * sec);
        const buf = ctx.createBuffer(2, len, ctx.sampleRate);
        for (let ch = 0; ch < 2; ch++) {
            const d = buf.getChannelData(ch);
            for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
        }
        return buf;
    }
    function distCurve(k) {
        const n = 1024, c = new Float32Array(n);
        for (let i = 0; i < n; i++) { const x = i * 2 / n - 1; c[i] = (1 + k) * x / (1 + k * Math.abs(x)); }
        return c;
    }
    function noiseSrc(t, dur) {
        const s = ctx.createBufferSource();
        s.buffer = noiseBuf; s.loop = true;
        s.start(t, Math.random() * 1.5);
        s.stop(t + dur);
        return s;
    }
    function env(g, t, peak, attack, decay) {
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), t + attack);
        g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
    }

    // ---------------- 音效 ----------------
    // 爆裂枪声：高频炸裂 + 失真 + 低频轰鸣 + 躯体噪声 + 混响尾巴
    function gunshot(heavy = true, when = 0) {
        if (!ensure()) return;
        const t = ctx.currentTime + when;
        const n1 = noiseSrc(t, 0.35);
        const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 800;
        const ws = ctx.createWaveShaper(); ws.curve = distCurve(heavy ? 80 : 30);
        const g1 = ctx.createGain(); env(g1, t, 1.0, 0.002, 0.24);
        n1.connect(hp); hp.connect(ws); ws.connect(g1); g1.connect(master); g1.connect(reverbSend);
        const o = ctx.createOscillator(); o.type = 'sine';
        o.frequency.setValueAtTime(200, t); o.frequency.exponentialRampToValueAtTime(32, t + 0.55);
        const g2 = ctx.createGain(); env(g2, t, heavy ? 1.5 : 0.9, 0.004, 0.7);
        o.connect(g2); g2.connect(master); o.start(t); o.stop(t + 0.85);
        const n3 = noiseSrc(t, 0.55);
        const lp = ctx.createBiquadFilter(); lp.type = 'lowpass';
        lp.frequency.setValueAtTime(2600, t); lp.frequency.exponentialRampToValueAtTime(160, t + 0.45);
        const g3 = ctx.createGain(); env(g3, t, 0.95, 0.003, 0.45);
        n3.connect(lp); lp.connect(g3); g3.connect(master); g3.connect(reverbSend);
        const n4 = noiseSrc(t + 0.11, 0.4);
        const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 700; bp.Q.value = 0.8;
        const g4 = ctx.createGain(); env(g4, t + 0.11, 0.22, 0.01, 0.35);
        n4.connect(bp); bp.connect(g4); g4.connect(reverbSend);
    }

    function thud(gain = 1, when = 0, f0 = 90) {
        if (!ensure()) return;
        const t = ctx.currentTime + when;
        const o = ctx.createOscillator(); o.type = 'sine';
        o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f0 * 0.4, t + 0.22);
        const g = ctx.createGain(); env(g, t, gain, 0.005, 0.3);
        o.connect(g); g.connect(master); o.start(t); o.stop(t + 0.5);
    }

    function ring(ms = 2600, level = 0.06) {
        if (!ensure()) return;
        const t = ctx.currentTime, sec = ms / 1000;
        const g = ctx.createGain();
        g.gain.setValueAtTime(level, t);
        g.gain.setValueAtTime(level, t + sec * 0.3);
        g.gain.linearRampToValueAtTime(0.0001, t + sec);
        [3800, 4150].forEach(f => {
            const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f;
            o.connect(g); o.start(t); o.stop(t + sec + 0.05);
        });
        g.connect(master);
    }

    // 心跳：返回每次心跳相对现在的毫秒偏移，供视觉脉冲对齐
    function heartbeat(bpm = 70, beats = 4, gain = 0.8, opts = {}, whenMs = 0) {
        if (!ensure()) return [];
        const times = [];
        const gap = 60 / bpm;
        for (let i = 0; i < beats; i++) {
            const t = ctx.currentTime + whenMs / 1000 + i * gap;
            const mk = (tt, peak, f0) => {
                const o = ctx.createOscillator(); o.type = 'sine';
                o.frequency.setValueAtTime(f0, tt); o.frequency.exponentialRampToValueAtTime(f0 * 0.55, tt + 0.14);
                const g = ctx.createGain(); env(g, tt, peak, 0.008, 0.2);
                if (opts.muffled) {
                    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 140;
                    o.connect(lp); lp.connect(g);
                } else o.connect(g);
                g.connect(master); o.start(tt); o.stop(tt + 0.4);
            };
            mk(t, gain, 72);
            mk(t + Math.min(0.28, gap * 0.38), gain * 0.7, 62);
            times.push(whenMs + i * gap * 1000);
        }
        return times;
    }

    // 电击：嗡鸣 + 噼啪火花
    function zap(ms = 1800, power = 1) {
        if (!ensure()) return;
        const t0 = ctx.currentTime, end = t0 + ms / 1000;
        const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = 100;
        const lfo = ctx.createOscillator(); lfo.frequency.value = 31;
        const lfoG = ctx.createGain(); lfoG.gain.value = 40;
        lfo.connect(lfoG); lfoG.connect(o.frequency);
        const ws = ctx.createWaveShaper(); ws.curve = distCurve(90);
        const bg = ctx.createGain();
        bg.gain.setValueAtTime(0.0001, t0);
        bg.gain.exponentialRampToValueAtTime(0.32 * power, t0 + 0.03);
        bg.gain.setValueAtTime(0.32 * power, Math.max(t0 + 0.04, end - 0.45));
        bg.gain.exponentialRampToValueAtTime(0.0001, end);
        o.connect(ws); ws.connect(bg); bg.connect(master);
        o.start(t0); lfo.start(t0); o.stop(end + 0.05); lfo.stop(end + 0.05);
        let t = t0;
        while (t < end) {
            const dur = 0.004 + Math.random() * 0.022;
            const s = noiseSrc(t, dur);
            const f = ctx.createBiquadFilter(); f.type = 'bandpass';
            f.frequency.value = 1500 + Math.random() * 6000; f.Q.value = 2 + Math.random() * 6;
            const g = ctx.createGain();
            g.gain.value = (0.35 + Math.random() * 0.8) * power * (1 - ((t - t0) / (end - t0)) * 0.35);
            s.connect(f); f.connect(g); g.connect(master);
            t += 0.012 + Math.random() * 0.06;
        }
        thud(0.7 * power, 0, 70);
    }

    function defibCharge(ms = 1300, level = 0.22) {
        if (!ensure()) return;
        const t = ctx.currentTime, sec = ms / 1000;
        const o = ctx.createOscillator(); o.type = 'sine';
        o.frequency.setValueAtTime(450, t); o.frequency.exponentialRampToValueAtTime(3600, t + sec);
        const v = ctx.createOscillator(); v.frequency.value = 7;
        const vg = ctx.createGain(); vg.gain.value = 60;
        v.connect(vg); vg.connect(o.frequency);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(level, t + sec * 0.9);
        g.gain.linearRampToValueAtTime(0.0001, t + sec + 0.04);
        o.connect(g); g.connect(master);
        o.start(t); v.start(t); o.stop(t + sec + 0.1); v.stop(t + sec + 0.1);
    }

    function defibShock(power = 1) {
        if (!ensure()) return;
        gunshot(false);
        thud(1.4 * power, 0, 110);
        zap(380, 1.1 * power);
    }

    function flatline(ms = 1200, level = 0.09) {
        if (!ensure()) return;
        const t = ctx.currentTime, sec = ms / 1000;
        const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = 1000;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(level, t + 0.03);
        g.gain.setValueAtTime(level, t + sec - 0.05);
        g.gain.exponentialRampToValueAtTime(0.0001, t + sec);
        o.connect(g); g.connect(master); o.start(t); o.stop(t + sec + 0.05);
    }

    function gasp() {
        if (!ensure()) return;
        const t = ctx.currentTime;
        const n = noiseSrc(t, 0.8);
        const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 1.2;
        bp.frequency.setValueAtTime(500, t); bp.frequency.exponentialRampToValueAtTime(2200, t + 0.55);
        const g = ctx.createGain(); env(g, t, 0.55, 0.3, 0.45);
        n.connect(bp); bp.connect(g); g.connect(master);
    }

    // BGM 压低/恢复
    let duckTimer = null;
    function bgmTo(level, ms = 300) {
        const a = bgm() && bgm().bgm;
        if (!a) return;
        clearInterval(duckTimer);
        const start = a.volume, steps = Math.max(1, Math.round(ms / 50));
        let i = 0;
        duckTimer = setInterval(() => {
            i++;
            a.volume = Math.min(1, Math.max(0, start + (level - start) * i / steps));
            if (i >= steps) clearInterval(duckTimer);
        }, 50);
    }

    // ---------------- 视觉 ----------------
    function overlay(css) {
        const d = document.createElement('div');
        d.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;' + css;
        document.body.appendChild(d);
        return d;
    }
    function flash(color = '#fff', peak = 0.9, inMs = 30, outMs = 300, z = 996) {
        const d = overlay(`background:${color};opacity:0;z-index:${z};transition:opacity ${inMs}ms linear;`);
        requestAnimationFrame(() => {
            d.style.opacity = peak;
            setTimeout(() => {
                d.style.transition = `opacity ${outMs}ms ease-out`;
                d.style.opacity = 0;
                setTimeout(() => d.remove(), outMs + 60);
            }, inMs);
        });
    }
    function vignette(rgb = '138,3,3', peak = 0.85, holdMs = 200, outMs = 1200, z = 995) {
        const d = overlay(`z-index:${z};background:radial-gradient(circle at 50% 50%, transparent 22%, rgba(${rgb},0.9) 100%);opacity:0;transition:opacity 40ms linear;`);
        requestAnimationFrame(() => {
            d.style.opacity = peak;
            setTimeout(() => {
                d.style.transition = `opacity ${outMs}ms ease-out`;
                d.style.opacity = 0;
                setTimeout(() => d.remove(), outMs + 60);
            }, holdMs);
        });
    }
    function jitter(ms = 300, px = 12) {
        const t0 = performance.now();
        (function f() {
            const p = (performance.now() - t0) / ms;
            if (p >= 1) { document.body.style.transform = 'none'; return; }
            const a = px * (1 - p);
            document.body.style.transform =
                `translate(${(Math.random() * 2 - 1) * a}px,${(Math.random() * 2 - 1) * a}px) rotate(${(Math.random() * 2 - 1) * a * 0.04}deg)`;
            requestAnimationFrame(f);
        })();
    }
    function blur(px = 6, ms = 1000) {
        const b = document.body;
        b.style.transition = 'filter 0s';
        b.style.filter = `blur(${px}px)`;
        requestAnimationFrame(() => requestAnimationFrame(() => {
            b.style.transition = `filter ${ms}ms ease-out`;
            b.style.filter = 'blur(0px)';
            setTimeout(() => { b.style.filter = ''; b.style.transition = ''; }, ms + 80);
        }));
    }
    function bolts(ms = 1600, rgb = '170,220,255') {
        const c = document.createElement('canvas');
        c.width = window.innerWidth; c.height = window.innerHeight;
        c.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:997;mix-blend-mode:screen;';
        document.body.appendChild(c);
        const g = c.getContext('2d');
        const W = c.width, H = c.height, t0 = performance.now();
        let last = 0;
        function bolt(x0, y0, x1, y1, width) {
            const segs = 10 + Math.floor(Math.random() * 8);
            g.beginPath(); g.moveTo(x0, y0);
            const dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy) || 1;
            const nx = -dy / len, ny = dx / len;
            for (let i = 1; i <= segs; i++) {
                const p = i / segs, j = (Math.random() * 2 - 1) * len * 0.06;
                g.lineTo(x0 + dx * p + nx * j, y0 + dy * p + ny * j);
            }
            g.lineWidth = width; g.strokeStyle = `rgba(${rgb},0.95)`;
            g.shadowColor = `rgba(${rgb},1)`; g.shadowBlur = 16;
            g.stroke();
        }
        (function f(now) {
            const p = (now - t0) / ms;
            if (p >= 1) { c.remove(); return; }
            if (now - last > 45) {
                last = now;
                g.clearRect(0, 0, W, H);
                if (Math.random() < 0.85) {
                    const n = 2 + Math.floor(Math.random() * 4);
                    for (let i = 0; i < n; i++) {
                        const side = Math.floor(Math.random() * 4);
                        let x = 0, y = 0;
                        if (side === 0) { x = Math.random() * W; y = 0; }
                        else if (side === 1) { x = W; y = Math.random() * H; }
                        else if (side === 2) { x = Math.random() * W; y = H; }
                        else { x = 0; y = Math.random() * H; }
                        const tx = W * (0.3 + Math.random() * 0.4), ty = H * (0.3 + Math.random() * 0.4);
                        bolt(x, y, tx, ty, 1 + Math.random() * 2.5);
                        if (Math.random() < 0.5) bolt(tx, ty, tx + (Math.random() - 0.5) * W * 0.4, ty + (Math.random() - 0.5) * H * 0.4, 1);
                    }
                }
                if (Math.random() < 0.25) { g.shadowBlur = 0; g.fillStyle = `rgba(${rgb},${0.08 + Math.random() * 0.2})`; g.fillRect(0, 0, W, H); }
            }
            requestAnimationFrame(f);
        })(t0);
    }

    // ---------------- 低血量：红边脉动 + 心跳 ----------------
    let lowTimer = null, lowEl = null;
    function setLowHp(on) {
        if (on) {
            if (lowTimer) return;
            lowEl = overlay('z-index:5;background:radial-gradient(circle at 50% 50%, transparent 38%, rgba(130,0,0,0.6) 100%);opacity:0.15;transition:opacity 0.2s ease-out;');
            const beat = () => {
                if (!lowEl) return;
                lowEl.style.opacity = '0.95';
                setTimeout(() => { if (lowEl) lowEl.style.opacity = '0.2'; }, 170);
                heartbeat(75, 1, 0.26, { muffled: true });
            };
            beat();
            lowTimer = setInterval(beat, 1500);
        } else {
            if (lowTimer) clearInterval(lowTimer);
            lowTimer = null;
            if (lowEl) { lowEl.remove(); lowEl = null; }
        }
    }

    // ---------------- 组合效果 ----------------
    // 被实弹击中（第一视角）
    function hitImpact(scene, damage = 1) {
        const big = damage >= 2;
        if (scene && scene.shakeCamera) { scene.shakeCamera(big ? 1.5 : 1.15, 1500, 1); scene.kickFov(big ? 15 : 10, 520); }
        flash('#fff', 0.95, 10, 170);
        vignette('170,0,0', 0.92, 160, 1600);
        jitter(300, big ? 22 : 15);
        blur(big ? 10 : 7, 1200);
        thud(1.1, 0, 85);
        ring(2800, 0.07);
        bgmTo(0.07, 120);
        setTimeout(() => bgmTo(0.5, 2600), 1200);
        const beats = heartbeat(130, 6, 0.8, { muffled: true }, 250);
        beats.forEach(ms => setTimeout(() => vignette('150,0,0', 0.5, 60, 260), ms));
        const bs = document.getElementById('blood-splatter');
        if (bs) { bs.style.transition = 'opacity 0.05s'; bs.style.opacity = 1; setTimeout(() => { bs.style.transition = 'opacity 1.6s ease-out'; bs.style.opacity = 0; }, 350); }
    }

    // 电击
    function taser(scene, victimIsMe) {
        if (!victimIsMe) {
            zap(520, 0.7);
            flash('rgb(150,200,255)', 0.35, 20, 260);
            if (scene && scene.shakeCamera) scene.shakeCamera(0.18, 380, 1.8);
            return;
        }
        zap(2000, 1);
        if (scene && scene.shakeCamera) { scene.shakeCamera(0.95, 1900, 1.9); scene.kickFov(6, 600); }
        bolts(1800);
        jitter(1500, 8);
        vignette('40,110,255', 0.9, 1200, 1000);
        for (let i = 0; i < 10; i++) {
            setTimeout(() => flash(i % 2 ? '#d8ebff' : '#4f95ff', 0.3 + Math.random() * 0.45, 12, 100), i * 165 + Math.random() * 60);
        }
        const b = document.body;
        let n = 0;
        const iv = setInterval(() => {
            n++;
            b.style.filter = (n % 2) ? `contrast(1.35) saturate(1.5) hue-rotate(${Math.floor(Math.random() * 40) - 20}deg)` : 'brightness(1.4)';
            if (n >= 16) { clearInterval(iv); b.style.filter = ''; }
        }, 100);
        setTimeout(() => {
            ring(2600, 0.05);
            bgmTo(0.15, 200); setTimeout(() => bgmTo(0.5, 2200), 1800);
            blur(5, 1400);
            heartbeat(105, 5, 0.5, { muffled: true });
        }, 1500);
    }

    // 心脏起搏器救场。victimIsMe=true 为第一视角濒死体验；否则为旁观视角。总时长固定 8000ms。
    function pacemaker(scene, victimIsMe, say, done) {
        const timers = [];
        const T = (ms, fn) => timers.push(setTimeout(fn, ms));
        const sh = (s, d, f) => { if (scene && scene.shakeCamera) scene.shakeCamera(s, d, f || 1); };
        const kick = (v, d) => { if (scene && scene.kickFov) scene.kickFov(v, d); };
        const a = bgm();
        const els = [];
        const keep = (el) => { els.push(el); return el; };

        gunshot(true);
        if (victimIsMe) {
            const blk = keep(overlay('z-index:998;background:#000;opacity:0;transition:opacity 40ms linear;'));
            flash('#fff', 1, 8, 150, 999);
            T(90, () => { blk.style.opacity = '1'; });
            sh(1.7, 1300); jitter(320, 24);
            ring(5200, 0.08); bgmTo(0, 150);
            const pulseRed = () => vignette('190,0,0', 0.55, 70, 300, 999);
            [700, 2000, 3300].forEach((ms, i) => T(ms, () => { heartbeat(60, 1, [0.9, 0.7, 0.45][i], { muffled: true }); pulseRed(); }));
            T(3600, () => defibCharge(1350, 0.2));
            T(3900, () => flatline(1000, 0.08));
            T(5000, () => {
                defibShock(1);
                if (a) a.play('pacemaker');
                flash('#fff', 1, 6, 450, 1000);
                blk.style.transition = 'opacity 300ms ease-out'; blk.style.opacity = '0.82';
                sh(1.9, 1900, 1.2); kick(17, 750); jitter(520, 28);
            });
            T(5350, () => {
                const beats = heartbeat(125, 7, 0.95, { muffled: false });
                beats.forEach(ms => setTimeout(pulseRed, ms));
                gasp();
            });
            T(5600, () => {
                blk.style.transition = 'opacity 2.2s ease-out'; blk.style.opacity = '0';
                const b = document.body;
                b.style.transition = 'filter 0s'; b.style.filter = 'blur(14px)';
                requestAnimationFrame(() => requestAnimationFrame(() => { b.style.transition = 'filter 2.3s ease-out'; b.style.filter = 'blur(0px)'; }));
            });
            T(6200, () => { if (a) a.fadeInBGM(2000); });
        } else {
            const dim = keep(overlay('z-index:990;background:#000;opacity:0;transition:opacity 500ms ease-out;'));
            flash('#fff', 0.7, 8, 160, 999);
            sh(0.75, 950); jitter(180, 8); bgmTo(0.1, 200);
            T(60, () => { dim.style.opacity = '0.55'; });
            [1500, 2800].forEach(ms => T(ms, () => heartbeat(66, 1, 0.3, { muffled: true })));
            T(3600, () => defibCharge(1200, 0.14));
            T(5000, () => {
                defibShock(0.75);
                if (a) a.play('pacemaker');
                flash('#cfe6ff', 0.55, 8, 380, 999);
                bolts(500);
                sh(0.85, 1100, 1.4); kick(8, 500);
                dim.style.transition = 'opacity 1.6s ease-out'; dim.style.opacity = '0';
                if (say) say('心脏起搏器启动，对方活了过来');
            });
            T(5800, () => bgmTo(0.5, 2000));
        }
        T(8000, () => {
            timers.forEach(clearTimeout);
            els.forEach(e => e.remove());
            document.body.style.filter = '';
            document.body.style.transition = '';
            if (done) done();
        });
    }

    return { ensure, gunshot, thud, ring, heartbeat, zap, defibCharge, defibShock, flatline, gasp, bgmTo,
             flash, vignette, jitter, blur, bolts, setLowHp, hitImpact, taser, pacemaker };
})();
