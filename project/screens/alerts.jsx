/* global React, Icon, Card, KPI */
// 告警与事件中心
(() => {
const { useState } = React;

const ALL_ALERTS = [
  { id:'A-202511130214', level:'critical', status:'active', title:'220kV 滨海I线 严重过载', loc:'滨海220kV变电站', device:'LIN-2208', value:'1,124A / 上限 1,000A', time:'14:32:08', desc:'当前电流超过额定值 12.4%, 已持续 8 分钟', op:'张志远' },
  { id:'A-202511130212', level:'high', status:'ack', title:'主变 #3 油温偏高', loc:'东郊220kV变电站', device:'TRX-3403', value:'82.4°C / 阈值 80°C', time:'14:28:41', desc:'油温缓慢上升, 建议加强散热', op:'李明' },
  { id:'A-202511130209', level:'mid', status:'active', title:'10kV 工业园II线 接地故障', loc:'工业园 7#开关站', device:'SWG-7702', value:'零序电流 4.6A', time:'14:21:33', desc:'检测到单相接地, 已自动隔离故障段', op:'-' },
  { id:'A-202511130207', level:'mid', status:'resolved', title:'光伏 12# 逆变器通讯中断', loc:'海滨光伏电站', device:'INV-1012', value:'离线 6 min', time:'14:08:12', desc:'通讯已恢复, 数据采集正常', op:'王伟' },
  { id:'A-202511130205', level:'high', status:'active', title:'配电柜湿度异常', loc:'工业园 3#开关站', device:'SWG-7703', value:'湿度 84% / 阈值 75%', time:'13:58:20', desc:'柜内湿度持续偏高, 需检查除湿装置', op:'-' },
  { id:'A-202511130203', level:'low', status:'resolved', title:'#5 SVC 投切频繁', loc:'中心500kV枢纽站', device:'SVC-005', value:'10min 内 8次', time:'13:42:55', desc:'已切换至备用控制器', op:'李明' },
  { id:'A-202511130201', level:'mid', status:'ack', title:'风电场 7# 风机偏航异常', loc:'东海风电场', device:'WTG-007', value:'偏航角 -15°', time:'13:36:11', desc:'风向追踪偏差, 已远程复位', op:'陈一鸣' },
  { id:'A-202511130158', level:'critical', status:'resolved', title:'500kV 主网I线 重合闸成功', loc:'中心500kV枢纽站', device:'LIN-5012', value:'重合 1 次', time:'13:21:48', desc:'瞬时性故障, 重合闸动作正确', op:'张志远' },
];

const LEVEL_MAP = {
  critical: { color:'var(--danger)', label:'紧急', bg:'var(--danger-soft)' },
  high: { color:'var(--warning)', label:'重要', bg:'var(--warning-soft)' },
  mid: { color:'var(--info)', label:'一般', bg:'var(--info-soft)' },
  low: { color:'var(--text-3)', label:'提示', bg:'rgba(120,140,170,0.1)' },
};

const STATUS_MAP = {
  active: { color:'var(--danger)', label:'未处理' },
  ack: { color:'var(--warning)', label:'已确认' },
  resolved: { color:'var(--success)', label:'已恢复' },
};

function AlertsScreen() {
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState(ALL_ALERTS[0]);

  const filtered = ALL_ALERTS.filter(a =>
    filter === 'all' ? true :
    filter === 'active' ? a.status === 'active' :
    filter === 'critical' ? a.level === 'critical' :
    a.status === filter
  );

  return (
    <div className="fade-in" style={{display:'grid', gridTemplateColumns:'1fr 460px', gap:16, height:'100%'}}>
      <div style={{display:'flex', flexDirection:'column', gap:12, minWidth:0}}>
        {/* KPI 行 */}
        <div style={{display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:12}}>
          <KPI label="未处理告警" value="14" unit="条" delta={16.7} deltaLabel="同昨" color="var(--danger)" status="紧急"/>
          <KPI label="紧急告警" value="2" unit="条" color="var(--danger)"/>
          <KPI label="今日总计" value="86" unit="条" delta={-8.4} deltaLabel="同昨" color="var(--warning)"/>
          <KPI label="已恢复" value="64" unit="条" delta={4.1} deltaLabel="同昨" color="var(--success)"/>
          <KPI label="平均处理时长" value="12.4" unit="min" delta={-15.2} deltaLabel="同昨" color="var(--info)"/>
        </div>

        {/* 时间轴 + 列表 */}
        <Card title="告警时间轴 · 24H" tag="LIVE" noPad>
          <div style={{padding:'14px 20px'}}>
            <AlertTimeline alerts={ALL_ALERTS}/>
          </div>
        </Card>

        <Card title="告警列表" tag={`共 ${filtered.length}`}
              actions={<>
                {[
                  {id:'all', label:'全部'},
                  {id:'active', label:'未处理'},
                  {id:'critical', label:'紧急'},
                  {id:'ack', label:'已确认'},
                  {id:'resolved', label:'已恢复'},
                ].map(f => (
                  <button key={f.id}
                          onClick={() => setFilter(f.id)}
                          className={`btn sm ${filter === f.id ? 'primary' : 'ghost'}`}>{f.label}</button>
                ))}
              </>}
              noPad style={{flex:1, minHeight:0, display:'flex', flexDirection:'column'}}>
          <div style={{flex:1, overflowY:'auto'}}>
            <table className="data">
              <thead>
                <tr>
                  <th style={{width:54}}>级别</th>
                  <th>告警内容</th>
                  <th>位置 / 设备</th>
                  <th>触发值</th>
                  <th>时间</th>
                  <th>状态</th>
                  <th>处理人</th>
                  <th style={{width:100}}>操作</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(a => {
                  const lv = LEVEL_MAP[a.level], st = STATUS_MAP[a.status];
                  return (
                    <tr key={a.id} className={selected?.id === a.id ? 'selected' : ''}
                        onClick={() => setSelected(a)} style={{cursor:'pointer'}}>
                      <td>
                        <span style={{
                          display:'inline-flex', alignItems:'center', justifyContent:'center',
                          width:36, height:22, borderRadius:4, background:lv.bg, color:lv.color, fontSize:11, fontWeight:600,
                        }}>{lv.label}</span>
                      </td>
                      <td><b>{a.title}</b></td>
                      <td className="text-2 text-sm">
                        <div>{a.loc}</div>
                        <code style={{fontSize:10, color:'var(--info)'}}>{a.device}</code>
                      </td>
                      <td className="text-digit text-sm" style={{color:lv.color}}>{a.value}</td>
                      <td className="text-digit text-sm">{a.time}</td>
                      <td><span className="chip dot" style={{color:st.color}}>{st.label}</span></td>
                      <td className="text-2 text-sm">{a.op}</td>
                      <td>
                        <button className="btn sm">详情</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* 右: 告警详情 */}
      <div style={{minWidth:0}}>
        {selected && <AlertDetail alert={selected}/>}
      </div>
    </div>
  );
}

function AlertTimeline({ alerts }) {
  // 将时间 -> x 位置
  // 假设 24H 跨度, 当前时间 14:35
  const positions = alerts.map(a => {
    const [h, m] = a.time.split(':').map(Number);
    const minutes = h * 60 + m;
    return { ...a, x: minutes };
  });
  const minX = 13 * 60, maxX = 15 * 60; // 关注 13:00-15:00 窗口
  const W = 800, H = 80;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H}>
      {/* 主轴 */}
      <line x1="0" x2={W} y1={H/2} y2={H/2} stroke="var(--border-strong)" strokeWidth="1"/>
      {/* 刻度 */}
      {Array.from({length: 13}, (_, i) => {
        const t = minX + (maxX - minX) * i / 12;
        const x = (t - minX) / (maxX - minX) * W;
        const isHour = t % 60 === 0;
        return (
          <g key={i}>
            <line x1={x} x2={x} y1={H/2 - (isHour ? 6 : 3)} y2={H/2 + (isHour ? 6 : 3)} stroke="var(--text-3)"/>
            {isHour && <text x={x} y={H/2 + 22} fontSize="10" fill="var(--text-3)" textAnchor="middle">
              {String(Math.floor(t/60)).padStart(2,'0')}:00
            </text>}
          </g>
        );
      })}
      {/* 现在标记 */}
      <line x1={(14*60+35-minX)/(maxX-minX)*W} x2={(14*60+35-minX)/(maxX-minX)*W} y1="6" y2={H-6}
            stroke="var(--primary)" strokeWidth="1" strokeDasharray="2 2"/>
      <text x={(14*60+35-minX)/(maxX-minX)*W} y={12} fontSize="10" fill="var(--primary)" textAnchor="middle">现在</text>
      {/* 告警点 */}
      {positions.filter(p => p.x >= minX && p.x <= maxX).map((p, i) => {
        const x = (p.x - minX) / (maxX - minX) * W;
        const lv = LEVEL_MAP[p.level];
        return (
          <g key={i}>
            <line x1={x} x2={x} y1={H/2} y2={H/2 - 18} stroke={lv.color} strokeWidth="1" opacity="0.5"/>
            <circle cx={x} cy={H/2 - 22} r="5" fill={lv.color} style={{filter:`drop-shadow(0 0 4px ${lv.color})`}}/>
            <circle cx={x} cy={H/2 - 22} r="9" fill="none" stroke={lv.color} opacity="0.3"/>
          </g>
        );
      })}
    </svg>
  );
}

function AlertDetail({ alert }) {
  const lv = LEVEL_MAP[alert.level], st = STATUS_MAP[alert.status];
  return (
    <div style={{display:'flex', flexDirection:'column', gap:12, height:'100%'}}>
      <Card headerless noPad glow style={{padding:16}}>
        <div className="card-decoration"/>
        <div style={{display:'flex', alignItems:'center', gap:10, marginBottom:8}}>
          <span style={{
            padding:'4px 10px', borderRadius:4,
            background: lv.bg, color: lv.color, fontSize:12, fontWeight:600, letterSpacing:1,
          }}>{lv.label}级别</span>
          <span className="chip dot" style={{color: st.color}}>{st.label}</span>
          <span className="text-3 text-xs" style={{marginLeft:'auto'}}>{alert.id}</span>
        </div>
        <h2 style={{margin:'4px 0 8px', fontSize:18}}>{alert.title}</h2>
        <div className="text-2 text-sm" style={{lineHeight:1.6}}>{alert.desc}</div>

        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginTop:14, fontSize:12}}>
          <DetailItem icon="map" label="位置" value={alert.loc}/>
          <DetailItem icon="device" label="设备" value={alert.device} code/>
          <DetailItem icon="alert" label="触发值" value={alert.value} highlight={lv.color}/>
          <DetailItem icon="clock" label="触发时间" value={`今日 ${alert.time}`}/>
          <DetailItem icon="user" label="负责人" value={alert.op}/>
          <DetailItem icon="flag" label="持续时长" value="6 min 24 s"/>
        </div>

        <div style={{display:'flex', gap:8, marginTop:14}}>
          <button className="btn primary" style={{flex:1}}><Icon name="check" size={14}/> 确认告警</button>
          <button className="btn" style={{flex:1}}><Icon name="ticket" size={14}/> 派发工单</button>
          <button className="btn icon-only"><Icon name="more" size={14}/></button>
        </div>
      </Card>

      <Card title="处理流程" tag="FLOW" noPad style={{flex:1, minHeight:0, overflowY:'auto'}}>
        <div className="card-body">
          <ProcessTimeline alert={alert}/>
        </div>
      </Card>

      <Card title="关联告警" tag="近 1H">
        <div style={{display:'flex', flexDirection:'column', gap:6}}>
          {ALL_ALERTS.filter(a => a.id !== alert.id).slice(0, 3).map(a => {
            const lv = LEVEL_MAP[a.level];
            return (
              <div key={a.id} style={{
                display:'flex', alignItems:'center', gap:10,
                padding:'8px 10px',
                background:'var(--bg-elevated)', borderRadius:'var(--r-md)',
                borderLeft: `2px solid ${lv.color}`,
              }}>
                <span style={{
                  width:6, height:6, borderRadius:'50%',
                  background: lv.color, boxShadow: `0 0 4px ${lv.color}`, flexShrink:0,
                }}/>
                <div style={{flex:1, minWidth:0}}>
                  <div style={{fontSize:12, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{a.title}</div>
                  <div className="text-3 text-xs">{a.loc} · {a.time}</div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

function DetailItem({ icon, label, value, highlight, code }) {
  return (
    <div style={{padding:8, background:'var(--bg-elevated)', borderRadius:'var(--r-sm)'}}>
      <div style={{display:'flex', alignItems:'center', gap:5, color:'var(--text-3)'}}>
        <Icon name={icon} size={12}/>
        <span style={{fontSize:11}}>{label}</span>
      </div>
      <div style={{marginTop:3, color: highlight || 'var(--text-1)', fontSize:13}}>
        {code ? <code style={{color:'var(--info)'}}>{value}</code> : value}
      </div>
    </div>
  );
}

function ProcessTimeline({ alert }) {
  const steps = [
    { time: '14:32:08', label: '告警触发', desc: 'SCADA 自动采集异常', done: true, icon: 'alert' },
    { time: '14:32:15', label: '智能分诊', desc: 'AI 判定为重要级别, 推送调度员', done: true, icon: 'shield' },
    { time: alert.status !== 'active' ? '14:33:42' : '', label: '人工确认', desc: alert.status !== 'active' ? `${alert.op || '调度员'} 已确认` : '等待确认', done: alert.status !== 'active', icon: 'check' },
    { time: alert.status === 'resolved' ? '14:38:22' : '', label: '派发工单', desc: alert.status === 'resolved' ? '已生成工单 WO-2025111313' : '待派发', done: alert.status === 'resolved', icon: 'ticket' },
    { time: alert.status === 'resolved' ? '14:42:15' : '', label: '故障恢复', desc: alert.status === 'resolved' ? '已恢复正常运行' : '待恢复', done: alert.status === 'resolved', icon: 'shield' },
  ];

  return (
    <div style={{position:'relative'}}>
      {steps.map((s, i) => (
        <div key={i} style={{display:'flex', gap:12, position:'relative', paddingBottom: i < steps.length - 1 ? 18 : 0}}>
          {i < steps.length - 1 && (
            <div style={{
              position:'absolute', left:13, top:30, bottom:0, width:2,
              background: s.done ? 'var(--success)' : 'var(--border-strong)',
            }}/>
          )}
          <div style={{
            width:28, height:28, borderRadius:'50%',
            background: s.done ? 'var(--success-soft)' : 'var(--bg-elevated)',
            color: s.done ? 'var(--success)' : 'var(--text-3)',
            display:'grid', placeItems:'center',
            flexShrink:0, zIndex:1,
            border: s.done ? '2px solid var(--success)' : '2px solid var(--border-strong)',
          }}>
            <Icon name={s.icon} size={12}/>
          </div>
          <div style={{flex:1}}>
            <div style={{display:'flex', justifyContent:'space-between', gap:8}}>
              <b style={{fontSize:13, color: s.done ? 'var(--text-1)' : 'var(--text-3)'}}>{s.label}</b>
              <span className="text-3 text-xs text-digit">{s.time || '待执行'}</span>
            </div>
            <div className="text-3 text-xs" style={{marginTop:2}}>{s.desc}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

window.AlertsScreen = AlertsScreen;
})();
