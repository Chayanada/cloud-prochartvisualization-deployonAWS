import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import * as ti from 'technicalindicators';
import MainChart from './components/MainChart';
import IndicatorChart from './components/IndicatorChart';
import './App.css';

const INITIAL_INDICATORS = [
  { id: 'ema', name: 'EMA', color: '#f7aef8' },
  { id: 'bb', name: 'Bollinger Bands', color: '#f7aef8' },
  { id: 'macd', name: 'MACD' },
  { id: 'rsi', name: 'RSI', color: '#b388eb' },
  { id: 'stoch', name: 'Stochastic' },
];

function App() {
  const [rawData, setRawData] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeIndicators, setActiveIndicators] = useState({
    ema: false, macd: false, rsi: false, bb: false, stoch: false,
  });
  const [emaPeriod, setEmaPeriod] = useState(20);
  const [rsiPeriod, setRsiPeriod] = useState(14);
  const [theme, setTheme] = useState('dark');
  const [indicators, setIndicators] = useState(INITIAL_INDICATORS);
  const mainChartRef = useRef(null);
  const [priceColor, setPriceColor] = useState('#72ddf7');

  useEffect(() => {
    if (!rawData) return;
    try {
      const ema = ti.EMA.calculate({ period: emaPeriod, values: rawData.prices });
      const rsi = ti.RSI.calculate({ period: rsiPeriod, values: rawData.prices });
      const macd = ti.MACD.calculate({ values: rawData.prices, fastPeriod: 12, slowPeriod: 26, signalPeriod: 9, SimpleMAOscillator: false, SimpleMASignal: false });
      const bb = ti.BollingerBands.calculate({ period: 20, values: rawData.prices, stdDev: 2 });
      const stochastic = ti.Stochastic.calculate({ high: rawData.highPrices, low: rawData.lowPrices, close: rawData.prices, period: 14, signalPeriod: 3 });
      setChartData({
        labels: rawData.labels,
        prices: rawData.prices,
        indicators: { ema, rsi, macd, bb, stochastic }
      });
      setError('');
    } catch (e) {
      console.error("Error calculating indicators:", e);
      setError("Calculation Error: Please check data file or indicator periods.");
      setChartData(null);
    }
  }, [rawData, emaPeriod, rsiPeriod]);

  useEffect(() => {
    document.body.className = '';
    document.body.classList.add(`${theme}-theme`);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'dark' ? 'light' : 'dark');
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setIsLoading(true);
    setError('');
    setRawData(null);
    setChartData(null);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const response = await axios.post('http://localhost:3001/api/upload', formData);
      setRawData(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to process the file.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleIndicatorToggle = (indicatorId) => setActiveIndicators(prev => ({ ...prev, [indicatorId]: !prev[indicatorId] }));

  const handleColorChange = (indicatorId, newColor) => {
    setIndicators(prevIndicators => 
      prevIndicators.map(ind => 
        ind.id === indicatorId ? { ...ind, color: newColor } : ind
      )
    );
  };

  const handlePriceColorChange = (event) => {
    setPriceColor(event.target.value);
  };

  const handleSaveChart = () => {
    if (mainChartRef.current) {
      const link = document.createElement('a');
      link.download = 'pro-chart.png';
      link.href = mainChartRef.current.toBase64Image('image/png', 1);
      link.click();
    }
  };

  const getMainChartData = () => {
    if (!chartData) return null;
    let datasets = [{
      label: 'Price', data: chartData.prices, borderColor: priceColor, borderWidth: 2, pointRadius: 0
    }];
    
    if (activeIndicators.ema && chartData.indicators.ema) {
      const emaColor = indicators.find(ind => ind.id === 'ema').color;
      datasets.push({ label: `EMA (${emaPeriod})`, data: chartData.indicators.ema, borderColor: emaColor, borderWidth: 1.5, pointRadius: 0 });
    }
    if (activeIndicators.bb && chartData.indicators.bb) {
      const { bb } = chartData.indicators;
      const bbColor = indicators.find(ind => ind.id === 'bb').color;
      datasets.push(
        { label: 'BB Upper', data: bb.map(d => d.upper), borderColor: '#fdc5f5', borderWidth: 1, pointRadius: 0 },
        { label: 'BB Middle', data: bb.map(d => d.middle), borderColor: bbColor, borderWidth: 1.5, pointRadius: 0, borderDash: [5, 5] },
        { label: 'BB Lower', data: bb.map(d => d.lower), borderColor: '#fdc5f5', borderWidth: 1, pointRadius: 0 }
      );
    }
    return { labels: chartData.labels, datasets };
  };
  
  const getRsiData = () => {
    if (!chartData || !chartData.indicators.rsi) return null;
    const { rsi } = chartData.indicators;
    const rsiColor = indicators.find(ind => ind.id === 'rsi').color;
    const labels = rsi.length > 0 ? chartData.labels.slice(-rsi.length) : [];
    return {
      labels,
      datasets: [{ label: `RSI (${rsiPeriod})`, data: rsi, borderColor: rsiColor, borderWidth: 1.5, pointRadius: 0 }]
    };
  };

  const getMacdData = () => {
    if (!chartData || !chartData.indicators.macd) return null;
    const { macd } = chartData.indicators;
    const labels = macd.length > 0 ? chartData.labels.slice(-macd.length) : [];
    return {
      labels,
      datasets: [
        { type: 'bar', label: 'Histogram', data: macd.map(d => d.histogram), backgroundColor: (ctx) => (ctx.raw >= 0 ? '#72ddf780' : '#f7aef880') },
        { type: 'line', label: 'MACD', data: macd.map(d => d.MACD), borderColor: '#8093f1', borderWidth: 1.5, pointRadius: 0 },
        { type: 'line', label: 'Signal', data: macd.map(d => d.signal), borderColor: '#f7aef8', borderWidth: 1.5, pointRadius: 0 }
      ]
    };
  };
  
  const getStochasticData = () => {
    if (!chartData || !chartData.indicators.stochastic) return null;
    const { stochastic } = chartData.indicators;
    const labels = stochastic.length > 0 ? chartData.labels.slice(-stochastic.length) : [];
    return {
      labels,
      datasets: [
        { label: '%K', data: stochastic.map(d => d.k), borderColor: '#8093f1', borderWidth: 1.5, pointRadius: 0 },
        { label: '%D', data: stochastic.map(d => d.d), borderColor: '#f7aef8', borderWidth: 1.5, pointRadius: 0, borderDash: [5, 5] }
      ]
    };
  };

  return (
    <div className={rawData ? "container loaded" : "container initial"}>
      <header className="header">
        <h1>Pro Chart Visualizer</h1>
        <button onClick={toggleTheme} className="theme-toggle-button">
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
        <div className="upload-area">
          <label htmlFor="file-upload" className="file-input-label">
            {isLoading ? 'Processing...' : 'Select Chart File'}
          </label>
          <input id="file-upload" type="file" onChange={handleFileChange} disabled={isLoading} />
        </div>
        {error && <p style={{color: '#ef5050'}}>{error}</p>}
      </header>

      {rawData && chartData && (
        <>
          <div className="settings-panel">
            <div className="setting-item">
              <label htmlFor="price-color">Price Color</label>
              <input 
                type="color" 
                id="price-color"
                value={priceColor}
                onChange={handlePriceColorChange}
                className="color-picker-main" 
              />
            </div>
            <div className="setting-item">
              <label htmlFor="ema-period">EMA Period (1-200)</label>
              <input 
                type="number" 
                id="ema-period" 
                value={emaPeriod}
                onChange={(e) => {
                  const value = Math.min(200, Math.max(1, parseInt(e.target.value) || 1));
                  setEmaPeriod(value);
                }}
              />
            </div>
            <div className="setting-item">
              <label htmlFor="rsi-period">RSI Period (1-50)</label>
              <input 
                type="number" 
                id="rsi-period" 
                value={rsiPeriod}
                onChange={(e) => {
                  const value = Math.min(50, Math.max(1, parseInt(e.target.value) || 1));
                  setRsiPeriod(value);
                }}
              />
            </div>
          </div>
          <div className="controls">
            {indicators.map(ind => (
              <div key={ind.id} className="control-toggle">
                {ind.color && (
                  <input 
                    type="color" 
                    value={ind.color}
                    onChange={(e) => handleColorChange(ind.id, e.target.value)}
                    className="color-picker"
                  />
                )}
                <input type="checkbox" id={ind.id} checked={activeIndicators[ind.id]} onChange={() => handleIndicatorToggle(ind.id)} />
                <label htmlFor={ind.id}>{ind.name}</label>
              </div>
            ))}
          </div>
          <div className="chart-area">
            <button onClick={handleSaveChart} className="save-chart-button">
              Save Chart
            </button>
            <MainChart 
              ref={mainChartRef} 
              key={theme} 
              theme={theme} 
              chartData={getMainChartData()} 
            />
            {activeIndicators.macd && <IndicatorChart key={`${theme}-macd`} theme={theme} chartData={getMacdData()} title="MACD" />}
            {activeIndicators.rsi && <IndicatorChart key={`${theme}-rsi`} theme={theme} chartData={getRsiData()} title="RSI" />}
            {activeIndicators.stoch && <IndicatorChart key={`${theme}-stoch`} theme={theme} chartData={getStochasticData()} title="Stochastic (14, 3)" />}
          </div>
        </>
      )}
    </div>
  );
}

export default App;