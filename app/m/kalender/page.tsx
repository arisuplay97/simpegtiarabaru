"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths } from "date-fns"
import { id } from "date-fns/locale"
import { ChevronLeft, ChevronRight, Loader2, ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import { getKalenderPegawai } from "@/lib/actions/indeks"
import Link from "next/link"

const STATUS_CONFIG_EXT: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  HADIR:        { label: "Hadir",        bg: "bg-emerald-500/10", text: "text-emerald-700 dark:text-emerald-400", dot: "bg-emerald-500" },
  TERLAMBAT:    { label: "Terlambat",    bg: "bg-amber-500/10",   text: "text-amber-700 dark:text-amber-400",     dot: "bg-amber-500" },
  CUTI:         { label: "Cuti",         bg: "bg-purple-500/10",  text: "text-purple-700 dark:text-purple-400",   dot: "bg-purple-500" },
  IZIN:         { label: "Izin",         bg: "bg-sky-500/10",     text: "text-sky-700 dark:text-sky-400",         dot: "bg-sky-500" },
  SAKIT:        { label: "Sakit",        bg: "bg-orange-500/10",  text: "text-orange-700 dark:text-orange-400",   dot: "bg-orange-500" },
  ALPA:         { label: "Alpa",         bg: "bg-rose-500/10",    text: "text-rose-700 dark:text-rose-400",       dot: "bg-rose-500" },
}

