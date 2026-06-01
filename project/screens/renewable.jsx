/* global React, Icon, Card, KPI, LineChart, Ring, genWave, useTick */
// 新能源接入 - 光伏/风电/储能 + 地图
(() => {
const { useState, useMemo } = React;

const SITES = [
  { id:'PV-001', name:'海滨光伏电站', type:'solar', x:78, y:32, cap:280, cur:212, status:'normal', region:'滨海开发区' },
  { id:'PV-002', name:'南山光伏阵列', type:'solar', x:42, y:62, cap:185, cur:152, status:'normal', region:'南部新区' },
  { id:'PV-003', name:'东郊农光互补', type:'solar', x:64, y:25, cap:120, cur:104, status:'warning', region:'东部新城' },
  { id:'WD-001', name:'东海风电场', type:'wind', x:84, y:48, cap:320, cur:186, status:'normal', region:'近海风区' },
  { id:'WD-002', name:'北山陆上风电', type:'wind', x:32, y:18, cap:180, cur:78, status:'normal', region:'北山地区' },
  { id:'WD-003', name:'西部山地风场', type:'wind', x:14, y:54, cap:220, cur:124, status:'normal', region:'西部山区' },
  { id:'ES-001', name:'中央储能站', type:'storage', x:50, y:48, cap:200, cur:148, status:'normal', region:'中心城区', soc:62 },
  { id:'ES-002', name:'滨海储能电站', type:'storage', x:74, y:62, cap:120, cur:80, status:'normal', region:'滨海开发区', soc:78 },
];

const ICON_MAP = { solar:'solar', wind:'wind', storage:'battery' };
const COLOR_MAP = { solar:'var(--warning)', wind:'var(--info)', storage:'var(--teal)' };
const TYPE_LABEL = { solar:'光伏', wind:'风电', storage:'储能' };

function RenewableScreen() {
  const tick = useTick(2500);
  const [type, setType] = useState('all');
  const [selected, setSelected] = useState(SITES[3]);

  const filtered = type === 'all' ? SITES : SITES.filter(s => s.type === type);
  const totalCur = filtered.reduce((s, x) => s + x.cur, 0);
  const totalCap = filtered.reduce((s, x) => s + x.cap, 0);

  const dayLabels = Array.from({length: 24}, (_, i) => String(i).padStart(2,'0')+':00');
  const solarCurve = useMemo(() => Array.from({length:24},(_,i)=>{
    const t = (i - 6) / 12 * Math.PI;
    return Math.max(0, Math.round(Math.sin(t) * 480 + (Math.random()-0.5) * 20));
  }), [tick]);
  const windCurve = useMemo(() => genWave(24, 240, 80, 0, 0.2).map(v => Math.max(20, v)), [tick]);
  const storageCurve = useMemo(() => genWave(24, 0, 120, 0, 0.3), [tick]);

  return (
    <div className="fade-in" style={{display:'grid', gridTemplateColumns:'1fr 380px', gap:16, height:'100%'}}>
      {/* 左主区: 地图 + 曲线 */}
      <div style={{display:'flex', flexDirection:'column', gap:12, minWidth:0}}>
        <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12}}>
          <KPI label="清洁能源总出力" value={totalCur.toLocaleString()} unit="MW" delta={12.4} deltaLabel="同昨" color="var(--success)"/>
          <KPI label="装机容量" value={`${(totalCap/1000).toFixed(2)}`} unit="GW" status="规划+8.5%" color="var(--teal)"/>
          <KPI label="平均利用率" value={`${(totalCur/totalCap*100).toFixed(1)}`} unit="%" delta={2.1} deltaLabel="本月" color="var(--info)"/>
          <KPI label="今日发电量" value="8,642" unit="MWh" delta={18.6} deltaLabel="同昨" color="var(--warning)"/>
        </div>

        <Card title="新能源场站分布" tag="GEO MAP" live
              actions={<>
                {[
                  {id:'all', label:'全部', c:''},
                  {id:'solar', label:'光伏', c:'var(--warning)'},
                  {id:'wind', label:'风电', c:'var(--info)'},
                  {id:'storage', label:'储能', c:'var(--teal)'},
                ].map(t => (
                  <button key={t.id} onClick={()=>setType(t.id)}
                          className={`btn sm ${type === t.id ? 'primary' : 'ghost'}`}
                          style={t.c && type === t.id ? {background:t.c, borderColor:t.c, color:'white', boxShadow:`0 0 8px ${t.c}`} : {}}>
                    {t.label}
                  </button>
                ))}
              </>}
              glow noPad style={{flex:'1 1 0', minHeight:0}}>
          <GeoMap sites={filtered} selected={selected} onSelect={setSelected}/>
        </Card>

        <Card title="新能源出力曲线" tag="24H" live>
          <div style={{display:'flex', gap:14, marginBottom:8}}>
            <span style={{display:'inline-flex',alignItems:'center',gap:6,fontSize:12}}>
              <span style={{width:14,height:2,background:'#FFAB2D'}}/>光伏
            </span>
            <span style={{display:'inline-flex',alignItems:'center',gap:6,fontSize:12}}>
              <span style={{width:14,height:2,background:'#25C6FF'}}/>风电
            </span>
            <span style={{display:'inline-flex',alignItems:'center',gap:6,fontSize:12}}>
              <span style={{width:14,height:2,background:'#2EE6D6'}}/>储能(±)
            </span>
          </div>
          <LineChart
            height={200}
            labels={dayLabels}
            yUnit="MW"
            yMax={600}
            series={[
              { name:'光伏', data:solarCurve, color:'#FFAB2D', glow:true },
              { name:'风电', data:windCurve, color:'#25C6FF', glow:true },
              { name:'储能', data:storageCurve.map(v=>v+200), color:'#2EE6D6' },
            ]}/>
        </Card>
      </div>

      {/* 右: 详情 */}
      <div style={{minWidth:0, display:'flex', flexDirection:'column', gap:12}}>
        <Card headerless noPad glow style={{padding:16}}>
          <div className="card-decoration"/>
          <div style={{display:'flex', alignItems:'center', gap:10}}>
            <div style={{
              width:42, height:42, borderRadius:'50%',
              background: `${COLOR_MAP[selected.type]}22`,
              border: `1px solid ${COLOR_MAP[selected.type]}`,
              display:'grid', placeItems:'center',
              color: COLOR_MAP[selected.type],
              boxShadow: `0 0 12px ${COLOR_MAP[selected.type]}`,
            }}>
              <Icon name={ICON_MAP[selected.type]} size={20}/>
            </div>
            <div style={{flex:1}}>
              <div className="text-3 text-xs">{selected.id} · {TYPE_LABEL[selected.type]}</div>
              <h2 style={{margin:'2px 0', fontSize:16}}>{selected.name}</h2>
              <div className="text-3 text-xs">{selected.region}</div>
            </div>
            <span className={`status-pill ${selected.status}`}>
              {selected.status === 'normal' ? '正常' : '预警'}
            </span>
          </div>

          <div style={{display:'flex', justifyContent:'center', margin:'14px 0 6px'}}>
            <Ring percent={selected.cur/selected.cap*100} 
                  value={selected.cur} 
                  label="当前出力 MW"
                  subLabel={`/ 容量 ${selected.cap}MW`}
                  size={150}
                  color={COLOR_MAP[selected.type]}
                  thickness={10}/>
          </div>

          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginTop:10, fontSize:12}}>
            <div style={{padding:10, background:'var(--bg-elevated)', borderRadius:'var(--r-md)'}}>
              <div className="text-3 text-xs">利用率</div>
              <div className="text-digit" style={{fontSize:18, color:COLOR_MAP[selected.type]}}>{Math.round(selected.cur/selected.cap*100)}%</div>
            </div>
            <div style={{padding:10, background:'var(--bg-elevated)', borderRadius:'var(--r-md)'}}>
              <div className="text-3 text-xs">今日发电</div>
              <div className="text-digit" style={{fontSize:18}}>{Math.round(selected.cur * 7.2)} <span className="text-3 text-xs">MWh</span></div>
            </div>
            {selected.type === 'storage' && (
              <>
                <div style={{padding:10, background:'var(--bg-elevated)', borderRadius:'var(--r-md)'}}>
                  <div className="text-3 text-xs">SOC 荷电态</div>
                  <div className="text-digit" style={{fontSize:18, color:'var(--success)'}}>{selected.soc}%</div>
                </div>
                <div style={{padding:10, background:'var(--bg-elevated)', borderRadius:'var(--r-md)'}}>
                  <div className="text-3 text-xs">状态</div>
                  <div className="text-digit" style={{fontSize:18, color:'var(--success)'}}>放电中</div>
                </div>
              </>
            )}
            {selected.type === 'solar' && (
              <>
                <div style={{padding:10, background:'var(--bg-elevated)', borderRadius:'var(--r-md)'}}>
                  <div className="text-3 text-xs">辐照度</div>
                  <div className="text-digit" style={{fontSize:18, color:'var(--warning)'}}>682 <span className="text-3 text-xs">W/m²</span></div>
                </div>
                <div style={{padding:10, background:'var(--bg-elevated)', borderRadius:'var(--r-md)'}}>
                  <div className="text-3 text-xs">组件温度</div>
                  <div className="text-digit" style={{fontSize:18}}>42.6°C</div>
                </div>
              </>
            )}
            {selected.type === 'wind' && (
              <>
                <div style={{padding:10, background:'var(--bg-elevated)', borderRadius:'var(--r-md)'}}>
                  <div className="text-3 text-xs">风速</div>
                  <div className="text-digit" style={{fontSize:18, color:'var(--info)'}}>8.4 <span className="text-3 text-xs">m/s</span></div>
                </div>
                <div style={{padding:10, background:'var(--bg-elevated)', borderRadius:'var(--r-md)'}}>
                  <div className="text-3 text-xs">在线机组</div>
                  <div className="text-digit" style={{fontSize:18}}>34<span className="text-3 text-xs">/36</span></div>
                </div>
              </>
            )}
          </div>
        </Card>

        <Card title="近 7 日发电量" tag="MWh">
          <div style={{display:'flex', flexDirection:'column', gap:8}}>
            {['11.07','11.08','11.09','11.10','11.11','11.12','今日'].map((d, i) => {
              const v = Math.round(1200 + (Math.sin(i)+1) * 600);
              const w = v / 2400 * 100;
              return (
                <div key={i} style={{display:'flex', alignItems:'center', gap:10}}>
                  <span className="text-3 text-xs" style={{width:42}}>{d}</span>
                  <div style={{flex:1, height:14, background:'var(--bg-elevated)', borderRadius:7, overflow:'hidden', position:'relative'}}>
                    <div style={{
                      width:`${w}%`, height:'100%',
                      background:`linear-gradient(90deg, ${COLOR_MAP[selected.type]}, ${COLOR_MAP[selected.type]}88)`,
                      boxShadow:`0 0 6px ${COLOR_MAP[selected.type]}`,
                    }}/>
                  </div>
                  <span className="text-digit text-sm" style={{minWidth:46, textAlign:'right'}}>{v}</span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}

function GeoMap({ sites, selected, onSelect }) {
  return (
    <div style={{position:'relative', width:'100%', height:'100%', minHeight: 400, background:'radial-gradient(circle at 50% 40%, rgba(10,108,255,0.08), transparent 60%)', overflow:'hidden'}}>
      {/* 地图轮廓 SVG */}
      <svg viewBox="0 0 100 80" preserveAspectRatio="none" style={{position:'absolute', inset:0, width:'100%', height:'100%'}}>
        <defs>
          <pattern id="map-grid" width="4" height="4" patternUnits="userSpaceOnUse">
            <path d="M 4 0 L 0 0 0 4" fill="none" stroke="rgba(10,108,255,0.06)" strokeWidth="0.1"/>
          </pattern>
        </defs>
        <rect width="100" height="80" fill="url(#map-grid)"/>
        {/* 区域轮廓 */}
        <path d="M 5 30 Q 12 12 28 14 Q 42 8 58 12 Q 72 8 84 18 Q 92 32 88 48 Q 92 60 82 70 Q 64 76 48 72 Q 32 76 20 70 Q 8 60 5 48 Z"
              fill="rgba(10,108,255,0.04)" stroke="rgba(10,108,255,0.3)" strokeWidth="0.3"
              vectorEffect="non-scaling-stroke"/>
        {/* 内部分区线 */}
        <path d="M 50 12 Q 48 40 50 70" fill="none" stroke="rgba(10,108,255,0.18)" strokeWidth="0.2" strokeDasharray="1 1" vectorEffect="non-scaling-stroke"/>
        <path d="M 8 40 Q 48 38 90 42" fill="none" stroke="rgba(10,108,255,0.18)" strokeWidth="0.2" strokeDasharray="1 1" vectorEffect="non-scaling-stroke"/>
        {/* 水波纹 */}
        {sites.map(s => {
          const color = COLOR_MAP[s.type];
          return (
            <g key={`r-${s.id}`}>
              <circle cx={s.x} cy={s.y} r="1.5" fill="none" stroke={color} strokeWidth="0.2"
                      vectorEffect="non-scaling-stroke" opacity="0.6">
                <animate attributeName="r" from="1.5" to="6" dur="2.5s" repeatCount="indefinite" begin={`${Math.random()}s`}/>
                <animate attributeName="opacity" from="0.6" to="0" dur="2.5s" repeatCount="indefinite" begin={`${Math.random()}s`}/>
              </circle>
            </g>
          );
        })}
      </svg>

      {/* 区域标签 */}
      {[
        {x:30,y:25,name:'北区'},{x:72,y:25,name:'东北'},
        {x:30,y:62,name:'南区'},{x:72,y:62,name:'东南'},
      ].map((r, i) => (
        <div key={i} style={{
          position:'absolute', left:`${r.x}%`, top:`${r.y}%`, transform:'translate(-50%,-50%)',
          color:'var(--text-mute)', fontSize:11, letterSpacing:2, pointerEvents:'none',
        }}>{r.name}</div>
      ))}

      {/* 场站标记 */}
      {sites.map(s => {
        const color = COLOR_MAP[s.type];
        const isSel = selected?.id === s.id;
        return (
          <div key={s.id}
               onClick={()=>onSelect(s)}
               style={{
                 position:'absolute',
                 left:`${s.x}%`, top:`${s.y}%`,
                 transform:'translate(-50%,-50%)',
                 cursor:'pointer',
                 textAlign:'center',
                 zIndex: isSel ? 20 : 5,
               }}>
            <div style={{
              width: 36, height: 36, borderRadius: s.type === 'storage' ? '6px' : '50%',
              background: `radial-gradient(circle, ${color}33, transparent 70%)`,
              border: `2px solid ${color}`,
              boxShadow: `0 0 ${isSel ? 16 : 8}px ${color}`,
              display:'grid', placeItems:'center', color,
              backgroundColor:'rgba(8,17,31,0.85)',
              transform: isSel ? 'scale(1.2)' : 'scale(1)',
              transition:'all .2s',
            }}>
              <Icon name={ICON_MAP[s.type]} size={16}/>
            </div>
            <div style={{
              marginTop:4, fontSize:10, color:'var(--text-1)',
              textShadow:'0 0 6px rgba(0,0,0,0.9)',
              whiteSpace:'nowrap', pointerEvents:'none',
            }}>
              <b>{s.name}</b>
              <div className="text-3" style={{fontSize:9, marginTop:1}}>
                <span className="text-digit" style={{color}}>{s.cur}</span>/{s.cap} MW
              </div>
            </div>
          </div>
        );
      })}

      {/* 角标实时统计 */}
      <div style={{
        position:'absolute', top:16, right:16,
        background:'rgba(8,17,31,0.85)',
        border:'1px solid var(--primary-border)',
        borderRadius:'var(--r-md)',
        padding:'10px 14px', minWidth:160,
        backdropFilter:'blur(10px)', fontSize:11,
      }}>
        <div className="text-3 text-xs mb-2" style={{letterSpacing:2}}>实时统计</div>
        {['solar','wind','storage'].map(t => {
          const list = SITES.filter(s => s.type === t);
          const cur = list.reduce((s,x)=>s+x.cur,0);
          const cap = list.reduce((s,x)=>s+x.cap,0);
          return (
            <div key={t} style={{display:'flex', justifyContent:'space-between', gap:12, padding:'4px 0', borderTop: t!=='solar'?'1px dashed var(--border)':'none'}}>
              <span style={{display:'inline-flex',alignItems:'center',gap:6, color: COLOR_MAP[t]}}>
                <Icon name={ICON_MAP[t]} size={12}/> {TYPE_LABEL[t]}
              </span>
              <span><b className="text-digit">{cur}</b><span className="text-3">/{cap}MW</span></span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

window.RenewableScreen = RenewableScreen;
})();
