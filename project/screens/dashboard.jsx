/* global React, Icon, Card, KPI, LineChart, BarChart, Ring, Sparkline, genWave, useTick */
// 调度总览大屏
(() => {
const { useState, useEffect, useMemo } = React;

function DashboardScreen() {
  const tick = useTick(3000);
  // 实时负荷数据 (24点小时)
  const loadData = useMemo(() => genWave(24, 1850, 380, -1, 0.06), [tick]);
  const forecastData = useMemo(() => genWave(24, 1900, 400, -1, 0.05), []);
  const labels = Array.from({length:24}, (_, i) => String(i).padStart(2,'0')+':00');

  return (
    <div className="dashboard-screen fade-in" style={{display:'grid', gridTemplateColumns:'280px 1fr 320px', gap:16, height:'100%'}}>
      {/* 左侧 KPI 列 */}
      <div style={{display:'flex', flexDirection:'column', gap:12}}>
        <KPI label="总负荷" value={(2034 + (tick % 5) * 4).toFixed(0)} unit="MW"
             delta={3.2} deltaLabel="同比" color="var(--primary)"
             sparkData={loadData.slice(-12)} status="正常"/>
        <KPI label="发电出力" value={(2142 + (tick % 3) * 3).toFixed(0)} unit="MW"
             delta={1.8} deltaLabel="环比" color="var(--info)"
             sparkData={genWave(12, 2100, 80, 0)}/>
        <KPI label="新能源占比" value="34.6" unit="%"
             delta={5.1} deltaLabel="同比" color="var(--success)"
             sparkData={genWave(12, 32, 5, 0)}/>
        <KPI label="网损率" value="3.82" unit="%"
             delta={-0.4} deltaLabel="环比" color="var(--warning)"
             sparkData={genWave(12, 3.8, 0.3, 0)}/>
        <KPI label="频率" value="50.02" unit="Hz"
             color="var(--teal)" status="稳定"/>

        <Card title="系统稳定性" headerless noPad style={{flex:1, padding:'16px 18px'}}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12}}>
            <div>
              <div className="text-3 text-xs" style={{letterSpacing:2}}>SYSTEM STABILITY</div>
              <div style={{fontSize:13, marginTop:4, color:'var(--text-1)'}}>稳定指数</div>
            </div>
            <span className="chip success dot">优秀</span>
          </div>
          <div style={{display:'flex', justifyContent:'center', padding:'8px 0'}}>
            <Ring percent={94} value="94" label="综合得分" subLabel="100分制" color="var(--success)" size={140}/>
          </div>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginTop:8, fontSize:11}}>
            <div className="flex" style={{justifyContent:'space-between'}}>
              <span className="text-3">电压合格率</span><b>99.8%</b>
            </div>
            <div className="flex" style={{justifyContent:'space-between'}}>
              <span className="text-3">频率合格率</span><b>100%</b>
            </div>
            <div className="flex" style={{justifyContent:'space-between'}}>
              <span className="text-3">供电可靠率</span><b>99.96%</b>
            </div>
            <div className="flex" style={{justifyContent:'space-between'}}>
              <span className="text-3">负荷率</span><b>72.3%</b>
            </div>
          </div>
        </Card>
      </div>

      {/* 中部 拓扑图 + 负荷曲线 */}
      <div style={{display:'flex', flexDirection:'column', gap:12, minWidth:0}}>
        <Card title="电网实时拓扑" tag="500kV / 220kV" live
              actions={<>
                <button className="btn sm ghost"><Icon name="filter" size={13}/> 筛选</button>
                <button className="btn sm ghost"><Icon name="expand" size={13}/></button>
              </>}
              glow noPad style={{flex: '1 1 0', minHeight:0}}>
          <GridTopology tick={tick}/>
        </Card>
        <Card title="实时负荷曲线" tag="24H" live
              actions={<>
                <span className="chip"><span style={{width:8,height:2,background:'var(--primary)',display:'inline-block',marginRight:4}}/>实际负荷</span>
                <span className="chip"><span style={{width:8,height:2,background:'var(--warning)',display:'inline-block',marginRight:4, opacity:0.8}}/>预测负荷</span>
              </>}
              style={{flexShrink:0}}>
          <LineChart
            height={180}
            labels={labels}
            yUnit="MW"
            series={[
              { name: '实际负荷', data: loadData, color: '#0A6CFF', glow: true },
              { name: '预测负荷', data: forecastData, color: '#FFAB2D', dashed: true, area: false },
            ]}/>
        </Card>
      </div>

      {/* 右侧 告警 + 区域负荷 + 新能源 */}
      <div style={{display:'flex', flexDirection:'column', gap:12, minWidth:0}}>
        <Card title="实时告警" tag="LIVE" live
              actions={<button className="btn sm ghost">查看全部 <Icon name="chevron" size={11}/></button>}>
          <div style={{display:'flex', flexDirection:'column', gap:8}}>
            {ALERTS.map((a, i) => (
              <div key={i} style={{
                display:'flex', gap:10, padding:'10px',
                background:'var(--bg-elevated)',
                borderRadius:'var(--r-md)',
                borderLeft:`3px solid var(--${a.level === 'high' ? 'danger' : a.level === 'mid' ? 'warning' : 'info'})`,
              }}>
                <div style={{flex:1, minWidth:0}}>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline', gap:8}}>
                    <b style={{fontSize:12}}>{a.title}</b>
                    <span className="text-mute text-xs" style={{flexShrink:0}}>{a.time}</span>
                  </div>
                  <div className="text-3" style={{fontSize:11, marginTop:3, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{a.loc}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="区域负荷分布" tag="MW">
          <div style={{display:'flex', flexDirection:'column', gap:10}}>
            {AREAS.map((a, i) => (
              <div key={i}>
                <div style={{display:'flex', justifyContent:'space-between', marginBottom:4, fontSize:12}}>
                  <span>{a.name}</span>
                  <span className="text-digit"><b>{a.load}</b> <span className="text-3 text-xs">/{a.cap}</span></span>
                </div>
                <div style={{height:6, background:'var(--bg-elevated)', borderRadius:3, overflow:'hidden'}}>
                  <div style={{
                    width: `${a.load/a.cap*100}%`,
                    height:'100%',
                    background:`linear-gradient(90deg, var(--primary), ${a.load/a.cap > 0.85 ? 'var(--warning)' : 'var(--info)'})`,
                    boxShadow:'0 0 6px var(--primary-glow)',
                  }}/>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="新能源出力" tag="清洁能源">
          <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, textAlign:'center'}}>
            <RenewableMini icon="solar" label="光伏" value={485} unit="MW" color="var(--warning)"/>
            <RenewableMini icon="wind" label="风电" value={262} unit="MW" color="var(--info)"/>
            <RenewableMini icon="battery" label="储能" value={148} unit="MW" color="var(--success)"/>
          </div>
        </Card>
      </div>
    </div>
  );
}

const ALERTS = [
  { level: 'high', title: '#220kV 滨海线 过载告警', loc: '滨海变电站 · 14:32:08', time: '2 分钟前' },
  { level: 'mid', title: '主变压器 #3 油温偏高', loc: '东郊变电站 · 14:28:41', time: '6 分钟前' },
  { level: 'low', title: '光伏 12# 逆变器通讯中断', loc: '海滨光伏电站 · 14:21:33', time: '13 分钟前' },
  { level: 'mid', title: '配电柜湿度异常', loc: '工业园 3#开关站', time: '21 分钟前' },
];

const AREAS = [
  { name: '中心城区', load: 542, cap: 720 },
  { name: '东部新城', load: 386, cap: 480 },
  { name: '滨海开发区', load: 298, cap: 320 },
  { name: '北部产业园', load: 412, cap: 580 },
  { name: '西部新区', load: 196, cap: 280 },
];

function RenewableMini({ icon, label, value, unit, color }) {
  return (
    <div style={{padding:'10px 8px', background:'var(--bg-elevated)', borderRadius:'var(--r-md)'}}>
      <div style={{display:'flex', alignItems:'center', justifyContent:'center', gap:6, marginBottom:6, color}}>
        <Icon name={icon} size={16}/>
        <span style={{fontSize:11, color:'var(--text-2)'}}>{label}</span>
      </div>
      <div className="text-digit" style={{fontSize:22, color:'var(--text-1)'}}>{value}</div>
      <div className="text-3 text-xs">{unit}</div>
    </div>
  );
}

/* ============= 电网拓扑图 ============= */
function GridTopology({ tick }) {
  // 5个变电站 + 节点连接
  // 布局: 中心一个500kV枢纽,周围4个220kV变电站
  const stations = [
    { id: 's1', x: 50, y: 50, name: '中心枢纽', kv: '500kV', load: 1820, status: 'normal', major: true },
    { id: 's2', x: 18, y: 22, name: '北郊变', kv: '220kV', load: 286, status: 'normal' },
    { id: 's3', x: 82, y: 22, name: '东郊变', kv: '220kV', load: 412, status: 'warning' },
    { id: 's4', x: 18, y: 78, name: '西郊变', kv: '220kV', load: 195, status: 'normal' },
    { id: 's5', x: 82, y: 78, name: '滨海变', kv: '220kV', load: 524, status: 'danger' },
    { id: 's6', x: 50, y: 12, name: '滨江发电厂', kv: '电源', load: 850, status: 'normal', src: true },
    { id: 's7', x: 50, y: 88, name: '光伏基地', kv: '清洁', load: 485, status: 'normal', src: true },
  ];

  const lines = [
    ['s1', 's2'], ['s1', 's3'], ['s1', 's4'], ['s1', 's5'],
    ['s1', 's6'], ['s1', 's7'], ['s2', 's3'], ['s4', 's5'],
  ];

  const [sel, setSel] = useState('s1');
  const selStation = stations.find(s => s.id === sel);

  return (
    <div style={{position:'relative', width:'100%', height:'100%', minHeight: 320}} className="grid-bg">
      <svg style={{position:'absolute', inset:0, width:'100%', height:'100%'}} viewBox="0 0 100 100" preserveAspectRatio="none">
        {/* Lines */}
        {lines.map(([a, b], i) => {
          const sa = stations.find(s => s.id === a);
          const sb = stations.find(s => s.id === b);
          const danger = sa.status === 'danger' || sb.status === 'danger';
          const warn = sa.status === 'warning' || sb.status === 'warning';
          const color = danger ? 'var(--danger)' : warn ? 'var(--warning)' : 'var(--primary)';
          return (
            <g key={i}>
              <line x1={sa.x} y1={sa.y} x2={sb.x} y2={sb.y}
                    stroke={color} strokeWidth="0.4" opacity="0.4" vectorEffect="non-scaling-stroke"/>
              <line x1={sa.x} y1={sa.y} x2={sb.x} y2={sb.y}
                    stroke={color} strokeWidth="0.5"
                    strokeDasharray="1 1.2"
                    className="flow-line"
                    vectorEffect="non-scaling-stroke"
                    style={{filter:`drop-shadow(0 0 2px ${color})`}}/>
            </g>
          );
        })}
      </svg>

      {/* Stations */}
      {stations.map(s => {
        const colorMap = { normal: 'var(--primary)', warning: 'var(--warning)', danger: 'var(--danger)' };
        const color = s.src ? 'var(--teal)' : colorMap[s.status];
        const size = s.major ? 56 : s.src ? 40 : 44;
        return (
          <div key={s.id}
               onClick={() => setSel(s.id)}
               style={{
                 position:'absolute',
                 left:`${s.x}%`, top:`${s.y}%`,
                 transform:'translate(-50%,-50%)',
                 cursor:'pointer',
                 textAlign:'center',
                 zIndex: sel === s.id ? 10 : 2,
               }}>
            <div style={{
              width:size, height:size, borderRadius: s.src ? '8px' : '50%',
              background: `radial-gradient(circle, ${color}, transparent 70%)`,
              border: `2px solid ${color}`,
              boxShadow: `0 0 ${sel === s.id ? 20 : 10}px ${color}`,
              display:'grid', placeItems:'center',
              transition:'all .2s',
              transform: sel === s.id ? 'scale(1.15)' : 'scale(1)',
              backgroundColor: 'rgba(8, 17, 31, 0.8)',
            }}>
              <Icon name={s.src ? (s.name.includes('光伏') ? 'solar' : 'power') : 'zap'} size={s.major ? 22 : 16} style={{color}}/>
              {s.status === 'danger' && (
                <span style={{
                  position:'absolute', top:-3, right:-3, width:12, height:12, borderRadius:'50%',
                  background:'var(--danger)', boxShadow:'0 0 8px var(--danger)',
                  animation:'pulse 1s infinite',
                }}/>
              )}
            </div>
            <div style={{
              marginTop:6, fontSize:11, color:'var(--text-1)',
              textShadow:'0 0 6px rgba(0,0,0,0.8)',
              whiteSpace:'nowrap',
            }}>
              <b>{s.name}</b>
              <div className="text-3 text-xs" style={{marginTop:1}}>{s.kv} · {s.load}MW</div>
            </div>
          </div>
        );
      })}

      {/* 节点详情面板 */}
      {selStation && (
        <div style={{
          position:'absolute', left:16, top:16,
          background:'rgba(8, 17, 31, 0.92)',
          border:'1px solid var(--primary-border)',
          borderRadius:'var(--r-md)',
          padding:'10px 12px',
          minWidth: 200,
          backdropFilter:'blur(10px)',
        }}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            <b>{selStation.name}</b>
            <span className={`status-pill ${selStation.status}`}>
              {selStation.status === 'normal' ? '正常' : selStation.status === 'warning' ? '预警' : '告警'}
            </span>
          </div>
          <div className="text-3 text-xs" style={{marginTop:4}}>{selStation.kv} · #{selStation.id.toUpperCase()}</div>
          <div className="divider"/>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, fontSize:11}}>
            <div><div className="text-mute">当前负载</div><b className="text-digit" style={{fontSize:16}}>{selStation.load}MW</b></div>
            <div><div className="text-mute">负载率</div><b className="text-digit" style={{fontSize:16}}>{Math.round(selStation.load/600*100)}%</b></div>
            <div><div className="text-mute">电压</div><b className="text-digit" style={{fontSize:16}}>{selStation.kv.includes('500') ? '525.4' : '231.2'}kV</b></div>
            <div><div className="text-mute">电流</div><b className="text-digit" style={{fontSize:16}}>{Math.round(selStation.load * 4.2)}A</b></div>
          </div>
        </div>
      )}

      {/* 图例 */}
      <div style={{
        position:'absolute', right:16, bottom:16,
        background:'rgba(8, 17, 31, 0.7)',
        border:'1px solid var(--border)',
        borderRadius:'var(--r-md)',
        padding:'8px 12px',
        fontSize: 11,
        display:'flex', gap:14,
        backdropFilter:'blur(10px)',
      }}>
        <span style={{display:'inline-flex', alignItems:'center', gap:5}}><span style={{width:8,height:8,borderRadius:'50%',background:'var(--primary)',boxShadow:'0 0 4px var(--primary)'}}/>正常</span>
        <span style={{display:'inline-flex', alignItems:'center', gap:5}}><span style={{width:8,height:8,borderRadius:'50%',background:'var(--warning)',boxShadow:'0 0 4px var(--warning)'}}/>预警</span>
        <span style={{display:'inline-flex', alignItems:'center', gap:5}}><span style={{width:8,height:8,borderRadius:'50%',background:'var(--danger)',boxShadow:'0 0 4px var(--danger)'}}/>告警</span>
        <span style={{display:'inline-flex', alignItems:'center', gap:5}}><span style={{width:10,height:8,borderRadius:'2px',background:'var(--teal)',boxShadow:'0 0 4px var(--teal)'}}/>电源</span>
      </div>
    </div>
  );
}

window.DashboardScreen = DashboardScreen;
})();
