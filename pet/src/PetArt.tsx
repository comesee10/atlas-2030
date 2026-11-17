import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AnimatePresence,
  motion,
  useAnimationControls,
  useReducedMotion
} from 'framer-motion';

export type SkinId = 'coral' | 'mint' | 'sky';

type Skin = {
  id: SkinId;
  name: string;
  body: string;
  dark: string;
  light: string;
  face: string;
};

export const SKINS: Skin[] = [
  { id: 'coral', name: 'Коралл', body: '#ff4d2e', dark: '#d63d22', light: '#ff6b4a', face: '#ffe0d6' },
  { id: 'mint', name: 'Мята', body: '#2fae86', dark: '#23896a', light: '#57c9a4', face: '#dcfff1' },
  { id: 'sky', name: 'Небо', body: '#4a7df0', dark: '#3760c4', light: '#79a0ff', face: '#e2ecff' }
];

type Mood = 'smile' | 'joy' | 'text' | 'hi' | 'dots' | 'heart' | 'q' | 'eq';

const FONT: Record<string, string[]> = {
  P: ['110', '101', '110', '100', '100'],
  A: ['010', '101', '111', '101', '101'],
  T: ['111', '010', '010', '010', '010'],
  H: ['101', '101', '111', '101', '101'],
  W: ['101', '101', '101', '111', '101'],
  Y: ['101', '101', '010', '010', '010'],
  'П': ['111', '101', '101', '101', '101'],
  'Р': ['110', '101', '110', '100', '100'],
  'И': ['101', '101', '111', '101', '101'],
  'В': ['110', '101', '110', '101', '110'],
  'Е': ['111', '100', '110', '100', '111'],
  'Т': ['111', '010', '010', '010', '010'],
  '?': ['010', '001', '010', '000', '010']
};

function wordRects(word: string, x: number, y: number, scale = 1) {
  const out: React.ReactNode[] = [];
  for (let i = 0; i < word.length; i++) {
    const rows = FONT[word[i]] || [];
    for (let r = 0; r < rows.length; r++) {
      for (let c = 0; c < rows[r].length; c++) {
        if (rows[r][c] === '1') {
          out.push(
            <rect
              key={`${word}-${i}-${r}-${c}`}
              x={x + i * 4 * scale + c * scale}
              y={y + r * scale}
              width={scale}
              height={scale}
            />
          );
        }
      }
    }
  }
  return out;
}

export function PetArt({ skin, mood, className }: { skin: Skin; mood: Mood; className?: string }) {
  const show = (m: Mood) => ({ opacity: mood === m ? 1 : 0, transition: 'opacity .16s ease-out' }) as React.CSSProperties;
  const base = skin.face;
  return (
    <svg className={className} viewBox="0 0 72 88" aria-hidden="true" focusable="false">
      <g className="pet-antenna">
        <rect x="34" y="4" width="4" height="11" fill="#1c1a18" />
        <rect x="30" y="0" width="5" height="5" fill={skin.light} />
      </g>
      <rect x="3" y="31" width="7" height="16" fill={skin.dark} />
      <g className="pet-hand">
        <rect x="62" y="31" width="7" height="16" fill={skin.dark} />
        <rect x="62" y="31" width="7" height="3" fill={skin.light} />
      </g>
      <rect x="10" y="13" width="52" height="46" fill={skin.dark} />
      <rect x="12" y="15" width="48" height="42" fill={skin.body} />
      <rect x="12" y="15" width="48" height="4" fill={skin.light} />
      <rect x="16" y="50" width="4" height="1" fill={skin.dark} />
      <rect x="16" y="53" width="4" height="1" fill={skin.dark} />
      <rect x="16" y="56" width="4" height="1" fill={skin.dark} />
      <rect x="18" y="21" width="36" height="26" fill="#2a1c17" />
      <rect x="20" y="23" width="32" height="22" fill="#0f0c0a" />

      <g style={show('smile')} fill={base}>
        <g className="pet-look">
          <g className="pet-eyes">
            <rect x="27" y="29" width="4" height="4" />
            <rect x="41" y="29" width="4" height="4" />
          </g>
        </g>
        <g>
          <rect x="31" y="39" width="2" height="2" />
          <rect x="33" y="41" width="6" height="2" />
          <rect x="39" y="39" width="2" height="2" />
        </g>
      </g>
      <g style={show('joy')} fill={base}>
        <rect x="27" y="30" width="2" height="2" />
        <rect x="29" y="28" width="2" height="2" />
        <rect x="41" y="28" width="2" height="2" />
        <rect x="43" y="30" width="2" height="2" />
        <rect x="30" y="38" width="12" height="2" />
      </g>
      <g style={show('text')} fill={base}>{wordRects('PATHWAY', 22, 28)}</g>
      <g style={show('hi')} fill={base}>{wordRects('ПРИВЕТ', 24, 28)}</g>
      <g style={show('dots')} fill={base}>
        <rect className="pet-dot" x="29" y="33" width="3" height="3" />
        <rect className="pet-dot" x="34" y="33" width="3" height="3" />
        <rect className="pet-dot" x="39" y="33" width="3" height="3" />
      </g>
      <g style={show('heart')} fill={base}>
        <rect x="31" y="28" width="2" height="2" />
        <rect x="39" y="28" width="2" height="2" />
        <rect x="29" y="30" width="14" height="2" />
        <rect x="31" y="32" width="10" height="2" />
        <rect x="33" y="34" width="6" height="2" />
        <rect x="35" y="36" width="2" height="2" />
      </g>
      <g style={show('q')} fill={base}>{wordRects('?', 34, 28)}</g>
      <g style={show('eq')} fill={base} className="pet-eq">
        <rect x="26" y="32" width="3" height="10" />
        <rect x="31" y="29" width="3" height="13" />
        <rect x="36" y="31" width="3" height="11" />
        <rect x="41" y="27" width="3" height="15" />
        <rect x="46" y="30" width="3" height="12" />
      </g>
      <g className="pet-scan" fill={base} opacity=".08">
        <rect x="20" y="25" width="32" height="1" />
        <rect x="20" y="33" width="32" height="1" />
      </g>

      <rect className="pet-leg-a" x="20" y="59" width="9" height="18" fill={skin.dark} />
      <rect className="pet-leg-b" x="43" y="59" width="9" height="18" fill={skin.dark} />
      <rect x="17" y="77" width="14" height="5" fill="#1c1a18" />
      <rect x="41" y="77" width="14" height="5" fill="#1c1a18" />
      <rect x="16" y="84" width="40" height="3" fill="#1c1a18" opacity=".08" />
    </svg>
  );
}
