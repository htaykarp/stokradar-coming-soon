'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import Ticker from './components/Ticker';
import DynamicIsland, { PANELS } from './components/DynamicIsland';
import HubPanel from './components/panels/Hub';
import PortfolioPanel from './components/panels/Portfolio';
import BasketsPanel from './components/panels/Baskets';

const SPEED = 700;
const ISLAND_BOOST = 1.0;

export default function Home() {
  const [active, setActive] = useState(1);
  const drag = useRef({ active: false, startX: 0, startY: 0, dx: 0, w: 0, locked: null, pointerId: null });
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const accentForPanel = (i) => PANELS[i].accent;

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowLeft' && active > 0) setActive(active - 1);
      else if (e.key === 'ArrowRight' && active < 2) setActive(active + 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active]);

  const onPointerDown = (e) => {
    const tag = (e.target.tagName || '').toLowerCase();
    if (['input', 'textarea', 'button', 'select', 'a'].includes(tag)) return;
    if (e.target.closest('.app-nav') || e.target.closest('.island-wrap')) return;
    drag.current = { active: true, startX: e.clientX, startY: e.clientY, dx: 0, w: window.innerWidth, locked: null, pointerId: e.pointerId };
  };
  const onPointerMove = (e) => {
    if (!drag.current.active) return;
    const dx = e.clientX - drag.current.startX;
    const dy = e.clientY - drag.current.startY;
    if (!drag.current.locked) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      drag.current.locked = Math.abs(dx) > Math.abs(dy) ? 'h' : 'v';
      if (drag.current.locked === 'h') {
        setIsDragging(true);
        e.currentTarget.setPointerCapture?.(drag.current.pointerId);
      } else {
        drag.current.active = false;
        return;
      }
    }
    if (drag.current.locked === 'h') { drag.current.dx = dx; setDragOffset(dx); }
  };
  const onPointerUp = () => {
    if (!drag.current.active) return;
    const { dx, w } = drag.current;
    drag.current.active = false; setIsDragging(false); setDragOffset(0);
    const threshold = Math.min(120, w * 0.12);
    if (dx < -threshold && active < 2) setActive(active + 1);
    else if (dx > threshold && active > 0) setActive(active - 1);
  };

  const trackStyle = (() => {
    const base = -active * (100 / 3);
    const dragPct = isDragging && typeof window !== 'undefined' ? (dragOffset / window.innerWidth) * (100 / 3) : 0;
    return { transform: `translate3d(${base + dragPct}%, 0, 0)`, transitionDuration: `${SPEED}ms` };
  })();

  const goTo = useCallback((i) => setActive(i), []);

  return (
    <div className="shell" style={{ '--accent': accentForPanel(active) }}>
      <nav className="app-nav">
        <div className="app-logo" onClick={() => goTo(1)}>
          <span className="l-stok">stok</span><span className="l-radar">radar</span>
        </div>
      </nav>

      <Ticker />

      <DynamicIsland
        active={active}
        setActive={setActive}
        isDragging={isDragging}
        dragOffset={dragOffset}
        speed={SPEED}
        boost={ISLAND_BOOST}
        accentForPanel={accentForPanel}
      />

      <div
        className="stage"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div className={`stage-track ${isDragging ? 'is-dragging' : ''}`} style={trackStyle}>
          <div className="stage-panel" style={{ '--accent': PANELS[0].accent }}>
            <PortfolioPanel goTo={goTo} />
          </div>
          <div className="stage-panel" style={{ '--accent': PANELS[1].accent }}>
            <HubPanel goTo={goTo} />
          </div>
          <div className="stage-panel" style={{ '--accent': PANELS[2].accent }}>
            <BasketsPanel goTo={goTo} />
          </div>
        </div>
      </div>
    </div>
  );
}
