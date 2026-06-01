/* global React, Icon, Card, KPI, LineChart, BarChart, genWave */
// 负荷预测与分析
(() => {
const { useState, useMemo } = React;

function LoadScreen() {
  const [range, setRange] = useState('24h');
  const [model, setModel] = useState('LSTM-v3');

  const labels24 = Array.from({length:24}, (_, i) => String(i).padStart(2,'0')+':00');
  const actual = useMemo(() => genWave(24, 1850, 380, -1, 0.06), []);
  const predicted = useMemo(() => genWave(24, 1900, 400, -1, 0.04), []);
  const ai = useMemo(() => genWave(24, 1880, 390, -1, 0.03), []);

  // 7天对比
  const days = ['周一','周二','周三','周四','周五','周六','周日'];
  const peakData = [2120, 2245, 2310, 2280, 2380, 2150, 1980];

  return (
    <div className="fade-in" style={{display:'flex', flexDirection:'column', gap:12}}>
      {/* 顶部 KPI */}
      <div style={{display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:12}}>
        <KPI label="当前负荷" value="2,041" unit="MW" delta={3.2} deltaLabel="同比" color="var(--primary)"/>
        <KPI label="今日峰值" value="2,386" unit="MW" delta={5.8} deltaLabel="预测" color="var(--warning)"/>
        <KPI label="今日谷值" value="1,247" unit="MW" delta={-2.1} deltaLabel="预测" color="var(--info)"/>
        <KPI label="峰谷差" value="1,139" unit="MW" color="var(--purple)" status="正常"/>
        <KPI label="预测准确率" value="97.8" unit="%" delta={0.4} deltaLabel="本周" color="var(--success)" status={`${model}`}/>
      </div>

      {/* 主图: 负荷预测对比 */}
      <Card title="负荷预测对比" tag={range.toUpperCase()}
            actions={<>
              <div style={{display:'flex', background:'var(--bg-elevated)', borderRadius:'var(--r-sm)', padding:2}}>
                {['24h','7d','30d'].map(r => (
                  <button key={r}
                          onClick={() => setRange(r)}
                          className={`btn sm ${range === r ? 'primary' : 'ghost'}`}
                          style={{borderRadius:3, padding:'3px 12px'}}>{r.toUpperCase()}</button>
                ))}
              </div>
              <select className="btn" value={model} onChange={e=>setModel(e.target.value)} style={{padding:'5px 10px'}}>
                <option>LSTM-v3</option>
                <option>XGBoost-2</option>
                <option>Prophet</option>
              </select>
              <button className="btn"><Icon name="refresh" size={13}/> 重新预测</button>
              <button className="btn"><Icon name="download" size={13}/></button>
            </>}>
        <div style={{display:'flex', gap:16, marginBottom:8}}>
          <Legend color="#0A6CFF" label="实际负荷" glow/>
          <Legend color="#FFAB2D" label="传统预测" dashed/>
          <Legend color="#2EE6D6" label="AI 预测" glow/>
        </div>
        <LineChart
          height={300}
          labels={labels24}
          yUnit="MW"
          series={[
            { name: '实际负荷', data: actual, color: '#0A6CFF', glow: true },
            { name: '传统预测', data: predicted, color: '#FFAB2D', dashed: true },
            { name: 'AI 预测 (LSTM)', data: ai, color: '#2EE6D6', glow: true },
          ]}/>
      </Card>

      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
        <Card title="周峰值趋势" tag="WEEKLY">
          <BarChart
            height={220}
            data={peakData}
            labels={days}
            color="var(--primary)"
            yUnit="MW"/>
        </Card>

        <Card title="影响因子分析" tag="AI 解释">
          <div style={{display:'flex', flexDirection:'column', gap:10}}>
            {[
              { label: '气温 (28°C)', impact: 86, color: 'var(--warning)', desc: '高温推高空调负荷' },
              { label: '工作日效应', impact: 72, color: 'var(--primary)', desc: '周三工业负荷高位' },
              { label: '节假日影响', impact: -18, color: 'var(--info)', desc: '无节假日影响' },
              { label: '光照强度', impact: -42, color: 'var(--success)', desc: '光伏出力增加,净负荷下降' },
              { label: '历史趋势', impact: 35, color: 'var(--purple)', desc: '同期负荷年增长 3.2%' },
            ].map((f, i) => (
              <div key={i}>
                <div style={{display:'flex', justifyContent:'space-between', marginBottom:4}}>
                  <span style={{fontSize:13}}>{f.label}</span>
                  <span style={{color: f.color, fontSize:12}} className="text-digit">
                    {f.impact >= 0 ? '+' : ''}{f.impact}%
                  </span>
                </div>
                <div style={{height:5, background:'var(--bg-elevated)', borderRadius:3, position:'relative', overflow:'hidden'}}>
                  <div style={{
                    position:'absolute',
                    left: f.impact >= 0 ? '50%' : `${50 + f.impact/2}%`,
                    width: `${Math.abs(f.impact)/2}%`,
                    height:'100%',
                    background: f.color,
                    boxShadow: `0 0 6px ${f.color}`,
                  }}/>
                  <div style={{position:'absolute', left:'50%', top:0, bottom:0, width:1, background:'var(--border-strong)'}}/>
                </div>
                <div className="text-3 text-xs" style={{marginTop:3}}>{f.desc}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card title="区域负荷热度排行" tag="实时">
        <table className="data">
          <thead>
            <tr>
              <th style={{width:40}}>#</th>
              <th>区域</th>
              <th>当前负荷</th>
              <th>容量上限</th>
              <th>负载率</th>
              <th>较昨日</th>
              <th>峰值预计</th>
              <th>建议</th>
            </tr>
          </thead>
          <tbody>
            {[
              { rank:1, name:'滨海开发区', cur:524, cap:580, ratio:90.3, delta:8.2, peak:'18:30', adv:'建议错峰', advC: 'warning' },
              { rank:2, name:'中心城区', cur:542, cap:720, ratio:75.3, delta:4.1, peak:'19:00', adv:'正常', advC:'success' },
              { rank:3, name:'东部新城', cur:386, cap:480, ratio:80.4, delta:5.6, peak:'18:45', adv:'关注', advC:'info' },
              { rank:4, name:'北部产业园', cur:412, cap:580, ratio:71.0, delta:-1.2, peak:'14:30', adv:'正常', advC:'success' },
              { rank:5, name:'西部新区', cur:196, cap:280, ratio:70.0, delta:3.8, peak:'19:15', adv:'正常', advC:'success' },
            ].map(r => (
              <tr key={r.rank}>
                <td><b className="text-digit text-3">#{r.rank}</b></td>
                <td><b>{r.name}</b></td>
                <td className="text-digit"><b>{r.cur}</b> <span className="text-3 text-xs">MW</span></td>
                <td className="text-digit text-3">{r.cap} MW</td>
                <td>
                  <div style={{display:'flex',alignItems:'center', gap:8}}>
                    <div style={{flex:1, maxWidth:120, height:5, background:'var(--bg-elevated)', borderRadius:3, overflow:'hidden'}}>
                      <div style={{width:`${r.ratio}%`, height:'100%', background: r.ratio > 85 ? 'var(--warning)' : 'var(--primary)', boxShadow:'0 0 6px currentColor'}}/>
                    </div>
                    <span className="text-digit text-xs">{r.ratio}%</span>
                  </div>
                </td>
                <td><span className={r.delta >= 0 ? 'chip warning' : 'chip success'}>{r.delta >= 0 ? '+' : ''}{r.delta}%</span></td>
                <td className="text-digit">{r.peak}</td>
                <td><span className={`chip ${r.advC}`}>{r.adv}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function Legend({ color, label, glow, dashed }) {
  return (
    <span style={{display:'inline-flex', alignItems:'center', gap:6, fontSize:12, color:'var(--text-2)'}}>
      <span style={{
        width:16, height:2, background: color,
        boxShadow: glow ? `0 0 6px ${color}` : 'none',
        borderRadius:1,
        backgroundImage: dashed ? `repeating-linear-gradient(90deg, ${color} 0 4px, transparent 4px 8px)` : undefined,
        background: dashed ? `repeating-linear-gradient(90deg, ${color} 0 4px, transparent 4px 8px)` : color,
      }}/>
      {label}
    </span>
  );
}

window.LoadScreen = LoadScreen;
})();
