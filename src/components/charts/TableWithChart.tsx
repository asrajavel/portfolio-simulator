import React from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { Block } from 'baseui/block';
import { CHART_STYLES } from '../../constants';

interface Column<T> {
  label: string;
  render: (row: T) => React.ReactNode;
}

interface TableWithChartProps<T> {
  columns: Column<T>[];
  data: T[];
  chartTitle: string;
  chartSeriesName: string;
  chartColor: string;
  yAxisTitle: string;
  getChartX: (row: T) => string;
  getChartY: (row: T) => number;
}

export function TableWithChart<T>({
  columns,
  data,
  chartTitle,
  chartSeriesName,
  chartColor,
  yAxisTitle,
  getChartX,
  getChartY,
}: TableWithChartProps<T>) {
  if (!data.length) return null;
  // For the chart, always sort by x (low to high)
  const chartData = [...data].sort((a, b) => getChartX(a).localeCompare(getChartX(b)));

  return (
    <Block 
      maxWidth="100%" 
      marginTop="1.5rem"
    >
      <HighchartsReact
        highcharts={Highcharts}
        options={{
          title: { text: chartTitle, style: CHART_STYLES.title },
          credits: { enabled: false },
          chart: {
            backgroundColor: CHART_STYLES.colors.background,
            borderRadius: 8,
            spacing: [20, 20, 20, 20],
            height: 350
          },
          legend: { enabled: false },
          xAxis: {
            categories: chartData.map(getChartX),
            title: { text: columns[0]?.label || 'X', style: CHART_STYLES.axisTitle },
            labels: { 
              rotation: -45,
              style: CHART_STYLES.axisLabels
            },
            gridLineColor: CHART_STYLES.colors.gridLine,
            lineColor: CHART_STYLES.colors.line
          },
          yAxis: {
            title: { text: yAxisTitle, style: CHART_STYLES.axisTitle },
            labels: { style: CHART_STYLES.axisLabels },
            gridLineColor: CHART_STYLES.colors.gridLine
          },
          plotOptions: {
            series: {
              animation: false,
              marker: { enabled: false }
            }
          },
          series: [
            {
              name: chartSeriesName,
              data: chartData.map(getChartY),
              type: 'line',
              color: chartColor,
              marker: { enabled: false }
            }
          ]
        }}
      />
    </Block>
  );
} 