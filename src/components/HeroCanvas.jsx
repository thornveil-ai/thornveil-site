import { Component, useEffect, useRef, useState } from 'react';
import { createRoot, extend } from '@react-three/fiber';
import * as THREE from 'three';

extend(THREE);

class SceneBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error) { this.props.onError(error); }
  render() { return this.state.failed ? null : this.props.children; }
}

/**
 * Own the async R3F setup so renderer failures cannot escape as unhandled
 * rejections. The server-rendered SVG beneath this canvas remains the fallback.
 */
export default function HeroCanvas({ children }) {
  const canvasRef = useRef(null);
  const rootRef = useRef(null);
  const childrenRef = useRef(children);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  childrenRef.current = children;

  useEffect(() => {
    if (failed) return;
    const canvas = canvasRef.current;
    let disposed = false;
    let renderer;
    let root;
    let observer;
    const fail = (error) => {
      if (disposed) return;
      console.warn('Hero graphics unavailable; showing static mesh.', error);
      setReady(false);
      setFailed(true);
    };
    const lost = (event) => {
      event.preventDefault();
      fail(new Error('WebGL context lost'));
    };
    canvas.addEventListener('webglcontextlost', lost);

    const initialize = async () => {
      try {
        // Create the real renderer, not a disposable capability probe.
        renderer = new THREE.WebGLRenderer({
          canvas, antialias: true, alpha: true, powerPreference: 'high-performance',
        });
        root = createRoot(canvas);
        const { width, height } = canvas.parentElement.getBoundingClientRect();
        await root.configure({
          gl: renderer,
          dpr: [1, 1.75],
          camera: { position: [0, 0.2, 6.5], fov: 38, near: 0.1, far: 50 },
          size: { width, height, top: 0, left: 0 },
          onCreated: () => { if (!disposed) setReady(true); },
        });
        if (disposed) { root.unmount(); return; }
        rootRef.current = root;
        const store = root.render(<SceneBoundary onError={fail}>{childrenRef.current}</SceneBoundary>);
        observer = new ResizeObserver(([entry]) => {
          const { width, height } = entry.contentRect;
          store.getState().setSize(width, height);
        });
        observer.observe(canvas.parentElement);
      } catch (error) {
        fail(error);
      }
    };
    void initialize();
    return () => {
      disposed = true;
      observer?.disconnect();
      canvas.removeEventListener('webglcontextlost', lost);
      rootRef.current = null;
      root?.unmount();
      renderer?.dispose();
    };
  }, [failed]);

  useEffect(() => {
    if (!failed && rootRef.current) {
      // Keep the boundary and its error handler from the initial render.
      rootRef.current.render(
        <SceneBoundary onError={() => { setReady(false); setFailed(true); }}>
          {children}
        </SceneBoundary>,
      );
    }
  }, [children, failed]);

  return <canvas ref={canvasRef} data-hero-renderer={failed ? 'fallback' : ready ? 'ready' : 'loading'}
    style={{ display: 'block', width: '100%', height: '100%', visibility: ready && !failed ? 'visible' : 'hidden' }} />;
}