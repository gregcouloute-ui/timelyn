"""
Generates the demonstration photographs and sound used in TimeLyn's local
demo mode.

TimeLyn deliberately avoids stock photography. These images are procedurally
generated, soft-focus "plates" — landscapes, interiors and light — toned to
suggest the decade they belong to (gelatin silver for the 1950s, faded
colour for the 1970s and 80s, cleaner colour for recent years). They are
clearly demo media and are replaced by real family photographs in use.

Run:  python3 scripts/generate-demo-media.py
"""

from __future__ import annotations

import math
import os
import wave

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

OUT = os.path.join(os.path.dirname(__file__), "..", "public", "demo")
os.makedirs(OUT, exist_ok=True)

W, H = 1600, 1067


def rng(seed: int) -> np.random.Generator:
    return np.random.default_rng(seed)


def smooth_noise_1d(r: np.random.Generator, n: int, octaves: int = 4, scale: float = 1.0) -> np.ndarray:
    out = np.zeros(n)
    for o in range(octaves):
        pts = 4 * (2**o) + 1
        ctrl = r.uniform(-1, 1, pts) / (2**o)
        xs = np.linspace(0, pts - 1, n)
        out += np.interp(xs, np.arange(pts), ctrl)
    return out * scale


def vertical_gradient(w: int, h: int, stops: list[tuple[float, tuple[int, int, int]]]) -> np.ndarray:
    ys = np.linspace(0, 1, h)
    img = np.zeros((h, w, 3), dtype=np.float32)
    pos = [s[0] for s in stops]
    for c in range(3):
        col = np.interp(ys, pos, [s[1][c] for s in stops])
        img[:, :, c] = col[:, None]
    return img


def to_img(a: np.ndarray) -> Image.Image:
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))


def to_arr(img: Image.Image) -> np.ndarray:
    return np.asarray(img).astype(np.float32)


def bokeh(img: Image.Image, r: np.random.Generator, count: int, colours: list[tuple[int, int, int]],
          size: tuple[int, int], region: tuple[float, float, float, float] = (0, 0, 1, 1),
          alpha: tuple[int, int] = (40, 120), blur: float = 6) -> Image.Image:
    layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    w, h = img.size
    for _ in range(count):
        cx = r.uniform(region[0], region[2]) * w
        cy = r.uniform(region[1], region[3]) * h
        rad = r.uniform(*size)
        c = colours[int(r.integers(0, len(colours)))]
        a = int(r.integers(*alpha))
        d.ellipse([cx - rad, cy - rad, cx + rad, cy + rad], fill=(*c, a))
    layer = layer.filter(ImageFilter.GaussianBlur(blur))
    base = img.convert("RGBA")
    return Image.alpha_composite(base, layer).convert("RGB")


def finish(img: Image.Image, r: np.random.Generator, tone: str, soften: float = 1.4,
           grain: float = 9.0, vignette: float = 0.45) -> Image.Image:
    img = img.filter(ImageFilter.GaussianBlur(soften))
    a = to_arr(img)
    h, w, _ = a.shape

    # Vignette
    yy, xx = np.mgrid[0:h, 0:w]
    d = np.sqrt(((xx - w / 2) / (w / 2)) ** 2 + ((yy - h / 2) / (h / 2)) ** 2)
    v = 1 - vignette * np.clip(d - 0.35, 0, 1) ** 1.6
    a *= v[:, :, None]

    lum = a @ np.array([0.299, 0.587, 0.114], dtype=np.float32)

    if tone == "silver":
        # Gelatin silver print with a faint selenium warmth
        base = np.stack([lum * 1.02, lum * 0.99, lum * 0.94], axis=-1)
        a = base * 0.94 + 10
    elif tone == "sepia":
        a = np.stack([lum * 1.07 + 14, lum * 0.95 + 8, lum * 0.78], axis=-1)
    elif tone == "faded70s":
        mix = 0.62
        a = a * mix + lum[:, :, None] * (1 - mix)
        a[:, :, 0] = a[:, :, 0] * 1.04 + 10
        a[:, :, 1] = a[:, :, 1] * 0.98 + 6
        a[:, :, 2] = a[:, :, 2] * 0.86 + 14
        a = a * 0.88 + 22  # lifted blacks
    elif tone == "faded80s":
        mix = 0.78
        a = a * mix + lum[:, :, None] * (1 - mix)
        a[:, :, 0] = a[:, :, 0] * 1.02 + 6
        a[:, :, 2] = a[:, :, 2] * 0.94 + 10
        a = a * 0.92 + 14
    elif tone == "modern":
        mix = 0.9
        a = a * mix + lum[:, :, None] * (1 - mix)

    noise = r.normal(0, grain, (h, w))
    if tone in ("silver", "sepia"):
        a += noise[:, :, None]
    else:
        a += np.stack([noise, r.normal(0, grain * 0.6, (h, w)), noise * 0.8], axis=-1)
    return to_img(a)


