import React from 'react';
import { SipRollingXirrEntry } from '../utils/sipRollingXirr';
import { TableWithChart } from './TableWithChart';

interface SipRollingXirrTableProps {
  data: SipRollingXirrEntry[];
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export const SipRollingXirrTable: React.FC<SipRollingXirrTableProps> = ({ data }) => {
  if (!data.length) return null;
  return (
    <TableWithChart
      columns={[
        { label: 'Date', render: (row) => formatDate(row.date) },
        { label: 'SIP Rolling 1Y XIRR', render: (row) => ((row.xirr * 100).toFixed(2) + '%') },
      ]}
      data={data}
      chartTitle="SIP Rolling 1Y XIRR"
      chartSeriesName="XIRR"
      chartColor="#ff9800"
      yAxisTitle="XIRR (%)"
      getChartX={row => formatDate(row.date)}
      getChartY={row => row.xirr * 100}
    />
  );
}; 