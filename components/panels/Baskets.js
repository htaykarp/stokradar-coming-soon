'use client';
import NotifyForm from '../NotifyForm';

export default function BasketsPanel({ goTo }) {
  const quotes = [
    { text: '"I\'m 24, I want to take risks and grow my money aggressively while I still can."', by: '— Young investor' },
    { text: '"I\'m saving for my child\'s college fund. I need steady, reliable growth over 12 years."', by: '— Parent planning ahead' },
    { text: '"I want to buy a house in 4 years. I need moderate growth without too much risk."', by: '— First-time home buyer' },
  ];
  const atlasFeatures = [
    { title: 'Understands you',      desc: 'Your age, risk appetite, timeline and goals — ATLAS factors in everything before picking a single stock.' },
    { title: 'Screens-backed picks', desc: 'Every stock goes through the same rigorous screens that power stokradar\'s daily alerts. Quality first.' },
    { title: 'Actively rebalanced',  desc: 'Markets change. ATLAS rebalances your basket when needed and tells you exactly what changed and why.' },
    { title: 'Full transparency',    desc: 'Every pick is tracked from day one. You see the wins and the losses — nothing is hidden, ever.' },
  ];
  const steps = [
    { num: 1, title: 'Tell us your goal',   desc: "Saving for a house, a child's education, retirement — we have a basket for it." },
    { num: 2, title: 'Get your basket',     desc: 'ATLAS hands you a curated basket matched to your goal, timeline and risk appetite.' },
    { num: 3, title: 'Track and rebalance', desc: 'Watch it perform daily — we rebalance when needed and keep you in the loop.' },
  ];

  return (
    <div className="sr-page bk-page">
      <main className="sr-main">
        <section className="hero">
          <div className="hero-eyebrow">Baskets · Goals · ATLAS</div>
          <h1 className="hero-h1">
            Every goal has a<br /><em>basket here.</em>
          </h1>
          <p className="hero-sub">Because a 25-year-old and a 55-year-old shouldn't invest the same way. Tell us your goal — we'll build the right basket for you.</p>
          <div className="coming-soon-wrap">
            <div className="coming-soon-line" />
            <span className="coming-soon-text">Coming soon.</span>
            <div className="coming-soon-line" />
          </div>
          <div className="coming-soon-pill">
            <span className="coming-soon-dot" />
            We're building something big
          </div>
        </section>

        <div className="pillars">
          {['Goal-driven', 'Screen-backed picks', 'Actively rebalanced', 'Day-one parity'].map((p, i) => (
            <div className="pillar" key={i}><div className="pillar-dot" /><div className="pillar-word">{p}</div></div>
          ))}
        </div>

        <div className="section">
          <div className="section-inner">
            <div className="section-eyebrow">Investing is personal</div>
            <div className="section-title">Different lives,<br /><em>different baskets.</em></div>
            <div className="feat-grid3">
              {quotes.map((q, i) => (
                <div className="quote-card" key={i}>
                  <div className="quote-text">{q.text}</div>
                  <div className="quote-by">{q.by}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="section" style={{ position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% 50%, color-mix(in oklab, var(--accent) 6%, transparent) 0%, transparent 60%)', pointerEvents: 'none' }} />
          <div className="section-inner" style={{ position: 'relative', textAlign: 'center' }}>
            <div className="section-eyebrow" style={{ color: 'var(--accent)' }}>● Introducing ATLAS</div>
            <div className="section-title">Your portfolio,<br /><em>built around you.</em></div>
            <div className="section-sub">ATLAS is our AI engine that understands your risk appetite, investment horizon and goals — then builds and manages a personalised basket just for you.</div>

            <div className="terminal">
              <div className="terminal-header">
                <div className="t-dot" style={{ background: '#ff5f57' }} />
                <div className="t-dot" style={{ background: '#febc2e' }} />
                <div className="t-dot" style={{ background: '#28c840' }} />
                <div className="terminal-header-label">atlas · portfolio engine</div>
              </div>
              <div className="terminal-body">
                <div className="t-line"><span className="tg">ATLAS</span> <span className="tw">analysing profile...</span></div>
                <div className="t-line">risk tolerance <span className="tw">— moderate</span></div>
                <div className="t-line">horizon <span className="tw">— 18 months</span></div>
                <div className="t-line">sectors <span className="tw">— energy, pharma, infra</span></div>
                <hr className="t-divider" />
                <div className="t-line"><span className="tg">building basket</span>{' '}<span className="tw">████████<span className="td">░░</span> 80%</span></div>
                <div className="t-line" style={{ marginTop: 10 }}><span className="tg">12 stocks selected</span></div>
                <div className="t-line">avg pe <span className="tw">14.2</span> · avg roe <span className="tw">18.4%</span></div>
                <div className="t-line">projected return <span className="tw">~16–22% / yr</span></div>
              </div>
            </div>

            <div className="feat-grid2" style={{ maxWidth: 720, margin: '0 auto', textAlign: 'left' }}>
              {atlasFeatures.map((f, i) => (
                <div key={i} className="dark-card" style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--accent)', marginTop: 7, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 5 }}>{f.title}</div>
                    <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.65, fontWeight: 300 }}>{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="section">
          <div className="section-inner" style={{ maxWidth: 720 }}>
            <div className="section-eyebrow">How it works</div>
            <div className="section-title">Three steps to <em>your basket.</em></div>
            <div className="step-grid">
              {steps.map((s, i) => (
                <div key={i} style={{ textAlign: 'center' }}>
                  <div className="step-num">{s.num}</div>
                  <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 6 }}>{s.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.6, fontWeight: 300 }}>{s.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="notify">
          <div className="notify-title">Be the first to know.</div>
          <div className="notify-sub">We'll notify you the moment baskets go live.</div>
          <NotifyForm />
        </div>

        <div className="cross-link" onClick={() => goTo(0)} style={{ '--accent': 'var(--purple)' }}>
          <div className="cross-link-arrow">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M19 12H5M5 12l6-6M5 12l6 6" strokeLinecap="round" strokeLinejoin="round" /></svg>
            Slide left
          </div>
          <div className="cross-link-text">Already have holdings? <em>Track them in Portfolio →</em></div>
        </div>
      </main>

      <footer className="sr-footer">
        <div style={{ color: '#fff', fontSize: 14, fontWeight: 500 }}>stok<span style={{ color: '#4ade80' }}>radar</span></div>
        <div className="footer-link">© 2026 stokradar</div>
      </footer>
    </div>
  );
}
