/* global React, Icon */
// 共享组件: Sidebar, Topbar, KPI, Card, Charts (sparkline, line, ring, bar)
(() => {
const { useState, useEffect, useRef, useMemo } = React;

/* ============= 侧边栏 ============= */
const NAV = [
  { section: '运营监控' },
  { id: 'dashboard', label: '调度总览', icon: 'dashboard' },
  { id: 'devices', label: '设备管理', icon: 'device' },
  { id: 'load', label: '负荷预测', icon: 'load' },
  { section: '运维管理' },
  { id: 'alerts', label: '告警事件', icon: 'alert', badge: 7 },
  { id: 'tickets', label: '运维工单', icon: 'ticket' },
  { section: '数据分析' },
  { id: 'energy', label: '能耗报表', icon: 'report' },
  { id: 'renewable', label: '新能源接入', icon: 'solar' },
];

function Sidebar({ active, onChange }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="logo">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="currentColor" fillOpacity="0.2"/>
          </svg>
        </div>
        <div>
          <h1>电力调度</h1>
          <div className="sub">POWER · GRID · OS</div>
        </div>
      </div>
      <nav className="nav">
        {NAV.map((n, i) => n.section ? (
          <div key={i} className="nav-section">{n.section}</div>
        ) : (
          <div key={n.id}
               className={`nav-item ${active === n.id ? 'active' : ''}`}
               onClick={() => onChange(n.id)}>
            <Icon name={n.icon} className="icon" size={17} />
            <span>{n.label}</span>
            {n.badge ? <span className="badge">{n.badge}</span> : null}
          </div>
        ))}
      </nav>
      <div className="sidebar-user">
        <div className="avatar">张</div>
        <div className="user-info">
          <div className="name">张志远</div>
          <div className="role">主调度员 · D-401</div>
        </div>
      </div>
    </aside>
  );
}

/* ============= 顶栏 ============= */
const CRUMBS = {
  dashboard: ['运营监控', '调度总览大屏'],
  devices: ['运营监控', '设备管理'],
  load: ['运营监控', '负荷预测与分析'],
  alerts: ['运维管理', '告警事件中心'],
  tickets: ['运维管理', '运维工单'],
  energy: ['数据分析', '能耗统计报表'],
  renewable: ['数据分析', '新能源接入'],
};

function Topbar({ active }) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const crumb = CRUMBS[active] || [];
  const time = now.toTimeString().slice(0, 8);
  const date = `${now.getFullYear()}.${String(now.getMonth()+1).padStart(2,'0')}.${String(now.getDate()).padStart(2,'0')}`;
  const week = ['周日','周一','周二','周三','周四','周五','周六'][now.getDay()];

  return (
    <header className="topbar">
      <div className="crumb">
        <span className="text-3">{crumb[0]}</span>
        <span className="text-mute" style={{margin:'0 8px'}}>/</span>
        <b>{crumb[1]}</b>
      </div>
      <span className="env-tag">PROD · 华东区</span>
      <div className="clock">
        <span className="status-pill normal">系统正常</span>
        <span>{date} {week}</span>
        <span className="time">{time}</span>
        <div className="v-divider" style={{height:20}} />
        <button className="icon-btn"><Icon name="refresh" size={16}/></button>
        <button className="icon-btn"><Icon name="bell" size={16}/><span className="dot"/></button>
        <button className="icon-btn"><Icon name="settings" size={16}/></button>
      </div>
    </header>
  );
}

/* ============= Card ============= */
function Card({ title, tag, live, actions, children, glow, className = '', noPad, headerless, style }) {
  return (
    <div className={`card ${glow ? 'glow' : ''} ${className}`} style={style}>
      {glow && <div className="card-decoration"/>}
      {!headerless && (
        <div className="card-header">
          <h3>{title}</h3>
          {tag && <span className="tag">{tag}</span>}
          {live && <span className="live-dot">实时</span>}
          {actions && <div className="actions">{actions}</div>}
        </div>
      )}
      <div className={noPad ? '' : 'card-body'}>{children}</div>
    </div>
  );
}

