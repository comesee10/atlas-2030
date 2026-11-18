import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useAnimationControls, useReducedMotion } from 'framer-motion';
import Pet3D, { type Pet3DHandle, type PetMood } from './Pet3D';
import { PetArt, SKINS } from './PetArt';

const SIZE = { w: 190, h: 232 };
const SIZE_MOBILE = { w: 132, h: 161 };
const STORAGE_POS = 'atlas:mascot-pos';
const STORAGE_HIDDEN = 'atlas:mascot';

const MICRO: PetMood[] = ['wink', 'wow', 'sparkle', 'heart'];

function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

export default function Pet() {
  const reduce = useReducedMotion();
  const [hidden, setHidden] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_HIDDEN) === 'off';
    } catch {
      return false;
    }
  });
  const [mood, setMood] = useState<PetMood>('smile');
  const [bubble, setBubble] = useState(false);
  const [size, setSize] = useState(() =>
    typeof window !== 'undefined' && window.innerWidth <= 760 ? SIZE_MOBILE : SIZE
  );
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [webgl] = useState(hasWebGL);
  const dragRef = useRef({ active: false, id: 0, sx: 0, sy: 0, ox: 0, oy: 0, moved: false, rotate: false });
  const rafRef = useRef(0);
  const nextOffset = useRef({ x: 0, y: 0 });
  const moodTimer = useRef<number | undefined>(undefined);
  const bubbleTimer = useRef<number | undefined>(undefined);
  const idleTimer = useRef<number | undefined>(undefined);
  const lastTouch = useRef(Date.now());
  const petApi = useRef<Pet3DHandle | null>(null);
  const controls = useAnimationControls();
  const fallback = SKINS[0];

  const clampOffset = useCallback((x: number, y: number, s = size) => {
    const pad = window.innerWidth <= 760 ? 70 : 24;
    return {
      x: Math.min(0, Math.max(-(window.innerWidth - s.w - 48), x)),
      y: Math.min(0, Math.max(-(window.innerHeight - s.h - pad), y))
    };
  }, [size]);

  const savePosition = useCallback((x: number, y: number) => {
    const pad = window.innerWidth <= 760 ? 70 : 24;
    const left = window.innerWidth - size.w - 24 + x;
    const top = window.innerHeight - size.h - pad + y;
    try {
      localStorage.setItem(
        STORAGE_POS,
        JSON.stringify({ cx: (left + size.w / 2) / window.innerWidth, cy: (top + size.h / 2) / window.innerHeight })
      );
    } catch {
      /* ignore */
    }
  }, [size]);

  useEffect(() => {
    const onResize = () => {
      const s = window.innerWidth <= 760 ? SIZE_MOBILE : SIZE;
      setSize(s);
      const saved = readJson<{ cx: number; cy: number }>(STORAGE_POS);
      const pad = window.innerWidth <= 760 ? 70 : 24;
      if (saved) {
        const left = saved.cx * window.innerWidth - s.w / 2;
        const top = saved.cy * window.innerHeight - s.h / 2;
        setOffset(clampOffset(left - (window.innerWidth - s.w - 24), top - (window.innerHeight - s.h - pad), s));
      } else {
        setOffset(clampOffset(0, 0, s));
      }
    };
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [clampOffset]);

  const showBubble = useCallback((ms = 2600) => {
    setBubble(true);
    window.clearTimeout(bubbleTimer.current);
    bubbleTimer.current = window.setTimeout(() => setBubble(false), ms);
  }, []);

  const temporaryMood = useCallback((next: PetMood, ms: number) => {
    window.clearTimeout(moodTimer.current);
    setMood(next);
    moodTimer.current = window.setTimeout(() => setMood('smile'), ms);
  }, []);

  const jump = useCallback(() => {
    if (reduce) return;
    controls.start({
      y: [0, -8, 0],
      scaleY: [1, 0.97, 1],
      scaleX: [1, 1.02, 1],
      transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] }
    });
    petApi.current?.kick();
  }, [controls, reduce]);

  /* приветствие при открытии: вспышка пламени и прыжок */
  useEffect(() => {
    if (hidden || reduce) return;
    const t1 = window.setTimeout(() => {
      setMood('joy');
      jump();
    }, 450);
    const t2 = window.setTimeout(() => setMood('smile'), 1900);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* PATHWAY — один раз за открытие сайта */
  useEffect(() => {
    if (hidden) return;
    const t = window.setTimeout(() => showBubble(2800), 1500);
    return () => window.clearTimeout(t);
  }, [hidden, showBubble]);

  /* случайная мимика, сон при простое */
  useEffect(() => {
    if (hidden || reduce) return;
    const loop = () => {
      idleTimer.current = window.setTimeout(() => {
        const idle = Date.now() - lastTouch.current;
        if (document.hidden || dragRef.current.active) {
          loop();
          return;
        }
        if (idle > 60000) {
          setMood('sleep');
          window.setTimeout(() => setMood('smile'), 2400);
        } else if (mood === 'smile') {
          const pick = MICRO[Math.floor(Math.random() * MICRO.length)];
          temporaryMood(pick, 1100);
        }
        loop();
      }, 9000 + Math.random() * 7000);
    };
    loop();
    return () => window.clearTimeout(idleTimer.current);
  }, [hidden, reduce, mood, temporaryMood]);

  /* спавн на прежнем месте и пробежка при переходах */
  useEffect(() => {
    const onRoute = () => {
      if (hidden) return;
      setMood('dots');
      window.setTimeout(() => setMood('smile'), 320);
      petApi.current?.run();
      if (!reduce) {
        controls.start({ scale: [0.98, 1], transition: { type: 'spring', stiffness: 300, damping: 20 } });
      }
    };
    document.addEventListener('atlas:route', onRoute as EventListener);
    return () => document.removeEventListener('atlas:route', onRoute as EventListener);
  }, [hidden, reduce, controls]);

  /* меню: скрыть/показать */
  useEffect(() => {
    const hideBtn = document.getElementById('mascotHide');
    if (hideBtn) hideBtn.textContent = hidden ? 'Показать питомца' : 'Скрыть питомца';
    const onClick = () => {
      setHidden((prev) => {
        const next = !prev;
        try {
          localStorage.setItem(STORAGE_HIDDEN, next ? 'off' : 'on');
        } catch {
          /* ignore */
        }
        return next;
      });
    };
    hideBtn?.addEventListener('click', onClick);
    return () => hideBtn?.removeEventListener('click', onClick);
  }, [hidden]);

  const onHover = () => {
    if (reduce || dragRef.current.active) return;
    lastTouch.current = Date.now();
    jump();
    temporaryMood('wow', 520);
  };

  const onTap = () => {
    if (reduce) return;
    lastTouch.current = Date.now();
    petApi.current?.run();
    setMood('eq');
    window.setTimeout(() => setMood('joy'), 700);
    window.setTimeout(() => setMood('smile'), 1150);
  };

  return (
    <>
      <AnimatePresence>
        {!hidden && (
          <motion.div
            key="pet"
            className="pet-root"
            initial={{ opacity: 0, scale: reduce ? 0.98 : 0.86 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: reduce ? 0.98 : 0.88, transition: { duration: reduce ? 0 : 0.2 } }}
            transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 220, damping: 20, mass: 0.8 }}
            onPointerDown={(e) => {
              if (e.button && e.button !== 0) return;
              lastTouch.current = Date.now();
              dragRef.current = {
                active: true,
                id: e.pointerId,
                sx: e.clientX,
                sy: e.clientY,
                ox: offset.x,
                oy: offset.y,
                moved: false,
                rotate: e.shiftKey || e.altKey
              };
              try {
                (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
              } catch {
                /* ignore */
              }
              setMood('eq');
              e.preventDefault();
            }}
            onPointerMove={(e) => {
              const d = dragRef.current;
              if (!d.active || e.pointerId !== d.id) return;
              lastTouch.current = Date.now();
              const dx = e.clientX - d.sx;
              const dy = e.clientY - d.sy;
              if (Math.abs(dx) > 4 || Math.abs(dy) > 4) d.moved = true;
              if (d.rotate) {
                petApi.current?.rotate(dx * 0.006, dy * 0.004);
              } else if (d.moved) {
                nextOffset.current = clampOffset(d.ox + dx, d.oy + dy);
                if (!rafRef.current) {
                  rafRef.current = window.requestAnimationFrame(() => {
                    rafRef.current = 0;
                    setOffset(nextOffset.current);
                  });
                }
              }
              e.preventDefault();
            }}
            onPointerUp={(e) => {
              const d = dragRef.current;
              if (!d.active || e.pointerId !== d.id) return;
              dragRef.current.active = false;
              try {
                (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
              } catch {
                /* ignore */
              }
              if (d.moved && !d.rotate) {
                const p = clampOffset(nextOffset.current.x, nextOffset.current.y);
                setOffset(p);
                savePosition(p.x, p.y);
              } else if (!d.moved) {
                onTap();
              }
              setMood('smile');
            }}
            onPointerCancel={() => {
              dragRef.current.active = false;
              setMood('smile');
            }}
            onHoverStart={onHover}
            onDoubleClick={() => {
              lastTouch.current = Date.now();
              setOffset(clampOffset(0, 0));
              savePosition(0, 0);
              setMood('smile');
            }}
            style={{
              position: 'fixed',
              right: 24 - offset.x,
              bottom: (window.innerWidth <= 760 ? 70 : 24) - offset.y,
              width: size.w,
              height: size.h,
              touchAction: 'none',
              zIndex: 80,
              cursor: dragRef.current.rotate ? 'ew-resize' : 'grab'
            }}
            role="img"
            aria-label="Питомец Pathway"
          >
            <AnimatePresence>
              {bubble && (
                <motion.div
                  key="bubble"
                  className="pet-thought"
                  initial={{ opacity: 0, y: 8, scale: 0.92 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.96 }}
                  transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 320, damping: 22 }}
                >
                  PATHWAY
                </motion.div>
              )}
            </AnimatePresence>
            <motion.div animate={controls} style={{ width: '100%', height: '100%' }}>
              {webgl ? (
                <Pet3D ref={petApi} mood={mood} reduce={!!reduce} />
              ) : (
                <PetArt skin={fallback} mood="smile" className="pet-svg" />
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
