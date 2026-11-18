// Raw WebGL1 renderer: one lit world program, a sky program, and sprite
// batches for glow + shadows. Internal supersampling: the scene renders at
// renderScale x the page size and the browser downsamples it.

function matIdent() { return new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]); }
function matMul(a, b) {
  const o = new Float32Array(16);
  for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) {
    o[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
  }
  return o;
}
function matPersp(fov, asp, near, far) {
  const f = 1 / Math.tan(fov / 2), o = new Float32Array(16);
  o[0] = f / asp; o[5] = f; o[10] = (far + near) / (near - far); o[11] = -1; o[14] = 2 * far * near / (near - far);
  return o;
}
function matLook(eye, at, up) {
  let zx = eye[0] - at[0], zy = eye[1] - at[1], zz = eye[2] - at[2];
  let l = Math.hypot(zx, zy, zz); zx /= l; zy /= l; zz /= l;
  let xx = up[1] * zz - up[2] * zy, xy = up[2] * zx - up[0] * zz, xz = up[0] * zy - up[1] * zx;
  l = Math.hypot(xx, xy, xz) || 1; xx /= l; xy /= l; xz /= l;
  const yx = zy * xz - zz * xy, yy = zz * xx - zx * xz, yz = zx * xy - zy * xx;
  const o = new Float32Array(16);
  o[0] = xx; o[1] = yx; o[2] = zx; o[4] = xy; o[5] = yy; o[6] = zy; o[8] = xz; o[9] = yz; o[10] = zz;
  o[12] = -(xx * eye[0] + xy * eye[1] + xz * eye[2]);
  o[13] = -(yx * eye[0] + yy * eye[1] + yz * eye[2]);
  o[14] = -(zx * eye[0] + zy * eye[1] + zz * eye[2]); o[15] = 1;
  return o;
}
function matModel(x, y, z, ry, s) {
  const c = Math.cos(ry), sn = Math.sin(ry), sc = s || 1;
  const o = matIdent();
  o[0] = c * sc; o[2] = -sn * sc; o[8] = sn * sc; o[10] = c * sc;
  o[12] = x; o[13] = y; o[14] = z;
  return o;
}
// Model with a pivot offset (limb swing about the shoulder/hip).
function matPivot(x, y, z, ry, px, py, pz, rx) {
  const t1 = matIdent(); t1[12] = x; t1[13] = y; t1[14] = z;
  const c = Math.cos(ry), sn = Math.sin(ry);
  const r = matIdent(); r[0] = c; r[2] = -sn; r[8] = sn; r[10] = c;
  const tp = matIdent(); tp[12] = px; tp[13] = py; tp[14] = pz;
  const cx = Math.cos(rx), sx = Math.sin(rx);
  const rxm = matIdent(); rxm[5] = cx; rxm[6] = sx; rxm[9] = -sx; rxm[10] = cx;
  const tn = matIdent(); tn[12] = -px; tn[13] = -py; tn[14] = -pz;
  return matMul(matMul(matMul(matMul(t1, r), tp), rxm), tn);
}

