"""
An upbeat, warm indie-pop bed for the TimeLyn explainer.

100 bpm, D major. Electric piano chords (Dmaj9, A/C#, Bm7, Gmaj7), a round
bass, a light drum groove, a simple whistle-like melody, and a room reverb.
The arrangement follows the video: soft intro, the groove arrives when the
timeline draws (5.5s), the melody joins when the family arrives (17s), a
lighter breakdown for the finished story (29.5s), and a full last bar that
rings out over the end card (36s).
"""
import numpy as np
import wave
from scipy.signal import lfilter, butter

SR = 44100
BPM = 100
BEAT = 60 / BPM
BAR = 4 * BEAT
DUR = 41.0
N = int(SR * DUR)
rng = np.random.default_rng(3)

def hz(m):
    return 440.0 * 2 ** ((m - 69) / 12)

def env_adsr(n, a, d, s, r, hold):
    t = np.arange(n) / SR
    e = np.where(t < a, t / a, 0.0)
    dec = (t >= a) & (t < a + d)
    e[dec] = 1 - (1 - s) * (t[dec] - a) / d
    sus = (t >= a + d) & (t < hold)
    e[sus] = s
    rel = t >= hold
    e[rel] = s * np.exp(-(t[rel] - hold) / r)
    return e

def add(buf, start, sig, gain=1.0):
    i = int(start * SR)
    if i >= len(buf):
        return
    j = min(len(buf), i + len(sig))
    buf[i:j] += sig[: j - i] * gain

def lowpass(x, cutoff, order=2):
    b, a = butter(order, cutoff / (SR / 2), "low")
    return lfilter(b, a, x)

def highpass(x, cutoff, order=2):
    b, a = butter(order, cutoff / (SR / 2), "high")
    return lfilter(b, a, x)

# ------------------------------------------------------------ instruments
def epiano(freq, length):
    """FM electric piano: bell-ish attack that mellows, with gentle tremolo."""
    n = int((length + 1.2) * SR)
    t = np.arange(n) / SR
    index = 2.4 * np.exp(-t / 0.3) + 0.45
    mod = np.sin(2 * np.pi * freq * t)
    car = np.sin(2 * np.pi * freq * t + index * mod)
    car += 0.22 * np.sin(2 * np.pi * 2 * freq * t) * np.exp(-t / 0.5) + 0.08 * np.sin(2 * np.pi * 3 * freq * t) * np.exp(-t / 0.25)
    env = env_adsr(n, 0.004, 0.9, 0.35, 0.45, length)
    trem = 1 + 0.07 * np.sin(2 * np.pi * 4.5 * t)
    return car * env * trem

def bass(freq, length):
    n = int((length + 0.25) * SR)
    t = np.arange(n) / SR
    x = np.sin(2 * np.pi * freq * t) + 0.25 * np.sin(2 * np.pi * 2 * freq * t)
    x = np.tanh(1.6 * x) / np.tanh(1.6)
    return x * env_adsr(n, 0.006, 0.18, 0.7, 0.08, length)

def lead(freq, length):
    """Soft whistle/flute: sine with slow vibrato and a breathy edge."""
    n = int((length + 0.35) * SR)
    t = np.arange(n) / SR
    vib = 1 + 0.006 * np.sin(2 * np.pi * 5.2 * t) * np.minimum(1, t / 0.25)
    phase = 2 * np.pi * freq * np.cumsum(vib) / SR
    x = np.sin(phase) + 0.15 * np.sin(2 * phase) + 0.06 * np.sin(3 * phase)
    breath = highpass(rng.normal(0, 1, n), 3000) * 0.04
    return (x + breath) * env_adsr(n, 0.04, 0.2, 0.8, 0.12, length)

def kick():
    n = int(0.45 * SR)
    t = np.arange(n) / SR
    f = 48 + 110 * np.exp(-t / 0.035)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.16)
    click = rng.normal(0, 1, n) * np.exp(-t / 0.003) * 0.2
    return x + click

