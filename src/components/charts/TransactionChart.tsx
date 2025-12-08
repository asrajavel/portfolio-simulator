import React, { useMemo } from 'react';
import Highcharts from 'highcharts/highstock';
import HighchartsReact from 'highcharts-react-official';
import { Block } from 'baseui/block';
import { CHART_STYLES } from '../../constants';
import { STOCK_CHART_NAVIGATOR, STOCK_CHART_SCROLLBAR } from '../../utils/stockChartConfig';

interface Transaction {
  fundIdx: number;
  nav: number;
  when: Date;
  units: number;
  amount: number;
  type: 'buy' | 'sell' | 'rebalance' | 'nil';
  cumulativeUnits: number;
  currentValue: number;
  allocationPercentage?: number;
}

interface TransactionChartProps {
  transactions: Transaction[];
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export const TransactionChart: React.FC<TransactionChartProps> = ({ transactions }) => {
  // Process transactions for the chart
  const chartData = useMemo(() => {
    // Group transactions by date and calculate cumulative investment and current value
    const dateMap = new Map<string, { date: Date; cumulativeInvestment: number; currentValue: number }>();
    
    let cumulativeInvestment = 0;
    
    // Sort transactions by date
    const chronologicalTxs = [...transactions].sort((a, b) => a.when.getTime() - b.when.getTime());
    
    for (const tx of chronologicalTxs) {
      const dateKey = formatDate(tx.when);
      
      // Update cumulative investment only for buy transactions
      // Buy transactions have negative amounts (cash outflow), so we use Math.abs to get positive investment
      if (tx.type === 'buy') {
        cumulativeInvestment += Math.abs(tx.amount);
      }
      
      // Get total current value for this date (sum across all funds)
      const existing = dateMap.get(dateKey);
      const totalCurrentValue = existing 
        ? existing.currentValue + tx.currentValue 
        : tx.currentValue;
      
      dateMap.set(dateKey, {
        date: tx.when,
        cumulativeInvestment,
        currentValue: totalCurrentValue
      });
    }
    
    // Convert to sorted array
    return Array.from(dateMap.values()).sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [transactions]);

  // Create chart options
  const chartOptions = useMemo(() => ({
    chart: {
      backgroundColor: CHART_STYLES.colors.background,
      borderRadius: 8,
      spacing: [20, 20, 20, 20],
      height: 600,
    },
    title: {
      text: 'Investment vs Value',
      style: CHART_STYLES.title
    },
    credits: { enabled: false },
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
        text: 'Amount (₹)',
        style: CHART_STYLES.axisTitle
      },
      labels: {
        formatter: function (this: any) {
          return '₹' + new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(this.value);
        },
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
        let html = `<div style="font-size: 12px; color: #ffffff;"><strong>${Highcharts.dateFormat('%e %b %Y', this.x)}</strong><br/>`;
        this.points.forEach((point: any) => {
          const value = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(point.y);
          html += `<span style="color:${point.series.color}">●</span> ${point.series.name}: <strong>${value}</strong><br/>`;
        });
        return html + '</div>';
      }
    },
    legend: {
      enabled: true,
      itemStyle: CHART_STYLES.legend,
      itemHoverStyle: { color: '#1f2937' }
    },
    plotOptions: {
      line: {
        marker: { 
          enabled: false,
          states: { hover: { enabled: true, radius: 5 } }
        },
        animation: false
      },
      series: {
        showInNavigator: true
      }
    },
    series: [
      {
        name: 'Investment',
        type: 'line',
        step: 'left',
        data: chartData.map(d => [d.date.getTime(), d.cumulativeInvestment]),
        color: '#3b82f6'
      },
      {
        name: 'Value',
        type: 'line',
        data: chartData.map(d => [d.date.getTime(), d.currentValue]),
        color: '#10b981'
      }
    ]
  }), [chartData]);

  return (
    <Block width="50%" margin="0 auto">
      <HighchartsReact
        highcharts={Highcharts}
        constructorType={'stockChart'}
        options={chartOptions}
      />
    </Block>
  );
};