// Time-of-day sky keyframes: sun, light, horizon, zenith, night factor, fog.
const SKY_KEYS = [
  { t: 0.0, sun: [0.3, 0.7, 0.2], sunCol: [0.22, 0.28, 0.45], amb: [0.30, 0.32, 0.44], hor: [0.10, 0.13, 0.26], zen: [0.02, 0.03, 0.10], night: 1.0, fog: [140, 430] },
  { t: 5.5, sun: [0.9, 0.12, 0.2], sunCol: [0.85, 0.55, 0.35], amb: [0.42, 0.38, 0.42], hor: [0.75, 0.45, 0.35], zen: [0.25, 0.3, 0.5], night: 0.45, fog: [170, 480] },
  { t: 8.0, sun: [0.8, 0.5, 0.3], sunCol: [1.0, 0.9, 0.75], amb: [0.55, 0.55, 0.58], hor: [0.65, 0.75, 0.9], zen: [0.3, 0.5, 0.85], night: 0.0, fog: [220, 600] },
  { t: 12.0, sun: [0.2, 0.95, 0.25], sunCol: [1.0, 0.95, 0.85], amb: [0.6, 0.6, 0.62], hor: [0.7, 0.8, 0.92], zen: [0.25, 0.48, 0.85], night: 0.0, fog: [240, 650] },
  { t: 16.5, sun: [-0.7, 0.45, 0.3], sunCol: [1.0, 0.8, 0.55], amb: [0.55, 0.5, 0.5], hor: [0.85, 0.6, 0.4], zen: [0.3, 0.45, 0.75], night: 0.05, fog: [200, 560] },
  { t: 18.2, sun: [-0.95, 0.14, 0.15], sunCol: [1.0, 0.55, 0.3], amb: [0.5, 0.42, 0.5], hor: [0.95, 0.45, 0.35], zen: [0.35, 0.25, 0.55], night: 0.35, fog: [180, 520] },
  { t: 18.9, sun: [-1.0, 0.02, 0.1], sunCol: [0.9, 0.4, 0.35], amb: [0.45, 0.36, 0.5], hor: [0.75, 0.3, 0.45], zen: [0.2, 0.12, 0.4], night: 0.6, fog: [160, 470] },
  { t: 19.8, sun: [0.3, 0.7, 0.2], sunCol: [0.25, 0.3, 0.45], amb: [0.32, 0.34, 0.46], hor: [0.12, 0.14, 0.28], zen: [0.03, 0.04, 0.12], night: 1.0, fog: [140, 430] },
  { t: 24.0, sun: [0.3, 0.7, 0.2], sunCol: [0.22, 0.28, 0.45], amb: [0.30, 0.32, 0.44], hor: [0.10, 0.13, 0.26], zen: [0.02, 0.03, 0.10], night: 1.0, fog: [140, 430] },
];
function skyAt(t) {
  t = ((t % 24) + 24) % 24;
  let a = SKY_KEYS[0], b = SKY_KEYS[SKY_KEYS.length - 1];
  for (let i = 0; i < SKY_KEYS.length - 1; i++) {
    if (t >= SKY_KEYS[i].t && t <= SKY_KEYS[i + 1].t) { a = SKY_KEYS[i]; b = SKY_KEYS[i + 1]; break; }
  }
  const f = (t - a.t) / Math.max(0.001, b.t - a.t);
  function lv(x, y) { return x + (y - x) * f; }
  function l3(x, y) { return [lv(x[0], y[0]), lv(x[1], y[1]), lv(x[2], y[2])]; }
  const sun = l3(a.sun, b.sun), sl = Math.hypot(sun[0], sun[1], sun[2]) || 1;
  return {
    sunDir: [sun[0] / sl, sun[1] / sl, sun[2] / sl], sunCol: l3(a.sunCol, b.sunCol),
    amb: l3(a.amb, b.amb), hor: l3(a.hor, b.hor), zen: l3(a.zen, b.zen),
    night: lv(a.night, b.night), fogNear: lv(a.fog[0], b.fog[0]), fogFar: lv(a.fog[1], b.fog[1]),
  };
}