def snare():
    n = int(0.3 * SR)
    t = np.arange(n) / SR
    noise = highpass(rng.normal(0, 1, n), 1500) * np.exp(-t / 0.09)
    tone = np.sin(2 * np.pi * 190 * t) * np.exp(-t / 0.05)
    return 0.55 * noise + 0.45 * tone

def hat(open_=False):
    n = int((0.25 if open_ else 0.07) * SR)
    t = np.arange(n) / SR
    x = highpass(rng.normal(0, 1, n), 7500, 3)
    return x * np.exp(-t / (0.08 if open_ else 0.018))

def shaker():
    n = int(0.09 * SR)
    t = np.arange(n) / SR
    x = highpass(rng.normal(0, 1, n), 5000)
    return x * np.sin(np.pi * np.minimum(1, t / 0.09)) ** 2

# ------------------------------------------------------------ the song
# Chords as (bass root, voicing) in MIDI notes.
CHORDS = [
    (38, [54, 57, 61, 64]),  # Dmaj9   (F#, A, C#, E)
    (37, [52, 57, 61, 64]),  # A/C#    (E, A, C#, E)
    (35, [50, 54, 57, 61]),  # Bm7     (D, F#, A, C#)
    (31, [50, 54, 59, 62]),  # Gmaj7(9)(D, F#, B, D)
]
bars = int(np.ceil(DUR / BAR))

pads = np.zeros(N)
bassline = np.zeros(N)
drums = np.zeros(N)
melody = np.zeros(N)

GROOVE_IN = 5.5
MELODY_IN = 17.0
BREAK_AT = 29.5
END_AT = 36.0

for b in range(bars):
    t0 = b * BAR
    if t0 >= DUR:
        break
    root, voicing = CHORDS[b % 4]
    final = t0 >= END_AT - 0.05
    breakdown = BREAK_AT <= t0 < END_AT - 0.05

    # Electric piano: a held chord, plus a syncopated re-strike on "2 and".
    hold = BAR * (2.0 if final else 0.95)
    for k, m in enumerate(voicing):
        add(pads, t0 + k * 0.012, epiano(hz(m), hold), 0.16)
    if not final and t0 >= GROOVE_IN - 0.1:
        for k, m in enumerate(voicing[1:]):
            add(pads, t0 + 1.5 * BEAT + k * 0.01, epiano(hz(m + 12), BEAT * 0.6), 0.07)

    # Bass from the groove onwards: root on 1, a push on "2 and", fifth on 4.
    if t0 >= GROOVE_IN - 0.1:
        if final:
            add(bassline, t0, bass(hz(root), BAR * 1.5), 0.5)
        else:
            add(bassline, t0, bass(hz(root), BEAT * 1.4), 0.5)
            add(bassline, t0 + 1.5 * BEAT, bass(hz(root), BEAT * 0.45), 0.4)
            add(bassline, t0 + 2 * BEAT, bass(hz(root), BEAT * 0.9), 0.45)
            add(bassline, t0 + 3 * BEAT, bass(hz(root + 7), BEAT * 0.8), 0.4)

    # Drums.
    if t0 >= GROOVE_IN - 0.1 and not final:
        for beat in range(4):
            bt = t0 + beat * BEAT
            if not breakdown:
                if beat in (0, 2):
                    add(drums, bt, kick(), 0.9)
                if beat == 2 and b % 2 == 1:
                    add(drums, bt + 0.5 * BEAT, kick(), 0.55)
                if beat in (1, 3):
                    add(drums, bt, snare(), 0.42)
            for half in (0, 1):
                ht = bt + half * 0.5 * BEAT
                if breakdown:
                    add(drums, ht, shaker(), 0.35)
                else:
                    add(drums, ht, hat(open_=(half == 1 and beat == 3)), 0.5 if half else 0.65)
                    add(drums, ht + 0.25 * BEAT, shaker(), 0.18)
    if final:
        add(drums, t0, kick(), 0.8)

# Bell sparkle: chord tones two octaves up on the off-beats, from 11s.
def bell(freq):
    n = int(1.4 * SR)
    t = np.arange(n) / SR
    x = np.sin(2 * np.pi * freq * t) * np.exp(-t / 0.6) + 0.4 * np.sin(2 * np.pi * freq * 2.76 * t) * np.exp(-t / 0.18)
    return x * np.minimum(1, t / 0.002)

