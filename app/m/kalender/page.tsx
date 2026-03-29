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
  HADIR:        { label: "Hadir",        bg: "bg-emerald-50 dark:bg-emerald-900/20",  text: "text-emerald-700 dark:text-emerald-400", dot: "bg-emerald-500" },
  TERLAMBAT:    { label: "Hadir",        bg: "bg-emerald-50 dark:bg-emerald-900/20",  text: "text-emerald-700 dark:text-emerald-400", dot: "bg-emerald-500" },
  CUTI:         { label: "Cuti",         bg: "bg-purple-50 dark:bg-purple-900/20",    text: "text-purple-700 dark:text-purple-400",   dot: "bg-purple-500" },
  IZIN:         { label: "Izin",         bg: "bg-blue-50 dark:bg-blue-900/20",        text: "text-blue-700 dark:text-blue-400",       dot: "bg-blue-500" },
  SAKIT:        { label: "Sakit",        bg: "bg-orange-50 dark:bg-orange-900/20",    text: "text-orange-700 dark:text-orange-400",   dot: "bg-orange-500" },
  ALPA:         { label: "Alpha",        bg: "bg-rose-100 dark:bg-rose-900/30",       text: "text-rose-800 dark:text-rose-300",       dot: "bg-rose-600" },
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
    <div className="min-h-screen bg-[#f4f7f6] dark:bg-black font-sans pb-24 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#1e3a5f] to-[#0d0d12] pt-12 pb-6 px-5 rounded-b-3xl shadow-sm text-white">
        <div className="flex items-center gap-3">
          <Link href="/m/dashboard" className="p-2 rounded-xl bg-white/10 text-white active:scale-95 transition-transform">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-bold tracking-wide">Kalender Kehadiran</h1>
        </div>
      </div>

      <div className="flex-1 px-5 mt-4 space-y-4">
        
        {/* Navigasi Bulan */}
        <div className="flex items-center justify-between bg-white dark:bg-neutral-900 rounded-2xl p-3 shadow-sm border border-neutral-100 dark:border-neutral-800">
          <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 bg-neutral-50 dark:bg-neutral-800 rounded-xl active:scale-95 text-neutral-600 dark:text-neutral-400">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="font-bold text-neutral-800 dark:text-neutral-200">
            {format(currentMonth, "MMMM yyyy", { locale: id })}
          </div>
          <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 bg-neutral-50 dark:bg-neutral-800 rounded-xl active:scale-95 text-neutral-600 dark:text-neutral-400">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Ringkasan */}
        <div className="grid grid-cols-5 gap-2">
          {[
            { label: "H", v: totalHadir, c: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
            { label: "S", v: totalSakit, c: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-900/20" },
            { label: "I", v: totalIzin, c: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/20" },
            { label: "C", v: totalCuti, c: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-900/20" },
            { label: "A", v: totalAlpha, c: "text-rose-500", bg: "bg-rose-50 dark:bg-rose-900/20" }
          ].map(item => (
            <div key={item.label} className={cn("rounded-xl py-3 flex flex-col items-center justify-center", item.bg)}>
              <span className={cn("text-lg font-bold leading-none", item.c)}>{item.v}</span>
              <span className="text-[10px] uppercase font-bold text-neutral-500 mt-1">{item.label}</span>
            </div>
          ))}
        </div>

        {/* Kalender */}
        <div className="bg-white dark:bg-neutral-900 rounded-3xl p-4 shadow-sm border border-neutral-100 dark:border-neutral-800">
          {loading ? (
            <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-emerald-600 w-8 h-8" /></div>
          ) : (
            <>
              <div className="grid grid-cols-7 mb-2">
                {weekDays.map(d => (
                  <div key={d} className="text-center text-[11px] font-bold text-neutral-400 py-1">{d}</div>
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
                        "relative flex flex-col items-center justify-center min-h-[48px] rounded-2xl border-2 transition-all",
                        isSel ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20" : "border-transparent",
                        !isSel && cfg ? cfg.bg : "",
                        !isSel && !cfg && isWknd ? "bg-neutral-50 dark:bg-neutral-800/50" : ""
                      )}
                    >
                      <span className={cn("text-sm font-bold", isToday ? "text-white bg-emerald-600 rounded-full w-6 h-6 flex items-center justify-center" : (cfg ? cfg.text : "text-neutral-700 dark:text-neutral-300"), isWknd && !cfg && "text-neutral-400")}>
                        {format(date, "d")}
                      </span>
                      {cfg && <span className={cn("absolute bottom-1 w-1.5 h-1.5 rounded-full", cfg.dot)} />}
                    </button>
                  )
                })}
              </div>
            </>
          )}
        </div>

        {/* Detail Hari Terpilih */}
        {selectedDay && dayMap[selectedDay] && (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl p-4 shadow-sm border border-neutral-100 dark:border-neutral-800 animate-in slide-in-from-bottom-4">
            <h3 className="text-sm font-bold text-neutral-800 dark:text-neutral-200 mb-3">Detail {format(new Date(selectedDay), "dd MMM yyyy", { locale: id })}</h3>
            <div className="flex items-center gap-3 bg-neutral-50 dark:bg-neutral-800/50 p-3 rounded-xl">
              <span className={cn("w-2 h-2 rounded-full", STATUS_CONFIG_EXT[dayMap[selectedDay].status]?.dot || "bg-neutral-400")} />
              <div className="flex-1">
                <p className="text-sm font-bold text-neutral-800 dark:text-neutral-200">{STATUS_CONFIG_EXT[dayMap[selectedDay].status]?.label || dayMap[selectedDay].status}</p>
                {dayMap[selectedDay].jamMasuk && <p className="text-xs text-neutral-500 mt-0.5">Masuk: {format(new Date(dayMap[selectedDay].jamMasuk), "HH:mm")}</p>}
                {dayMap[selectedDay].jamKeluar && <p className="text-xs text-neutral-500">Keluar: {format(new Date(dayMap[selectedDay].jamKeluar), "HH:mm")}</p>}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
