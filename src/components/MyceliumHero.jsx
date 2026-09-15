/**
 * MyceliumHero — WebGL visualization of substitute-on-failure distributed inference.
 *
 * The whole point: viewer sees six worker nodes pooling compute for one chat
 * (token pulses flowing inward to the center). On a slow loop, one worker
 * GOES DARK — and immediately a previously-dormant ambient node LIGHTS UP,
 * extends an edge to the center, and starts emitting pulses. The total pulse
 * throughput reaching the center never drops. Generation never stops.
 *
 * Restraint over flash: additive teal glow on near-black, weighted motion,
 * radar/oscilloscope tone — not party. All bloom is a cheap fake (sprite
 * with radial-gradient texture) — no postprocessing.
 *
 * Dramatic mechanics (post-Track-A amp):
 *  - Dying workers briefly flash amber for ~300ms before fading to dim.
 *  - Rising substitutes scale-bump 1.2× and settle, like a node coming online.
 *  - Token pulses fire in short BURSTS (3–5 every 1.2s), not continuous —
 *    generation feels like discrete tokens, not a stream.
 *  - A live HUD readout bottom-left mirrors the state machine so the
 *    substitute-on-failure mechanic is *legible*, not just decorative.
 *
 * Accessibility: prefers-reduced-motion → single static frame, loop disabled.
 * Canvas is aria-hidden/role=presentation — all meaning lives in the headline.
 *
 * Perf: one Points draw call for nodes (small + large via two Points), one
 * for pulses, one LineSegments for edges. Render loop pauses when off-screen
 * via IntersectionObserver. dpr clamped to [1, 1.75].
 */

import { useFrame, useThree } from '@react-three/fiber';
import HeroCanvas from './HeroCanvas.jsx';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';

/* -------- design tokens (mirror src/styles/global.css) -------- */
/* Brand-aligned: Deep Navy #132a4c + Steel Teal #4a6e7d, brightened for dark UI. */
const COL_SIGNAL  = new THREE.Color('#8FB3C4');   /* active workers — brightened brand steel teal */
const COL_DIM     = new THREE.Color('#5C6976');   /* dormant ambient — cool grey-navy */
const COL_DEAD    = new THREE.Color('#1A2738');   /* dying transition — navy shadow */
const COL_CENTER  = new THREE.Color('#B4D2DE');   /* center query point — brightest accent */
const COL_FLASH   = new THREE.Color('#E8B341');   /* amber — death flash, "system noticed damage" */
const BG_INSET    = new THREE.Color('#050B18');   /* navy-tinted near-black background */

const WORKER_COUNT  = 6;
const AMBIENT_COUNT = 36;
const PULSE_POOL    = 120;
const PULSE_SPEED   = 0.55;     // t units per second (one trip = 1.0 t)

const SWAP_PERIOD_MS_MIN = 5000;
const SWAP_PERIOD_MS_MAX = 7000;
const SWAP_DURATION_MS   = 700;
const FLASH_DURATION_MS  = 320;

const BURST_PERIOD_MS_MIN = 1100;
const BURST_PERIOD_MS_MAX = 1450;
const BURST_PULSE_SPACING_MS = 90;
const BURST_PULSES_MIN = 3;
const BURST_PULSES_MAX = 5;

const RISE_SCALE_PEAK = 1.25;   // substitute rises with this scale, settles to 1.0
const RISE_SCALE_SETTLE_MS = 900;

/* deterministic-ish but jittered seed for irregular ring */
function seedTopology() {
  const center = new THREE.Vector3(0, 0, 0);
  const workers = [];
  for (let i = 0; i < WORKER_COUNT; i++) {
    const a = (i / WORKER_COUNT) * Math.PI * 2 + Math.random() * 0.18;
    const r = 2.2 + (Math.random() - 0.5) * 0.7;
    workers.push(
      new THREE.Vector3(
        Math.cos(a) * r,
        (Math.random() - 0.5) * 0.9,
        Math.sin(a) * r * 0.85,
      ),
    );
  }
  const ambients = [];
  for (let i = 0; i < AMBIENT_COUNT; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = 2.5 + Math.random() * 3.4;
    ambients.push(
      new THREE.Vector3(
        Math.cos(a) * r,
        (Math.random() - 0.5) * 2.6,
        Math.sin(a) * r * 0.9 - 0.8,
      ),
    );
  }
  return { center, workers, ambients };
}

