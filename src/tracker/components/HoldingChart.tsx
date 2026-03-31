import React from 'react';
import Highcharts from 'highcharts/highstock';
import HighchartsReact from 'highcharts-react-official';
import { Block } from 'baseui/block';
import { HeadingXSmall } from 'baseui/typography';
import { DailyHoldingSnapshot } from '../../types/tracker';
import { CHART_STYLES, COLORS } from '../../constants';
import { formatNumber } from '../../utils/numberFormat';

interface HoldingChartProps {
  name: string;
  snapshots: DailyHoldingSnapshot[];
}

export const HoldingChart: React.FC<HoldingChartProps> = ({ name, snapshots }) => {
  const investmentData = snapshots.map((s) => [s.date.getTime(), s.cumInv]);
  const valueData = snapshots.map((s) => [s.date.getTime(), s.totalValue]);

  const options: Highcharts.Options = {
    title: { text: undefined },
    credits: { enabled: false },
    chart: {
      backgroundColor: CHART_STYLES.colors.background,
      borderRadius: 8,
      spacing: [10, 20, 20, 20],
      height: 250,
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
      labels: {
        style: CHART_STYLES.axisLabels,
        formatter: function (this: Highcharts.AxisLabelsFormatterContextObject) {
          return formatNumber(this.value as number);
        },
      },
      gridLineColor: CHART_STYLES.colors.gridLine,
      opposite: false,
    },
    rangeSelector: { enabled: false },
    navigator: { enabled: false },
    scrollbar: { enabled: false },
    tooltip: {
      shared: true,
      crosshairs: true,
      useHTML: true,
      backgroundColor: CHART_STYLES.colors.tooltipBackground,
      borderColor: CHART_STYLES.colors.tooltipBackground,
      borderRadius: 6,
      style: CHART_STYLES.tooltip,
      formatter: function (this: any) {
        let html = `<div style="font-size:12px;color:#fff"><strong>${Highcharts.dateFormat('%e %b %Y', this.x)}</strong><br/>`;
        for (const point of this.points || []) {
          html += `<span style="color:${point.series.color}">●</span> ${point.series.name}: <strong>${formatNumber(Math.round(point.y))}</strong><br/>`;
        }
        return html + '</div>';
      },
    },
    plotOptions: {
      series: {
        animation: false,
        marker: { enabled: false, states: { hover: { enabled: true, radius: 4 } } },
      },
    },
    series: [
      { type: 'line', name: 'Investment', data: investmentData, color: '#5A5A5A', lineWidth: 1.5 },
      { type: 'line', name: 'Value', data: valueData, color: COLORS[0], lineWidth: 1.5 },
    ],
    legend: { enabled: false },
  };

  return (
    <Block>
      <HeadingXSmall marginTop="scale300" marginBottom="0" paddingLeft="scale400">{name}</HeadingXSmall>
      <HighchartsReact highcharts={Highcharts} constructorType="stockChart" options={options} />
    </Block>
  );
};