def save(img: Image.Image, name: str, quality: int = 80) -> None:
    path = os.path.join(OUT, name)
    img.save(path, "JPEG", quality=quality, optimize=True, progressive=True)
    print("wrote", path, img.size)


# ---------------------------------------------------------------- scenes

def seascape(seed: int, sky: list, sea: tuple, horizon: float, cliff: bool, sun: bool, tone: str,
             name: str, w: int = W, h: int = H) -> None:
    r = rng(seed)
    a = vertical_gradient(w, h, sky)
    hy = int(h * horizon)
    sea_grad = vertical_gradient(w, h - hy, [(0, sea), (1, tuple(int(c * 0.6) for c in sea))])
    streaks = r.normal(0, 1, (h - hy, 1)) * 10 + r.normal(0, 4, (h - hy, w))
    a[hy:] = sea_grad + streaks[:, :, None] * 0.6
    img = to_img(a)
    d = ImageDraw.Draw(img)
    if sun:
        sx, sy = w * 0.68, h * (horizon - 0.12)
        for rad, alpha in ((180, 0.08), (90, 0.18), (34, 0.9)):
            glow = Image.new("L", img.size, 0)
            ImageDraw.Draw(glow).ellipse([sx - rad, sy - rad, sx + rad, sy + rad], fill=int(255 * alpha))
            glow = glow.filter(ImageFilter.GaussianBlur(rad * 0.5))
            img = Image.composite(Image.new("RGB", img.size, (255, 236, 200)), img, glow)
        # glitter path on water
        glitter = Image.new("L", img.size, 0)
        gd = ImageDraw.Draw(glitter)
        for _ in range(900):
            x = sx + r.normal(0, 40 + 0) * (1 + r.uniform(0, 1.5))
            y = r.uniform(hy + 4, h)
            gd.line([x, y, x + r.uniform(4, 22), y], fill=int(r.uniform(60, 200)), width=1)
        glitter = glitter.filter(ImageFilter.GaussianBlur(1.2))
        img = Image.composite(Image.new("RGB", img.size, (255, 240, 214)), img, glitter)
        d = ImageDraw.Draw(img)
    if cliff:
        prof = smooth_noise_1d(r, w, 5, 0.035)
        cliff_col = tuple(int(c * 0.35) for c in sea)
        edge = 0.44
        top = []
        for x in range(int(w * edge) + 1):
            t = x / w
            rise = min(1.0, (edge - t) / 0.06)  # steep seaward face
            y = horizon - (0.2 + prof[x]) * max(0.0, rise)
            top.append((x, int(h * y)))
        d.polygon(top + [(int(w * edge), hy + 2), (0, hy + 2)], fill=cliff_col)
        # a few cottages on the headland, catching light
        for i in range(7):
            cx = int(w * (0.05 + i * 0.045 + r.uniform(-0.01, 0.01)))
            cy = top[min(cx, len(top) - 1)][1] + 6
            d.rectangle([cx, cy, cx + 26, cy + 18], fill=tuple(min(255, int(c * 0.7)) for c in sky[1][1]))
            d.polygon([(cx - 3, cy), (cx + 13, cy - 11), (cx + 29, cy)], fill=tuple(int(c * 0.25) for c in sea))
    img = finish(img, r, tone)
    save(img, name)


