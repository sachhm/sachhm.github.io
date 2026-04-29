# Portfolio Refactor — "The Aberration"

## Overview

Refactor sachhm.github.io to add a single standout 3D centrepiece while preserving the existing minimalist monospace dark-mode aesthetic. The site remains a static GitHub Pages deployment with zero build tools.

**Audience**: Recruiters, hiring managers, and developers — the design should be professional enough to land interviews but technically interesting enough to impress devs.

**Identity**: Subtle metalhead energy — the 3D element evokes dark, heavy, organic album art (think Lorna Shore / Meshuggah cover rendered as living geometry), not generic tech-demo vibes.

## 3D Centrepiece: Displaced Icosahedron

### Geometry
- `IcosahedronGeometry` with high subdivision (~80-100 faces)
- Custom vertex shader applies layered simplex noise displacement
  - Primary layer: slow, large-scale breathing distortion (organic, alive)
  - Secondary layer: higher frequency fine-grain surface texture (raw, not polished)
- Noise evolves continuously over time

### Visual Treatment
- Dual-render: solid dark fill (`#0d0d0d`) + wireframe overlay in dim crimson (`#2a0a0a`)
- No scene lighting — flat/emissive materials keep the look graphic and album-art-like
- Slow continuous Y-axis rotation
- Mouse proximity increases displacement intensity — shape bulges toward cursor

### Placement
- Fixed position behind the header area, slightly offset upward
- Content scrolls over it against the `#0a0a0a` background
- No hard container — shape bleeds subtly into the page

### Performance
- Single geometry, no post-processing passes
- `requestAnimationFrame` with `document.hidden` check (pauses when tab not visible)
- Target: 60fps on any modern machine
- Three.js loaded via CDN (~150KB gzipped)

## Page Layout & Content

Structure stays identical to current site. Same order:

1. **Nav**: `/github` `/linkedin` links
2. **Header**: "Sachh Ariel Moka" + "Bachelor of IT, James Cook University"
3. **Bio**: Existing paragraph unchanged
4. **Skills**: Python / Swift / C++ / JavaScript
5. **Interests**: Audio Engineering / Aviation Technology / Machine Learning
6. **Projects** (updated list):
   - **Blackheart** — Analog octave fuzz meets digital pitch shifting and modulation. C++ audio plugin. (github.com/sachhm/Blackheart)
   - **OzRegAPI** — Australian business registry lookup API. (rapidapi.com/sachhm/api/ozregapi)
   - **pilot-logger** — iOS flight log app built with Swift. (github.com/sachhm/pilot-logger)
   - **qld-rfs-locator** — Find the nearest QLD Rural Fire Station from any address. Python. (github.com/sachhm/qld-rfs-locator)
   - **weather-app** — Weather tracker using the Open-Meteo API with IP-based location. Python. (github.com/sachhm/weather-app)
   - **stoicity** — A simple web app that displays Stoic quotes. (github.com/sachhm/stoicity)
7. **Footer**: Copyright 2026

## Styling Changes

- Existing monospace dark palette preserved entirely
- One addition: wireframe accent colour (`#2a0a0a` deep crimson) echoes in link hover states — very faint, ties the 3D element to the page thematically
- Typography, spacing, responsive breakpoints unchanged

## File Structure

```
sachhm.github.io/
├── index.html          (add <canvas>, Three.js CDN script tag)
├── css/
│   └── styles.css      (add canvas positioning, hover accent tweak)
├── js/
│   └── aberration.js   (new — all Three.js + shader code)
└── ...
```

No build step. No npm. No framework beyond Three.js via CDN.

## Constraints

- Must deploy on GitHub Pages (static only)
- No build tools, no bundler
- Single external dependency: Three.js via CDN
- Must work on modern browsers (Chrome, Firefox, Safari, Edge)
- Must be responsive (existing breakpoint at 600px)
- Graceful degradation if WebGL unavailable (just show the page without the 3D element)
