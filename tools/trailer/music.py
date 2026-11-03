"""The music of the trailer, made here from numbers (numpy): no sample and no song of anybody else, so no licence is needed.

It is written for the cuts of the film (edit.cues): BPM and the beats of tools/trailer/shots.py, the chords Am – F – C – G, one a
bar. How full it is follows the part of the film (shots.PART: 0 only the soft chords … 3 everything):
  the chords (a pad: saw waves, three slightly out of tune, brighter when more happens), a plucked arpeggio in sixteenths with an
  echo left and right, the bass, a kick on every beat (it ducks the pad and the bass a little: the "pumping"), a clap on 2 and 4,
  hi-hats; a rising noise before a part with more energy and a deep hit when it begins; a soft whoosh at every cut.
Everything goes through one reverb (a room of 2.4 s), is pressed a little (tanh) and ends with the film.

  python3 tools/trailer/music.py /tmp/music.wav         the music for the film as it is now (shots.ORDER), to listen to it alone
"""
import math
import sys
import wave
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))

import shots as S  # noqa: E402

SR = 44100
CHORDS = [  # (the pad's four notes, the bass), MIDI numbers: Am, F, C/G, G
    ([57, 60, 64, 69], 33),
    ([53, 60, 65, 69], 29),
    ([55, 60, 64, 67], 36),
    ([55, 59, 62, 67], 31),
]
ARP = [0, 1, 2, 3, 2, 1, 2, 3, 0, 1, 2, 3, 3, 2, 1, 2]        # which note of the chord each sixteenth of a bar plays (an octave up)


