/* global React, Icon, Card, KPI, LineChart, BarChart, Ring, Sparkline, genWave */
// 能耗统计报表
(() => {
const { useState, useMemo } = React;

function EnergyScreen() {
  const [period, setPeriod] = useState('month');

  const monthLabels = Array.from({length: 30}, (_, i) => String(i+1));
  const consumption = useMemo(() => genWave(30, 4200, 800, 0, 0.08), []);

  return (
    <div className="fade-in" style={{display:'flex', flexDirection:'column', gap:12}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <div style={{display:'flex', gap:8}}>
          {[
            {id:'day', label:'日报'},
            {id:'week', label:'周报'},
            {id:'month', label:'月报'},
            {id:'quarter', label:'季报'},
            {id:'year', label:'年报'},
          ].map(p => (
            <button key={p.id}
                    onClick={()=>setPeriod(p.id)}
                    className={`btn ${period === p.id ? 'primary' : ''}`}>{p.label}</button>
          ))}
        </div>
        <div style={{display:'flex', gap:8, alignItems:'center'}}>
          <span className="text-3 text-sm">2025年11月</span>
          <button className="btn"><Icon name="clock" size={13}/> 选择时段</button>
          <button className="btn"><Icon name="download" size={13}/> 导出报表</button>
        </div>
      </div>

      {/* 概览 KPI */}
      <div style={{display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:12}}>
        <KPI label="供电量" value="124.6" unit="亿kWh" delta={6.4} deltaLabel="同比" color="var(--primary)" sparkData={genWave(12, 100, 20, 0)}/>
        <KPI label="售电量" value="118.4" unit="亿kWh" delta={5.8} deltaLabel="同比" color="var(--info)" sparkData={genWave(12, 95, 18, 0)}/>
        <KPI label="网损率" value="3.82" unit="%" delta={-0.4} deltaLabel="同比" color="var(--success)" sparkData={genWave(12, 4, 0.3, 0)}/>
        <KPI label="清洁能源" value="42.1" unit="亿kWh" delta={18.6} deltaLabel="同比" color="var(--success)"/>
        <KPI label="碳减排" value="3.6" unit="万吨" delta={22.4} deltaLabel="同比" color="var(--teal)" status="新能源"/>
        <KPI label="售电收入" value="6,824" unit="万元" delta={4.2} deltaLabel="同比" color="var(--warning)"/>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'2fr 1fr', gap:12}}>
        <Card title="月度用电曲线" tag="kWh"
              actions={<>
                <span className="chip"><span style={{width:8,height:2,background:'var(--primary)',display:'inline-block',marginRight:4}}/>当月</span>
                <span className="chip"><span style={{width:8,height:2,background:'var(--purple)',display:'inline-block',marginRight:4, opacity:0.6}}/>同期</span>
              </>}>
          <LineChart
            height={240}
            labels={monthLabels}
            yUnit="GWh"
            series={[
              { name: '当月用电', data: consumption.map(v => Math.round(v/10)), color: '#0A6CFF', glow: true },
              { name: '去年同期', data: genWave(30, 380, 60, 0, 0.06), color: '#9D7BFF', dashed: true, area: false },
            ]}/>
        </Card>

        <Card title="用电构成" tag="行业">
          <div style={{display:'flex', justifyContent:'center', padding:'8px 0 14px'}}>
            <DonutChart data={[
              { name: '工业', value: 52, color: '#0A6CFF' },
              { name: '居民', value: 22, color: '#25C6FF' },
              { name: '商业', value: 16, color: '#2EE6D6' },
              { name: '农业', value: 6, color: '#9D7BFF' },
              { name: '其他', value: 4, color: '#FFAB2D' },
            ]}/>
          </div>
        </Card>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12}}>
        <Card title="分时段用电" tag="峰谷平">
          <div style={{display:'flex', flexDirection:'column', gap:14, paddingTop:6}}>
            {[
              { label:'峰段', percent:42, val:'52.4 亿', color:'var(--warning)', desc:'09:00-12:00, 17:00-22:00' },
              { label:'平段', percent:34, val:'42.4 亿', color:'var(--primary)', desc:'12:00-17:00, 22:00-23:00' },
              { label:'谷段', percent:24, val:'29.8 亿', color:'var(--info)', desc:'23:00-次日09:00' },
            ].map((d, i) => (
              <div key={i}>
                <div style={{display:'flex', justifyContent:'space-between', marginBottom:4}}>
                  <span style={{display:'inline-flex', alignItems:'center', gap:6}}>
                    <span style={{width:8, height:8, borderRadius:2, background:d.color, boxShadow:`0 0 4px ${d.color}`}}/>
                    <b style={{fontSize:13}}>{d.label}</b>
                    <span className="text-mute text-xs">{d.percent}%</span>
                  </span>
                  <span className="text-digit"><b>{d.val}</b> <span className="text-3 text-xs">kWh</span></span>
                </div>
                <div style={{height:8, background:'var(--bg-elevated)', borderRadius:4, overflow:'hidden'}}>
                  <div style={{
                    width:`${d.percent}%`, height:'100%',
                    background: `linear-gradient(90deg, ${d.color}, ${d.color}88)`,
                    boxShadow: `0 0 8px ${d.color}`,
                  }}/>
                </div>
                <div className="text-3 text-xs" style={{marginTop:3}}>{d.desc}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="变电站电量 TOP 5" tag="11月">
          <BarChart
            height={210}
            data={[28.4, 24.6, 22.1, 18.5, 14.3]}
            labels={['中心', '滨海', '东郊', '工业园', '北郊']}
            color="var(--info)"
            yUnit="亿kWh"/>
        </Card>

        <Card title="能效指标" tag="健康度">
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, padding:'8px 4px'}}>
            <div style={{textAlign:'center'}}>
              <Ring percent={96.18} value="96.18%" label="供电可靠率" size={100} color="var(--success)" thickness={6}/>
            </div>
            <div style={{textAlign:'center'}}>
              <Ring percent={99.8} value="99.8%" label="电压合格率" size={100} color="var(--info)" thickness={6}/>
            </div>
            <div style={{textAlign:'center'}}>
              <Ring percent={72.3} value="72.3%" label="设备利用率" size={100} color="var(--primary)" thickness={6}/>
            </div>
            <div style={{textAlign:'center'}}>
              <Ring percent={42.1} value="42.1%" label="清洁能源占比" size={100} color="var(--teal)" thickness={6}/>
            </div>
          </div>
        </Card>
      </div>

      {/* 报表表格 */}
      <Card title="月度统计明细" tag="2025-11">
        <table className="data">
          <thead>
            <tr>
              <th>统计指标</th>
              <th style={{textAlign:'right'}}>本月</th>
              <th style={{textAlign:'right'}}>上月</th>
              <th style={{textAlign:'right'}}>环比</th>
              <th style={{textAlign:'right'}}>去年同期</th>
              <th style={{textAlign:'right'}}>同比</th>
              <th>趋势</th>
            </tr>
          </thead>
          <tbody>
            {[
              { name:'总供电量', cur:'124.6 亿kWh', prev:'118.2 亿kWh', mom:5.4, prevY:'117.1 亿kWh', yoy:6.4, trend: genWave(12, 100, 8, 0), color:'var(--primary)' },
              { name:'总售电量', cur:'118.4 亿kWh', prev:'112.3 亿kWh', mom:5.4, prevY:'111.9 亿kWh', yoy:5.8, trend: genWave(12, 96, 7, 0), color:'var(--info)' },
              { name:'线损电量', cur:'4.76 亿kWh', prev:'4.59 亿kWh', mom:3.7, prevY:'4.92 亿kWh', yoy:-3.3, trend: genWave(12, 4, 0.3, 0), color:'var(--warning)' },
              { name:'清洁能源发电', cur:'42.1 亿kWh', prev:'38.6 亿kWh', mom:9.1, prevY:'35.5 亿kWh', yoy:18.6, trend: genWave(12, 35, 5, 0), color:'var(--success)' },
              { name:'最大负荷', cur:'2,386 MW', prev:'2,318 MW', mom:2.9, prevY:'2,248 MW', yoy:6.1, trend: genWave(12, 2300, 100, 0), color:'var(--purple)' },
              { name:'平均负荷率', cur:'72.3%', prev:'71.2%', mom:1.5, prevY:'69.8%', yoy:3.6, trend: genWave(12, 72, 2, 0), color:'var(--teal)' },
            ].map(r => (
              <tr key={r.name}>
                <td><b>{r.name}</b></td>
                <td className="text-digit" style={{textAlign:'right'}}>{r.cur}</td>
                <td className="text-digit text-3" style={{textAlign:'right'}}>{r.prev}</td>
                <td style={{textAlign:'right'}}><DeltaTag value={r.mom}/></td>
                <td className="text-digit text-3" style={{textAlign:'right'}}>{r.prevY}</td>
                <td style={{textAlign:'right'}}><DeltaTag value={r.yoy}/></td>
                <td style={{width:90}}>
                  <Sparkline data={r.trend} color={r.color} width={80} height={24}/>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function DeltaTag({ value, lowerIsBetter = false }) {
  const isUp = value >= 0;
  const good = lowerIsBetter ? !isUp : isUp;
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:2,
      color: good ? 'var(--success)' : 'var(--danger)',
      fontSize:12,
    }}>
      <Icon name={isUp ? 'trending' : 'trendingDown'} size={11}/>
      <span className="text-digit">{isUp ? '+' : ''}{value}%</span>
    </span>
  );
}

function DonutChart({ data, size = 200 }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const r = size/2 - 20;
  const C = 2 * Math.PI * r;
  let acc = 0;

  return (
    <div style={{position:'relative', width:size, height:size}}>
      <svg width={size} height={size} style={{transform:'rotate(-90deg)'}}>
        {data.map((d, i) => {
          const start = acc;
          const len = (d.value / total) * C;
          acc += d.value;
          return (
            <circle key={i}
                    cx={size/2} cy={size/2} r={r}
                    fill="none"
                    stroke={d.color}
                    strokeWidth="22"
                    strokeDasharray={`${len} ${C}`}
                    strokeDashoffset={-(start / total) * C}
                    style={{filter: `drop-shadow(0 0 4px ${d.color})`}}/>
          );
        })}
      </svg>
      <div style={{position:'absolute', inset:0, display:'grid', placeItems:'center', textAlign:'center'}}>
        <div>
          <div className="text-3 text-xs" style={{letterSpacing:1}}>累计</div>
          <div className="text-digit" style={{fontSize:24}}>{total}</div>
          <div className="text-3 text-xs">亿 kWh</div>
        </div>
      </div>
      <div style={{position:'absolute', right:-20, top:0, display:'flex', flexDirection:'column', gap:6, fontSize:11}}>
        {data.map((d, i) => (
          <div key={i} style={{display:'flex', alignItems:'center', gap:6}}>
            <span style={{width:8, height:8, background:d.color, borderRadius:2, boxShadow:`0 0 4px ${d.color}`}}/>
            <span style={{minWidth:34}}>{d.name}</span>
            <span className="text-digit text-3">{d.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

window.EnergyScreen = EnergyScreen;
})();