sparkle = np.zeros(N)
for b in range(bars):
    t0 = b * BAR
    if t0 < 11.0 or t0 >= END_AT - 0.05:
        continue
    _, voicing = CHORDS[b % 4]
    for i, beat in enumerate((0.5, 1.5, 2.5, 3.5)):
        add(sparkle, t0 + beat * BEAT, bell(hz(voicing[(i * 2 + b) % 4] + 24)), 0.11)

# Melody: a hopeful four-bar phrase in D major pentatonic, played twice.
PHRASE = [  # (beat offset within 4 bars, midi, length in beats)
    (0, 74, 1.5), (1.5, 76, 0.5), (2, 78, 1), (3, 76, 1),
    (4, 73, 1.5), (5.5, 74, 0.5), (6, 76, 2),
    (8, 74, 1), (9, 71, 1), (10, 73, 1), (11, 74, 1),
    (12, 74, 0.5), (12.5, 76, 0.5), (13, 78, 1.5), (14.5, 81, 1.5),
]
phrase_start = int(np.ceil(MELODY_IN / BAR)) * BAR
for rep in range(2):
    base = phrase_start + rep * 4 * BAR
    if base >= BREAK_AT:
        break
    for off, m, ln in PHRASE:
        st = base + off * BEAT
        if st < BREAK_AT:
            add(melody, st, lead(hz(m), ln * BEAT * 0.92), 0.2)
# A last, high note over the end card.
add(melody, END_AT, lead(hz(81), BAR * 1.2), 0.18)

# ------------------------------------------------------------ mix
def reverb(x, wet=0.25):
    out = np.zeros_like(x)
    for d, g in ((1557, 0.80), (1617, 0.79), (1491, 0.81), (1422, 0.78)):
        a = np.zeros(d + 1); a[0] = 1; a[d] = -g
        out += lfilter([1], a, x)
    out /= 4
    for d, g in ((225, 0.5), (556, 0.5)):
        b = np.zeros(d + 1); b[0] = -g; b[d] = 1
        a = np.zeros(d + 1); a[0] = 1; a[d] = -g
        out = lfilter(b, a, out)
    out = lowpass(out, 5000)
    return x * (1 - wet) + out * wet

# Duck the piano under each kick for a gentle pump.
t = np.arange(N) / SR
pump = np.ones(N)
for b in range(bars):
    for beat in (0, 2):
        k0 = b * BAR + beat * BEAT
        if GROOVE_IN - 0.1 <= k0 < BREAK_AT:
            m = (t >= k0) & (t < k0 + 0.3)
            pump[m] = 0.72 + 0.28 * ((t[m] - k0) / 0.3)

pads = np.tanh(pads * 2.2) / 2.2
pads = lowpass(pads, 9000) * pump
mix = (
    reverb(pads, 0.3) * 2.4
    + lowpass(bassline, 900) * 0.55
    + reverb(highpass(drums, 45), 0.12) * 0.7
    + reverb(melody, 0.35) * 2.2
    + reverb(sparkle, 0.45) * 1.6
)
mix = highpass(mix, 30)
# presence: lift 2-6 kHz a little so it carries on phone speakers
b_, a_ = butter(2, [2000 / (SR / 2), 6000 / (SR / 2)], 'band')
mix = mix + 1.2 * lfilter(b_, a_, mix)

fade = np.minimum(1, t / 1.2) * np.clip((DUR - t) / 2.0, 0, 1)
mix *= fade
mix = np.tanh(mix * 1.4) / np.tanh(1.4)
mix = mix / np.max(np.abs(mix)) * 0.8

# A touch of stereo width: drums and piano slightly offset.
left = mix
right = np.roll(mix, 180) * 0.97 + mix * 0.03
pcm = (np.stack([left, right], axis=1) * 32767).astype(np.int16)
with wave.open("music.wav", "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(pcm.tobytes())
print("ok", round(DUR, 1), "s")
