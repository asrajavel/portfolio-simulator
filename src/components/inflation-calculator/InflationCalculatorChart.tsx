import React, { useMemo } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { Block } from 'baseui/block';
import { CHART_STYLES, COLORS } from '../../constants';
import { formatCurrency } from '../../utils/numberFormat';
import { YearlyValue } from '../../hooks/useInflationCalculator';

interface InflationCalculatorChartProps {
  data: YearlyValue[];
  selectedYear: number;
  amount: number;
}

export const InflationCalculatorChart: React.FC<InflationCalculatorChartProps> = ({
  data,
  selectedYear,
  amount,
}) => {
  const chartOptions = useMemo<Highcharts.Options>(() => {
    const anchorIndex = data.findIndex((d) => d.year === selectedYear);

    const seriesData = data.map((d, i) => ({
      x: d.year,
      y: Math.round(d.value * 100) / 100,
      marker:
        i === anchorIndex
          ? { enabled: true, radius: 8, symbol: 'circle', fillColor: '#e91e63', lineColor: '#ffffff', lineWidth: 2 }
          : undefined,
    }));

    return {
      chart: {
        type: 'areaspline',
        backgroundColor: CHART_STYLES.colors.background,
        borderRadius: 8,
        spacing: [20, 20, 20, 20],
        height: 500,
        zooming: { type: 'x' },
      },
      title: { text: 'Purchasing Power Over Time', style: CHART_STYLES.title },
      credits: { enabled: false },
      xAxis: {
        title: { text: 'Year', style: CHART_STYLES.axisTitle },
        labels: { style: CHART_STYLES.axisLabels, format: '{value}' },
        gridLineColor: CHART_STYLES.colors.gridLine,
        lineColor: CHART_STYLES.colors.line,
        tickColor: CHART_STYLES.colors.tick,
        allowDecimals: false,
        plotLines: [
          {
            color: '#e91e63',
            width: 2,
            value: selectedYear,
            dashStyle: 'Dash',
            zIndex: 5,
            label: {
              text: `${selectedYear}`,
              style: { color: '#e91e63', fontWeight: '600', fontSize: '12px' },
            },
          },
        ],
      },
      yAxis: {
        title: { text: 'Equivalent Amount (₹)', style: CHART_STYLES.axisTitle },
        labels: {
          style: CHART_STYLES.axisLabels,
          formatter: function (this: any) {
            return '₹' + new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(this.value);
          },
        },
        gridLineColor: CHART_STYLES.colors.gridLine,
        lineColor: CHART_STYLES.colors.line,
      },
      tooltip: {
        useHTML: true,
        backgroundColor: CHART_STYLES.colors.tooltipBackground,
        borderColor: CHART_STYLES.colors.tooltipBackground,
        borderRadius: 6,
        style: CHART_STYLES.tooltip,
        formatter: function (this: any) {
          const year = this.x as number;
          const value = this.y as number;
          return `<div style="font-size:12px;color:#fff;">
            <strong>${year}</strong><br/>
            <span style="color:${COLORS[0]}">●</span> ${formatCurrency(Math.round(value))}<br/>
            <span style="color:#9ca3af;font-size:11px;">
              ${formatCurrency(amount)} in ${selectedYear} = ${formatCurrency(Math.round(value))} in ${year}
            </span>
          </div>`;
        },
      },
      legend: { enabled: false },
      plotOptions: {
        areaspline: {
          fillOpacity: 0.15,
          lineWidth: 2.5,
          marker: {
            enabled: false,
            states: { hover: { enabled: true, radius: 5 } },
          },
          animation: false,
        },
      },
      series: [
        {
          type: 'areaspline',
          name: 'Equivalent Amount',
          data: seriesData,
          color: COLORS[0],
        },
      ],
    };
  }, [data, selectedYear, amount]);

  if (data.length === 0) return null;

  return (
    <Block marginTop="scale600">
      <HighchartsReact highcharts={Highcharts} options={chartOptions} />
    </Block>
  );
};
