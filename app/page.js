'use client'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

const FALLBACK_INDICES = [
  { name: 'NIFTY 50',   change: '+0.84%', up: true  },
  { name: 'SENSEX',     change: '+0.71%', up: true  },
  { name: 'BANK NIFTY', change: '-0.32%', up: false },
  { name: 'S&P 500',    change: '+1.12%', up: true  },
  { name: 'NASDAQ',     change: '+1.43%', up: true  },
  { name: 'DOW JONES',  change: '-0.18%', up: false },
  { name: 'FTSE 100',   change: '-0.75%', up: false },
  { name: 'DAX',        change: '-0.11%', up: false },
  { name: 'CAC 40',     change: '-0.98%', up: false },
  { name: 'NIKKEI 225', change: '+0.91%', up: true  },
  { name: 'HANG SENG',  change: '+0.24%', up: true  },
  { name: 'SHANGHAI',   change: '-0.36%', up: false },
]

export default function Home() {
  const router = useRouter()
  const [loaded, setLoaded] = useState(false)
  const [indices, setIndices] = useState(FALLBACK_INDICES)
  const featuresRef = useRef(null)

  useEffect(() => {
    setLoaded(true)
    fetchAllIndices()
  }, [])

  async function fetchAllIndices() {
    try {
      const [indiaRes, usRes, globalRes] = await Promise.all([
        fetch('/api/market-overview', { cache: 'no-store' }),
        fetch('/api/us-overview',     { cache: 'no-store' }),
        fetch('/api/global-overview', { cache: 'no-store' }),
      ])
      const india  = await indiaRes.json()
      const us     = await usRes.json()
      const global = await globalRes.json()
      const fmt    = (pct) => `${pct >= 0 ? '+' : ''}${parseFloat(pct).toFixed(2)}%`
      const live   = []

      const indiaMap  = { nifty: 'NIFTY 50', sensex: 'SENSEX', banknifty: 'BANK NIFTY' }
      const usMap     = { sp500: 'S&P 500', nasdaq: 'NASDAQ', dow: 'DOW JONES' }
      const globalMap = { ftse: 'FTSE 100', dax: 'DAX', cac: 'CAC 40', nikkei: 'NIKKEI 225', hangseng: 'HANG SENG', shanghai: 'SHANGHAI' }

      for (const [key, name] of Object.entries(indiaMap)) {
        const d = india?.indices?.[key]
        if (d?.chg_pct !== undefined) { const p = parseFloat(d.chg_pct); live.push({ name, change: fmt(p), up: p >= 0 }) }
      }
      for (const [key, name] of Object.entries(usMap)) {
        const d = us?.indices?.[key]
        if (d?.chg_pct !== undefined) { const p = parseFloat(d.chg_pct); live.push({ name, change: fmt(p), up: p >= 0 }) }
      }
      for (const [key, name] of Object.entries(globalMap)) {
        const d = global?.indices?.[key]
        if (d?.chg_pct !== undefined) { const p = parseFloat(d.chg_pct); live.push({ name, change: fmt(p), up: p >= 0 }) }
      }

      if (live.length >= 6) setIndices(live)
    } catch (e) { /* keep fallback */ }
  }

  const doubled = [...indices, ...indices]

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@400&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg: #080808;
          --bg2: #0f0f0f;
          --border: rgba(255,255,255,0.07);
          --border2: rgba(255,255,255,0.12);
          --text: #ffffff;
          --text2: rgba(255,255,255,0.5);
          --text3: rgba(255,255,255,0.25);
          --green: #4ade80;
          --green-dim: rgba(74,222,128,0.10);
          --green-border: rgba(74,222,128,0.2);
          --orange: #fb923c;
          --orange-dim: rgba(251,146,60,0.08);
          --orange-border: rgba(251,146,60,0.2);
          --red: #f87171;
          --sans: 'DM Sans', sans-serif;
          --serif: 'Instrument Serif', serif;
          --mono: 'DM Mono', monospace;
        }

        html { background: var(--bg); scroll-behavior: smooth; }
        body { font-family: var(--sans); background: var(--bg); color: var(--text); -webkit-font-smoothing: antialiased; overflow-x: hidden; }

        .sr-page { min-height: 100vh; display: flex; flex-direction: column; }

        .sr-nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          height: 58px; display: flex; align-items: center;
          padding: 0 40px; border-bottom: 1px solid var(--border);
          background: rgba(8,8,8,0.88);
          backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
        }
        .sr-logo { font-family: var(--sans); font-size: 17px; font-weight: 500; color: var(--text); letter-spacing: -0.5px; }
        .sr-logo span { color: var(--green); }

        .ticker-wrap {
          position: fixed; top: 58px; left: 0; right: 0; z-index: 99;
          height: 36px; background: var(--bg2); border-bottom: 1px solid var(--border);
          overflow: hidden; display: flex; align-items: center;
        }
        .ticker-track { display: flex; align-items: center; white-space: nowrap; animation: tickerScroll 55s linear infinite; }
        @keyframes tickerScroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .ticker-item { display: inline-flex; align-items: center; gap: 8px; padding: 0 24px; font-family: var(--mono); font-size: 10.5px; letter-spacing: 0.06em; border-right: 1px solid var(--border); }
        .ticker-name { color: var(--text3); }
        .ticker-up   { color: var(--green); }
        .ticker-dn   { color: var(--red); }

        .sr-main { margin-top: 94px; flex: 1; }

        .hero {
          min-height: calc(100vh - 94px);
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          padding: 80px 40px; text-align: center;
          border-bottom: 1px solid var(--border);
          position: relative; overflow: hidden;
        }
        .hero::before {
          content: ''; position: absolute; top: -200px; left: 50%; transform: translateX(-50%);
          width: 700px; height: 700px;
          background: radial-gradient(circle, rgba(74,222,128,0.04) 0%, transparent 70%);
          pointer-events: none;
        }
        .hero-eyebrow { font-family: var(--mono); font-size: 10px; letter-spacing: 0.15em; color: var(--text3); text-transform: uppercase; margin-bottom: 36px; opacity: 0; transform: translateY(12px); animation: fadeUp 0.8s ease forwards 0.1s; }
        .hero-h1 { font-family: var(--serif); font-size: clamp(44px, 6vw, 72px); font-weight: 400; line-height: 1.08; color: var(--text); letter-spacing: -0.5px; margin-bottom: 28px; max-width: 680px; margin-left: auto; margin-right: auto; opacity: 0; transform: translateY(16px); animation: fadeUp 0.9s ease forwards 0.2s; }
        .hero-h1 em { font-style: italic; color: var(--green); }
        .hero-sub { font-size: 15px; color: var(--text2); line-height: 1.7; max-width: 340px; margin: 0 auto 48px; font-weight: 300; opacity: 0; transform: translateY(12px); animation: fadeUp 0.9s ease forwards 0.35s; }

        .coming-soon-wrap { display: flex; align-items: center; gap: 16px; justify-content: center; margin-bottom: 16px; opacity: 0; transform: translateY(12px); animation: fadeUp 0.9s ease forwards 0.5s; }
        .coming-soon-line { flex: 1; max-width: 80px; height: 1px; background: var(--border2); }
        .coming-soon-text { font-family: var(--serif); font-style: italic; font-size: 38px; font-weight: 400; letter-spacing: -0.5px; color: var(--orange); }
        .coming-soon-pill { display: inline-flex; align-items: center; gap: 8px; font-family: var(--mono); font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--orange); background: var(--orange-dim); border: 1px solid var(--orange-border); padding: 8px 18px; border-radius: 100px; opacity: 0; transform: translateY(12px); animation: fadeUp 0.9s ease forwards 0.62s; }
        .coming-soon-dot { width: 5px; height: 5px; background: var(--orange); border-radius: 50%; flex-shrink: 0; animation: pulse 2s ease infinite; }

        @keyframes fadeUp { to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse  { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }

        .pillars { display: grid; grid-template-columns: repeat(4, 1fr); border-bottom: 1px solid var(--border); }
        .pillar { padding: 22px 28px; border-right: 1px solid var(--border); display: flex; align-items: center; gap: 10px; }
        .pillar:last-child { border-right: none; }
        .pillar-dot  { width: 5px; height: 5px; background: var(--green); border-radius: 50%; flex-shrink: 0; opacity: 0.7; }
        .pillar-word { font-size: 12px; color: var(--text3); letter-spacing: 0.02em; font-weight: 400; }

        .features { display: grid; grid-template-columns: repeat(3, 1fr); border-bottom: 1px solid var(--border); }
        .feat { padding: 52px 40px; border-right: 1px solid var(--border); transition: background 0.3s; }
        .feat:last-child { border-right: none; }
        .feat:hover { background: var(--bg2); }
        .feat-eyebrow { font-family: var(--mono); font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--text3); margin-bottom: 20px; }
        .feat-title   { font-family: var(--serif); font-size: 26px; font-weight: 400; font-style: italic; color: var(--text); margin-bottom: 16px; line-height: 1.25; }
        .feat-desc    { font-size: 13px; color: var(--text2); line-height: 1.75; font-weight: 300; }

        .global-section { display: grid; grid-template-columns: 1fr 1fr; border-bottom: 1px solid var(--border); min-height: 320px; }
        .global-left  { padding: 64px 48px; border-right: 1px solid var(--border); display: flex; flex-direction: column; justify-content: center; }
        .global-eyebrow { font-family: var(--mono); font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--text3); margin-bottom: 20px; }
        .global-title { font-family: var(--serif); font-size: 38px; font-weight: 400; color: var(--text); letter-spacing: -1px; line-height: 1.15; margin-bottom: 16px; }
        .global-title em { font-style: italic; color: var(--green); }
        .global-desc  { font-size: 13px; color: var(--text2); line-height: 1.75; font-weight: 300; max-width: 340px; }
        .global-right { padding: 64px 48px; display: flex; flex-direction: column; justify-content: center; gap: 18px; }
        .mkt-row      { display: flex; align-items: center; gap: 16px; }
        .mkt-label    { font-family: var(--mono); font-size: 10px; letter-spacing: 0.08em; color: var(--text3); width: 60px; flex-shrink: 0; }
        .mkt-bar-bg   { flex: 1; height: 1px; background: var(--border); position: relative; }
        .mkt-bar-fill { position: absolute; top: 0; left: 0; height: 1px; background: var(--green); opacity: 0.5; transition: width 1.8s ease; }
        .mkt-markets  { font-family: var(--mono); font-size: 10px; letter-spacing: 0.06em; color: var(--text3); width: 120px; text-align: right; flex-shrink: 0; }

        .manifesto { padding: 80px 48px; border-bottom: 1px solid var(--border); max-width: 820px; }
        .manifesto-eyebrow { font-family: var(--mono); font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--text3); margin-bottom: 28px; }
        .manifesto-text    { font-family: var(--serif); font-size: clamp(20px, 2.5vw, 26px); color: var(--text2); line-height: 1.65; }
        .manifesto-text em { font-style: italic; color: var(--text); }

        .atlas-section { display: grid; grid-template-columns: 1fr 1fr; border-bottom: 1px solid var(--border); min-height: 400px; }
        .atlas-left  { padding: 72px 48px; border-right: 1px solid var(--border); display: flex; flex-direction: column; justify-content: center; }
        .atlas-badge { display: inline-flex; align-items: center; gap: 8px; font-family: var(--mono); font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--green); margin-bottom: 24px; }
        .atlas-badge::before { content: ''; width: 6px; height: 6px; background: var(--green); border-radius: 50%; animation: pulse 2s ease infinite; }
        .atlas-title { font-family: var(--serif); font-size: 42px; font-weight: 400; color: var(--text); letter-spacing: -1.5px; line-height: 1.1; margin-bottom: 20px; }
        .atlas-title em { font-style: italic; color: var(--green); }
        .atlas-desc  { font-size: 13px; color: var(--text2); line-height: 1.8; font-weight: 300; max-width: 360px; margin-bottom: 32px; }
        .atlas-pill  { display: inline-flex; align-items: center; gap: 6px; font-family: var(--mono); font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--green); background: var(--green-dim); border: 1px solid var(--green-border); padding: 7px 16px; border-radius: 100px; }
        .atlas-right { padding: 72px 48px; display: flex; align-items: center; justify-content: center; }

        .terminal        { width: 100%; max-width: 380px; background: var(--bg2); border: 1px solid var(--border2); border-radius: 10px; overflow: hidden; }
        .terminal-header { padding: 12px 16px; border-bottom: 1px solid var(--border); display: flex; align-items: center; gap: 8px; }
        .t-dot           { width: 9px; height: 9px; border-radius: 50%; }
        .terminal-header-label { font-family: var(--mono); font-size: 10px; color: var(--text3); letter-spacing: 0.08em; margin-left: 4px; }
        .terminal-body   { padding: 20px; }
        .t-line          { font-family: var(--mono); font-size: 11px; color: var(--text3); margin-bottom: 8px; line-height: 1.5; }
        .tg { color: var(--green); }
        .tw { color: rgba(255,255,255,0.65); }
        .td { color: rgba(255,255,255,0.15); }
        .t-divider { border: none; border-top: 1px solid var(--border); margin: 14px 0; }

        .sr-footer   { padding: 28px 40px; display: flex; align-items: center; justify-content: space-between; border-top: 1px solid var(--border); }
        .footer-logo { font-size: 14px; font-weight: 500; color: var(--text3); letter-spacing: -0.3px; }
        .footer-logo span { color: rgba(74,222,128,0.4); }
        .footer-links { display: flex; gap: 24px; }
        .footer-link  { font-size: 11px; color: var(--text3); text-decoration: none; letter-spacing: 0.02em; transition: color 0.2s; cursor: pointer; }
        .footer-link:hover { color: var(--text2); }
        .footer-copy  { font-size: 11px; color: var(--text3); font-family: var(--mono); }

        @media (max-width: 768px) {
          .sr-nav { padding: 0 20px; }
          .hero { padding: 60px 24px; min-height: auto; }
          .hero-h1 { font-size: 38px; }
          .coming-soon-text { font-size: 28px; }
          .pillars { grid-template-columns: repeat(2, 1fr); }
          .features { grid-template-columns: 1fr; }
          .feat { border-right: none; border-bottom: 1px solid var(--border); }
          .global-section { grid-template-columns: 1fr; }
          .global-left  { border-right: none; border-bottom: 1px solid var(--border); padding: 48px 24px; }
          .global-right { padding: 48px 24px; }
          .atlas-section { grid-template-columns: 1fr; }
          .atlas-left  { border-right: none; border-bottom: 1px solid var(--border); padding: 48px 24px; }
          .atlas-right { padding: 48px 24px; }
          .manifesto { padding: 48px 24px; }
          .sr-footer { flex-direction: column; gap: 16px; text-align: center; }
        }
      `}</style>

      <div className="sr-page">

        <nav className="sr-nav">
          <div className="sr-logo">stok<span>radar</span></div>
        </nav>

        <div className="ticker-wrap">
          <div className="ticker-track">
            {doubled.map((idx, i) => (
              <div className="ticker-item" key={i}>
                <span className="ticker-name">{idx.name}</span>
                <span className={idx.up ? 'ticker-up' : 'ticker-dn'}>{idx.change}</span>
              </div>
            ))}
          </div>
        </div>

        <main className="sr-main">

          <section className="hero">
            <div className="hero-eyebrow">Markets · Intelligence · Edge</div>
            <h1 className="hero-h1">
              The market doesn&apos;t wait.<br />
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
              We&apos;re launching soon — stay close
            </div>
          </section>

          <div className="pillars">
            {['Daily intelligence', 'Institutional signals', 'Full transparency', 'Always evolving'].map((p, i) => (
              <div className="pillar" key={i}>
                <div className="pillar-dot" />
                <div className="pillar-word">{p}</div>
              </div>
            ))}
          </div>

          <div className="features" ref={featuresRef}>
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
              <div className="feat-desc">Every alert we&apos;ve ever sent is tracked and measured. We show you the wins and the losses — because transparency is the only way to build trust.</div>
            </div>
          </div>

          <div className="global-section">
            <div className="global-left">
              <div className="global-eyebrow">Global markets</div>
              <div className="global-title">We don&apos;t stop<br /><em>at India.</em></div>
              <div className="global-desc">Global opportunities, the same sharp lens. US stocks, global indices and cross-market signals — all in one place.</div>
            </div>
            <div className="global-right">
              {[
                { label: 'India',  fill: 92, markets: 'NSE · BSE'          },
                { label: 'USA',    fill: 76, markets: 'NYSE · NASDAQ'       },
                { label: 'Europe', fill: 52, markets: 'FTSE · DAX · CAC'   },
                { label: 'Asia',   fill: 38, markets: 'NIKKEI · HSI · SSE' },
              ].map((m, i) => (
                <div className="mkt-row" key={i}>
                  <div className="mkt-label">{m.label}</div>
                  <div className="mkt-bar-bg">
                    <div className="mkt-bar-fill" style={{ width: loaded ? `${m.fill}%` : '0%' }} />
                  </div>
                  <div className="mkt-markets">{m.markets}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="manifesto">
            <div className="manifesto-eyebrow">Our belief</div>
            <p className="manifesto-text">
              <em>Good investing isn&apos;t about having more information.</em> It&apos;s about having
              the right information, at the right time, presented clearly. Most tools give you
              data. <em>stokradar gives you decisions.</em> We cut through the noise so you can
              focus on what actually matters — your next move.
            </p>
          </div>

          <div className="atlas-section">
            <div className="atlas-left">
              <div className="atlas-badge">Introducing ATLAS</div>
              <div className="atlas-title">Your portfolio,<br />built around <em>you.</em></div>
              <div className="atlas-desc">ATLAS is our AI engine that understands your risk appetite, investment horizon and goals — then builds and manages a personalised basket just for you. Not a generic portfolio. Yours.</div>
              <div className="atlas-pill">Coming soon</div>
            </div>
            <div className="atlas-right">
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
            </div>
          </div>

        </main>

        <footer className="sr-footer">
          <div className="footer-logo">stok<span>radar</span></div>
          <div className="footer-links">
            <span className="footer-link">Privacy</span>
            <span className="footer-link">Terms</span>
            <span className="footer-link">Contact</span>
          </div>
          <div className="footer-copy">© 2026 stokradar</div>
        </footer>

      </div>
    </>
  )
}