/* ============= KPI ============= */
function KPI({ label, value, unit, delta, deltaLabel, color = 'var(--primary)', sparkData, status }) {
  const isUp = delta != null && delta >= 0;
  return (
    <div className="kpi" style={{ '--accent': color }}>
      <div className="label">{label}</div>
      <div className="value">
        {value}
        {unit && <span className="unit">{unit}</span>}
      </div>
      <div className="meta">
        {delta != null && (
          <span className={`delta ${isUp ? 'up' : 'down'}`}>
            <Icon name={isUp ? 'trending' : 'trendingDown'} size={11}/>
            {isUp ? '+' : ''}{delta}% {deltaLabel}
          </span>
        )}
        {status && <span className="chip dot" style={{color}}>{status}</span>}
      </div>
      {sparkData && <Sparkline data={sparkData} color={color} width={80} height={28} className="spark"/>}
    </div>
  );
}

/* ============= Charts ============= */
// Sparkline
function Sparkline({ data, color = 'var(--primary)', width = 80, height = 28, className, style }) {
  const max = Math.max(...data), min = Math.min(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * height * 0.85 - height * 0.075;
    return [x, y];
  });
  const path = points.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join('');
  const area = `${path} L${width},${height} L0,${height} Z`;
  const id = useMemo(() => 'sp' + Math.random().toString(36).slice(2, 8), []);
  return (
    <svg width={width} height={height} className={className} style={style}>
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`}/>
      <path d={path} fill="none" stroke={color} strokeWidth="1.5"/>
    </svg>
  );
}

// 折线图 (多系列, 网格, 提示线)
function LineChart({ series, labels, height = 220, yUnit = '', smooth = true, area = true, yMax: yMaxProp, showGrid = true }) {
  const [hover, setHover] = useState(null);
  const padL = 44, padR = 16, padT = 16, padB = 28;
  const W = 800, H = height;
  const allVals = series.flatMap(s => s.data);
  const yMax = yMaxProp || Math.ceil(Math.max(...allVals) * 1.1 / 50) * 50;
  const yMin = 0;
  const n = labels.length;
  const xAt = i => padL + (i / (n - 1)) * (W - padL - padR);
  const yAt = v => padT + (1 - (v - yMin) / (yMax - yMin)) * (H - padT - padB);

  const buildPath = (data, smoothed) => {
    if (!smoothed) {
      return data.map((v, i) => `${i ? 'L' : 'M'}${xAt(i).toFixed(1)},${yAt(v).toFixed(1)}`).join(' ');
    }
    let d = `M${xAt(0)},${yAt(data[0])}`;
    for (let i = 1; i < data.length; i++) {
      const x0 = xAt(i - 1), y0 = yAt(data[i - 1]);
      const x1 = xAt(i), y1 = yAt(data[i]);
      const cx1 = x0 + (x1 - x0) / 2, cy1 = y0;
      const cx2 = x0 + (x1 - x0) / 2, cy2 = y1;
      d += ` C${cx1},${cy1} ${cx2},${cy2} ${x1},${y1}`;
    }
    return d;
  };

  const yTicks = 4;
  const ticks = Array.from({length: yTicks + 1}, (_, i) => Math.round(yMin + (yMax - yMin) * i / yTicks));

  const handleMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width * W;
    const idx = Math.round((x - padL) / (W - padL - padR) * (n - 1));
    if (idx >= 0 && idx < n) setHover(idx);
  };

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none"
           onMouseMove={handleMove} onMouseLeave={() => setHover(null)}>
        {showGrid && ticks.map((t, i) => {
          const y = yAt(t);
          return (
            <g key={i}>
              <line x1={padL} x2={W - padR} y1={y} y2={y} stroke="var(--border)" strokeDasharray="2 4"/>
              <text x={padL - 8} y={y + 4} fontSize="10" fill="var(--text-3)" textAnchor="end">{t}{yUnit}</text>
            </g>
          );
        })}
        {labels.map((l, i) => {
          if (i % Math.max(1, Math.floor(n / 8)) !== 0 && i !== n - 1) return null;
          return <text key={i} x={xAt(i)} y={H - padB + 16} fontSize="10" fill="var(--text-3)" textAnchor="middle">{l}</text>;
        })}
        {series.map((s, si) => {
          const p = buildPath(s.data, smooth);
          const areaP = `${p} L${xAt(s.data.length - 1)},${H - padB} L${padL},${H - padB} Z`;
          const id = `lc-${si}-${Math.random().toString(36).slice(2,6)}`;
          return (
            <g key={si}>
              {area && (
                <>
                  <defs>
                    <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor={s.color} stopOpacity={s.dashed ? 0 : 0.32}/>
                      <stop offset="100%" stopColor={s.color} stopOpacity="0"/>
                    </linearGradient>
                  </defs>
                  <path d={areaP} fill={`url(#${id})`}/>
                </>
              )}
              <path d={p} fill="none" stroke={s.color} strokeWidth="2"
                    strokeDasharray={s.dashed ? '4 4' : undefined}
                    style={{filter: s.glow ? `drop-shadow(0 0 4px ${s.color})` : undefined}}/>
            </g>
          );
        })}
        {hover != null && (
          <g>
            <line x1={xAt(hover)} x2={xAt(hover)} y1={padT} y2={H - padB} stroke="var(--primary)" strokeDasharray="2 3" strokeWidth="1"/>
            {series.map((s, si) => (
              <circle key={si} cx={xAt(hover)} cy={yAt(s.data[hover])} r="4" fill={s.color} stroke="var(--bg-card)" strokeWidth="2"/>
            ))}
          </g>
        )}
      </svg>
      {hover != null && (
        <div style={{
          position: 'absolute',
          left: `${(xAt(hover) / W) * 100}%`,
          top: 8,
          transform: 'translateX(8px)',
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-strong)',
          borderRadius: 6,
          padding: '8px 10px',
          fontSize: 11,
          pointerEvents: 'none',
          minWidth: 120,
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        }}>
          <div className="text-3" style={{marginBottom:4}}>{labels[hover]}</div>
          {series.map((s, si) => (
            <div key={si} style={{display:'flex',justifyContent:'space-between',gap:8}}>
              <span style={{display:'inline-flex',alignItems:'center',gap:5}}>
                <span style={{width:8,height:2,background:s.color,borderRadius:1}}/>
                {s.name}
              </span>
              <b className="text-digit">{s.data[hover]}{yUnit}</b>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// 柱状图
function BarChart({ data, labels, color = 'var(--primary)', height = 180, yUnit = '' }) {
  const padL = 36, padR = 8, padT = 12, padB = 24;
  const W = 600, H = height;
  const max = Math.ceil(Math.max(...data) * 1.15 / 100) * 100 || 100;
  const xAt = i => padL + (i + 0.5) / data.length * (W - padL - padR);
  const yAt = v => padT + (1 - v / max) * (H - padT - padB);
  const bw = (W - padL - padR) / data.length * 0.55;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map(t => Math.round(max * t));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H}>
      {ticks.map((t,i) => (
        <g key={i}>
          <line x1={padL} x2={W-padR} y1={yAt(t)} y2={yAt(t)} stroke="var(--border)" strokeDasharray="2 4"/>
          <text x={padL-6} y={yAt(t)+4} fontSize="10" fill="var(--text-3)" textAnchor="end">{t}{yUnit}</text>
        </g>
      ))}
      {data.map((v, i) => {
        const h = (H - padT - padB) * v / max;
        const gid = `bg-${i}-${Math.random().toString(36).slice(2,6)}`;
        return (
          <g key={i}>
            <defs>
              <linearGradient id={gid} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity="0.95"/>
                <stop offset="100%" stopColor={color} stopOpacity="0.25"/>
              </linearGradient>
            </defs>
            <rect x={xAt(i)-bw/2} y={yAt(v)} width={bw} height={h} fill={`url(#${gid})`} rx={2}/>
            <text x={xAt(i)} y={H-padB+15} fontSize="10" fill="var(--text-3)" textAnchor="middle">{labels[i]}</text>
          </g>
        );
      })}
    </svg>
  );
}

// 环形进度图
function Ring({ percent, label, value, size = 120, color = 'var(--primary)', thickness = 8, subLabel }) {
  const r = (size - thickness) / 2;
  const C = 2 * Math.PI * r;
  const offset = C * (1 - percent / 100);
  return (
    <div style={{position:'relative', width: size, height: size, display:'inline-block'}}>
      <svg width={size} height={size} style={{transform:'rotate(-90deg)'}}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--border)" strokeWidth={thickness}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={thickness}
                strokeDasharray={C} strokeDashoffset={offset} strokeLinecap="round"
                style={{transition:'stroke-dashoffset .6s ease', filter: `drop-shadow(0 0 6px ${color})`}}/>
      </svg>
      <div style={{position:'absolute', inset:0, display:'grid', placeItems:'center', textAlign:'center'}}>
        <div>
          <div className="text-digit" style={{fontSize: size*0.22, color: 'var(--text-1)'}}>{value ?? percent}</div>
          {label && <div className="text-3" style={{fontSize:11, marginTop:2}}>{label}</div>}
          {subLabel && <div className="text-mute" style={{fontSize:10, marginTop:1}}>{subLabel}</div>}
        </div>
      </div>
    </div>
  );
}

// 半圆仪表盘
function Gauge({ percent, label, value, color = 'var(--primary)', size = 160 }) {
  const r = 60, cx = size/2, cy = size*0.7;
  const startAngle = -180, endAngle = 0;
  const angle = startAngle + (endAngle - startAngle) * (percent / 100);
  const polar = (a) => {
    const rad = (a * Math.PI) / 180;
    return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
  };
  const arc = (a1, a2) => {
    const [x1, y1] = polar(a1), [x2, y2] = polar(a2);
    const large = a2 - a1 > 180 ? 1 : 0;
    return `M${x1},${y1} A${r},${r} 0 ${large} 1 ${x2},${y2}`;
  };
  return (
    <div style={{position:'relative', width:size, height: size*0.75}}>
      <svg viewBox={`0 0 ${size} ${size*0.75}`} width="100%" height="100%">
        <path d={arc(startAngle, endAngle)} fill="none" stroke="var(--border)" strokeWidth="10" strokeLinecap="round"/>
        <path d={arc(startAngle, angle)} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
              style={{filter: `drop-shadow(0 0 6px ${color})`}}/>
      </svg>
      <div style={{position:'absolute', inset:0, display:'grid', placeItems:'center', textAlign:'center', paddingTop:14}}>
        <div>
          <div className="text-digit" style={{fontSize:24, color:'var(--text-1)'}}>{value ?? percent + '%'}</div>
          {label && <div className="text-3" style={{fontSize:11, marginTop:2}}>{label}</div>}
        </div>
      </div>
    </div>
  );
}

// 数据模拟工具
function genWave(n, base, amp, phase = 0, noise = 0.1) {
  return Array.from({length: n}, (_, i) => {
    const x = (i / n) * Math.PI * 2 + phase;
    return Math.round(base + Math.sin(x) * amp + (Math.random() - 0.5) * amp * noise);
  });
}

function useTick(interval = 2000) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick(x => x + 1), interval);
    return () => clearInterval(t);
  }, [interval]);
  return tick;
}

Object.assign(window, {
  Sidebar, Topbar, Card, KPI,
  Sparkline, LineChart, BarChart, Ring, Gauge,
  genWave, useTick, NAV, CRUMBS,
});
})();
