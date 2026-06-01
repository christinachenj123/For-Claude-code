/* global React, ReactDOM, Sidebar, Topbar,
   DashboardScreen, DevicesScreen, LoadScreen, AlertsScreen, TicketsScreen, EnergyScreen, RenewableScreen,
   TweaksPanel, useTweaks, TweakSection, TweakColor, TweakRadio, TweakSelect */
(() => {
const { useState, useEffect } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "primaryColor": "#0A6CFF",
  "theme": "dark",
  "density": "default",
  "radius": "default",
  "chartStyle": "smooth"
}/*EDITMODE-END*/;

// 颜色调色板 (HEX -> oklch hover/active 计算太复杂, 用预设主色)
const COLOR_MAP = {
  '#0A6CFF': { primary: '#0A6CFF', hover: '#2D85FF', active: '#0856D6', glow: 'rgba(10,108,255,0.45)', soft: 'rgba(10,108,255,0.12)', border: 'rgba(10,108,255,0.32)' },
  '#25C6FF': { primary: '#25C6FF', hover: '#4FD4FF', active: '#0AA3DB', glow: 'rgba(37,198,255,0.5)', soft: 'rgba(37,198,255,0.14)', border: 'rgba(37,198,255,0.36)' },
  '#2EE6D6': { primary: '#2EE6D6', hover: '#5BF0E2', active: '#13C2B2', glow: 'rgba(46,230,214,0.5)', soft: 'rgba(46,230,214,0.14)', border: 'rgba(46,230,214,0.36)' },
  '#9D7BFF': { primary: '#9D7BFF', hover: '#B59DFF', active: '#7855E0', glow: 'rgba(157,123,255,0.5)', soft: 'rgba(157,123,255,0.14)', border: 'rgba(157,123,255,0.36)' },
};

function App() {
  const [active, setActive] = useState('dashboard');
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  // 应用主题
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', t.theme);
    root.setAttribute('data-density', t.density);
    root.setAttribute('data-radius', t.radius);

    const c = COLOR_MAP[t.primaryColor] || COLOR_MAP['#0A6CFF'];
    root.style.setProperty('--primary', c.primary);
    root.style.setProperty('--primary-hover', c.hover);
    root.style.setProperty('--primary-active', c.active);
    root.style.setProperty('--primary-glow', c.glow);
    root.style.setProperty('--primary-soft', c.soft);
    root.style.setProperty('--primary-border', c.border);
    root.style.setProperty('--chart-1', c.primary);
  }, [t]);

  const Screen = {
    dashboard: DashboardScreen,
    devices: DevicesScreen,
    load: LoadScreen,
    alerts: AlertsScreen,
    tickets: TicketsScreen,
    energy: EnergyScreen,
    renewable: RenewableScreen,
  }[active] || DashboardScreen;

  return (
    <div className="app" data-screen-label={active}>
      <Sidebar active={active} onChange={setActive}/>
      <Topbar active={active}/>
      <main className="main">
        <Screen key={active}/>
      </main>

      <TweaksPanel title="Tweaks" defaultOpen={false}>
        <TweakSection title="主色调">
          <TweakColor
            label="主色"
            value={t.primaryColor}
            onChange={v => setTweak('primaryColor', v)}
            options={['#0A6CFF', '#25C6FF', '#2EE6D6', '#9D7BFF']}/>
        </TweakSection>

        <TweakSection title="主题">
          <TweakRadio
            label="深浅主题"
            value={t.theme}
            onChange={v => setTweak('theme', v)}
            options={[
              { value: 'dark', label: '深色' },
              { value: 'light', label: '浅色' },
            ]}/>
        </TweakSection>

        <TweakSection title="界面密度">
          <TweakRadio
            label="字号 / 间距"
            value={t.density}
            onChange={v => setTweak('density', v)}
            options={[
              { value: 'compact', label: '紧凑' },
              { value: 'default', label: '标准' },
              { value: 'comfortable', label: '宽松' },
            ]}/>
        </TweakSection>

        <TweakSection title="圆角">
          <TweakRadio
            label="圆角风格"
            value={t.radius}
            onChange={v => setTweak('radius', v)}
            options={[
              { value: 'sharp', label: '直角' },
              { value: 'default', label: '标准' },
              { value: 'soft', label: '柔和' },
            ]}/>
        </TweakSection>

        <TweakSection title="图表">
          <TweakRadio
            label="曲线样式"
            value={t.chartStyle}
            onChange={v => setTweak('chartStyle', v)}
            options={[
              { value: 'smooth', label: '平滑' },
              { value: 'linear', label: '折线' },
            ]}/>
        </TweakSection>
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
})();