def window_light(seed: int, tone: str, name: str, warm: tuple, w: int = W, h: int = H) -> None:
    r = rng(seed)
    a = vertical_gradient(w, h, [(0, (40, 38, 34)), (1, (22, 21, 20))])
    img = to_img(a)
    light = Image.new("L", img.size, 0)
    ld = ImageDraw.Draw(light)
    x0, y0, x1, y1 = int(w * 0.52), int(h * 0.12), int(w * 0.86), int(h * 0.7)
    ld.rectangle([x0, y0, x1, y1], fill=255)
    light = light.filter(ImageFilter.GaussianBlur(10))
    img = Image.composite(Image.new("RGB", img.size, warm), img, light)
    d = ImageDraw.Draw(img)
    mull = (30, 28, 26)
    d.rectangle([x0 + (x1 - x0) // 2 - 6, y0, x0 + (x1 - x0) // 2 + 6, y1], fill=mull)
    d.rectangle([x0, y0 + (y1 - y0) // 2 - 6, x1, y0 + (y1 - y0) // 2 + 6], fill=mull)
    # spill of light across a table / floor
    spill = Image.new("L", img.size, 0)
    ImageDraw.Draw(spill).polygon([(x0 - 80, int(h * 0.78)), (x1 + 60, int(h * 0.78)), (int(w * 0.98), h), (int(w * 0.18), h)], fill=110)
    spill = spill.filter(ImageFilter.GaussianBlur(40))
    img = Image.composite(Image.new("RGB", img.size, warm), img, spill)
    # a vase of flowers silhouette on the sill
    d = ImageDraw.Draw(img)
    vx = int(w * 0.62)
    d.ellipse([vx - 30, y1 - 70, vx + 30, y1 + 6], fill=(36, 34, 30))
    img = bokeh(img, r, 22, [(214, 196, 170), (190, 150, 140)], (8, 22), (0.57, 0.38, 0.69, 0.6), (120, 220), 3)
    img = finish(img, r, tone, soften=1.8)
    save(img, name)


def bokeh_scene(seed: int, bg: list, colours: list, tone: str, name: str, count: int = 140,
                size: tuple = (14, 70), stripes: list | None = None, w: int = W, h: int = H) -> None:
    r = rng(seed)
    img = to_img(vertical_gradient(w, h, bg))
    if stripes:
        d = ImageDraw.Draw(img)
        x = 0
        while x < w:
            sw = int(r.integers(18, 46))
            c = stripes[int(r.integers(0, len(stripes)))]
            jitter = r.integers(-14, 14, 3)
            col = tuple(int(np.clip(c[i] + jitter[i], 0, 255)) for i in range(3))
            for row in range(3):
                y0 = int(h * (0.08 + row * 0.3))
                d.rectangle([x, y0 + int(r.integers(0, 30)), x + sw - 3, y0 + int(h * 0.26)], fill=col)
            x += sw
        img = img.filter(ImageFilter.GaussianBlur(9))
    img = bokeh(img, r, count, colours, size, alpha=(40, 150), blur=5)
    img = bokeh(img, r, count // 3, colours, (size[0] * 1.6, size[1] * 1.8), alpha=(20, 70), blur=14)
    img = finish(img, r, tone, soften=1.2)
    save(img, name)


def painterly(seed: int, tone: str, name: str, w: int = W, h: int = H) -> None:
    r = rng(seed)
    img = to_img(vertical_gradient(w, h, [(0, (226, 220, 206)), (1, (208, 200, 186))]))
    layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    palette = [(32, 72, 110), (178, 64, 46), (220, 176, 60), (60, 96, 70), (24, 26, 30), (150, 168, 186)]
    for _ in range(90):
        c = palette[int(r.integers(0, len(palette)))]
        x, y = r.uniform(0, w), r.uniform(0, h)
        ang = r.uniform(-0.6, 0.6) + (math.pi / 2 if r.random() < 0.3 else 0)
        ln = r.uniform(60, 340)
        wd = int(r.uniform(24, 90))
        d.line([x, y, x + math.cos(ang) * ln, y + math.sin(ang) * ln], fill=(*c, int(r.uniform(70, 200))), width=wd)
    layer = layer.filter(ImageFilter.GaussianBlur(9))
    img = Image.alpha_composite(img.convert("RGBA"), layer).convert("RGB")
    img = finish(img, r, tone, soften=0.8, vignette=0.3)
    save(img, name)


def snowfield(seed: int, tone: str, name: str, w: int = W, h: int = H) -> None:
    r = rng(seed)
    a = vertical_gradient(w, h, [(0, (176, 182, 188)), (0.55, (206, 210, 212)), (0.56, (230, 232, 233)), (1, (214, 218, 222))])
    img = to_img(a)
    d = ImageDraw.Draw(img)
    for i in range(16):
        x = r.uniform(0, w)
        depth = r.uniform(0.3, 1)
        top = h * (0.12 + (1 - depth) * 0.3)
        bottom = h * (0.56 + depth * 0.2)
        wd = 6 + depth * 22
        shade = int(120 - depth * 90)
        d.rectangle([x, top, x + wd, bottom], fill=(shade, shade - 4, shade - 8))
        for _ in range(int(6 + depth * 10)):
            by = r.uniform(top, top + (bottom - top) * 0.6)
            ang = r.uniform(-1.2, -0.3) if r.random() < 0.5 else r.uniform(math.pi + 0.3, math.pi + 1.2)
            ln = r.uniform(30, 140) * depth
            d.line([x + wd / 2, by, x + wd / 2 + math.cos(ang) * ln, by + math.sin(ang) * ln], fill=(shade, shade - 4, shade - 8), width=max(1, int(depth * 4)))
    img = bokeh(img, r, 500, [(255, 255, 255)], (1.5, 4.5), alpha=(120, 230), blur=1.2)
    img = finish(img, r, tone, soften=1.0, vignette=0.3)
    save(img, name)


def garden(seed: int, tone: str, name: str, w: int = W, h: int = H) -> None:
    r = rng(seed)
    img = to_img(vertical_gradient(w, h, [(0, (196, 210, 186)), (0.4, (96, 128, 80)), (1, (46, 68, 40))]))
    img = bokeh(img, r, 240, [(70, 110, 56), (120, 150, 80), (40, 70, 36), (160, 180, 110)], (20, 80), alpha=(60, 160), blur=10)
    img = bokeh(img, r, 70, [(236, 196, 206), (250, 240, 236), (214, 120, 140), (240, 210, 120)], (8, 26), (0.05, 0.45, 0.95, 0.95), (140, 230), 4)
    img = finish(img, r, tone, soften=1.0)
    save(img, name)


def street_dusk(seed: int, tone: str, name: str, w: int = W, h: int = H) -> None:
    r = rng(seed)
    img = to_img(vertical_gradient(w, h, [(0, (40, 56, 84)), (0.5, (70, 78, 98)), (1, (24, 26, 34))]))
    d = ImageDraw.Draw(img)
    x = 0
    while x < w:
        bw = int(r.integers(120, 260))
        top = int(h * r.uniform(0.18, 0.42))
        d.rectangle([x, top, x + bw, h], fill=(26, 28, 36))
        for _ in range(int(r.integers(2, 7))):
            wx = x + r.uniform(10, bw - 40)
            wy = r.uniform(top + 20, h * 0.7)
            d.rectangle([wx, wy, wx + 22, wy + 30], fill=(214, 168, 96))
        x += bw + int(r.integers(0, 20))
    img = img.filter(ImageFilter.GaussianBlur(5))
    img = bokeh(img, r, 90, [(255, 196, 120), (255, 230, 190), (220, 90, 70), (180, 200, 255)], (6, 30), (0, 0.45, 1, 0.95), (90, 220), 4)
    img = finish(img, r, tone, soften=1.0)
    save(img, name)


def write_sea_audio(name: str, seconds: int = 22, rate: int = 22050) -> None:
    r = rng(7)
    n = seconds * rate
    white = r.normal(0, 1, n)
    brown = np.cumsum(white)
    brown -= np.convolve(brown, np.ones(2000) / 2000, mode="same")
    brown /= np.max(np.abs(brown)) + 1e-9
    t = np.arange(n) / rate
    swell = 0.35 + 0.65 * (0.5 + 0.5 * np.sin(2 * np.pi * t / 7.5 - 1.2)) ** 2.2
    hiss = r.normal(0, 1, n)
    hiss = np.convolve(hiss, np.ones(6) / 6, mode="same")
    sig = 0.7 * brown * swell + 0.12 * hiss * swell**3
    fade = np.minimum(1, np.minimum(t / 2.0, (seconds - t) / 2.0))
    sig *= fade
    sig = sig / (np.max(np.abs(sig)) + 1e-9) * 0.6
    pcm = (sig * 32767).astype(np.int16)
    path = os.path.join(OUT, name)
    with wave.open(path, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(rate)
        wf.writeframes(pcm.tobytes())
    print("wrote", path)


if __name__ == "__main__":
    seascape(11, [(0, (190, 196, 200)), (0.55, (222, 224, 222)), (1, (200, 204, 204))], (110, 120, 124), 0.58, True, False, "silver", "whitby-harbour-1956.jpg")
    seascape(12, [(0, (200, 204, 204)), (0.6, (230, 230, 226)), (1, (210, 210, 206))], (150, 156, 158), 0.5, False, True, "silver", "sandsend-1959.jpg")
    window_light(21, "silver", "classroom-window-1962.jpg", (236, 232, 222))
    street_dusk(31, "faded70s", "leeds-evening-1968.jpg")
    painterly(41, "faded70s", "art-school-canvas-1970.jpg")
    bokeh_scene(51, [(0, (226, 220, 206)), (1, (176, 160, 136))], [(255, 246, 226), (240, 214, 160), (255, 255, 255)], "faded70s", "wedding-1974.jpg", count=160)
    window_light(61, "faded70s", "clarendon-road-1975.jpg", (244, 222, 180))
    seascape(71, [(0, (120, 170, 210)), (0.55, (196, 220, 232)), (1, (210, 224, 230))], (60, 110, 140), 0.55, False, False, "faded80s", "filey-caravan-1983.jpg")
    snowfield(81, "faded80s", "winter-1987.jpg")
    bokeh_scene(91, [(0, (70, 52, 36)), (1, (34, 26, 20))], [(255, 206, 140), (255, 236, 200), (210, 150, 90)], "faded80s", "bookshop-1992.jpg", count=80, size=(10, 44), stripes=[(120, 40, 34), (40, 60, 90), (150, 120, 70), (60, 80, 52), (200, 180, 140), (90, 50, 60)])
    garden(101, "modern", "garden-2014.jpg")
    seascape(111, [(0, (96, 120, 150)), (0.5, (232, 196, 160)), (1, (220, 200, 186))], (70, 90, 110), 0.6, True, True, "modern", "whitby-return-2021.jpg")
    seascape(121, [(0, (74, 92, 112)), (0.52, (214, 190, 168)), (1, (188, 176, 168))], (52, 68, 84), 0.62, False, True, "modern", "cover-dawn.jpg")
    # Walter's story
    street_dusk(131, "silver", "walter-colliery-1964.jpg")
    window_light(141, "faded80s", "walter-workshop-1985.jpg", (240, 214, 170))
    seascape(151, [(0, (150, 160, 170)), (0.55, (214, 214, 210)), (1, (190, 190, 186))], (90, 100, 108), 0.6, False, False, "modern", "walter-cover.jpg")
    write_sea_audio("sandsend-waves.wav")
