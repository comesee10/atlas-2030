import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AnimatePresence,
  motion,
  useAnimationControls,
  useReducedMotion
} from 'framer-motion';
import { PetArt, SKINS, type SkinId } from './PetArt';

const SIZE = { w: 150, h: 183 };
const SIZE_MOBILE = { w: 104, h: 127 };
const STORAGE_POS = 'atlas:mascot-pos';
const STORAGE_SKIN = 'atlas:pet-skin';
const STORAGE_HIDDEN = 'atlas:mascot';

type Mood = 'smile' | 'joy' | 'text' | 'hi' | 'dots' | 'heart' | 'q' | 'eq';

function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function readSkin(): SkinId {
  try {
    const v = localStorage.getItem(STORAGE_SKIN);
    if (v === 'mint' || v === 'sky' || v === 'coral') return v;
  } catch {
    /* ignore */
  }
  return 'coral';
}

export default function Pet() {
  const reduce = useReducedMotion();
  const [skinId, setSkinId] = useState<SkinId>(readSkin);
  const [hidden, setHidden] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_HIDDEN) === 'off';
    } catch {
      return false;
    }
  });
  const [mood, setMood] = useState<Mood>('smile');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [celebrate, setCelebrate] = useState(0);
  const [size, setSize] = useState(() =>
    typeof window !== 'undefined' && window.innerWidth <= 760 ? SIZE_MOBILE : SIZE
  );
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [hoveredOnce, setHoveredOnce] = useState(false);
  const dragRef = useRef(false);
  const dragStart = useRef({ x: 0, y: 0, ox: 0, oy: 0, id: 0, moved: false });
  const rafRef = useRef(0);
  const nextOffset = useRef({ x: 0, y: 0 });
  const moodTimer = useRef<number | undefined>(undefined);
  const controls = useAnimationControls();
  const skin = SKINS.find((s) => s.id === skinId) || SKINS[0];

  const clampOffset = useCallback(
    (x: number, y: number, s = size) => {
      const bottom = window.innerWidth <= 760 ? 70 : 24;
      const maxLeft = -(window.innerWidth - s.w - 48);
      const maxUp = -(window.innerHeight - s.h - bottom - 24);
      return { x: Math.min(0, Math.max(maxLeft, x)), y: Math.min(0, Math.max(maxUp, y)) };
    },
    [size]
  );

  /* Позиция: центр питомца в процентах вьюпорта — не ломается при смене размера. */
  useEffect(() => {
    const onResize = () => {
      const s = window.innerWidth <= 760 ? SIZE_MOBILE : SIZE;
      setSize(s);
      const saved = readJson<{ cx: number; cy: number }>(STORAGE_POS);
      if (saved) {
        const left = saved.cx * window.innerWidth - s.w / 2;
        const top = saved.cy * window.innerHeight - s.h / 2;
        setOffset(clampOffset(left - (window.innerWidth - s.w - 24), top - (window.innerHeight - s.h - 24), s));
      } else {
        setOffset(clampOffset(0, 0, s));
      }
    };
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [clampOffset]);

  const savePosition = useCallback(
    (x: number, y: number) => {
      const left = window.innerWidth - size.w - 24 + x;
      const top = window.innerHeight - size.h - 24 + y;
      try {
        localStorage.setItem(
          STORAGE_POS,
          JSON.stringify({
            cx: (left + size.w / 2) / window.innerWidth,
            cy: (top + size.h / 2) / window.innerHeight
          })
        );
      } catch {
        /* ignore */
      }
    },
    [size]
  );

  const setTemporaryMood = useCallback((next: Mood, ms: number, after: Mood = 'smile') => {
    window.clearTimeout(moodTimer.current);
    setMood(next);
    moodTimer.current = window.setTimeout(() => setMood(after), ms);
  }, []);

  const jump = useCallback(() => {
    if (reduce) return;
    controls.start({
      y: [0, -12, 0],
      scaleY: [1, 0.96, 1],
      scaleX: [1, 1.03, 1],
      transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] }
    });
  }, [controls, reduce]);

  /* Приветствие при каждом открытии сайта. */
  useEffect(() => {
    if (hidden || reduce) return;
    const t1 = window.setTimeout(() => {
      setMood('hi');
      jump();
    }, 420);
    const t2 = window.setTimeout(() => setMood('joy'), 1180);
    const t3 = window.setTimeout(() => setMood('smile'), 1820);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Спавн на прежнем месте при переходе между страницами. */
  useEffect(() => {
    const onRoute = () => {
      if (hidden) return;
      setMood('dots');
      window.setTimeout(() => setMood('smile'), 300);
      if (!reduce) {
        controls.start({ scale: [0.96, 1], transition: { type: 'spring', stiffness: 300, damping: 20 } });
      }
    };
    document.addEventListener('atlas:route', onRoute as EventListener);
    return () => {
      document.removeEventListener('atlas:route', onRoute as EventListener);
    };
  }, [hidden]);

  /* Кнопки в меню сайта: выбрать питомца и скрыть/показать. */
  useEffect(() => {
    const hideBtn = document.getElementById('mascotHide');
    const pickBtn = document.getElementById('petPick');
    const syncLabel = () => {
      if (!hideBtn) return;
      let isHidden = false;
      try {
        isHidden = localStorage.getItem(STORAGE_HIDDEN) === 'off';
      } catch {
        /* ignore */
      }
      hideBtn.textContent = isHidden ? 'Показать питомца' : 'Скрыть питомца';
    };
    syncLabel();
    const onHide = () => {
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
    const onPick = () => setPickerOpen(true);
    hideBtn?.addEventListener('click', onHide);
    pickBtn?.addEventListener('click', onPick);
    return () => {
      hideBtn?.removeEventListener('click', onHide);
      pickBtn?.removeEventListener('click', onPick);
    };
  }, []);

  useEffect(() => {
    const hideBtn = document.getElementById('mascotHide');
    if (hideBtn) hideBtn.textContent = hidden ? 'Показать питомца' : 'Скрыть питомца';
  }, [hidden]);

  const onHoverStart = () => {
    if (dragRef.current || reduce) return;
    jump();
    if (!hoveredOnce) {
      setHoveredOnce(true);
      setTemporaryMood('q', 600, 'text');
      window.setTimeout(() => setMood('smile'), 2200);
    } else {
      setTemporaryMood('text', 1900);
    }
  };

  const onTap = () => {
    if (reduce) return;
    setTemporaryMood('joy', 900);
    jump();
    /* короткая волна лапкой */
    const el = document.getElementById('pet-root');
    el?.classList.add('pet-wave');
    window.setTimeout(() => el?.classList.remove('pet-wave'), 1100);
  };

  const chooseSkin = (next: SkinId, event: React.MouseEvent<HTMLButtonElement>) => {
    const card = event.currentTarget;
    const rect = card.getBoundingClientRect();
    const ripple = document.createElement('span');
    ripple.className = 'tw-ripple';
    const d = Math.max(rect.width, rect.height);
    ripple.style.width = ripple.style.height = d + 'px';
    ripple.style.left = event.clientX - rect.left - d / 2 + 'px';
    ripple.style.top = event.clientY - rect.top - d / 2 + 'px';
    card.appendChild(ripple);
    window.setTimeout(() => ripple.remove(), 600);
    setSkinId(next);
    try {
      localStorage.setItem(STORAGE_SKIN, next);
    } catch {
      /* ignore */
    }
    if (reduce) return;
    setCelebrate((n) => n + 1);
    setTemporaryMood('joy', 1200);
    jump();
    window.setTimeout(() => setPickerOpen(false), 750);
  };

  /* Редкая пасхалка: сердце раз в 1,5–3 минуты. */
  useEffect(() => {
    if (reduce || hidden) return;
    let timer = 0;
    const schedule = () => {
      timer = window.setTimeout(() => {
        setMood((m) => (m === 'smile' ? 'heart' : m));
        window.setTimeout(() => setMood('smile'), 1800);
        schedule();
      }, 90000 + Math.random() * 90000);
    };
    schedule();
    return () => window.clearTimeout(timer);
  }, [reduce, hidden]);

  useEffect(() => () => window.clearTimeout(moodTimer.current), []);

  useEffect(() => {
    if (!celebrate) return;
    const t = window.setTimeout(() => setCelebrate(0), 1300);
    return () => window.clearTimeout(t);
  }, [celebrate]);

  return (
    <>
      <AnimatePresence>
        {!hidden && (
          <motion.div
            key="pet"
            className="pet-root"
            initial={{ opacity: 0, scale: reduce ? 0.98 : 0.86 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: reduce ? 0.98 : 0.88, transition: { duration: reduce ? 0 : 0.22 } }}
            transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 220, damping: 20, mass: 0.8 }}
            onPointerDown={(e) => {
              if (e.button && e.button !== 0) return;
              dragRef.current = true;
              dragStart.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y, id: e.pointerId, moved: false };
              try {
                (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
              } catch {
                /* синтетические события без активного указателя */
              }
              setMood('eq');
              e.preventDefault();
            }}
            onPointerMove={(e) => {
              if (!dragRef.current || e.pointerId !== dragStart.current.id) return;
              const dx = e.clientX - dragStart.current.x;
              const dy = e.clientY - dragStart.current.y;
              if (Math.abs(dx) > 4 || Math.abs(dy) > 4) dragStart.current.moved = true;
              if (!dragStart.current.moved) return;
              nextOffset.current = clampOffset(dragStart.current.ox + dx, dragStart.current.oy + dy);
              if (rafRef.current) return;
              rafRef.current = window.requestAnimationFrame(() => {
                rafRef.current = 0;
                setOffset(nextOffset.current);
              });
              e.preventDefault();
            }}
            onPointerUp={(e) => {
              if (!dragRef.current || e.pointerId !== dragStart.current.id) return;
              dragRef.current = false;
              try {
                (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
              } catch {
                /* ignore */
              }
              if (dragStart.current.moved) {
                const p = clampOffset(nextOffset.current.x, nextOffset.current.y);
                setOffset(p);
                savePosition(p.x, p.y);
                setMood('smile');
              } else {
                onTap();
              }
            }}
            onPointerCancel={() => {
              dragRef.current = false;
              setMood('smile');
            }}
            onHoverStart={onHoverStart}
            style={{
              position: 'fixed',
              left: window.innerWidth - size.w - 24 + offset.x,
              top: window.innerHeight - size.h - (window.innerWidth <= 760 ? 70 : 24) + offset.y,
              width: size.w,
              height: size.h,
              touchAction: 'none',
              zIndex: 80,
              cursor: dragRef.current ? 'grabbing' : 'grab'
            }}
            aria-label="Питомец Pathway"
            role="img"
          >
            <motion.div animate={controls} style={{ width: '100%', height: '100%' }}>
              <motion.div
                animate={
                  reduce
                    ? undefined
                    : { y: [0, -2, 0], rotate: [0, 0.6, 0, -0.6, 0] }
                }
                transition={reduce ? undefined : { duration: 4.2, repeat: Infinity, ease: 'easeInOut' }}
                style={{ width: '100%', height: '100%' }}
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={skin.id}
                    initial={{ opacity: 0, scale: reduce ? 1 : 0.82 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: reduce ? 1 : 0.86 }}
                    transition={
                      reduce ? { duration: 0 } : { type: 'spring', stiffness: 260, damping: 18, mass: 0.7 }
                    }
                    style={{ width: '100%', height: '100%' }}
                  >
                    <PetArt skin={skin} mood={mood} className="pet-svg" />
                  </motion.div>
                </AnimatePresence>
              </motion.div>
            </motion.div>
            <Confetti burst={celebrate} reduce={!!reduce} />
            {celebrate > 0 && !reduce && (
              <span key={'glow-' + celebrate} className="pet-glow" aria-hidden />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {pickerOpen && (
          <Picker onClose={() => setPickerOpen(false)} onPick={chooseSkin} current={skinId} reduce={!!reduce} />
        )}
      </AnimatePresence>
    </>
  );
}

function Confetti({ burst, reduce }: { burst: number; reduce: boolean }) {
  if (reduce || !burst) return null;
  const colors = ['#ff4d2e', '#2fae86', '#4a7df0', '#f5c542', '#ffffff'];
  return (
    <span key={burst} aria-hidden className="pet-confetti">
      {Array.from({ length: 14 }).map((_, i) => {
        const angle = (Math.PI * 2 * i) / 14 + Math.random() * 0.3;
        const dist = 44 + Math.random() * 46;
        return (
          <motion.span
            key={i}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{ x: Math.cos(angle) * dist, y: Math.sin(angle) * dist - 10, opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.85, ease: 'easeOut' }}
            style={{ position: 'absolute', left: '50%', top: '45%', width: 7, height: 7, borderRadius: 2, background: colors[i % colors.length] }}
          />
        );
      })}
    </span>
  );
}

function Picker({
  current,
  onPick,
  onClose,
  reduce
}: {
  current: SkinId;
  onPick: (id: SkinId, e: React.MouseEvent<HTMLButtonElement>) => void;
  onClose: () => void;
  reduce: boolean;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <motion.div
      className="tw-fixed tw-inset-0 tw-z-[95] tw-flex tw-items-end tw-justify-center tw-p-4 sm:tw-items-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduce ? 0 : 0.18 }}
    >
      <button
        type="button"
        aria-label="Закрыть выбор питомца"
        onClick={onClose}
        className="tw-absolute tw-inset-0 tw-bg-black/30 tw-backdrop-blur-[2px]"
        style={{ cursor: 'pointer', border: 0 }}
      />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label="Выбор питомца"
        className="tw-relative tw-w-[92vw] tw-max-w-[400px] tw-rounded-3xl tw-bg-[#fbf8f3] tw-p-5 tw-shadow-2xl tw-border tw-border-black/10"
        initial={{ y: reduce ? 0 : 18, scale: reduce ? 1 : 0.97, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
        exit={{ y: reduce ? 0 : 12, opacity: 0 }}
        transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 260, damping: 24 }}
      >
        <div className="tw-flex tw-items-start tw-justify-between tw-gap-3">
          <div>
            <p className="tw-m-0 tw-text-[10px] tw-font-semibold tw-uppercase tw-tracking-[0.14em] tw-text-[#8a837a]">
              Питомец
            </p>
            <h2 className="tw-m-0 tw-mt-1 tw-text-[22px] tw-font-bold tw-leading-tight tw-text-[#171614]">
              Выберите спутника
            </h2>
            <p className="tw-m-0 tw-mt-1 tw-text-[13px] tw-leading-snug tw-text-[#6b645c]">
              Он живёт на всех страницах, перетаскивается и запоминает место.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть"
            className="tw-flex tw-h-8 tw-w-8 tw-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-black/10 tw-bg-white tw-text-[16px] tw-text-[#6b645c] hover:tw-bg-black/5"
          >
            ×
          </button>
        </div>
        <div className="tw-mt-4 tw-grid tw-grid-cols-3 tw-gap-3">
          {SKINS.map((s) => {
            const active = s.id === current;
            return (
              <motion.button
                key={s.id}
                type="button"
                onClick={(e) => onPick(s.id, e)}
                whileTap={reduce ? undefined : { scale: 0.96 }}
                whileHover={reduce ? undefined : { y: -2 }}
                aria-pressed={active}
                className={
                  'tw-relative tw-overflow-hidden tw-rounded-2xl tw-border tw-bg-white tw-p-3 tw-shadow-sm tw-transition-shadow hover:tw-shadow-md ' +
                  (active ? 'tw-border-[#ff4d2e] tw-ring-2 tw-ring-[#ff4d2e]/25' : 'tw-border-black/10')
                }
                style={{ cursor: 'pointer' }}
              >
                <span className="tw-block tw-h-[86px]">
                  <PetArt skin={s} mood="smile" className="tw-h-full tw-w-full" />
                </span>
                <span className="tw-mt-2 tw-block tw-text-[13px] tw-font-semibold tw-text-[#171614]">{s.name}</span>
                <span className="tw-mt-0.5 tw-block tw-text-[10px] tw-uppercase tw-tracking-[0.08em] tw-text-[#8a837a]">
                  {active ? 'выбран' : 'выбрать'}
                </span>
              </motion.button>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
}
