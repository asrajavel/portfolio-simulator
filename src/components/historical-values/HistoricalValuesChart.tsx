import React from 'react';
import Highcharts from 'highcharts/highstock';
import HighchartsReact from 'highcharts-react-official';
import { Block } from 'baseui/block';
import { Instrument } from '../../types/instrument';
import { CHART_STYLES } from '../../constants';
import { STOCK_CHART_NAVIGATOR, STOCK_CHART_SCROLLBAR } from '../../utils/stockChartConfig';

interface HistoricalValuesChartProps {
  navDatas: Record<string, Array<{ date: Date; nav: number }>>;
  instruments: Instrument[];
  useLogScale?: boolean;
  colors: string[];
}

export const HistoricalValuesChart: React.FC<HistoricalValuesChartProps> = ({
  navDatas,
  instruments,
  useLogScale = false,
  colors
}) => {
  const series = instruments.map((instrument, idx) => {
    const navData = navDatas[instrument.id.toString()];
    return {
      name: instrument.name,
      data: navData.map(item => [item.date.getTime(), item.nav]),
      type: 'line',
      color: colors[idx % colors.length],
      marker: { enabled: false },
      showInNavigator: true,
    };
  });

  const chartOptions = {
    title: { text: '' },
    credits: { enabled: false },
    chart: {
      backgroundColor: CHART_STYLES.colors.background,
      borderRadius: 8,
      spacing: [20, 20, 20, 20],
      height: 500,
      zooming: { mouseWheel: false },
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
      type: useLogScale ? 'logarithmic' : 'linear',
      opposite: false,
      title: {
        text: 'Value',
        align: 'middle',
        rotation: -90,
        x: -10,
        style: CHART_STYLES.axisTitle
      },
      labels: {
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
          const color = point.series.color;
          tooltipHTML += `<span style="color:${color}">●</span> ${point.series.name}: <strong>${point.y.toFixed(4)}</strong><br/>`;
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
      }
    },
    series: series,
    legend: { 
      enabled: instruments.length > 1,
      itemStyle: CHART_STYLES.legend,
      itemHoverStyle: { color: '#1f2937' }
    }
  };

  return (
    <Block marginTop="1.5rem">
      <HighchartsReact
        highcharts={Highcharts}
        constructorType={'stockChart'}
        options={chartOptions}
      />
    </Block>
  );
};

