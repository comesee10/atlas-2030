import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import {
  AmbientLight,
  AdditiveBlending,
  BufferGeometry,
  CanvasTexture,
  CircleGeometry,
  CylinderGeometry,
  DirectionalLight,
  Float32BufferAttribute,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  Points,
  PointsMaterial,
  Scene,
  ShaderMaterial,
  SRGBColorSpace,
  WebGLRenderer
} from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

export type PetMood = 'smile' | 'joy' | 'wink' | 'wow' | 'heart' | 'dots' | 'eq' | 'sparkle' | 'sleep';

export type Pet3DHandle = {
  rotate: (dx: number, dy: number) => void;
  kick: () => void;
  run: () => void;
};

const CORAL = 0xff4d2e;
const CORAL_DARK = 0xd63d22;
const CORAL_LIGHT = 0xff7a5c;
const CREAM = 0xfff6ee;
const INK = 0x17120f;

function drawFace(canvas: HTMLCanvasElement, mood: PetMood) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const W = canvas.width;
  const H = canvas.height;
  const ink = '#241a16';
  const light = '#fff6ee';
  ctx.clearRect(0, 0, W, H);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const lx = W * 0.36;
  const rx = W * 0.64;
  const ey = H * 0.46;

  const dot = (x: number, y: number, k = 1) => {
    ctx.fillStyle = ink;
    ctx.beginPath();
    ctx.ellipse(x, y, W * 0.022 * k, H * 0.034 * k, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.75)';
    ctx.beginPath();
    ctx.arc(x - W * 0.006 * k, y - H * 0.012 * k, W * 0.006 * k, 0, Math.PI * 2);
    ctx.fill();
  };
  const arcEye = (x: number, y: number, up = true) => {
    ctx.strokeStyle = ink;
    ctx.lineWidth = H * 0.026;
    ctx.beginPath();
    ctx.arc(x, y + (up ? H * 0.015 : -H * 0.01), W * 0.045, up ? Math.PI * 1.15 : Math.PI * 0.15, up ? Math.PI * 1.85 : Math.PI * 0.85);
    ctx.stroke();
  };
  const blush = () => {
    ctx.fillStyle = 'rgba(255,138,114,.5)';
    ctx.beginPath();
    ctx.ellipse(W * 0.24, H * 0.62, W * 0.042, H * 0.024, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(W * 0.76, H * 0.62, W * 0.042, H * 0.024, 0, 0, Math.PI * 2);
    ctx.fill();
  };
  const mouth = (wide = 1) => {
    ctx.strokeStyle = ink;
    ctx.lineWidth = H * 0.018;
    ctx.beginPath();
    ctx.arc(W / 2, H * 0.6, W * 0.034 * wide, 0.18 * Math.PI, 0.82 * Math.PI);
    ctx.stroke();
  };

  if (mood === 'joy') {
    arcEye(lx, ey, true);
    arcEye(rx, ey, true);
    ctx.strokeStyle = ink;
    ctx.lineWidth = H * 0.02;
    ctx.beginPath();
    ctx.arc(W / 2, H * 0.59, W * 0.05, 0.12 * Math.PI, 0.88 * Math.PI);
    ctx.stroke();
    blush();
  } else if (mood === 'wink') {
    dot(lx, ey, 1);
    arcEye(rx, ey, true);
    mouth(0.9);
    blush();
  } else if (mood === 'wow') {
    ctx.fillStyle = ink;
    ctx.beginPath();
    ctx.ellipse(lx, ey, W * 0.03, H * 0.046, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(rx, ey, W * 0.03, H * 0.046, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.85)';
    ctx.beginPath();
    ctx.arc(lx - W * 0.008, ey - H * 0.016, W * 0.008, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(rx - W * 0.008, ey - H * 0.016, W * 0.008, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(W / 2, H * 0.63, W * 0.016, H * 0.02, 0, 0, Math.PI * 2);
    ctx.fill();
    blush();
  } else if (mood === 'sparkle') {
    const star = (x: number, y: number, r: number) => {
      ctx.fillStyle = ink;
      ctx.beginPath();
      ctx.moveTo(x, y - r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.quadraticCurveTo(x, y, x, y + r);
      ctx.quadraticCurveTo(x, y, x - r, y);
      ctx.quadraticCurveTo(x, y, x, y - r);
      ctx.fill();
    };
    star(lx, ey, W * 0.036);
    star(rx, ey, W * 0.036);
    mouth(0.8);
    blush();
  } else if (mood === 'heart') {
    const heart = (x: number, y: number, s: number) => {
      ctx.fillStyle = ink;
      ctx.beginPath();
      ctx.moveTo(x, y + s * 0.2);
      ctx.bezierCurveTo(x, y - s * 0.15, x - s * 0.5, y - s * 0.15, x - s * 0.5, y + s * 0.2);
      ctx.bezierCurveTo(x - s * 0.5, y + s * 0.5, x, y + s * 0.7, x, y + s * 0.9);
      ctx.bezierCurveTo(x, y + s * 0.7, x + s * 0.5, y + s * 0.5, x + s * 0.5, y + s * 0.2);
      ctx.bezierCurveTo(x + s * 0.5, y - s * 0.15, x, y - s * 0.15, x, y + s * 0.2);
      ctx.fill();
    };
    heart(lx, ey - H * 0.02, H * 0.09);
    heart(rx, ey - H * 0.02, H * 0.09);
  } else if (mood === 'sleep') {
    arcEye(lx, ey, false);
    arcEye(rx, ey, false);
    ctx.fillStyle = ink;
    ctx.font = `600 ${Math.round(H * 0.09)}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('z', W * 0.74, H * 0.3);
    ctx.font = `600 ${Math.round(H * 0.06)}px system-ui, sans-serif`;
    ctx.fillText('z', W * 0.8, H * 0.24);
  } else if (mood === 'dots') {
    ctx.fillStyle = ink;
    [0.43, 0.5, 0.57].forEach((k, i) => {
      ctx.beginPath();
      ctx.arc(W * k, H * 0.52 + (i === 1 ? -H * 0.03 : 0), W * 0.02, 0, Math.PI * 2);
      ctx.fill();
    });
  } else if (mood === 'eq') {
    const bars = [0.55, 0.8, 0.65, 0.95, 0.7];
    ctx.fillStyle = ink;
    bars.forEach((h, i) => {
      const bw = W * 0.03;
      ctx.fillRect(W * (0.4 + i * 0.05), H * 0.62 - H * 0.26 * h, bw, H * 0.26 * h);
    });
    blush();
  } else {
    dot(lx, ey);
    dot(rx, ey);
    mouth(1);
    blush();
  }
}

function makeBadgeTexture() {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const ctx = c.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#fff6ee';
    ctx.fillRect(0, 0, 128, 128);
    ctx.strokeStyle = '#ff4d2e';
    ctx.lineWidth = 10;
    for (let i = -128; i < 256; i += 26) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + 64, 128);
      ctx.stroke();
    }
  }
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  return t;
}

const Pet3D = forwardRef<Pet3DHandle, { mood: PetMood; reduce: boolean }>(function Pet3D({ mood, reduce }, ref) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const moodRef = useRef<PetMood>(mood);
  const reduceRef = useRef(reduce);
  const apiRef = useRef<Pet3DHandle | null>(null);
  moodRef.current = mood;
  reduceRef.current = reduce;

  useImperativeHandle(ref, () => ({
    rotate: (dx, dy) => apiRef.current?.rotate(dx, dy),
    kick: () => apiRef.current?.kick(),
    run: () => apiRef.current?.run()
  }));

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let renderer: WebGLRenderer;
    try {
      renderer = new WebGLRenderer({ alpha: true, antialias: true });
    } catch {
      return;
    }

    const scene = new Scene();
    const camera = new PerspectiveCamera(30, 1, 0.1, 40);
    camera.position.set(0, 0.5, 10);
    camera.lookAt(0, 0.4, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = SRGBColorSpace;
    host.appendChild(renderer.domElement);
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';

    const ambient = new AmbientLight(0xfff4ec, 1.15);
    scene.add(ambient);
    const key = new DirectionalLight(0xffffff, 2.1);
    key.position.set(3, 5, 4);
    scene.add(key);
    const fill = new DirectionalLight(0xffd9cf, 0.7);
    fill.position.set(-4, 1, 2);
    scene.add(fill);

    const root = new Group();
    scene.add(root);

    const coral = new MeshStandardMaterial({ color: CORAL, roughness: 0.55, metalness: 0.05 });
    const coralDark = new MeshStandardMaterial({ color: CORAL_DARK, roughness: 0.6 });
    const coralLight = new MeshStandardMaterial({ color: CORAL_LIGHT, roughness: 0.5 });
    const cream = new MeshStandardMaterial({ color: CREAM, roughness: 0.7 });

    const head = new Mesh(new RoundedBoxGeometry(1.8, 1.5, 0.95, 6, 0.3), coral);
    head.position.set(0, 0.95, 0);
    root.add(head);

    const plate = new Mesh(new RoundedBoxGeometry(1.46, 1.18, 0.14, 5, 0.24), cream);
    plate.position.set(0, 0.95, 0.5);
    root.add(plate);

    const faceCanvas = document.createElement('canvas');
    faceCanvas.width = 512;
    faceCanvas.height = 384;
    drawFace(faceCanvas, moodRef.current);
    const faceTex = new CanvasTexture(faceCanvas);
    faceTex.colorSpace = SRGBColorSpace;
    const faceMat = new MeshBasicMaterial({ map: faceTex, transparent: true });
    const face = new Mesh(new PlaneGeometry(1.36, 1.02), faceMat);
    face.position.set(0, 0.95, 0.575);
    root.add(face);

    const body = new Mesh(new RoundedBoxGeometry(1.02, 0.78, 0.7, 6, 0.3), cream);
    body.position.set(0, -0.14, 0);
    root.add(body);

    const badge = new Mesh(
      new CircleGeometry(0.175, 32),
      new MeshStandardMaterial({ map: makeBadgeTexture(), roughness: 0.6 })
    );
    badge.position.set(0, -0.12, 0.36);
    root.add(badge);
    const badgeRing = new Mesh(new CircleGeometry(0.195, 32), coralDark);
    badgeRing.position.set(0, -0.12, 0.352);
    root.add(badgeRing);

    const makeArm = (side: number) => {
      const arm = new Mesh(new RoundedBoxGeometry(0.26, 0.46, 0.28, 4, 0.12), cream);
      arm.position.set(side * 0.62, -0.14, 0);
      arm.rotation.z = side * -0.22;
      root.add(arm);
      return arm;
    };
    const armR = makeArm(1);
    const armL = makeArm(-1);

    const makeLeg = (side: number) => {
      const g = new Group();
      const leg = new Mesh(new RoundedBoxGeometry(0.26, 0.2, 0.3, 4, 0.09), cream);
      leg.position.y = 0.32;
      g.add(leg);
      const foot = new Mesh(new RoundedBoxGeometry(0.36, 0.2, 0.46, 4, 0.1), new MeshStandardMaterial({ color: 0x2a2420, roughness: 0.7 }));
      foot.position.set(0, 0.12, 0.05);
      g.add(foot);
      g.position.set(side * 0.27, -0.85, 0);
      root.add(g);
      return g;
    };
    const legR = makeLeg(1);
    const legL = makeLeg(-1);

    const makeEar = (side: number) => {
      const ear = new Mesh(new RoundedBoxGeometry(0.2, 0.62, 0.5, 4, 0.12), coralDark);
      ear.position.set(side * 0.95, 0.95, 0);
      root.add(ear);
      const cap = new Mesh(new RoundedBoxGeometry(0.04, 0.42, 0.3, 3, 0.08), coralLight);
      cap.position.set(side * 1.06, 0.95, 0);
      root.add(cap);
    };
    makeEar(1);
    makeEar(-1);

    /* пламя: три шейдерных плоскости + искры */
    const flameUniforms = { uTime: { value: 0 } };
    const flameMat = new ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      uniforms: flameUniforms,
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: `
        uniform float uTime; varying vec2 vUv;
        float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
        float noise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
          return mix(mix(hash(i),hash(i+vec2(1,0)),f.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x), f.y); }
        void main(){
          vec2 uv=vUv;
          float sway = sin(uv.y*5.0 - uTime*2.6) * 0.045;
          float x = (uv.x - 0.5 + sway) * 2.0;
          float width = mix(0.86, 0.10, pow(uv.y, 0.65));
          float body = smoothstep(width, width*0.15, abs(x));
          body *= smoothstep(0.0, 0.10, uv.y);
          body *= smoothstep(1.0, 0.72, uv.y);
          float flameNoise = noise(vec2(uv.x*6.0, uv.y*5.0 - uTime*3.0));
          body *= 0.72 + 0.4 * flameNoise;
          float core = smoothstep(width*0.55, 0.0, abs(x)) * smoothstep(0.06, 0.45, uv.y) * smoothstep(1.0, 0.55, uv.y);
          vec3 col = mix(vec3(1.0,0.24,0.04), vec3(1.0,0.72,0.18), uv.y);
          col = mix(col, vec3(1.0,0.95,0.72), core * 0.85);
          gl_FragColor = vec4(col, clamp(body, 0.0, 1.0));
        }
      `
    });
    const flame = new Group();
    [0, 1, 2].forEach((i) => {
      const plane = new Mesh(new PlaneGeometry(0.9 - i * 0.2, 1.12 - i * 0.18), flameMat.clone());
      plane.position.set(i === 1 ? -0.05 : i === 2 ? 0.05 : 0, 0.56 + i * 0.02, 0.03 + i * 0.012);
      flame.add(plane);
    });
    flame.position.set(0, 1.7, 0.06);
    root.add(flame);
    const socket = new Mesh(new CylinderGeometry(0.2, 0.25, 0.08, 24), coralDark);
    socket.position.set(0, 1.72, 0);
    root.add(socket);

    const sparkGeo = new BufferGeometry();
    const sparkCount = 18;
    const pos = new Float32Array(sparkCount * 3);
    for (let i = 0; i < sparkCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 0.5;
      pos[i * 3 + 1] = 1.7 + Math.random() * 0.8;
      pos[i * 3 + 2] = 0.1 + Math.random() * 0.2;
    }
    sparkGeo.setAttribute('position', new Float32BufferAttribute(pos, 3));
    const sparks = new Points(
      sparkGeo,
      new PointsMaterial({ color: 0xffb36b, size: 0.05, transparent: true, opacity: 0.9, depthWrite: false, blending: AdditiveBlending })
    );
    root.add(sparks);

    let rotTargetX = 0;
    let rotTargetY = 0;
    let rotX = 0;
    let rotY = 0;
    let jump = 0;
    let vy = 0;
    let flash = 0;
    let runT = 0;
    let lastMood = moodRef.current;

    apiRef.current = {
      rotate: (dx, dy) => {
        if (reduceRef.current) return;
        rotTargetY = Math.max(-0.9, Math.min(0.9, rotTargetY + dx));
        rotTargetX = Math.max(-0.45, Math.min(0.45, rotTargetX + dy));
      },
      kick: () => {
        if (reduceRef.current) return;
        vy = 2.6;
        flash = 1;
      },
      run: () => {
        if (reduceRef.current) return;
        runT = 0.8;
        flash = 1;
      }
    };

    const clock = { t: 0, last: performance.now() };
    const resize = () => {
      const w = host.clientWidth || 150;
      const h = host.clientHeight || 183;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(host);

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(0.05, (now - clock.last) / 1000);
      clock.last = now;
      clock.t += dt;
      if (document.hidden) return;

      const t = reduceRef.current ? 0 : clock.t;
      flameUniforms.uTime.value = t;
      flame.children.forEach((m, i) => {
        const mesh = m as Mesh;
        const mat = mesh.material as ShaderMaterial;
        mat.uniforms.uTime.value = t + i * 0.35;
        const s = reduceRef.current ? 1 : 0.94 + Math.sin(t * 7 + i * 1.7) * 0.06;
        mesh.scale.set(s, s, 1);
      });
      flame.visible = true;

      if (!reduceRef.current) {
        jump += vy * dt;
        vy -= 7.8 * dt;
        if (jump < 0) { jump = 0; vy = 0; }
        flash = Math.max(0, flash - dt * 2.2);
        const glow = 1 + flash * 0.55;
        flame.scale.set(glow, glow, 1);
        runT = Math.max(0, runT - dt);
        if (runT > 0) {
          const ph = t * 15;
          legR.rotation.x = Math.sin(ph) * 0.55;
          legL.rotation.x = -Math.sin(ph) * 0.55;
          armR.rotation.x = -Math.sin(ph) * 0.32;
          armL.rotation.x = Math.sin(ph) * 0.32;
          armR.rotation.z = -0.22;
          root.position.y = Math.abs(Math.sin(ph)) * 0.045 + jump;
          root.rotation.x = rotX + 0.07;
        } else {
          legR.rotation.x *= 0.82;
          legL.rotation.x *= 0.82;
          armR.rotation.x *= 0.82;
          armL.rotation.x *= 0.82;
          armR.rotation.z = -0.22 + Math.sin(t * 1.4) * 0.03;
          root.position.y = Math.sin(t * 1.7) * 0.02 + jump;
          root.rotation.x = rotX;
        }
        sparks.rotation.y = t * 0.15;
        const arr = sparkGeo.getAttribute('position') as Float32BufferAttribute;
        for (let i = 0; i < sparkCount; i++) {
          let y = arr.getY(i);
          y += dt * (0.35 + (i % 5) * 0.06);
          if (y > 2.75) y = 1.7;
          arr.setY(i, y);
        }
        arr.needsUpdate = true;
        rotY += (rotTargetY - rotY) * Math.min(1, dt * 6);
        rotX += (rotTargetX - rotX) * Math.min(1, dt * 6);
        root.rotation.y = rotY;
        flame.rotation.y = -rotY;
        flame.rotation.x = -rotX;
        rotTargetY *= 0.985;
        rotTargetX *= 0.985;
      } else {
        root.position.y = 0;
        root.rotation.set(0, 0, 0);
      }

      if (moodRef.current !== lastMood) {
        lastMood = moodRef.current;
        drawFace(faceCanvas, lastMood);
        faceTex.needsUpdate = true;
      }
      renderer.render(scene, camera);
    };
    let raf = 0;
    raf = requestAnimationFrame(tick);

    const onVis = () => { clock.last = performance.now(); };
    document.addEventListener('visibilitychange', onVis);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      renderer.dispose();
      scene.traverse((o) => {
        const mesh = o as Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        const m = mesh.material as MeshStandardMaterial | MeshStandardMaterial[] | undefined;
        if (Array.isArray(m)) m.forEach((x) => x.dispose());
        else if (m) m.dispose();
      });
      host.removeChild(renderer.domElement);
      apiRef.current = null;
    };
  }, []);

  return <div ref={hostRef} className="pet3d" aria-hidden="true" />;
});

export default Pet3D;
