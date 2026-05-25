'use client'
import React, { useEffect, useRef, useState, useCallback, Fragment, createContext, useContext } from 'react'
import NotifyForm from './components/NotifyForm'

/* ─────────────────────────────────────────────────────
   COMING-SOON BUILD
   This is the stokradar-web landing page repurposed as a single
   waitlist page. All product navigation (login, signup, /alerts,
   /mutual-funds, /learn, /screens/*) and API fetches have been
   removed. Every CTA opens the notify modal.
───────────────────────────────────────────────────────── */
const NotifyCtx = createContext(() => {})
const useNotify = () => useContext(NotifyCtx)

const C = {
  bg:'#070707',bg2:'#0d0d0d',bg3:'#131313',bg4:'#171717',
  border:'rgba(255,255,255,0.08)',border2:'rgba(255,255,255,0.16)',
  text:'#ffffff',text2:'rgba(255,255,255,0.72)',text3:'rgba(255,255,255,0.42)',text4:'rgba(255,255,255,0.22)',
  green:'#4ade80',blue:'#60a5fa',purple:'#a78bfa',amber:'#fbbf24',red:'#f87171',
}
const mono = { fontFamily: 'DM Mono, JetBrains Mono, monospace' }

const FALLBACK_INDICES = [
  { name:'NIFTY 50',last:'23,574',chg:'+0.62%',up:true },
  { name:'SENSEX',last:'74,879',chg:'+0.36%',up:true },
  { name:'BANK NIFTY',last:'53,887',chg:'+0.77%',up:true },
  { name:'S&P 500',last:'5,432',chg:'+0.84%',up:true },
  { name:'NASDAQ 100',last:'19,210',chg:'+1.12%',up:true },
  { name:'DOW JONES',last:'38,756',chg:'-0.18%',up:false },
]

const TICKERS = [
  {s:'RELIANCE',v:'+2.41%',bull:true},{s:'TCS',v:'+0.87%',bull:true},
  {s:'INFY',v:'+1.14%',bull:true},{s:'HDFCBANK',v:'-0.32%',bull:false},
  {s:'ICICIBANK',v:'+0.65%',bull:true},{s:'BAJFINANCE',v:'-1.08%',bull:false},
  {s:'LTIM',v:'+3.22%',bull:true},{s:'WIPRO',v:'+0.49%',bull:true},
  {s:'AXISBANK',v:'-0.71%',bull:false},{s:'SBIN',v:'+0.18%',bull:true},
  {s:'MARUTI',v:'+1.93%',bull:true},{s:'TATAMOTORS',v:'-0.55%',bull:false},
  {s:'HCLTECH',v:'+0.77%',bull:true},{s:'SUNPHARMA',v:'+2.05%',bull:true},
  {s:'ONGC',v:'-0.29%',bull:false},{s:'TITAN',v:'+2.18%',bull:true},
  {s:'VOLTAS',v:'+3.47%',bull:true},{s:'ZOMATO',v:'-0.64%',bull:false},
  {s:'ABB',v:'+4.02%',bull:true},{s:'SIEMENS',v:'+1.77%',bull:true},
  {s:'DLF',v:'+1.88%',bull:true},{s:'CHOLAFIN',v:'+2.34%',bull:true},
  {s:'KOTAKBANK',v:'+0.92%',bull:true},{s:'DRREDDY',v:'-1.12%',bull:false},
  {s:'NESTLEIND',v:'+0.61%',bull:true},{s:'POWERGRID',v:'+0.33%',bull:true},
  {s:'ADANIPORTS',v:'-1.44%',bull:false},{s:'HINDALCO',v:'+2.11%',bull:true},
  {s:'BHEL',v:'+3.15%',bull:true},{s:'IRCTC',v:'+1.07%',bull:true},
]

function useReveal() {
  const ref = useRef(null)
  const [seen, setSeen] = useState(false)
  useEffect(() => {
    if (!ref.current || seen) return
    const obs = new IntersectionObserver(
      entries => { entries.forEach(e => { if (e.isIntersecting) { setSeen(true); obs.disconnect() } }) },
      { threshold: 0.15 }
    )
    obs.observe(ref.current)
    return () => obs.disconnect()
  }, [seen])
  return [ref, seen]
}

