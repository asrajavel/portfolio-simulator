import React from 'react';
import Highcharts from 'highcharts/highstock';
import HighchartsReact from 'highcharts-react-official';
import { Block } from 'baseui/block';
import { HeadingXSmall } from 'baseui/typography';
import { DailyGoalSnapshot } from '../../types/tracker';
import { CHART_STYLES, COLORS } from '../../constants';
import { STOCK_CHART_NAVIGATOR, STOCK_CHART_SCROLLBAR } from '../../utils/stockChartConfig';

interface AllocationChartProps {
  snapshots: DailyGoalSnapshot[];
  holdingNames: string[];
}

export const AllocationChart: React.FC<AllocationChartProps> = ({ snapshots, holdingNames }) => {
  const series = holdingNames.map((name, idx) => ({
    type: 'area' as const,
    name,
    data: snapshots.map((s) => {
      const val = s.holdingValues[name] || 0;
      const pct = s.totalValue > 0 ? (val / s.totalValue) * 100 : 0;
      return [s.date.getTime(), pct];
    }),
    color: COLORS[idx % COLORS.length],
    fillOpacity: 0.6,
    lineWidth: 0,
    showInNavigator: idx === 0,
    marker: { enabled: false },
  }));

  const options: Highcharts.Options = {
    title: { text: undefined },
    credits: { enabled: false },
    chart: {
      backgroundColor: CHART_STYLES.colors.background,
      borderRadius: 8,
      spacing: [10, 20, 20, 20],
      height: 300,
      zooming: { mouseWheel: false },
    },
    xAxis: {
      type: 'datetime',
      labels: { style: CHART_STYLES.axisLabels },
      gridLineColor: CHART_STYLES.colors.gridLine,
      lineColor: CHART_STYLES.colors.line,
      tickColor: CHART_STYLES.colors.tick,
    },
    yAxis: {
      title: { text: '' },
      labels: { style: CHART_STYLES.axisLabels, format: '{value}%' },
      max: 100,
      min: 0,
      gridLineColor: CHART_STYLES.colors.gridLine,
      opposite: false,
    },
    rangeSelector: { enabled: false },
    navigator: STOCK_CHART_NAVIGATOR,
    scrollbar: STOCK_CHART_SCROLLBAR,
    plotOptions: {
      area: { stacking: 'normal', animation: false, marker: { enabled: false } },
    },
    tooltip: {
      shared: true,
      useHTML: true,
      backgroundColor: CHART_STYLES.colors.tooltipBackground,
      borderColor: CHART_STYLES.colors.tooltipBackground,
      borderRadius: 6,
      style: CHART_STYLES.tooltip,
      formatter: function (this: any) {
        let html = `<div style="font-size:12px;color:#fff"><strong>${Highcharts.dateFormat('%e %b %Y', this.x)}</strong><br/>`;
        for (const point of (this.points || []).slice().reverse()) {
          html += `<span style="color:${point.series.color}">●</span> ${point.series.name}: <strong>${point.y.toFixed(1)}%</strong><br/>`;
        }
        return html + '</div>';
      },
    },
    series,
    legend: { enabled: true, itemStyle: CHART_STYLES.legend },
  };

  return (
    <Block>
      <HeadingXSmall marginTop="scale300" marginBottom="0" paddingLeft="scale400">Asset Allocation</HeadingXSmall>
      <HighchartsReact highcharts={Highcharts} constructorType="stockChart" options={options} />
    </Block>
  );
};
