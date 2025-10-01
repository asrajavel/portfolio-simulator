import React from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { Block } from 'baseui/block';

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
          title: { text: chartTitle },
          xAxis: {
            categories: chartData.map(getChartX),
            title: { text: columns[0]?.label || 'X' },
            labels: { rotation: -45 }
          },
          yAxis: {
            title: { text: yAxisTitle }
          },
          series: [
            {
              name: chartSeriesName,
              data: chartData.map(getChartY),
              type: 'line',
              color: chartColor,
              marker: { enabled: false }
            }
          ],
          chart: { height: 350 },
          credits: { enabled: false },
          legend: { enabled: false },
        }}
      />
    </Block>
  );
} 