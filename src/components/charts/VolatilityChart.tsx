import React from 'react';
import Highcharts from 'highcharts/highstock';
import HighchartsReact from 'highcharts-react-official';
import { Block } from 'baseui/block';
import { CHART_STYLES } from '../../constants';
import { STOCK_CHART_NAVIGATOR, STOCK_CHART_SCROLLBAR, formatDate, getAllDates } from '../../utils/stockChartConfig';
import { HelpButton } from '../help';

interface VolatilityChartProps {
  sipStrategyXirrData: Record<string, any[]>;
  COLORS: string[];
  years: number;
}

  const getVolatilitySeries = (sipStrategyXirrData: Record<string, any[]>, COLORS: string[]) => {
    const allDates = getAllDates(sipStrategyXirrData);
    return Object.entries(sipStrategyXirrData).map(([strategyName, data], idx) => {
      const dateToVolatility: Record<string, number> = {};
      (data || []).forEach((row: any) => {
        if (row.volatility !== undefined) {
          dateToVolatility[formatDate(row.date)] = row.volatility;
        }
      });
      
      const seriesData = allDates.map(date => {
        const volatility = dateToVolatility[date];
        return volatility !== undefined ? {
          x: new Date(date).getTime(),
          y: volatility
        } : null;
      }).filter(point => point !== null);
    
    return {
      name: strategyName,
      data: seriesData,
      type: 'line',
      color: COLORS[idx % COLORS.length],
      marker: { enabled: false },
      showInNavigator: true,
    };
  });
};

const getChartOptions = (years: number, sipStrategyXirrData: Record<string, any[]>, COLORS: string[]) => ({
  title: { text: `Volatility (Annualized) - Rolling ${years}Y`, style: CHART_STYLES.title },
  credits: { enabled: false },
  chart: {
    backgroundColor: CHART_STYLES.colors.background,
    borderRadius: 8,
    spacing: [20, 20, 20, 20],
    height: 500,
    zooming: { mouseWheel: false }
  },
  legend: {
    enabled: true,
    itemStyle: CHART_STYLES.legend,
    itemHoverStyle: { color: '#1f2937' }
  },
  xAxis: {
    type: 'datetime',
    title: { text: 'Date', style: CHART_STYLES.axisTitle },
    labels: { style: CHART_STYLES.axisLabels },
    gridLineColor: CHART_STYLES.colors.gridLine,
    lineColor: CHART_STYLES.colors.line,
    tickColor: CHART_STYLES.colors.tick
  },
  yAxis: {
    opposite: false,
    title: {
      text: 'Volatility (%)',
      align: 'middle',
      rotation: -90,
      x: -10,
      style: CHART_STYLES.axisTitle
    },
    labels: {
      formatter: function (this: any) { return this.value.toFixed(2) + ' %'; },
      style: CHART_STYLES.axisLabels
    },
    gridLineColor: CHART_STYLES.colors.gridLine,
    lineColor: CHART_STYLES.colors.line
  },
  rangeSelector: { enabled: false },
  navigator: STOCK_CHART_NAVIGATOR,
  scrollbar: STOCK_CHART_SCROLLBAR,
  tooltip: {
    shared: true,
    crosshairs: true,
    useHTML: true,
    backgroundColor: CHART_STYLES.colors.tooltipBackground,
    borderColor: CHART_STYLES.colors.tooltipBackground,
    borderRadius: 6,
    style: CHART_STYLES.tooltip,
    formatter: function (this: any) {
      let tooltipHTML = `<div style="font-size: 12px; color: #ffffff;"><strong>${Highcharts.dateFormat('%e %b %Y', this.x)}</strong><br/>`;
      
      const sortedPoints = this.points ? 
        [...this.points].sort((a: any, b: any) => (b.y as number) - (a.y as number)) : [];
      
         sortedPoints.forEach((point: any) => {
           const formattedValue = (point.y as number).toFixed(2) + " %";
           const color = point.series.color;
           tooltipHTML += `<span style="color:${color}">●</span> ${point.series.name}: <strong>${formattedValue}</strong><br/>`;
         });
      
      return tooltipHTML + '</div>';
    }
  },
  plotOptions: {
    series: {
      animation: false,
      marker: { 
        enabled: false,
        states: { hover: { enabled: true, radius: 5 } }
      },
      states: { hover: { lineWidthPlus: 1 } }
    }
  },
  series: getVolatilitySeries(sipStrategyXirrData, COLORS)
});

export const VolatilityChart: React.FC<VolatilityChartProps> = ({ sipStrategyXirrData, COLORS, years }) => {
  // Check if any strategy has volatility data
  const hasVolatilityData = Object.values(sipStrategyXirrData).some(data => 
    Array.isArray(data) && data.some(row => row.volatility !== undefined)
  );

  if (!hasVolatilityData) return null;

  const chartOptions = getChartOptions(years, sipStrategyXirrData, COLORS);

  return (
    <Block marginTop="2rem" position="relative">
      <Block position="absolute" top="8px" right="8px" $style={{ zIndex: 10 }}>
        <HelpButton topic="volatility" />
      </Block>
      <HighchartsReact
        highcharts={Highcharts}
        constructorType={'stockChart'}
        options={chartOptions}
      />
    </Block>
  );
};

