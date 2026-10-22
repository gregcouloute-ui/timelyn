# Explainer video

`public/timelyn-explainer.mp4` (41 seconds, 1280x720, captions burned in) is made from these sources.

- `explainer.html`: the animation. `window.render(t)` draws the frame at time `t` seconds. It expects an `assets/` folder beside it holding the demo photographs from `public/demo/` and the Bricolage Grotesque and Caveat `.woff2` files.
- `render-frames.mjs`: captures every frame with headless Chromium (puppeteer-core). Edit the path to `explainer.html` before running it.
- `music.py`: synthesises the music bed (`music.wav`) with NumPy and SciPy. It is original and royalty-free.

To rebuild:

```bash
node render-frames.mjs frames 30
python3 music.py
ffmpeg -framerate 30 -i frames/%05d.jpg -i music.wav -c:v libx264 -preset slow -crf 24 \
  -pix_fmt yuv420p -c:a aac -b:a 160k -shortest -movflags +faststart timelyn-explainer.mp4
```
