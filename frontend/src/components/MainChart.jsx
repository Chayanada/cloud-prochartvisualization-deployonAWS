import React, { forwardRef } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';
import CrosshairPlugin from 'chartjs-plugin-crosshair';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, zoomPlugin, CrosshairPlugin);

const MainChart = forwardRef(({ chartData, theme }, ref) => {
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
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { 
        labels: { 
          color: primaryTextColor
        } 
      },
      title: { 
        display: true, 
        text: 'Price Chart', 
        color: primaryTextColor,
        font: { size: 18 } 
      },
      zoom: {
        pan: { enabled: true, mode: 'x' },
        zoom: { wheel: { enabled: true }, pinch: { enabled: true }, mode: 'x' }
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
          color: secondaryTextColor,
          maxTicksLimit: 12 
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

  return (
    <div style={{ height: '450px' }}>
      <Line ref={ref} options={options} data={chartData} />
    </div>
  );
});

export default MainChart;