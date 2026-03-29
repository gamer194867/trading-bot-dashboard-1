import { useState, useEffect } from 'react'
import useSWR from 'swr'
import { api } from '../lib/api'
import { useLanguage } from '../contexts/LanguageContext'
import { useAuth } from '../contexts/AuthContext'
import { EquityChart } from '../components/charts/EquityChart'
import { DrawdownChart } from '../components/charts/DrawdownChart'
import { PortfolioAllocationChart } from '../components/charts/PortfolioAllocationChart'
import { PnLCalendarHeatmap } from '../components/charts/PnLCalendarHeatmap'
import { TradeDistributionChart } from '../components/charts/TradeDistributionChart'
import { PerformanceMetricsPanel } from '../components/charts/PerformanceMetricsPanel'
import { WinRateBySymbolChart } from '../components/charts/WinRateBySymbolChart'
import { ChevronDown, BarChart3, RefreshCw } from 'lucide-react'
import type {
  TraderInfo,
  AccountInfo,
  Position,
  PositionHistoryResponse,
} from '../types'

export function VisualizationPage() {
  const { language } = useLanguage()
  const { user, token } = useAuth()
  const [selectedTraderId, setSelectedTraderId] = useState<string | undefined>()
  const [dropdownOpen, setDropdownOpen] = useState(false)

  // Fetch trader list
  const { data: traders } = useSWR<TraderInfo[]>(
    user && token ? 'viz-traders' : null,
    api.getTraders,
    { revalidateOnFocus: false }
  )

  // Auto-select first trader
  useEffect(() => {
    if (traders?.length && !selectedTraderId) {
      setSelectedTraderId(traders[0].trader_id)
    }
  }, [traders, selectedTraderId])

  const selectedTrader = traders?.find((t) => t.trader_id === selectedTraderId)

  // Fetch data for selected trader
  const { data: account } = useSWR<AccountInfo>(
    selectedTraderId ? `viz-account-${selectedTraderId}` : null,
    () => api.getAccount(selectedTraderId),
    { refreshInterval: 30000, revalidateOnFocus: false }
  )

  const { data: positions } = useSWR<Position[]>(
    selectedTraderId ? `viz-positions-${selectedTraderId}` : null,
    () => api.getPositions(selectedTraderId),
    { refreshInterval: 30000, revalidateOnFocus: false }
  )

  const { data: positionHistory } = useSWR<PositionHistoryResponse>(
    selectedTraderId ? `viz-history-${selectedTraderId}` : null,
    () => api.getPositionHistory(selectedTraderId!, 500),
    { refreshInterval: 60000, revalidateOnFocus: false }
  )

  const stats = positionHistory?.stats ?? null
  const symbolStats = positionHistory?.symbol_stats ?? []
  const historicalPositions = positionHistory?.positions ?? []

  if (!user || !token) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: '#0B0E11' }}
      >
        <div className="text-center" style={{ color: '#848E9C' }}>
          <BarChart3 size={48} className="mx-auto mb-4 opacity-50" />
          <p className="text-lg">
            {language === 'zh' ? '请先登录' : 'Please log in to view analytics'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-[1920px] mx-auto px-4 md:px-6 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <BarChart3 size={24} style={{ color: '#F0B90B' }} />
          <h1 className="text-xl font-bold" style={{ color: '#EAECEF' }}>
            {language === 'zh' ? '交易分析面板' : 'Trading Analytics'}
          </h1>
        </div>

        {/* Trader Selector */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm"
            style={{
              background: '#1E2329',
              border: '1px solid #2B3139',
              color: '#EAECEF',
            }}
          >
            <span className="max-w-[150px] truncate">
              {selectedTrader?.trader_name || (language === 'zh' ? '选择交易员' : 'Select Trader')}
            </span>
            <ChevronDown size={14} style={{ color: '#848E9C' }} />
          </button>
          {dropdownOpen && traders && (
            <div
              className="absolute right-0 mt-1 z-50 rounded-lg overflow-hidden min-w-[200px]"
              style={{
                background: '#1E2329',
                border: '1px solid #2B3139',
                boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
              }}
            >
              {traders.map((t) => (
                <button
                  key={t.trader_id}
                  onClick={() => {
                    setSelectedTraderId(t.trader_id)
                    setDropdownOpen(false)
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm transition-colors"
                  style={{
                    color: t.trader_id === selectedTraderId ? '#F0B90B' : '#EAECEF',
                    background: t.trader_id === selectedTraderId ? '#2B3139' : 'transparent',
                  }}
                  onMouseEnter={(e) => {
                    if (t.trader_id !== selectedTraderId)
                      e.currentTarget.style.background = '#181A20'
                  }}
                  onMouseLeave={(e) => {
                    if (t.trader_id !== selectedTraderId)
                      e.currentTarget.style.background = 'transparent'
                  }}
                >
                  <span>{t.trader_name}</span>
                  <span className="ml-2 text-xs" style={{ color: '#5E6673' }}>
                    {t.ai_model}
                  </span>
                  {t.is_running && (
                    <span
                      className="ml-2 inline-block w-1.5 h-1.5 rounded-full"
                      style={{ background: '#0ECB81' }}
                    />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {!selectedTraderId ? (
        <div className="flex items-center justify-center h-64" style={{ color: '#848E9C' }}>
          <RefreshCw size={20} className="animate-spin mr-2" />
          {language === 'zh' ? '加载中...' : 'Loading...'}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Row 1: Performance Metrics */}
          <PerformanceMetricsPanel stats={stats} account={account ?? null} />

          {/* Row 2: Equity & Drawdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <EquityChart traderId={selectedTraderId} />
            <DrawdownChart traderId={selectedTraderId} />
          </div>

          {/* Row 3: Portfolio & P&L Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PortfolioAllocationChart positions={positions || []} />
            <TradeDistributionChart positions={historicalPositions} />
          </div>

          {/* Row 4: Symbol Analysis */}
          <WinRateBySymbolChart symbolStats={symbolStats} />

          {/* Row 5: P&L Calendar */}
          <PnLCalendarHeatmap positions={historicalPositions} />
        </div>
      )}
    </div>
  )
}
