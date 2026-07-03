import { useEffect, useRef } from 'react'

const VS = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`

const FS = `
precision highp float;
varying vec2 vUv;
uniform float uTime;
uniform vec2  uRes;

float hash(vec2 p) {
  p  = fract(p * vec2(127.1, 311.7));
  p += dot(p, p + 17.5);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i),             hash(i + vec2(1,0)), f.x),
    mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), f.x),
    f.y
  );
}

float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  mat2  R = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 6; i++) { v += a * noise(p); p = R * p; a *= 0.5; }
  return v;
}

void main() {
  // Pixel-space sampling: features stay the same physical size on any screen.
  // A bigger window reveals more world rather than stretching the content.
  vec2 uv = gl_FragCoord.xy / 1080.0 * 1.8;

  float tx = uTime * 0.008;
  float ty = uTime * 0.010;
  float tz = uTime * 0.014;

  vec2 q = vec2(
    fbm(uv + vec2(tx,        ty * 0.55)),
    fbm(uv + vec2(5.2, 1.3) + vec2(ty * 0.72, tx))
  );
  vec2 r = vec2(
    fbm(uv + 3.0*q + vec2(1.7, 9.2) + tz),
    fbm(uv + 3.0*q + vec2(8.3, 2.8) + tz * 1.4)
  );

  float f  = fbm(uv + 2.6*r + vec2(tz * 0.5, tx * 0.35));
  float fD = fbm(uv * 2.7  + r + vec2(tz * 0.9, ty * 0.5));

  float n  = f  * f;
  float nD = fD * fD;

  vec3 col = vec3(0.024, 0.043, 0.102);

  // ── Stars ────────────────────────────────────────────────────────────────
  float cellPx = 20.0;
  vec2  sCell = floor(gl_FragCoord.xy / cellPx);
  vec2  sFrac = fract(gl_FragCoord.xy / cellPx);

  float h1 = hash(sCell);
  float h2 = hash(sCell + vec2( 7.3, 11.4));
  float h3 = hash(sCell + vec2( 2.1, 18.7));
  float h4 = hash(sCell + vec2(14.5,  6.2));
  float h5 = hash(sCell + vec2( 3.8, 22.1));

  float sOn = step(0.89, h1);

  vec2  sPx = (sFrac - vec2(h2, h3)) * cellPx;

  float sSpd   = 0.55 + h5 * 0.20;
  float twkRaw = sin(uTime * sSpd + h5 * 62.8);
  float twk    = twkRaw * 0.5 + 0.5;

  float vFade = smoothstep(0.20, 0.58, vUv.y);
  float szPx  = mix(0.18, 0.50, h4 * h4);

  float sDist = length(sPx);
  float theta = atan(sPx.y, sPx.x) + h5 * 1.5708;
  float lobe  = pow(abs(cos(2.0 * theta)), 4.0);
  float effR  = szPx * (1.2 + twk * 4.5 * lobe);
  float sStar = exp(-2.8 * sDist / max(0.08, effR));

  vec3  sClr = mix(vec3(0.75, 0.88, 1.00), vec3(1.00, 0.97, 0.88), twk * twk * h4);
  float sBrt = (0.10 + 0.90 * h4) * (0.04 + 0.96 * twk) * vFade;

  col += sOn * sBrt * sStar * sClr;

  // ── Nebula clouds ─────────────────────────────────────────────────────────
  float cBase = smoothstep(0.12, 0.40, n);
  col += vec3(0.486, 0.227, 0.929) * cBase                          * 0.065;
  col += vec3(0.0,   0.831, 1.0)   * smoothstep(0.18, 0.48, n)     * 0.044;
  col += vec3(0.878, 0.251, 0.984) * smoothstep(0.25, 0.56, n)     * 0.032;
  col += vec3(0.0,   1.0,   0.8)   * smoothstep(0.32, 0.62, n)     * 0.016;
  col += vec3(0.486, 0.227, 0.929) * nD * cBase                    * 0.057;
  col += vec3(0.0,   0.831, 1.0)   * smoothstep(0.18, 0.48, nD) * cBase * 0.036;

  // ── Vignette ──────────────────────────────────────────────────────────────
  vec2 vc = vUv * 2.0 - 1.0;
  col *= 1.0 - dot(vc, vc) * 0.24;

  gl_FragColor = vec4(col, 1.0);
}
`

export default function ParticleBackground() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
    if (!gl) return

    function mkShader(type, src) {
      const s = gl.createShader(type)
      gl.shaderSource(s, src)
      gl.compileShader(s)
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
        console.error('Shader error:', gl.getShaderInfoLog(s))
      return s
    }

    const prog = gl.createProgram()
    gl.attachShader(prog, mkShader(gl.VERTEX_SHADER,   VS))
    gl.attachShader(prog, mkShader(gl.FRAGMENT_SHADER, FS))
    gl.linkProgram(prog)
    gl.useProgram(prog)

    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER,
      new Float32Array([-1,-1, 1,-1, -1,1, 1,-1, 1,1, -1,1]),
      gl.STATIC_DRAW)

    const aPos  = gl.getAttribLocation(prog, 'aPos')
    gl.enableVertexAttribArray(aPos)
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)

    const uTime = gl.getUniformLocation(prog, 'uTime')
    const uRes  = gl.getUniformLocation(prog, 'uRes')

    let animId

    function resize() {
      canvas.width  = window.innerWidth
      canvas.height = window.innerHeight
      gl.viewport(0, 0, canvas.width, canvas.height)
      gl.uniform2f(uRes, canvas.width, canvas.height)
    }

    function draw(ms) {
      gl.uniform1f(uTime, ms * 0.001)
      gl.drawArrays(gl.TRIANGLES, 0, 6)
      animId = requestAnimationFrame(draw)
    }

    resize()
    window.addEventListener('resize', resize)
    animId = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
      gl.deleteProgram(prog)
      gl.deleteBuffer(buf)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position:      'fixed',
        inset:         0,
        zIndex:        0,
        pointerEvents: 'none',
      }}
    />
  )
}