const R = {
  gl: null, prog: null, skyProg: null, sprProg: null,
  tex: null, emiTex: null, glowTex: null,
  glows: [], flats: [], view: null, proj: null, camPos: [0, 0, 0],
  sky: null, time: 0,

  init: function (canvas) {
    const gl = canvas.getContext('webgl', { antialias: true, alpha: false, preserveDrawingBuffer: false });
    if (!gl) throw new Error('WebGL unavailable');
    gl.getExtension('OES_element_index_uint');
    this.gl = gl; this.canvas = canvas;
    this.prog = this.makeProg(
      'attribute vec3 aPos;attribute vec3 aNor;attribute vec3 aCol;attribute vec2 aUV;attribute float aEmi;attribute float aSpc;' +
      'uniform mat4 uProj;uniform mat4 uView;uniform mat4 uModel;' +
      'varying vec3 vCol;varying vec2 vUV;varying float vEmi;varying float vSpc;varying vec3 vNor;varying vec3 vWorld;varying float vDist;' +
      'void main(){vec4 w=uModel*vec4(aPos,1.0);vWorld=w.xyz;vNor=mat3(uModel)*aNor;vCol=aCol;vUV=aUV;vEmi=aEmi;vSpc=aSpc;' +
      'vec4 v=uView*w;vDist=-v.z;gl_Position=uProj*v;}',
      'precision mediump float;' +
      'uniform sampler2D uTex;uniform sampler2D uEmi;uniform vec3 uSunDir;uniform vec3 uSunCol;uniform vec3 uAmb;' +
      'uniform vec3 uFogCol;uniform vec3 uCamPos;uniform vec3 uTint;uniform float uFogNear;uniform float uFogFar;uniform float uGlow;uniform float uAlpha;' +
      'varying vec3 vCol;varying vec2 vUV;varying float vEmi;varying float vSpc;varying vec3 vNor;varying vec3 vWorld;varying float vDist;' +
      'void main(){vec3 tex=texture2D(uTex,vUV).rgb;vec3 base=tex*vCol*uTint;vec3 n=normalize(vNor);' +
      'float diff=max(dot(n,uSunDir),0.0);' +
      'vec3 vd=normalize(uCamPos-vWorld);vec3 hv=normalize(vd+uSunDir);' +
      'float spec=pow(max(dot(n,hv),0.0),26.0)*vSpc;' +
      'vec3 emi=texture2D(uEmi,vUV).rgb*vCol*vEmi*uGlow;' +
      'vec3 col=base*(uAmb+uSunCol*diff)+uSunCol*spec+emi;' +
      'float f=clamp((vDist-uFogNear)/(uFogFar-uFogNear),0.0,1.0);' +
      'gl_FragColor=vec4(mix(col,uFogCol,f),uAlpha);}');
    this.skyProg = this.makeProg(
      'attribute vec2 aCorner;varying vec2 vUV;void main(){vUV=aCorner*0.5+0.5;gl_Position=vec4(aCorner,0.999,1.0);}',
      'precision mediump float;uniform vec3 uTop;uniform vec3 uHor;uniform vec2 uSunUV;uniform vec3 uSunCol;uniform float uNight;uniform float uSunOn;' +
      'varying vec2 vUV;' +
      'float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}' +
      'void main(){float h=clamp(vUV.y,0.0,1.0);vec3 col=mix(uHor,uTop,pow(h,0.75));' +
      'float sd=distance(vUV*vec2(1.78,1.0),uSunUV*vec2(1.78,1.0));' +
      'col+=uSunCol*(smoothstep(0.10,0.0,sd)*0.9+smoothstep(0.45,0.0,sd)*0.28)*uSunOn;' +
      'vec2 g=floor(vUV*vec2(440.0,248.0));float s=hash(g);' +
      'if(s>0.9965&&vUV.y>0.35){col+=vec3(0.9,0.9,1.0)*uNight*(0.4+0.6*hash(g+7.0));}' +
      'gl_FragColor=vec4(col,1.0);}');
    this.sprProg = this.makeProg(
      'attribute vec3 aPos;attribute vec2 aCorner;attribute vec3 aCol;attribute float aSize;attribute float aFlat;attribute float aAlpha;' +
      'uniform mat4 uProj;uniform mat4 uView;uniform vec3 uRight;uniform vec3 uUp;' +
      'varying vec3 vCol;varying vec2 vUV;varying float vAlpha;' +
      'void main(){vec3 w=aPos+mix(uRight*aCorner.x+uUp*aCorner.y,vec3(aCorner.x,0.0,aCorner.y),aFlat)*aSize;' +
      'vCol=aCol;vUV=aCorner*0.5+0.5;vAlpha=aAlpha;gl_Position=uProj*uView*vec4(w,1.0);}',
      'precision mediump float;uniform sampler2D uTex;varying vec3 vCol;varying vec2 vUV;varying float vAlpha;' +
      'void main(){float a=texture2D(uTex,vUV).a*vAlpha;gl_FragColor=vec4(vCol,a);}');
    const atlas = paintAtlas(CFG.seed);
    this.tex = this.makeTex(atlas.diffuse);
    this.emiTex = this.makeTex(atlas.emissive);
    this.glowTex = this.makeTex(makeGlowSprite());
    // Fullscreen triangle for the sky.
    this.skyBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.skyBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    // Sprite batch buffers.
    this.sprBuf = gl.createBuffer();
    gl.disable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);
    this.resize();
  },

  makeProg: function (vs, fs) {
    const gl = this.gl;
    function sh(type, src) {
      const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
      return s;
    }
    const p = gl.createProgram();
    gl.attachShader(p, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    p.att = {}; p.uni = {};
    const na = gl.getProgramParameter(p, gl.ACTIVE_ATTRIBUTES);
    for (let i = 0; i < na; i++) { const a = gl.getActiveAttrib(p, i); p.att[a.name] = gl.getAttribLocation(p, a.name); }
    const nu = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < nu; i++) { const u = gl.getActiveUniform(p, i); p.uni[u.name] = gl.getUniformLocation(p, u.name); }
    return p;
  },
  makeTex: function (canvas) {
    const gl = this.gl, t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    gl.generateMipmap(gl.TEXTURE_2D);
    return t;
  },
  upload: function (data) {
    const gl = this.gl;
    function buf(arr, type) { const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, arr, gl.STATIC_DRAW); return b; }
    const ib = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, data.idx, gl.STATIC_DRAW);
    return { p: buf(data.pos), n: buf(data.nor), c: buf(data.col), u: buf(data.uv), e: buf(data.emi), s: buf(data.spc), ib: ib, count: data.count };
  },
  resize: function () {
    const ss = CFG.renderScale;
    const w = Math.min(this.canvas.clientWidth * ss, 2880), h = Math.min(this.canvas.clientHeight * ss, 1620);
    if (this.canvas.width !== Math.round(w) || this.canvas.height !== Math.round(h)) {
      this.canvas.width = Math.round(w); this.canvas.height = Math.round(h);
    }
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
  },

  begin: function (cam, time) {
    const gl = this.gl;
    this.resize();
    this.sky = skyAt(time); this.time = time;
    this.camPos = cam.eye;
    const asp = this.canvas.width / this.canvas.height;
    this.proj = matPersp(cam.fov || 1.05, asp, 0.1, 900);
    this.view = matLook(cam.eye, cam.at, [0, 1, 0]);
    // Sky pass.
    gl.disable(gl.DEPTH_TEST); gl.depthMask(false);
    gl.useProgram(this.skyProg);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.skyBuf);
    gl.enableVertexAttribArray(this.skyProg.att.aCorner);
    gl.vertexAttribPointer(this.skyProg.att.aCorner, 2, gl.FLOAT, false, 0, 0);
    // Project the sun direction to screen space for the disc.
    const sd = this.sky.sunDir, sp = [this.camPos[0] + sd[0] * 100, this.camPos[1] + sd[1] * 100, this.camPos[2] + sd[2] * 100];
    const vp = matMul(this.proj, this.view);
    const cx = vp[0] * sp[0] + vp[4] * sp[1] + vp[8] * sp[2] + vp[12];
    const cy = vp[1] * sp[0] + vp[5] * sp[1] + vp[9] * sp[2] + vp[13];
    const cw = vp[3] * sp[0] + vp[7] * sp[1] + vp[11] * sp[2] + vp[15];
    const sunOn = (cw > 0 && this.sky.sunDir[1] > -0.05) ? 1 : 0;
    gl.uniform3fv(this.skyProg.uni.uTop, this.sky.zen);
    gl.uniform3fv(this.skyProg.uni.uHor, this.sky.hor);
    gl.uniform2f(this.skyProg.uni.uSunUV, cx / cw * 0.5 + 0.5, cy / cw * 0.5 + 0.5);
    gl.uniform3fv(this.skyProg.uni.uSunCol, this.sky.sunCol);
    gl.uniform1f(this.skyProg.uni.uNight, this.sky.night);
    gl.uniform1f(this.skyProg.uni.uSunOn, sunOn);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.enable(gl.DEPTH_TEST); gl.depthMask(true); gl.clear(gl.DEPTH_BUFFER_BIT);
    // World program setup.
    gl.useProgram(this.prog);
    gl.uniformMatrix4fv(this.prog.uni.uProj, false, this.proj);
    gl.uniformMatrix4fv(this.prog.uni.uView, false, this.view);
    gl.uniform3fv(this.prog.uni.uSunDir, this.sky.sunDir);
    gl.uniform3fv(this.prog.uni.uSunCol, this.sky.sunCol);
    gl.uniform3fv(this.prog.uni.uAmb, this.sky.amb);
    gl.uniform3fv(this.prog.uni.uFogCol, this.sky.hor);
    gl.uniform3fv(this.prog.uni.uCamPos, this.camPos);
    gl.uniform1f(this.prog.uni.uFogNear, this.sky.fogNear);
    gl.uniform1f(this.prog.uni.uFogFar, this.sky.fogFar);
    gl.uniform1f(this.prog.uni.uGlow, 0.15 + 0.85 * this.sky.night);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.tex);
    gl.uniform1i(this.prog.uni.uTex, 0);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, this.emiTex);
    gl.uniform1i(this.prog.uni.uEmi, 1);
    this.glows.length = 0; this.flats.length = 0;
  },
  drawMesh: function (mesh, model, o) {
    const gl = this.gl, p = this.prog;
    o = o || {};
    gl.uniformMatrix4fv(p.uni.uModel, false, model);
    gl.uniform3fv(p.uni.uTint, o.tint || WHITE);
    gl.uniform1f(p.uni.uAlpha, o.alpha === undefined ? 1 : o.alpha);
    if (o.blend) { gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE); gl.depthMask(false); }
    function attr(loc, buf, size) { gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0); }
    attr(p.att.aPos, mesh.p, 3); attr(p.att.aNor, mesh.n, 3); attr(p.att.aCol, mesh.c, 3);
    attr(p.att.aUV, mesh.u, 2); attr(p.att.aEmi, mesh.e, 1); attr(p.att.aSpc, mesh.s, 1);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.ib);
    gl.drawElements(gl.TRIANGLES, mesh.count, gl.UNSIGNED_INT, 0);
    if (o.blend) { gl.disable(gl.BLEND); gl.depthMask(true); }
  },
  glow: function (x, y, z, size, r, g, b, a) { this.glows.push([x, y, z, size, r, g, b, a]); },
  flat: function (x, y, z, size, r, g, b, a) { this.flats.push([x, y, z, size, r, g, b, a]); },
  end: function () {
    const gl = this.gl;
    // Flat decals first (shadows, pools): normal blending.
    this.flushSprites(this.flats, true, false);
    // Glow sprites: additive.
    this.flushSprites(this.glows, false, true);
  },
  flushSprites: function (list, flat, additive) {
    if (!list.length) return;
    const gl = this.gl, p = this.sprProg;
    const v = this.view;
    const right = [v[0], v[4], v[8]], up = [v[1], v[5], v[9]];
    const corners = [[-1, -1], [1, -1], [1, 1], [-1, -1], [1, 1], [-1, 1]];
    // Stride: pos(3) corner(2) col(3) size(1) flat(1) alpha(1) = 11 floats.
    const d2 = new Float32Array(list.length * 6 * 11);
    let o = 0;
    for (let i = 0; i < list.length; i++) {
      const s = list[i];
      for (let k = 0; k < 6; k++) {
        d2[o++] = s[0]; d2[o++] = s[1]; d2[o++] = s[2];
        d2[o++] = corners[k][0]; d2[o++] = corners[k][1];
        d2[o++] = s[4]; d2[o++] = s[5]; d2[o++] = s[6];
        d2[o++] = s[3]; d2[o++] = flat ? 1 : 0; d2[o++] = s[7];
      }
    }
    gl.useProgram(p);
    gl.uniformMatrix4fv(p.uni.uProj, false, this.proj);
    gl.uniformMatrix4fv(p.uni.uView, false, this.view);
    gl.uniform3fv(p.uni.uRight, right); gl.uniform3fv(p.uni.uUp, up);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.glowTex);
    gl.uniform1i(p.uni.uTex, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.sprBuf);
    gl.bufferData(gl.ARRAY_BUFFER, d2, gl.DYNAMIC_DRAW);
    const stride = 11 * 4;
    function attr(loc, size, off) { gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, size, gl.FLOAT, false, stride, off * 4); }
    attr(p.att.aPos, 3, 0); attr(p.att.aCorner, 2, 3); attr(p.att.aCol, 3, 5);
    attr(p.att.aSize, 1, 8); attr(p.att.aFlat, 1, 9); attr(p.att.aAlpha, 1, 10);
    gl.enable(gl.BLEND);
    if (additive) { gl.blendFunc(gl.SRC_ALPHA, gl.ONE); gl.depthMask(false); }
    else gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.drawArrays(gl.TRIANGLES, 0, list.length * 6);
    gl.disable(gl.BLEND); gl.depthMask(true);
    gl.useProgram(this.prog);
  },
};
