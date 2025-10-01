import React from 'react';
import { calculateLumpSumRollingXirr, RollingXirrEntry } from '../utils/lumpSumRollingXirr';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { TableWithChart } from './TableWithChart';

interface RollingXirrTableProps {
  data: RollingXirrEntry[];
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export const RollingXirrTable: React.FC<RollingXirrTableProps> = ({ data }) => {
  if (!data.length) return null;
  return (
    <TableWithChart
      columns={[
        { label: 'Date', render: (row) => formatDate(row.date) },
        { label: 'Lump Sum Rolling 1Y XIRR', render: (row) => ((row.xirr * 100).toFixed(2) + '%') },
      ]}
      data={data}
      chartTitle="Lump Sum Rolling 1Y XIRR"
      chartSeriesName="XIRR"
      chartColor="#28a745"
      yAxisTitle="XIRR (%)"
      getChartX={row => formatDate(row.date)}
      getChartY={row => row.xirr * 100}
    />
  );
}; 