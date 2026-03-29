import { useMemo } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import useSWR from 'swr'
import { api } from '../../lib/api'
import { useLanguage } from '../../contexts/LanguageContext'
import { useAuth } from '../../contexts/AuthContext'

interface DrawdownChartProps {
  traderId?: string
}

interface EquityPoint {
  timestamp: string
  total_equity: number
}

export function DrawdownChart({ traderId }: DrawdownChartProps) {
  const { language } = useLanguage()
  const { user, token } = useAuth()

  const { data: history, isLoading } = useSWR<EquityPoint[]>(
    user && token && traderId ? `equity-history-dd-${traderId}` : null,
    () => api.getEquityHistory(traderId),
    {
      refreshInterval: 60000,
      revalidateOnFocus: false,
      dedupingInterval: 30000,
    }
  )

  const drawdownData = useMemo(() => {
    if (!history || history.length < 2) return []

    let peak = history[0].total_equity
    return history.map((point) => {
      if (point.total_equity > peak) peak = point.total_equity
      const drawdown = peak > 0 ? ((point.total_equity - peak) / peak) * 100 : 0
      return {
        timestamp: point.timestamp,
        drawdown: Math.min(drawdown, 0),
        equity: point.total_equity,
        peak,
      }
    })
  }, [history])

  const maxDrawdown = useMemo(() => {
    if (!drawdownData.length) return 0
    return Math.min(...drawdownData.map((d) => d.drawdown))
  }, [drawdownData])

  if (isLoading) {
    return (
      <div className="binance-card p-6">
        <h3 className="text-lg font-semibold mb-4" style={{ color: '#EAECEF' }}>
          {language === 'zh' ? '回撤曲线' : 'Drawdown Chart'}
        </h3>
        <div className="animate-pulse">
          <div className="skeleton h-48 w-full rounded"></div>
        </div>
      </div>
    )
  }

  if (!drawdownData.length) {
    return (
      <div className="binance-card p-6">
        <h3 className="text-lg font-semibold mb-4" style={{ color: '#EAECEF' }}>
          {language === 'zh' ? '回撤曲线' : 'Drawdown Chart'}
        </h3>
        <div className="flex items-center justify-center h-48" style={{ color: '#848E9C' }}>
          {language === 'zh' ? '暂无数据' : 'No data available'}
        </div>
      </div>
    )
  }

  const formatTime = (ts: string) => {
    const d = new Date(ts)
    return `${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getDate().toString().padStart(2, '0')} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
  }

  return (
    <div className="binance-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold" style={{ color: '#EAECEF' }}>
          {language === 'zh' ? '回撤曲线' : 'Drawdown Chart'}
        </h3>
        <span
          className="text-sm font-mono px-2 py-1 rounded"
          style={{
            color: '#F6465D',
            background: 'rgba(246, 70, 93, 0.1)',
          }}
        >
          Max: {maxDrawdown.toFixed(2)}%
        </span>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={drawdownData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id="drawdownGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F6465D" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#F6465D" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#2B3139" />
          <XAxis
            dataKey="timestamp"
            tickFormatter={formatTime}
            tick={{ fill: '#848E9C', fontSize: 11 }}
            stroke="#2B3139"
            minTickGap={40}
          />
          <YAxis
            tickFormatter={(v) => `${v.toFixed(1)}%`}
            tick={{ fill: '#848E9C', fontSize: 11 }}
            stroke="#2B3139"
            domain={['dataMin', 0]}
          />
          <ReferenceLine y={0} stroke="#2B3139" strokeWidth={2} />
          {maxDrawdown < -5 && (
            <ReferenceLine
              y={maxDrawdown}
              stroke="#F6465D"
              strokeDasharray="5 5"
              strokeOpacity={0.5}
            />
          )}
          <Tooltip
            contentStyle={{
              background: '#1E2329',
              border: '1px solid #2B3139',
              borderRadius: '8px',
              fontSize: '12px',
            }}
            labelFormatter={formatTime}
            formatter={(value: number) => [`${value.toFixed(2)}%`, language === 'zh' ? '回撤' : 'Drawdown']}
            labelStyle={{ color: '#848E9C' }}
          />
          <Area
            type="monotone"
            dataKey="drawdown"
            stroke="#F6465D"
            strokeWidth={1.5}
            fill="url(#drawdownGradient)"
            dot={false}
            activeDot={{ r: 3, fill: '#F6465D', stroke: '#0B0E11', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
