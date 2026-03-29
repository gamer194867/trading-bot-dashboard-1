import { useMemo } from 'react'
import { useLanguage } from '../../contexts/LanguageContext'
import type { TraderStats, AccountInfo } from '../../types'
import {
  TrendingUp,
  TrendingDown,
  Target,
  BarChart3,
  Shield,
  Zap,
  Award,
  AlertTriangle,
} from 'lucide-react'

interface PerformanceMetricsPanelProps {
  stats: TraderStats | null
  account: AccountInfo | null
}

interface MetricCardProps {
  label: string
  value: string
  subValue?: string
  icon: React.ReactNode
  color: string
  bgColor: string
}

function MetricCard({ label, value, subValue, icon, color, bgColor }: MetricCardProps) {
  return (
    <div
      className="rounded-xl p-4 flex items-start gap-3"
      style={{ background: '#181A20', border: '1px solid #2B3139' }}
    >
      <div
        className="p-2 rounded-lg flex-shrink-0"
        style={{ background: bgColor }}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs truncate" style={{ color: '#848E9C' }}>
          {label}
        </p>
        <p className="text-lg font-bold font-mono mt-0.5" style={{ color }}>
          {value}
        </p>
        {subValue && (
          <p className="text-xs mt-0.5" style={{ color: '#5E6673' }}>
            {subValue}
          </p>
        )}
      </div>
    </div>
  )
}

export function PerformanceMetricsPanel({ stats, account }: PerformanceMetricsPanelProps) {
  const { language } = useLanguage()

  const metrics = useMemo(() => {
    if (!stats) return []

    const winRate = stats.win_rate
    const winRateColor = winRate >= 60 ? '#0ECB81' : winRate >= 40 ? '#F0B90B' : '#F6465D'

    const profitFactor = stats.profit_factor
    const pfColor = profitFactor >= 2 ? '#0ECB81' : profitFactor >= 1 ? '#F0B90B' : '#F6465D'

    const sharpe = stats.sharpe_ratio
    const sharpeColor = sharpe >= 2 ? '#0ECB81' : sharpe >= 1 ? '#F0B90B' : '#F6465D'

    const mddColor = stats.max_drawdown_pct <= 5 ? '#0ECB81' : stats.max_drawdown_pct <= 15 ? '#F0B90B' : '#F6465D'

    const totalPnlColor = stats.total_pnl >= 0 ? '#0ECB81' : '#F6465D'
    const totalPnlPct = account?.initial_balance
      ? ((stats.total_pnl / account.initial_balance) * 100).toFixed(2)
      : null

    return [
      {
        label: language === 'zh' ? '总盈亏' : 'Total P&L',
        value: `$${stats.total_pnl.toFixed(2)}`,
        subValue: totalPnlPct ? `${stats.total_pnl >= 0 ? '+' : ''}${totalPnlPct}% ROI` : undefined,
        icon: stats.total_pnl >= 0
          ? <TrendingUp size={18} style={{ color: totalPnlColor }} />
          : <TrendingDown size={18} style={{ color: totalPnlColor }} />,
        color: totalPnlColor,
        bgColor: `${totalPnlColor}15`,
      },
      {
        label: language === 'zh' ? '胜率' : 'Win Rate',
        value: `${winRate.toFixed(1)}%`,
        subValue: `${stats.win_trades}W / ${stats.loss_trades}L`,
        icon: <Target size={18} style={{ color: winRateColor }} />,
        color: winRateColor,
        bgColor: `${winRateColor}15`,
      },
      {
        label: language === 'zh' ? '盈亏比' : 'Profit Factor',
        value: profitFactor === 0 ? 'N/A' : profitFactor.toFixed(2),
        subValue: language === 'zh'
          ? `平均盈利 $${stats.avg_win.toFixed(2)}`
          : `Avg Win $${stats.avg_win.toFixed(2)}`,
        icon: <BarChart3 size={18} style={{ color: pfColor }} />,
        color: pfColor,
        bgColor: `${pfColor}15`,
      },
      {
        label: language === 'zh' ? '夏普比率' : 'Sharpe Ratio',
        value: sharpe.toFixed(2),
        subValue: sharpe >= 2 ? (language === 'zh' ? '优秀' : 'Excellent')
          : sharpe >= 1 ? (language === 'zh' ? '良好' : 'Good')
          : language === 'zh' ? '需改善' : 'Needs Work',
        icon: <Award size={18} style={{ color: sharpeColor }} />,
        color: sharpeColor,
        bgColor: `${sharpeColor}15`,
      },
      {
        label: language === 'zh' ? '最大回撤' : 'Max Drawdown',
        value: `${stats.max_drawdown_pct.toFixed(2)}%`,
        subValue: language === 'zh'
          ? `平均亏损 $${stats.avg_loss.toFixed(2)}`
          : `Avg Loss $${stats.avg_loss.toFixed(2)}`,
        icon: <Shield size={18} style={{ color: mddColor }} />,
        color: mddColor,
        bgColor: `${mddColor}15`,
      },
      {
        label: language === 'zh' ? '总交易数' : 'Total Trades',
        value: stats.total_trades.toString(),
        subValue: language === 'zh'
          ? `总手续费 $${stats.total_fee.toFixed(2)}`
          : `Total Fees $${stats.total_fee.toFixed(2)}`,
        icon: <Zap size={18} style={{ color: '#F0B90B' }} />,
        color: '#EAECEF',
        bgColor: '#F0B90B15',
      },
    ]
  }, [stats, account, language])

  if (!stats) {
    return (
      <div className="binance-card p-6">
        <h3 className="text-lg font-semibold mb-4" style={{ color: '#EAECEF' }}>
          {language === 'zh' ? '绩效指标' : 'Performance Metrics'}
        </h3>
        <div className="flex items-center justify-center h-32" style={{ color: '#848E9C' }}>
          <AlertTriangle size={16} className="mr-2" />
          {language === 'zh' ? '暂无统计数据' : 'No statistics available'}
        </div>
      </div>
    )
  }

  return (
    <div className="binance-card p-6">
      <h3 className="text-lg font-semibold mb-4" style={{ color: '#EAECEF' }}>
        {language === 'zh' ? '绩效指标' : 'Performance Metrics'}
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {metrics.map((m) => (
          <MetricCard key={m.label} {...m} />
        ))}
      </div>
    </div>
  )
}
