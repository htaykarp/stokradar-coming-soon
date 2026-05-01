'use client';
import { useRef, useState } from 'react';

const PANELS = [
  { id: 'portfolio', label: 'portfolio', accent: '#a78bfa' },
  { id: 'stokradar', label: 'stokradar', accent: '#4ade80' },
  { id: 'baskets',   label: 'baskets',   accent: '#60a5fa' },
];

export default function DynamicIsland({ active, setActive, isDragging, dragOffset, speed, boost, accentForPanel }) {
  const ref = useRef(null);
  const [hoverLean, setHoverLean] = useState(0);
  const [hovering, setHovering] = useState(false);

  let lean = 0;
  if (isDragging) {
    const w = (typeof window !== 'undefined' && window.innerWidth) || 1;
    lean = Math.max(-1, Math.min(1, -dragOffset / (w * 0.35)));
  } else if (hovering) {
    lean = hoverLean;
  }

  const onMove = (e) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    const x = (e.clientX - r.left) / r.width;
    const v = Math.max(-1, Math.min(1, (x - 0.5) * 2));
    const sign = Math.sign(v);
    const mag = Math.pow(Math.abs(v), 1.6);
    setHoverLean(sign * mag);
  };

  const tabScale = (i) => {
    const base = i === active ? 1 + 0.18 * boost : 1;
    let bias = 0;
    if (i === active) {
      bias = -Math.abs(lean) * 0.18 * boost;
    } else {
      const towardLeft = lean < 0 && i < active;
      const towardRight = lean > 0 && i > active;
      bias = (towardLeft || towardRight) ? Math.abs(lean) * 0.18 * boost : -Math.abs(lean) * 0.04 * boost;
    }
    return base + bias;
  };
  const tabPad = (i) => 14 + (tabScale(i) - 1) * 28;

  return (
    <div className="island-wrap">
      <div
        ref={ref}
        className="island"
        style={{ '--accent': accentForPanel(active) }}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => { setHovering(false); setHoverLean(0); }}
        onMouseMove={onMove}
      >
        {PANELS.map((p, i) => (
          <button
            key={p.id}
            className={`island-tab ${i === active ? 'is-active' : ''}`}
            onClick={() => setActive(i)}
            onMouseEnter={() => {
              if (i < active) setHoverLean(-0.85);
              else if (i > active) setHoverLean(0.85);
            }}
            style={{
              '--accent': accentForPanel(i),
              paddingLeft: `${tabPad(i)}px`,
              paddingRight: `${tabPad(i)}px`,
              transform: `scale(${tabScale(i)})`,
              transition: `transform ${isDragging ? 0 : speed}ms cubic-bezier(0.34, 1.56, 0.64, 1), padding ${isDragging ? 0 : speed}ms cubic-bezier(0.34, 1.56, 0.64, 1), color ${speed}ms ease, background ${speed}ms ease, box-shadow ${speed}ms ease`,
            }}
          >
            <span>{p.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export { PANELS };
