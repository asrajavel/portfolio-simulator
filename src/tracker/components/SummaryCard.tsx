import React from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { Block } from 'baseui/block';
import { HeadingSmall, LabelLarge, LabelSmall, ParagraphSmall } from 'baseui/typography';
import { Table } from 'baseui/table-semantic';
import { GoalSummary } from '../../types/tracker';
import { formatNumber } from '../../utils/numberFormat';
import { CHART_STYLES, COLORS } from '../../constants';

interface SummaryCardProps {
  summary: GoalSummary;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({ summary }) => {
  const isPositiveChange = summary.dailyChange >= 0;

  const tableColumns = ['', 'Investment', 'Value', 'Allocation'];
  const tableData = [
    ...summary.holdings.map((h) => [
      <span key="n" style={{ fontWeight: 500 }}>{h.name}</span>,
      formatNumber(Math.round(h.investment)),
      formatNumber(Math.round(h.value)),
      `${h.allocation.toFixed(1)}%`,
    ]),
    [
      <strong key="t">Total</strong>,
      <strong key="ti">{formatNumber(Math.round(summary.totalInvestment))}</strong>,
      '',
      '',
    ],
    [
      <strong key="x">XIRR</strong>,
      <strong key="xv" style={{ color: '#16a34a' }}>
        {isNaN(summary.xirr) ? 'N/A' : `${(summary.xirr * 100).toFixed(2)}%`}
      </strong>,
      '',
      '',
    ],
  ];

  const pieOptions: Highcharts.Options = {
    chart: {
      type: 'pie',
      height: 160,
      width: 200,
      backgroundColor: 'transparent',
      margin: [0, 0, 0, 0],
    },
    title: { text: '' },
    credits: { enabled: false },
    plotOptions: {
      pie: {
        innerSize: '0%',
        dataLabels: {
          enabled: true,
          format: '{point.name}<br/>{point.percentage:.1f}%',
          style: {
            fontSize: '11px',
            fontWeight: '400',
            textOutline: 'none',
            fontFamily: CHART_STYLES.axisLabels.fontFamily,
            color: CHART_STYLES.axisLabels.color,
          },
          distance: 12,
        },
      },
    },
    series: [
      {
        type: 'pie',
        data: [
          { name: 'Investment', y: summary.totalInvestment, color: COLORS[0] },
          { name: 'Interest', y: Math.max(0, summary.interest), color: COLORS[1] },
        ],
      },
    ],
  };

  return (
    <Block>
      <HeadingSmall marginTop="0" marginBottom="scale400">{summary.name}</HeadingSmall>

      <Block
        display="flex"
        justifyContent="space-between"
        alignItems="flex-start"
        overrides={{
          Block: {
            style: {
              '@media (max-width: 700px)': {
                flexDirection: 'column',
                gap: '16px',
              },
            },
          },
        }}
      >
        <Block flex="1" overrides={{ Block: { style: { overflowX: 'auto' } } }}>
          <Table
            columns={tableColumns}
            data={tableData}
            divider="grid"
            size="compact"
          />
        </Block>

        <Block
          display="flex"
          flexDirection="column"
          alignItems="center"
          marginLeft="scale600"
          overrides={{
            Block: {
              style: {
                '@media (max-width: 700px)': {
                  marginLeft: '0',
                  alignSelf: 'center',
                },
              },
            },
          }}
        >
          <LabelLarge
            overrides={{
              Block: {
                style: {
                  fontSize: '32px',
                  fontWeight: '700',
                  color: CHART_STYLES.title.color,
                  lineHeight: '1.1',
                  marginTop: '0',
                  marginBottom: '0',
                },
              },
            }}
          >
            {formatNumber(Math.round(summary.totalValue))}
          </LabelLarge>

          <LabelSmall
            overrides={{
              Block: {
                style: {
                  fontWeight: '500',
                  color: isPositiveChange ? '#16a34a' : '#dc2626',
                  marginTop: '4px',
                  marginBottom: '0',
                },
              },
            }}
          >
            {isPositiveChange ? '↑' : '↓'} {formatNumber(Math.abs(Math.round(summary.dailyChange)))}
          </LabelSmall>

          <Block marginTop="scale200">
            <HighchartsReact highcharts={Highcharts} options={pieOptions} />
          </Block>

          <ParagraphSmall color="contentTertiary" marginTop="0" marginBottom="0">
            Investment vs Interest
          </ParagraphSmall>
        </Block>
      </Block>
    </Block>
  );
};
