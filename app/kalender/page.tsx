"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, getDaysInMonth, addMonths, subMonths } from "date-fns"
import { id } from "date-fns/locale"
import { ChevronLeft, ChevronRight, Calendar, TrendingUp, AlertTriangle, Clock, CheckCircle, XCircle, Loader2, Info } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { getKalenderPegawai } from "@/lib/actions/indeks"
import { SidebarNav, SidebarProvider, useSidebar } from "@/components/simpeg/sidebar-nav"
import { TopBar } from "@/components/simpeg/top-bar"

// ─── Config ──────────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  HADIR:        { label: "Hadir",        bg: "bg-emerald-50 dark:bg-emerald-900/20",  text: "text-emerald-700 dark:text-emerald-400", dot: "bg-emerald-500" },
  TERLAMBAT:    { label: "Hadir",        bg: "bg-emerald-50 dark:bg-emerald-900/20",  text: "text-emerald-700 dark:text-emerald-400", dot: "bg-emerald-500" },
  CUTI:         { label: "Cuti",         bg: "bg-purple-50 dark:bg-purple-900/20",    text: "text-purple-700 dark:text-purple-400",   dot: "bg-purple-500" },
  IZIN:         { label: "Izin",         bg: "bg-blue-50 dark:bg-blue-900/20",        text: "text-blue-700 dark:text-blue-400",       dot: "bg-blue-500" },
  SAKIT:        { label: "Sakit",        bg: "bg-orange-50 dark:bg-orange-900/20",    text: "text-orange-700 dark:text-orange-400",   dot: "bg-orange-500" },
  ALPA:         { label: "Alpha",        bg: "bg-rose-100 dark:bg-rose-900/30",       text: "text-rose-800 dark:text-rose-300",       dot: "bg-rose-600" },
  CUTI_PENDING: { label: "Cuti (Pending)", bg: "bg-stone-50 dark:bg-stone-800/30",   text: "text-stone-500 dark:text-stone-400",     dot: "bg-stone-400" },
}

const DINAS_STATUS = "DINAS"
const STATUS_CONFIG_EXT: Record<string, typeof STATUS_CONFIG[string]> = {
  ...STATUS_CONFIG,
  DINAS: { label: "Dinas Luar", bg: "bg-cyan-50 dark:bg-cyan-900/20", text: "text-cyan-700 dark:text-cyan-400", dot: "bg-cyan-500" },
}