function useGlowTexture() {
  return useMemo(() => {
    const size = 128;
    const c = document.createElement('canvas');
    c.width = size; c.height = size;
    const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0.00, 'rgba(255,255,255,1.00)');
    g.addColorStop(0.15, 'rgba(255,255,255,0.78)');
    g.addColorStop(0.40, 'rgba(255,255,255,0.22)');
    g.addColorStop(0.80, 'rgba(255,255,255,0.04)');
    g.addColorStop(1.00, 'rgba(255,255,255,0.00)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.needsUpdate = true;
    return tex;
  }, []);
}

/* ============================================================
   The scene
   ============================================================ */
function MeshScene({ paused, reducedMotion, pointerNDC, hudRef, swapLogRef }) {
  const glow = useGlowTexture();
  const topo = useMemo(() => seedTopology(), []);
  const groupRef = useRef();

  /*
    Each slot represents a worker currently feeding the center.
    Fields:
      pos:           THREE.Vector3
      state:         'alive' | 'dying' | 'rising'
      t:             0..1   — overall lifecycle progress
      flashT:        0..1   — only during 'dying', 1→0 over FLASH_DURATION_MS
      riseScale:    1..1.25 — only during 'rising', starts at peak, settles
      nextPulseAt:   ms — when this slot fires its next pulse (within burst window)
      burstLeft:     pulses remaining in current burst
      nextBurstAt:   ms — when this slot starts its next burst
  */
  const startTime = useRef(performance.now());
  function nowMs() { return performance.now() - startTime.current; }

  const slots = useRef(
    topo.workers.map((pos, i) => ({
      id: `w-${i}`,
      pos: pos.clone(),
      state: 'alive',
      t: 1,
      flashT: 0,
      riseScale: 1,
      nextPulseAt: i * 90,   // stagger initial pulses
      burstLeft: BURST_PULSES_MAX,
      nextBurstAt: BURST_PERIOD_MS_MIN + Math.random() * (BURST_PERIOD_MS_MAX - BURST_PERIOD_MS_MIN),
    })),
  );
  const dormant = useRef(topo.ambients.map((p) => p.clone()));
  const nextSwapMs = useRef(SWAP_PERIOD_MS_MIN + Math.random() * (SWAP_PERIOD_MS_MAX - SWAP_PERIOD_MS_MIN));
  const swapTimer  = useRef(0);

  const pulses = useRef(
    Array.from({ length: PULSE_POOL }, () => ({ slotId: null, t: 0, intensity: 0 })),
  );

  /* preallocated geometries */
  const brightGeom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(3 * 32), 3));
    g.setAttribute('color',    new THREE.BufferAttribute(new Float32Array(3 * 32), 3));
    return g;
  }, []);

  const centerGeom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(3), 3));
    g.setAttribute('color',    new THREE.BufferAttribute(new Float32Array(3), 3));
    // seed center
    const pos = g.getAttribute('position').array;
    const col = g.getAttribute('color').array;
    pos[0] = 0; pos[1] = 0; pos[2] = 0;
    col[0] = COL_CENTER.r; col[1] = COL_CENTER.g; col[2] = COL_CENTER.b;
    return g;
  }, []);

  const dimGeom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(3 * AMBIENT_COUNT), 3));
    g.setAttribute('color',    new THREE.BufferAttribute(new Float32Array(3 * AMBIENT_COUNT), 3));
    return g;
  }, []);

  const edgesGeom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(3 * 2 * 12), 3));
    g.setAttribute('color',    new THREE.BufferAttribute(new Float32Array(3 * 2 * 12), 3));
    return g;
  }, []);

  const pulseGeom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(3 * PULSE_POOL), 3));
    g.setAttribute('color',    new THREE.BufferAttribute(new Float32Array(3 * PULSE_POOL), 3));
    return g;
  }, []);

  /* materials — sizes bumped for legibility */
  const brightMat = useMemo(() => new THREE.PointsMaterial({
    map: glow, size: 0.85, sizeAttenuation: true,
    transparent: true, depthWrite: false,
    blending: THREE.AdditiveBlending, vertexColors: true,
  }), [glow]);
  const centerMat = useMemo(() => new THREE.PointsMaterial({
    map: glow, size: 1.25, sizeAttenuation: true,
    transparent: true, depthWrite: false,
    blending: THREE.AdditiveBlending, vertexColors: true,
  }), [glow]);
  const dimMat = useMemo(() => new THREE.PointsMaterial({
    map: glow, size: 0.20, sizeAttenuation: true,
    transparent: true, depthWrite: false,
    blending: THREE.AdditiveBlending, vertexColors: true,
  }), [glow]);
  const pulseMat = useMemo(() => new THREE.PointsMaterial({
    map: glow, size: 0.36, sizeAttenuation: true,
    transparent: true, depthWrite: false,
    blending: THREE.AdditiveBlending, vertexColors: true,
  }), [glow]);
  const edgeMat = useMemo(() => new THREE.LineBasicMaterial({
    transparent: true, opacity: 0.55,
    blending: THREE.AdditiveBlending, depthWrite: false,
    vertexColors: true,
  }), []);

  const composeOnce = useRef(false);

  /* ---------- scheduler ---------- */
  function scheduleSwap(dtMs) {
    swapTimer.current += dtMs;
    if (swapTimer.current < nextSwapMs.current) return;
    const aliveSlots = slots.current.filter((s) => s.state === 'alive');
    if (aliveSlots.length === 0) return;
    if (dormant.current.length === 0) return;

    const killIdx = Math.floor(Math.random() * aliveSlots.length);
    const dying = aliveSlots[killIdx];
    dying.state = 'dying';
    dying.flashT = 1;   // start the amber flash

    const substituteIdx = Math.floor(Math.random() * dormant.current.length);
    const newPos = dormant.current.splice(substituteIdx, 1)[0];
    const reborn = {
      id: `r-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      pos: newPos.clone(),
      state: 'rising',
      t: 0,
      flashT: 0,
      riseScale: RISE_SCALE_PEAK,
      nextPulseAt: nowMs() + 220,   // brief delay before substitute starts emitting
      burstLeft: BURST_PULSES_MAX,
      nextBurstAt: BURST_PERIOD_MS_MIN + Math.random() * (BURST_PERIOD_MS_MAX - BURST_PERIOD_MS_MIN),
    };
    slots.current.push(reborn);

    // write event to HUD log
    if (swapLogRef && swapLogRef.current) {
      const ts = new Date();
      const hh = String(ts.getUTCHours()).padStart(2, '0');
      const mm = String(ts.getUTCMinutes()).padStart(2, '0');
      const ss = String(ts.getUTCSeconds()).padStart(2, '0');
      const dyingNum = aliveSlots.length - killIdx;
      const ambientNum = AMBIENT_COUNT - dormant.current.length;
      swapLogRef.current.line = `${hh}:${mm}:${ss} · WORKER ${dyingNum} DOWN · REROUTING → AMBIENT ${String(ambientNum).padStart(2,'0')} · CONTINUITY 100%`;
      swapLogRef.current.expireAt = nowMs() + 3500;
    }

    swapTimer.current = 0;
    nextSwapMs.current = SWAP_PERIOD_MS_MIN + Math.random() * (SWAP_PERIOD_MS_MAX - SWAP_PERIOD_MS_MIN);
  }

  /* ---------- per-frame update ---------- */
  let pulseRateAvg = 0;
  let pulseSpawnedThisSecond = 0;
  let pulseRateTimer = 0;

  useFrame(({ camera }, delta) => {
    if (paused) return;
    if (reducedMotion && composeOnce.current) return;
    const dtMs = delta * 1000;
    const t = nowMs();

    if (!reducedMotion) scheduleSwap(dtMs);

    /* per-slot transition */
    for (let i = slots.current.length - 1; i >= 0; i--) {
      const s = slots.current[i];
      if (s.state === 'dying') {
        s.t -= dtMs / SWAP_DURATION_MS;
        s.flashT = Math.max(0, s.flashT - dtMs / FLASH_DURATION_MS);
        if (s.t <= 0) {
          dormant.current.push(s.pos.clone());
          slots.current.splice(i, 1);
        }
      } else if (s.state === 'rising') {
        s.t += dtMs / SWAP_DURATION_MS;
        // settle scale from RISE_SCALE_PEAK → 1 over RISE_SCALE_SETTLE_MS
        s.riseScale = 1 + (RISE_SCALE_PEAK - 1) * Math.max(0, 1 - s.t * (SWAP_DURATION_MS / RISE_SCALE_SETTLE_MS));
        if (s.t >= 1) { s.t = 1; s.state = 'alive'; s.riseScale = 1; }
      }
    }

    /* cursor parallax */
    if (groupRef.current && !reducedMotion) {
      const tx = pointerNDC.current.y * THREE.MathUtils.degToRad(6);
      const ty = pointerNDC.current.x * THREE.MathUtils.degToRad(6);
      groupRef.current.rotation.x += (tx - groupRef.current.rotation.x) * 0.06;
      groupRef.current.rotation.y += (ty - groupRef.current.rotation.y) * 0.06;
    }

    /* bright nodes buffer — workers only (center is separate) */
    {
      const posAttr = brightGeom.getAttribute('position');
      const colAttr = brightGeom.getAttribute('color');
      const pos = posAttr.array; const col = colAttr.array;

      let writeIdx = 0;
      for (const s of slots.current) {
        if (writeIdx >= 32) break;
        // scale-bump on rising visualized by *moving the node slightly outward* of its position
        // (cheap way to simulate a "pop"). Subtle enough not to disrupt the ring topology.
        const scale = s.riseScale;
        pos[writeIdx * 3 + 0] = s.pos.x * scale;
        pos[writeIdx * 3 + 1] = s.pos.y * scale;
        pos[writeIdx * 3 + 2] = s.pos.z * scale;

        // color resolution:
        //   dying with flashT > 0 → amber blended with current intensity color
        //   else → DIM → SIGNAL by s.t
        let c;
        if (s.state === 'dying' && s.flashT > 0) {
          const base = COL_DIM.clone().lerp(COL_SIGNAL, Math.max(0, s.t));
          c = base.lerp(COL_FLASH, s.flashT);
        } else {
          c = COL_DIM.clone().lerp(COL_SIGNAL, Math.max(0, s.t));
        }
        col[writeIdx * 3 + 0] = c.r;
        col[writeIdx * 3 + 1] = c.g;
        col[writeIdx * 3 + 2] = c.b;
        writeIdx++;
      }
      for (let i = writeIdx; i < 32; i++) {
        pos[i * 3 + 0] = 999; pos[i * 3 + 1] = 999; pos[i * 3 + 2] = 999;
        col[i * 3 + 0] = 0;   col[i * 3 + 1] = 0;   col[i * 3 + 2] = 0;
      }
      posAttr.needsUpdate = true;
      colAttr.needsUpdate = true;
      brightGeom.setDrawRange(0, writeIdx);
    }

    /* dim ambient cloud */
    {
      const posAttr = dimGeom.getAttribute('position');
      const colAttr = dimGeom.getAttribute('color');
      const pos = posAttr.array; const col = colAttr.array;
      let writeIdx = 0;
      for (const p of dormant.current) {
        if (writeIdx >= AMBIENT_COUNT) break;
        pos[writeIdx * 3 + 0] = p.x;
        pos[writeIdx * 3 + 1] = p.y;
        pos[writeIdx * 3 + 2] = p.z;
        col[writeIdx * 3 + 0] = COL_DIM.r * 0.7;
        col[writeIdx * 3 + 1] = COL_DIM.g * 0.7;
        col[writeIdx * 3 + 2] = COL_DIM.b * 0.7;
        writeIdx++;
      }
      for (let i = writeIdx; i < AMBIENT_COUNT; i++) {
        pos[i * 3 + 0] = 999; pos[i * 3 + 1] = 999; pos[i * 3 + 2] = 999;
      }
      posAttr.needsUpdate = true;
      colAttr.needsUpdate = true;
      dimGeom.setDrawRange(0, writeIdx);
    }

    /* edges worker → center */
    {
      const posAttr = edgesGeom.getAttribute('position');
      const colAttr = edgesGeom.getAttribute('color');
      const pos = posAttr.array; const col = colAttr.array;
      let writeIdx = 0;
      for (const s of slots.current) {
        if (writeIdx >= 12) break;
        const scale = s.riseScale;
        pos[writeIdx * 6 + 0] = s.pos.x * scale;
        pos[writeIdx * 6 + 1] = s.pos.y * scale;
        pos[writeIdx * 6 + 2] = s.pos.z * scale;
        pos[writeIdx * 6 + 3] = 0;
        pos[writeIdx * 6 + 4] = 0;
        pos[writeIdx * 6 + 5] = 0;
        const tint = COL_SIGNAL.clone().multiplyScalar(s.t * 0.85);
        col[writeIdx * 6 + 0] = tint.r;
        col[writeIdx * 6 + 1] = tint.g;
        col[writeIdx * 6 + 2] = tint.b;
        col[writeIdx * 6 + 3] = tint.r * 1.6;
        col[writeIdx * 6 + 4] = tint.g * 1.6;
        col[writeIdx * 6 + 5] = tint.b * 1.6;
        writeIdx++;
      }
      posAttr.needsUpdate = true;
      colAttr.needsUpdate = true;
      edgesGeom.setDrawRange(0, writeIdx * 2);
    }

    /* burst-mode pulses — spawn per-slot, not continuous */
    if (!reducedMotion) {
      for (const s of slots.current) {
        if (s.state === 'dying' || s.t < 0.3) continue;
        while (t >= s.nextPulseAt) {
          // try spawn
          const free = pulses.current.find((p) => p.slotId === null);
          if (!free) break;
          free.slotId = s.id;
          free.t = 0;
          free.intensity = Math.min(1, s.t);
          pulseSpawnedThisSecond++;

          s.burstLeft -= 1;
          if (s.burstLeft <= 0) {
            // burst exhausted → schedule next burst
            const period = BURST_PERIOD_MS_MIN + Math.random() * (BURST_PERIOD_MS_MAX - BURST_PERIOD_MS_MIN);
            s.nextBurstAt = t + period;
            s.nextPulseAt = s.nextBurstAt;
            s.burstLeft = BURST_PULSES_MIN + Math.floor(Math.random() * (BURST_PULSES_MAX - BURST_PULSES_MIN + 1));
          } else {
            s.nextPulseAt = t + BURST_PULSE_SPACING_MS;
          }
        }
      }

      for (const p of pulses.current) {
        if (p.slotId === null) continue;
        p.t += delta * PULSE_SPEED;
        if (p.t >= 1) { p.slotId = null; p.t = 0; p.intensity = 0; }
      }
    }

    /* pulse positions buffer */
    {
      const posAttr = pulseGeom.getAttribute('position');
      const colAttr = pulseGeom.getAttribute('color');
      const pos = posAttr.array; const col = colAttr.array;
      let writeIdx = 0;
      const slotMap = new Map();
      for (const s of slots.current) slotMap.set(s.id, s);

      for (const p of pulses.current) {
        if (p.slotId === null) continue;
        const s = slotMap.get(p.slotId);
        if (!s) { p.slotId = null; continue; }
        const pt = p.t;
        const x = s.pos.x * (1 - pt);
        const y = s.pos.y * (1 - pt);
        const z = s.pos.z * (1 - pt);
        pos[writeIdx * 3 + 0] = x;
        pos[writeIdx * 3 + 1] = y;
        pos[writeIdx * 3 + 2] = z;
        const fade = (pt < 0.95) ? 1 : (1 - (pt - 0.95) / 0.05);
        col[writeIdx * 3 + 0] = COL_SIGNAL.r * fade * p.intensity;
        col[writeIdx * 3 + 1] = COL_SIGNAL.g * fade * p.intensity;
        col[writeIdx * 3 + 2] = COL_SIGNAL.b * fade * p.intensity;
        writeIdx++;
      }
      for (let i = writeIdx; i < PULSE_POOL; i++) {
        pos[i * 3 + 0] = 999; pos[i * 3 + 1] = 999; pos[i * 3 + 2] = 999;
      }
      posAttr.needsUpdate = true;
      colAttr.needsUpdate = true;
      pulseGeom.setDrawRange(0, writeIdx);
    }

    /* HUD update — direct DOM mutation, no React re-render */
    if (hudRef && hudRef.current) {
      pulseRateTimer += dtMs;
      if (pulseRateTimer >= 1000) {
        pulseRateAvg = pulseSpawnedThisSecond;
        pulseSpawnedThisSecond = 0;
        pulseRateTimer = 0;
      }
      const aliveCount = slots.current.filter((s) => s.state === 'alive' || s.state === 'rising').length;
      const pulseRateFmt = pulseRateAvg.toFixed(1);
      const continuityPct = aliveCount > 0 ? '100%' : '—';
      const lineA = hudRef.current.querySelector('[data-hud-status]');
      if (lineA) {
        lineA.textContent = `WORKERS ${String(WORKER_COUNT).padStart(2,'0')} · ALIVE ${String(aliveCount).padStart(2,'0')} · ${pulseRateFmt} P/S · CONTINUITY ${continuityPct}`;
      }
      const lineB = hudRef.current.querySelector('[data-hud-event]');
      if (lineB && swapLogRef && swapLogRef.current) {
        if (swapLogRef.current.expireAt > t) {
          lineB.textContent = swapLogRef.current.line;
          lineB.style.opacity = '1';
        } else {
          lineB.style.opacity = '0';
        }
      }
    }

    composeOnce.current = true;
  });

  return (
    <group ref={groupRef}>
      <points geometry={brightGeom} material={brightMat} />
      <points geometry={centerGeom} material={centerMat} />
      <points geometry={dimGeom} material={dimMat} />
      <lineSegments geometry={edgesGeom} material={edgeMat} />
      <points geometry={pulseGeom} material={pulseMat} />
    </group>
  );
}

/* ============================================================
   Outer island
   ============================================================ */
export default function MyceliumHero() {
  const ref = useRef(null);
  const hudRef = useRef(null);
  const swapLogRef = useRef({ line: '', expireAt: 0 });
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const pointerNDC = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const onChange = (e) => setReducedMotion(e.matches);
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);

  useEffect(() => {
    if (!ref.current) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) setPaused(!e.isIntersecting);
      },
      { threshold: 0 },
    );
    io.observe(ref.current);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const isCoarse = window.matchMedia('(hover: none), (pointer: coarse)').matches;
    if (isCoarse) {
      let raf = 0;
      const start = performance.now();
      const tick = (now) => {
        const t = (now - start) * 0.0003;
        pointerNDC.current.x = Math.sin(t) * 0.5;
        pointerNDC.current.y = Math.cos(t * 0.8) * 0.3;
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(raf);
    }
    const onMove = (e) => {
      pointerNDC.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointerNDC.current.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      role="presentation"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
      }}
    >
      <HeroCanvas>
        <color attach="background" args={[0x050B18]} />
        <MeshScene
          paused={paused}
          reducedMotion={reducedMotion}
          pointerNDC={pointerNDC}
          hudRef={hudRef}
          swapLogRef={swapLogRef}
        />
      </HeroCanvas>

      {/* vignette — tightened to 30%/100% so the cluster reads as framed */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background:
            'radial-gradient(ellipse at center, rgba(5,11,24,0) 30%, rgba(5,11,24,0.75) 100%)',
        }}
      />

      {/* HUD overlay removed — the momentum bar at the top of the page already
          carries the moment-of-truth telemetry signal. Less is more in the hero. */}
    </div>
  );
}
