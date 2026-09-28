import { useEffect, useRef, useState } from 'react';
import type { Node } from '@xyflow/react';

const DURATION = 350;
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

/**
 * Tweens node positions whenever `version` changes (a layout was applied).
 * Ordinary drags pass straight through, so React Flow never sees a stale position.
 */
export function useAnimatedNodes<T extends Node>(nodes: T[], version: number): T[] {
  const [frame, setFrame] = useState<T[] | null>(null);
  const shownRef = useRef<T[]>(nodes);
  const targetRef = useRef<T[]>(nodes);
  const animatingRef = useRef(false);
  const firstVersion = useRef(version);
  targetRef.current = nodes;

  useEffect(() => {
    if (version === firstVersion.current) return;
    const from = new Map(shownRef.current.map(n => [n.id, n.position]));
    const start = performance.now();
    animatingRef.current = true;
    let raf = 0;
    const tick = (now: number) => {
      const target = targetRef.current;
      const t = Math.min(1, (now - start) / DURATION);
      const e = easeOut(t);
      const next = target.map(n => {
        const p = from.get(n.id) ?? n.position;
        return { ...n, position: { x: p.x + (n.position.x - p.x) * e, y: p.y + (n.position.y - p.y) * e } };
      });
      shownRef.current = next;
      if (t < 1) {
        setFrame(next);
        raf = requestAnimationFrame(tick);
      } else {
        animatingRef.current = false;
        setFrame(null);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); animatingRef.current = false; };
  }, [version]);

  useEffect(() => {
    if (!animatingRef.current) shownRef.current = nodes;
  }, [nodes]);

  return frame ?? nodes;
}