// ─── Main Component ───────────────────────────────────────────────────────────
function KalenderContent() {
  const { data: session } = useSession()
  const { mobileOpen } = useSidebar()

  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [dayMap, setDayMap] = useState<Record<string, any>>({})
  const [summary, setSummary] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(false)
  const [selectedDay, setSelectedDay] = useState<string | null>(null)

  const bulan = currentMonth.getMonth() + 1
  const tahun = currentMonth.getFullYear()

  const loadData = useCallback(async () => {
    if (!session?.user) return
    setLoading(true)
    try {
      // For now, fetch for self. HRD feature can be extended.
      const res = await (getKalenderPegawai as any)(null, bulan, tahun) // server action gets session internally
      if (res) {
        setDayMap(res.dayMap || {})
        setSummary(res.summary || {})
      }
    } catch (error) {
      console.error("Error loading kalender:", error)
    } finally {
      setLoading(false)
    }
  }, [bulan, tahun, session])

  useEffect(() => { loadData() }, [loadData])

  // Generate calendar grid
  const firstDayOfMonth = startOfMonth(currentMonth)
  const lastDayOfMonth = endOfMonth(currentMonth)
  const daysInMonth = eachDayOfInterval({ start: firstDayOfMonth, end: lastDayOfMonth })
  const firstDayIndex = (getDay(firstDayOfMonth) + 6) % 7 // Monday start

  const weekDays = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"]

  const selectedDayData = selectedDay ? dayMap[selectedDay] : null
  const todayStr = new Date().toISOString().split('T')[0]

  const isWeekend = (date: Date) => {
    const d = date.getDay()
    return d === 0 || d === 6
  }

  // Calculate strict visual summary
  let totalHadir = 0; let totalCuti = 0; let totalIzin = 0; let totalSakit = 0; let totalAlpha = 0;
  daysInMonth.forEach(date => {
    const dateStr = format(date, "yyyy-MM-dd")
    let status = dayMap[dateStr]?.status
    if (!status && !isWeekend(date) && date < new Date(new Date().setHours(0,0,0,0))) status = "ALPA"
    if (status === "HADIR" || status === "TERLAMBAT") totalHadir++
    else if (status === "CUTI" || status === "CUTI_PENDING") totalCuti++
    else if (status === "IZIN") totalIzin++
    else if (status === "SAKIT") totalSakit++
    else if (status === "ALPA") totalAlpha++
  })

  return (
    <div className="flex min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <SidebarNav />
      <div
        className="flex-1 flex flex-col min-h-screen transition-all duration-300"
        style={{ marginLeft: "var(--sidebar-width, 16rem)" }}
      >
        <TopBar breadcrumb={["Dashboard", "Kalender Kehadiran"]} />

        <main className="flex-1 p-4 md:p-6 space-y-5">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-neutral-900 dark:text-white">Kalender Kehadiran</h1>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">Riwayat kehadiran, cuti, dan ketidakhadiran Anda</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="h-9 px-3" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="min-w-[140px] text-center font-semibold text-sm text-neutral-900 dark:text-white">
                {format(currentMonth, "MMMM yyyy", { locale: id })}
              </div>
              <Button variant="outline" size="sm" className="h-9 px-3" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" className="h-9 text-xs" onClick={() => setCurrentMonth(new Date())}>
                Hari Ini
              </Button>
            </div>
          </div>

          {/* Summary Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { label: "Hadir", value: totalHadir, icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
              { label: "Cuti", value: totalCuti, icon: Calendar, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-900/20" },
              { label: "Izin", value: totalIzin, icon: Info, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/20" },
              { label: "Sakit", value: totalSakit, icon: AlertTriangle, color: "text-orange-600", bg: "bg-orange-50 dark:bg-orange-900/20" },
              { label: "Alpha", value: totalAlpha, icon: XCircle, color: "text-rose-700", bg: "bg-rose-50 dark:bg-rose-900/20" },
            ].map(item => (
              <Card key={item.label} className={cn("border-none shadow-sm", item.bg)}>
                <CardContent className="p-3 flex items-center gap-2">
                  <item.icon className={cn("h-5 w-5 shrink-0", item.color)} />
                  <div>
                    <div className={cn("text-xl font-bold leading-none", item.color)}>{item.value}</div>
                    <div className="text-[10px] font-medium text-neutral-500 mt-0.5">{item.label}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-5">
            {/* Calendar Grid */}
            <Card className="lg:col-span-2 border border-neutral-100 dark:border-neutral-800 shadow-sm bg-white dark:bg-neutral-900">
              <CardContent className="p-4">
                {loading ? (
                  <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                  </div>
                ) : (
                  <>
                    {/* Weekday Headers */}
                    <div className="grid grid-cols-7 mb-2">
                      {weekDays.map(d => (
                        <div key={d} className={cn(
                          "text-center text-[11px] font-semibold py-1.5",
                          d === "Sab" || d === "Min" ? "text-neutral-400" : "text-neutral-500 dark:text-neutral-400"
                        )}>{d}</div>
                      ))}
                    </div>

                    {/* Day Grid */}
                    <div className="grid grid-cols-7 gap-1">
                      {/* Empty cells before first day */}
                      {Array.from({ length: firstDayIndex }).map((_, i) => (
                        <div key={`empty-${i}`} />
                      ))}

                      {daysInMonth.map(date => {
                        const dateStr = format(date, "yyyy-MM-dd")
                        const data = dayMap[dateStr]
                        const isWknd = isWeekend(date)
                        const isToday = dateStr === todayStr
                        const isSelected = dateStr === selectedDay
                        let status = data?.status
                        
                        // Flag missing days as Alpha if they are past workdays
                        if (!status && !isWknd && date < new Date(new Date().setHours(0,0,0,0))) {
                          status = "ALPA"
                        }
                        
                        const cfg = status ? (STATUS_CONFIG_EXT[status] || STATUS_CONFIG_EXT.HADIR) : null

                        return (
                          <button
                            key={dateStr}
                            onClick={() => setSelectedDay(isSelected ? null : dateStr)}
                            className={cn(
                              "relative rounded-xl p-2 min-h-[52px] flex flex-col items-center justify-start transition-all duration-150 border",
                              isSelected
                                ? "ring-2 ring-blue-500 border-blue-500"
                                : "border-transparent",
                              cfg
                                ? cn(cfg.bg, "hover:opacity-90")
                                : isWknd
                                  ? "bg-neutral-50 dark:bg-neutral-800/30 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                                  : "hover:bg-neutral-50 dark:hover:bg-neutral-800",
                            )}
                          >
                            <span className={cn(
                              "text-[13px] font-semibold leading-none",
                              isToday
                                ? "bg-blue-600 text-white w-6 h-6 flex items-center justify-center rounded-full text-[11px]"
                                : cfg ? cfg.text : isWknd ? "text-neutral-400" : "text-neutral-700 dark:text-neutral-300"
                            )}>
                              {format(date, "d")}
                            </span>

                            {cfg && (
                              <span className={cn("mt-1 w-1.5 h-1.5 rounded-full", cfg.dot)} />
                            )}
                          </button>
                        )
                      })}
                    </div>

                    {/* Legend */}
                    <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800">
                      {Object.keys(STATUS_CONFIG_EXT).filter(k => k !== 'TERLAMBAT' && k !== 'CUTI_PENDING').map(key => {
                        const cfg = STATUS_CONFIG_EXT[key];
                        return (
                          <div key={key} className="flex items-center gap-1.5">
                            <span className={cn("w-2 h-2 rounded-full", cfg.dot)} />
                            <span className="text-[11px] text-neutral-500">{cfg.label}</span>
                          </div>
                        )
                      })}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Detail Panel */}
            <div className="flex flex-col gap-4">
              {selectedDayData ? (
                <Card className="border border-neutral-100 dark:border-neutral-800 shadow-sm bg-white dark:bg-neutral-900">
                  <CardHeader className="pb-2 pt-4 px-4 border-b border-neutral-100 dark:border-neutral-800">
                    <CardTitle className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">
                      Detail — {selectedDay && format(new Date(selectedDay!), "d MMMM yyyy", { locale: id })}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-3">
                    {(() => {
                      const cfg = STATUS_CONFIG_EXT[selectedDayData.status]
                      return (
                        <div className={cn("flex items-center gap-2 rounded-xl px-3 py-2", cfg?.bg || "bg-neutral-50")}>
                          <span className={cn("w-2 h-2 rounded-full", cfg?.dot || "bg-neutral-400")} />
                          <span className={cn("font-semibold text-sm", cfg?.text || "text-neutral-600")}>
                            {cfg?.label || selectedDayData.status}
                          </span>
                        </div>
                      )
                    })()}

                    {selectedDayData.jamMasuk && (
                      <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                        <Clock className="h-4 w-4 text-neutral-400" />
                        <span>Masuk: {format(new Date(selectedDayData.jamMasuk), "HH:mm")}</span>
                      </div>
                    )}
                    {selectedDayData.jamKeluar && (
                      <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                        <Clock className="h-4 w-4 text-neutral-400" />
                        <span>Keluar: {format(new Date(selectedDayData.jamKeluar), "HH:mm")}</span>
                      </div>
                    )}
                    {selectedDayData.jenisCuti && (
                      <div className="text-sm">
                        <span className="text-neutral-400 text-xs">Jenis:</span>
                        <p className="font-medium text-neutral-700 dark:text-neutral-300">{selectedDayData.jenisCuti}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card className="border border-neutral-100 dark:border-neutral-800 shadow-sm bg-white dark:bg-neutral-900">
                  <CardContent className="flex flex-col items-center justify-center h-36 text-neutral-400 gap-2">
                    <Calendar className="h-8 w-8 opacity-30" />
                    <p className="text-xs">Klik tanggal untuk detail</p>
                  </CardContent>
                </Card>
              )}

              {/* Month summary card */}
              <Card className="border border-neutral-100 dark:border-neutral-800 shadow-sm bg-white dark:bg-neutral-900">
                <CardContent className="p-4">
                  <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">Ringkasan Bulan</p>
                  <div className="space-y-2">
                    {[
                      { label: "Hari Kerja Efektif (perkiraan)", value: daysInMonth.filter(d => !isWeekend(d) && d <= new Date()).length, color: "text-neutral-600 dark:text-neutral-300" },
                      { label: "Hadir", value: totalHadir, color: "text-emerald-600" },
                      { label: "Alpha", value: totalAlpha, color: "text-rose-600" },
                    ].map(item => (
                      <div key={item.label} className="flex items-center justify-between">
                        <span className="text-xs text-neutral-500">{item.label}</span>
                        <span className={cn("text-sm font-bold", item.color)}>{item.value}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default function KalenderPage() {
  return (
    <SidebarProvider>
      <KalenderContent />
    </SidebarProvider>
  )
}