def hz(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def table(harm, power=1.0, odd=False):
    """one wave cycle (2048 points) with these harmonics: 1/k^power (a saw at power 1, softer with more)"""
    x = np.arange(2048) / 2048
    w = np.zeros(2048)
    for k in range(1, harm + 1):
        if odd and k % 2 == 0:
            continue
        w += np.sin(2 * np.pi * k * x) / k ** power
    return w / np.abs(w).max()


T_DARK, T_BRIGHT, T_PLUCK = table(4, 1.3), table(14, 1.0), table(7, 1.8, odd=False)


def osc(freq, tab, phase=0.0):
    """read the wave table at the frequency (a number or one per sample)"""
    ph = (np.cumsum(np.broadcast_to(freq, freq.shape) / SR) + phase) % 1.0
    i = ph * 2048
    i0 = i.astype(np.int64)
    f = i - i0
    return tab[i0 % 2048] * (1 - f) + tab[(i0 + 1) % 2048] * f


def smooth(x, n):
    """a soft edge: the moving mean over n samples"""
    if n < 2:
        return x
    c = np.cumsum(np.pad(np.asarray(x, float), (n // 2 + 1, n - n // 2 - 1), mode="edge"))
    return (c[n:] - c[:-n]) / n


def fft_filter(x, lo=None, hi=None):
    """keep only the frequencies between lo and hi (soft edges); x mono or (n, 2)"""
    n = x.shape[0]
    f = np.fft.rfftfreq(n, 1 / SR)
    g = np.ones_like(f)
    if lo:
        g *= 1 / (1 + (lo / np.maximum(f, 1)) ** 4)
    if hi:
        g *= 1 / (1 + (f / hi) ** 4)
    X = np.fft.rfft(x, axis=0)
    return np.fft.irfft(X * (g[:, None] if x.ndim == 2 else g), n=n, axis=0)


def add(buf, at, sig, gain=1.0, pan=0.0):
    """mix sig (mono) into buf (n, 2) from second `at`; pan -1 left … 1 right"""
    i = int(round(at * SR))
    if i >= buf.shape[0] or i + len(sig) <= 0:
        return
    if i < 0:
        sig, i = sig[-i:], 0
    sig = sig[: buf.shape[0] - i]
    l, r = math.cos((pan + 1) * math.pi / 4), math.sin((pan + 1) * math.pi / 4)
    buf[i:i + len(sig), 0] += sig * gain * l * 1.414
    buf[i:i + len(sig), 1] += sig * gain * r * 1.414


def reverb(x, seconds=2.4, seed=3):
    """a room: the sound folded with a slowly dying, darkening noise (different left and right)"""
    rng = np.random.default_rng(seed)
    n = int(seconds * SR)
    t = np.arange(n) / SR
    out = np.zeros((x.shape[0] + n, 2))
    for ch in range(2):
        ir = rng.standard_normal(n) * np.exp(-t * 6.9 / seconds)
        ir = fft_filter(ir, lo=180, hi=5200) * np.minimum(1, t / 0.012)
        ir /= np.sqrt((ir ** 2).sum())
        m = 1 << int(np.ceil(np.log2(x.shape[0] + n)))
        out[:, ch] = np.fft.irfft(np.fft.rfft(x[:, ch], m) * np.fft.rfft(ir, m), m)[: x.shape[0] + n]
    return out[: x.shape[0]]


# ---------- the drums and the effects ----------

def kick():
    t = np.arange(int(0.42 * SR)) / SR
    f = 52 + 120 * np.exp(-t / 0.028)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.2)
    s += 0.5 * np.tanh(3 * s)
    click = np.random.default_rng(1).standard_normal(len(t)) * np.exp(-t / 0.0025) * 0.25
    return np.tanh((s + click) * 1.2) * 0.9


def clap():
    rng = np.random.default_rng(2)
    t = np.arange(int(0.35 * SR)) / SR
    env = np.zeros_like(t)
    for d in (0.0, 0.011, 0.022):
        env += (t >= d) * np.exp(-np.maximum(0, t - d) / (0.012 if d < 0.02 else 0.13))
    return fft_filter(rng.standard_normal(len(t)) * env, lo=900, hi=4200) * 0.9


def hat(open_=False):
    rng = np.random.default_rng(4 if open_ else 5)
    t = np.arange(int((0.25 if open_ else 0.08) * SR)) / SR
    return fft_filter(rng.standard_normal(len(t)), lo=7000) * np.exp(-t / (0.09 if open_ else 0.022)) * 0.5


def impact():
    """a deep hit and a wash of noise: a new part begins"""
    t = np.arange(int(2.6 * SR)) / SR
    boom = np.sin(2 * np.pi * np.cumsum(38 + 60 * np.exp(-t / 0.08)) / SR) * np.exp(-t / 0.9)
    wash = fft_filter(np.random.default_rng(6).standard_normal(len(t)), lo=2500, hi=11000) * np.exp(-t / 0.7) * 0.35
    return np.tanh(boom * 1.4) * 0.9 + wash


def riser(seconds):
    """noise that grows and gets brighter, and a rising tone, until the next part"""
    n = int(seconds * SR)
    t = np.arange(n) / SR
    u = t / seconds
    rng = np.random.default_rng(7)
    noise = rng.standard_normal(n)
    dark, bright = fft_filter(noise, lo=200, hi=1400), fft_filter(noise, lo=1500, hi=9000)
    s = (dark * (1 - u) + bright * u) * u ** 2.2 * 0.55
    tone = np.sin(2 * np.pi * np.cumsum(220 * 2 ** (2.5 * u)) / SR) * u ** 3 * 0.08
    return s + tone


def whoosh():
    n = int(0.55 * SR)
    t = np.arange(n) / SR
    env = np.sin(np.pi * t / t[-1]) ** 2
    return fft_filter(np.random.default_rng(8).standard_normal(n), lo=600, hi=3500) * env * 0.5


# ---------- the whole piece ----------

def energy_at(cues, t):
    for c in cues:
        if c["t0"] <= t < c["t1"]:
            return S.PART[c["part"]]
    return S.PART[cues[-1]["part"]] if t >= cues[-1]["t1"] else 0


def render(cues, end):
    """the music (n, 2) for the film from its cues (edit.cues), `end` seconds long"""
    beat = S.BEAT
    bar = 4 * beat
    total = cues[-1]["t1"]
    n = int(end * SR)
    t = np.arange(n) / SR
    beats = int(math.ceil(end / beat))
    E = np.array([energy_at(cues, b * beat) for b in range(beats + 1)])
    e_s = smooth(np.repeat(E, int(beat * SR))[:n].astype(float), int(0.6 * SR)) if n else np.zeros(0)
    e_s = np.pad(e_s, (0, max(0, n - len(e_s))), mode="edge")[:n]
    ended = t >= total - 2 * beat                             # the last two beats: only the chord rings on
    dry = np.zeros((n, 2))
    wet = np.zeros((n, 2))                                    # what goes into the reverb

    # the kicks first: they duck the pad and the bass
    duck = np.ones(n)
    k = kick()
    for b in range(beats):
        tb = b * beat
        if tb >= total - 2 * beat or E[b] < 2:
            continue
        add(dry, tb, k, 0.45)
        i = int(tb * SR)
        m = min(n - i, int(0.45 * SR))
        duck[i:i + m] = np.minimum(duck[i:i + m], 1 - 0.55 * np.exp(-np.arange(m) / SR / 0.13))
    duck = smooth(duck, 64)

    # the pad: four voices, each three saws slightly out of tune, the chord of the bar
    bar_i = (t // bar).astype(int) % len(CHORDS)
    bright = np.clip(0.25 + 0.22 * e_s, 0, 1)
    pad = np.zeros((n, 2))
    for v in range(4):
        f = np.array([hz(CHORDS[i][0][v]) for i in range(len(CHORDS))])[bar_i]
        f = smooth(f, int(0.035 * SR))
        for j, (cents, pan) in enumerate(((0, 0.0), (-9, -0.7), (8, 0.7))):
            ff = f * 2 ** (cents / 1200)
            s = osc(ff, T_DARK, 0.13 * v + 0.31 * j) * (1 - bright) + osc(ff, T_BRIGHT, 0.17 * v + 0.29 * j) * bright
            l, r = math.cos((pan + 1) * math.pi / 4), math.sin((pan + 1) * math.pi / 4)
            pad[:, 0] += s * l
            pad[:, 1] += s * r
    swell = 0.55 + 0.45 * np.clip(t / 2.5, 0, 1)
    pad *= (0.1 * swell * (1.0 - 0.05 * e_s) * duck)[:, None]
    pad = fft_filter(pad, lo=140, hi=9000)
    dry += pad * 0.8
    wet += pad * 0.6

    # the arpeggio: plucked sixteenths an octave up, an echo left and right (3/16)
    arp = np.zeros((n, 2))
    pl_t = np.arange(int(0.45 * SR)) / SR
    pl_env = np.exp(-pl_t / 0.13) * np.minimum(1, pl_t / 0.003)
    six = beat / 4
    for s16 in range(int(total / six)):
        ts = s16 * six
        e = E[min(len(E) - 1, int(ts / beat))]
        if ts >= total - 2 * beat or (e == 0 and ts < cues[0]["t1"] * 0.5):
            continue
        ch = CHORDS[int(ts // bar) % len(CHORDS)][0]
        note = ch[ARP[s16 % 16]] + 12
        f = hz(note)
        sig = osc(np.full(len(pl_t), f), T_PLUCK) * pl_env
        g = (0.15 if s16 % 4 == 0 else 0.11) * (0.6 if e == 0 else 1.0)
        add(arp, ts, sig, g, pan=0.25 * math.sin(s16 * 0.7))
    d = int(3 * six * SR)
    echo = np.zeros_like(arp)
    echo[d:, 0] = arp[:-d, 1] * 0.42 + arp[:-d, 0] * 0.05
    echo[2 * d:, 1] = arp[:-2 * d, 0] * 0.3
    arp = fft_filter(arp + echo, lo=250, hi=9500)
    dry += arp
    wet += arp * 0.5

    # the bass: sustained, quarters or pumping eighths with the energy
    bass = np.zeros(n)
    bt = np.arange(int(4.2 * SR)) / SR
    for b in range(beats * 2):
        tb = b * beat / 2
        if tb >= total - 2 * beat:
            break
        e = E[min(len(E) - 1, int(tb / beat))]
        root = hz(CHORDS[int(tb // bar) % len(CHORDS)][1] + 12)
        if e == 0:
            continue
        if e == 1 and b % 8:
            continue
        if e == 2 and b % 2:
            continue
        ln = {1: 2 * bar - 0.05, 2: beat - 0.04, 3: beat / 2 - 0.03}[e] if e < 3 else beat / 2 - 0.03
        m = int(ln * SR)
        x = bt[:m]
        env = np.minimum(1, x / 0.008) * np.minimum(1, (ln - x) / 0.03) * (np.exp(-x / 0.9) if e == 1 else 1)
        ph = 2 * np.pi * root * x
        sig = np.tanh(1.6 * (np.sin(ph) + 0.45 * np.sin(2 * ph) + 0.2 * np.sin(3 * ph))) * env
        i = int(tb * SR)
        mm = min(m, n - i)
        bass[i:i + mm] += sig[:mm] * (0.2 if e == 1 else 0.22)
    bass *= duck
    dry += bass[:, None] * 0.9

    # claps and hi-hats
    c, h, ho = clap(), hat(), hat(True)
    for b in range(beats):
        tb = b * beat
        if tb >= total - 2 * beat:
            break
        e = E[b]
        if e >= 3 and b % 2 == 1:
            add(dry, tb, c, 0.4)
            add(wet, tb, c, 0.25)
        if e >= 2:
            add(dry, tb + beat / 2, ho, 0.28, pan=0.2)
        if e >= 3:
            for q in (1, 3):
                add(dry, tb + q * beat / 4, h, 0.2, pan=-0.3)
        if e == 1 and b % 2 == 1:
            add(dry, tb + beat / 2, h, 0.06, pan=0.3)

    # risers before a part with more energy, a hit when it begins, a whoosh at every soft cut
    imp, wh = impact(), whoosh()
    prev = None
    for i_c, cu in enumerate(cues):
        e = S.PART[cu["part"]]
        if prev is not None and e > prev:
            ln = min(2 * bar if e - prev >= 2 else bar, cu["t0"])
            add(dry, cu["t0"] - ln, riser(ln), 0.55)
            add(dry, cu["t0"], imp, 0.75)
            add(wet, cu["t0"], imp, 0.3)
        elif prev is not None and e < prev and cu["id"] != "outro":     # the end has its own hit, with the logo
            add(dry, cu["t0"], imp, 0.4)
            add(wet, cu["t0"], imp, 0.35)
        if i_c and not cu["hard"]:
            add(dry, cu["t0"] - 0.3, wh, 0.12, pan=-0.4)
            add(wet, cu["t0"] - 0.3, wh, 0.08)
        prev = e
    for cu in cues:                                             # a moment of a shot on a beat (the walls turn to glass): a swell and a soft hit
        if cu.get("accent"):
            add(dry, cu["accent"] - 1.0, riser(1.0), 0.3)
            add(dry, cu["accent"], imp, 0.45)
            add(wet, cu["accent"], imp, 0.4)
    out_c = next((cu for cu in cues if cu["id"] == "outro"), None)
    if out_c:                                                   # the logo of the end
        add(dry, out_c["t0"] + 0.5, imp, 0.6)
        add(wet, out_c["t0"] + 0.5, imp, 0.45)

    mix = dry + reverb(wet) * 0.55
    mix *= np.where(ended, 0.85, 1.0)[:, None]
    return master(mix, end)


def master(x, end):
    """loud enough for a phone, never clipping: level, a soft press, fade in and out"""
    x = x - x.mean(axis=0)
    f = np.fft.rfftfreq(x.shape[0], 1 / SR)            # the tone: less deep rumble, a little more air (phones and laptops)
    g = 1 / (1 + (32 / np.maximum(f, 1)) ** 4)          # nothing under 32 Hz
    g *= 0.6 + 0.4 * f ** 2 / (f ** 2 + 90 ** 2)        # the deep end 4 dB quieter
    g *= 1 + 0.45 * f ** 2 / (f ** 2 + 6000 ** 2)       # the top 3 dB louder
    x = np.fft.irfft(np.fft.rfft(x, axis=0) * g[:, None], n=x.shape[0], axis=0)
    rms = np.sqrt((x ** 2).mean()) or 1
    x *= 10 ** (-16 / 20) / rms
    x = np.tanh(x * 1.1) / np.tanh(1.1)
    x *= 10 ** (-1 / 20) / max(1e-9, np.abs(x).max())
    n = x.shape[0]
    t = np.arange(n) / SR
    x *= np.clip(t / 0.05, 0, 1)[:, None]
    x *= np.clip((end - t) / 1.2, 0, 1)[:, None]
    return x


def write(cues, end, path):
    x = render(cues, end)
    pcm = (np.clip(x, -1, 1) * 32767).astype("<i2")
    with wave.open(str(path), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())
    return x


def plan_cues():
    """the cues of the film as shots.py has it (every shot there), without filming anything"""
    out, t = [], 0.0
    for sid in S.ORDER:
        sh = S.SHOTS[sid]
        out.append({"t0": t, "t1": t + sh.seconds, "part": sh.part, "hard": bool(sh.keep), "id": sid, "accent": t + sh.beat if sh.beat is not None else None})
        t += sh.seconds
    return out


if __name__ == "__main__":
    c = plan_cues()
    write(c, c[-1]["t1"] + 1.6, sys.argv[1] if len(sys.argv) > 1 else "/tmp/trailer-music.wav")
