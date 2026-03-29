import { useMemo, useState } from 'react'
import { useLanguage } from '../../contexts/LanguageContext'
import type { HistoricalPosition } from '../../types'

interface PnLCalendarHeatmapProps {
  positions: HistoricalPosition[]
}

interface DayData {
  date: string
  pnl: number
  trades: number
}

const getColor = (pnl: number, maxAbs: number): string => {
  if (pnl === 0) return '#1E2329'
  const intensity = Math.min(Math.abs(pnl) / maxAbs, 1)
  if (pnl > 0) {
    const alpha = 0.15 + intensity * 0.85
    return `rgba(14, 203, 129, ${alpha})`
  }
  const alpha = 0.15 + intensity * 0.85
  return `rgba(246, 70, 93, ${alpha})`
}

export function PnLCalendarHeatmap({ positions }: PnLCalendarHeatmapProps) {
  const { language } = useLanguage()
  const [hoveredDay, setHoveredDay] = useState<DayData | null>(null)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })

  const { dayMap, weeks, maxAbs, monthLabels } = useMemo(() => {
    const map = new Map<string, DayData>()

    if (positions?.length) {
      for (const pos of positions) {
        if (!pos.exit_time) continue
        const date = new Date(pos.exit_time).toISOString().slice(0, 10)
        const existing = map.get(date)
        if (existing) {
          existing.pnl += pos.realized_pnl - pos.fee
          existing.trades += 1
        } else {
          map.set(date, { date, pnl: pos.realized_pnl - pos.fee, trades: 1 })
        }
      }
    }

    // Build 12-week grid (84 days)
    const today = new Date()
    const startDate = new Date(today)
    startDate.setDate(startDate.getDate() - 83)
    // Align to Sunday
    startDate.setDate(startDate.getDate() - startDate.getDay())

    const weeksArr: (DayData | null)[][] = []
    const months: { label: string; col: number }[] = []
    let lastMonth = -1
    const current = new Date(startDate)

    for (let w = 0; w < 13; w++) {
      const week: (DayData | null)[] = []
      for (let d = 0; d < 7; d++) {
        const dateStr = current.toISOString().slice(0, 10)
        if (current > today) {
          week.push(null)
        } else {
          week.push(map.get(dateStr) || { date: dateStr, pnl: 0, trades: 0 })
        }
        const m = current.getMonth()
        if (m !== lastMonth) {
          const monthNames = language === 'zh'
            ? ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
            : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
          months.push({ label: monthNames[m], col: w })
          lastMonth = m
        }
        current.setDate(current.getDate() + 1)
      }
      weeksArr.push(week)
    }

    const allPnls = Array.from(map.values()).map((d) => Math.abs(d.pnl))
    const maxAbsVal = allPnls.length > 0 ? Math.max(...allPnls) : 1

    return { dayMap: map, weeks: weeksArr, maxAbs: maxAbsVal, monthLabels: months }
  }, [positions, language])

  const dayLabels = language === 'zh'
    ? ['', '一', '', '三', '', '五', '']
    : ['', 'Mon', '', 'Wed', '', 'Fri', '']

  return (
    <div className="binance-card p-6">
      <h3 className="text-lg font-semibold mb-4" style={{ color: '#EAECEF' }}>
        {language === 'zh' ? '每日盈亏热力图' : 'Daily P&L Heatmap'}
      </h3>

      {!positions?.length ? (
        <div className="flex items-center justify-center h-32" style={{ color: '#848E9C' }}>
          {language === 'zh' ? '暂无交易数据' : 'No trade history'}
        </div>
      ) : (
        <div className="relative">
          {/* Month labels */}
          <div className="flex ml-8 mb-1" style={{ gap: '0px' }}>
            {monthLabels.map((m, i) => (
              <div
                key={`${m.label}-${i}`}
                className="text-xs"
                style={{
                  color: '#848E9C',
                  position: 'absolute',
                  left: `${32 + m.col * 18}px`,
                  top: 0,
                }}
              >
                {m.label}
              </div>
            ))}
          </div>

          <div className="flex mt-5">
            {/* Day labels */}
            <div className="flex flex-col" style={{ gap: '4px', marginRight: '4px' }}>
              {dayLabels.map((label, i) => (
                <div
                  key={i}
                  className="text-xs flex items-center justify-end"
                  style={{ color: '#848E9C', width: '24px', height: '14px', fontSize: '10px' }}
                >
                  {label}
                </div>
              ))}
            </div>

            {/* Grid */}
            <div className="flex" style={{ gap: '4px' }}>
              {weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col" style={{ gap: '4px' }}>
                  {week.map((day, di) => (
                    <div
                      key={`${wi}-${di}`}
                      className="rounded-sm"
                      style={{
                        width: '14px',
                        height: '14px',
                        background: day ? getColor(day.pnl, maxAbs) : 'transparent',
                        border: day ? '1px solid rgba(43, 49, 57, 0.5)' : 'none',
                        cursor: day && day.trades > 0 ? 'pointer' : 'default',
                        transition: 'transform 0.1s',
                      }}
                      onMouseEnter={(e) => {
                        if (day && day.trades > 0) {
                          setHoveredDay(day)
                          const rect = e.currentTarget.getBoundingClientRect()
                          setTooltipPos({ x: rect.left + rect.width / 2, y: rect.top - 8 })
                        }
                      }}
                      onMouseLeave={() => setHoveredDay(null)}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-end mt-3 gap-2">
            <span className="text-xs" style={{ color: '#848E9C' }}>
              {language === 'zh' ? '亏损' : 'Loss'}
            </span>
            {[-0.8, -0.4, 0, 0.4, 0.8].map((v, i) => (
              <div
                key={i}
                className="rounded-sm"
                style={{
                  width: '12px',
                  height: '12px',
                  background: v === 0 ? '#1E2329' : getColor(v * maxAbs, maxAbs),
                  border: '1px solid rgba(43, 49, 57, 0.5)',
                }}
              />
            ))}
            <span className="text-xs" style={{ color: '#848E9C' }}>
              {language === 'zh' ? '盈利' : 'Profit'}
            </span>
          </div>

          {/* Tooltip */}
          {hoveredDay && (
            <div
              className="fixed rounded-lg p-3 text-xs z-50 pointer-events-none"
              style={{
                background: '#1E2329',
                border: '1px solid #2B3139',
                left: tooltipPos.x,
                top: tooltipPos.y,
                transform: 'translate(-50%, -100%)',
              }}
            >
              <p style={{ color: '#EAECEF' }} className="font-semibold">{hoveredDay.date}</p>
              <p style={{ color: hoveredDay.pnl >= 0 ? '#0ECB81' : '#F6465D' }}>
                P&L: ${hoveredDay.pnl.toFixed(2)}
              </p>
              <p style={{ color: '#848E9C' }}>
                {language === 'zh' ? '交易数' : 'Trades'}: {hoveredDay.trades}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
