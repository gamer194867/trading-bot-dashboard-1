import { useState } from 'react'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts'
import type { Position } from '../../types'
import { useLanguage } from '../../contexts/LanguageContext'

interface PortfolioAllocationChartProps {
  positions: Position[]
}

const COLORS = [
  '#F0B90B', '#0ECB81', '#F6465D', '#1E88E5', '#AB47BC',
  '#26A69A', '#EF6C00', '#5C6BC0', '#66BB6A', '#EC407A',
]

const formatUSD = (value: number) => {
  if (Math.abs(value) >= 1000) return `$${(value / 1000).toFixed(1)}k`
  return `$${value.toFixed(2)}`
}

export function PortfolioAllocationChart({ positions }: PortfolioAllocationChartProps) {
  const { language } = useLanguage()
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  if (!positions || positions.length === 0) {
    return (
      <div className="binance-card p-6">
        <h3 className="text-lg font-semibold mb-4" style={{ color: '#EAECEF' }}>
          {language === 'zh' ? '持仓分布' : 'Portfolio Allocation'}
        </h3>
        <div className="flex items-center justify-center h-48" style={{ color: '#848E9C' }}>
          {language === 'zh' ? '暂无持仓数据' : 'No open positions'}
        </div>
      </div>
    )
  }

  const data = positions.map((p) => ({
    name: p.symbol.replace('USDT', ''),
    value: Math.abs(p.margin_used),
    side: p.side,
    leverage: p.leverage,
    unrealizedPnl: p.unrealized_pnl,
    pnlPct: p.unrealized_pnl_pct,
  }))

  const totalMargin = data.reduce((sum, d) => sum + d.value, 0)

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null
    const d = payload[0].payload
    return (
      <div
        className="rounded-lg p-3 text-sm"
        style={{ background: '#1E2329', border: '1px solid #2B3139' }}
      >
        <p className="font-semibold" style={{ color: '#EAECEF' }}>
          {d.name}
        </p>
        <p style={{ color: '#848E9C' }}>
          {language === 'zh' ? '方向' : 'Side'}:{' '}
          <span style={{ color: d.side === 'long' ? '#0ECB81' : '#F6465D' }}>
            {d.side.toUpperCase()}
          </span>
        </p>
        <p style={{ color: '#848E9C' }}>
          {language === 'zh' ? '保证金' : 'Margin'}: {formatUSD(d.value)}
        </p>
        <p style={{ color: '#848E9C' }}>
          {language === 'zh' ? '杠杆' : 'Leverage'}: {d.leverage}x
        </p>
        <p style={{ color: d.unrealizedPnl >= 0 ? '#0ECB81' : '#F6465D' }}>
          P&L: {formatUSD(d.unrealizedPnl)} ({d.pnlPct > 0 ? '+' : ''}{d.pnlPct.toFixed(2)}%)
        </p>
        <p style={{ color: '#848E9C' }}>
          {language === 'zh' ? '占比' : 'Share'}: {((d.value / totalMargin) * 100).toFixed(1)}%
        </p>
      </div>
    )
  }

  return (
    <div className="binance-card p-6">
      <h3 className="text-lg font-semibold mb-4" style={{ color: '#EAECEF' }}>
        {language === 'zh' ? '持仓分布' : 'Portfolio Allocation'}
      </h3>
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={3}
            dataKey="value"
            onMouseEnter={(_, index) => setActiveIndex(index)}
            onMouseLeave={() => setActiveIndex(null)}
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell
                key={entry.name}
                fill={COLORS[index % COLORS.length]}
                opacity={activeIndex === null || activeIndex === index ? 1 : 0.4}
                style={{ transition: 'opacity 0.2s', cursor: 'pointer' }}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="bottom"
            formatter={(value: string, entry: any) => (
              <span style={{ color: '#EAECEF', fontSize: '12px' }}>
                {value}{' '}
                <span style={{ color: entry.payload?.side === 'long' ? '#0ECB81' : '#F6465D', fontSize: '11px' }}>
                  {entry.payload?.side === 'long' ? 'L' : 'S'}
                </span>
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
      {/* Center label */}
      <div className="text-center -mt-4" style={{ color: '#848E9C', fontSize: '12px' }}>
        {language === 'zh' ? '总保证金' : 'Total Margin'}: {formatUSD(totalMargin)}
      </div>
    </div>
  )
}
