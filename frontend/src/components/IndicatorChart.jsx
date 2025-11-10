import React from 'react';
import { Bar, Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import CrosshairPlugin from 'chartjs-plugin-crosshair';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend, CrosshairPlugin);

const IndicatorChart = ({ chartData, title, theme }) => {
  if (!chartData || !chartData.datasets) {
    return null;
  }

  const isDark = theme === 'dark';
  const primaryTextColor = isDark ? '#e0e0ff' : '#1f1f1f';
  const secondaryTextColor = isDark ? '#a0a0c0' : '#595959';
  const crosshairColor = isDark ? 'rgba(224, 224, 255, 0.6)' : 'rgba(100, 100, 100, 0.6)';

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false
    },
    plugins: {
      legend: { 
        display: true, 
        labels: { 
          color: primaryTextColor
        } 
      },
      title: { 
        display: true, 
        text: title, 
        color: primaryTextColor,
        font: { size: 16 } 
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += Number(context.parsed.y).toFixed(3);
            }
            return label;
          }
        }
      },
      crosshair: {
        line: {
          color: crosshairColor,
          width: 1,
          dashPattern: [5, 5]
        },
        sync: {
          enabled: true
        },
        zoom: {
          enabled: false
        }
      }
    },
    scales: {
      x: { 
        ticks: { 
          display: false 
        }, 
        grid: { color: 'var(--border-color)' } 
      },
      y: { 
        ticks: { 
          color: secondaryTextColor,
          callback: function(value) {
            return Number(value).toFixed(3);
          }
        }, 
        grid: { color: 'var(--border-color)' } 
      }
    }
  };

  const hasBarData = chartData.datasets.some(d => d.type === 'bar');

  return (
    <div style={{ height: '200px', marginTop: '1rem', width: '100%' }}>
      {hasBarData ? <Bar options={options} data={chartData} /> : <Line options={options} data={chartData} />}
    </div>
  );
};

export default IndicatorChart;