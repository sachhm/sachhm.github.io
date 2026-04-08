// js/aberration.js — The Aberration
(function () {
  "use strict";

  var canvas = document.getElementById("aberration");
  if (!canvas) return;

  var testGl = canvas.getContext("webgl2") || canvas.getContext("webgl");
  if (!testGl) {
    canvas.style.display = "none";
    return;
  }

  // --- Three.js setup ---
  var renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
    alpha: true,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  );
  camera.position.z = 4.5;

  // --- Mouse tracking ---
  var mouse = { x: 0, y: 0, target: { x: 0, y: 0 } };
  document.addEventListener("mousemove", function (e) {
    mouse.target.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.target.y = -(e.clientY / window.innerHeight) * 2 + 1;
  });

  // --- GLSL Simplex Noise (Ashima Arts) ---
  var simplexNoise = [
    "vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }",
    "vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }",
    "vec4 permute(vec4 x) { return mod289(((x * 34.0) + 10.0) * x); }",
    "vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }",
    "",
    "float snoise(vec3 v) {",
    "  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);",
    "  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);",
    "  vec3 i  = floor(v + dot(v, C.yyy));",
    "  vec3 x0 = v - i + dot(i, C.xxx);",
    "  vec3 g = step(x0.yzx, x0.xyz);",
    "  vec3 l = 1.0 - g;",
    "  vec3 i1 = min(g.xyz, l.zxy);",
    "  vec3 i2 = max(g.xyz, l.zxy);",
    "  vec3 x1 = x0 - i1 + C.xxx;",
    "  vec3 x2 = x0 - i2 + C.yyy;",
    "  vec3 x3 = x0 - D.yyy;",
    "  i = mod289(i);",
    "  vec4 p = permute(permute(permute(",
    "    i.z + vec4(0.0, i1.z, i2.z, 1.0))",
    "    + i.y + vec4(0.0, i1.y, i2.y, 1.0))",
    "    + i.x + vec4(0.0, i1.x, i2.x, 1.0));",
    "  float n_ = 0.142857142857;",
    "  vec3 ns = n_ * D.wyz - D.xzx;",
    "  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);",
    "  vec4 x_ = floor(j * ns.z);",
    "  vec4 y_ = floor(j - 7.0 * x_);",
    "  vec4 x = x_ * ns.x + ns.yyyy;",
    "  vec4 y = y_ * ns.x + ns.yyyy;",
    "  vec4 h = 1.0 - abs(x) - abs(y);",
    "  vec4 b0 = vec4(x.xy, y.xy);",
    "  vec4 b1 = vec4(x.zw, y.zw);",
    "  vec4 s0 = floor(b0) * 2.0 + 1.0;",
    "  vec4 s1 = floor(b1) * 2.0 + 1.0;",
    "  vec4 sh = -step(h, vec4(0.0));",
    "  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;",
    "  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;",
    "  vec3 p0 = vec3(a0.xy, h.x);",
    "  vec3 p1 = vec3(a0.zw, h.y);",
    "  vec3 p2 = vec3(a1.xy, h.z);",
    "  vec3 p3 = vec3(a1.zw, h.w);",
    "  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));",
    "  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;",
    "  vec4 m = max(0.5 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);",
    "  m = m * m;",
    "  return 105.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));",
    "}",
  ].join("\n");

  // --- Vertex Shader ---
  var vertexShader = [
    simplexNoise,
    "",
    "uniform float uTime;",
    "uniform float uMouseInfluence;",
    "uniform vec2 uMouse;",
    "",
    "varying float vDisplacement;",
    "varying vec3 vNormal;",
    "",
    "void main() {",
    "  vec3 pos = position;",
    "  vec3 norm = normalize(position);",
    "",
    "  // Primary layer: slow, large-scale breathing",
    "  float primary = snoise(norm * 1.5 + uTime * 0.15) * 0.35;",
    "",
    "  // Secondary layer: fine-grain surface texture",
    "  float secondary = snoise(norm * 4.0 + uTime * 0.3) * 0.12;",
    "",
    "  // Mouse proximity — vertices near cursor get displaced more",
    "  vec4 worldPos = modelMatrix * vec4(pos, 1.0);",
    "  float mouseDist = length(worldPos.xy - uMouse * 3.0);",
    "  float mouseBoost = smoothstep(3.0, 0.0, mouseDist) * uMouseInfluence * 0.4;",
    "",
    "  float displacement = primary + secondary + mouseBoost;",
    "  vDisplacement = displacement;",
    "",
    "  pos += norm * displacement;",
    "  vNormal = normalMatrix * norm;",
    "",
    "  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);",
    "}",
  ].join("\n");

  // --- Fragment Shader (solid) ---
  var fragmentShaderSolid = [
    "varying float vDisplacement;",
    "varying vec3 vNormal;",
    "",
    "void main() {",
    "  float intensity = 0.04 + vDisplacement * 0.08;",
    "  vec3 color = vec3(intensity, intensity * 0.85, intensity * 0.85);",
    "  gl_FragColor = vec4(color, 1.0);",
    "}",
  ].join("\n");

  // --- Fragment Shader (wireframe) ---
  var fragmentShaderWire = [
    "varying float vDisplacement;",
    "varying vec3 vNormal;",
    "",
    "void main() {",
    "  float intensity = 0.18 + vDisplacement * 0.2;",
    "  vec3 color = vec3(intensity, intensity * 0.4, intensity * 0.4);",
    "  gl_FragColor = vec4(color, 0.7);",
    "}",
  ].join("\n");

  // --- Geometry ---
  var geometry = new THREE.IcosahedronGeometry(1.5, 5);

  // Solid mesh
  var solidMaterial = new THREE.ShaderMaterial({
    vertexShader: vertexShader,
    fragmentShader: fragmentShaderSolid,
    uniforms: {
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uMouseInfluence: { value: 0 },
    },
  });
  var solidMesh = new THREE.Mesh(geometry, solidMaterial);
  scene.add(solidMesh);

  // Wireframe mesh
  var wireMaterial = new THREE.ShaderMaterial({
    vertexShader: vertexShader,
    fragmentShader: fragmentShaderWire,
    wireframe: true,
    transparent: true,
    uniforms: {
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uMouseInfluence: { value: 0 },
    },
  });
  var wireMesh = new THREE.Mesh(geometry, wireMaterial);
  scene.add(wireMesh);

  // --- Animation ---
  var clock = new THREE.Clock();

  function animate() {
    if (document.hidden) {
      requestAnimationFrame(animate);
      return;
    }

    var elapsed = clock.getElapsedTime();

    // Smooth mouse lerp
    mouse.x += (mouse.target.x - mouse.x) * 0.05;
    mouse.y += (mouse.target.y - mouse.y) * 0.05;

    // Always active — let the shader handle proximity
    var influence = 1.0;

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
  window.addEventListener("resize", function () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
})();
