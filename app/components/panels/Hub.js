'use client';

export default function HubPanel({ goTo }) {
  return (
    <div className="sr-page">
      <main className="sr-main">
        <section className="hero">
          <div className="hero-eyebrow">Markets · Intelligence · Edge</div>
          <h1 className="hero-h1">
            The market doesn't wait.<br />
            <em>Neither should you.</em>
          </h1>
          <p className="hero-sub">We do the research. You make the call.</p>
          <div className="coming-soon-wrap">
            <div className="coming-soon-line" />
            <span className="coming-soon-text">Coming soon.</span>
            <div className="coming-soon-line" />
          </div>
          <div className="coming-soon-pill">
            <span className="coming-soon-dot" />
            We're launching soon — stay close
          </div>
        </section>

        <div className="pillars">
          {['Daily intelligence', 'Institutional signals', 'Full transparency', 'Always evolving'].map((p, i) => (
            <div className="pillar" key={i}><div className="pillar-dot" /><div className="pillar-word">{p}</div></div>
          ))}
        </div>

        <div className="features">
          <div className="feat">
            <div className="feat-eyebrow">Screens</div>
            <div className="feat-title">Know before<br />the crowd</div>
            <div className="feat-desc">Every market day, multiple screens surface opportunities across technical and fundamental signals — before they become obvious to everyone else.</div>
          </div>
          <div className="feat">
            <div className="feat-eyebrow">Insider alerts</div>
            <div className="feat-title">Follow the<br />smart money</div>
            <div className="feat-desc">Bulk deals, block deals and FII activity — scored, filtered and delivered every evening so you know exactly where institutions are moving.</div>
          </div>
          <div className="feat">
            <div className="feat-eyebrow">Track record</div>
            <div className="feat-title">See every result,<br />honestly</div>
            <div className="feat-desc">Every alert we've ever sent is tracked and measured. We show you the wins and the losses — because transparency is the only way to build trust.</div>
          </div>
        </div>

        <div className="cross-link" onClick={() => goTo(0)} style={{ '--accent': 'var(--purple)', borderTop: 'none' }}>
          <div className="cross-link-arrow">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M19 12H5M5 12l6-6M5 12l6 6" strokeLinecap="round" strokeLinejoin="round" /></svg>
            Slide left
          </div>
          <div className="cross-link-text" style={{ textAlign: 'right' }}>Already invested? <em>Track your portfolio →</em></div>
        </div>
        <div className="cross-link" onClick={() => goTo(2)} style={{ '--accent': 'var(--blue)', borderTop: 'none' }}>
          <div className="cross-link-text">Don't know where to start? <em>Build a basket →</em></div>
          <div className="cross-link-arrow">
            Slide right
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M5 12h14M19 12l-6-6M19 12l-6 6" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </div>
        </div>
      </main>

      <footer className="sr-footer">
        <div style={{ color: '#fff', fontSize: 14, fontWeight: 500 }}>stok<span style={{ color: '#4ade80' }}>radar</span></div>
        <div className="footer-link">© 2026 stokradar</div>
      </footer>
    </div>
  );
}
