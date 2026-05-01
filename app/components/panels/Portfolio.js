'use client';
import NotifyForm from '../NotifyForm';

export default function PortfolioPanel({ goTo }) {
  const holdings = [
    { name: 'Reliance Industries', ticker: 'RELIANCE', chg: '+8.2%',  flag: null,        up: true  },
    { name: 'Yes Bank',            ticker: 'YESBANK',  chg: '-24.1%', flag: 'High debt', up: false },
    { name: 'TCS',                 ticker: 'TCS',      chg: '+18.6%', flag: null,        up: true  },
    { name: 'HDFC Bank',           ticker: 'HDFCBANK', chg: '+5.1%',  flag: null,        up: true  },
  ];
  const features = [
    { title: 'Red Flag Detection',    desc: 'We scan every holding for warning signs — rising debt, promoter pledge, declining margins, governance issues.' },
    { title: 'Real-time P&L',         desc: 'Import once and see live profit & loss across every position. Know exactly where you stand at any moment.' },
    { title: 'Broker Import',         desc: 'Connect Zerodha, Groww, Angel One, Upstox and more. Or upload your CDSL / NSDL statement — we handle the rest.' },
    { title: 'Diversification Score', desc: 'We score your portfolio across sectors, market caps and stock concentration — and tell you exactly where you\'re over- or under-exposed.' },
    { title: 'Fundamental Health',    desc: 'Every stock gets a health score from PE, ROE, debt-to-equity, revenue growth and promoter holding.' },
    { title: 'Actionable Insights',   desc: 'Not just data — recommendations. "Deteriorating fundamentals." "60% in banking." "Consider trimming this position."' },
  ];
  const signals = [
    { signal: 'Promoter pledge increasing',      risk: 'High'   },
    { signal: 'Debt-to-equity above 2×',         risk: 'High'   },
    { signal: 'Revenue declining 2+ quarters',   risk: 'High'   },
    { signal: 'Sector over-concentration',       risk: 'Medium' },
    { signal: 'Institutional selling',           risk: 'Medium' },
    { signal: 'PE above 5-year average',         risk: 'Medium' },
    { signal: 'ROE declining trend',             risk: 'Medium' },
    { signal: 'Single stock > 20% of portfolio', risk: 'Low'    },
  ];
  const riskColor = (r) => r === 'High' ? 'var(--red)' : r === 'Medium' ? 'var(--amber)' : 'var(--blue)';

  return (
    <div className="sr-page pf-page">
      <main className="sr-main">
        <section className="hero">
          <div className="hero-eyebrow">Portfolio · Intelligence · Insight</div>
          <h1 className="hero-h1">
            Your portfolio,<br /><em>finally understood.</em>
          </h1>
          <p className="hero-sub">Import your holdings from any broker. We'll tell you exactly what's working, what's not, and what needs attention.</p>
          <div className="coming-soon-wrap">
            <div className="coming-soon-line" />
            <span className="coming-soon-text">Coming soon.</span>
            <div className="coming-soon-line" />
          </div>
          <div className="coming-soon-pill">
            <span className="coming-soon-dot" />
            Portfolio intelligence, the stokradar way
          </div>
        </section>

        <div className="pillars">
          {['Red flag detection', 'Live P&L', 'Diversification score', 'Health checks'].map((p, i) => (
            <div className="pillar" key={i}><div className="pillar-dot" /><div className="pillar-word">{p}</div></div>
          ))}
        </div>

        <div className="section">
          <div className="section-inner">
            <div className="section-eyebrow">The problem</div>
            <div className="section-title">You own stocks.<br /><em>But do you understand them?</em></div>
            <div className="section-sub">Most investors have no idea what's actually happening inside their portfolio until it's too late.</div>
            <div className="feat-grid3">
              {[
                { title: 'Red flags go unnoticed',        desc: 'Deteriorating fundamentals, promoter pledge increases, rising debt — these show up quietly in the data.' },
                { title: 'Over-concentration is risky',   desc: 'You think you\'re diversified because you own 15 stocks. But if 10 of them are in the same sector, you\'re not.' },
                { title: 'Underperformers drain returns', desc: 'One bad stock can drag down an otherwise strong portfolio. We rank every holding by its impact.' },
              ].map((f, i) => (
                <div className="dark-card" key={i}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', marginBottom: 14 }} />
                  <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 6 }}>{f.title}</div>
                  <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.65, fontWeight: 300 }}>{f.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="section">
          <div className="section-inner">
            <div className="section-eyebrow">What we're building</div>
            <div className="section-title">Intelligence that tells you<br /><em>what to do next.</em></div>
            <div className="section-sub">Not just charts and numbers — actual insights that help you make better decisions.</div>

            <div className="mock-card">
              <div className="mock-header">
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>My Portfolio</div>
                  <div style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'var(--mono)', marginTop: 2 }}>4 stocks · ₹2,40,000 invested</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--green)', fontFamily: 'var(--mono)' }}>+12.4%</div>
                  <div style={{ fontSize: 9, color: 'var(--text3)', fontFamily: 'var(--mono)' }}>overall return</div>
                </div>
              </div>
              {holdings.map((s, i) => (
                <div key={i} className="mock-row">
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 500 }}>{s.name}</div>
                    <div style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'var(--mono)', marginTop: 1 }}>
                      {s.ticker}
                      {s.flag && <span style={{ marginLeft: 8, fontSize: 9, color: 'var(--red)' }}>● {s.flag}</span>}
                    </div>
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: s.up ? 'var(--green)' : 'var(--red)', fontFamily: 'var(--mono)', textAlign: 'right' }}>{s.chg}</div>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.flag ? 'var(--red)' : 'var(--green)', justifySelf: 'end' }} />
                </div>
              ))}
              <div style={{ padding: '10px 18px', background: 'rgba(248,113,113,0.06)', borderTop: '1px solid rgba(248,113,113,0.18)' }}>
                <div style={{ fontSize: 11, color: 'var(--red)', lineHeight: 1.5 }}>
                  <span style={{ fontWeight: 600 }}>⚠ Action needed.</span> YESBANK has rising NPA levels and declining promoter holding.
                </div>
              </div>
            </div>

            <div className="feat-grid2">
              {features.map((f, i) => (
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
          <div className="section-inner">
            <div className="section-eyebrow">What we watch for</div>
            <div className="section-title">50+ signals,<br /><em>watching your portfolio.</em></div>
            <div className="section-sub">We flag issues that matter — not noise, not vanity metrics.</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10, maxWidth: 700, margin: '0 auto' }}>
              {signals.map((s, i) => {
                const c = riskColor(s.risk);
                return (
                  <div key={i} className="signal-row">
                    <div style={{ fontSize: 12, color: 'var(--text2)' }}>{s.signal}</div>
                    <div className="risk-tag" style={{ color: c, background: `color-mix(in oklab, ${c} 12%, transparent)`, border: `1px solid color-mix(in oklab, ${c} 28%, transparent)` }}>{s.risk}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="notify">
          <div className="notify-title">Be the first to know.</div>
          <div className="notify-sub">We'll notify you the moment Portfolio goes live.</div>
          <NotifyForm />
        </div>

        <div className="cross-link" onClick={() => goTo(2)} style={{ '--accent': 'var(--blue)' }}>
          <div className="cross-link-text">Looking to <em>build</em> a portfolio instead? Meet Baskets →</div>
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
