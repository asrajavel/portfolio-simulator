import React from 'react';
import Highcharts from 'highcharts/highstock';
import HighchartsReact from 'highcharts-react-official';
import { Block } from 'baseui/block';
import { HeadingXSmall } from 'baseui/typography';
import { DailyHoldingSnapshot } from '../../types/tracker';
import { CHART_STYLES, COLORS } from '../../constants';

interface HoldingXirrChartProps {
  name: string;
  snapshots: DailyHoldingSnapshot[];
}

export const HoldingXirrChart: React.FC<HoldingXirrChartProps> = ({ name, snapshots }) => {
  const xirrData = snapshots
    .filter((s) => !isNaN(s.xirr) && isFinite(s.xirr))
    .map((s) => [s.date.getTime(), s.xirr * 100]);

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
      labels: { style: CHART_STYLES.axisLabels, format: '{value:.0f}%' },
      gridLineColor: CHART_STYLES.colors.gridLine,
      opposite: false,
    },
    rangeSelector: { enabled: false },
    navigator: { enabled: false },
    scrollbar: { enabled: false },
    tooltip: {
      useHTML: true,
      backgroundColor: CHART_STYLES.colors.tooltipBackground,
      borderColor: CHART_STYLES.colors.tooltipBackground,
      borderRadius: 6,
      style: CHART_STYLES.tooltip,
      formatter: function (this: any) {
        return `<div style="font-size:12px;color:#fff"><strong>${Highcharts.dateFormat('%e %b %Y', this.x)}</strong><br/>XIRR: <strong>${this.y.toFixed(2)}%</strong></div>`;
      },
    },
    plotOptions: {
      series: {
        animation: false,
        marker: { enabled: false, states: { hover: { enabled: true, radius: 4 } } },
      },
    },
    series: [
      { type: 'line', name: 'XIRR', data: xirrData, color: COLORS[1], lineWidth: 1.5 },
    ],
    legend: { enabled: false },
  };

  return (
    <Block>
      <HeadingXSmall marginTop="scale300" marginBottom="0" paddingLeft="scale400">{name} XIRR</HeadingXSmall>
      <HighchartsReact highcharts={Highcharts} constructorType="stockChart" options={options} />
    </Block>
  );
};
