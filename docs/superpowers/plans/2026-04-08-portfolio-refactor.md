# Portfolio Refactor — "The Aberration" Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a displaced icosahedron 3D centrepiece with GLSL shaders to the portfolio site, update the project list with OzRegAPI, and add a subtle crimson accent.

**Architecture:** Single-page static site hosted on GitHub Pages. Three.js loaded via CDN renders a noise-displaced icosahedron behind the header. All shader code lives in a single JS file. No build tools.

**Tech Stack:** HTML, CSS, vanilla JS, Three.js (CDN), GLSL shaders

---

## File Structure

```
sachhm.github.io/
├── index.html          (modify — add <canvas>, script tags, OzRegAPI project)
├── css/
│   └── styles.css      (modify — canvas positioning, accent colour, z-index layering)
├── js/
│   └── aberration.js   (create — Three.js scene, shaders, animation loop, mouse interaction)
```

---

### Task 1: Create the Three.js scene with displaced icosahedron

**Files:**
- Create: `js/aberration.js`

- [ ] **Step 1: Create `js/aberration.js` with the full Three.js scene**

This file contains everything: simplex noise GLSL, vertex/fragment shaders, scene setup, dual-render (solid + wireframe), mouse tracking, animation loop, resize handling, and WebGL fallback.

```js
// js/aberration.js — The Aberration
(function () {
  "use strict";

  const canvas = document.getElementById("aberration");
  if (!canvas) return;

  // WebGL fallback
  const gl =
    canvas.getContext("webgl2") || canvas.getContext("webgl");
  if (!gl) {
    canvas.style.display = "none";
    return;
  }
  gl.getExtension("WEBGL_lose_context")?.loseContext();

  // --- Three.js setup ---
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  );
  camera.position.z = 4.5;

  // --- Mouse tracking ---
  const mouse = { x: 0, y: 0, target: { x: 0, y: 0 } };
  document.addEventListener("mousemove", (e) => {
    mouse.target.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.target.y = -(e.clientY / window.innerHeight) * 2 + 1;
  });

  // --- GLSL Simplex Noise (Ashima Arts) ---
  const simplexNoise = `
    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 permute(vec4 x) { return mod289(((x * 34.0) + 10.0) * x); }
    vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

    float snoise(vec3 v) {
      const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
      const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

      vec3 i  = floor(v + dot(v, C.yyy));
      vec3 x0 = v - i + dot(i, C.xxx);

      vec3 g = step(x0.yzx, x0.xyz);
      vec3 l = 1.0 - g;
      vec3 i1 = min(g.xyz, l.zxy);
      vec3 i2 = max(g.xyz, l.zxy);

      vec3 x1 = x0 - i1 + C.xxx;
      vec3 x2 = x0 - i2 + C.yyy;
      vec3 x3 = x0 - D.yyy;

      i = mod289(i);
      vec4 p = permute(permute(permute(
        i.z + vec4(0.0, i1.z, i2.z, 1.0))
        + i.y + vec4(0.0, i1.y, i2.y, 1.0))
        + i.x + vec4(0.0, i1.x, i2.x, 1.0));

      float n_ = 0.142857142857;
      vec3 ns = n_ * D.wyz - D.xzx;

      vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

      vec4 x_ = floor(j * ns.z);
      vec4 y_ = floor(j - 7.0 * x_);

      vec4 x = x_ * ns.x + ns.yyyy;
      vec4 y = y_ * ns.x + ns.yyyy;
      vec4 h = 1.0 - abs(x) - abs(y);

      vec4 b0 = vec4(x.xy, y.xy);
      vec4 b1 = vec4(x.zw, y.zw);

      vec4 s0 = floor(b0) * 2.0 + 1.0;
      vec4 s1 = floor(b1) * 2.0 + 1.0;
      vec4 sh = -step(h, vec4(0.0));

      vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
      vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

      vec3 p0 = vec3(a0.xy, h.x);
      vec3 p1 = vec3(a0.zw, h.y);
      vec3 p2 = vec3(a1.xy, h.z);
      vec3 p3 = vec3(a1.zw, h.w);

      vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
      p0 *= norm.x;
      p1 *= norm.y;
      p2 *= norm.z;
      p3 *= norm.w;

      vec4 m = max(0.5 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
      m = m * m;
      return 105.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
    }
  `;

  // --- Vertex Shader ---
  const vertexShader = `
    ${simplexNoise}

    uniform float uTime;
    uniform float uMouseInfluence;
    uniform vec2 uMouse;

    varying float vDisplacement;
    varying vec3 vNormal;

    void main() {
      vec3 pos = position;
      vec3 norm = normalize(position);

      // Primary layer: slow, large-scale breathing
      float primary = snoise(norm * 1.5 + uTime * 0.15) * 0.35;

      // Secondary layer: fine-grain surface texture
      float secondary = snoise(norm * 4.0 + uTime * 0.3) * 0.12;

      // Mouse proximity boost
      vec4 worldPos = modelMatrix * vec4(pos, 1.0);
      float mouseDist = length(worldPos.xy - uMouse * 2.0);
      float mouseBoost = smoothstep(2.5, 0.0, mouseDist) * uMouseInfluence * 0.25;

      float displacement = primary + secondary + mouseBoost;
      vDisplacement = displacement;

      pos += norm * displacement;
      vNormal = normalMatrix * norm;

      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `;

  // --- Fragment Shader (solid) ---
  const fragmentShaderSolid = `
    varying float vDisplacement;
    varying vec3 vNormal;

    void main() {
      float intensity = 0.04 + vDisplacement * 0.08;
      vec3 color = vec3(intensity, intensity * 0.85, intensity * 0.85);
      gl_FragColor = vec4(color, 1.0);
    }
  `;

  // --- Fragment Shader (wireframe) ---
  const fragmentShaderWire = `
    varying float vDisplacement;
    varying vec3 vNormal;

    void main() {
      float intensity = 0.12 + vDisplacement * 0.15;
      vec3 color = vec3(intensity, intensity * 0.4, intensity * 0.4);
      gl_FragColor = vec4(color, 0.6);
    }
  `;

  // --- Geometry ---
  const geometry = new THREE.IcosahedronGeometry(1.5, 5);

  // Solid mesh
  const solidMaterial = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader: fragmentShaderSolid,
    uniforms: {
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uMouseInfluence: { value: 0 },
    },
  });
  const solidMesh = new THREE.Mesh(geometry, solidMaterial);
  scene.add(solidMesh);

  // Wireframe mesh
  const wireMaterial = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader: fragmentShaderWire,
    wireframe: true,
    transparent: true,
    uniforms: {
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uMouseInfluence: { value: 0 },
    },
  });
  const wireMesh = new THREE.Mesh(geometry, wireMaterial);
  scene.add(wireMesh);

  // --- Animation ---
  const clock = new THREE.Clock();

  function animate() {
    if (document.hidden) {
      requestAnimationFrame(animate);
      return;
    }

    const elapsed = clock.getElapsedTime();

    // Smooth mouse lerp
    mouse.x += (mouse.target.x - mouse.x) * 0.05;
    mouse.y += (mouse.target.y - mouse.y) * 0.05;
    const mouseLen = Math.sqrt(mouse.x * mouse.x + mouse.y * mouse.y);
    const influence = Math.min(mouseLen * 1.5, 1.0);

    // Update uniforms
    solidMaterial.uniforms.uTime.value = elapsed;
    solidMaterial.uniforms.uMouse.value.set(mouse.x, mouse.y);
    solidMaterial.uniforms.uMouseInfluence.value = influence;

    wireMaterial.uniforms.uTime.value = elapsed;
    wireMaterial.uniforms.uMouse.value.set(mouse.x, mouse.y);
    wireMaterial.uniforms.uMouseInfluence.value = influence;

    // Slow rotation
    solidMesh.rotation.y = elapsed * 0.08;
    solidMesh.rotation.x = Math.sin(elapsed * 0.05) * 0.1;
    wireMesh.rotation.y = solidMesh.rotation.y;
    wireMesh.rotation.x = solidMesh.rotation.x;

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  animate();

  // --- Resize ---
  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
})();
```

- [ ] **Step 2: Verify file created**

Run: `ls -la js/aberration.js`
Expected: File exists with content

- [ ] **Step 3: Commit**

```bash
git add js/aberration.js
git commit -m "feat: add Three.js displaced icosahedron scene"
```

---

### Task 2: Update CSS for canvas positioning and accent colour

**Files:**
- Modify: `css/styles.css`

- [ ] **Step 1: Add canvas positioning and z-index layering to `css/styles.css`**

Add at the top of the file, after the reset block:

```css
#aberration {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 0;
    pointer-events: none;
}
```

Add `position: relative; z-index: 1;` to `.container` so content sits above the canvas.

- [ ] **Step 2: Update link hover accent colour**

Change `a:hover` color from `#e0e0e0` to `#e0c8c8` — a very faint warm tint that echoes the crimson wireframe without being obvious.

Change `.projects a:hover` similarly.

- [ ] **Step 3: Ensure body allows pointer events to pass through to document for mouse tracking**

No changes needed — the canvas has `pointer-events: none` so mouse events naturally reach the document listener.

- [ ] **Step 4: Verify changes visually**

Open `index.html` in a browser. Confirm:
- Canvas is behind all content
- Content is readable and scrollable over the 3D element
- Link hovers show the warm accent tint

- [ ] **Step 5: Commit**

```bash
git add css/styles.css
git commit -m "feat: add canvas positioning and crimson accent hover"
```

---

### Task 3: Update HTML — add canvas, scripts, and OzRegAPI project

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Add `<canvas>` element to `index.html`**

Add immediately after `<body>`, before `<div class="container">`:

```html
<canvas id="aberration"></canvas>
```

- [ ] **Step 2: Add Three.js CDN and aberration.js script tags**

Add before closing `</body>`:

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<script src="js/aberration.js"></script>
```

- [ ] **Step 3: Add OzRegAPI to the projects list**

Add as the second project entry (after Blackheart):

```html
<li>
    <a
        href="https://rapidapi.com/sachhm/api/ozregapi"
        target="_blank"
        >OzRegAPI</a
    >
    <span class="dash">&mdash;</span>
    Australian business registry lookup API.
</li>
```

- [ ] **Step 4: Verify the complete page**

Open `index.html` in a browser. Confirm:
- 3D icosahedron renders behind the header
- Shape breathes/distorts with noise animation
- Mouse movement affects displacement
- All 6 projects listed in correct order
- OzRegAPI links to RapidAPI
- Page is responsive at mobile breakpoint
- Content scrolls cleanly over the 3D element

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "feat: add canvas, Three.js scripts, and OzRegAPI project"
```

---

### Task 4: Final verification and cleanup

**Files:**
- All files

- [ ] **Step 1: Test WebGL fallback**

In browser devtools, disable WebGL (or test in a browser/device without it). Confirm the page renders normally without the 3D element — no errors in console.

- [ ] **Step 2: Test responsive layout**

Resize browser to <600px. Confirm:
- Content still uses reduced padding/gaps
- Canvas doesn't interfere with touch scrolling
- No horizontal overflow

- [ ] **Step 3: Test performance**

Open browser devtools Performance tab. Confirm animation runs at ~60fps with no jank. Verify `requestAnimationFrame` pauses when tab is hidden (switch tabs, check CPU usage drops).

- [ ] **Step 4: Validate HTML**

Run: Check that HTML is valid (no unclosed tags, proper nesting).

- [ ] **Step 5: Final commit if any tweaks were made**

```bash
git add -A
git commit -m "chore: final polish and verification"
```
