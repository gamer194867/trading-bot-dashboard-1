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
import type { SymbolStats } from '../../types'

interface WinRateBySymbolChartProps {
  symbolStats: SymbolStats[]
}

export function WinRateBySymbolChart({ symbolStats }: WinRateBySymbolChartProps) {
  const { language } = useLanguage()

  if (!symbolStats?.length) {
    return (
      <div className="binance-card p-6">
        <h3 className="text-lg font-semibold mb-4" style={{ color: '#EAECEF' }}>
          {language === 'zh' ? '币种分析' : 'Symbol Analysis'}
        </h3>
        <div className="flex items-center justify-center h-48" style={{ color: '#848E9C' }}>
          {language === 'zh' ? '暂无交易数据' : 'No trade data'}
        </div>
      </div>
    )
  }

  // Sort by total PnL descending
  const data = [...symbolStats]
    .sort((a, b) => b.total_pnl - a.total_pnl)
    .slice(0, 12)
    .map((s) => ({
      symbol: s.symbol.replace('USDT', ''),
      pnl: parseFloat(s.total_pnl.toFixed(2)),
      winRate: s.win_rate,
      trades: s.total_trades,
      avgPnl: s.avg_pnl,
      avgHoldMins: s.avg_hold_mins,
    }))

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null
    const d = payload[0].payload
    return (
      <div
        className="rounded-lg p-3 text-sm"
        style={{ background: '#1E2329', border: '1px solid #2B3139' }}
      >
        <p className="font-semibold" style={{ color: '#EAECEF' }}>
          {d.symbol}USDT
        </p>
        <p style={{ color: d.pnl >= 0 ? '#0ECB81' : '#F6465D' }}>
          P&L: ${d.pnl.toFixed(2)}
        </p>
        <p style={{ color: '#848E9C' }}>
          {language === 'zh' ? '胜率' : 'Win Rate'}: {d.winRate.toFixed(1)}%
        </p>
        <p style={{ color: '#848E9C' }}>
          {language === 'zh' ? '交易数' : 'Trades'}: {d.trades}
        </p>
        <p style={{ color: '#848E9C' }}>
          {language === 'zh' ? '平均盈亏' : 'Avg P&L'}: ${d.avgPnl.toFixed(2)}
        </p>
        <p style={{ color: '#848E9C' }}>
          {language === 'zh' ? '平均持仓' : 'Avg Hold'}:{' '}
          {d.avgHoldMins >= 60
            ? `${(d.avgHoldMins / 60).toFixed(1)}h`
            : `${d.avgHoldMins.toFixed(0)}m`}
        </p>
      </div>
    )
  }

  return (
    <div className="binance-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold" style={{ color: '#EAECEF' }}>
          {language === 'zh' ? '币种分析' : 'Symbol Analysis'}
        </h3>
        <span className="text-xs" style={{ color: '#848E9C' }}>
          {language === 'zh' ? '按盈亏排序' : 'Sorted by P&L'}
        </span>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2B3139" vertical={false} />
          <XAxis
            dataKey="symbol"
            tick={{ fill: '#848E9C', fontSize: 11 }}
            stroke="#2B3139"
          />
          <YAxis
            tickFormatter={(v) => `$${v}`}
            tick={{ fill: '#848E9C', fontSize: 11 }}
            stroke="#2B3139"
          />
          <ReferenceLine y={0} stroke="#5E6673" strokeWidth={1} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="pnl" radius={[4, 4, 0, 0]} maxBarSize={36}>
            {data.map((entry, index) => (
              <Cell
                key={index}
                fill={entry.pnl >= 0 ? '#0ECB81' : '#F6465D'}
                fillOpacity={0.85}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Win rate indicators below chart */}
      <div className="flex flex-wrap gap-2 mt-3">
        {data.map((d) => (
          <div
            key={d.symbol}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs"
            style={{ background: '#181A20', border: '1px solid #2B3139' }}
          >
            <span style={{ color: '#EAECEF' }}>{d.symbol}</span>
            <span
              style={{
                color: d.winRate >= 50 ? '#0ECB81' : '#F6465D',
                fontFamily: 'monospace',
              }}
            >
              {d.winRate.toFixed(0)}%
            </span>
            <span style={{ color: '#5E6673' }}>({d.trades})</span>
          </div>
        ))}
      </div>
    </div>
  )
}
