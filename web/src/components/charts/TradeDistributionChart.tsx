import { useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts'
import { useLanguage } from '../../contexts/LanguageContext'
import type { HistoricalPosition } from '../../types'

interface TradeDistributionChartProps {
  positions: HistoricalPosition[]
}

export function TradeDistributionChart({ positions }: TradeDistributionChartProps) {
  const { language } = useLanguage()

  const buckets = useMemo(() => {
    if (!positions?.length) return []

    const pnls = positions.map((p) => p.realized_pnl - p.fee)
    const maxAbs = Math.max(...pnls.map(Math.abs), 1)

    // Create 10 buckets from -maxAbs to +maxAbs
    const bucketCount = 10
    const step = (maxAbs * 2) / bucketCount
    const bins: { range: string; count: number; from: number; to: number }[] = []

    for (let i = 0; i < bucketCount; i++) {
      const from = -maxAbs + i * step
      const to = from + step
      bins.push({
        range: `${from >= 0 ? '+' : ''}${from.toFixed(0)}`,
        count: 0,
        from,
        to,
      })
    }

    for (const pnl of pnls) {
      const idx = Math.min(
        Math.floor((pnl + maxAbs) / step),
        bucketCount - 1
      )
      if (idx >= 0 && idx < bucketCount) bins[idx].count++
    }

    return bins
  }, [positions])

  if (!positions?.length) {
    return (
      <div className="binance-card p-6">
        <h3 className="text-lg font-semibold mb-4" style={{ color: '#EAECEF' }}>
          {language === 'zh' ? 'P&L 分布' : 'P&L Distribution'}
        </h3>
        <div className="flex items-center justify-center h-48" style={{ color: '#848E9C' }}>
          {language === 'zh' ? '暂无交易数据' : 'No trade history'}
        </div>
      </div>
    )
  }

  return (
    <div className="binance-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold" style={{ color: '#EAECEF' }}>
          {language === 'zh' ? 'P&L 分布' : 'P&L Distribution'}
        </h3>
        <span className="text-xs" style={{ color: '#848E9C' }}>
          {positions.length} {language === 'zh' ? '笔交易' : 'trades'}
        </span>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={buckets} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2B3139" vertical={false} />
          <XAxis
            dataKey="range"
            tick={{ fill: '#848E9C', fontSize: 10 }}
            stroke="#2B3139"
            interval={0}
            angle={-30}
            textAnchor="end"
            height={40}
          />
          <YAxis
            tick={{ fill: '#848E9C', fontSize: 11 }}
            stroke="#2B3139"
            allowDecimals={false}
          />
          <ReferenceLine x={Math.floor(buckets.length / 2)} stroke="#2B3139" strokeWidth={2} />
          <Tooltip
            contentStyle={{
              background: '#1E2329',
              border: '1px solid #2B3139',
              borderRadius: '8px',
              fontSize: '12px',
            }}
            formatter={(value: number) => [
              value,
              language === 'zh' ? '交易数' : 'Trades',
            ]}
            labelFormatter={(label: string) =>
              `${language === 'zh' ? '区间' : 'Range'}: $${label}`
            }
            labelStyle={{ color: '#848E9C' }}
          />
          <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={40}>
            {buckets.map((entry, index) => (
              <Cell
                key={index}
                fill={
                  entry.from + (entry.to - entry.from) / 2 >= 0
                    ? '#0ECB81'
                    : '#F6465D'
                }
                fillOpacity={0.8}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
