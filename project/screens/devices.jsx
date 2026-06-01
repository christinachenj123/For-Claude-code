/* global React, Icon, Card, KPI, Ring, Sparkline, genWave */
// 设备管理 - 变电站/线路/台账
(() => {
const { useState } = React;

const DEVICES = [
  { id: 'SUB-2201', name: '滨海220kV变电站', type: '变电站', voltage: '220kV', area: '滨海开发区', status: 'normal', load: 86, runtime: '8.2年', last: '2025-11-08', count: 3 },
  { id: 'SUB-5001', name: '中心500kV枢纽站', type: '变电站', voltage: '500kV', area: '中心城区', status: 'normal', load: 72, runtime: '12.5年', last: '2025-10-22', count: 5 },
  { id: 'SUB-2202', name: '东郊220kV变电站', type: '变电站', voltage: '220kV', area: '东部新城', status: 'warning', load: 88, runtime: '15.1年', last: '2025-08-15', count: 4 },
  { id: 'LIN-2208', name: '滨海I线 #220', type: '输电线路', voltage: '220kV', area: '滨海开发区', status: 'danger', load: 96, runtime: '6.8年', last: '2025-09-01', count: 1 },
  { id: 'SUB-1102', name: '工业园110kV', type: '变电站', voltage: '110kV', area: '北部产业园', status: 'normal', load: 64, runtime: '4.3年', last: '2025-11-12', count: 2 },
  { id: 'LIN-5012', name: '主网I线 #500', type: '输电线路', voltage: '500kV', area: '骨干网络', status: 'normal', load: 75, runtime: '11.0年', last: '2025-10-30', count: 1 },
  { id: 'TRX-3401', name: '滨海#3 主变压器', type: '变压器', voltage: '220kV', area: '滨海开发区', status: 'normal', load: 82, runtime: '8.2年', last: '2025-11-08', count: 1 },
  { id: 'SWG-7702', name: '工业园 7#开关站', type: '开关站', voltage: '10kV', area: '北部产业园', status: 'warning', load: 78, runtime: '3.6年', last: '2025-09-20', count: 6 },
  { id: 'SUB-2203', name: '北郊220kV变电站', type: '变电站', voltage: '220kV', area: '中心城区', status: 'normal', load: 70, runtime: '9.4年', last: '2025-10-12', count: 3 },
  { id: 'LIN-1108', name: '园区Ⅱ线 #110', type: '输电线路', voltage: '110kV', area: '北部产业园', status: 'normal', load: 58, runtime: '5.2年', last: '2025-11-01', count: 1 },
];

const TYPES = ['全部', '变电站', '输电线路', '变压器', '开关站'];
const VOLTAGES = ['全部', '500kV', '220kV', '110kV', '10kV'];

function DevicesScreen() {
  const [type, setType] = useState('全部');
  const [voltage, setVoltage] = useState('全部');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(DEVICES[0]);

  const filtered = DEVICES.filter(d =>
    (type === '全部' || d.type === type) &&
    (voltage === '全部' || d.voltage === voltage) &&
    (!search || d.name.includes(search) || d.id.includes(search))
  );

  return (
    <div className="fade-in" style={{display:'grid', gridTemplateColumns:'1fr 420px', gap:16, height:'100%'}}>
      {/* 左: 列表 */}
      <div style={{display:'flex', flexDirection:'column', gap:12, minWidth:0}}>
        {/* 顶部统计 */}
        <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12}}>
          <KPI label="总设备数" value="1,284" unit="台" delta={4.2} deltaLabel="本月" color="var(--primary)"/>
          <KPI label="在线运行" value="1,251" unit="台" delta={0.1} deltaLabel="同比" color="var(--success)" status="正常"/>
          <KPI label="预警设备" value="26" unit="台" delta={-12.5} deltaLabel="本周" color="var(--warning)"/>
          <KPI label="待维护" value="7" unit="台" color="var(--danger)" status="紧急"/>
        </div>

        {/* 筛选 + 列表 */}
        <Card title="设备列表" tag={`共 ${filtered.length} 台`}
              actions={<>
                <div className="search">
                  <Icon name="search" size={14}/>
                  <input placeholder="搜索设备 ID / 名称" value={search} onChange={e=>setSearch(e.target.value)}/>
                </div>
                <button className="btn"><Icon name="filter" size={13}/> 筛选</button>
                <button className="btn"><Icon name="download" size={13}/> 导出</button>
                <button className="btn primary"><Icon name="plus" size={13}/> 新增</button>
              </>}
              noPad style={{flex:1, minHeight:0, display:'flex', flexDirection:'column'}}>
          {/* 筛选 chips */}
          <div style={{display:'flex', gap:16, padding:'12px 16px', borderBottom:'1px solid var(--border)', alignItems:'center'}}>
            <div style={{display:'flex', gap:6, alignItems:'center'}}>
              <span className="text-3 text-xs" style={{letterSpacing:1}}>类型</span>
              {TYPES.map(t => (
                <button key={t}
                        onClick={() => setType(t)}
                        className={`btn sm ${type === t ? 'primary' : 'ghost'}`}>{t}</button>
              ))}
            </div>
            <div className="v-divider" style={{height:20}}/>
            <div style={{display:'flex', gap:6, alignItems:'center'}}>
              <span className="text-3 text-xs" style={{letterSpacing:1}}>电压</span>
              {VOLTAGES.map(t => (
                <button key={t}
                        onClick={() => setVoltage(t)}
                        className={`btn sm ${voltage === t ? 'primary' : 'ghost'}`}>{t}</button>
              ))}
            </div>
          </div>

          <div style={{flex:1, overflowY:'auto'}}>
            <table className="data">
              <thead>
                <tr>
                  <th>设备编号</th>
                  <th>设备名称</th>
                  <th>类型</th>
                  <th>电压等级</th>
                  <th>所属区域</th>
                  <th>状态</th>
                  <th>负载率</th>
                  <th>运行年限</th>
                  <th>最近巡检</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(d => (
                  <tr key={d.id}
                      className={selected?.id === d.id ? 'selected' : ''}
                      onClick={() => setSelected(d)}
                      style={{cursor:'pointer'}}>
                    <td><code style={{color:'var(--info)', fontSize:11}}>{d.id}</code></td>
                    <td><b>{d.name}</b></td>
                    <td><span className="chip">{d.type}</span></td>
                    <td className="text-digit">{d.voltage}</td>
                    <td className="text-2">{d.area}</td>
                    <td><span className={`status-pill ${d.status}`}>
                      {d.status === 'normal' ? '正常' : d.status === 'warning' ? '预警' : '告警'}
                    </span></td>
                    <td>
                      <div style={{display:'flex', alignItems:'center', gap:8}}>
                        <div style={{flex:1, height:5, background:'var(--bg-elevated)', borderRadius:3, overflow:'hidden', minWidth:60}}>
                          <div style={{
                            width:`${d.load}%`, height:'100%',
                            background: d.load > 90 ? 'var(--danger)' : d.load > 80 ? 'var(--warning)' : 'var(--primary)',
                            boxShadow: '0 0 6px currentColor',
                          }}/>
                        </div>
                        <span className="text-digit text-xs" style={{minWidth:30}}>{d.load}%</span>
                      </div>
                    </td>
                    <td className="text-2">{d.runtime}</td>
                    <td className="text-2">{d.last}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* 右: 详情面板 */}
      <div style={{minWidth:0}}>
        {selected && <DeviceDetail device={selected}/>}
      </div>
    </div>
  );
}

function DeviceDetail({ device }) {
  const tempData = genWave(20, 38, 4, 0);
  const loadData = genWave(20, device.load, 8, 0);

  return (
    <div style={{display:'flex', flexDirection:'column', gap:12, height:'100%'}}>
      <Card headerless noPad glow style={{padding:16}}>
        <div className="card-decoration"/>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'start'}}>
          <div>
            <div className="text-3 text-xs" style={{letterSpacing:2}}>设备详情 · {device.id}</div>
            <h2 style={{margin:'4px 0 6px', fontSize:18}}>{device.name}</h2>
            <div style={{display:'flex', gap:6, flexWrap:'wrap'}}>
              <span className="chip">{device.type}</span>
              <span className="chip info">{device.voltage}</span>
              <span className="chip">{device.area}</span>
              <span className={`status-pill ${device.status}`}>
                {device.status === 'normal' ? '运行正常' : device.status === 'warning' ? '预警监控' : '故障告警'}
              </span>
            </div>
          </div>
          <button className="btn icon-only ghost"><Icon name="more" size={14}/></button>
        </div>

        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginTop:14}}>
          <div style={{textAlign:'center'}}>
            <Ring percent={device.load} value={`${device.load}%`} label="负载率" size={92}
                  color={device.load > 90 ? 'var(--danger)' : device.load > 80 ? 'var(--warning)' : 'var(--primary)'}/>
          </div>
          <div style={{textAlign:'center'}}>
            <Ring percent={88} value="38.6" label="温度°C" size={92} color="var(--info)"/>
          </div>
          <div style={{textAlign:'center'}}>
            <Ring percent={97} value="97" label="健康度" size={92} color="var(--success)"/>
          </div>
        </div>
      </Card>

      <Card title="实时数据" tag="LIVE" live noPad style={{flex:1, minHeight:0, overflowY:'auto'}}>
        <div className="card-body">
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10}}>
            {[
              {l:'A相电压', v:'230.4', u:'kV', c:'var(--primary)'},
              {l:'B相电压', v:'231.1', u:'kV', c:'var(--info)'},
              {l:'C相电压', v:'229.8', u:'kV', c:'var(--teal)'},
              {l:'有功功率', v:'412.5', u:'MW', c:'var(--primary)'},
              {l:'无功功率', v:'68.2', u:'MVar', c:'var(--purple)'},
              {l:'功率因数', v:'0.987', u:'', c:'var(--success)'},
            ].map((d, i) => (
              <div key={i} style={{padding:10, background:'var(--bg-elevated)', borderRadius:'var(--r-md)'}}>
                <div className="text-3 text-xs">{d.l}</div>
                <div style={{display:'flex', alignItems:'baseline', gap:4, marginTop:2}}>
                  <span className="text-digit" style={{fontSize:18, color:d.c}}>{d.v}</span>
                  <span className="text-3 text-xs">{d.u}</span>
                </div>
              </div>
            ))}
          </div>

          <div style={{marginTop:14}}>
            <div className="text-3 text-xs mb-2" style={{letterSpacing:1}}>温度趋势 · 24H</div>
            <div style={{background:'var(--bg-elevated)', borderRadius:'var(--r-md)', padding:10}}>
              <Sparkline data={tempData} color="var(--warning)" width={360} height={48}/>
            </div>
          </div>

          <div style={{marginTop:12}}>
            <div className="text-3 text-xs mb-2" style={{letterSpacing:1}}>负载趋势 · 24H</div>
            <div style={{background:'var(--bg-elevated)', borderRadius:'var(--r-md)', padding:10}}>
              <Sparkline data={loadData} color="var(--primary)" width={360} height={48}/>
            </div>
          </div>
        </div>
      </Card>

      <Card title="维护记录" tag={`${device.count} 条`} noPad>
        <div className="card-body" style={{padding:'8px 16px 12px'}}>
          {[
            { date: '2025-11-08', type: '例行巡检', user: '王工', result: 'success' },
            { date: '2025-09-15', type: '油色谱检测', user: '李工', result: 'success' },
            { date: '2025-06-22', type: '继电保护校验', user: '陈工', result: 'success' },
          ].map((r, i) => (
            <div key={i} style={{
              display:'flex', alignItems:'center', gap:10,
              padding:'8px 0',
              borderTop: i > 0 ? '1px solid var(--border)' : 'none',
            }}>
              <div style={{
                width:28, height:28, borderRadius:'50%',
                background:'var(--success-soft)', color:'var(--success)',
                display:'grid', placeItems:'center', flexShrink:0,
              }}>
                <Icon name="check" size={14}/>
              </div>
              <div style={{flex:1}}>
                <div style={{display:'flex', justifyContent:'space-between'}}>
                  <b style={{fontSize:13}}>{r.type}</b>
                  <span className="text-3 text-xs">{r.date}</span>
                </div>
                <div className="text-3 text-xs" style={{marginTop:2}}>执行人: {r.user} · 结果合格</div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

window.DevicesScreen = DevicesScreen;
})();
