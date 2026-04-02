import React from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { useStyletron } from 'baseui';
import { Block } from 'baseui/block';
import { LabelLarge, LabelSmall } from 'baseui/typography';
import { Table } from 'baseui/table-semantic';
import { GoalSummary } from '../../types/tracker';
import { formatNumber } from '../../utils/numberFormat';
import { CHART_STYLES, COLORS } from '../../constants';

interface SummaryCardProps {
  summary: GoalSummary;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({ summary }) => {
  const [, theme] = useStyletron();
  const positiveColor = theme.colors.positive;
  const negativeColor = theme.colors.negative;
  const isPositiveChange = summary.dailyChange >= 0;
  const xirrStr = isNaN(summary.xirr) ? 'N/A' : `${(summary.xirr * 100).toFixed(2)}%`;

  const right = { textAlign: 'right' as const, display: 'block' };
  const returnColor = (v: number) => (v >= 0 ? positiveColor : negativeColor);

  const tableColumns = ['', 'Investment', 'Value', 'Return', 'Allocation'];
  const tableData = [
    ...summary.holdings.map((h) => {
      const ret = h.value - h.investment;
      return [
        <span key="n" style={{ fontWeight: 500 }}>{h.name}</span>,
        <span key="i" style={right}>{formatNumber(Math.round(h.investment))}</span>,
        <span key="v" style={right}>{formatNumber(Math.round(h.value))}</span>,
        <span key="r" style={{ ...right, color: returnColor(ret), fontWeight: 600 }}>
          {ret >= 0 ? '+' : ''}{formatNumber(Math.round(ret))}
        </span>,
        <span key="a" style={right}>{h.allocation.toFixed(1)}%</span>,
      ];
    }),
    [
      <strong key="t">Total</strong>,
      <strong key="ti"><span style={right}>{formatNumber(Math.round(summary.totalInvestment))}</span></strong>,
      <strong key="tv"><span style={right}>{formatNumber(Math.round(summary.totalValue))}</span></strong>,
      <strong key="tr">
        <span style={{ ...right, color: returnColor(summary.interest), fontWeight: 700 }}>
          {summary.interest >= 0 ? '+' : ''}{formatNumber(Math.round(summary.interest))}
        </span>
      </strong>,
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
        data: summary.interest >= 0
          ? [
              { name: 'Investment', y: summary.totalInvestment, color: COLORS[0] },
              { name: 'Interest', y: summary.interest, color: COLORS[1] },
            ]
          : [
              { name: 'Value', y: summary.totalValue, color: COLORS[0] },
              { name: 'Loss', y: -summary.interest, color: negativeColor },
            ],
      },
    ],
  };

  return (
    <Block>
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
        <Block
          display="flex"
          flexDirection="column"
          alignItems="center"
          marginRight="scale600"
          overrides={{
            Block: {
              style: {
                minWidth: '200px',
                '@media (max-width: 700px)': {
                  marginRight: '0',
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
                  marginBottom: '4px',
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
                  fontWeight: '600',
                  color: isPositiveChange ? positiveColor : negativeColor,
                },
              },
            }}
          >
            {isPositiveChange ? '↑' : '↓'} {formatNumber(Math.abs(Math.round(summary.dailyChange)))}
          </LabelSmall>

          <LabelSmall
            overrides={{
              Block: {
                style: {
                  marginTop: '4px',
                  fontWeight: '600',
                  color: CHART_STYLES.title.color,
                },
              },
            }}
          >
            XIRR: {xirrStr}
          </LabelSmall>

          <Block marginTop="scale200">
            <HighchartsReact highcharts={Highcharts} options={pieOptions} />
          </Block>

        </Block>

        <Block flex="1" overrides={{ Block: { style: { overflowX: 'auto' } } }}>
          <Table
            columns={tableColumns}
            data={tableData}
            divider="grid"
            size="compact"
          />
        </Block>
      </Block>
    </Block>
  );
};
