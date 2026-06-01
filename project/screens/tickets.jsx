/* global React, Icon, Card, KPI */
// 运维工单流程
(() => {
const { useState } = React;

const TICKETS = [
  { id:'WO-20251113-014', title:'220kV 滨海I线 过载隐患处理', priority:'紧急', status:'doing', assignee:'王伟', team:'变电运维班', created:'14:35', sla:'2H', progress:35, type:'故障处理' },
  { id:'WO-20251113-013', title:'东郊变 #3 主变油色谱检测', priority:'高', status:'pending', assignee:'李明', team:'检修班', created:'14:30', sla:'24H', progress:0, type:'例行检测' },
  { id:'WO-20251113-012', title:'工业园 3#开关站除湿装置检查', priority:'中', status:'doing', assignee:'陈一鸣', team:'配网班', created:'14:00', sla:'8H', progress:60, type:'消缺' },
  { id:'WO-20251113-011', title:'光伏 12# 逆变器通讯排查', priority:'中', status:'done', assignee:'王伟', team:'新能源班', created:'14:08', sla:'4H', progress:100, type:'故障处理' },
  { id:'WO-20251113-010', title:'东海风电场 7# 风机偏航复位', priority:'中', status:'done', assignee:'刘强', team:'新能源班', created:'13:36', sla:'4H', progress:100, type:'消缺' },
  { id:'WO-20251113-009', title:'中心枢纽站 月度巡检', priority:'低', status:'pending', assignee:'李明', team:'变电运维班', created:'09:00', sla:'72H', progress:0, type:'例行巡检' },
  { id:'WO-20251113-008', title:'北郊变 二次设备校验', priority:'低', status:'doing', assignee:'张博', team:'继电保护班', created:'08:30', sla:'48H', progress:75, type:'例行校验' },
];

const STATUS = {
  pending: { color:'var(--info)', label:'待处理', bg:'var(--info-soft)' },
  doing: { color:'var(--warning)', label:'进行中', bg:'var(--warning-soft)' },
  done: { color:'var(--success)', label:'已完成', bg:'var(--success-soft)' },
};

const PRIORITY = {
  '紧急': 'var(--danger)',
  '高': 'var(--warning)',
  '中': 'var(--info)',
  '低': 'var(--text-3)',
};

function TicketsScreen() {
  const [view, setView] = useState('kanban');
  const [selected, setSelected] = useState(TICKETS[0]);

  return (
    <div className="fade-in" style={{display:'flex', flexDirection:'column', gap:12, height:'100%'}}>
      <div style={{display:'grid', gridTemplateColumns:'repeat(5,1fr) auto', gap:12, alignItems:'stretch'}}>
        <KPI label="今日新增" value="12" unit="单" delta={20} deltaLabel="同昨" color="var(--primary)"/>
        <KPI label="进行中" value="8" unit="单" color="var(--warning)"/>
        <KPI label="已完成" value="34" unit="单" delta={6.3} deltaLabel="同昨" color="var(--success)"/>
        <KPI label="平均时长" value="2.4" unit="H" delta={-12.5} deltaLabel="本周" color="var(--info)"/>
        <KPI label="SLA 达成率" value="98.2" unit="%" delta={0.6} deltaLabel="本月" color="var(--success)" status="优秀"/>
        <div style={{display:'flex', alignItems:'flex-end'}}>
          <button className="btn primary" style={{height:42, padding:'0 18px'}}><Icon name="plus" size={14}/> 新建工单</button>
        </div>
      </div>

      <Card noPad style={{flex:1, minHeight:0, display:'flex', flexDirection:'column'}}
            title="工单看板"
            tag="LIVE"
            actions={<>
              <div className="search">
                <Icon name="search" size={13}/>
                <input placeholder="搜索工单"/>
              </div>
              <div style={{display:'flex', background:'var(--bg-elevated)', borderRadius:'var(--r-sm)', padding:2}}>
                <button onClick={()=>setView('kanban')} className={`btn sm ${view==='kanban'?'primary':'ghost'}`} style={{borderRadius:3, padding:'3px 12px'}}>看板</button>
                <button onClick={()=>setView('list')} className={`btn sm ${view==='list'?'primary':'ghost'}`} style={{borderRadius:3, padding:'3px 12px'}}>列表</button>
              </div>
            </>}>
        {view === 'kanban' ? (
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14, padding:16, flex:1, minHeight:0}}>
            {['pending', 'doing', 'done'].map(col => {
              const status = STATUS[col];
              const list = TICKETS.filter(t => t.status === col);
              return (
                <div key={col} style={{display:'flex', flexDirection:'column', gap:10, minHeight:0}}>
                  <div style={{display:'flex', alignItems:'center', gap:8, padding:'6px 8px',
                               borderRadius:'var(--r-md)', background: status.bg}}>
                    <span style={{width:8, height:8, borderRadius:'50%', background: status.color, boxShadow:`0 0 6px ${status.color}`}}/>
                    <b style={{color: status.color, fontSize:13, letterSpacing:1}}>{status.label}</b>
                    <span className="text-3 text-xs" style={{marginLeft:'auto'}}>{list.length} 单</span>
                  </div>
                  <div style={{display:'flex', flexDirection:'column', gap:10, overflowY:'auto', flex:1, paddingRight:4}}>
                    {list.map(t => (
                      <TicketCard key={t.id} t={t} active={selected?.id === t.id} onClick={() => setSelected(t)}/>
                    ))}
                  </div>
                </div>
              );
            })}
            {/* 详情侧栏可滚动 */}
          </div>
        ) : (
          <div style={{overflowY:'auto', flex:1}}>
            <table className="data">
              <thead>
                <tr>
                  <th>工单编号</th><th>标题</th><th>类型</th><th>优先级</th>
                  <th>状态</th><th>负责人</th><th>班组</th><th>进度</th><th>创建时间</th><th>SLA</th>
                </tr>
              </thead>
              <tbody>
                {TICKETS.map(t => (
                  <tr key={t.id} onClick={()=>setSelected(t)} style={{cursor:'pointer'}}
                      className={selected?.id === t.id ? 'selected' : ''}>
                    <td><code style={{color:'var(--info)', fontSize:11}}>{t.id}</code></td>
                    <td><b>{t.title}</b></td>
                    <td><span className="chip">{t.type}</span></td>
                    <td><span className="chip dot" style={{color: PRIORITY[t.priority]}}>{t.priority}</span></td>
                    <td><span className="chip" style={{color: STATUS[t.status].color, background: STATUS[t.status].bg}}>{STATUS[t.status].label}</span></td>
                    <td>{t.assignee}</td>
                    <td className="text-2">{t.team}</td>
                    <td>
                      <div style={{display:'flex', alignItems:'center', gap:8}}>
                        <div style={{flex:1, maxWidth:80, height:5, background:'var(--bg-elevated)', borderRadius:3, overflow:'hidden'}}>
                          <div style={{width:`${t.progress}%`, height:'100%', background:'var(--primary)', boxShadow:'0 0 4px var(--primary-glow)'}}/>
                        </div>
                        <span className="text-digit text-xs">{t.progress}%</span>
                      </div>
                    </td>
                    <td className="text-digit text-sm">{t.created}</td>
                    <td><span className="chip">{t.sla}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function TicketCard({ t, active, onClick }) {
  return (
    <div onClick={onClick} style={{
      padding:12,
      background: active ? 'var(--primary-soft)' : 'var(--bg-elevated)',
      border: `1px solid ${active ? 'var(--primary-border)' : 'var(--border)'}`,
      borderRadius:'var(--r-md)',
      cursor:'pointer',
      borderLeft:`3px solid ${PRIORITY[t.priority]}`,
      transition:'all .15s',
    }}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'start', gap:8}}>
        <code style={{fontSize:10, color:'var(--text-3)'}}>{t.id}</code>
        <span style={{
          fontSize:10, padding:'1px 6px', borderRadius:3,
          background: `${PRIORITY[t.priority]}22`, color: PRIORITY[t.priority],
        }}>{t.priority}</span>
      </div>
      <div style={{margin:'6px 0', fontSize:13, lineHeight:1.4}}>{t.title}</div>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:8, fontSize:11, color:'var(--text-3)'}}>
        <span style={{display:'inline-flex', alignItems:'center', gap:4}}>
          <span className="avatar" style={{width:18, height:18, fontSize:9}}>{t.assignee[0]}</span>
          <span>{t.assignee}</span>
        </span>
        <span style={{display:'inline-flex', alignItems:'center', gap:4}}>
          <Icon name="clock" size={11}/>
          {t.sla}
        </span>
      </div>
      {t.progress > 0 && (
        <div style={{marginTop:8}}>
          <div style={{height:3, background:'var(--bg-card)', borderRadius:2, overflow:'hidden'}}>
            <div style={{width:`${t.progress}%`, height:'100%', background:'var(--primary)', boxShadow:'0 0 4px var(--primary-glow)'}}/>
          </div>
        </div>
      )}
    </div>
  );
}

window.TicketsScreen = TicketsScreen;
})();
