import React, { useState, useRef, useEffect } from 'react';
import Highcharts from 'highcharts/highstock';
import HighchartsReact from 'highcharts-react-official';
import { mfapiMutualFund } from '../../types/mfapiMutualFund';
import { Portfolio } from '../../types/portfolio';
import { Block } from 'baseui/block';
import { Button } from 'baseui/button';
import { HeadingMedium, LabelLarge, LabelMedium, LabelSmall } from 'baseui/typography';
import { TransactionModal } from '../modals/TransactionModal';

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

interface MultiFundChartsProps {
  navDatas: Record<number, any[]>;
  lumpSumXirrDatas: Record<number, any[]>;
  sipXirrDatas: Record<string, any[]>;
  funds: mfapiMutualFund[];
  COLORS: string[];
  portfolios: Portfolio[];
  years: number;
}

export const MultiFundCharts: React.FC<MultiFundChartsProps> = ({
  navDatas,
  lumpSumXirrDatas,
  sipXirrDatas,
  funds,
  COLORS,
  portfolios,
  years,
}) => {
  const [modal, setModal] = useState<{
    visible: boolean;
    transactions: { fundIdx: number; nav: number; when: Date; units: number; amount: number; type: 'buy' | 'sell'; allocationPercentage?: number }[];
    date: string;
    xirr: number;
    portfolioName: string;
    portfolioFunds: Array<{ schemeName: string; type: 'mutual_fund' | 'index_fund' | 'yahoo_finance' }>;
  }>({ visible: false, transactions: [], date: '', xirr: 0, portfolioName: '', portfolioFunds: [] });

  const getFundName = (schemeCode: number) => {
    const fund = funds.find(f => f.schemeCode === schemeCode);
    return fund ? fund.schemeName : String(schemeCode);
  };

  const getNavSeries = () =>
    Object.entries(navDatas).map(([scheme, data], idx) => ({
      name: getFundName(Number(scheme)),
      data: [...data].sort((a, b) => a.date.getTime() - b.date.getTime()).map(row => row.nav),
      type: 'line',
      color: COLORS[idx % COLORS.length],
      marker: { enabled: false },
    }));
  const getNavCategories = () => {
    const allDates = Object.values(navDatas).flatMap(arr => Array.isArray(arr) ? arr.map(row => formatDate(row.date)) : []);
    return Array.from(new Set(allDates)).sort();
  };

  /*
  const getLumpSumSeries = () => [
    {
      name: 'Portfolio Lump Sum XIRR',
      data: (lumpSumXirrDatas['portfolio'] || []).sort((a: any, b: any) => a.date.getTime() - b.date.getTime()).map((row: any) => row.xirr * 100),
      type: 'line',
      color: COLORS[0],
      marker: { enabled: false },
    }
  ];
  const getLumpSumCategories = () => {
    const arr = lumpSumXirrDatas['portfolio'] || [];
    return arr.map((row: any) => formatDate(row.date));
  };
  */

  // Get all unique dates across all portfolios
  const getAllDates = () => {
    const allDates = Object.values(sipXirrDatas).flatMap(arr =>
      Array.isArray(arr) ? arr.map(row => formatDate(row.date)) : []
    );
    return Array.from(new Set(allDates)).sort();
  };

  // Build a series for each portfolio
  const getSipSeries = () => {
    const allDates = getAllDates();
    return Object.entries(sipXirrDatas).map(([portfolioName, data], idx) => {
      // Map date to xirr for this portfolio
      const dateToXirr: Record<string, number> = {};
      (data || []).forEach((row: any) => {
        dateToXirr[formatDate(row.date)] = row.xirr * 100;
      });
      
      // Convert to timestamp-based data for stock chart
      const seriesData = allDates.map(date => {
        const xirr = dateToXirr[date];
        return xirr !== undefined ? [new Date(date).getTime(), xirr] : null;
      }).filter(point => point !== null);
      
      return {
        name: portfolioName,
        data: seriesData,
        type: 'line',
        color: COLORS[idx % COLORS.length],
        marker: { enabled: false },
        showInNavigator: true,
      };
    });
  };
  const getSipCategories = () => getAllDates();

  // Helper to get the funds for a portfolio by name (e.g., 'Portfolio 1')
  const getPortfolioFunds = (portfolioName: string): Array<{ schemeName: string; type: 'mutual_fund' | 'index_fund' | 'yahoo_finance' }> => {
    const idx = parseInt(portfolioName.replace('Portfolio ', '')) - 1;
    const portfolio = portfolios[idx];
    if (!portfolio || !portfolio.selectedInstruments) return [];
    
    return portfolio.selectedInstruments
      .filter(inst => inst) // Filter out null instruments
      .map(inst => {
        if (inst!.type === 'mutual_fund') {
          const fund = funds.find(f => f.schemeCode === inst!.schemeCode);
          return {
            schemeName: fund ? fund.schemeName : `Fund ${inst!.schemeCode}`,
            type: 'mutual_fund' as const
          };
        } else if (inst!.type === 'index_fund') {
          return {
            schemeName: inst!.displayName || inst!.name,
            type: 'index_fund' as const
          };
        } else if (inst!.type === 'yahoo_finance') {
          return {
            schemeName: inst!.displayName || inst!.symbol,
            type: 'yahoo_finance' as const
          };
        }
        return {
          schemeName: `Unknown Instrument`,
          type: 'mutual_fund' as const
        };
      });
  };

  return (
    <Block marginTop="2rem">
      <TransactionModal {...modal} onClose={() => setModal(m => ({ ...m, visible: false }))} funds={modal.portfolioFunds} />
      {/*
      <Block marginTop="1.5rem">
        <HighchartsReact
          highcharts={Highcharts}
          options={{
            title: { 
              text: `Lump Sum Rolling ${years}Y XIRR`,
              style: {
                fontSize: '18px',
                fontWeight: '600',
                color: '#1f2937',
                fontFamily: 'system-ui, -apple-system, sans-serif'
              }
            },
            xAxis: {
              categories: getLumpSumCategories(),
              title: { 
                text: 'Date',
                style: {
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#6b7280',
                  fontFamily: 'system-ui, -apple-system, sans-serif'
                }
              },
              labels: { 
                rotation: -45,
                style: {
                  fontSize: '12px',
                  color: '#6b7280',
                  fontFamily: 'system-ui, -apple-system, sans-serif'
                }
              },
              gridLineColor: '#f3f4f6',
              lineColor: '#e5e7eb',
              tickColor: '#e5e7eb'
            },
            yAxis: {
              title: { 
                text: 'XIRR (%)',
                style: {
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#6b7280',
                  fontFamily: 'system-ui, -apple-system, sans-serif'
                }
              },
              labels: {
                style: {
                  fontSize: '12px',
                  color: '#6b7280',
                  fontFamily: 'system-ui, -apple-system, sans-serif'
                }
              },
              gridLineColor: '#f3f4f6',
              lineColor: '#e5e7eb'
            },
            series: getLumpSumSeries(),
            chart: { 
              height: 400,
              backgroundColor: '#ffffff',
              borderRadius: 8,
              spacing: [20, 20, 20, 20],
              style: {
                fontFamily: 'system-ui, -apple-system, sans-serif'
              },
              events: {
                click: () => setModal(m => ({ ...m, visible: false })),
              } 
            },
            credits: { enabled: false },
            legend: { 
              enabled: true,
              itemStyle: {
                fontSize: '13px',
                fontWeight: '500',
                color: '#374151'
              },
              itemHoverStyle: {
                color: '#1f2937'
              }
            },
            tooltip: { 
              valueDecimals: 2,
              backgroundColor: '#1f2937',
              borderColor: '#1f2937',
              borderRadius: 6,
              style: {
                color: '#ffffff',
                fontSize: '12px',
                fontFamily: 'system-ui, -apple-system, sans-serif'
              }
            },
          }}
        />
      </Block>
      */}
      <Block marginTop="1.5rem">
        <HighchartsReact
          highcharts={Highcharts}
          constructorType={'stockChart'}
          options={{
            title: { 
              text: `SIP Rolling ${years}Y XIRR`,
              style: {
                fontSize: '18px',
                fontWeight: '600',
                color: '#1f2937'
              }
            },
            xAxis: {
              type: 'datetime',
              title: { 
                text: 'Date',
                style: {
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#6b7280'
                }
              },
              labels: { 
                style: {
                  fontSize: '12px',
                  color: '#6b7280'
                }
              },
              gridLineColor: '#f3f4f6',
              lineColor: '#e5e7eb',
              tickColor: '#e5e7eb'
            },
            yAxis: {
              opposite: false,
              title: { 
                text: 'XIRR (%)',
                align: 'middle',
                rotation: -90,
                x: -10,
                style: {
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#6b7280'
                }
              },
              labels: {
                formatter: function (this: any) {
                  return this.value + ' %';
                },
                style: {
                  fontSize: '12px',
                  color: '#6b7280'
                }
              },
              gridLineColor: '#f3f4f6',
              lineColor: '#e5e7eb',
              plotLines: [{
                value: 0,
                width: 2,
                color: '#aaa',
                zIndex: 1
              }]
            },
            rangeSelector: {
              enabled: false
            },
            navigator: {
              enabled: true,
              height: 40,
              margin: 10,
              maskFill: 'rgba(107, 114, 128, 0.1)',
              outlineColor: '#e5e7eb',
              outlineWidth: 1,
              handles: {
                backgroundColor: '#ffffff',
                borderColor: '#d1d5db'
              },
              xAxis: {
                gridLineColor: '#f3f4f6',
                labels: {
                  style: {
                    color: '#6b7280',
                    fontSize: '11px'
                  }
                }
              },
              series: {
                lineColor: '#6b7280',
                fillOpacity: 0.05
              }
            },
            scrollbar: {
              enabled: true,
              barBackgroundColor: '#f3f4f6',
              barBorderColor: '#e5e7eb',
              buttonBackgroundColor: '#ffffff',
              buttonBorderColor: '#d1d5db',
              rifleColor: '#6b7280',
              trackBackgroundColor: '#f9fafb',
              trackBorderColor: '#e5e7eb'
            },
            series: getSipSeries(),
            chart: { 
              height: 500,
              backgroundColor: '#ffffff',
              borderRadius: 8,
              spacing: [20, 20, 20, 20],
              zooming: {
                mouseWheel: false
              },
              events: {
                click: () => setModal(m => ({ ...m, visible: false })),
              } 
            },
            credits: { enabled: false },
            legend: { 
              enabled: true,
              itemStyle: {
                fontSize: '13px',
                fontWeight: '500',
                color: '#374151'
              },
              itemHoverStyle: {
                color: '#1f2937'
              }
            },
            tooltip: { 
              shared: true,
              crosshairs: true,
              useHTML: true,
              backgroundColor: '#1f2937',
              borderColor: '#1f2937',
              borderRadius: 6,
              style: {
                color: '#ffffff',
                fontSize: '12px'
              },
              formatter: function (this: any) {
                let tooltipHTML = `<div style="font-size: 12px; color: #ffffff;"><strong>${Highcharts.dateFormat('%e %b %Y', this.x)}</strong><br/>`;
                
                // Sort points by y value (descending) to show highest values first
                const sortedPoints = this.points ? 
                  [...this.points].sort((a: any, b: any) => (b.y as number) - (a.y as number)) : 
                  [];
                
                sortedPoints.forEach((point: any) => {
                  const formattedValue = (point.y as number).toFixed(2) + " %";
                  const color = point.series.color;
                  tooltipHTML += `<span style="color:${color}">●</span> ${point.series.name}: <strong>${formattedValue}</strong><br/>`;
                });
                
                tooltipHTML += '</div>';
                return tooltipHTML;
              }
            },
            plotOptions: {
              series: {
                cursor: 'pointer',
                animation: false,
                marker: { 
                  enabled: false,
                  states: {
                    hover: {
                      enabled: true,
                      radius: 5
                    }
                  }
                },
                states: {
                  hover: {
                    lineWidthPlus: 1
                  }
                },
                point: {
                  events: {
                    click: function (this: Highcharts.Point, event: Highcharts.PointClickEventObject) {
                      // Find the portfolio and date for this point
                      const series = this.series;
                      const portfolioName = series.name;
                      const pointDate = Highcharts.dateFormat('%Y-%m-%d', this.x as number);
                      // Find the XIRR entry for this portfolio and date
                      const xirrEntry = (sipXirrDatas[portfolioName] || []).find((row: any) => formatDate(row.date) === pointDate);
                      if (xirrEntry) {
                        const portfolioFunds = getPortfolioFunds(portfolioName);
                        setModal({
                          visible: true,
                          transactions: xirrEntry.transactions || [],
                          date: pointDate,
                          xirr: xirrEntry.xirr,
                          portfolioName,
                          portfolioFunds,
                        });
                      }
                    }
                  }
                }
              }
            },
          }}
        />
      </Block>
    </Block>
  );
}; 