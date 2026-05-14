// js/aberration.js — Quiet topographic field
(function () {
  "use strict";

  var canvas = document.getElementById("aberration");
  if (!canvas) return;

  var testGl = canvas.getContext("webgl2") || canvas.getContext("webgl");
  if (!testGl) {
    canvas.style.display = "none";
    return;
  }

  var renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
    alpha: true,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0);

  var scene = new THREE.Scene();
  var camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  var simplexNoise = [
    "vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}",
    "vec2 mod289(vec2 x){return x-floor(x*(1.0/289.0))*289.0;}",
    "vec3 permute(vec3 x){return mod289(((x*34.0)+1.0)*x);}",
    "float snoise(vec2 v){",
    "  const vec4 C=vec4(0.211324865405187,0.366025403784439,-0.577350269189626,0.024390243902439);",
    "  vec2 i=floor(v+dot(v,C.yy));",
    "  vec2 x0=v-i+dot(i,C.xx);",
    "  vec2 i1=(x0.x>x0.y)?vec2(1.0,0.0):vec2(0.0,1.0);",
    "  vec4 x12=x0.xyxy+C.xxzz; x12.xy-=i1;",
    "  i=mod289(i);",
    "  vec3 p=permute(permute(i.y+vec3(0.0,i1.y,1.0))+i.x+vec3(0.0,i1.x,1.0));",
    "  vec3 m=max(0.5-vec3(dot(x0,x0),dot(x12.xy,x12.xy),dot(x12.zw,x12.zw)),0.0);",
    "  m=m*m; m=m*m;",
    "  vec3 x=2.0*fract(p*C.www)-1.0;",
    "  vec3 h=abs(x)-0.5;",
    "  vec3 ox=floor(x+0.5);",
    "  vec3 a0=x-ox;",
    "  m*=1.79284291400159-0.85373472095314*(a0*a0+h*h);",
    "  vec3 g; g.x=a0.x*x0.x+h.x*x0.y; g.yz=a0.yz*x12.xz+h.yz*x12.yw;",
    "  return 130.0*dot(m,g);",
    "}",
  ].join("\n");

  var vertexShader = [
    "varying vec2 vUv;",
    "void main(){ vUv=uv; gl_Position=vec4(position,1.0); }",
  ].join("\n");

  var fragmentShader = [
    simplexNoise,
    "uniform float uTime;",
    "uniform vec2 uResolution;",
    "uniform vec3 uLine;",
    "uniform float uIntensity;",
    "varying vec2 vUv;",
    "void main(){",
    "  vec2 p=(vUv-0.5);",
    "  p.x*=uResolution.x/uResolution.y;",
    "  float n=snoise(p*1.4+vec2(0.0,uTime*0.025));",
    "  n+=snoise(p*3.2+vec2(uTime*0.02,0.0))*0.35;",
    "  float bands=8.0;",
    "  float v=fract(n*bands);",
    "  float d=min(v,1.0-v);",
    "  float aa=fwidth(n*bands);",
    "  float line=1.0-smoothstep(0.0,aa*1.2,d);",
    "  float vignette=smoothstep(1.1,0.2,length(p));",
    "  float a=line*uIntensity*vignette;",
    "  gl_FragColor=vec4(uLine,a);",
    "}",
  ].join("\n");

  var uniforms = {
    uTime: { value: 0 },
    uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
    uLine: { value: new THREE.Color(0xe0c8c8) },
    uIntensity: { value: 0.18 },
  };

  var material = new THREE.ShaderMaterial({
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
    uniforms: uniforms,
    transparent: true,
    extensions: { derivatives: true },
  });

  var quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
  scene.add(quad);

  function applyTheme() {
    var theme = document.documentElement.getAttribute("data-theme") || "dark";
    if (theme === "light") {
      uniforms.uLine.value.set(0x8a3a2c);
      uniforms.uIntensity.value = 0.22;
    } else {
      uniforms.uLine.value.set(0xe0c8c8);
      uniforms.uIntensity.value = 0.18;
    }
  }
  applyTheme();

  var themeObserver = new MutationObserver(applyTheme);
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });

  var clock = new THREE.Clock();

  function animate() {
    if (document.hidden) {
      requestAnimationFrame(animate);
      return;
    }
    uniforms.uTime.value = clock.getElapsedTime();
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
  animate();

  window.addEventListener("resize", function () {
    renderer.setSize(window.innerWidth, window.innerHeight);
    uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
  });
})();
