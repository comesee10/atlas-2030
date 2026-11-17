import React from 'react';

export type SkinId = 'coral' | 'mint' | 'sky';

export type Skin = {
  id: SkinId;
  name: string;
  body: string;
  dark: string;
  light: string;
  face: string;
};

export const SKINS: Skin[] = [
  { id: 'coral', name: 'Коралл', body: '#ff4d2e', dark: '#d63d22', light: '#ff7a5c', face: '#ffe6db' },
  { id: 'mint', name: 'Мята', body: '#2fae86', dark: '#1f8a69', light: '#5ecfa8', face: '#e2fff4' },
  { id: 'sky', name: 'Небо', body: '#4a7df0', dark: '#345fc4', light: '#82a6ff', face: '#e8efff' }
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
              rx={scale > 1 ? 0.4 : 0}
            />
          );
        }
      }
    }
  }
  return out;
}

export function PetArt({ skin, mood, className }: { skin: Skin; mood: Mood; className?: string }) {
  const show = (m: Mood) =>
    ({ opacity: mood === m ? 1 : 0, transition: 'opacity .16s ease-out' }) as React.CSSProperties;
  const gid = `pet-${skin.id}`;
  return (
    <svg className={className} viewBox="0 0 120 146" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={`${gid}-body`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={skin.light} />
          <stop offset="0.45" stopColor={skin.body} />
          <stop offset="1" stopColor={skin.dark} />
        </linearGradient>
        <linearGradient id={`${gid}-screen`} x1="0" y1="0" x2="0.6" y2="1">
          <stop offset="0" stopColor="#241a15" />
          <stop offset="1" stopColor="#0f0c0a" />
        </linearGradient>
        <linearGradient id={`${gid}-cream`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff9f4" />
          <stop offset="1" stopColor="#f0e2d8" />
        </linearGradient>
      </defs>

      {/* мягкая тень под ногами */}
      <ellipse cx="60" cy="143" rx="33" ry="3.2" fill="#1c1a18" opacity=".10" />

      {/* антенна */}
      <g className="pet-antenna">
        <rect x="56" y="13" width="8" height="6" rx="2" fill={skin.dark} />
        <rect x="58" y="6" width="4" height="9" rx="2" fill="#1c1a18" />
        <circle cx="60" cy="4" r="9" fill={skin.light} opacity=".18" />
        <circle cx="60" cy="4" r="5" fill={skin.light} />
      </g>

      {/* ушки-наушники */}
      <rect x="2" y="47" width="13" height="28" rx="6.5" fill={skin.dark} />
      <rect x="5" y="51" width="5" height="14" rx="2.5" fill={skin.light} opacity=".55" />
      <rect x="105" y="47" width="13" height="28" rx="6.5" fill={skin.dark} />
      <rect x="110" y="51" width="5" height="14" rx="2.5" fill={skin.light} opacity=".55" />

      {/* голова */}
      <rect x="12" y="14" width="96" height="88" rx="26" fill={`url(#${gid}-body)`} stroke={skin.dark} strokeOpacity=".55" strokeWidth="1.4" />
      <rect x="19" y="20" width="82" height="14" rx="7" fill="#ffffff" opacity=".14" />

      {/* экран */}
      <rect x="22" y="26" width="76" height="62" rx="17" fill={`url(#${gid}-screen)`} stroke="#000" strokeOpacity=".45" strokeWidth="2" />
      <rect x="25" y="29" width="70" height="56" rx="14" fill="#000" opacity=".18" />
      <rect x="27" y="31" width="66" height="12" rx="6" fill="#ffffff" opacity=".05" />

      {/* лицо: улыбка */}
      <g style={show('smile')}>
        <g className="pet-look">
          <g className="pet-eyes">
            <ellipse cx="43" cy="52" rx="7.4" ry="9.2" fill="#fff8f3" />
            <ellipse cx="77" cy="52" rx="7.4" ry="9.2" fill="#fff8f3" />
            <circle cx="43.5" cy="54" r="3.4" fill="#241a15" />
            <circle cx="77.5" cy="54" r="3.4" fill="#241a15" />
            <circle cx="40.6" cy="48.4" r="2" fill="#fff" opacity=".95" />
            <circle cx="74.6" cy="48.4" r="2" fill="#fff" opacity=".95" />
          </g>
        </g>
        <ellipse cx="28" cy="65" rx="6.4" ry="3.6" fill="#ff8a72" opacity=".5" />
        <ellipse cx="92" cy="65" rx="6.4" ry="3.6" fill="#ff8a72" opacity=".5" />
        <path d="M55.5 66 Q60 70.5 64.5 66" fill="none" stroke="#ffe0d6" strokeWidth="2.6" strokeLinecap="round" />
      </g>

      {/* радость ^ ^ */}
      <g style={show('joy')} stroke="#fff8f3" strokeWidth="3.4" strokeLinecap="round" fill="none">
        <path d="M36 54 Q43 45 50 54" />
        <path d="M70 54 Q77 45 84 54" />
        <path d="M53 64 Q60 71 67 64" />
      </g>

      <g style={show('text')} fill="#ffe0d6">{wordRects('PATHWAY', 33, 47, 2)}</g>
      <g style={show('hi')} fill="#ffe0d6">{wordRects('ПРИВЕТ', 37, 47, 2)}</g>

      <g style={show('dots')} fill="#ffe0d6">
        <rect className="pet-dot" x="50" y="57" width="6" height="6" rx="2" />
        <rect className="pet-dot" x="57" y="57" width="6" height="6" rx="2" />
        <rect className="pet-dot" x="64" y="57" width="6" height="6" rx="2" />
      </g>

      <g style={show('heart')} fill="#ffe0d6">
        <path d="M60 71 L51 62 A6.5 6.5 0 0 1 60 56 A6.5 6.5 0 0 1 69 62 Z" />
      </g>

      <g style={show('q')} fill="#ffe0d6">{wordRects('?', 56, 45, 3)}</g>

      <g style={show('eq')} fill="#ffe0d6">
        <rect x="43" y="58" width="4" height="12" rx="1.5" />
        <rect x="50" y="52" width="4" height="18" rx="1.5" />
        <rect x="57" y="56" width="4" height="14" rx="1.5" />
        <rect x="64" y="49" width="4" height="21" rx="1.5" />
        <rect x="71" y="54" width="4" height="16" rx="1.5" />
      </g>

      {/* туловище */}
      <rect x="38" y="100" width="44" height="30" rx="14" fill={`url(#${gid}-cream)`} stroke="#d9c8bc" strokeWidth="1.2" />
      <rect x="51" y="107" width="18" height="15" rx="5" fill="#17120f" />
      <path d="M56 117 L60 111 L64 117 Z" fill={skin.body} />
      <rect x="58.6" y="117" width="2.8" height="3" rx="1" fill={skin.body} />

      {/* руки-варежки */}
      <g className="pet-hand">
        <rect x="22" y="108" width="15" height="10" rx="5" fill={`url(#${gid}-cream)`} stroke="#d9c8bc" strokeWidth="1" />
      </g>
      <rect x="83" y="108" width="15" height="10" rx="5" fill={`url(#${gid}-cream)`} stroke="#d9c8bc" strokeWidth="1" />

      {/* ноги и ботинки */}
      <g className="pet-leg-a">
        <rect x="45" y="127" width="11" height="9" rx="4" fill="#2a2420" />
        <rect x="40" y="134" width="21" height="8" rx="4" fill="#1c1a18" />
        <rect x="43" y="136" width="8" height="2" rx="1" fill="#3a332e" />
      </g>
      <g className="pet-leg-b">
        <rect x="64" y="127" width="11" height="9" rx="4" fill="#2a2420" />
        <rect x="59" y="134" width="21" height="8" rx="4" fill="#1c1a18" />
        <rect x="62" y="136" width="8" height="2" rx="1" fill="#3a332e" />
      </g>
    </svg>
  );
}