function CountUp({ to, prefix='', suffix='', duration=1500 }) {
  const [v, setV] = useState(0)
  const [ref, seen] = useReveal()
  useEffect(() => {
    if (!seen) return
    const start = performance.now()
    const tick = now => {
      const t = Math.min((now - start) / duration, 1)
      setV(to * (1 - Math.pow(1 - t, 3)))
      if (t < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [seen, to, duration])
  return <span ref={ref}>{prefix}{Math.round(v).toLocaleString('en-IN')}{suffix}</span>
}

function Reveal({ children, delay=0, style={} }) {
  const [ref, seen] = useReveal()
  return (
    <div ref={ref} style={{
      opacity: seen ? 1 : 0,
      transform: seen ? 'translateY(0)' : 'translateY(28px)',
      transition: `opacity 700ms ${delay}ms cubic-bezier(0.22,1,0.36,1), transform 700ms ${delay}ms cubic-bezier(0.22,1,0.36,1)`,
      ...style,
    }}>
      {children}
    </div>
  )
}

/* ─────────────────────────────────────────────────────
   StockDetailShowcase — 3 panels with fixes:
   • Panel 1: updated band indicator positions
   • Panel 2: replaced with 8-parameter scorecard
───────────────────────────────────────────────────────── */
function StockDetailShowcase() {
  const [cur, setCur] = useState(0)
  const [progVal, setProgVal] = useState(0)
  const paused = useRef(false)
  const seqTimers = useRef([])
  const progInt = useRef(null)
  const cursorRef = useRef(null)
  const cRingRef = useRef(null)
  const popupRef = useRef(null)
  const chartAreaRef = useRef(null)
  const flipCardRef = useRef(null)
  const flipStageRef = useRef(null)
  const s2Ref = useRef(null)
  const wrapRef = useRef(null)
  const [sectionRef, seen] = useReveal()
  const started = useRef(false)

  const DURATIONS = [5000, 5200, 5200]
  const SLIDES = [
    { num:'01 / 03', tag:'Notable events · Filing match · Outcome tracking',
      titleHtml:'Price chart',titleSub:'& notable events.',serif:false,
      desc:"Not just a line on a chart. Every significant price move is matched to the corporate announcement that caused it — results, filings, deals. Hover any dot to see matched news, 5-day and 30-day outcomes, and how similar moves played out historically." },
    { num:'02 / 03', tag:'3 independent models · Position score · Risk context',
      titleHtml:'Smart Price',titleSub:'Bands.',serif:true,
      desc:"Replace the naive 52-week range with three independent models. Technical band — support/resistance. Fair-value band — 5-year avg P/E blended with sector medians. Forward cone — 95% confidence range adjusted for volatility, beta, earnings proximity." },
    { num:'03 / 03', tag:'Decision grade · 8 dimensions · Sector rank',
      titleHtml:'8-Parameter',titleSub2:'Scorecard.',titleSub:'No black box.',serif:false,
      desc:"Every stock rated across eight independent dimensions, ranked against its sector peers. Growth, profitability, financial health, valuation — each independently scored. Click any category to reveal the underlying line items." },
  ]

  function clrSeq(){seqTimers.current.forEach(clearTimeout);seqTimers.current=[]}
  function at(ms,fn){seqTimers.current.push(setTimeout(fn,ms))}

  function runPanel0(){
    if(!chartAreaRef.current||!wrapRef.current)return
    at(800,()=>{
      const rect=chartAreaRef.current?.getBoundingClientRect()
      const wrapRect=wrapRef.current?.getBoundingClientRect()
      if(!rect||!wrapRect||!cursorRef.current)return
      cursorRef.current.style.display='block'
      cursorRef.current.style.left=(rect.left-wrapRect.left+170/600*rect.width)+'px'
      cursorRef.current.style.top=(rect.top-wrapRect.top+95/140*rect.height)+'px'
    })
    at(1400,()=>{
      if(popupRef.current)popupRef.current.style.opacity='1'
      if(cRingRef.current){cRingRef.current.style.transform='scale(2.8)';cRingRef.current.style.opacity='0'}
      setTimeout(()=>{if(cRingRef.current){cRingRef.current.style.transform='';cRingRef.current.style.opacity=''}},350)
    })
  }

  function goTo(i){
    clrSeq()
    if(popupRef.current)popupRef.current.style.opacity='0'
    if(cursorRef.current)cursorRef.current.style.display='none'
    setCur(i)
    if(flipCardRef.current&&flipStageRef.current&&s2Ref.current){
      if(i===0){flipStageRef.current.style.display='block';flipCardRef.current.className='';s2Ref.current.style.opacity='0';s2Ref.current.style.pointerEvents='none';s2Ref.current.style.position='absolute';at(50,runPanel0)}
      else if(i===1){flipStageRef.current.style.display='block';flipCardRef.current.className='sd-flip-to1';s2Ref.current.style.opacity='0';s2Ref.current.style.pointerEvents='none';s2Ref.current.style.position='absolute'}
      else{flipStageRef.current.style.display='none';s2Ref.current.style.opacity='1';s2Ref.current.style.pointerEvents='auto';s2Ref.current.style.position='relative'}
    }
    clearInterval(progInt.current);setProgVal(0)
    const dur=DURATIONS[i];let pv=0
    progInt.current=setInterval(()=>{
      if(paused.current)return
      pv+=60/dur*100;setProgVal(Math.min(pv,100))
      if(pv>=100){clearInterval(progInt.current);goTo((i+1)%3)}
    },60)
  }

  useEffect(()=>{
    if(seen&&!started.current){started.current=true;goTo(0)}
    return()=>{clrSeq();clearInterval(progInt.current)}
  },[seen])

  const sS={...mono,fontSize:9,letterSpacing:'.16em',color:C.text4,textTransform:'uppercase'}
  const tagS={display:'inline-flex',alignItems:'center',gap:6,padding:'5px 12px',background:'rgba(74,222,128,0.06)',border:'0.5px solid rgba(74,222,128,0.22)',borderRadius:4,...mono,fontSize:9,letterSpacing:'.10em',color:C.green,textTransform:'uppercase',fontWeight:700}
  const rpS={background:C.bg2,border:`0.5px solid ${C.border2}`,borderRadius:14,overflow:'hidden',boxShadow:'0 32px 80px rgba(0,0,0,0.7)'}
  const chromeS={height:36,background:C.bg3,borderBottom:`0.5px solid ${C.border}`,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 16px'}
  const dotS=(active)=>({width:active?28:8,height:2.5,borderRadius:1.5,cursor:'pointer',transition:'all 0.3s',background:active?C.green:C.border2})

  /* ── Scorecard data for panel 2 ── */
  const SC_ITEMS = [
    {t:'Growth',sub:'Revenue, EPS, OCF',s:'6.0',v:'Good',col:C.green,red:false},
    {t:'Profitability',sub:'ROE, ROCE, margins',s:'8.0',v:'Great',col:C.green,red:false},
    {t:'Financial Health',sub:'D/E, interest cover, FCF',s:'9.0',v:'Great',col:C.green,red:false},
    {t:'Valuation',sub:'PE, PB, EV/EBITDA',s:'8.5',v:'Great',col:C.green,red:false},
    {t:'Entry Point',sub:'RSI, BB, MA distance',s:'8.5',v:'Great',col:C.green,red:false},
    {t:'Momentum',sub:'1M / 3M / 6M / 12M',s:'0.5',v:'Poor',col:C.red,red:true},
    {t:'Institutional',sub:'FII, DII, MF activity',s:'6.5',v:'Good',col:C.green,red:false},
    {t:'Red Flags',sub:'Pledging, auditor, AR',s:'—',v:'Great',col:C.green,red:false},
  ]

  return (
    <section ref={sectionRef} className="ld-section" style={{padding:'100px 24px',background:C.bg}}>
      <div style={{maxWidth:1200,margin:'0 auto'}}>
        <Reveal><div style={{fontSize:11,color:C.text3,...mono,letterSpacing:'0.12em',fontWeight:700,marginBottom:14,textTransform:'uppercase'}}>Stock detail page</div></Reveal>
        <Reveal delay={80}><h2 className="ld-section-title" style={{fontSize:42,fontWeight:800,color:C.text,letterSpacing:'-1px',lineHeight:1.15,margin:'0 0 14px'}}>Everything about a stock. <span style={{color:C.text3}}>In one place.</span></h2></Reveal>
        <Reveal delay={120}><p style={{fontSize:16,color:C.text2,lineHeight:1.6,maxWidth:560,margin:'0 0 36px'}}>Click any stock and get a complete picture — price context, notable events, smart price bands, technicals, financials, peers.</p></Reveal>

        {/* TABS */}
        <Reveal delay={160}>
          <div style={{display:'flex',gap:6,marginBottom:40,alignItems:'center'}}>
            {['Price + Events','Price Bands','8-Param Scorecard'].map((t,i)=>(
              <Fragment key={t}>
                {i>0&&<div style={{flex:1,height:0.5,background:C.border}}/>}
                <button onClick={()=>goTo(i)} style={{padding:'7px 18px',borderRadius:6,border:`0.5px solid ${cur===i?'rgba(74,222,128,0.30)':C.border}`,background:cur===i?'rgba(74,222,128,0.08)':'transparent',...mono,fontSize:10,letterSpacing:'.10em',textTransform:'uppercase',color:cur===i?C.green:C.text3,cursor:'pointer'}}>{t}</button>
              </Fragment>
            ))}
          </div>
        </Reveal>

        <Reveal delay={200}>
          <div className="sd-body" style={{display:'grid',gridTemplateColumns:'300px 1fr',gap:64,alignItems:'start',minHeight:580}}>
            {/* LEFT */}
            <div style={{position:'sticky',top:40}}>
              <div style={{...sS,marginBottom:20,display:'flex',alignItems:'center',gap:10}}><span>{SLIDES[cur].num}</span><div style={{flex:1,height:0.5,background:C.border}}/></div>
              {SLIDES[cur].serif?(
                <div style={{fontFamily:'Playfair Display, Georgia, serif',fontSize:'2rem',fontWeight:400,lineHeight:1.2,color:C.text,marginBottom:16}}>{SLIDES[cur].titleHtml}<br/>{SLIDES[cur].titleSub}</div>
              ):(
                <div style={{fontSize:'2rem',fontWeight:800,letterSpacing:'-0.8px',lineHeight:1.15,color:C.text,marginBottom:16}}>{SLIDES[cur].titleHtml}<br/>{SLIDES[cur].titleSub2&&<>{SLIDES[cur].titleSub2}<br/></>}<span style={{color:C.text3}}>{SLIDES[cur].titleSub}</span></div>
              )}
              <div style={{fontSize:13,color:C.text3,lineHeight:1.85,marginBottom:20,maxWidth:260}}>{SLIDES[cur].desc}</div>
              <div style={tagS}>{SLIDES[cur].tag}</div>
              <div style={{marginTop:28,height:1.5,background:C.border,borderRadius:1,overflow:'hidden'}}><div style={{height:'100%',background:C.green,width:`${progVal}%`,transition:'width 0.08s linear'}}/></div>
              <div style={{display:'flex',gap:5,marginTop:14}}>{[0,1,2].map(i=><div key={i} style={dotS(i===cur)} onClick={()=>goTo(i)}/>)}</div>
            </div>

            {/* RIGHT */}
            <div ref={wrapRef} style={{position:'relative'}}
              onMouseEnter={()=>{paused.current=true}} onMouseLeave={()=>{paused.current=false}}>
              {/* Fake cursor */}
              <div ref={cursorRef} style={{position:'absolute',zIndex:100,pointerEvents:'none',display:'none',transition:'left 0.55s cubic-bezier(.4,0,.2,1),top 0.55s cubic-bezier(.4,0,.2,1)'}}>
                <div style={{width:8,height:8,background:'#fff',borderRadius:'50%',position:'relative',zIndex:1}}/>
                <div ref={cRingRef} style={{width:22,height:22,border:'1.5px solid rgba(255,255,255,0.5)',borderRadius:'50%',position:'absolute',top:-7,left:-7,transition:'transform 0.2s,opacity 0.2s'}}/>
              </div>

              {/* 3D FLIP STAGE */}
              <div ref={flipStageRef} style={{position:'relative',perspective:1200,minHeight:560}}>
                <div ref={flipCardRef} style={{width:'100%',minHeight:560,transformStyle:'preserve-3d',transition:'transform 0.8s cubic-bezier(.4,0,.2,1)',position:'relative'}}>

                  {/* FACE 0: Price Chart */}
                  <div style={{position:'absolute',inset:0,backfaceVisibility:'hidden',WebkitBackfaceVisibility:'hidden',transform:'rotateY(0deg)'}}>
                    <div style={{...rpS,height:'100%'}}>
                      <div style={chromeS}>
                        <div style={{display:'flex',alignItems:'center',gap:6}}>
                          <div style={{width:7,height:7,borderRadius:'50%',background:'#252525',border:'1px solid #2e2e2e'}}/>
                          <div style={{fontSize:11,fontWeight:600,color:C.text}}>Adani Enterprises <span style={{fontSize:9,color:C.text3,...mono}}>ADANIENT · NSE</span></div>
                        </div>
                        <span style={{fontSize:9,color:'rgba(74,222,128,0.55)',...mono}}>● NSE LIVE</span>
                      </div>
                      <div style={{padding:16}}>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:14}}>
                          <div>
                            <div style={{fontSize:15,fontWeight:700,color:C.text}}>Adani Enterprises Ltd</div>
                            <div style={{display:'flex',gap:5,marginTop:5}}>
                              <span style={{fontSize:8,padding:'2px 8px',borderRadius:20,...mono,fontWeight:700,background:'rgba(74,222,128,0.08)',color:C.green,border:'0.5px solid rgba(74,222,128,0.22)'}}>Conglomerate</span>
                              <span style={{fontSize:8,padding:'2px 8px',borderRadius:20,...mono,fontWeight:700,background:'rgba(167,139,250,0.08)',color:C.purple,border:'0.5px solid rgba(167,139,250,0.22)'}}>Diversified</span>
                            </div>
                          </div>
                          <div style={{textAlign:'right'}}>
                            <div style={{fontSize:26,fontWeight:800,color:C.text,...mono,letterSpacing:'-1px'}}>₹2,650</div>
                            <div style={{fontSize:11,color:C.green,...mono,fontWeight:700}}>+563.6 (+26.17%) 3M</div>
                          </div>
                        </div>
                        <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',borderBottom:`0.5px solid ${C.border}`}}>
                          {[['Mkt Cap','₹3.02L Cr'],['P/E','72.4×'],['P/B','6.82×'],['ROE 5Y','14.2%'],['D/E','1.24'],['Div Yield','0.04%']].map(([k,v],i)=>(
                            <div key={k} style={{padding:'8px 10px',borderRight:i<5?`0.5px solid ${C.border}`:'none'}}>
                              <div style={{fontSize:7,color:C.text3,...mono,letterSpacing:'.08em',textTransform:'uppercase',marginBottom:3}}>{k}</div>
                              <div style={{fontSize:11,color:C.text,fontWeight:600}}>{v}</div>
                            </div>
                          ))}
                        </div>
                        <div style={{padding:'12px 0 4px'}}>
                          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                            <div>
                              <div style={{fontSize:11,fontWeight:600,color:C.text}}>Price Chart · 3M</div>
                              <div style={{fontSize:9.5,color:C.green,...mono,marginTop:2}}>+563.6 (+26.17%)</div>
                            </div>
                            <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:5}}>
                              <span style={{fontSize:9.5,padding:'3px 10px',borderRadius:5,background:'rgba(167,139,250,0.08)',color:C.purple,border:'0.5px solid rgba(167,139,250,0.25)',...mono}}>● News events (12)</span>
                              <div style={{display:'flex',gap:2}}>{['1W','1M','3M','6M','1Y'].map((p,i)=>(<span key={p} style={{fontSize:9.5,padding:'3px 9px',borderRadius:4,color:i===2?C.green:C.text3,...mono,...(i===2?{background:'rgba(74,222,128,0.08)',border:'0.5px solid rgba(74,222,128,0.22)'}:{})}}>{p}</span>))}</div>
                            </div>
                          </div>
                          <div ref={chartAreaRef} style={{position:'relative',height:160}}>
                            <svg viewBox="0 0 600 140" width="100%" height="140" preserveAspectRatio="none" style={{display:'block'}}>
                              <defs><linearGradient id="sdgg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#4ade80" stopOpacity=".14"/><stop offset="100%" stopColor="#4ade80" stopOpacity="0"/></linearGradient></defs>
                              <polygon fill="url(#sdgg)" points="0,105 40,95 80,85 120,95 160,108 200,116 240,104 280,90 320,75 360,65 400,70 430,75 470,58 500,42 540,28 570,18 600,12 600,140 0,140"/>
                              <polyline fill="none" stroke="#4ade80" strokeWidth="1.8" strokeLinecap="round" points="0,105 40,95 80,85 120,95 160,108 200,116 240,104 280,90 320,75 360,65 400,70 430,75 470,58 500,42 540,28 570,18 600,12"/>
                              {[{cx:80,cy:85,c:'#f87171'},{cx:200,cy:116,c:'#4ade80'},{cx:360,cy:65,c:'#f87171'},{cx:430,cy:75,c:'#4ade80'}].map((d,i)=>(
                                <g key={i}><circle cx={d.cx} cy={d.cy} r="7" fill={d.c} fillOpacity=".18" stroke={d.c} strokeWidth="1.5"/><circle cx={d.cx} cy={d.cy} r="3" fill={d.c}/></g>
                              ))}
                            </svg>
                            <div ref={popupRef} style={{position:'absolute',background:C.bg3,border:'1px solid rgba(255,255,255,0.14)',borderRadius:10,padding:'12px 16px',maxWidth:420,width:'86%',boxShadow:'0 12px 32px rgba(0,0,0,0.6)',zIndex:50,opacity:0,transition:'opacity 0.35s ease',pointerEvents:'none',left:'50%',bottom:14,transform:'translateX(-50%)'}}>
                              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8,gap:8}}>
                                <div style={{fontSize:9,color:C.red,...mono,letterSpacing:'.10em',textTransform:'uppercase',fontWeight:700}}>▼ −8.27% in 2 days</div>
                                <div style={{fontSize:10,color:C.text3,...mono}}>2026-01-22</div>
                              </div>
                              <div style={{marginBottom:8,padding:'8px 10px',background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:6}}>
                                <div style={{fontSize:9,color:C.text3,...mono,letterSpacing:'.06em',textTransform:'uppercase',fontWeight:700,marginBottom:4}}>▎Updates</div>
                                <div style={{fontSize:11.5,color:C.text2,lineHeight:1.45}}>Adani Enterprises Limited has informed the Exchange regarding &lsquo;Intimation For Signing Of Share Purchase Agreement By AMG Media Networks Limited&rsquo;.</div>
                                <span style={{display:'inline-block',marginTop:4,fontSize:10,color:C.green,...mono}}>View filing →</span>
                              </div>
                              <div style={{fontSize:11,color:C.text2}}>Outcome: 5D <span style={{color:C.red,fontWeight:700,...mono}}>−3.16%</span> · 30D <span style={{color:C.red,fontWeight:700,...mono}}>−4.18%</span></div>
                              <div style={{fontSize:10,color:C.text3,...mono,marginTop:8,paddingTop:8,borderTop:'1px solid rgba(255,255,255,0.06)'}}>Past 5 similar ▼ moves avg → 5D <span style={{color:C.red,fontWeight:700}}>−1.9%</span> · 30D <span style={{color:C.green,fontWeight:700}}>+2.7%</span></div>
                            </div>
                          </div>
                          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8,marginTop:10,paddingTop:10,borderTop:`0.5px solid ${C.border}`}}>
                            {[['Open','₹2,710.2',C.text2],['High','₹2,745',C.green],['Low','₹2,706.1',C.red],['Prev Close','₹2,697.6',C.text2]].map(([k,v,c])=>(
                              <div key={k} style={{textAlign:'center'}}>
                                <div style={{fontSize:7.5,color:C.text3,...mono,letterSpacing:'.06em',textTransform:'uppercase',marginBottom:3}}>{k}</div>
                                <div style={{fontSize:11,fontWeight:600,...mono,color:c}}>{v}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* FACE 1: Smart Price Bands — updated indicator positions */}
                  <div style={{position:'absolute',inset:0,backfaceVisibility:'hidden',WebkitBackfaceVisibility:'hidden',transform:'rotateY(180deg)'}}>
                    <div style={{...rpS,height:'100%'}}>
                      <div style={chromeS}>
                        <div style={{display:'flex',alignItems:'center',gap:6}}>
                          <div style={{width:7,height:7,borderRadius:'50%',background:'#252525',border:'1px solid #2e2e2e'}}/>
                          <div style={{fontSize:11,fontWeight:600,color:C.text}}>Smart Price Bands</div>
                        </div>
                        <span style={{fontSize:9,color:C.purple,...mono,fontWeight:700}}>R:R 0.4:1 · <span style={{color:C.red}}>Sell zone</span></span>
                      </div>
                      <div style={{padding:16}}>
                        <div style={{display:'flex',justifyContent:'space-between',marginBottom:14}}>
                          <span style={{fontSize:9.5,color:C.text3,...mono,letterSpacing:'.13em',textTransform:'uppercase',fontWeight:700}}>Band Details · ADANIENT</span>
                          <span style={{...mono,fontSize:9,fontWeight:700,color:C.red}}>Score 72.4 · SELL</span>
                        </div>

                        {/* Position Score — indicator near SELL (72%) */}
                        <div style={{marginBottom:16}}>
                          <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}>
                            <span style={{...mono,fontSize:8.5,letterSpacing:'.12em',textTransform:'uppercase',color:C.text4}}>Position Score</span>
                            <span style={{...mono,fontSize:11.5,fontWeight:700,color:C.red}}>72.4 / 100 — SELL</span>
                          </div>
                          <div style={{position:'relative',height:9,borderRadius:5,background:'linear-gradient(90deg,#4ade80 0%,#86efac 18%,#fbbf24 44%,#f97316 70%,#f87171 100%)',marginBottom:6}}>
                            <div style={{position:'absolute',top:'50%',left:'72%',width:15,height:15,borderRadius:'50%',background:C.red,border:`2.5px solid ${C.bg2}`,boxShadow:'0 0 12px rgba(248,113,113,.8)',transform:'translate(-50%,-50%)'}}/>
                          </div>
                          <div style={{display:'flex',justifyContent:'space-between',...mono,fontSize:7.5,color:C.text4}}>
                            <span>STRONG BUY</span><span>BUY</span><span>FAIR</span><span>SELL</span><span>STRONG SELL</span>
                          </div>
                        </div>

                        {[
                          {name:'Near-Term Technical',col:C.green,sig:'R:R 1 : 1',pos:'47.5%',lo:'₹2,248',hi:'₹2,963',detail:'50-EMA ₹2,482 · BB-L ₹2,310 · BB-U ₹2,880 · ATR14 ₹68.4 · RSI 59.5'},
                          {name:'Fair Value (12M)',col:C.purple,sig:'−18.4% below fair',pos:'25%',lo:'₹1,920',hi:'₹3,180',detail:'P/E 72.4x · 5y avg 68.1x · sector 42.3x'},
                          {name:'Forward Cone (3M, 95% CI)',col:C.blue,sig:'⚠ earnings near',sigCol:C.amber,pos:'68%',lo:'₹1,680',hi:'₹3,620',detail:'ADV ₹1,842cr/day · earnings ≤14d (wider)'}
                        ].map((b,i)=>(
                          <div key={i} style={{background:C.bg3,border:`0.5px solid ${C.border}`,borderRadius:10,padding:14,marginBottom:10}}>
                            <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}>
                              <span style={{...mono,fontSize:9,fontWeight:700,color:b.col,letterSpacing:'.08em',textTransform:'uppercase'}}>{b.name}</span>
                              <span style={{...mono,fontSize:9,color:b.sigCol||b.col}}>{b.sig}</span>
                            </div>
                            <div style={{position:'relative',height:7,borderRadius:4,marginBottom:8,background:'linear-gradient(90deg,#4ade80 0%,#86efac 20%,#c9b57a 50%,#c07044 76%,#882222 100%)'}}>
                              <div style={{position:'absolute',top:'50%',left:b.pos,width:3,height:16,borderRadius:2,background:'#fff',boxShadow:'0 0 5px rgba(255,255,255,.9)',transform:'translate(-50%,-50%)'}}/>
                            </div>
                            <div style={{display:'flex',justifyContent:'space-between',...mono,fontSize:8,color:C.text3}}><span>{b.lo}</span><span style={{color:C.purple,fontSize:7.5}}>{b.detail}</span><span>{b.hi}</span></div>
                          </div>
                        ))}

                        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:1,marginTop:8,background:'rgba(255,255,255,0.04)',borderRadius:9,overflow:'hidden'}}>
                          {[['Worst 3M Drop (3Y)','−38.2%',C.red],['vs 3Y High','−24.8%',C.red],['Peer Group','Conglomerate · 8',C.blue]].map(([k,v,c],i)=>(
                            <div key={i} style={{background:C.bg3,padding:'10px 12px'}}>
                              <div style={{...mono,fontSize:7.5,letterSpacing:'.09em',textTransform:'uppercase',color:C.text4,marginBottom:5}}>{k}</div>
                              <div style={{...mono,fontSize:k==='Peer Group'?11:15,fontWeight:700,color:c}}>{v}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* PANEL 2: 8-Parameter Scorecard (fade, not flip) */}
              <div ref={s2Ref} style={{position:'absolute',inset:0,opacity:0,pointerEvents:'none',transition:'opacity 0.5s ease'}}>
                <div style={rpS}>
                  <div style={chromeS}>
                    <div style={{display:'flex',alignItems:'center',gap:6}}>
                      <div style={{width:7,height:7,borderRadius:'50%',background:'#252525',border:'1px solid #2e2e2e'}}/>
                      <div style={{fontSize:11,fontWeight:600,color:C.text}}>8-Parameter Scorecard</div>
                    </div>
                    <span style={{fontSize:9,...mono,color:C.text3}}>vs Communication Services sector</span>
                  </div>
                  <div style={{padding:16}}>
                    <div style={{background:'rgba(74,222,128,0.04)',border:'0.5px solid rgba(74,222,128,0.18)',borderRadius:8,padding:'10px 14px',marginBottom:14,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                      <div>
                        <div style={{...mono,fontSize:9,letterSpacing:'.08em',textTransform:'uppercase',color:C.text3,marginBottom:3}}>Overall Scorecard</div>
                        <div style={{fontSize:10,color:C.text3}}>Ranked 12 / 83 in sector</div>
                      </div>
                      <div style={{display:'flex',alignItems:'baseline',gap:6}}>
                        <span style={{...mono,fontSize:22,fontWeight:800,color:C.green,lineHeight:1}}>7.2</span>
                        <span style={{...mono,fontSize:10,color:C.text3}}>/10</span>
                        <span style={{...mono,fontSize:9,fontWeight:700,padding:'2px 8px',background:'rgba(74,222,128,0.10)',color:C.green,border:'0.5px solid rgba(74,222,128,0.25)',borderRadius:4,marginLeft:6}}>GOOD</span>
                      </div>
                    </div>

                    <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8}}>
                      {SC_ITEMS.map((c,i)=>(
                        <div key={i} style={{background:C.bg3,border:`0.5px solid ${C.border}`,borderRadius:9,padding:'10px 11px',position:'relative',overflow:'hidden',cursor:'default'}}>
                          <div style={{position:'absolute',left:0,top:0,bottom:0,width:2.5,background:c.red?C.red:C.green,borderRadius:'2px 0 0 2px'}}/>
                          <div style={{fontSize:10,fontWeight:700,color:C.text2,marginBottom:2,paddingLeft:2}}>{c.t}</div>
                          <div style={{fontSize:8,...mono,color:C.text3,marginBottom:8,letterSpacing:'.04em',paddingLeft:2}}>{c.sub}</div>
                          <div style={{display:'flex',alignItems:'baseline',gap:5,paddingLeft:2}}>
                            <span style={{fontSize:18,fontWeight:800,...mono,lineHeight:1,color:c.col}}>{c.s}</span>
                            <span style={{fontSize:8.5,fontWeight:700,...mono,textTransform:'uppercase',letterSpacing:'.06em',color:c.col}}>{c.v}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div style={{fontSize:9,color:C.text4,...mono,marginTop:10,textAlign:'center'}}>Click any category to reveal the underlying line items</div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </Reveal>
      </div>
      <style>{`.sd-flip-to1{transform:rotateY(180deg) !important}
        @media(max-width:768px){.sd-body{grid-template-columns:1fr !important;gap:28px !important}}`}</style>
    </section>
  )
}

/* ─────────────────────────────────────────────────────
   AlertsSection — scroll-triggered, looping
   CHANGE: phone wider (520px) and shorter (380px height)
───────────────────────────────────────────────────────── */
function AlertsSection() {
  const sectionRef  = useRef(null)
  const cursorRef   = useRef(null)
  const notifRef    = useRef(null)
  const innerNavRef = useRef(null)
  const phaseARef   = useRef(null)
  const phaseBRef   = useRef(null)
  const tp1Ref      = useRef(null)
  const tp2Ref      = useRef(null)
  const vhBtnRef    = useRef(null)
  const c0Ref = useRef(null); const c1Ref = useRef(null); const c2Ref = useRef(null)
  const d0Ref = useRef(null); const d1Ref = useRef(null); const d2Ref = useRef(null)
  const timers   = useRef([])
  const carTimer = useRef(null)
  const carIdx   = useRef(0)
  const isVisible = useRef(false)
  const cRefs = [c0Ref, c1Ref, c2Ref]
  const dRefs = [d0Ref, d1Ref, d2Ref]

  function clr() { timers.current.forEach(clearTimeout); timers.current = []; clearTimeout(carTimer.current) }
  function at(ms, fn) { timers.current.push(setTimeout(fn, ms)) }

  function setCard(i) {
    cRefs.forEach((r,j) => { if (r.current) r.current.style.display = j===i ? 'block' : 'none' })
    dRefs.forEach((r,j) => {
      if (!r.current) return
      r.current.style.width = j===i ? '13px' : '4px'
      r.current.style.borderRadius = j===i ? '2px' : '50%'
      r.current.style.background = j===i ? C.green : 'rgba(255,255,255,0.14)'
    })
  }

  function startCarousel() {
    carIdx.current = 0; setCard(0)
    const next = () => { carIdx.current = (carIdx.current+1)%3; setCard(carIdx.current); carTimer.current = setTimeout(next, 2200) }
    carTimer.current = setTimeout(next, 2200)
  }

  function moveCursor(el, cb) {
    if (!el || !cursorRef.current) return
    const r = el.getBoundingClientRect()
    cursorRef.current.style.display = 'block'
    cursorRef.current.style.left = (r.left + r.width/2) + 'px'
    cursorRef.current.style.top  = (window.scrollY + r.top + r.height/2) + 'px'
    setTimeout(cb || (()=>{}), 600)
  }

  function clickCursor(el, cb) {
    moveCursor(el, () => {
      const ring = cursorRef.current?.querySelector('.ac-cr')
      if (ring) { ring.style.transform = 'scale(2.8)'; ring.style.opacity = '0' }
      if (el) el.style.transform = 'scale(0.97)'
      setTimeout(() => {
        if (ring) { ring.style.transform = ''; ring.style.opacity = '' }
        if (el) el.style.transform = ''
        if (cb) cb()
      }, 380)
    })
  }

  function resetAll() {
    if (notifRef.current)   { notifRef.current.style.top='-80px'; notifRef.current.style.opacity='0' }
    if (innerNavRef.current) innerNavRef.current.style.opacity='0'
    if (phaseARef.current)  phaseARef.current.style.opacity='0'
    if (phaseBRef.current)  phaseBRef.current.style.opacity='0'
    if (tp1Ref.current)     { tp1Ref.current.style.display='block'; tp1Ref.current.style.opacity='1' }
    if (tp2Ref.current)     tp2Ref.current.style.display='none'
    if (cursorRef.current)  cursorRef.current.style.display='none'
    setCard(0); clearTimeout(carTimer.current)
  }

  function startSeq() {
    if (!isVisible.current) return
    clr(); resetAll()
    at(600, () => {
      if (!notifRef.current) return
      notifRef.current.style.transition = 'top 0.52s cubic-bezier(0.22,1,0.36,1), opacity 0.45s ease'
      notifRef.current.style.top = '11px'; notifRef.current.style.opacity = '1'
    })
    at(3600, () => {
      if (!notifRef.current) return
      notifRef.current.style.transition = 'top 0.38s ease, opacity 0.28s ease'
      notifRef.current.style.top = '-80px'; notifRef.current.style.opacity = '0'
    })
    at(4000, () => {
      if (innerNavRef.current) { innerNavRef.current.style.transition='opacity 0.4s ease'; innerNavRef.current.style.opacity='1' }
      if (phaseARef.current)   { phaseARef.current.style.transition='opacity 0.4s ease'; phaseARef.current.style.opacity='1' }
      startCarousel()
    })
    at(11500, () => {
      if (!vhBtnRef.current) return
      clickCursor(vhBtnRef.current, () => {
        clearTimeout(carTimer.current)
        if (innerNavRef.current) { innerNavRef.current.style.transition='opacity 0.3s ease'; innerNavRef.current.style.opacity='0' }
        if (phaseARef.current)   { phaseARef.current.style.transition='opacity 0.3s ease'; phaseARef.current.style.opacity='0' }
        setTimeout(() => {
          if (phaseBRef.current) { phaseBRef.current.style.transition='opacity 0.4s ease'; phaseBRef.current.style.opacity='1' }
          if (tp1Ref.current) tp1Ref.current.style.display='none'
          if (tp2Ref.current) {
            tp2Ref.current.style.display='block'; tp2Ref.current.style.opacity='0'
            requestAnimationFrame(() => {
              if (tp2Ref.current) { tp2Ref.current.style.transition='opacity 0.5s ease'; setTimeout(()=>{ if(tp2Ref.current) tp2Ref.current.style.opacity='1' },50) }
            })
          }
          if (cursorRef.current) cursorRef.current.style.display='none'
        }, 300)
      })
    })
    at(16000, () => { if(isVisible.current) startSeq() })
  }

  useEffect(() => {
    const el = sectionRef.current; if (!el) return
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting && !isVisible.current) { isVisible.current=true; startSeq() }
        if (!e.isIntersecting) { isVisible.current=false; clr(); resetAll() }
      })
    }, { threshold: 0.2 })
    obs.observe(el)
    return () => { obs.disconnect(); clr() }
  }, [])

  const phase0 = { position:'absolute',left:0,right:0,bottom:0,padding:'11px',overflow:'hidden',opacity:0 }
  const sCard  = { background:C.bg3,border:`1px solid ${C.border}`,borderRadius:9,padding:'8px 11px' }
  const aCard  = { background:C.bg3,border:`1px solid ${C.border}`,borderRadius:10,padding:'10px' }

  const AlertCard = ({ logo, logoColor, name, exchange, ret, retColor, tags, svgColor, ohlc, innerRef, hidden }) => (
    <div ref={innerRef} style={{ ...aCard, display: hidden ? 'none' : 'block' }}>
      <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:7 }}>
        <div style={{ width:24,height:24,borderRadius:5,background:C.bg4,border:`1px solid ${C.border}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:7,fontWeight:700,...mono,color:logoColor||C.green,flexShrink:0 }}>{logo}</div>
        <div><div style={{ fontSize:11,fontWeight:700,color:C.text }}>{name}</div><div style={{ fontSize:7.5,color:C.text3,...mono,marginTop:1 }}>{exchange}</div></div>
        <div style={{ marginLeft:'auto',textAlign:'right' }}>
          <div style={{ fontSize:14,fontWeight:800,...mono,color:retColor||C.green }}>{ret}</div>
          <div style={{ fontSize:7.5,color:C.text3,...mono }}>potential</div>
        </div>
      </div>
      <div style={{ display:'flex',gap:4,flexWrap:'wrap',marginBottom:7 }}>
        {tags.map((t,i) => <span key={i} style={{ fontSize:7,padding:'2px 6px',borderRadius:3,...mono,fontWeight:600,color:t.c,background:t.bg,border:`1px solid ${t.bc}` }}>{t.label}</span>)}
      </div>
      <svg viewBox="0 0 320 30" width="100%" height="30" preserveAspectRatio="none" style={{ display:'block',marginBottom:7 }}>
        <defs><linearGradient id={`alg${logo}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={svgColor} stopOpacity=".18"/><stop offset="100%" stopColor={svgColor} stopOpacity="0"/></linearGradient></defs>
        <polygon fill={`url(#alg${logo})`} points={ohlc.poly}/>
        <polyline fill="none" stroke={svgColor} strokeWidth="1.5" strokeLinecap="round" points={ohlc.line}/>
      </svg>
      <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:3 }}>
        {ohlc.vals.map(([k,v],i) => <div key={k}><div style={{ fontSize:6.5,color:C.text4,...mono,textTransform:'uppercase' }}>{k}</div><div style={{ fontSize:9.5,fontWeight:700,...mono,color:i===3?(retColor||C.green):C.text2 }}>{v}</div></div>)}
      </div>
    </div>
  )

  const tg=(label)=>({label,c:C.green,bg:'rgba(74,222,128,0.08)',bc:'rgba(74,222,128,0.22)'})
  const tb=(label)=>({label,c:C.blue,bg:'rgba(96,165,250,0.08)',bc:'rgba(96,165,250,0.22)'})
  const tp=(label)=>({label,c:C.purple,bg:'rgba(167,139,250,0.08)',bc:'rgba(167,139,250,0.22)'})
  const poly1="0,28 50,22 110,17 160,20 210,10 260,5 300,2 320,1 320,30 0,30",line1="0,28 50,22 110,17 160,20 210,10 260,5 300,2 320,1"
  const poly2="0,29 70,26 130,22 190,15 250,7 290,3 320,1 320,30 0,30",line2="0,29 70,26 130,22 190,15 250,7 290,3 320,1"
  const poly3="0,28 60,29 110,24 160,28 220,17 270,9 310,5 320,3 320,30 0,30",line3="0,28 60,29 110,24 160,28 220,17 270,9 310,5 320,3"

  return (
    <section ref={sectionRef} style={{ padding:'100px 24px', background:C.bg, position:'relative' }}>
      <div ref={cursorRef} style={{ position:'fixed',zIndex:9999,pointerEvents:'none',display:'none',transition:'left 0.55s cubic-bezier(.4,0,.2,1),top 0.55s cubic-bezier(.4,0,.2,1)' }}>
        <div style={{ width:8,height:8,background:'#fff',borderRadius:'50%',position:'relative',zIndex:1 }} />
        <div className="ac-cr" style={{ width:22,height:22,border:'1.5px solid rgba(255,255,255,0.5)',borderRadius:'50%',position:'absolute',top:-7,left:-7,transition:'transform 0.2s,opacity 0.2s' }} />
      </div>
      <div style={{ maxWidth:1100, margin:'0 auto' }}>
        <Reveal><div style={{ fontSize:11,color:C.text3,...mono,letterSpacing:'0.12em',fontWeight:700,marginBottom:14,textTransform:'uppercase' }}>daily intelligence</div></Reveal>
        <Reveal delay={80}><h2 className="ld-section-title" style={{ fontSize:42,fontWeight:800,color:C.text,letterSpacing:'-1px',lineHeight:1.15,margin:'0 0 14px',maxWidth:760 }}>Never miss a <span style={{ color:C.text3 }}>market signal.</span></h2></Reveal>
        <Reveal delay={120}><p style={{ fontSize:16,color:C.text2,lineHeight:1.6,maxWidth:560,margin:'0 0 56px' }}>Real-time alerts built for investors.</p></Reveal>
        <Reveal delay={180}>
          <div className="alerts-grid" style={{ display:'grid',gridTemplateColumns:'1.4fr 1fr',gap:48,alignItems:'center' }}>
            <div style={{ display:'flex',justifyContent:'center' }}>
              <div style={{ width:'100%',maxWidth:520,background:'#0a0a0a',borderRadius:16,border:'1.5px solid rgba(255,255,255,0.1)',boxShadow:'0 0 0 1px rgba(255,255,255,0.04),0 40px 100px rgba(0,0,0,0.85)',overflow:'hidden',position:'relative' }}>
                <div style={{ height:34,background:'#0d0d0d',borderBottom:'1px solid rgba(255,255,255,0.06)',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 14px' }}>
                  <div style={{ width:6,height:6,borderRadius:'50%',background:'#1a1a1a',border:'1px solid #252525' }} />
                  <div style={{ display:'flex',gap:8,alignItems:'center' }}><span style={{ fontSize:9,color:C.text4,...mono }}>9:41</span><span style={{ fontSize:9,color:'rgba(74,222,128,0.55)',...mono }}>● NSE LIVE</span></div>
                  <div style={{ width:26,height:26,borderRadius:'50%',background:'#111',border:'1px solid #222',display:'flex',alignItems:'center',justifyContent:'center' }}><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="3"/></svg></div>
                </div>
                <div style={{ height:380,overflow:'hidden',position:'relative',background:'#0a0a0a' }}>
                  <div ref={notifRef} style={{ position:'absolute',top:-80,left:'50%',transform:'translateX(-50%)',width:'90%',zIndex:20,background:'rgba(16,16,16,0.97)',backdropFilter:'blur(24px)',border:'1px solid rgba(255,255,255,0.13)',borderRadius:13,padding:'11px 13px',display:'flex',alignItems:'center',gap:10,boxShadow:'0 14px 44px rgba(0,0,0,0.75)',opacity:0 }}>
                    <div style={{ width:34,height:34,borderRadius:8,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',background:'#111',border:'1px solid rgba(74,222,128,0.28)' }}>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="24" height="24"><rect x="1" y="1" width="30" height="30" fill="#111111" rx="7" stroke="#4ade80" strokeWidth="1.5"/><polyline points="8,21 16,9 24,21" fill="none" stroke="#4ade80" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                    <div style={{ flex:1,minWidth:0 }}><div style={{ fontSize:12,fontWeight:700,color:C.text,marginBottom:2 }}>View today&apos;s alerts</div><div style={{ fontSize:10,color:'rgba(255,255,255,0.4)',...mono }}>See what&apos;s moving today →</div></div>
                    <div style={{ fontSize:9,color:C.text4,...mono,flexShrink:0 }}>now</div>
                  </div>
                  <div ref={innerNavRef} style={{ height:38,background:'#0d0d0d',borderBottom:'1px solid rgba(255,255,255,0.06)',display:'flex',alignItems:'center',padding:'0 13px',gap:10,opacity:0,position:'relative',zIndex:1 }}>
                    <div style={{ fontSize:12,fontWeight:600,color:C.text,letterSpacing:-0.3 }}>stok<span style={{ color:C.green }}>radar</span></div>
                    <div style={{ display:'flex',gap:2,flex:1 }}>{['Alerts','Screens','Portfolio','MF'].map((l,i)=>(<div key={l} style={{ padding:'3px 7px',borderRadius:5,fontSize:9.5,color:i===0?C.green:C.text3,background:i===0?'rgba(74,222,128,0.1)':'transparent',fontWeight:i===0?600:400 }}>{l}</div>))}</div>
                  </div>
                  <div ref={phaseARef} style={{ ...phase0, top:38 }}>
                    <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:10 }}>
                      <div style={sCard}><div style={{ fontSize:7.5,color:C.text3,...mono,letterSpacing:'.08em',textTransform:'uppercase',marginBottom:2 }}>Today&apos;s Alerts</div><div style={{ fontSize:18,fontWeight:800,...mono,color:C.green,lineHeight:1 }}>12</div><div style={{ fontSize:7.5,color:C.text4,marginTop:2 }}>across NSE · BSE</div></div>
                      <div style={sCard}><div style={{ fontSize:7.5,color:C.text3,...mono,letterSpacing:'.08em',textTransform:'uppercase',marginBottom:2 }}>Safe Bets</div><div style={{ fontSize:18,fontWeight:800,...mono,color:C.blue,lineHeight:1 }}>4</div><div style={{ fontSize:7.5,color:C.text4,marginTop:2 }}>high confidence</div></div>
                    </div>
                    <div style={{ fontSize:7.5,letterSpacing:'.12em',textTransform:'uppercase',color:C.text4,...mono,marginBottom:5 }}>Top alerts today</div>
                    <AlertCard innerRef={c0Ref} hidden={false} logo="INFY" name="Infosys Ltd" exchange="NSE · IT" ret="+8.4%" svgColor="#4ade80" tags={[tg('Bullish breakout'),tb('Volume surge'),tp('FII buying')]} ohlc={{poly:poly1,line:line1,vals:[['Open','₹1,842'],['High','₹1,901'],['Low','₹1,836'],['Target','₹1,996']]}} />
                    <AlertCard innerRef={c1Ref} hidden={true} logo="VLTV" name="Voltas Ltd" exchange="NSE · Consumer" ret="+11.2%" svgColor="#4ade80" tags={[tg('52W breakout'),tg('Momentum')]} ohlc={{poly:poly2,line:line2,vals:[['Open','₹1,244'],['High','₹1,328'],['Low','₹1,238'],['Target','₹1,384']]}} />
                    <AlertCard innerRef={c2Ref} hidden={true} logo="HDFC" logoColor={C.green} name="HDFC Bank" exchange="NSE · Banking" ret="+6.1%" retColor={C.green} svgColor="#4ade80" tags={[tg('RSI oversold'),tp('MF accum.')]} ohlc={{poly:poly3,line:line3,vals:[['Open','₹1,622'],['High','₹1,658'],['Low','₹1,614'],['Target','₹1,720']]}} />
                    <div style={{ display:'flex',gap:4,justifyContent:'center',marginTop:8 }}>
                      <div ref={d0Ref} style={{ width:13,height:4,borderRadius:2,background:C.green,transition:'all 0.3s' }} />
                      <div ref={d1Ref} style={{ width:4,height:4,borderRadius:'50%',background:'rgba(255,255,255,0.14)',transition:'all 0.3s' }} />
                      <div ref={d2Ref} style={{ width:4,height:4,borderRadius:'50%',background:'rgba(255,255,255,0.14)',transition:'all 0.3s' }} />
                    </div>
                    <div ref={vhBtnRef} style={{ marginTop:9,padding:'8px 13px',border:'1px solid rgba(74,222,128,0.18)',borderRadius:9,background:'rgba(74,222,128,0.04)',display:'flex',alignItems:'center',justifyContent:'space-between',cursor:'pointer' }}>
                      <div><div style={{ fontSize:11.5,fontWeight:700,color:C.green }}>View alert history</div><div style={{ fontSize:7.5,color:C.text3,...mono,marginTop:1 }}>All past alerts · sorted by date</div></div>
                      <div style={{ fontSize:15,color:C.green }}>→</div>
                    </div>
                  </div>
                  <div ref={phaseBRef} style={{ ...phase0, top:0 }}>
                    <div style={{ marginBottom:10,paddingBottom:8,borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ fontSize:14,fontWeight:800,color:C.text }}>Alert History</div>
                      <div style={{ fontSize:8,color:C.text4,...mono,marginTop:2 }}>Potential returns · entry to peak since alert date</div>
                    </div>
                    {[{date:'15 May 2026',count:'1 stock · 1 positive',val:'+7.84%',col:C.green,hl:true},{date:'14 May 2026',count:'9 stocks · 9 positive',val:'+6.48%',col:C.green,hl:false},{date:'13 May 2026',count:'8 stocks · 8 positive',val:'+6.22%',col:C.green,hl:false},{date:'12 May 2026',count:'25 stocks · 25 positive',val:'+6.55%',col:C.green,hl:false},{date:'8 May 2026',count:'4 stocks · 4 positive',val:'+9.68%',col:C.amber,hl:false}].map((r,i)=>(
                      <div key={i} style={{ display:'flex',alignItems:'center',gap:8,padding:'7px 10px',background:r.hl?'rgba(74,222,128,0.04)':C.bg3,border:r.hl?'1px solid rgba(74,222,128,0.28)':`1px solid ${C.border}`,borderRadius:8,marginBottom:5,cursor:'pointer' }}>
                        <div><div style={{ fontSize:10.5,fontWeight:700,color:C.text }}>{r.date}</div><div style={{ fontSize:8,color:C.text3,...mono,marginTop:1 }}>{r.count}</div></div>
                        <div style={{ textAlign:'right',marginLeft:'auto' }}><div style={{ fontSize:7,color:C.text4,...mono,textTransform:'uppercase',letterSpacing:'.06em' }}>Potential</div><div style={{ fontSize:13,fontWeight:800,...mono,color:r.col }}>{r.val}</div></div>
                        <div style={{ fontSize:9,color:C.text4,flexShrink:0 }}>▾</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div>
              <div ref={tp1Ref}>
                <div style={{ fontSize:11,color:C.text3,...mono,letterSpacing:'0.12em',fontWeight:700,marginBottom:14,textTransform:'uppercase' }}>01 · Smart alerts</div>
                <h3 style={{ fontSize:28,fontWeight:800,lineHeight:1.15,letterSpacing:'-0.6px',color:C.text,margin:'0 0 14px' }}>Day&apos;s top alerts.<br /><span style={{ color:C.green,fontStyle:'italic',fontFamily:'Georgia, serif',fontWeight:400 }}>One tap away.</span></h3>
                <p style={{ fontSize:15,color:C.text2,lineHeight:1.72,margin:'0 0 24px' }}>Every morning, stokradar surfaces the highest-potential NSE opportunities — screened across momentum, volume, technicals and institutional activity. No noise, just signals worth acting on.</p>
                <div style={{ display:'inline-flex',alignItems:'center',gap:6,padding:'7px 14px',borderRadius:20,background:'rgba(74,222,128,0.08)',border:'1px solid rgba(74,222,128,0.22)',fontSize:11,color:C.green,...mono,fontWeight:700 }}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="13" height="13"><rect x="1" y="1" width="30" height="30" fill="#111" rx="5" stroke="#4ade80" strokeWidth="1.5"/><polyline points="8,21 16,9 24,21" fill="none" stroke="#4ade80" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  Live every market day
                </div>
              </div>
              <div ref={tp2Ref} style={{ display:'none',opacity:0 }}>
                <div style={{ fontSize:11,color:C.text3,...mono,letterSpacing:'0.12em',fontWeight:700,marginBottom:14,textTransform:'uppercase' }}>02 · Alert history</div>
                <h3 style={{ fontSize:28,fontWeight:800,lineHeight:1.15,letterSpacing:'-0.6px',color:C.text,margin:'0 0 14px' }}>Every alert.<br /><span style={{ color:C.green,fontStyle:'italic',fontFamily:'Georgia, serif',fontWeight:400 }}>Every day.</span></h3>
                <p style={{ fontSize:15,color:C.text2,lineHeight:1.72,margin:'0 0 24px' }}>Access every alert stokradar has ever generated — sorted by date, with potential return for each session.</p>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

/* ── MutualFundsSection ── unchanged ── */
function MutualFundsSection() {
  const openNotify = useNotify()
  const [topIdx, setTopIdx] = useState(0); const [botIdx, setBotIdx] = useState(0)
  const topTimer = useRef(null); const botTimer = useRef(null)
  const startTopTimer = useCallback(() => { clearInterval(topTimer.current); topTimer.current = setInterval(() => setTopIdx(p => (p+1)%3), 3000) }, [])
  const startBotTimer = useCallback(() => { clearInterval(botTimer.current); botTimer.current = setInterval(() => setBotIdx(p => (p+1)%3), 3000) }, [])
  useEffect(() => { startTopTimer(); startBotTimer(); return () => { clearInterval(topTimer.current); clearInterval(botTimer.current) } }, [])
  const jumpTop=(i)=>{setTopIdx(i);clearInterval(topTimer.current);topTimer.current=setInterval(()=>setTopIdx(p=>(p+1)%3),3000)}
  const jumpBot=(i)=>{setBotIdx(i);clearInterval(botTimer.current);botTimer.current=setInterval(()=>setBotIdx(p=>(p+1)%3),3000)}
  const panelS={background:'#111',border:`1px solid ${C.border}`,borderRadius:14,overflow:'hidden'}
  // Locked heights to prevent layout shift when slides rotate every 3s.
  // Tallest top slide ≈ Rolling Returns (~300), tallest bot slide ≈ Expense
  // Calc (~360). Use 380 to fit both with margin and stop downstream jump.
  const textPanelS={display:'flex',flexDirection:'column',justifyContent:'center',padding:'32px 36px',height:380}
  const visPanelS={position:'relative',overflow:'hidden',height:380}
  // Slides ALWAYS absolute so they don't size the wrapper. Wrapper height is fixed above.
  const slideS=(active)=>({position:'absolute',inset:0,opacity:active?1:0,transition:'opacity 0.5s ease',padding:20,display:'flex',flexDirection:'column',justifyContent:'center',pointerEvents:active?'auto':'none'})
  const dotS=(active)=>({width:active?28:18,height:3,borderRadius:2,background:active?C.green:'rgba(255,255,255,0.15)',cursor:'pointer',transition:'all 0.3s'})
  const topTexts=[{heading:'Fund Sector Distribution.',desc:'See exactly which sectors a fund bets on and how concentrated those bets are — before you decide if it fits your portfolio.'},{heading:'How it compares.',desc:"Every fund sits next to its closest peers — same sub-category, same benchmark — ranked by expense ratio, Sharpe and our overall score."},{heading:'Rolling Returns.',desc:'A single point-in-time return can mislead. Rolling returns show every historical window since launch — so you see the realistic return cone.'}]
  const botTexts=[{heading:'Fund Allocation.',desc:"See exactly how the fund splits its corpus — across equity, debt, government securities, REITs and cash."},{heading:'How we rate it.',desc:'Every fund gets a scorecard across Performance, Risk, Cost and Consistency — ranked against every fund in the same sub-category.'},{heading:'Expense ratio calculator.',desc:"Even a 0.5% difference in expense ratio compounds to lakhs over a decade."}]
  const SecBar=({name,pct,color,w})=>(<div style={{marginBottom:10}}><div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}><span style={{fontSize:11.5,color:C.text2}}>{name}</span><span style={{...mono,fontSize:11.5,fontWeight:700,color:C.text}}>{pct}</span></div><div style={{height:4,background:'rgba(255,255,255,0.06)',borderRadius:2,overflow:'hidden'}}><div style={{height:'100%',borderRadius:2,width:w,background:color}}/></div></div>)
  return (
    <section className="ld-section" style={{padding:'100px 24px',background:C.bg2,borderTop:`1px solid ${C.border}`,borderBottom:`1px solid ${C.border}`}}>
      <div style={{maxWidth:1100,margin:'0 auto'}}>
        <Reveal><div style={{fontSize:11,color:C.text3,...mono,letterSpacing:'0.12em',fontWeight:700,marginBottom:14,textTransform:'uppercase'}}>for mutual fund investors</div></Reveal>
        <Reveal delay={80}><h2 className="ld-section-title" style={{fontSize:42,fontWeight:800,color:C.text,letterSpacing:'-1px',lineHeight:1.15,margin:'0 0 14px',maxWidth:760}}>Honest fund analytics. <span style={{color:C.text3}}>Beyond the 5Y CAGR.</span></h2></Reveal>
        <Reveal delay={120}><p style={{fontSize:16,color:C.text2,lineHeight:1.6,maxWidth:640,margin:'0 0 40px'}}>Rolling returns. Drawdown. Holdings overlap. Peer comparison. Expense impact. Direct growth plans · scored &amp; ranked across 3,000+ funds.</p></Reveal>
        <Reveal delay={180}>
          <div className="ld-feature-grid" style={{display:'grid',gridTemplateColumns:'1fr 1.4fr',gap:16,marginBottom:16}}>
            <div style={panelS}><div style={textPanelS}>
              <div style={{...mono,fontSize:9,color:C.green,letterSpacing:'.18em',fontWeight:700,textTransform:'uppercase',marginBottom:8}}>01 · Explore</div>
              {topTexts.map((t,i)=>(<div key={i} style={{display:i===topIdx?'flex':'none',flexDirection:'column',justifyContent:'center'}}><div style={{fontSize:'clamp(20px,2.2vw,28px)',fontWeight:800,color:C.text,letterSpacing:'-.5px',lineHeight:1.15,marginBottom:12}}>{t.heading}</div><div style={{fontSize:14,color:C.text2,lineHeight:1.7,maxWidth:340}}>{t.desc}</div></div>))}
              <div style={{display:'flex',gap:6,marginTop:20}}>{[0,1,2].map(i=><div key={i} style={dotS(i===topIdx)} onClick={()=>jumpTop(i)}/>)}</div>
            </div></div>
            <div style={{...panelS,...visPanelS}}>
              <div style={slideS(topIdx===0)}><div style={{...mono,fontSize:8,color:C.text4,letterSpacing:'.12em',textTransform:'uppercase',marginBottom:14,display:'flex',justifyContent:'space-between'}}><span>Mirae Asset Healthcare · Sector Distribution</span><span style={{color:'rgba(74,222,128,.5)'}}>5 sectors</span></div><SecBar name="Pharmaceuticals" pct="76.50%" color={C.blue} w="76.5%"/><SecBar name="Labs & Life Sciences" pct="22.23%" color={C.purple} w="22.23%"/><SecBar name="Diversified Chemicals" pct="1.11%" color={C.amber} w="11%"/><SecBar name="Miscellaneous" pct="0.26%" color="#fb923c" w="4%"/><SecBar name="Others" pct="−0.11%" color="#06b6d4" w="2%"/><div style={{...mono,fontSize:8.5,color:C.text4,marginTop:14,paddingTop:10,borderTop:'1px solid rgba(255,255,255,.05)'}}>Portfolio as of Apr 2026</div></div>
              <div style={slideS(topIdx===1)}><div style={{...mono,fontSize:8,color:C.text4,letterSpacing:'.12em',textTransform:'uppercase',marginBottom:12}}>vs Sectoral &amp; Thematic peers</div><div style={{display:'grid',gridTemplateColumns:'1fr 56px 52px 44px',gap:6,padding:'6px 8px',...mono,fontSize:7.5,color:C.text4,letterSpacing:'.08em',textTransform:'uppercase',borderBottom:'1px solid rgba(255,255,255,.06)'}}><div>Fund</div><div style={{textAlign:'right'}}>Exp</div><div style={{textAlign:'right'}}>Sharpe</div><div style={{textAlign:'right'}}>Score</div></div>{[{name:'Mirae Healthcare',amc:'Mirae Asset',exp:'0.47%',expC:C.green,sharpe:'0.96',score:'76',main:true},{name:'BOI Manufacturing',amc:'Bank of India',exp:'0.62%',expC:C.text2,sharpe:'0.65',score:'75'},{name:'Navi Nifty India Mfg',amc:'Navi',exp:'0.41%',expC:C.green,sharpe:'0.90',score:'74'},{name:'DSP India T.I.G.E.R.',amc:'DSP',exp:'0.74%',expC:C.red,sharpe:'0.58',score:'73'},{name:'ICICI Pru BHARAT 22',amc:'ICICI Pru',exp:'0.19%',expC:C.green,sharpe:'0.58',score:'72'}].map((r,i)=>(<div key={i} style={{display:'grid',gridTemplateColumns:'1fr 56px 52px 44px',gap:6,padding:'8px 8px',borderRadius:6,fontSize:11,marginBottom:3,background:r.main?'rgba(74,222,128,.04)':'transparent',border:r.main?'1px solid rgba(74,222,128,.2)':'1px solid transparent',borderLeft:r.main?'2px solid '+C.green:undefined,paddingLeft:r.main?6:8}}><div><div style={{fontSize:11,fontWeight:r.main?700:600,color:r.main?C.green:C.text,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{r.name}</div><div style={{...mono,fontSize:8,color:C.text3,marginTop:1}}>{r.amc}</div></div><div style={{...mono,fontSize:11,textAlign:'right',color:r.expC}}>{r.exp}</div><div style={{...mono,fontSize:11,textAlign:'right',color:C.text2}}>{r.sharpe}</div><div style={{...mono,fontSize:11,textAlign:'right',color:C.green,fontWeight:700}}>{r.score}</div></div>))}</div>
              <div style={slideS(topIdx===2)}><div style={{...mono,fontSize:8,color:C.text4,letterSpacing:'.12em',textTransform:'uppercase',marginBottom:12}}>Rolling Returns (3Y) · 1,193 windows</div><div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:6,marginBottom:12}}>{[{k:'Worst',v:'14.2%',c:C.text2},{k:'P25',v:'18.9%',c:'#86efac'},{k:'Median',v:'22.8%',c:C.green},{k:'P75',v:'29.0%',c:C.green},{k:'Best',v:'35.8%',c:C.green}].map(t=>(<div key={t.k} style={{background:C.bg3,border:`1px solid ${C.border}`,borderRadius:8,padding:'8px 10px',textAlign:'center'}}><div style={{...mono,fontSize:8,color:C.text4,textTransform:'uppercase',letterSpacing:'.06em',marginBottom:3}}>{t.k}</div><div style={{...mono,fontSize:14,fontWeight:700,color:t.c}}>{t.v}</div></div>))}</div><svg viewBox="0 0 520 90" width="100%" height="90" style={{display:'block',marginBottom:10}}>{[{x:0,h:38},{x:52,h:56},{x:104,h:78},{x:156,h:68},{x:208,h:74},{x:260,h:52},{x:312,h:66},{x:364,h:58},{x:416,h:36}].map((b,i)=>(<rect key={i} x={b.x+4} y={90-b.h} width="44" height={b.h} fill={C.green} opacity={0.5+i*0.04} rx="2"/>))}</svg><div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:6,marginTop:10,padding:'8px 12px',background:C.bg3,borderRadius:7}}>{[{k:'Positive',v:'100%'},{k:'Beat inflation',v:'100%'},{k:'Beat 12%',v:'100%'},{k:'Beat 15%',v:'98.4%'}].map(t=>(<div key={t.k}><div style={{fontSize:9,color:C.text3,marginBottom:3}}>{t.k}</div><div style={{...mono,fontSize:12,fontWeight:700,color:C.green}}>{t.v}</div></div>))}</div></div>
            </div>
          </div>
        </Reveal>
        <Reveal delay={220}>
          <div className="ld-feature-grid" style={{display:'grid',gridTemplateColumns:'1fr 1.4fr',gap:16}}>
            <div style={panelS}><div style={textPanelS}>
              <div style={{...mono,fontSize:9,color:C.green,letterSpacing:'.18em',fontWeight:700,textTransform:'uppercase',marginBottom:8}}>02 · Analytics</div>
              {botTexts.map((t,i)=>(<div key={i} style={{display:i===botIdx?'flex':'none',flexDirection:'column',justifyContent:'center'}}><div style={{fontSize:'clamp(20px,2.2vw,28px)',fontWeight:800,color:C.text,letterSpacing:'-.5px',lineHeight:1.15,marginBottom:12}}>{t.heading}</div><div style={{fontSize:14,color:C.text2,lineHeight:1.7,maxWidth:340}}>{t.desc}</div></div>))}
              <div style={{display:'flex',gap:6,marginTop:20}}>{[0,1,2].map(i=><div key={i} style={dotS(i===botIdx)} onClick={()=>jumpBot(i)}/>)}</div>
            </div></div>
            <div style={{...panelS,...visPanelS}}>
              <div style={slideS(botIdx===0)}><div style={{...mono,fontSize:8,color:C.text4,letterSpacing:'.12em',textTransform:'uppercase',marginBottom:14,display:'flex',justifyContent:'space-between'}}><span>Mirae Asset Healthcare · Asset Allocation</span><span style={{color:'rgba(74,222,128,.5)'}}>Apr 2026</span></div><SecBar name="Equity" pct="98.60%" color={C.blue} w="98.6%"/><SecBar name="Cash & Equivalents" pct="1.28%" color="#71717a" w="12%"/><SecBar name="Others" pct="0.12%" color="#52525b" w="2%"/></div>
              <div style={slideS(botIdx===1)}><div style={{...mono,fontSize:8,color:C.text4,letterSpacing:'.12em',textTransform:'uppercase',marginBottom:12,display:'flex',justifyContent:'space-between'}}><span>Scorecard</span><span>vs Sectoral &amp; Thematic peers</span></div><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>{[{name:'Performance',badge:'Great',bCol:C.green,val:'28.0',max:'/30'},{name:'Risk',badge:'Good',bCol:C.blue,val:'16.5',max:'/25'},{name:'Cost',badge:'Great',bCol:C.green,val:'18.0',max:'/20'},{name:'Consistency',badge:'Good',bCol:C.blue,val:'5.9',max:'/10'}].map(c=>(<div key={c.name} style={{background:C.bg3,border:`1px solid ${C.border}`,borderRadius:10,padding:14}}><div style={{fontSize:12,fontWeight:700,color:C.text,marginBottom:8}}>{c.name}</div><div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}><span style={{...mono,fontSize:7.5,fontWeight:700,padding:'2px 7px',borderRadius:3,background:c.bCol===C.green?'rgba(74,222,128,.12)':'rgba(96,165,250,.10)',color:c.bCol,border:`1px solid ${c.bCol===C.green?'rgba(74,222,128,.3)':'rgba(96,165,250,.28)'}`}}>{c.badge}</span><span style={{...mono,fontSize:15,fontWeight:700,color:C.green}}>{c.val}<span style={{fontSize:9,color:C.text3}}>{c.max}</span></span></div></div>))}</div><div style={{...mono,fontSize:8.5,color:C.text4,marginTop:14,paddingTop:10,borderTop:'1px solid rgba(255,255,255,.05)'}}>Overall score: 76 · #1 in Sectoral &amp; Thematic</div></div>
              <div style={slideS(botIdx===2)}><div style={{...mono,fontSize:8,color:C.text4,letterSpacing:'.12em',textTransform:'uppercase',marginBottom:14}}>Expense Ratio Calculator · 0.47% · ₹1L over 10 years</div><div className="ld-feature-grid-2" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}><div><div style={{marginBottom:12}}><div style={{display:'flex',justifyContent:'space-between',marginBottom:5,fontSize:11}}><span style={{color:C.text2}}>Investment</span><span style={{...mono,fontWeight:700,color:C.green,fontSize:11}}>₹1,00,000</span></div><div style={{height:4,background:'rgba(255,255,255,.1)',borderRadius:2}}><div style={{height:'100%',borderRadius:2,background:C.green,width:'15%'}}/></div></div><div style={{marginBottom:12}}><div style={{display:'flex',justifyContent:'space-between',marginBottom:5,fontSize:11}}><span style={{color:C.text2}}>Duration</span><span style={{...mono,fontWeight:700,color:C.green,fontSize:11}}>10 yrs</span></div><div style={{height:4,background:'rgba(255,255,255,.1)',borderRadius:2}}><div style={{height:'100%',borderRadius:2,background:C.green,width:'30%'}}/></div></div><div style={{background:C.bg3,borderRadius:7,padding:'10px 12px',marginTop:6}}><div style={{...mono,fontSize:9,color:C.text3,marginBottom:3}}>Gross return assumed: 12% p.a.</div><div style={{...mono,fontSize:9,color:C.text3}}>Fund expense ratio: 0.47%</div></div></div><div style={{display:'flex',flexDirection:'column',gap:8}}><div style={{background:C.bg3,border:`1px solid ${C.border}`,borderRadius:9,padding:12}}><div style={{...mono,fontSize:8,color:C.text3,textTransform:'uppercase',letterSpacing:'.06em',marginBottom:4}}>Value with this fund</div><div style={{...mono,fontSize:16,fontWeight:700,color:C.text}}>₹2.98 L</div></div><div style={{background:'rgba(74,222,128,.05)',border:'1px solid rgba(74,222,128,.18)',borderRadius:9,padding:12}}><div style={{...mono,fontSize:8,color:C.green,textTransform:'uppercase',letterSpacing:'.06em',marginBottom:4}}>Without expense ratio</div><div style={{...mono,fontSize:16,fontWeight:700,color:C.text2}}>₹3.11 L</div></div><div style={{background:'rgba(248,113,113,.05)',border:'1px solid rgba(248,113,113,.18)',borderRadius:9,padding:12}}><div style={{...mono,fontSize:8,color:C.red,textTransform:'uppercase',letterSpacing:'.06em',marginBottom:4}}>Cost of fees</div><div style={{...mono,fontSize:16,fontWeight:700,color:C.red}}>₹12,790</div></div></div></div></div>
            </div>
          </div>
        </Reveal>
        <Reveal delay={260}><div style={{marginTop:28,textAlign:'center'}}><span onClick={openNotify} style={{display:'inline-flex',alignItems:'center',gap:6,fontSize:14,fontWeight:700,color:C.green,...mono,cursor:'pointer'}}>Notify me when it&apos;s live →</span></div></Reveal>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────────────
   ETFSection — slide 1 shows realistic Premium/Discount to NAV chart
───────────────────────────────────────────────────────── */
function ETFSection() {
  const [idx, setIdx] = useState(0)
  const timer = useRef(null)
  const crossRef = useRef(null)
  const tipRef = useRef(null)
  const tipVRef = useRef(null)
  const tipDRef = useRef(null)
  const pdSeriesRef = useRef(null)
  const priceSeriesRef = useRef(null)

  useEffect(() => {
    function genPD(N, seed) {
      const vals = []; let r = seed, prev = 0
      for (let i = 0; i < N; i++) {
        r = (r * 1664525 + 1013904223) & 0xffffffff
        const noise = ((r / 0x7fffffff) - 1) * 0.42
        prev = prev * 0.15 + noise * 0.85
        vals.push(Math.round(prev * 100) / 100)
      }
      vals[187] = 1.2; vals[188] = 3.85; vals[189] = 2.1; vals[190] = 0.9; vals[191] = 0.3
      return vals
    }
    function smooth(a, w) { return a.map((_,i)=>{ let s=0,c=0; for(let j=Math.max(0,i-w);j<=Math.min(a.length-1,i+w);j++){s+=a[j];c++} return s/c }) }
    pdSeriesRef.current = smooth(genPD(252, 91), 1)
    function genPrice(days, start, drift, vol, seed) {
      const pts=[start]; let r=seed
      for(let i=1;i<days;i++){r=(r*1664525+1013904223)&0xffffffff;const n=((r/0x7fffffff)-1)*vol;pts.push(Math.max(5,pts[i-1]*(1+drift/days+n)))}
      return pts
    }
    priceSeriesRef.current = smooth(genPrice(252, 55, 0.72, 0.022, 99), 3)
  }, [])

  useEffect(() => { timer.current = setInterval(() => setIdx(p=>(p+1)%2), 3000); return () => clearInterval(timer.current) }, [])
  const jump = (i) => { setIdx(i); clearInterval(timer.current); timer.current = setInterval(() => setIdx(p=>(p+1)%2), 3000) }
  const dotS = (active) => ({ width:active?28:18,height:3,borderRadius:2,background:active?C.green:'rgba(255,255,255,0.15)',cursor:'pointer',transition:'all 0.3s' })
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

  const renderPremiumDiscount = () => {
    const s = pdSeriesRef.current
    if (!s) return null
    const W=800, H=140, PAD=10
    const minV = Math.min(...s), maxV = Math.max(...s), range = maxV - minV || 1
    const toX = i => (i / (s.length-1)) * W
    const toY = v => H - PAD - ((v - minV) / range) * (H - PAD*2)
    const zeroY = toY(0)
    const pts = s.map((v,i) => `${toX(i)},${toY(v)}`).join(' ')
    const avg = (s.reduce((a,b)=>a+b,0)/s.length)
    const latest = s[s.length-1]

    return (
      <div>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:6,flexWrap:'wrap',gap:8}}>
          <div>
            <div style={{...mono,fontSize:8,color:C.text4,letterSpacing:'.12em',textTransform:'uppercase',marginBottom:3}}>Premium / Discount to NAV</div>
            <div style={{...mono,fontSize:9,color:C.text3}}>avg {avg>=0?'+':''}{avg.toFixed(2)}% · latest {latest>=0?'+':''}{latest.toFixed(2)}% · 236 pts</div>
          </div>
          <div style={{display:'flex',gap:2}}>
            {['1M','3M','6M','1Y','3Y','5Y'].map((p,i)=>(
              <div key={p} style={{...mono,fontSize:10,padding:'3px 8px',borderRadius:5,cursor:'pointer',
                color:i===3?C.green:C.text3,background:i===3?'rgba(74,222,128,.10)':'transparent',
                border:i===3?'1px solid rgba(74,222,128,.22)':'1px solid transparent'}}>{p}</div>
            ))}
          </div>
        </div>
        <div style={{position:'relative',height:H+20,cursor:'crosshair'}}
          onMouseMove={e=>{
            const rect=e.currentTarget.getBoundingClientRect()
            const pctX=(e.clientX-rect.left)/rect.width
            const i=Math.min(Math.max(Math.round(pctX*(s.length-1)),0),s.length-1)
            const svgX=toX(i),pxX=(svgX/W)*rect.width
            if(crossRef.current){crossRef.current.setAttribute('x1',svgX);crossRef.current.setAttribute('x2',svgX);crossRef.current.style.display='block'}
            if(tipRef.current)tipRef.current.style.display='block'
            if(tipVRef.current)tipVRef.current.textContent=(s[i]>=0?'+':'')+s[i].toFixed(2)+'%'
            const d=new Date();d.setDate(d.getDate()-(s.length-1-i))
            if(tipDRef.current)tipDRef.current.textContent=d.getDate()+' '+MONTHS[d.getMonth()]+' '+d.getFullYear()
            if(tipRef.current)tipRef.current.style.left=(pxX+140>rect.width?pxX-146:pxX+10)+'px'
          }}
          onMouseLeave={()=>{if(crossRef.current)crossRef.current.style.display='none';if(tipRef.current)tipRef.current.style.display='none'}}>
          <svg viewBox={`0 0 ${W} ${H+20}`} width="100%" height={H+20} style={{display:'block'}} preserveAspectRatio="none">
            <line x1="0" y1={zeroY} x2={W} y2={zeroY} stroke="rgba(255,255,255,0.18)" strokeWidth="1" strokeDasharray="4,4"/>
            {s.map((v,i,arr)=>{
              if(i===0) return null
              const x1=toX(i-1),x2=toX(i),y1=toY(arr[i-1]),y2=toY(v),yz=zeroY
              const col = v >= 0 ? 'rgba(251,191,36,0.12)' : 'rgba(248,113,113,0.10)'
              return <polygon key={i} fill={col} points={`${x1},${yz} ${x1},${y1} ${x2},${y2} ${x2},${yz}`}/>
            })}
            <polyline fill="none" stroke="#fbbf24" strokeWidth="1.5" points={pts}/>
            <line ref={crossRef} x1="0" y1="0" x2="0" y2={H+20} stroke="rgba(255,255,255,.2)" strokeWidth="1" style={{display:'none'}}/>
          </svg>
          <div ref={tipRef} style={{display:'none',position:'absolute',top:6,left:10,background:'#1a1a1a',border:'1px solid rgba(255,255,255,.12)',borderRadius:6,padding:'6px 10px',...mono,fontSize:11,pointerEvents:'none',whiteSpace:'nowrap'}}>
            <div ref={tipVRef} style={{fontWeight:600,color:C.amber}}/>
            <div ref={tipDRef} style={{color:C.text3,fontSize:9,marginTop:2}}/>
          </div>
        </div>
        <div style={{...mono,fontSize:8,color:C.text4,marginTop:6,lineHeight:1.5}}>
          Above 0 = ETF trades above NAV (premium) · Below 0 = below NAV (discount). Persistent &gt;1% premiums or discounts can signal liquidity or arbitrage gaps.
        </div>
      </div>
    )
  }

  const renderScorecard = () => (
    <div>
      <div style={{...mono,fontSize:8,color:C.text4,letterSpacing:'.12em',textTransform:'uppercase',marginBottom:10,display:'flex',justifyContent:'space-between'}}><span>Scorecard</span><span>#1 in Sectoral ETF</span></div>
      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14,paddingBottom:12,borderBottom:'1px solid rgba(255,255,255,.06)'}}>
        <div><div style={{...mono,fontSize:9,color:C.text3,marginBottom:4,textTransform:'uppercase',letterSpacing:'.06em'}}>Overall</div><div style={{display:'flex',alignItems:'baseline',gap:3}}><span style={{...mono,fontSize:28,fontWeight:800,color:C.green,lineHeight:1}}>95</span><span style={{...mono,fontSize:13,color:C.text3}}>/100</span></div></div>
        <div style={{...mono,fontSize:9,color:C.text3}}>#1 in Sectoral ETF · Nifty Healthcare</div>
      </div>
      {[{name:'Performance',badge:'Great',bCol:C.green,desc:'1Y return rank vs sub-category peers',val:'30.0',max:'/35'},{name:'Cost',badge:'Great',bCol:C.green,desc:'Expense ratio vs category peers',val:'24.9',max:'/30'},{name:'Liquidity',badge:'Good',bCol:C.blue,desc:'Daily traded value — easier to buy/sell',val:'14.5',max:'/25'},{name:'Momentum',badge:'Good',bCol:C.blue,desc:'30D return rank vs peers',val:'6.1',max:'/10'}].map((r,i,arr)=>(<div key={r.name} style={{display:'flex',alignItems:'center',gap:10,padding:'9px 0',borderBottom:i<arr.length-1?'1px solid rgba(255,255,255,.04)':'none'}}><div style={{flex:1,minWidth:0}}><div style={{display:'flex',alignItems:'center'}}><span style={{fontSize:12.5,fontWeight:700,color:C.text,flex:1}}>{r.name}</span><span style={{...mono,fontSize:7.5,fontWeight:700,padding:'2px 7px',borderRadius:3,marginLeft:6,background:r.bCol===C.green?'rgba(74,222,128,.12)':'rgba(96,165,250,.10)',color:r.bCol,border:`1px solid ${r.bCol===C.green?'rgba(74,222,128,.3)':'rgba(96,165,250,.28)'}`}}>{r.badge}</span></div><div style={{fontSize:10,color:C.text3,marginTop:1}}>{r.desc}</div></div><div style={{...mono,fontSize:12,fontWeight:700,color:C.green,flexShrink:0}}>{r.val}<span style={{fontSize:9,color:C.text3}}>{r.max}</span></div></div>))}
    </div>
  )

  const etfTexts=[
    {heading:<><span style={{color:C.text}}>Premium vs</span><br/><span style={{color:C.green}}>Discount to NAV.</span></>,desc:"An ETF's market price can drift from its actual NAV. Track historical premium/discount spread — small oscillations are normal, persistent spikes above 1% signal liquidity gaps or arbitrage opportunities."},
    {heading:<><span style={{color:C.text}}>How we</span><br/><span style={{color:C.green}}>rate it.</span></>,desc:'Every ETF scored across Performance, Cost, Liquidity and Momentum — ranked against every ETF in the same sub-category. No guesswork. Just a single number that tells you exactly where it stands.'}
  ]

  return (
    <section className="ld-section" style={{padding:'100px 24px',background:C.bg}}>
      <div style={{maxWidth:1100,margin:'0 auto'}}>
        <Reveal><div style={{fontSize:11,color:C.text3,...mono,letterSpacing:'0.12em',fontWeight:700,marginBottom:14,textTransform:'uppercase'}}>exchange traded funds</div></Reveal>
        <Reveal delay={80}><h2 className="ld-section-title" style={{fontSize:42,fontWeight:800,color:C.text,letterSpacing:'-1px',lineHeight:1.15,margin:'0 0 14px',maxWidth:700}}>ETFs — <span style={{color:C.green,fontStyle:'italic',fontFamily:'Georgia, serif',fontWeight:400}}>scored &amp; ranked.</span></h2></Reveal>
        <Reveal delay={120}><p style={{fontSize:16,color:C.text2,lineHeight:1.6,maxWidth:640,margin:'0 0 40px'}}>NAV spread · Tracking error · Cost analysis · Exchange traded funds on NSE.</p></Reveal>
        <Reveal delay={180}>
          <div className="ld-feature-grid" style={{display:'grid',gridTemplateColumns:'1.4fr 1fr',gap:32,alignItems:'center'}}>
            <div style={{position:'relative',height:360,perspective:1000}}>
              <div style={{width:'100%',height:360,transformStyle:'preserve-3d',transition:'transform .7s cubic-bezier(.4,0,.2,1)',transform:idx===1?'rotateY(180deg)':'rotateY(0)'}}>
                <div style={{position:'absolute',inset:0,backfaceVisibility:'hidden',WebkitBackfaceVisibility:'hidden',padding:24,display:'flex',flexDirection:'column',justifyContent:'center',background:C.bg2,border:`1px solid ${C.border}`,borderRadius:14,overflow:'hidden'}}>{renderPremiumDiscount()}</div>
                <div style={{position:'absolute',inset:0,backfaceVisibility:'hidden',WebkitBackfaceVisibility:'hidden',transform:'rotateY(180deg)',padding:24,display:'flex',flexDirection:'column',justifyContent:'center',background:C.bg2,border:`1px solid ${C.border}`,borderRadius:14,overflow:'hidden'}}>{renderScorecard()}</div>
              </div>
            </div>
            <div style={{padding:'8px 0'}}>
              <div style={{...mono,fontSize:9,color:C.green,letterSpacing:'.18em',fontWeight:700,textTransform:'uppercase',marginBottom:10}}>01 · ETF Analysis</div>
              {etfTexts.map((t,i)=>(<div key={i} style={{display:i===idx?'flex':'none',flexDirection:'column',justifyContent:'center'}}><div style={{fontSize:'clamp(24px,2.6vw,34px)',fontWeight:800,letterSpacing:'-.6px',lineHeight:1.12,marginBottom:16}}>{t.heading}</div><div style={{fontSize:14,color:C.text2,lineHeight:1.75,maxWidth:320}}>{t.desc}</div></div>))}
              <div style={{display:'flex',gap:6,marginTop:24}}>{[0,1].map(i=><div key={i} style={dotS(i===idx)} onClick={()=>jump(i)}/>)}</div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

/* ── ScreenerTerminal — fixed full height from start ── */
function ScreenerTerminal() {
  const bodyRef = useRef(null)
  const timersRef = useRef([])
  const played = useRef(false)
  const [sectionRef, seen] = useReveal()
  const LINES=[[0,{type:'cmd',text:'$ stokradar screen --new'}],[600,{type:'dim',text:'Screener ready. Add filters below.'}],[1200,{type:'blank'}],[1500,{type:'filter',field:'valuation.pe',op:'<',val:'25'}],[2100,{type:'dim',text:'  ✓ PE ratio · 1,412 stocks pass'}],[2700,{type:'filter',field:'profitability.roe_5y',op:'>',val:'18'}],[3300,{type:'dim',text:'  ✓ 5Y avg ROE · 387 stocks pass'}],[3900,{type:'filter',field:'health.debt_equity',op:'<',val:'0.5'}],[4500,{type:'dim',text:'  ✓ D/E ratio · 214 stocks pass'}],[5100,{type:'filter',field:'growth.revenue_1y',op:'>',val:'12'}],[5700,{type:'dim',text:'  ✓ 1Y revenue growth · 89 stocks pass'}],[6300,{type:'filter',field:'score.stokradar',op:'>',val:'65'}],[6900,{type:'dim',text:'  ✓ Composite quality score · 51 stocks pass'}],[7500,{type:'blank'}],[7800,{type:'cmd',text:'$ stokradar screen --run'}],[8200,{type:'green',text:'✓ Running screen across 1,700 stocks...'}],[9000,{type:'table'}]]
  const RESULTS=[{name:'TITAN',sector:'Consumer',pe:'22.1',roe:'28.4',rev:'+18.2%',score:'82'},{name:'BAJFINANCE',sector:'Finance',pe:'18.6',roe:'21.2',rev:'+14.8%',score:'79'},{name:'LTIM',sector:'IT',pe:'24.8',roe:'26.1',rev:'+13.1%',score:'77'},{name:'NESTLEIND',sector:'FMCG',pe:'19.4',roe:'98.2',rev:'+12.6%',score:'76'}]
  function addLine(el,c){const div=document.createElement('div');div.style.cssText='opacity:0;animation:termLineIn 150ms ease forwards';if(c.type==='blank'){div.innerHTML='&nbsp;';div.style.lineHeight='0.6'}else if(c.type==='cmd')div.innerHTML=`<span style="color:rgba(255,255,255,0.30)">$ </span><span style="color:#fff;font-weight:600">${c.text.slice(2)}</span>`;else if(c.type==='dim')div.innerHTML=`<span style="color:rgba(255,255,255,0.22)">${c.text}</span>`;else if(c.type==='green')div.innerHTML=`<span style="color:#4ade80;font-weight:600">${c.text}</span>`;else if(c.type==='filter')div.innerHTML=`<span style="color:rgba(255,255,255,0.30)">filter &gt; </span><span style="color:#60a5fa">${c.field}</span> <span style="color:rgba(255,255,255,0.22)">${c.op}</span> <span style="color:#fbbf24">${c.val}</span>`;el.appendChild(div);el.scrollTop=el.scrollHeight}
  function addTable(el){const wrap=document.createElement('div');wrap.style.cssText='margin-top:4px;border-top:1px solid rgba(255,255,255,0.07);padding-top:6px';const hdr=document.createElement('div');hdr.style.cssText='display:grid;grid-template-columns:120px 60px 60px 50px 50px 44px;gap:8px;padding:3px 0;font-size:10px;letter-spacing:.06em;text-transform:uppercase;color:rgba(255,255,255,0.28);border-bottom:1px solid rgba(255,255,255,0.10)';hdr.innerHTML='<div>STOCK</div><div>PE</div><div>ROE</div><div>REV 1Y</div><div>SCORE</div><div></div>';wrap.appendChild(hdr);el.appendChild(wrap);RESULTS.forEach((r,i)=>{timersRef.current.push(setTimeout(()=>{const row=document.createElement('div');row.style.cssText='display:grid;grid-template-columns:120px 60px 60px 50px 50px 44px;gap:8px;padding:3px 0;font-size:11px;border-bottom:1px solid rgba(255,255,255,0.04);border-left:2px solid #4ade80;padding-left:6px;opacity:0;animation:termLineIn 150ms ease forwards';row.innerHTML=`<div style="color:#fff;font-weight:600">${r.name}<div style="font-size:10px;color:rgba(255,255,255,0.28);font-weight:400">${r.sector}</div></div><div style="color:rgba(255,255,255,0.7)">${r.pe}</div><div style="color:rgba(255,255,255,0.7)">${r.roe}%</div><div style="color:#4ade80">${r.rev}</div><div style="color:#4ade80;font-weight:700">${r.score}</div><div style="color:rgba(255,255,255,0.28)">→</div>`;wrap.appendChild(row);el.scrollTop=el.scrollHeight;if(i===RESULTS.length-1){timersRef.current.push(setTimeout(()=>{const badge=document.createElement('div');badge.style.cssText='display:inline-flex;align-items:center;gap:6px;margin-top:10px;padding:6px 12px;background:rgba(74,222,128,0.08);border:1px solid rgba(74,222,128,0.22);border-radius:6px;font-size:12px;color:#4ade80;font-weight:700;opacity:0;transition:opacity .4s ease';badge.innerHTML='✓ &nbsp;47 stocks match · <span style="font-weight:400;color:rgba(74,222,128,0.7)">sorted by score</span>';wrap.appendChild(badge);setTimeout(()=>{badge.style.opacity='1'},50);el.scrollTop=el.scrollHeight;timersRef.current.push(setTimeout(()=>runSequence(),3500))},300))}},200+i*180))})}
  function runSequence(){timersRef.current.forEach(clearTimeout);timersRef.current=[];if(bodyRef.current)bodyRef.current.innerHTML='';LINES.forEach(([delay,c])=>{timersRef.current.push(setTimeout(()=>{if(!bodyRef.current)return;if(c.type==='table')addTable(bodyRef.current);else addLine(bodyRef.current,c)},delay))})}
  useEffect(()=>{if(seen&&!played.current){played.current=true;runSequence()}return()=>timersRef.current.forEach(clearTimeout)},[seen])
  return (
    <div ref={sectionRef}>
      <div style={{marginBottom:10}}>
        <div style={{...mono,fontSize:9,letterSpacing:'.14em',textTransform:'uppercase',color:'rgba(255,255,255,0.28)',fontWeight:700,marginBottom:8}}>81 Filters · 8 Categories</div>
        <div style={{display:'flex',flexWrap:'wrap',gap:5}}>{['Valuation','Growth','Profitability','Financial Health','Technicals','Shareholding','Stokradar Scores','Dividends'].map((c,i)=>(<span key={c} style={{padding:'4px 11px',fontSize:10,...mono,fontWeight:600,borderRadius:20,background:i%2?'rgba(74,222,128,0.10)':'rgba(255,255,255,0.05)',border:`1px solid ${i%2?'rgba(74,222,128,0.30)':'rgba(255,255,255,0.12)'}`,color:i%2?C.green:'rgba(255,255,255,0.65)'}}>{c}</span>))}</div>
      </div>
      <div style={{background:'#0d1117',borderRadius:14,overflow:'hidden',boxShadow:'0 0 0 1px rgba(255,255,255,0.08), 0 32px 80px rgba(0,0,0,0.85)',...mono}}>
        <div style={{height:32,background:'#161b22',borderBottom:'1px solid rgba(255,255,255,0.07)',display:'flex',alignItems:'center',padding:'0 12px',gap:7,position:'relative'}}>
          <div style={{width:10,height:10,borderRadius:'50%',background:'#ff5f57'}}/><div style={{width:10,height:10,borderRadius:'50%',background:'#febc2e'}}/><div style={{width:10,height:10,borderRadius:'50%',background:'#28c840'}}/>
          <div style={{position:'absolute',left:'50%',transform:'translateX(-50%)',fontSize:11,color:'rgba(255,255,255,0.30)',letterSpacing:'.08em',fontWeight:500}}>~/stokradar — screener</div>
        </div>
        <div ref={bodyRef} style={{padding:'14px 18px',height:420,overflowY:'auto',fontSize:12,lineHeight:1.6}} />
      </div>
      <style>{`@keyframes termLineIn{from{opacity:0}to{opacity:1}}`}</style>
    </div>
  )
}

function FeatureRow({ eyebrow, title, subtitle, body, cta, visual, flipped }) {
  const openNotify = useNotify()
  return (
    <section className="ld-section" style={{padding:'100px 24px',background:C.bg}}>
      <div className="ld-feature-grid" style={{maxWidth:1100,margin:'0 auto',display:'grid',gridTemplateColumns:flipped?'1fr 1.1fr':'1.1fr 1fr',gap:56,alignItems:'center'}}>
        <Reveal><div style={{order:flipped?2:1}}>
          <div style={{fontSize:11,color:C.text3,...mono,letterSpacing:'0.12em',fontWeight:700,marginBottom:14,textTransform:'uppercase'}}>{eyebrow}</div>
          <h2 className="ld-section-title" style={{fontSize:42,fontWeight:800,color:C.text,letterSpacing:'-1px',lineHeight:1.15,margin:'0 0 14px'}}>{title}</h2>
          <p style={{fontSize:17,color:C.text2,lineHeight:1.5,margin:'0 0 22px'}}>{subtitle}</p>
          <div style={{fontSize:15,color:C.text2,lineHeight:1.7,marginBottom:24}}><style>{`.fr-body p{margin:0 0 12px}.fr-body ul{margin:0 0 16px;padding-left:22px}.fr-body li{margin-bottom:6px}.fr-body strong{color:#fff}`}</style><div className="fr-body">{body}</div></div>
          {cta&&<span onClick={openNotify} style={{display:'inline-flex',alignItems:'center',gap:6,fontSize:14,fontWeight:700,color:C.green,...mono,cursor:'pointer'}}>{cta.label}</span>}
        </div></Reveal>
        <Reveal delay={160}><div style={{order:flipped?1:2}}>{visual}</div></Reveal>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────────────
   PortfolioXRay
───────────────────────────────────────────────────────── */
function PortfolioXRay() {
  const [heroIdx, setHeroIdx] = useState(0)
  const [progVal, setProgVal] = useState(0)
  const [paused, setPaused] = useState(false)
  const bentoRef = useRef(null)
  const progInt = useRef(null)
  const tilesRef = useRef([])
  const pausedRef = useRef(false)
  const [sectionRef, seen] = useReveal()
  const started = useRef(false)

  const TILES = ['div', 'bub', 'risk', 'nifty']
  const DUR = 3000

  const META = [
    { num:'01 / 04', titleMain:'Diversification.', titleAcc:'Five honest dimensions.',
      desc:'Score out of 100 across position spread, sector mix, market-cap balance, geography and asset class. Diagnosis tells you exactly what is dragging the score — then move sliders to see simulated improvement live.',
      tag:'◆ Score 67 · diagnosis · simulator' },
    { num:'02 / 04', titleMain:'Valuation × Growth.', titleAcc:'How your stocks rank.',
      desc:'Every holding plotted on one map. Bigger bubble = heavier weight. Greener = higher ROE + ROCE. Spot cheap-and-growing winners — and expensive stagnant drags — in one glance.',
      tag:'◇ Bubble chart · weight × quality' },
    { num:'03 / 04', titleMain:'Risk & Efficiency.', titleAcc:'Plus red flags.',
      desc:'Three numbers that quietly bleed returns — holdings overlap, hidden fees, harvestable losses — and every active risk flag from corporate filings, ranked by priority.',
      tag:'⚠ 3 risk signals · 3 active flags' },
    { num:'04 / 04', titleMain:'Portfolio vs', titleAcc:'Nifty 50.',
      desc:'Are you actually outperforming the index — or just feeling like you are? Overlay your portfolio against Nifty across 1Y, 3Y and inception. The delta tells the truth.',
      tag:'▲ 1Y · 3Y · Inception delta' },
  ]

  pausedRef.current = paused

  function resetProg(idx) {
    clearInterval(progInt.current)
    setProgVal(0)
    let pv = 0
    progInt.current = setInterval(() => {
      if (pausedRef.current) return
      pv += 60 / DUR * 100
      setProgVal(Math.min(pv, 100))
      if (pv >= 100) { clearInterval(progInt.current); setHeroIdx(h => { const next = (h + 1) % 4; return next }) }
    }, 60)
  }

  useEffect(() => {
    if (seen && !started.current) { started.current = true; resetProg(0) }
    return () => clearInterval(progInt.current)
  }, [seen])

  useEffect(() => { if (started.current) resetProg(heroIdx) }, [heroIdx])

  const cur = META[heroIdx]

  const SMALL_DIV = (
    <div style={{padding:14}}>
      <div style={{display:'flex',justifyContent:'space-between',marginBottom:10}}>
        <div><div style={{...mono,fontSize:9.5,letterSpacing:'.12em',textTransform:'uppercase',color:C.text3,fontWeight:700}}>◆ Diversification</div><div style={{...mono,fontSize:9,color:C.text4,textTransform:'uppercase',letterSpacing:'.08em',marginTop:2}}>5-dim honest score</div></div>
        <span style={{padding:'3px 8px',borderRadius:4,...mono,fontSize:8.5,fontWeight:700,letterSpacing:'.08em',textTransform:'uppercase',background:'rgba(251,191,36,.10)',border:'.5px solid rgba(251,191,36,.28)',color:C.amber}}>FAIR</span>
      </div>
      <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:10}}>
        <svg viewBox="0 0 80 80" width="70" height="70" style={{flexShrink:0}}>
          <polygon points="40,12 67.4,32.5 56.9,64.6 23.1,64.6 12.6,32.5" fill="none" stroke="rgba(255,255,255,.10)" strokeWidth=".8"/>
          <polygon points="40,17.3 65.16,42.9 53.6,55.06 26.4,55.06 14.84,42.9" fill="rgba(251,191,36,.18)" stroke="#fbbf24" strokeWidth="1.3" strokeLinejoin="round"/>
        </svg>
        <div><div style={{...mono,fontSize:38,fontWeight:800,color:C.amber,letterSpacing:'-1.5px',lineHeight:1}}>67</div><div style={{...mono,fontSize:10,color:C.text3,marginTop:2}}>/ 100</div></div>
      </div>
      <div style={{display:'flex',gap:8,...mono,fontSize:9,color:C.text3,paddingTop:8,borderTop:`.5px solid ${C.border}`}}>
        <span style={{display:'flex',alignItems:'center',gap:4}}><span style={{width:6,height:6,borderRadius:'50%',background:C.red,display:'inline-block'}}/>Geo 42</span>
        <span style={{display:'flex',alignItems:'center',gap:4}}><span style={{width:6,height:6,borderRadius:'50%',background:C.amber,display:'inline-block'}}/>Sector 58</span>
        <span style={{marginLeft:'auto',color:C.amber}}>⚠ 2 drags</span>
      </div>
    </div>
  )

  const SMALL_BUB = (
    <div style={{padding:14}}>
      <div style={{display:'flex',justifyContent:'space-between',marginBottom:10}}>
        <div><div style={{...mono,fontSize:9.5,letterSpacing:'.12em',textTransform:'uppercase',color:C.text3,fontWeight:700}}>◇ Stock Rank</div><div style={{...mono,fontSize:9,color:C.text4,textTransform:'uppercase',letterSpacing:'.08em',marginTop:2}}>Valuation × Growth</div></div>
        <span style={{padding:'3px 8px',borderRadius:4,...mono,fontSize:8.5,fontWeight:700,background:'rgba(74,222,128,.10)',border:'.5px solid rgba(74,222,128,.28)',color:C.green}}>24 STOCKS</span>
      </div>
      <svg viewBox="0 0 300 80" width="100%" height="80" preserveAspectRatio="none" style={{display:'block',margin:'4px 0 6px'}}>
        <line x1="0" y1="40" x2="300" y2="40" stroke="rgba(255,255,255,.08)" strokeDasharray="3,3"/>
        <line x1="150" y1="0" x2="150" y2="80" stroke="rgba(255,255,255,.08)" strokeDasharray="3,3"/>
        {[[100,48,14,'#86efac'],[125,55,11,'#4ade80'],[85,55,9,'#86efac'],[200,32,9,'#fbbf24'],[180,18,7,'#4ade80'],[260,12,7,'#fbbf24'],[50,68,7,'#f87171'],[155,58,6,'#f87171']].map(([cx,cy,r,s],i)=>(
          <circle key={i} cx={cx} cy={cy} r={r} fill={s} fillOpacity=".22" stroke={s} strokeWidth="1.2"/>
        ))}
      </svg>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:6,paddingTop:8,borderTop:`.5px solid ${C.border}`,...mono,fontSize:9,color:C.text3}}>
        <div style={{display:'flex',justifyContent:'space-between'}}>T1+T2 <b style={{color:C.green}}>11</b></div>
        <div style={{display:'flex',justifyContent:'space-between'}}>Watch <b style={{color:C.amber}}>7</b></div>
        <div style={{display:'flex',justifyContent:'space-between'}}>Avoid <b style={{color:C.red}}>3</b></div>
      </div>
    </div>
  )

  const SMALL_RISK = (
    <div style={{padding:14}}>
      <div style={{display:'flex',justifyContent:'space-between',marginBottom:10}}>
        <div><div style={{...mono,fontSize:9.5,letterSpacing:'.12em',textTransform:'uppercase',color:C.text3,fontWeight:700}}>⚠ Risk &amp; Flags</div><div style={{...mono,fontSize:9,color:C.text4,textTransform:'uppercase',letterSpacing:'.08em',marginTop:2}}>3 risks · 3 active flags</div></div>
        <span style={{padding:'3px 8px',borderRadius:4,...mono,fontSize:8.5,fontWeight:700,background:'rgba(248,113,113,.10)',border:'.5px solid rgba(248,113,113,.28)',color:C.red}}>−₹4.2K NET</span>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:6,margin:'6px 0 8px'}}>
        {[['Overlap','18%',C.amber],['Fees','₹12.4K',C.red],['Harvest','₹8.2K',C.green]].map(([k,v,c])=>(
          <div key={k} style={{background:C.bg4,border:`.5px solid ${C.border}`,borderRadius:7,padding:'7px 8px',textAlign:'center'}}>
            <div style={{...mono,fontSize:7.5,color:C.text4,letterSpacing:'.08em',textTransform:'uppercase',marginBottom:2,fontWeight:700}}>{k}</div>
            <div style={{...mono,fontSize:13,fontWeight:800,letterSpacing:'-.4px',color:c}}>{v}</div>
          </div>
        ))}
      </div>
      <div style={{display:'flex',alignItems:'center',gap:7,padding:'6px 9px',background:'linear-gradient(90deg,rgba(248,113,113,.06),rgba(23,23,23,1) 40%)',border:`.5px solid ${C.border}`,borderLeft:`2.5px solid ${C.red}`,borderRadius:6}}>
        <span style={{...mono,fontSize:9.5,fontWeight:700,color:C.text}}>RELIANCE</span>
        <span style={{fontSize:9.5,color:C.text2,flex:1}}>Promoter pledging up +3% MoM</span>
        <span style={{...mono,fontSize:8,color:C.text4}}>2d</span>
      </div>
    </div>
  )

  const SMALL_NIFTY = (
    <div style={{padding:14}}>
      <div style={{display:'flex',justifyContent:'space-between',marginBottom:10}}>
        <div><div style={{...mono,fontSize:9.5,letterSpacing:'.12em',textTransform:'uppercase',color:C.text3,fontWeight:700}}>▲ vs Nifty 50</div><div style={{...mono,fontSize:9,color:C.text4,textTransform:'uppercase',letterSpacing:'.08em',marginTop:2}}>Index benchmark</div></div>
        <span style={{padding:'3px 8px',borderRadius:4,...mono,fontSize:8.5,fontWeight:700,background:'rgba(74,222,128,.10)',border:'.5px solid rgba(74,222,128,.28)',color:C.green}}>+4.1%</span>
      </div>
      <svg viewBox="0 0 300 62" width="100%" height="62" preserveAspectRatio="none" style={{display:'block',margin:'6px 0'}}>
        <defs><linearGradient id="snG1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#4ade80" stopOpacity=".22"/><stop offset="100%" stopColor="#4ade80" stopOpacity="0"/></linearGradient></defs>
        <polygon fill="url(#snG1)" points="0,52 30,50 60,46 90,42 120,38 150,32 180,26 210,22 240,16 270,12 300,8 300,62 0,62"/>
        <polyline fill="none" stroke="rgba(255,255,255,.32)" strokeWidth="1.3" points="0,55 30,53 60,50 90,48 120,44 150,40 180,36 210,32 240,28 270,24 300,20"/>
        <polyline fill="none" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" points="0,52 30,50 60,46 90,42 120,38 150,32 180,26 210,22 240,16 270,12 300,8"/>
        <circle cx="300" cy="8" r="3" fill="#4ade80"/><circle cx="300" cy="20" r="2.5" fill="rgba(255,255,255,.42)"/>
      </svg>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6,paddingTop:7,borderTop:`.5px solid ${C.border}`}}>
        {[['1 Year','+12.4%','vs +8.3%'],['3 Year','+18.6%','vs +14.2%']].map(([k,v,s])=>(
          <div key={k}><div style={{...mono,fontSize:7.5,color:C.text4,letterSpacing:'.08em',textTransform:'uppercase',fontWeight:700}}>{k}</div><div style={{...mono,fontSize:11,fontWeight:700,color:C.green}}>{v}</div><div style={{...mono,fontSize:8.5,color:C.text3}}>{s}</div></div>
        ))}
      </div>
    </div>
  )

  const LARGE_DIV = (
    <div style={{padding:18}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end',marginBottom:8,flexWrap:'wrap',gap:10}}>
        <div><h3 style={{fontSize:22,fontWeight:800,letterSpacing:'-.5px',lineHeight:1,margin:0,color:C.text}}>Diversification. <span style={{color:C.green,fontFamily:'Playfair Display, Georgia, serif',fontWeight:400,fontStyle:'italic'}}>5 honest dimensions.</span></h3></div>
        <span style={{...mono,fontSize:9,color:C.text3,letterSpacing:'.10em',textTransform:'uppercase',fontWeight:700}}>◆ score · diagnosis · simulator</span>
      </div>
      <p style={{fontSize:12,color:C.text3,lineHeight:1.5,margin:'0 0 14px',maxWidth:380}}>Position spread · sector mix · market-cap · geography · asset class. Move sliders below to simulate your improved allocation.</p>
      <div style={{display:'grid',gridTemplateColumns:'200px 1fr',gap:18,alignItems:'center'}}>
        <div style={{position:'relative',width:200,height:200}}>
          <svg viewBox="0 0 220 220" width="200" height="200">
            <defs><radialGradient id="rg1L" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#fbbf24" stopOpacity=".18"/><stop offset="100%" stopColor="#fbbf24" stopOpacity="0"/></radialGradient></defs>
            <circle cx="110" cy="110" r="85" fill="url(#rg1L)"/>
            {[[110,46.75,174.6,98.18,149.9,162.6,70.1,162.6,45.4,98.18],[110,67.5,159.2,103.86,139.8,151.2,80.2,151.2,60.8,103.86],[110,88.25,143.8,109.54,129.7,139.8,90.3,139.8,76.2,109.54]].map(([...pts],i)=>(
              <polygon key={i} points={`${pts[0]},${pts[1]} ${pts[2]},${pts[3]} ${pts[4]},${pts[5]} ${pts[6]},${pts[7]} ${pts[8]},${pts[9]}`} fill="none" stroke="rgba(255,255,255,.04)"/>
            ))}
            <polygon points="110,25 190.83,83.73 159.97,178.77 60.03,178.77 29.17,83.73" fill="none" stroke="rgba(255,255,255,.10)"/>
            {[[110,110,110,25],[110,110,190.83,83.73],[110,110,159.97,178.77],[110,110,60.03,178.77],[110,110,29.17,83.73]].map(([x1,y1,x2,y2],i)=>(
              <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(255,255,255,.06)"/>
            ))}
            <polygon points="110,48.8 156.9,94.77 150.48,165.69 88.99,138.88 59.88,93.72" fill="rgba(251,191,36,.16)" stroke="#fbbf24" strokeWidth="1.8" strokeLinejoin="round"/>
            {[[110,48.8],[156.9,94.77],[150.48,165.69],[88.99,138.88],[59.88,93.72]].map(([cx,cy],i)=>(
              <circle key={i} cx={cx} cy={cy} r="3" fill="#fbbf24"/>
            ))}
            {[{x:110,y:17,a:'middle',t:'POSITION'},{x:200,y:80,a:'middle',t:'SECTOR'},{x:180,y:194,a:'middle',t:'MKT-CAP'},{x:40,y:194,a:'middle',t:'GEO'},{x:20,y:80,a:'middle',t:'ASSET'}].map(lb=>(
              <text key={lb.t} x={lb.x} y={lb.y} textAnchor={lb.a} fontFamily="DM Mono" fontSize="8" fontWeight="700" fill="rgba(255,255,255,.45)" letterSpacing=".05em">{lb.t}</text>
            ))}
          </svg>
          <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',pointerEvents:'none'}}>
            <div style={{...mono,fontSize:46,fontWeight:800,color:C.amber,lineHeight:1,letterSpacing:'-1.5px'}}>67</div>
            <div style={{...mono,fontSize:11,color:C.text3,marginTop:2}}>/ 100</div>
            <div style={{marginTop:6,padding:'2px 9px',borderRadius:3,background:'rgba(251,191,36,.10)',border:'1px solid rgba(251,191,36,.28)',...mono,fontSize:8.5,fontWeight:700,color:C.amber,letterSpacing:'.10em'}}>FAIR</div>
          </div>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          {[['Position Spread',72,C.green],['Sector Mix',58,C.amber],['Market-Cap Balance',81,C.green],['Geography',42,C.red],['Asset Class',62,C.amber]].map(([n,v,c])=>(
            <div key={n}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}><span style={{fontSize:11.5,color:C.text2,fontWeight:500}}>{n}</span><span style={{...mono,fontSize:11.5,fontWeight:700,color:c}}>{v}</span></div>
              <div style={{height:3,background:'rgba(255,255,255,.05)',borderRadius:2,overflow:'hidden'}}><div style={{height:'100%',width:`${v}%`,background:c,borderRadius:2}}/></div>
            </div>
          ))}
        </div>
      </div>
      <div style={{marginTop:14,padding:'13px 15px',background:'linear-gradient(135deg,rgba(74,222,128,.05),rgba(96,165,250,.03))',border:'1px solid rgba(74,222,128,.18)',borderRadius:10}}>
        <div style={{display:'flex',alignItems:'flex-start',gap:9,fontSize:11.5,color:C.text2,lineHeight:1.5,marginBottom:6}}><span style={{flexShrink:0,width:13,...mono,fontSize:11,fontWeight:700,color:C.amber}}>⚠</span><span><strong style={{color:C.text,fontWeight:600}}>Heavy India-equity tilt</strong> — 91% in IN equity drags geo &amp; asset-class scores.</span></div>
        <div style={{display:'flex',alignItems:'flex-start',gap:9,fontSize:11.5,color:C.text2,lineHeight:1.5,marginBottom:10}}><span style={{flexShrink:0,width:13,...mono,fontSize:11,fontWeight:700,color:C.blue}}>→</span><span><strong style={{color:C.text,fontWeight:600}}>Add 8% intl + 4% gold</strong> → simulated <span style={{color:C.green,fontWeight:800,...mono}}>79</span> / 100</span></div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:11,paddingTop:11,borderTop:'.5px dashed rgba(74,222,128,.20)'}}>
          {[['IN Eq','60%','#4ade80'],['Intl Eq','18%','#60a5fa'],['Debt','12%','#a78bfa'],['Gold','6%','#fbbf24']].map(([n,v,c])=>(
            <div key={n} style={{display:'flex',flexDirection:'column',gap:4}}>
              <div style={{display:'flex',justifyContent:'space-between'}}><span style={{...mono,fontSize:8,color:C.text3,textTransform:'uppercase',letterSpacing:'.06em',fontWeight:700}}>{n}</span><span style={{...mono,fontSize:9.5,color:C.text2,fontWeight:700}}>{v}</span></div>
              <div style={{height:3,background:'rgba(255,255,255,.06)',borderRadius:2,position:'relative'}}>
                <div style={{position:'absolute',left:0,top:0,height:'100%',width:v,borderRadius:2,background:c}}/>
                <div style={{position:'absolute',top:'50%',left:v,width:9,height:9,borderRadius:'50%',background:'#fff',border:`1.5px solid ${C.bg3}`,transform:'translate(-50%,-50%)',boxShadow:'0 0 5px rgba(255,255,255,.4)'}}/>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const LARGE_BUB = (
    <div style={{padding:18}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end',marginBottom:8,flexWrap:'wrap',gap:10}}>
        <h3 style={{fontSize:22,fontWeight:800,letterSpacing:'-.5px',lineHeight:1,margin:0,color:C.text}}>Valuation × Growth. <span style={{color:C.green,fontFamily:'Playfair Display, Georgia, serif',fontWeight:400,fontStyle:'italic'}}>How your stocks rank.</span></h3>
        <div style={{display:'flex',gap:11,flexWrap:'wrap'}}>
          {[['T1','#4ade80'],['T2','#86efac'],['T3','#fbbf24'],['T4','#f87171'],['N/A','#71717a']].map(([l,c])=>(
            <span key={l} style={{display:'flex',alignItems:'center',gap:5,...mono,fontSize:9.5,color:C.text3}}><span style={{width:8,height:8,borderRadius:'50%',background:c,display:'inline-block'}}/>{l}</span>
          ))}
        </div>
      </div>
      <p style={{fontSize:12,color:C.text3,lineHeight:1.5,margin:'0 0 8px'}}>Bigger bubble = higher weight. Greener = better quality (ROE + ROCE).</p>
      <svg viewBox="0 0 620 360" width="100%" height="360" preserveAspectRatio="xMidYMid meet" style={{display:'block'}}>
        <line x1="50" y1="320" x2="590" y2="320" stroke="rgba(255,255,255,.10)"/><line x1="50" y1="20" x2="50" y2="320" stroke="rgba(255,255,255,.10)"/>
        <line x1="252.5" y1="20" x2="252.5" y2="320" stroke="rgba(255,255,255,.10)" strokeDasharray="4,4"/>
        <line x1="50" y1="208.75" x2="590" y2="208.75" stroke="rgba(255,255,255,.10)" strokeDasharray="4,4"/>
        <text x="62" y="36" fontFamily="DM Mono" fontSize="9" fontWeight="700" fill="#4ade80" letterSpacing=".06em">★ CHEAP &amp; GROWING</text>
        <text x="578" y="36" textAnchor="end" fontFamily="DM Mono" fontSize="9" fontWeight="700" fill="rgba(255,255,255,.42)" letterSpacing=".06em">EXPENSIVE · GROWING</text>
        <text x="62" y="314" fontFamily="DM Mono" fontSize="9" fontWeight="700" fill="rgba(255,255,255,.30)" letterSpacing=".06em">CHEAP · STAGNANT</text>
        <text x="578" y="314" textAnchor="end" fontFamily="DM Mono" fontSize="9" fontWeight="700" fill="#f87171" letterSpacing=".06em">AVOID</text>
        {[{v:'+60%',y:40},{v:'+40%',y:105},{v:'+20%',y:160},{v:'0%',y:265}].map(({v,y})=>(
          <text key={v} x="44" y={y} textAnchor="end" fontFamily="DM Mono" fontSize="8.5" fill="rgba(255,255,255,.42)">{v}</text>
        ))}
        <text x="252.5" y="336" textAnchor="middle" fontFamily="DM Mono" fontSize="8.5" fill="rgba(255,255,255,.42)">PE 30</text>
        <text x="455" y="336" textAnchor="middle" fontFamily="DM Mono" fontSize="8.5" fill="rgba(255,255,255,.42)">PE 60</text>
        <text x="320" y="354" textAnchor="middle" fontFamily="DM Mono" fontSize="9" fontWeight="700" fill="rgba(255,255,255,.55)" letterSpacing=".10em">P / E RATIO →</text>
        <text x="16" y="170" textAnchor="middle" fontFamily="DM Mono" fontSize="9" fontWeight="700" fill="rgba(255,255,255,.55)" letterSpacing=".10em" transform="rotate(-90 16 170)">REVENUE GROWTH ↑</text>
        {[[198.5,195.25,20,'#86efac','RELIANCE'],[239,215.5,17,'#4ade80','TCS'],[171.5,222.25,15,'#86efac','HDFCB'],[212,212.13,13,'#86efac','INFY'],[333.5,148,12,'#4ade80','BHARTI'],[266,181.75,11,'#fbbf24','IRCTC'],[556.25,46.88,10,'#fbbf24','ZOMATO'],[97.25,294.25,10,'#f87171','ONGC'],[239,232.38,9,'#f87171',''],[198.5,175,8,'rgba(113,113,122,.30)',''],[151.25,202,9,'#86efac','']].map(([cx,cy,r,fill,lbl],i)=>(
          <g key={i}>
            <circle cx={cx} cy={cy} r={r} fill={fill} fillOpacity={fill.startsWith('rgba')?1:.22} stroke={fill.startsWith('rgba')?'#71717a':fill} strokeWidth="1.5"/>
            {lbl&&r>10&&<text x={cx} y={cy+3.5} textAnchor="middle" fontFamily="DM Mono" fontSize={r>16?8.5:r>12?8:7} fontWeight="700" fill="#fff">{lbl}</text>}
          </g>
        ))}
      </svg>
    </div>
  )

  const LARGE_RISK = (
    <div style={{padding:18}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end',marginBottom:8,flexWrap:'wrap',gap:10}}>
        <h3 style={{fontSize:22,fontWeight:800,letterSpacing:'-.5px',lineHeight:1,margin:0,color:C.text}}>Risk &amp; Efficiency. <span style={{color:C.green,fontFamily:'Playfair Display, Georgia, serif',fontWeight:400,fontStyle:'italic'}}>Plus red flags.</span></h3>
        <span style={{...mono,fontSize:9,color:C.text3,letterSpacing:'.10em',textTransform:'uppercase',fontWeight:700}}>⚠ scanned 6h ago</span>
      </div>
      <p style={{fontSize:12,color:C.text3,lineHeight:1.5,margin:'0 0 14px'}}>Three numbers that quietly bleed returns. Every active risk flag ranked by priority.</p>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
        <div>
          <div style={{...mono,fontSize:9.5,letterSpacing:'.12em',textTransform:'uppercase',color:C.text3,fontWeight:700,marginBottom:10,display:'flex',justifyContent:'space-between'}}><span>◇ Risk &amp; Efficiency</span><span style={{color:C.text4}}>3 signals</span></div>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {[['⟳','amb','Holdings Overlap','HDFC in 4 of 5 MFs','18%',C.amber],['₹','red','Hidden Fees','Annual expense drag','₹12.4K',C.red],['✂','grn','Tax-Loss Harvest','3 positions ready','₹8.2K',C.green]].map(([ic,cls,title,sub,val,vc])=>(
              <div key={title} style={{display:'flex',alignItems:'center',gap:10,padding:'11px 12px',background:C.bg4,border:`.5px solid ${C.border}`,borderRadius:9}}>
                <div style={{width:28,height:28,borderRadius:6,display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,flexShrink:0,...mono,fontWeight:700,background:cls==='amb'?'rgba(251,191,36,.10)':cls==='red'?'rgba(248,113,113,.10)':'rgba(74,222,128,.10)',border:`1px solid ${cls==='amb'?'rgba(251,191,36,.26)':cls==='red'?'rgba(248,113,113,.26)':'rgba(74,222,128,.26)'}`,color:cls==='amb'?C.amber:cls==='red'?C.red:C.green}}>{ic}</div>
                <div style={{flex:1,minWidth:0}}><div style={{fontSize:12,fontWeight:700,color:C.text,marginBottom:1}}>{title}</div><div style={{fontSize:9.5,color:C.text3,...mono}}>{sub}</div></div>
                <div style={{...mono,fontSize:15,fontWeight:800,letterSpacing:'-.5px',color:vc}}>{val}</div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div style={{...mono,fontSize:9.5,letterSpacing:'.12em',textTransform:'uppercase',color:C.text3,fontWeight:700,marginBottom:10,display:'flex',justifyContent:'space-between'}}><span>⚠ Red Flags</span><span style={{color:C.text4}}>3 active</span></div>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {[['high',C.red,'RELIANCE','Promoter pledging up +3% MoM','2d'],['med',C.amber,'ITC','Auditor change announced','5d'],['low',C.blue,'VOLTAS','Annual report delayed','1w']].map(([pri,pc,tic,msg,time])=>(
              <div key={tic} style={{display:'flex',alignItems:'center',gap:9,padding:'11px 12px',background:`linear-gradient(90deg,${pc}0d,${C.bg4} 35%)`,border:`.5px solid ${C.border}`,borderLeft:`3px solid ${pc}`,borderRadius:9}}>
                <span style={{...mono,fontSize:8,fontWeight:700,letterSpacing:'.10em',padding:'2px 6px',borderRadius:3,background:`${pc}1a`,color:pc,border:`.5px solid ${pc}3d`,flexShrink:0,textTransform:'uppercase'}}>{pri}</span>
                <div style={{flex:1,minWidth:0}}><div style={{...mono,fontSize:10.5,fontWeight:700,color:C.text,letterSpacing:'.04em'}}>{tic}</div><div style={{fontSize:10.5,color:C.text2,lineHeight:1.35,marginTop:1}}>{msg}</div></div>
                <span style={{...mono,fontSize:8.5,color:C.text4,flexShrink:0}}>{time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  const LARGE_NIFTY = (
    <div style={{padding:18}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end',marginBottom:8,flexWrap:'wrap',gap:10}}>
        <h3 style={{fontSize:22,fontWeight:800,letterSpacing:'-.5px',lineHeight:1,margin:0,color:C.text}}>Portfolio vs <span style={{color:C.green,fontFamily:'Playfair Display, Georgia, serif',fontWeight:400,fontStyle:'italic'}}>Nifty 50.</span></h3>
        <span style={{padding:'5px 11px',borderRadius:5,background:'rgba(74,222,128,.08)',border:'.5px solid rgba(74,222,128,.26)',...mono,fontSize:11,fontWeight:700,color:C.green,letterSpacing:'.04em'}}>+4.1% YTD outperform</span>
      </div>
      <p style={{fontSize:12,color:C.text3,lineHeight:1.5,margin:'0 0 6px'}}>Are you really beating the index, or just feeling like it? The delta tells the truth.</p>
      <div style={{display:'flex',gap:14,...mono,fontSize:9.5,marginTop:6,marginBottom:10}}>
        <span style={{display:'flex',alignItems:'center',gap:5}}><span style={{width:14,height:2,borderRadius:1,background:C.green,display:'inline-block'}}/><span style={{color:C.green}}>Your portfolio</span></span>
        <span style={{display:'flex',alignItems:'center',gap:5}}><span style={{width:14,height:2,borderRadius:1,background:'rgba(255,255,255,.42)',display:'inline-block'}}/><span style={{color:'rgba(255,255,255,.42)'}}>Nifty 50</span></span>
      </div>
      <svg viewBox="0 0 580 220" width="100%" height="220" preserveAspectRatio="none" style={{display:'block'}}>
        <defs><linearGradient id="pgL3" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#4ade80" stopOpacity=".22"/><stop offset="100%" stopColor="#4ade80" stopOpacity="0"/></linearGradient></defs>
        {[50,110,170].map(y=><line key={y} x1="0" y1={y} x2="580" y2={y} stroke="rgba(255,255,255,.04)" strokeDasharray="3,4"/>)}
        <polygon fill="url(#pgL3)" points="0,180 40,176 80,168 120,160 160,148 200,140 240,130 280,118 320,108 360,94 400,80 440,68 480,56 520,42 580,28 580,220 0,220"/>
        <polyline fill="none" stroke="rgba(255,255,255,.32)" strokeWidth="1.5" points="0,188 40,184 80,176 120,170 160,158 200,152 240,144 280,134 320,128 360,118 400,108 440,98 480,86 520,76 580,62"/>
        <polyline fill="none" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" points="0,180 40,176 80,168 120,160 160,148 200,140 240,130 280,118 320,108 360,94 400,80 440,68 480,56 520,42 580,28"/>
        <circle cx="580" cy="28" r="4" fill="#4ade80"/><circle cx="580" cy="62" r="3" fill="rgba(255,255,255,.42)"/>
      </svg>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:1,background:'rgba(255,255,255,.04)',borderRadius:8,overflow:'hidden',marginTop:14}}>
        {[['1 Year','+12.4%','vs +8.3% Nifty'],['3 Year','+18.6%','vs +14.2% Nifty'],['Inception','+21.8%','vs +16.4% Nifty']].map(([k,v,s])=>(
          <div key={k} style={{background:C.bg3,padding:'11px 12px',textAlign:'center'}}>
            <div style={{...mono,fontSize:8,color:C.text4,letterSpacing:'.08em',textTransform:'uppercase',marginBottom:4,fontWeight:700}}>{k}</div>
            <div style={{...mono,fontSize:16,fontWeight:700,color:C.green}}>{v}</div>
            <div style={{...mono,fontSize:9,color:C.text3,marginTop:2}}>{s}</div>
          </div>
        ))}
      </div>
    </div>
  )

  const SMALL_CONTENT = [SMALL_DIV, SMALL_BUB, SMALL_RISK, SMALL_NIFTY]
  const LARGE_CONTENT = [LARGE_DIV, LARGE_BUB, LARGE_RISK, LARGE_NIFTY]

  const PAD = 16, GAP = 14
  const HERO_W_PCT = '58%'
  const SMALL_W_PCT = 'calc(42% - 30px)'
  const HERO_H = 560
  const SMALL_H = (HERO_H - GAP * 2) / 3

  return (
    <section ref={sectionRef} className="ld-section" style={{padding:'100px 24px',background:C.bg2,borderTop:`1px solid ${C.border}`,borderBottom:`1px solid ${C.border}`}}>
      <div style={{maxWidth:1280,margin:'0 auto'}}>
        <Reveal><div style={{fontSize:11,color:C.text3,...mono,letterSpacing:'0.12em',fontWeight:700,marginBottom:14,textTransform:'uppercase'}}>your portfolio</div></Reveal>
        <Reveal delay={80}><h2 className="ld-section-title" style={{fontSize:42,fontWeight:800,color:C.text,letterSpacing:'-1px',lineHeight:1.15,margin:'0 0 14px',maxWidth:760}}>Portfolio X-Ray. <span style={{color:C.text3}}>All in one panel.</span></h2></Reveal>
        <Reveal delay={120}><p style={{fontSize:16,color:C.text2,lineHeight:1.6,maxWidth:640,margin:'0 0 40px'}}>Four lenses · one screen. Click any tile to bring it into focus — diversification, stock ranking, risk &amp; red flags, vs Nifty.</p></Reveal>

        <Reveal delay={180}>
          <div style={{display:'grid',gridTemplateColumns:'280px minmax(0,1fr)',gap:56,alignItems:'start'}}>
            <div style={{position:'sticky',top:40}}>
              <div style={{...mono,fontSize:9,color:C.text4,letterSpacing:'.16em',textTransform:'uppercase',marginBottom:20,display:'flex',alignItems:'center',gap:10}}>
                <span>{cur.num}</span><div style={{flex:1,height:.5,background:C.border}}/>
              </div>
              <div style={{fontSize:'2rem',fontWeight:800,letterSpacing:'-.8px',lineHeight:1.15,color:C.text,marginBottom:16}}>
                {cur.titleMain}<br/><span style={{color:C.green,fontFamily:'Playfair Display, Georgia, serif',fontWeight:400,fontStyle:'italic'}}>{cur.titleAcc}</span>
              </div>
              <div style={{fontSize:13,color:C.text3,lineHeight:1.85,marginBottom:20,maxWidth:280}}>{cur.desc}</div>
              <div style={{display:'inline-flex',alignItems:'center',gap:6,padding:'5px 12px',background:'rgba(74,222,128,.06)',border:'.5px solid rgba(74,222,128,.22)',borderRadius:4,...mono,fontSize:9,letterSpacing:'.10em',color:C.green,textTransform:'uppercase',fontWeight:700}}>{cur.tag}</div>
              <div style={{marginTop:28,height:1.5,background:C.border,borderRadius:1,overflow:'hidden'}}><div style={{height:'100%',background:C.green,width:`${progVal}%`,transition:'width 0.08s linear'}}/></div>
              <div style={{display:'flex',gap:5,marginTop:14}}>
                {[0,1,2,3].map(i=>(
                  <div key={i} onClick={()=>setHeroIdx(i)} style={{height:2.5,borderRadius:1.5,cursor:'pointer',transition:'all 0.3s',width:i===heroIdx?28:8,background:i===heroIdx?C.green:C.border2}}/>
                ))}
              </div>
            </div>

            <div
              style={{background:C.bg2,border:`.5px solid ${C.border2}`,borderRadius:14,overflow:'hidden',boxShadow:'0 32px 80px rgba(0,0,0,.7)'}}
              onMouseEnter={()=>setPaused(true)} onMouseLeave={()=>setPaused(false)}
            >
              <div style={{height:40,background:C.bg3,borderBottom:`.5px solid ${C.border}`,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 16px'}}>
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <div style={{width:7,height:7,borderRadius:'50%',background:'#252525',border:'1px solid #2e2e2e'}}/>
                  <div style={{fontSize:12,fontWeight:600,color:C.text}}>stok<span style={{color:C.green}}>radar</span> · Portfolio X-Ray</div>
                </div>
                <div style={{...mono,fontSize:9.5,fontWeight:700,color:C.text3,display:'flex',alignItems:'center',gap:8,flexShrink:0}}>
                  <span style={{width:5,height:5,borderRadius:'50%',background:C.green,boxShadow:`0 0 6px ${C.green}`,display:'inline-block',animation:'liveP 2s ease-in-out infinite'}}/>
                  LIVE · ₹14.82 L
                </div>
              </div>

              <div ref={bentoRef} style={{display:'grid',gridTemplateColumns:`${HERO_W_PCT} ${SMALL_W_PCT}`,gridTemplateRows:`${SMALL_H}px ${SMALL_H}px ${SMALL_H}px`,gap:GAP,padding:PAD,height:HERO_H+PAD*2}}>
                <div style={{gridRow:'1 / 4',background:C.bg3,border:`.5px solid ${C.border2}`,borderRadius:12,overflow:'hidden',boxShadow:'0 14px 36px rgba(0,0,0,.45)',overflowY:'auto'}}>
                  {LARGE_CONTENT[heroIdx]}
                </div>
                {[0,1,2,3].filter(i=>i!==heroIdx).map((tileI, slot)=>(
                  <div key={tileI} onClick={()=>setHeroIdx(tileI)} style={{background:C.bg3,border:`.5px solid ${C.border}`,borderRadius:12,overflow:'hidden',cursor:'pointer',transition:'border-color .2s,box-shadow .2s'}}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor='rgba(74,222,128,.42)';e.currentTarget.style.boxShadow='0 0 0 1px rgba(74,222,128,.22),0 10px 24px rgba(0,0,0,.35)'}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor=`.5px solid ${C.border}`;e.currentTarget.style.boxShadow='none'}}
                  >
                    {SMALL_CONTENT[tileI]}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </div>
      <style>{`@keyframes liveP{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
    </section>
  )
}

/* ─────────────────────────────────────────────────────
   GlobalMarketsSection — flat (no card), bigger globe, no market list.
   Left col is just badge + heading + paragraph. All per-exchange detail
   lives in floating chips on the globe.
───────────────────────────────────────────────────────── */
function GlobalMarketsSection() {
  return (
    <section className="ld-section gm-section" style={{
      padding:'100px 24px', background:C.bg, borderTop:`1px solid ${C.border}`,
      position:'relative', overflow:'hidden',
    }}>
      {/* Ambient dot grid — sits flat against the section, no card */}
      <div aria-hidden style={{
        position:'absolute', inset:0, pointerEvents:'none',
        backgroundImage:'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)',
        backgroundSize:'24px 24px',
        maskImage:'radial-gradient(ellipse 70% 60% at 65% 50%, black 30%, transparent 85%)',
        WebkitMaskImage:'radial-gradient(ellipse 70% 60% at 65% 50%, black 30%, transparent 85%)',
      }}/>
      {/* Green glow toward the right where the globe lives */}
      <div aria-hidden style={{
        position:'absolute', inset:0, pointerEvents:'none',
        background:'radial-gradient(ellipse 55% 50% at 72% 50%, rgba(74,222,128,0.06), transparent 70%)',
      }}/>

      <div style={{ position:'relative', zIndex:2, maxWidth:1280, margin:'0 auto' }}>
        <Reveal>
          <div className="gm-grid" style={{
            display:'grid', gridTemplateColumns:'minmax(0, 320px) 1fr',
            gap:56, alignItems:'center', minHeight:640,
          }}>

            {/* LEFT — copy only */}
            <div>
              <div style={{
                display:'inline-flex', alignItems:'center', gap:6, padding:'5px 12px',
                background:'rgba(74,222,128,0.06)', border:'1px solid rgba(74,222,128,0.22)',
                borderRadius:999, ...mono, fontSize:10.5, letterSpacing:'.10em',
                color:C.green, textTransform:'uppercase', fontWeight:700, marginBottom:18,
              }}>
                <span style={{ width:6, height:6, borderRadius:'50%', background:C.green, boxShadow:`0 0 8px ${C.green}`, display:'inline-block', animation:'gmPulse 2s ease-in-out infinite' }}/>
                Beyond Borders
              </div>
              <h2 style={{
                fontSize:'clamp(34px, 4.2vw, 52px)', fontWeight:800,
                letterSpacing:'-1.4px', lineHeight:1.05, margin:'0 0 16px', color:C.text,
              }}>
                We don&apos;t stop<br/>at India.
                <span style={{
                  color:C.green, fontFamily:'Playfair Display, Georgia, serif',
                  fontStyle:'italic', fontWeight:400, display:'block', marginTop:4,
                }}>Neither should you.</span>
              </h2>
              <p style={{ fontSize:15, color:C.text2, lineHeight:1.65, margin:'0 0 28px', maxWidth:420 }}>
                India is where we started. It&apos;s not where we end. Track <strong style={{color:C.text}}>US stocks &amp; ETFs</strong> alongside your Indian portfolio — same scorecards, same alerts, same depth. <strong style={{color:C.text}}>London, Tokyo, Seoul, Hong Kong</strong> — in the pipeline.
              </p>
            </div>

            {/* RIGHT — bigger globe */}
            <div className="gm-globe-wrap" style={{
              position:'relative', width:'100%', aspectRatio:'1.35', maxHeight:720,
              display:'flex', alignItems:'center', justifyContent:'center',
            }}>
              <svg viewBox="0 0 720 580" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" style={{display:'block'}}>
                <defs>
                  <radialGradient id="gmGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="rgba(74,222,128,0.12)"/>
                    <stop offset="60%" stopColor="rgba(74,222,128,0.025)"/>
                    <stop offset="100%" stopColor="rgba(74,222,128,0)"/>
                  </radialGradient>
                  <linearGradient id="gmArc" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#4ade80" stopOpacity="0.2"/>
                    <stop offset="50%" stopColor="#4ade80" stopOpacity="1"/>
                    <stop offset="100%" stopColor="#4ade80" stopOpacity="0.2"/>
                  </linearGradient>
                  <pattern id="gmDots" x="0" y="0" width="14" height="14" patternUnits="userSpaceOnUse">
                    <circle cx="2" cy="2" r="1" fill="rgba(255,255,255,0.08)"/>
                  </pattern>
                  <mask id="gmLand">
                    {/* N America */}
                    <ellipse cx="150" cy="200" rx="100" ry="64" fill="white"/>
                    <ellipse cx="105" cy="148" rx="48" ry="28" fill="white"/>
                    {/* S America */}
                    <ellipse cx="205" cy="370" rx="40" ry="76" fill="white"/>
                    {/* Europe */}
                    <ellipse cx="355" cy="173" rx="54" ry="36" fill="white"/>
                    {/* Africa */}
                    <ellipse cx="378" cy="308" rx="58" ry="86" fill="white"/>
                    {/* Mid East / W Asia connector */}
                    <ellipse cx="450" cy="243" rx="44" ry="28" fill="white"/>
                    {/* Asia mass */}
                    <ellipse cx="528" cy="200" rx="102" ry="52" fill="white"/>
                    <ellipse cx="585" cy="250" rx="60" ry="36" fill="white"/>
                    {/* SE Asia / Indonesia */}
                    <ellipse cx="628" cy="395" rx="52" ry="28" fill="white"/>
                    {/* India anchor */}
                    <ellipse cx="488" cy="282" rx="28" ry="36" fill="white"/>
                    {/* Australia */}
                    <ellipse cx="650" cy="455" rx="50" ry="30" fill="white"/>
                  </mask>
                </defs>

                <circle cx="360" cy="290" r="280" fill="url(#gmGlow)"/>
                <rect x="20" y="60" width="700" height="460" fill="url(#gmDots)" mask="url(#gmLand)"/>
                <line x1="40" y1="310" x2="700" y2="310" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" strokeDasharray="2 4"/>

                {/* IN → US live corridor */}
                <path d="M 488 282 Q 320 60 150 200" fill="none" stroke="url(#gmArc)" strokeWidth="2.2" strokeLinecap="round" opacity="0.95"/>
                <path d="M 488 282 Q 320 60 150 200" fill="none" stroke="#4ade80" strokeWidth="2.4" strokeLinecap="round" strokeDasharray="6 4" opacity="0.9" style={{animation:'gmDash 1.6s linear infinite'}}/>

                {/* IN → planned (UK, JP, HK) */}
                <path d="M 488 282 Q 410 130 355 173" fill="none" stroke="#fbbf24" strokeWidth="1.1" strokeDasharray="3 5" opacity="0.38"/>
                <path d="M 488 282 Q 555 130 600 200" fill="none" stroke="#fbbf24" strokeWidth="1.1" strokeDasharray="3 5" opacity="0.35"/>
                <path d="M 488 282 Q 540 270 580 280" fill="none" stroke="#fbbf24" strokeWidth="1.1" strokeDasharray="3 5" opacity="0.32"/>

                {/* India home pin */}
                <circle cx="488" cy="282" r="22" fill="rgba(74,222,128,0.10)"/>
                <circle cx="488" cy="282" r="11" fill="#4ade80"/>
                <circle cx="488" cy="282" r="5" fill="#0d0d0d"/>
                <text x="488" y="332" textAnchor="middle" fontFamily="DM Mono" fontSize="12" fontWeight="700" fill="#4ade80" letterSpacing="0.10em">INDIA</text>
                <text x="488" y="348" textAnchor="middle" fontFamily="DM Mono" fontSize="9" fill="rgba(255,255,255,0.42)" letterSpacing="0.08em">HOME</text>

                {/* USA pin */}
                <circle cx="150" cy="200" r="17" fill="rgba(74,222,128,0.08)"/>
                <circle cx="150" cy="200" r="9" fill="#4ade80"/>
                <circle cx="150" cy="200" r="4" fill="#0d0d0d"/>
                <text x="150" y="248" textAnchor="middle" fontFamily="DM Mono" fontSize="12" fontWeight="700" fill="#4ade80" letterSpacing="0.10em">USA</text>

                {/* Soon pins — UK, JP, HK, KR */}
                {[
                  {cx:355,cy:173,lbl:'UK',ly:156,tx:355,r:8,inner:4,fs:10,anc:'middle'},
                  {cx:600,cy:200,lbl:'JP',ly:183,tx:600,r:8,inner:4,fs:10,anc:'middle'},
                  {cx:580,cy:280,lbl:'HK',ly:304,tx:580,r:8,inner:4,fs:10,anc:'middle'},
                  {cx:610,cy:218,lbl:'KR',ly:222,tx:630,r:7,inner:3.5,fs:9.5,anc:'start'},
                ].map(p=>(
                  <g key={p.lbl}>
                    <circle cx={p.cx} cy={p.cy} r={p.r} fill="rgba(251,191,36,0.10)"/>
                    <circle cx={p.cx} cy={p.cy} r={p.inner} fill="#fbbf24" opacity={p.lbl==='KR'?0.7:0.75}/>
                    <text x={p.tx} y={p.ly} textAnchor={p.anc} fontFamily="DM Mono" fontSize={p.fs} fontWeight="700" fill="#fbbf24" letterSpacing="0.08em" opacity={p.lbl==='KR'?0.75:0.8}>{p.lbl}</text>
                  </g>
                ))}
              </svg>

              {/* Floating market chips */}
              {[
                {style:{bottom:'30%', left:'55%'},  live:true,  mkt:'NIFTY 50 · LIVE',       name:'5,400+ stocks',     val:'+0.6%'},
                {style:{top:'24%',   left:'4%'},    live:true,  mkt:'S&P 500 · LIVE',        name:'11,000+ stocks/ETFs', val:'+0.8%'},
                {style:{top:'4%',    left:'42%'},   live:false, mkt:'LSE · SOON',            name:'FTSE 100',          val:''},
                {style:{top:'14%',   right:'2%'},   live:false, mkt:'TSE · SOON',            name:'Nikkei 225',        val:''},
                {style:{bottom:'24%',right:'3%'},   live:false, mkt:'HKEX · KRX · SOON',     name:'Hang Seng · KOSPI', val:''},
              ].map((chip,i)=>(
                <div key={i} style={{
                  position:'absolute', ...chip.style,
                  background:'rgba(13,13,13,0.92)',
                  border:`.5px solid ${chip.live?'rgba(74,222,128,.30)':'rgba(255,255,255,0.13)'}`,
                  borderRadius:7, padding:'6px 11px', ...mono,
                  backdropFilter:'blur(8px)',
                  boxShadow:chip.live?'0 6px 18px rgba(0,0,0,.6), 0 0 0 1px rgba(74,222,128,.10)':'0 6px 18px rgba(0,0,0,.6)',
                  opacity:chip.live?1:0.6, whiteSpace:'nowrap',
                }}>
                  <div style={{
                    fontSize:8, color:chip.live?C.green:C.amber,
                    letterSpacing:'.10em', textTransform:'uppercase', fontWeight:700,
                    display:'flex', alignItems:'center', gap:5, marginBottom:3,
                  }}>
                    {chip.live && <span style={{ width:4, height:4, borderRadius:'50%', background:C.green, animation:'gmPulse 2s ease-in-out infinite', display:'inline-block' }}/>}
                    {chip.mkt}
                  </div>
                  <div style={{ fontSize:10, fontWeight:700, color:C.text }}>
                    {chip.name}{chip.val && <span style={{color:C.green}}> {chip.val}</span>}
                  </div>
                </div>
              ))}
            </div>

          </div>
        </Reveal>
      </div>

      <style>{`
        @keyframes gmDash{to{stroke-dashoffset:-100}}
        @keyframes gmPulse{0%,100%{opacity:1}50%{opacity:.4}}
        @media(max-width:920px){
          .gm-grid{grid-template-columns:1fr !important;gap:28px !important;min-height:auto !important}
          .gm-globe-wrap{max-height:380px !important;aspect-ratio:1.3 !important}
        }
      `}</style>
    </section>
  )
}


/* ─────────────────────────────────────────────────────
   AtlasSection — click-to-expand bubble (single frame)
   Click "Learn more" → particles drift outward, intro slides up,
   content (4 callouts + terminal) fades in. Click back → reverses.
   No sticky positioning, no scroll-driven mechanics.
───────────────────────────────────────────────────────── */
let _atlasThreeP = null
function loadAtlasThree() {
  if (typeof window === 'undefined') return Promise.reject('ssr')
  if (window.THREE) return Promise.resolve(window.THREE)
  if (_atlasThreeP) return _atlasThreeP
  _atlasThreeP = new Promise((res, rej) => {
    const sc = document.createElement('script')
    sc.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js'
    sc.onload = () => res(window.THREE)
    sc.onerror = () => rej(new Error('three.js failed'))
    document.head.appendChild(sc)
  })
  return _atlasThreeP
}

const ATLAS_SCRIPT = [
  { type:'cmd', text:'[m]$[/m] atlas init --profile' },
  { type:'wait', ms:240 },
  { type:'out', text:'  loaded — [w]age 34[/w] · sip [w]₹25,000/mo[/w]' },
  { type:'out', text:'  horizon [w]18 months[/w] · goal [w]down payment[/w]' },
  { type:'wait', ms:280 },
  { type:'cmd', text:'[m]$[/m] atlas scan --universe nse' },
  { type:'wait', ms:180 },
  { type:'out', text:'  [w]3,847[/w] instruments evaluated' },
  { type:'out', text:'  → [w]312[/w] candidates passed first cut' },
  { type:'wait', ms:240 },
  { type:'cmd', text:'[m]$[/m] atlas build --basket' },
  { type:'progress', label:'building basket', ms:900 },
  { type:'out', text:'  [w]12[/w] stocks · [w]4[/w] etfs · [w]2[/w] funds' },
  { type:'out', text:'  projected return [g]~16–22% / yr[/g]' },
  { type:'wait', ms:200 },
  { type:'ready', text:'[g]basket ready[/g]' },
]
function _atlasRender(t) {
  return t
    .replace(/\[g\](.*?)\[\/g\]/g, '<span class="atlas-green">$1</span>')
    .replace(/\[w\](.*?)\[\/w\]/g, '<span class="atlas-accent">$1</span>')
    .replace(/\[m\](.*?)\[\/m\]/g, '<span class="atlas-muted">$1</span>')
}
const _atlasPlain = (t) => t.replace(/\[[gwm]\]|\[\/[gwm]\]/g, '')
const _atlasWait = (ms) => new Promise(r => setTimeout(r, ms))
async function _atlasTypeLine(body, text, klass, ctrl) {
  const line = document.createElement('div')
  line.className = 'atlas-tline ' + klass
  body.appendChild(line)
  const p = _atlasPlain(text)
  for (let i = 0; i < p.length; i++) {
    if (ctrl.aborted) throw new Error('abort')
    line.textContent = p.substring(0, i + 1)
    const ch = p[i]
    let dly = 12 + Math.random() * 12
    if (ch === ' ') dly *= 0.6
    if (ch === '·' || ch === ',' || ch === '.') dly += 50
    await _atlasWait(dly)
  }
  line.innerHTML = _atlasRender(text)
  return line
}
async function _atlasProgress(body, label, totalMs, ctrl) {
  const line = document.createElement('div')
  line.className = 'atlas-tline progress'
  line.innerHTML = `<span class="label">  ${label}</span><span class="bar-track"><span class="bar-fill"></span></span><span class="pct">0%</span>`
  body.appendChild(line)
  const fill = line.querySelector('.bar-fill'), pct = line.querySelector('.pct')
  const steps = 24
  for (let s = 0; s <= steps; s++) {
    if (ctrl.aborted) throw new Error('abort')
    const p = s / steps
    const eased = 1 - Math.pow(1 - p, 1.7)
    fill.style.width = (eased * 100) + '%'
    pct.textContent = Math.round(eased * 100) + '%'
    await _atlasWait(totalMs / steps)
  }
}
async function _atlasRunTerminal(body, ctrl) {
  if (!body) return
  body.innerHTML = ''
  try {
    for (const step of ATLAS_SCRIPT) {
      if (ctrl.aborted) return
      if (step.type === 'wait') {
        const t0 = Date.now()
        while (Date.now() - t0 < step.ms) { if (ctrl.aborted) return; await _atlasWait(30) }
      }
      else if (step.type === 'progress') await _atlasProgress(body, step.label, step.ms, ctrl)
      else if (step.type === 'cmd') await _atlasTypeLine(body, step.text, 'cmd', ctrl)
      else if (step.type === 'out') await _atlasTypeLine(body, step.text, 'out', ctrl)
      else if (step.type === 'ready') {
        const line = await _atlasTypeLine(body, step.text, 'ready', ctrl)
        const caret = document.createElement('span')
        caret.className = 'atlas-caret'
        caret.textContent = '_'
        line.appendChild(caret)
      }
    }
  } catch (e) { /* aborted */ }
}

function AtlasFeat({ num, ttl, children }) {
  return (
    <div style={{maxWidth:280, width:'100%'}}>
      <span style={{...mono, fontSize:10, letterSpacing:'.30em', color:C.green, textTransform:'uppercase', marginBottom:8, display:'block', fontWeight:700}}>{num}</span>
      <div style={{fontSize:17, fontWeight:600, color:'#fff', letterSpacing:'-0.01em', marginBottom:8, lineHeight:1.25}}>{ttl}</div>
      <div style={{fontSize:13, color:C.text2, lineHeight:1.55, textAlign:'justify', textJustify:'inter-word', hyphens:'none', WebkitHyphens:'none', overflowWrap:'normal', wordBreak:'normal'}}>{children}</div>
    </div>
  )
}

function AtlasSection() {
  const canvasRef = useRef(null)
  const sectionRef = useRef(null)
  const termBodyRef = useRef(null)
  const stateRef = useRef({ phase: 'idle', driftStart: 0 })
  const termAbortRef = useRef({ aborted: false })
  const [expanded, setExpanded] = React.useState(false)

  useEffect(() => {
    let cleanup = () => {}
    let alive = true
    loadAtlasThree().then((THREE) => {
      if (!alive || !canvasRef.current || !sectionRef.current) return
      const canvas = canvasRef.current
      const section = sectionRef.current
      const P = { count:18000, radius:48, noise:0.05, flow:0.18, rimPower:3.0, rimBoost:1.5, interiorMix:0.02, particleSize:0.42, magnetRadius:22, magnetDepth:5.0, rippleSpeed:38, rippleAmp:6.0, rippleWidth:6, rippleLife:2.0, rippleMoveThreshold:10, springK:18, damping:5.0, hue:38 }
      const renderer = new THREE.WebGLRenderer({ canvas, antialias:false, alpha:true })
      renderer.setClearColor(0x000000, 0)
      const scene = new THREE.Scene()
      const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 2000)
      camera.position.set(0, 0, 100)
      const N = P.count
      const positions = new Float32Array(N*3), colors = new Float32Array(N*3)
      const baseN = new Float32Array(N*3), baseRJ = new Float32Array(N)
      const disp = new Float32Array(N), vel = new Float32Array(N)
      const driftVel = new Float32Array(N*3)
      for (let i = 0; i < N; i++) {
        const u=Math.random(), v=Math.random(), th=2*Math.PI*u, z=2*v-1, s=Math.sqrt(1-z*z)
        baseN[i*3]=s*Math.cos(th); baseN[i*3+1]=s*Math.sin(th); baseN[i*3+2]=z
        baseRJ[i]=(Math.random()-0.5)*0.03
        const mag = 0.4 + Math.random()*0.5
        driftVel[i*3]   = baseN[i*3]   * mag + (Math.random()-0.5)*0.15
        driftVel[i*3+1] = baseN[i*3+1] * mag + (Math.random()-0.5)*0.15
        driftVel[i*3+2] = baseN[i*3+2] * mag + (Math.random()-0.5)*0.15
      }
      const geo = new THREE.BufferGeometry()
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
      geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
      const mat = new THREE.PointsMaterial({ size:P.particleSize, vertexColors:true, transparent:true, opacity:1, sizeAttenuation:true, blending:THREE.AdditiveBlending, depthWrite:false })
      scene.add(new THREE.Points(geo, mat))
      function resize() {
        const W=canvas.clientWidth, H=canvas.clientHeight
        if (!W||!H) return
        renderer.setSize(W,H,false)
        renderer.setPixelRatio(Math.min(window.devicePixelRatio,2))
        camera.aspect=W/H; camera.updateProjectionMatrix()
      }
      const ro = new ResizeObserver(resize); ro.observe(canvas); resize()

      const raycaster = new THREE.Raycaster()
      const mouseNDC = new THREE.Vector2(-2,-2)
      const sphereForRay = new THREE.Sphere(new THREE.Vector3(0,0,0), P.radius)
      const hitPoint = new THREE.Vector3()
      let cursorOn=false, hasHit=false
      function updateHit() { if (!cursorOn) { hasHit=false; return } raycaster.setFromCamera(mouseNDC, camera); hasHit = !!raycaster.ray.intersectSphere(sphereForRay, hitPoint) }
      function setMouse(e) { const r=canvas.getBoundingClientRect(); mouseNDC.x=((e.clientX-r.left)/r.width)*2-1; mouseNDC.y=-(((e.clientY-r.top)/r.height)*2-1); cursorOn=true }
      const ripples = []
      let lastRX=9999,lastRY=9999,lastRZ=9999
      function spawnRipple(p, strength) {
        ripples.push({ox:p.x,oy:p.y,oz:p.z,age:0,life:P.rippleLife,strength})
        lastRX=p.x; lastRY=p.y; lastRZ=p.z
        if (ripples.length>24) ripples.shift()
      }
      const onMove = (e) => {
        const wasOn=cursorOn; setMouse(e); updateHit()
        if (hasHit) {
          if (!wasOn) spawnRipple(hitPoint, 1.0)
          else {
            const dx=hitPoint.x-lastRX, dy=hitPoint.y-lastRY, dz=hitPoint.z-lastRZ
            if (dx*dx+dy*dy+dz*dz > P.rippleMoveThreshold*P.rippleMoveThreshold) {
              spawnRipple({x:lastRX,y:lastRY,z:lastRZ}, 0.55); spawnRipple(hitPoint, 1.0)
            }
          }
        }
      }
      const onLeave = () => { if (hasHit) spawnRipple(hitPoint, 0.55); cursorOn=false; hasHit=false }
      section.addEventListener('mousemove', onMove)
      section.addEventListener('mouseleave', onLeave)

      const DRIFT_DURATION = 3.5
      const clock = new THREE.Clock()
      const col = new THREE.Color()

      function tick() {
        if (!alive) return
        requestAnimationFrame(tick)
        const dt = Math.min(clock.getDelta(), 1/30)
        const time = clock.elapsedTime * P.flow
        const st = stateRef.current

        for (let r=0;r<ripples.length;r++) ripples[r].age += dt
        for (let r=ripples.length-1;r>=0;r--) if (ripples[r].age > ripples[r].life) ripples.splice(r,1)

        if (st.phase === 'idle' && cursorOn) updateHit()
        else hasHit = false

        let driftP = 0
        if (st.phase === 'drifting') driftP = Math.min(1, (clock.elapsedTime - st.driftStart) / DRIFT_DURATION)
        const easedDrift = driftP * driftP * (3 - 2*driftP)
        mat.opacity = st.phase === 'drifting' ? Math.max(0, 1 - driftP * 1.05) : 1
        canvas.style.opacity = mat.opacity.toFixed(2)

        for (let i=0;i<N;i++) {
          const nx=baseN[i*3], ny=baseN[i*3+1], nz=baseN[i*3+2]
          const phaseR = baseRJ[i]*30
          const n1 = Math.sin(nx*14+time+phaseR) * Math.cos(ny*13-time*0.7)
          const n2 = Math.sin(ny*17-time*0.5+phaseR) * Math.cos(nz*15+time*0.4)
          const n3 = Math.sin(nz*19+time*0.6) * Math.cos(nx*16-time+phaseR)
          const noiseR = 1 + (n1+n2+n3)*0.333*P.noise + baseRJ[i]*0.4
          const sw=time*0.4, sc=Math.cos(sw), ss=Math.sin(sw)
          const rnx=nx*sc-nz*ss, rny=ny, rnz=nx*ss+nz*sc
          const baseR=P.radius*noiseR
          const bx=rnx*baseR, by=rny*baseR, bz=rnz*baseR

          if (st.phase === 'idle') {
            let force = 0
            if (hasHit) {
              const dx=bx-hitPoint.x, dy=by-hitPoint.y, dz=bz-hitPoint.z
              const d=Math.sqrt(dx*dx+dy*dy+dz*dz)
              if (d < P.magnetRadius) { const fall=1-d/P.magnetRadius; force -= P.magnetDepth*fall*fall*60 }
            }
            for (let r=0;r<ripples.length;r++) {
              const rip=ripples[r]
              const dx=bx-rip.ox, dy=by-rip.oy, dz=bz-rip.oz
              const d=Math.sqrt(dx*dx+dy*dy+dz*dz)
              const ringR=rip.age*P.rippleSpeed, off=Math.abs(d-ringR)
              if (off < P.rippleWidth) {
                const ringFall=1-off/P.rippleWidth, ageFall=1-rip.age/rip.life
                const phase=((d-ringR)/P.rippleWidth)*Math.PI*0.5, profile=Math.cos(phase)
                force += P.rippleAmp*profile*ringFall*ageFall*ageFall*rip.strength*40
              }
            }
            force -= P.springK*disp[i]
            force -= P.damping*vel[i]
            vel[i] += force*dt
            disp[i] += vel[i]*dt
          } else {
            disp[i] *= 0.95; vel[i] *= 0.95
          }

          let x=bx+rnx*disp[i], y=by+rny*disp[i], z=bz+rnz*disp[i]
          if (st.phase === 'drifting') {
            const D = 60
            x += driftVel[i*3]   * easedDrift * D
            y += driftVel[i*3+1] * easedDrift * D
            z += driftVel[i*3+2] * easedDrift * D
          }
          positions[i*3]=x; positions[i*3+1]=y; positions[i*3+2]=z

          const facing=Math.abs(rnz)
          const rim=Math.pow(1-facing, P.rimPower)
          let bright = P.interiorMix + rim*P.rimBoost
          const sat = rim>0.4 ? 0.25 : 0.04
          const light = Math.max(0, Math.min(1, 0.45+bright*0.45))
          col.setHSL(P.hue/360, sat, light)
          colors[i*3]=col.r*bright; colors[i*3+1]=col.g*bright; colors[i*3+2]=col.b*bright
        }
        geo.attributes.position.needsUpdate = true
        geo.attributes.color.needsUpdate = true
        renderer.render(scene, camera)
      }
      tick()

      // Expose phase setters for the React-controlled UI
      section._atlasSetPhase = (phase) => {
        stateRef.current.phase = phase
        if (phase === 'drifting') stateRef.current.driftStart = clock.elapsedTime
        if (phase === 'idle') { for (let i=0;i<N;i++) { disp[i]=0; vel[i]=0 } }
      }

      cleanup = () => {
        alive = false
        ro.disconnect()
        section.removeEventListener('mousemove', onMove)
        section.removeEventListener('mouseleave', onLeave)
        geo.dispose(); mat.dispose(); renderer.dispose()
      }
    }).catch(err => console.warn('[AtlasSection]', err))
    return () => cleanup()
  }, [])

  // Sync expand state with three.js loop
  useEffect(() => {
    const sec = sectionRef.current
    if (!sec || !sec._atlasSetPhase) return
    if (expanded) {
      sec._atlasSetPhase('drifting')
      // Start terminal after content has time to fade in
      const t = setTimeout(() => {
        if (termBodyRef.current) {
          termAbortRef.current = { aborted:false }
          _atlasRunTerminal(termBodyRef.current, termAbortRef.current)
        }
      }, 1200)
      return () => clearTimeout(t)
    } else {
      sec._atlasSetPhase('idle')
      termAbortRef.current.aborted = true
      if (termBodyRef.current) termBodyRef.current.innerHTML = ''
    }
  }, [expanded])

  return (
    <section ref={sectionRef} className={'atlas-sec' + (expanded ? ' is-expanded' : '')} style={{ position:'relative', minHeight:'100vh', background:C.bg, overflow:'hidden', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'80px 24px' }}>
      <canvas ref={canvasRef} style={{ position:'absolute', inset:0, width:'100%', height:'100%', zIndex:1, pointerEvents:'none', transition:'opacity 1200ms ease' }} />

      {/* Back button (visible after expand) */}
      <button
        onClick={() => setExpanded(false)}
        style={{
          position:'absolute', top:24, right:24, zIndex:4,
          ...mono, fontSize:11, letterSpacing:'0.22em', color:C.text3, textTransform:'uppercase',
          background:'none', border:`1px solid ${C.border}`, padding:'8px 14px', borderRadius:999,
          cursor:'pointer',
          opacity: expanded ? 1 : 0,
          pointerEvents: expanded ? 'auto' : 'none',
          transition:'opacity 400ms ease 700ms'
        }}>← back</button>

      {/* Intro block — moves up when expanded */}
      <div className="atlas-intro-block" style={{ position:'relative', zIndex:3, textAlign:'center', transition:'transform 900ms cubic-bezier(.4,.7,.2,1)', transform: expanded ? 'translateY(-22vh)' : 'translateY(0)', pointerEvents:'none' }}>
        <div style={{ ...mono, fontSize: expanded ? 'clamp(11px, 1vw, 13px)' : 'clamp(14px, 1.4vw, 18px)', fontWeight:500, color:'rgba(255,255,255,0.78)', letterSpacing:'0.42em', textTransform:'uppercase', marginBottom: expanded ? 10 : 14, textShadow:'0 0 18px rgba(255,255,255,0.2)', transition:'font-size 600ms ease, margin 600ms ease' }}>Introducing</div>
        <div style={{ fontSize: expanded ? 'clamp(40px, 6vw, 80px)' : 'clamp(72px, 10.5vw, 150px)', fontWeight:800, color:C.green, letterSpacing:'-0.04em', lineHeight:0.9, textShadow:'0 0 45px rgba(74,222,128,0.32), 0 0 90px rgba(74,222,128,0.18)', transition:'font-size 700ms cubic-bezier(.4,.7,.2,1)' }}>ATLAS</div>
        <div style={{ marginTop: expanded ? 0 : 22, fontSize:'clamp(13px, 1.1vw, 16px)', fontWeight:500, color:'rgba(255,255,255,0.85)', lineHeight:1.45, maxWidth:480, marginLeft:'auto', marginRight:'auto', textShadow:'0 0 18px rgba(0,0,0,0.95)', opacity: expanded ? 0 : 1, maxHeight: expanded ? 0 : 100, overflow:'hidden', transition:'opacity 400ms ease, max-height 600ms ease, margin 400ms ease' }}>
          Your personal AI engine — curated around your <em style={{fontStyle:'normal', color:C.green, fontWeight:600}}>goals, risk and time horizon</em>.
        </div>
      </div>

      {/* CTA button */}
      <div style={{ position:'relative', zIndex:3, marginTop:56, transition:'opacity 600ms ease, transform 600ms ease', opacity: expanded ? 0 : 1, transform: expanded ? 'translateY(20px)' : 'translateY(0)', pointerEvents: expanded ? 'none' : 'auto' }}>
        <button
          onClick={() => setExpanded(true)}
          style={{
            appearance:'none', background:'rgba(74,222,128,0.08)', border:'1px solid rgba(74,222,128,0.32)',
            color:C.green, fontFamily:'Inter, sans-serif', fontSize:15, fontWeight:600,
            padding:'14px 26px', borderRadius:999, cursor:'pointer',
            display:'inline-flex', alignItems:'center', gap:10,
            transition:'background 220ms ease, border-color 220ms ease, transform 220ms ease, box-shadow 220ms ease'
          }}
          onMouseEnter={(e)=>{e.currentTarget.style.background='rgba(74,222,128,0.14)';e.currentTarget.style.borderColor='rgba(74,222,128,0.5)';e.currentTarget.style.transform='translateY(-1px)';e.currentTarget.style.boxShadow='0 0 0 8px rgba(74,222,128,0.05), 0 10px 30px -10px rgba(74,222,128,0.35)'}}
          onMouseLeave={(e)=>{e.currentTarget.style.background='rgba(74,222,128,0.08)';e.currentTarget.style.borderColor='rgba(74,222,128,0.32)';e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='none'}}
        >
          <span style={{ width:7, height:7, borderRadius:'50%', background:C.green, boxShadow:`0 0 10px ${C.green}`, animation:'atlasPulse 1.8s ease-in-out infinite' }}></span>
          Click to learn more
          <span>→</span>
        </button>
      </div>

      {/* Content layer */}
      <div style={{ position:'absolute', left:0, right:0, top:'50%', zIndex:2, padding:'0 32px', maxWidth:1280, margin:'0 auto', opacity: expanded ? 1 : 0, transform: expanded ? 'translateY(-6vh)' : 'translateY(40px)', pointerEvents: expanded ? 'auto' : 'none', transition:'opacity 700ms ease 200ms, transform 700ms cubic-bezier(.3,.7,.2,1) 200ms' }}>
        <div className="atlas-content-grid" style={{ display:'grid', gridTemplateColumns:'1fr min(540px, 42vw) 1fr', columnGap:44, rowGap:28, alignItems:'center', maxWidth:1280, margin:'0 auto' }}>

          <div className="atlas-side" style={{ display:'flex', flexDirection:'column', gap:28, justifyContent:'center' }}>
            <AtlasFeat num="01 · WHAT IS ATLAS" ttl="A conversation, not a filter">
              ATLAS <em style={{fontStyle:'normal',color:'rgba(255,255,255,0.88)',fontWeight:500}}>has a conversation with you</em>, understands where you are in life, and builds a personalised basket of stocks around your actual goal.
            </AtlasFeat>
            <AtlasFeat num="03 · WHAT MAKES IT DIFFERENT" ttl="Every pick comes with a reason">
              The fundamentals, the growth story, why it fits your goal. When markets shift, ATLAS <em style={{fontStyle:'normal',color:'rgba(255,255,255,0.88)',fontWeight:500}}>rebalances and tells you exactly why</em>.
            </AtlasFeat>
          </div>

          <div style={{ alignSelf:'center', width:'100%' }}>
            <div style={{ background:'linear-gradient(180deg,#0c0e12 0%,#0a0c10 100%)', border:`1px solid ${C.border}`, borderRadius:12, overflow:'hidden', boxShadow:'0 30px 80px -20px rgba(0,0,0,0.6), 0 0 0 1px rgba(74,222,128,0.06), 0 0 60px -20px rgba(74,222,128,0.12)', ...mono, fontSize:12.5, lineHeight:1.65 }}>
              <div style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 14px', borderBottom:`1px solid ${C.border}`, background:'rgba(255,255,255,0.012)' }}>
                <div style={{ display:'flex', gap:6 }}>
                  <span style={{ width:11, height:11, borderRadius:'50%', background:'#ff5f56' }} />
                  <span style={{ width:11, height:11, borderRadius:'50%', background:'#ffbd2e' }} />
                  <span style={{ width:11, height:11, borderRadius:'50%', background:'#27c93f' }} />
                </div>
                <div style={{ ...mono, fontSize:11, color:C.text3, flex:1, textAlign:'center', paddingRight:50 }}>atlas · portfolio engine</div>
              </div>
              <div ref={termBodyRef} style={{ padding:'16px 18px 22px', minHeight:280, color:'rgba(255,255,255,0.78)', whiteSpace:'pre', overflow:'hidden' }} />
            </div>
          </div>

          <div className="atlas-side right" style={{ display:'flex', flexDirection:'column', gap:28, justifyContent:'center', alignItems:'flex-end', textAlign:'right' }}>
            <AtlasFeat num="02 · HOW IT WORKS" ttl="Tell it your goal. Plain language.">
              ATLAS analyses <em style={{fontStyle:'normal',color:'rgba(255,255,255,0.88)',fontWeight:500}}>thousands of stocks</em>, weighs your timeline and risk appetite, and assembles a focused basket for you.
            </AtlasFeat>
            <AtlasFeat num="04 · BUILT FOR YOUR LIFE" ttl="Not a template. Built for you.">
              Your basket isn&apos;t generic. It&apos;s shaped around <em style={{fontStyle:'normal',color:'rgba(255,255,255,0.88)',fontWeight:500}}>your goal, timeline, risk appetite</em>. Every investor gets a different basket.
            </AtlasFeat>
          </div>

        </div>
      </div>

      <style>{`
        @keyframes atlasPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes atlasBlink { 0%,50% { opacity:1 } 50.01%,100% { opacity:0 } }
        .atlas-caret { display:inline-block; width:8px; background:#4ade80; color:transparent; margin-left:2px; animation:atlasBlink 1s steps(2) infinite; }
        .atlas-tline { white-space:pre; }
        .atlas-tline.cmd { color:#4ade80; font-weight:500; }
        .atlas-tline.out { color:rgba(255,255,255,0.7); }
        .atlas-tline.out .atlas-accent { color:#fff; font-weight:500; }
        .atlas-tline.out .atlas-green { color:#4ade80; font-weight:500; }
        .atlas-tline.out .atlas-muted { color:rgba(255,255,255,0.3); }
        .atlas-tline.progress { color:#4ade80; font-weight:500; display:flex; align-items:center; gap:10px; }
        .atlas-tline.progress .bar-track { flex:0 0 140px; height:7px; background:rgba(255,255,255,0.06); border-radius:2px; overflow:hidden; }
        .atlas-tline.progress .bar-fill { height:100%; width:0; background:#4ade80; box-shadow:0 0 8px rgba(74,222,128,0.5); transition:width 80ms linear; }
        .atlas-tline.progress .pct { color:rgba(255,255,255,0.6); min-width:36px; }
        .atlas-tline.ready { color:#4ade80; font-weight:600; }
        @media (max-width: 980px) {
          .atlas-sec.is-expanded .atlas-intro-block { transform: translateY(-28vh) !important; }
          .atlas-content-grid { grid-template-columns: 1fr !important; column-gap: 0 !important; row-gap: 32px !important; }
          .atlas-side, .atlas-side.right { align-items: flex-start !important; text-align: left !important; }
        }
      `}</style>
    </section>
  )
}

function LearnSection() {
  const openNotify = useNotify()

  // 1 spotlight (newest this week) + 3 secondary featured — links open notify modal
  const SPOTLIGHT = {
    cat: 'ETFs', catFg: '#fbbf24', catBg: 'rgba(251,191,36,0.10)', catBd: 'rgba(251,191,36,0.26)',
    ttl: 'Premium & Discount to NAV — when an ETF trades away from its real value',
    desc: 'An ETF’s market price and its NAV are two different numbers. Usually they hug within 0.1%. When they don’t — persistent premiums above 1%, sustained discounts, freeze-driven spikes of 10%+ — that’s a signal, sometimes an opportunity, often a tax you’re paying for no reason.',
    read: '6 min', updated: 'May 24, 2026', isNew: true,
    href: '/learn/etfs/premium-discount-nav',
  }

  const FEATURED = [
    {
      cat: 'US Stocks', catFg: '#22d3ee', catBg: 'rgba(34,211,238,0.10)', catBd: 'rgba(34,211,238,0.26)',
      ttl: 'Currency Risk in US Investing — what a falling INR really does',
      desc: 'Your US portfolio is a two-bet trade — the stock AND the rupee.',
      read: '7 min', isNew: true,
      href: '/learn/us-stocks/currency-risk-us',
    },
    {
      cat: 'Using stokradar', catFg: C.purple, catBg: 'rgba(167,139,250,0.10)', catBd: 'rgba(167,139,250,0.26)',
      ttl: 'Smart Price Bands — how we replace the 52W range',
      desc: 'Three independent bands: technical, fair-value, forward cone.',
      read: '9 min',
      href: '/learn/using-stokradar/smart-price-bands',
    },
    {
      cat: 'Mutual Funds', catFg: C.green, catBg: 'rgba(74,222,128,0.10)', catBd: 'rgba(74,222,128,0.26)',
      ttl: 'Rolling Returns — why a single 5Y CAGR lies',
      desc: 'Read every overlapping window instead of one number.',
      read: '6 min',
      href: '/learn/mutual-funds/rolling-returns',
    },
  ]

  // 8 categories — counts mirror /lib/learn/articles
  const CATS = [
    { slug:'getting-started', name:'Getting Started', icon:'◔', count:7,  color:'#86efac' },
    { slug:'stocks',          name:'Stocks',          icon:'▲', count:14, color:'#60a5fa' },
    { slug:'mutual-funds',    name:'Mutual Funds',    icon:'◇', count:11, color:'#a78bfa' },
    { slug:'etfs',            name:'ETFs (India)',    icon:'▦', count:7,  color:'#fbbf24' },
    { slug:'us-stocks',       name:'US Stocks',       icon:'★', count:5,  color:'#22d3ee' },
    { slug:'us-etfs',         name:'US ETFs',         icon:'◯', count:4,  color:'#fb923c' },
    { slug:'portfolio',       name:'Portfolio',       icon:'◆', count:7,  color:'#4ade80' },
    { slug:'using-stokradar', name:'Using stokradar', icon:'◉', count:11, color:'#f87171' },
  ]

  const STATS = [
    { v:'66',  k:'Articles' },
    { v:'8',   k:'Categories' },
    { v:'163', k:'Glossary terms' },
    { v:'IST', k:'Updated weekly' },
  ]

  return (
    <section className="ld-section" style={{
      padding:'100px 24px',
      background:`
        radial-gradient(1100px 600px at 85% -8%, rgba(74,222,128,0.06), transparent 60%),
        radial-gradient(800px 500px at -8% 110%, rgba(167,139,250,0.05), transparent 60%),
        ${C.bg}
      `,
      borderTop:`1px solid ${C.border}`, borderBottom:`1px solid ${C.border}`,
    }}>
      <div style={{ maxWidth:1180, margin:'0 auto' }}>

        {/* ── Header ── */}
        <Reveal><div style={{ fontSize:11,color:C.text3,...mono,letterSpacing:'0.12em',fontWeight:700,marginBottom:14,textTransform:'uppercase' }}>learn the craft</div></Reveal>
        <Reveal delay={80}>
          <h2 className="ld-section-title" style={{ fontSize:42,fontWeight:800,color:C.text,letterSpacing:'-1px',lineHeight:1.15,margin:'0 0 14px',maxWidth:780 }}>
            Every concept on stokradar. <span style={{ color:C.green,fontFamily:'Playfair Display, Georgia, serif',fontWeight:400,fontStyle:'italic' }}>Explained plainly.</span>
          </h2>
        </Reveal>
        <Reveal delay={120}>
          <p style={{ fontSize:16,color:C.text2,lineHeight:1.6,maxWidth:620,margin:'0 0 32px' }}>
            From the basics of stocks and mutual funds to how every score, band and screen on the site is built. Real Indian-market examples, no jargon.
          </p>
        </Reveal>

        {/* ── Stat strip ── */}
        <Reveal delay={160}>
          <div className="learn-stats" style={{
            display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:1,
            background:C.border, border:`1px solid ${C.border}`, borderRadius:10, overflow:'hidden',
            marginBottom:36,
          }}>
            {STATS.map((s,i)=>(
              <div key={i} style={{ background:C.bg2, padding:'14px 18px', display:'flex', flexDirection:'column', gap:4 }}>
                <span style={{ ...mono, fontSize:22, fontWeight:800, color:C.text, letterSpacing:'-0.5px', lineHeight:1 }}>{s.v}</span>
                <span style={{ ...mono, fontSize:9.5, color:C.text3, letterSpacing:'0.10em', textTransform:'uppercase', fontWeight:600 }}>{s.k}</span>
              </div>
            ))}
          </div>
        </Reveal>

        {/* ── Featured: 1 spotlight + 3 stacked ── */}
        <Reveal delay={200}>
          <div className="learn-feature-grid" style={{ display:'grid', gridTemplateColumns:'1.5fr 1fr', gap:14, marginBottom:32 }}>

            {/* Spotlight (left) */}
            <div onClick={openNotify} style={{
              position:'relative', cursor:'pointer',
              background:`linear-gradient(135deg, ${C.bg2} 0%, ${C.bg3} 100%)`,
              border:`1px solid ${C.border}`, borderRadius:14, overflow:'hidden',
              display:'flex', flexDirection:'column', minHeight:340,
              transition:'border-color 0.2s, transform 0.2s, box-shadow 0.2s',
            }}
              onMouseEnter={e=>{ e.currentTarget.style.borderColor='rgba(167,139,250,0.40)'; e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 18px 40px rgba(0,0,0,0.5)' }}
              onMouseLeave={e=>{ e.currentTarget.style.borderColor=C.border; e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='none' }}
            >
              {/* Decorative visual bar */}
              <div style={{ position:'relative', height:180, overflow:'hidden', borderBottom:`1px solid ${C.border}`, background:'radial-gradient(ellipse 70% 80% at 30% 50%, rgba(167,139,250,0.18), transparent 60%), #0d0a14' }}>
                <svg viewBox="0 0 600 180" width="100%" height="100%" preserveAspectRatio="none" style={{ display:'block' }}>
                  <defs>
                    <linearGradient id="lsGreenG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#4ade80" stopOpacity="0.25"/><stop offset="100%" stopColor="#4ade80" stopOpacity="0"/></linearGradient>
                  </defs>
                  {/* 3 horizontal bands */}
                  <rect x="0" y="40" width="600" height="22" fill="rgba(248,113,113,0.06)" />
                  <rect x="0" y="78" width="600" height="22" fill="rgba(251,191,36,0.06)" />
                  <rect x="0" y="116" width="600" height="22" fill="rgba(74,222,128,0.06)" />
                  {/* Band labels */}
                  <text x="12" y="56" fontFamily="DM Mono" fontSize="9" fontWeight="700" fill="#f87171" letterSpacing="0.10em">SELL ZONE</text>
                  <text x="12" y="94" fontFamily="DM Mono" fontSize="9" fontWeight="700" fill="#fbbf24" letterSpacing="0.10em">FAIR</text>
                  <text x="12" y="132" fontFamily="DM Mono" fontSize="9" fontWeight="700" fill="#4ade80" letterSpacing="0.10em">BUY ZONE</text>
                  {/* Price line */}
                  <polygon fill="url(#lsGreenG)" points="0,150 60,140 120,130 180,110 240,95 300,88 360,80 420,90 480,75 540,65 600,55 600,180 0,180"/>
                  <polyline fill="none" stroke="#a78bfa" strokeWidth="2.2" strokeLinecap="round" points="0,150 60,140 120,130 180,110 240,95 300,88 360,80 420,90 480,75 540,65 600,55"/>
                  {/* Current price marker */}
                  <circle cx="600" cy="55" r="5" fill="#a78bfa"/>
                  <circle cx="600" cy="55" r="10" fill="rgba(167,139,250,0.25)"/>
                </svg>
              </div>

              <div style={{ padding:'22px 26px 24px', display:'flex', flexDirection:'column', flex:1 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12, flexWrap:'wrap' }}>
                  <span style={{ ...mono, fontSize:9, fontWeight:700, padding:'3px 9px', borderRadius:4, background:SPOTLIGHT.catBg, color:SPOTLIGHT.catFg, border:`1px solid ${SPOTLIGHT.catBd}`, letterSpacing:'0.08em', textTransform:'uppercase' }}>{SPOTLIGHT.cat}</span>
                  {SPOTLIGHT.isNew && (
                    <span style={{ ...mono, fontSize:9, fontWeight:700, padding:'3px 9px', borderRadius:4, background:'rgba(74,222,128,0.12)', color:C.green, border:'1px solid rgba(74,222,128,0.35)', letterSpacing:'0.12em', textTransform:'uppercase', display:'inline-flex', alignItems:'center', gap:4 }}>
                      <span style={{ width:5, height:5, borderRadius:'50%', background:C.green, boxShadow:`0 0 6px ${C.green}` }}/>
                      NEW
                    </span>
                  )}
                  <span style={{ ...mono, fontSize:9, fontWeight:700, padding:'3px 9px', borderRadius:4, background:'rgba(167,139,250,0.08)', color:C.purple, border:'1px solid rgba(167,139,250,0.22)', letterSpacing:'0.08em', textTransform:'uppercase' }}>This week</span>
                  <span style={{ ...mono, fontSize:10, color:C.text3, marginLeft:'auto' }}>{SPOTLIGHT.read}</span>
                </div>
                <div style={{ fontSize:22, fontWeight:800, color:C.text, letterSpacing:'-0.5px', lineHeight:1.2, marginBottom:10 }}>{SPOTLIGHT.ttl}</div>
                <div style={{ fontSize:13.5, color:C.text2, lineHeight:1.65, marginBottom:18, flex:1 }}>{SPOTLIGHT.desc}</div>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', paddingTop:14, borderTop:`1px solid ${C.border}` }}>
                  <span style={{ ...mono, fontSize:10, color:C.text3, letterSpacing:'0.06em' }}>Updated {SPOTLIGHT.updated}</span>
                  <span style={{ fontSize:12, fontWeight:700, color:C.green, ...mono, display:'inline-flex', alignItems:'center', gap:6 }}>Notify me →</span>
                </div>
              </div>
            </div>

            {/* Stacked featured (right) */}
            <div style={{ display:'grid', gridTemplateRows:'repeat(3, 1fr)', gap:14 }}>
              {FEATURED.map((a, i) => (
                <div key={i} onClick={openNotify} style={{
                  cursor:'pointer',
                  background:C.bg2, border:`1px solid ${C.border}`, borderRadius:12,
                  padding:'16px 18px',
                  display:'flex', flexDirection:'column', gap:8,
                  transition:'border-color 0.2s, transform 0.2s, background 0.2s',
                }}
                  onMouseEnter={e=>{ e.currentTarget.style.borderColor=`${a.catFg}66`; e.currentTarget.style.background=C.bg3; e.currentTarget.style.transform='translateX(-3px)' }}
                  onMouseLeave={e=>{ e.currentTarget.style.borderColor=C.border; e.currentTarget.style.background=C.bg2; e.currentTarget.style.transform='translateX(0)' }}
                >
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:6 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:5, flexWrap:'wrap', minWidth:0 }}>
                      <span style={{ ...mono, fontSize:8.5, fontWeight:700, padding:'2px 7px', borderRadius:3, background:a.catBg, color:a.catFg, border:`1px solid ${a.catBd}`, letterSpacing:'0.08em', textTransform:'uppercase' }}>{a.cat}</span>
                      {a.isNew && (
                        <span style={{ ...mono, fontSize:8, fontWeight:700, padding:'2px 6px', borderRadius:3, background:'rgba(74,222,128,0.12)', color:C.green, border:'1px solid rgba(74,222,128,0.35)', letterSpacing:'0.10em', textTransform:'uppercase' }}>NEW</span>
                      )}
                    </div>
                    <span style={{ ...mono, fontSize:10, color:C.text3, flexShrink:0 }}>{a.read}</span>
                  </div>
                  <div style={{ fontSize:14, fontWeight:700, color:C.text, letterSpacing:'-0.2px', lineHeight:1.32 }}>{a.ttl}</div>
                  <div style={{ fontSize:11.5, color:C.text2, lineHeight:1.5, flex:1 }}>{a.desc}</div>
                </div>
              ))}
            </div>

          </div>
        </Reveal>

        {/* ── Browse by category ── */}
        <Reveal delay={260}>
          <div style={{ ...mono, fontSize:9.5, color:C.text3, letterSpacing:'0.14em', textTransform:'uppercase', fontWeight:700, marginBottom:12, display:'flex', alignItems:'center', gap:10 }}>
            <span>Browse all 8 categories</span><div style={{ flex:1, height:0.5, background:C.border }}/>
          </div>
          <div className="learn-cat-grid" style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:10, marginBottom:24 }}>
            {CATS.map((c,i)=>(
              <div key={c.slug} onClick={openNotify} style={{
                cursor:'pointer',
                background:C.bg2, border:`1px solid ${C.border}`, borderRadius:10,
                padding:'14px 16px',
                display:'flex', alignItems:'center', gap:12,
                transition:'border-color 0.2s, background 0.2s, transform 0.2s',
                position:'relative', overflow:'hidden',
              }}
                onMouseEnter={e=>{ e.currentTarget.style.borderColor=`${c.color}55`; e.currentTarget.style.background=C.bg3; e.currentTarget.style.transform='translateY(-2px)' }}
                onMouseLeave={e=>{ e.currentTarget.style.borderColor=C.border; e.currentTarget.style.background=C.bg2; e.currentTarget.style.transform='translateY(0)' }}
              >
                <div style={{
                  width:34, height:34, flexShrink:0, borderRadius:8,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  background:`${c.color}14`, border:`1px solid ${c.color}33`,
                  fontSize:14, color:c.color, fontWeight:700,
                }}>{c.icon}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:12.5, fontWeight:700, color:C.text, letterSpacing:'-0.1px', marginBottom:2, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{c.name}</div>
                  <div style={{ ...mono, fontSize:9.5, color:C.text3, letterSpacing:'0.04em' }}>{c.count} article{c.count===1?'':'s'}</div>
                </div>
                <span style={{ ...mono, fontSize:11, color:C.text4, flexShrink:0 }}>→</span>
              </div>
            ))}
          </div>
        </Reveal>

        {/* ── Glossary CTA bar ── */}
        <Reveal delay={320}>
          <div onClick={openNotify} style={{
            display:'flex', alignItems:'center', gap:14,
            padding:'18px 22px', cursor:'pointer',
            background:`linear-gradient(135deg, rgba(74,222,128,0.06), ${C.bg2})`,
            border:'1px solid rgba(74,222,128,0.22)', borderRadius:12,
            transition:'border-color 0.2s, transform 0.2s, box-shadow 0.2s',
          }}
            onMouseEnter={e=>{ e.currentTarget.style.borderColor='rgba(74,222,128,0.45)'; e.currentTarget.style.transform='translateY(-1px)'; e.currentTarget.style.boxShadow='0 12px 30px rgba(74,222,128,0.10)' }}
            onMouseLeave={e=>{ e.currentTarget.style.borderColor='rgba(74,222,128,0.22)'; e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='none' }}
          >
            <div style={{
              width:46, height:46, flexShrink:0, borderRadius:10,
              background:'rgba(74,222,128,0.10)', border:'1px solid rgba(74,222,128,0.28)',
              display:'flex', alignItems:'center', justifyContent:'center',
              ...mono, fontSize:11, fontWeight:800, color:C.green, letterSpacing:'-0.5px',
            }}>A→Z</div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:14, fontWeight:700, color:C.text, marginBottom:3, letterSpacing:'-0.1px' }}>The Glossary <span style={{ ...mono, fontSize:11, fontWeight:600, color:C.green, marginLeft:8 }}>· 163 terms</span></div>
              <div style={{ fontSize:12, color:C.text2, lineHeight:1.5 }}>Every investing term used across the site — searchable, with deep-dive links to the relevant article.</div>
            </div>
            <span style={{ ...mono, fontSize:12, fontWeight:700, color:C.green, flexShrink:0 }}>Notify me →</span>
          </div>
        </Reveal>

      </div>
      <style>{`
        @media(max-width:920px){
          .learn-feature-grid{grid-template-columns:1fr !important}
          .learn-cat-grid{grid-template-columns:repeat(2,1fr) !important}
          .learn-stats{grid-template-columns:repeat(2,1fr) !important}
        }
        @media(max-width:480px){
          .learn-cat-grid{grid-template-columns:1fr !important}
        }
      `}</style>
    </section>
  )
}

function FutureSection() {
  const openNotify = useNotify()
  return (
    <section
      style={{
        padding: '96px 32px 104px',
        textAlign: 'center',
        background: `radial-gradient(900px 460px at 50% 100%, rgba(74,222,128,0.06), transparent 60%), ${C.bg}`,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{
        position: 'absolute', left: '50%', bottom: 0, transform: 'translateX(-50%)',
        width: '60%', height: 1,
        background: 'linear-gradient(90deg, transparent, #4ade80, transparent)',
        opacity: 0.4,
      }} />

      <div style={{ maxWidth: 1140, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          fontSize: 11, fontWeight: 600, color: C.green,
          background: 'rgba(74,222,128,0.10)', border: '1px solid rgba(74,222,128,0.22)',
          padding: '5px 12px', borderRadius: 100,
          fontFamily: 'monospace', letterSpacing: '0.04em',
          marginBottom: 18,
        }}>
          <span style={{
            width: 5, height: 5, borderRadius: '50%', background: C.amber,
            animation: 'pulse 1.5s infinite',
          }} />
          COMING SOON
        </div>

        <div style={{
          fontSize: 28, fontWeight: 700, color: C.text,
          letterSpacing: '-0.5px', lineHeight: 1.2,
          maxWidth: '22ch',
        }}>The future of investing.</div>

        <div style={{
          fontSize: 12.5, color: C.text2, lineHeight: 1.55,
          marginTop: 10, maxWidth: 520, textAlign: 'center',
        }}>
          Real-time alerts, smart screeners, honest analytics —{' '}
          <b style={{ color: C.text, fontWeight: 600 }}>built around the investor</b>, not the broker.
        </div>

        <button onClick={openNotify}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            marginTop: 24, cursor:'pointer',
            padding: '11px 20px', borderRadius: 100,
            fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 600,
            color: '#06210e', background: C.green,
            border: '1px solid #22c55e',
            boxShadow: '0 0 0 1px rgba(74,222,128,0.10), 0 14px 30px -12px rgba(74,222,128,0.45)',
            transition: 'transform 0.15s, box-shadow 0.2s',
            letterSpacing: '-0.1px',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-1px)'
            e.currentTarget.style.boxShadow = '0 0 0 1px rgba(74,222,128,0.2), 0 18px 36px -12px rgba(74,222,128,0.6)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = '0 0 0 1px rgba(74,222,128,0.10), 0 14px 30px -12px rgba(74,222,128,0.45)'
          }}
        >
          Get on the waitlist →
        </button>

      </div>
    </section>
  )
}

export default function Home() {
  const [indices] = useState(FALLBACK_INDICES)
  const [notifyOpen, setNotifyOpen] = useState(false)
  const openNotify = useCallback(() => setNotifyOpen(true), [])
  const canvasRef = useRef(null)

  useEffect(() => {
    const cv = canvasRef.current; if (!cv) return
    const ctx = cv.getContext('2d')
    let W, H, rafId, mx=-9999, my=-9999, particles=[]
    function Particle(x,y,d){this.ox=x;this.oy=y;this.x=x;this.y=y;this.vx=0;this.vy=0;this.lit=0;this.data=d;
      this.base=0.28+Math.random()*0.14}
    function build(){particles=[];const cols=Math.ceil(W/115),rows=Math.ceil(H/58),xg=W/cols,yg=H/rows;let i=0;for(let r=0;r<rows;r++)for(let c=0;c<cols;c++)particles.push(new Particle(xg*c+xg*0.2+Math.random()*xg*0.6,yg*r+yg*0.2+Math.random()*yg*0.6,TICKERS[i++%TICKERS.length]))}
    function resize(){W=cv.width=cv.offsetWidth;H=cv.height=cv.offsetHeight;build()}
    function lerp(a,b,t){return a+(b-a)*t}
    function frame(){ctx.clearRect(0,0,W,H);ctx.font='500 10px monospace';particles.forEach(p=>{
      const dx=mx-p.x,dy=my-p.y,dist=Math.sqrt(dx*dx+dy*dy)
      if(dist<200&&dist>1){const f=(1-dist/200)*0.036;p.vx+=dx*f;p.vy+=dy*f;p.lit=lerp(p.lit,1-dist/200,0.18)}else{p.lit=lerp(p.lit,0,0.06)}
      p.vx+=(p.ox-p.x)*0.06;p.vy+=(p.oy-p.y)*0.06;p.vx*=0.72;p.vy*=0.72;p.x+=p.vx;p.y+=p.vy
      const a=Math.min(p.base+p.lit*0.98,1),sc=1+p.lit*0.52
      ctx.save();ctx.translate(p.x,p.y);ctx.scale(sc,sc)
      ctx.fillStyle=p.data.bull?`rgba(74,222,128,${a})`:`rgba(248,113,113,${a})`
      ctx.fillText(p.data.s,0,0);const aw=ctx.measureText(p.data.s).width
      ctx.font='400 9px monospace'
      ctx.fillStyle=p.data.bull?`rgba(74,222,128,${a*0.85})`:`rgba(248,113,113,${a*0.85})`
      ctx.fillText('  '+p.data.v,aw,0);ctx.font='500 10px monospace';ctx.restore()
    });rafId=requestAnimationFrame(frame)}
    const onMove=e=>{const r=cv.getBoundingClientRect();mx=e.clientX-r.left;my=e.clientY-r.top}
    const onLeave=()=>{mx=-9999;my=-9999}
    resize();window.addEventListener('resize',resize);window.addEventListener('mousemove',onMove);window.addEventListener('mouseleave',onLeave);rafId=requestAnimationFrame(frame)
    return()=>{cancelAnimationFrame(rafId);window.removeEventListener('resize',resize);window.removeEventListener('mousemove',onMove);window.removeEventListener('mouseleave',onLeave)}
  },[])

  // Lock scroll when notify modal is open
  useEffect(()=>{
    if (notifyOpen) {
      const prev = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = prev }
    }
  },[notifyOpen])

  return (
    <NotifyCtx.Provider value={openNotify}>
    <div style={{ background:C.bg,color:C.text,fontFamily:'Inter, -apple-system, system-ui, sans-serif',overflow:'hidden' }}>
      <style>{`
        html{scroll-behavior:smooth}
        @keyframes ticker-scroll{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
        @keyframes pulse-cue{0%,100%{opacity:.35;transform:translateY(0)}50%{opacity:.7;transform:translateY(6px)}}
        @keyframes shimmer-text{0%{background-position:-200% 0}100%{background-position:200% 0}}
        @keyframes float-c{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}
        @keyframes float-l{0%,100%{transform:rotateY(22deg) translateY(0)}50%{transform:rotateY(22deg) translateY(-5px)}}
        @keyframes float-r{0%,100%{transform:rotateY(-22deg) translateY(0)}50%{transform:rotateY(-22deg) translateY(-5px)}}
        @keyframes scroll-left{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
        @keyframes scroll-right{0%{transform:translateX(-50%)}100%{transform:translateX(0)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}
        .port-row-l{animation:scroll-left 28s linear infinite;display:flex;gap:10px;width:max-content;margin-bottom:10px}
        .port-row-r{animation:scroll-right 34s linear infinite;display:flex;gap:10px;width:max-content}
        .port-row-l:hover,.port-row-r:hover{animation-play-state:paused}
        .ld-card-hover{transition:transform 240ms cubic-bezier(.22,1,.36,1),border-color 240ms}
        .ld-card-hover:hover{transform:translateY(-4px);border-color:rgba(74,222,128,.30)}
        .ld-cta{transition:transform 240ms,box-shadow 240ms}
        .ld-cta:hover{transform:translateY(-2px);box-shadow:0 12px 28px rgba(74,222,128,.25)}
        .learn-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
        @media(max-width:768px){
          .ld-hero-title{font-size:36px !important;line-height:1.08 !important;letter-spacing:-1px !important}
          .ld-hero-sub{font-size:14px !important}
          .ld-section-title{font-size:24px !important;letter-spacing:-.4px !important;line-height:1.2 !important}
          .ld-section{padding:56px 18px !important}
          .ld-feature-grid{grid-template-columns:1fr !important;gap:28px !important}
          .ld-feature-grid-2{grid-template-columns:1fr !important;gap:14px !important}
          .ld-feature-grid-4{grid-template-columns:1fr 1fr !important;gap:10px !important}
          .ld-coverage{grid-template-columns:1fr 1fr !important;gap:16px !important}
          .ld-coverage-num{font-size:38px !important;letter-spacing:-1px !important}
          .ld-cta-row{flex-direction:column !important}
          .ld-cta-row>*{width:100%;justify-content:center}
          .ld-hero-section{padding:24px 18px 80px !important;min-height:90vh !important}
          .ld-final-cta-title{font-size:38px !important;letter-spacing:-1px !important}
          .ld-3d-stack{flex-direction:column !important;align-items:center !important;perspective:none !important}
          .ld-3d-side{display:none !important}
          .port-row-l,.port-row-r{animation-duration:18s !important}
          .alerts-grid{grid-template-columns:1fr !important;gap:32px !important}
          .learn-grid{grid-template-columns:repeat(2,1fr) !important}
        }
        @media(max-width:480px){
          .ld-hero-title{font-size:32px !important}
          .ld-section-title{font-size:22px !important}
          .ld-coverage-num{font-size:32px !important}
          .learn-grid{grid-template-columns:1fr !important}
        }
      `}</style>
      {/* Coming-soon top bar */}
      <header style={{
        position:'sticky', top:0, zIndex:100,
        display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'14px 24px',
        background:'rgba(7,7,7,0.78)', backdropFilter:'blur(14px)',
        borderBottom:`1px solid ${C.border}`,
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
          <div style={{ fontSize:17, fontWeight:700, letterSpacing:'-0.4px', color:C.text }}>
            stok<span style={{ color:C.green }}>radar</span>
          </div>
        </div>
        <button onClick={openNotify} style={{
          padding:'8px 16px', borderRadius:8,
          background:C.green, color:'#06210e', border:'none', cursor:'pointer',
          fontFamily:'Inter,sans-serif', fontSize:13, fontWeight:700, letterSpacing:'-0.1px',
        }}>Notify me →</button>
      </header>

      {/* HERO */}
      <section className="ld-hero-section" style={{ position:'relative',minHeight:'calc(100vh - 64px)',overflow:'hidden',display:'flex',flexDirection:'column',justifyContent:'center',padding:'40px 24px' }}>
        <canvas ref={canvasRef} aria-hidden style={{ position:'absolute',inset:0,width:'100%',height:'100%',zIndex:0,pointerEvents:'none' }} />
        <div aria-hidden style={{ position:'absolute',inset:0,zIndex:1,pointerEvents:'none',background:'radial-gradient(ellipse 55% 65% at 50% 52%, transparent 0%, rgba(7,7,7,0.45) 55%, rgba(7,7,7,0.95) 100%)' }} />
        <div aria-hidden style={{ position:'absolute',inset:0,zIndex:1,pointerEvents:'none',backgroundImage:'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)',backgroundSize:'40px 40px',maskImage:'radial-gradient(ellipse 80% 70% at 50% 50%, black 30%, transparent 80%)',WebkitMaskImage:'radial-gradient(ellipse 80% 70% at 50% 50%, black 30%, transparent 80%)' }} />
        <div style={{ position:'relative',zIndex:2,maxWidth:1100,margin:'0 auto',width:'100%' }}>
          <Reveal delay={50}><div style={{ display:'inline-block',padding:'6px 14px',borderRadius:999,background:'rgba(74,222,128,0.06)',border:'1px solid rgba(74,222,128,0.22)',fontSize:11,color:C.green,...mono,letterSpacing:'0.10em',fontWeight:700,marginBottom:24 }}>◆ STOKRADAR · the future of investing</div></Reveal>
          <Reveal delay={120}><h1 className="ld-hero-title" style={{ fontSize:76,fontWeight:800,color:C.text,letterSpacing:'-1.8px',lineHeight:1.05,margin:'0 0 18px',maxWidth:880 }}>Decision-grade research.<br /><span style={{ background:'linear-gradient(90deg, #4ade80, #86efac, #4ade80)',backgroundSize:'200% 100%',WebkitBackgroundClip:'text',backgroundClip:'text',color:'transparent',animation:'shimmer-text 6s ease-in-out infinite' }}>For retail investors.</span></h1></Reveal>
          <Reveal delay={220}><p className="ld-hero-sub" style={{ fontSize:17,color:C.text2,lineHeight:1.6,maxWidth:620,margin:'0 0 36px' }}>Smart Price Bands. 8-parameter Scorecards. News-driven Notable Events. 81-filter Custom Screener. Portfolio Insights. <strong style={{ color:C.text }}>All free.</strong></p></Reveal>
          <Reveal delay={320}>
            <div className="ld-cta-row" style={{ display:'flex',gap:12,marginBottom:56,flexWrap:'wrap' }}>
              <button onClick={openNotify} className="ld-cta" style={{ padding:'13px 26px',background:C.green,color:'#0a0a0a',borderRadius:10,fontSize:15,fontWeight:700,border:'none',cursor:'pointer',display:'inline-flex',alignItems:'center',gap:8 }}>Join the waitlist →</button>
              <a href="#first-feature" className="ld-cta" style={{ padding:'13px 26px',background:'rgba(255,255,255,0.04)',color:C.text,border:`1px solid ${C.border2}`,borderRadius:10,fontSize:15,fontWeight:600,textDecoration:'none',display:'inline-flex',alignItems:'center',gap:8 }}>See what&apos;s coming ↓</a>
            </div>
          </Reveal>
          <Reveal delay={420}>
            <div style={{ padding:'10px 0',borderTop:`1px solid ${C.border}`,borderBottom:`1px solid ${C.border}`,overflow:'hidden',position:'relative',maskImage:'linear-gradient(90deg, transparent, black 8%, black 92%, transparent)',WebkitMaskImage:'linear-gradient(90deg, transparent, black 8%, black 92%, transparent)' }}>
              <div style={{ display:'flex',gap:36,whiteSpace:'nowrap',animation:'ticker-scroll 60s linear infinite',width:'max-content' }}>
                {[...indices,...indices].map((i,k)=>(<span key={k} style={{ fontSize:12,...mono,color:C.text2 }}><span style={{ color:C.text3,marginRight:8 }}>{i.name}</span>{i.last}{' '}<span style={{ color:i.up?C.green:C.red,fontWeight:700 }}>{i.chg}</span></span>))}
              </div>
            </div>
          </Reveal>
        </div>
        <div style={{ position:'absolute',bottom:28,left:'50%',transform:'translateX(-50%)',zIndex:2,fontSize:11,color:C.text3,...mono,letterSpacing:'0.16em',animation:'pulse-cue 2.4s ease-in-out infinite' }}>↓ SCROLL</div>
      </section>

      <div id="first-feature" />

      <StockDetailShowcase />
      <AlertsSection />

      <FeatureRow eyebrow="for the deep-divers" title="Custom Screener · 81 filters." subtitle="Build your own screen across valuation, growth, profitability, technicals, shareholding."
        body={<><p>Stack any filters across 81 fields. Templates for Buffett-style, Peter Lynch growth, Deep Value, Momentum. Save up to 3 of your own. Click any name to dive into the full stock detail.</p></>}
        cta={{ href:'/screens/custom',label:'Try the screener →' }} visual={<ScreenerTerminal />} flipped={false} />

      <MutualFundsSection />
      <ETFSection />
      <PortfolioXRay />
      <GlobalMarketsSection />

      {/* ATLAS — scroll-driven pinned bubble + burst → content */}
      <AtlasSection />

      {/* COVERAGE */}
      <section className="ld-section" style={{ padding:'100px 24px',background:C.bg }}>
        <div style={{ maxWidth:1100,margin:'0 auto' }}>
          <Reveal><div style={{ fontSize:11,color:C.text3,...mono,letterSpacing:'0.12em',fontWeight:700,marginBottom:14,textTransform:'uppercase',textAlign:'center' }}>what&apos;s covered</div></Reveal>
          <Reveal delay={80}><h2 className="ld-section-title" style={{ fontSize:42,fontWeight:800,color:C.text,letterSpacing:'-1px',lineHeight:1.15,margin:'0 0 56px',textAlign:'center',maxWidth:800,marginLeft:'auto',marginRight:'auto' }}>Everything an Indian investor cares about.</h2></Reveal>
          <div className="ld-coverage" style={{ display:'grid',gridTemplateColumns:'repeat(4, 1fr)',gap:22 }}>
            {[{v:5400,suf:'+',label:'Indian Stocks'},{v:2000,suf:'+',label:'Mutual Funds'},{v:320,suf:'+',label:'Indian ETFs'},{v:11000,suf:'+',label:'US Stocks & ETFs'}].map((c,i)=>(
              <Reveal key={c.label} delay={140+i*80}><div style={{ textAlign:'center',padding:'20px 12px' }}><div className="ld-coverage-num" style={{ fontSize:56,fontWeight:800,color:C.green,...mono,letterSpacing:'-2px',lineHeight:1,marginBottom:8 }}><CountUp to={c.v} suffix={c.suf} /></div><div style={{ fontSize:13,color:C.text2,fontWeight:600 }}>{c.label}</div></div></Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* LEARN — replaced with LearnSection from LearnAndFuture.js */}
      <LearnSection />

      {/* FINAL CTA — replaced with FutureSection from LearnAndFuture.js */}
      <FutureSection />

      {/* Notify modal */}
      {notifyOpen && (
        <div onClick={()=>setNotifyOpen(false)} style={{
          position:'fixed', inset:0, zIndex:1000,
          background:'rgba(0,0,0,0.78)', backdropFilter:'blur(8px)',
          display:'flex', alignItems:'center', justifyContent:'center', padding:24,
          animation:'notifyFadeIn 0.18s ease',
        }}>
          <div onClick={e=>e.stopPropagation()} style={{
            width:'100%', maxWidth:440,
            background:`linear-gradient(160deg, ${C.bg2}, ${C.bg3})`,
            border:`1px solid ${C.border2}`, borderRadius:16,
            padding:'32px 30px 28px', position:'relative',
            boxShadow:'0 30px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(74,222,128,0.10)',
          }}>
            <button onClick={()=>setNotifyOpen(false)} aria-label="Close" style={{
              position:'absolute', top:14, right:14,
              width:28, height:28, borderRadius:8,
              background:'rgba(255,255,255,0.04)', border:`1px solid ${C.border}`,
              color:C.text3, cursor:'pointer', fontSize:14, lineHeight:1,
              display:'flex', alignItems:'center', justifyContent:'center',
            }}>×</button>

            <div style={{
              display:'inline-flex', alignItems:'center', gap:6,
              padding:'4px 10px', borderRadius:999,
              background:'rgba(251,191,36,0.10)', border:'1px solid rgba(251,191,36,0.28)',
              ...mono, fontSize:9, color:C.amber, letterSpacing:'0.12em', textTransform:'uppercase', fontWeight:700,
              marginBottom:14,
            }}>
              <span style={{ width:5, height:5, borderRadius:'50%', background:C.amber, boxShadow:`0 0 6px ${C.amber}`, animation:'pulse 1.8s ease-in-out infinite' }}/>
              Coming Soon
            </div>
            <div style={{ fontSize:22, fontWeight:800, color:C.text, letterSpacing:'-0.5px', lineHeight:1.2, marginBottom:8 }}>
              Get on the waitlist.
            </div>
            <div style={{ fontSize:13, color:C.text2, lineHeight:1.6, marginBottom:20 }}>
              We&apos;ll email you the moment stokradar goes live — and again when the next batch of features ships.
            </div>
            <NotifyForm />
          </div>
        </div>
      )}

      <style>{`
        @keyframes notifyFadeIn { from { opacity:0 } to { opacity:1 } }
      `}</style>

    </div>
    </NotifyCtx.Provider>
  )
}