export default function MobileKalender() {
  const { data: session } = useSession()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [dayMap, setDayMap] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(false)
  const [selectedDay, setSelectedDay] = useState<string | null>(null)

  const bulan = currentMonth.getMonth() + 1
  const tahun = currentMonth.getFullYear()

  const loadData = useCallback(async () => {
    if (!session?.user) return
    setLoading(true)
    try {
      const res = await (getKalenderPegawai as any)(null, bulan, tahun)
      if (res) setDayMap(res.dayMap || {})
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [bulan, tahun, session])

  useEffect(() => { loadData() }, [loadData])

  const firstDayOfMonth = startOfMonth(currentMonth)
  const lastDayOfMonth = endOfMonth(currentMonth)
  const daysInMonth = eachDayOfInterval({ start: firstDayOfMonth, end: lastDayOfMonth })
  const firstDayIndex = (getDay(firstDayOfMonth) + 6) % 7
  const weekDays = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"]
  const todayStr = new Date().toISOString().split('T')[0]

  const isWeekend = (date: Date) => date.getDay() === 0 || date.getDay() === 6

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
    <div className="min-h-screen bg-zinc-50 dark:bg-[#09090b] font-sans pb-24 flex flex-col">
      {/* Header */}
      <div 
        className="sticky top-0 z-20 bg-white/85 dark:bg-zinc-950/85 backdrop-blur-md border-b border-zinc-200/80 dark:border-zinc-800 px-4 py-3 flex items-center justify-between shadow-2xs"
        style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}
      >
        <div className="flex items-center gap-2.5">
          <Link 
            href="/m/dashboard"
            className="p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-base font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">Kalender Kehadiran</h1>
        </div>
      </div>

      <div className="flex-1 px-4 mt-4 space-y-3.5 max-w-md mx-auto w-full">
        
        {/* Navigasi Bulan */}
        <div className="flex items-center justify-between bg-white dark:bg-zinc-900 rounded-2xl p-2.5 shadow-2xs border border-zinc-200/80 dark:border-zinc-800">
          <button 
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} 
            className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl active:scale-95 text-zinc-700 dark:text-zinc-300 transition-transform"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
            {format(currentMonth, "MMMM yyyy", { locale: id })}
          </div>
          <button 
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} 
            className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl active:scale-95 text-zinc-700 dark:text-zinc-300 transition-transform"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Ringkasan */}
        <div className="grid grid-cols-5 gap-2">
          {[
            { label: "Hadir", v: totalHadir, c: "text-emerald-600 dark:text-emerald-400" },
            { label: "Sakit", v: totalSakit, c: "text-amber-600 dark:text-amber-400" },
            { label: "Izin",  v: totalIzin,  c: "text-sky-600 dark:text-sky-400" },
            { label: "Cuti",  v: totalCuti,  c: "text-purple-600 dark:text-purple-400" },
            { label: "Alpa",  v: totalAlpha, c: "text-rose-600 dark:text-rose-400" }
          ].map(item => (
            <div 
              key={item.label} 
              className="rounded-xl py-2.5 flex flex-col items-center justify-center bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-2xs"
            >
              <span className={cn("text-base font-bold leading-none tabular-nums", item.c)}>{item.v}</span>
              <span className="text-[10px] uppercase font-semibold text-zinc-400 dark:text-zinc-500 mt-1">{item.label}</span>
            </div>
          ))}
        </div>

        {/* Kalender */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-2xs border border-zinc-200/80 dark:border-zinc-800">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="animate-spin text-zinc-400 w-7 h-7" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-7 mb-2">
                {weekDays.map(d => (
                  <div key={d} className="text-center text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 py-1">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: firstDayIndex }).map((_, i) => <div key={`empty-${i}`} />)}
                {daysInMonth.map(date => {
                  const dateStr = format(date, "yyyy-MM-dd")
                  const data = dayMap[dateStr]
                  const isWknd = isWeekend(date)
                  const isToday = dateStr === todayStr
                  const isSel = dateStr === selectedDay
                  let st = data?.status
                  if (!st && !isWknd && date < new Date(new Date().setHours(0,0,0,0))) st = "ALPA"
                  const cfg = st ? STATUS_CONFIG_EXT[st] : null

                  return (
                    <button
                      key={dateStr}
                      onClick={() => setSelectedDay(isSel ? null : dateStr)}
                      className={cn(
                        "relative flex flex-col items-center justify-center min-h-[44px] rounded-xl border transition-all",
                        isSel ? "border-zinc-900 dark:border-white bg-zinc-100 dark:bg-zinc-800" : "border-transparent",
                        !isSel && cfg ? cfg.bg : "",
                        !isSel && !cfg && isWknd ? "bg-zinc-100/50 dark:bg-zinc-800/30" : ""
                      )}
                    >
                      <span className={cn(
                        "text-xs font-bold leading-none tabular-nums", 
                        isToday 
                          ? "text-white bg-zinc-900 dark:bg-white dark:text-zinc-900 rounded-full w-5 h-5 flex items-center justify-center" 
                          : (cfg ? cfg.text : "text-zinc-700 dark:text-zinc-300"), 
                        isWknd && !cfg && "text-zinc-400"
                      )}>
                        {format(date, "d")}
                      </span>
                      {cfg && <span className={cn("absolute bottom-1 w-1 h-1 rounded-full", cfg.dot)} />}
                    </button>
                  )
                })}
              </div>
            </>
          )}
        </div>

        {/* Detail Hari Terpilih */}
        {selectedDay && dayMap[selectedDay] && (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-2xs border border-zinc-200/80 dark:border-zinc-800">
            <h3 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-2">
              Detail {format(new Date(selectedDay), "dd MMMM yyyy", { locale: id })}
            </h3>
            <div className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded-xl border border-zinc-200/60 dark:border-zinc-800">
              <span className={cn("w-2 h-2 rounded-full shrink-0", STATUS_CONFIG_EXT[dayMap[selectedDay].status]?.dot || "bg-zinc-400")} />
              <div className="flex-1">
                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{STATUS_CONFIG_EXT[dayMap[selectedDay].status]?.label || dayMap[selectedDay].status}</p>
                {dayMap[selectedDay].jamMasuk && <p className="text-xs text-zinc-500 mt-0.5 tabular-nums">Masuk: {format(new Date(dayMap[selectedDay].jamMasuk), "HH:mm")}</p>}
                {dayMap[selectedDay].jamKeluar && <p className="text-xs text-zinc-500 tabular-nums">Keluar: {format(new Date(dayMap[selectedDay].jamKeluar), "HH:mm")}</p>}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
