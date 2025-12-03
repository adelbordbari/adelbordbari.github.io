/* assets/pixel-waves.js
   Minimal dependency-free pixelated waves background.
   - Drops a full-screen canvas (#pixel-waves-canvas) into the page.
   - Renders into a small offscreen canvas for a blocky/pixelated look,
     then scales it up with imageSmoothingEnabled = false.
   - Very slow motion by default; tweak `CONFIG` below.
*/

(function () {
  const CONFIG = {
    pixelSize: 10,   // larger = bigger blocks; try 6..18
    speed: 0.025,    // smaller = slower animation; try 0.005..0.06
    opacity: 0.14,   // also controlled by CSS; kept for JS-driven fallback
    paletteBoost: 1, // 1 = normal contrast; >1 increases contrast a bit
  };

  // Respect user preference for reduced motion
  const prefersReducedMotion = typeof window !== 'undefined' &&
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReducedMotion) {
    // Do nothing if user prefers reduced motion
    return;
  }

  const canvas = document.createElement('canvas');
  canvas.id = 'pixel-waves-canvas';
  // Inline style fallback/opener if CSS not imported
  canvas.style.position = 'fixed';
  canvas.style.inset = '0';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.zIndex = '-1';
  canvas.style.pointerEvents = 'none';
  canvas.style.imageRendering = 'pixelated';
  canvas.style.opacity = String(CONFIG.opacity);

  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d', { alpha: true });

  // Offscreen low-res canvas to paint pixels into
  const off = document.createElement('canvas');
  const octx = off.getContext('2d');

  let DPR = Math.max(1, window.devicePixelRatio || 1);

  function resize() {
    DPR = Math.max(1, window.devicePixelRatio || 1);
    canvas.width = Math.round(window.innerWidth * DPR);
    canvas.height = Math.round(window.innerHeight * DPR);
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';

    // Determine small canvas size from pixelSize (we want low-res for pixelation)
    const smallW = Math.max(16, Math.floor(window.innerWidth / CONFIG.pixelSize));
    const smallH = Math.max(16, Math.floor(window.innerHeight / CONFIG.pixelSize));
    off.width = smallW;
    off.height = smallH;

    // Ensure crisp scaling
    ctx.imageSmoothingEnabled = false;
    octx.imageSmoothingEnabled = false;
  }

  window.addEventListener('resize', resize, { passive: true });
  resize();

  // A simple pseudo-random based on coordinates for repeatable subtle detail
  function pseudoNoise(x, y) {
    // from https://stackoverflow.com/a/47593316 small integer noise
    const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
    return s - Math.floor(s);
  }

  // Render into offscreen canvas (small), each pixel is a "block"
  function renderSmall(t) {
    const w = off.width;
    const h = off.height;
    const imageData = octx.createImageData(w, h);
    const data = imageData.data;

    // parameters for the combined wave patterns
    const t1 = t * CONFIG.speed;
    const freq1 = 2.0;
    const freq2 = 3.3;
    const freq3 = 1.6;

    let idx = 0;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        // normalized coords
        const nx = (x / w) * 2 - 1;
        const ny = (y / h) * 2 - 1;

        // layered sine fields to look like flowing shapes
        let v =
          0.55 * Math.sin((nx * freq1 - t1) * Math.PI * 2) +
          0.40 * Math.sin((ny * freq2 + t1 * 0.8) * Math.PI * 2) +
          0.25 * Math.sin(((nx + ny) * freq3 + t1 * 1.4) * Math.PI * 2);

        // add a faint value noise for organic micro-variation
        const n = (pseudoNoise(x * 12.9898, y * 78.233 + t * 0.0001) - 0.5) * 0.12;
        v = v * 0.7 + n;

        // normalize to 0..1 and tweak contrast
        let val = (v + 1) * 0.5; // 0..1
        val = Math.pow(val, 1.1); // slight gamma to make highlights pop
        val = Math.min(1, Math.max(0, val));
        // map to grayscale but biased towards bright highlights like your reference
        // invert a bit to get bright reflective shapes on darker background
        const shade = Math.floor((1 - val) * 255 * CONFIG.paletteBoost);

        // subtle chromatic aberration hint (we draw full grayscale into each channel;
        // for real 3-channel offsets you'd need extra passes; keep it simple & subtle)
        data[idx++] = shade; // R
        data[idx++] = Math.floor(shade * 0.98); // G slightly reduced
        data[idx++] = Math.floor(shade * 1.02) > 255 ? 255 : Math.floor(shade * 1.02); // B slightly boosted
        data[idx++] = 255; // alpha
      }
    }

    octx.putImageData(imageData, 0, 0);
  }

  let lastTime = 0;
  function draw(now) {
    // now in ms
    const t = now || performance.now();
    // limit FPS to ~30 for performance (optional)
    if (t - lastTime < 33) {
      requestAnimationFrame(draw);
      return;
    }
    lastTime = t;

    renderSmall(t);

    // scale up the offscreen canvas to full size
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // important: disable smoothing so scaled pixels stay blocky
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(off, 0, 0, canvas.width, canvas.height);

    requestAnimationFrame(draw);
  }

  requestAnimationFrame(draw);

  // Expose a small API to tweak parameters at runtime if needed
  window.__PixelWaves = {
    setPixelSize(n) {
      CONFIG.pixelSize = Math.max(2, +n || CONFIG.pixelSize);
      resize();
    },
    setSpeed(s) {
      CONFIG.speed = +s || CONFIG.speed;
    },
    setOpacity(o) {
      const v = Math.max(0, Math.min(1, +o));
      canvas.style.opacity = String(v);
    },
    destroy() {
      window.removeEventListener('resize', resize);
      if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas);
      delete window.__PixelWaves;
    }
  };
})();
