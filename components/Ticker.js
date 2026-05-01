'use client';

const FALLBACK_INDICES = [
  { name: 'NIFTY 50',   change: '+0.84%', up: true  },
  { name: 'SENSEX',     change: '+0.71%', up: true  },
  { name: 'BANK NIFTY', change: '-0.32%', up: false },
  { name: 'S&P 500',    change: '+1.12%', up: true  },
  { name: 'NASDAQ',     change: '+1.43%', up: true  },
  { name: 'DOW JONES',  change: '-0.18%', up: false },
  { name: 'FTSE 100',   change: '-0.75%', up: false },
  { name: 'DAX',        change: '-0.11%', up: false },
  { name: 'NIKKEI 225', change: '+0.91%', up: true  },
  { name: 'HANG SENG',  change: '+0.24%', up: true  },
];

export default function Ticker() {
  const doubled = [...FALLBACK_INDICES, ...FALLBACK_INDICES];
  return (
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
  );
}
