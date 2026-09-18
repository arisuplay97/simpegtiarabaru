"use client"

import { useEffect, useState, useMemo } from "react"
import { SidebarNav } from "@/components/simpeg/sidebar-nav"
import { TopBar } from "@/components/simpeg/top-bar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog"
import {
  Loader2,
  Users,
  Building2,
  Briefcase,
  Search,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Network,
  LayoutGrid,
  MapPin,
  ChevronDown,
  ChevronUp,
  Mail,
  Phone,
} from "lucide-react"

// ─── Interfaces ─────────────────────────────────────────────────────────────
interface P {
  id: string
  nama: string
  jabatan: string
  tipeJabatan: string
  fotoUrl?: string | null
  subBidangId?: string | null
  atasanLangsung?: string | null
  email?: string | null
  telepon?: string | null
  golongan?: string | null
}

interface Sub {
  id: string
  nama: string
  pegawai: P[]
}

interface Bid {
  id: string
  nama: string
  kode: string
  direkturAtasan?: string | null
  kepalaBidang?: string | null
  subBidang: Sub[]
  pegawai: P[]
}

interface OrgData {
  direksiList: P[]
  bidangList: Bid[]
  stats: {
    totalPegawai: number
    totalBidang: number
    totalJabatan: number
  }
}

function getInitials(name: string) {
  if (!name) return "P"
  const parts = name.trim().split(" ")
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

// ─── Main Component ─────────────────────────────────────────────────────────
export default function OrganisasiPage() {
  const [data, setData] = useState<OrgData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // Controls
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"tree" | "grid">("tree")
  const [detailMode, setDetailMode] = useState<"compact" | "full">("compact")
  const [filterTab, setFilterTab] = useState<"all" | "pusat" | "cabang">("all")
  const [zoomLevel, setZoomLevel] = useState(100)
  const [selectedPerson, setSelectedPerson] = useState<{ person: P; unitName?: string } | null>(null)
  const [expandedBidang, setExpandedBidang] = useState<Record<string, boolean>>({})

  useEffect(() => {
    fetch("/api/organisasi")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error)
        setData(d)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const toggleBidangExpand = (bidangId: string) => {
    setExpandedBidang((prev) => ({ ...prev, [bidangId]: !prev[bidangId] }))
  }

  // Grouping logic
  const {
    dirut,
    direksiBidang,
    staffUnits,
    bidangUmumKeuangan,
    bidangOperasional,
    cabangList,
    otherBidang,
  } = useMemo(() => {
    if (!data) {
      return {
        dirut: null,
        direksiBidang: [],
        staffUnits: [],
        bidangUmumKeuangan: [],
        bidangOperasional: [],
        cabangList: [],
        otherBidang: [],
      }
    }

    const dirutObj = data.direksiList.find(
      (d) =>
        d.jabatan.toLowerCase().includes("utama") ||
        d.jabatan.toLowerCase().includes("dirut")
    )

    const otherDir = data.direksiList.filter((d) => d.id !== dirutObj?.id)

    // Cabang detection
    const cabangs = data.bidangList.filter(
      (b) =>
        b.nama.toLowerCase().includes("cabang") ||
        b.kode?.toLowerCase().startsWith("c")
    )

    const pusat = data.bidangList.filter(
      (b) =>
        !b.nama.toLowerCase().includes("cabang") &&
        !b.kode?.toLowerCase().startsWith("c")
    )

    // Staff units directly reporting to Dirut (Sekper & SPI)
    const staff = pusat.filter(
      (b) =>
        b.nama.toLowerCase().includes("sekretariat") ||
        b.nama.toLowerCase().includes("spi") ||
        (b.direkturAtasan &&
          b.direkturAtasan.toLowerCase().includes("utama"))
    )

    const nonStaffPusat = pusat.filter(
      (b) => !staff.some((s) => s.id === b.id)
    )

    // Direktur Umum & Keuangan
    const dirUmum = otherDir.find(
      (d) =>
        d.jabatan.toLowerCase().includes("umum") ||
        d.jabatan.toLowerCase().includes("keuangan")
    )
    // Direktur Operasional / Teknik
    const dirOps = otherDir.find(
      (d) =>
        d.jabatan.toLowerCase().includes("operasional") ||
        d.jabatan.toLowerCase().includes("teknik")
    )

    const remainingDir = otherDir.filter(
      (d) => d.id !== dirUmum?.id && d.id !== dirOps?.id
    )

    // Bidang under Umum & Keuangan
    const bUmumKeuangan = nonStaffPusat.filter((b) => {
      const at = (b.direkturAtasan || "").toLowerCase()
      return (
        at.includes("umum") ||
        at.includes("keuangan") ||
        b.nama.toLowerCase().includes("sdm") ||
        b.nama.toLowerCase().includes("keuangan") ||
        b.nama.toLowerCase().includes("langganan")
      )
    })

    // Bidang under Operasional
    const bOps = nonStaffPusat.filter((b) => {
      const at = (b.direkturAtasan || "").toLowerCase()
      return (
        at.includes("operasional") ||
        at.includes("teknik") ||
        b.nama.toLowerCase().includes("produksi") ||
        b.nama.toLowerCase().includes("transmisi") ||
        b.nama.toLowerCase().includes("distribusi") ||
        b.nama.toLowerCase().includes("rencana")
      )
    })

    // Catch any remaining
    const assignedIds = new Set([
      ...bUmumKeuangan.map((b) => b.id),
      ...bOps.map((b) => b.id),
    ])
    const unassigned = nonStaffPusat.filter((b) => !assignedIds.has(b.id))

    return {
      dirut: dirutObj,
      direksiBidang: [
        ...(dirUmum ? [{ dir: dirUmum, bidang: bUmumKeuangan }] : []),
        ...(dirOps ? [{ dir: dirOps, bidang: bOps }] : []),
        ...remainingDir.map((d) => ({ dir: d, bidang: unassigned })),
      ],
      staffUnits: staff,
      bidangUmumKeuangan: bUmumKeuangan,
      bidangOperasional: bOps,
      cabangList: cabangs,
      otherBidang: unassigned,
    }
  }, [data])

  // Search filter helper
  const isMatch = (text?: string | null) => {
    if (!searchQuery.trim()) return false
    return (text || "").toLowerCase().includes(searchQuery.trim().toLowerCase())
  }

  const isPersonMatched = (p: P) => {
    return isMatch(p.nama) || isMatch(p.jabatan) || isMatch(p.tipeJabatan)
  }

  const isBidangMatched = (b: Bid) => {
    if (isMatch(b.nama) || isMatch(b.kode) || isMatch(b.kepalaBidang)) return true
    if (b.pegawai.some(isPersonMatched)) return true
    if (b.subBidang.some((s) => isMatch(s.nama) || s.pegawai.some(isPersonMatched))) return true
    return false
  }

  // Count search matches
  const matchCount = useMemo(() => {
    if (!data || !searchQuery.trim()) return 0
    let count = 0
    data.direksiList.forEach((d) => {
      if (isPersonMatched(d)) count++
    })
    data.bidangList.forEach((b) => {
      if (isMatch(b.nama) || isMatch(b.kode)) count++
      b.pegawai.forEach((p) => {
        if (isPersonMatched(p)) count++
      })
      b.subBidang.forEach((s) => {
        if (isMatch(s.nama)) count++
        s.pegawai.forEach((p) => {
          if (isPersonMatched(p)) count++
        })
      })
    })
    return count
  }, [data, searchQuery])

  return (
    <div className="flex min-h-screen bg-background">
      <SidebarNav />
      <div className="flex flex-1 flex-col sidebar-offset min-w-0">
        <TopBar breadcrumb={["Kepegawaian", "Struktur Organisasi"]} />

        <main className="flex-1 p-4 md:p-6 lg:p-8 space-y-6 max-w-full">
          {/* Header & Stats Banner */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-border/60">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/25 font-semibold">
                  SOTK Resmi Perumda
                </Badge>
                <span className="text-xs text-muted-foreground">Tirta Ardhia Rinjani</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                Bagan Struktur Organisasi
              </h1>
              <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
                Hierarki kepemimpinan, satuan kerja operasional, dan staf divisi kantor pusat & cabang.
              </p>
            </div>

            {/* Quick KPI Stat Strips */}
            {data && (
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-card border border-border/80 shadow-xs">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground leading-none">Total Personel</div>
                    <div className="text-sm font-bold text-foreground mt-0.5">
                      {data.stats.totalPegawai} <span className="text-[10px] font-normal text-muted-foreground">Pegawai</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-card border border-border/80 shadow-xs">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground leading-none">Satuan Kerja</div>
                    <div className="text-sm font-bold text-foreground mt-0.5">
                      {data.stats.totalBidang} <span className="text-[10px] font-normal text-muted-foreground">Divisi</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-card border border-border/80 shadow-xs">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground leading-none">Posisi Jabatan</div>
                    <div className="text-sm font-bold text-foreground mt-0.5">
                      {data.stats.totalJabatan} <span className="text-[10px] font-normal text-muted-foreground">Formasi</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Control Bar: Search, View Mode, Zoom */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 p-3 rounded-2xl bg-card border border-border/70 shadow-xs">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[240px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Cari nama pegawai, jabatan, atau divisi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-xs bg-muted/40 border-border/60 focus:bg-background transition-colors"
              />
              {searchQuery && (
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 font-mono">
                    {matchCount} cocok
                  </Badge>
                  <button
                    onClick={() => setSearchQuery("")}
                    className="text-xs text-muted-foreground hover:text-foreground px-1 cursor-pointer"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>

            {/* Filter Tabs & Options */}
            <div className="flex items-center gap-2 flex-wrap justify-between lg:justify-end">
              {/* Scope filter */}
              <div className="flex items-center bg-muted/60 p-0.5 rounded-lg border border-border/50 text-xs font-medium">
                <button
                  onClick={() => setFilterTab("all")}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    filterTab === "all"
                      ? "bg-background text-foreground shadow-xs font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Semua
                </button>
                <button
                  onClick={() => setFilterTab("pusat")}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    filterTab === "pusat"
                      ? "bg-background text-foreground shadow-xs font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Kantor Pusat
                </button>
                <button
                  onClick={() => setFilterTab("cabang")}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    filterTab === "cabang"
                      ? "bg-background text-foreground shadow-xs font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Cabang & Wilayah
                </button>
              </div>

              {/* Detail toggle */}
              <div className="flex items-center bg-muted/60 p-0.5 rounded-lg border border-border/50 text-xs font-medium">
                <button
                  onClick={() => setDetailMode("compact")}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    detailMode === "compact"
                      ? "bg-background text-foreground shadow-xs font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  title="Tampilkan hanya Pimpinan & Ringkasan Staf"
                >
                  Ringkas
                </button>
                <button
                  onClick={() => setDetailMode("full")}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    detailMode === "full"
                      ? "bg-background text-foreground shadow-xs font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  title="Tampilkan seluruh Anggota & Staf"
                >
                  Lengkap
                </button>
              </div>

              {/* View mode toggle */}
              <div className="flex items-center bg-muted/60 p-0.5 rounded-lg border border-border/50 text-xs font-medium">
                <button
                  onClick={() => setViewMode("tree")}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    viewMode === "tree"
                      ? "bg-background text-foreground shadow-xs font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Network className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Hirarki</span>
                </button>
                <button
                  onClick={() => setViewMode("grid")}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    viewMode === "grid"
                      ? "bg-background text-foreground shadow-xs font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Direktori</span>
                </button>
              </div>

              {/* Zoom Controls (Active in Tree mode) */}
              {viewMode === "tree" && (
                <div className="flex items-center gap-1 pl-1 border-l border-border/60">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer"
                    onClick={() => setZoomLevel((z) => Math.max(z - 15, 60))}
                    disabled={zoomLevel <= 60}
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </Button>
                  <span className="text-[11px] font-mono text-muted-foreground w-10 text-center select-none">
                    {zoomLevel}%
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer"
                    onClick={() => setZoomLevel((z) => Math.min(z + 15, 130))}
                    disabled={zoomLevel >= 130}
                    title="Zoom In"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer"
                    onClick={() => setZoomLevel(100)}
                    title="Reset Zoom"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Org Chart Body */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-xs text-muted-foreground animate-pulse">Memuat struktur organisasi...</p>
            </div>
          ) : error ? (
            <Card className="border-rose-200 dark:border-rose-900/50 bg-rose-50/20 dark:bg-rose-950/10">
              <CardContent className="p-8 text-center text-destructive space-y-2">
                <p className="font-semibold text-sm">Gagal memuat struktur organisasi</p>
                <p className="text-xs text-muted-foreground">{error}</p>
                <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                  Coba Lagi
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-8">
              {/* TREE VIEW */}
              {viewMode === "tree" && (
                <div className="overflow-x-auto pb-8 pt-4 rounded-2xl border border-border/70 bg-card/40 backdrop-blur-xs shadow-inner">
                  <div
                    className="min-w-max mx-auto px-8 transition-transform duration-200 origin-top flex flex-col items-center"
                    style={{ transform: `scale(${zoomLevel / 100})` }}
                  >
                    {/* TIER 1: DIREKTUR UTAMA */}
                    {dirut ? (
                      <div className="flex flex-col items-center relative">
                        {/* Executive Dirut Card */}
                        <ExecutiveCard
                          person={dirut}
                          roleTier="DIRUT"
                          isHighlight={searchQuery ? isPersonMatched(dirut) : false}
                          isDimmed={searchQuery ? !isPersonMatched(dirut) : false}
                          onClick={() => setSelectedPerson({ person: dirut, unitName: "Direksi" })}
                        />

                        {/* Central Stem Down from Dirut */}
                        <div className="w-0.5 h-8 bg-border" />

                        {/* STAFF UNITS DIRECTLY REPORTING TO DIRUT (SPI & SEKPER) */}
                        {staffUnits.length > 0 && filterTab !== "cabang" && (
                          <div className="flex flex-col items-center mb-6">
                            {/* Horizontal staff connector badge */}
                            <div className="flex items-center gap-2 mb-3">
                              <div className="h-px w-8 bg-border" />
                              <span className="text-[10px] font-semibold text-purple-600 dark:text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                Satuan Pengawas & Staf Direksi
                              </span>
                              <div className="h-px w-8 bg-border" />
                            </div>

                            <div className="flex items-start justify-center gap-6">
                              {staffUnits.map((b) => (
                                <DepartmentCard
                                  key={b.id}
                                  bidang={b}
                                  detailMode={detailMode}
                                  accentColor="purple"
                                  isExpanded={expandedBidang[b.id]}
                                  onToggleExpand={() => toggleBidangExpand(b.id)}
                                  onSelectPerson={(p) => setSelectedPerson({ person: p, unitName: b.nama })}
                                  isHighlight={searchQuery ? isBidangMatched(b) : false}
                                  isDimmed={searchQuery ? !isBidangMatched(b) : false}
                                />
                              ))}
                            </div>

                            {/* Stem continuing down to Executive Directors */}
                            <div className="w-0.5 h-8 bg-border mt-6" />
                          </div>
                        )}

                        {/* TIER 2: DIREKSI BIDANG (DIREKTUR UMUM & KEUANGAN, DIREKTUR OPERASIONAL) */}
                        {direksiBidang.length > 0 && filterTab !== "cabang" && (
                          <div className="flex flex-col items-center w-full">
                            {/* Horizontal distribution bar between directors */}
                            <div className="relative flex justify-center w-full pt-4">
                              {/* Horizontal T-bar */}
                              {direksiBidang.length > 1 && (
                                <div
                                  className="absolute top-0 h-0.5 bg-border"
                                  style={{
                                    left: "25%",
                                    right: "25%",
                                  }}
                                />
                              )}

                              <div className="flex items-start justify-center gap-12 sm:gap-20">
                                {direksiBidang.map(({ dir, bidang }) => (
                                  <div key={dir.id} className="flex flex-col items-center relative">
                                    {/* Vertical connector down from horizontal bar */}
                                    <div className="w-0.5 h-4 bg-border -mt-4 mb-0" />

                                    {/* Director Card */}
                                    <ExecutiveCard
                                      person={dir}
                                      roleTier="DIREKTUR"
                                      isHighlight={searchQuery ? isPersonMatched(dir) : false}
                                      isDimmed={searchQuery ? !isPersonMatched(dir) : false}
                                      subordinateCount={bidang.reduce(
                                        (acc, b) => acc + b.pegawai.length,
                                        0
                                      )}
                                      onClick={() => setSelectedPerson({ person: dir, unitName: "Direksi" })}
                                    />

                                    {/* Stem down to departments */}
                                    {bidang.length > 0 && (
                                      <>
                                        <div className="w-0.5 h-8 bg-border" />

                                        {/* TIER 3: DEPARTMENTS / BIDANG UNDER THIS DIRECTOR */}
                                        <div className="relative flex flex-col items-center">
                                          {/* Horizontal bar across departments */}
                                          {bidang.length > 1 && (
                                            <div
                                              className="absolute top-0 h-0.5 bg-border"
                                              style={{
                                                left: `${100 / (bidang.length * 2)}%`,
                                                right: `${100 / (bidang.length * 2)}%`,
                                              }}
                                            />
                                          )}

                                          <div className="flex items-start justify-center gap-6 pt-4">
                                            {bidang.map((b) => (
                                              <div key={b.id} className="flex flex-col items-center">
                                                {/* Vertical connector down to card */}
                                                <div className="w-0.5 h-4 bg-border -mt-4 mb-0" />
                                                <DepartmentCard
                                                  bidang={b}
                                                  detailMode={detailMode}
                                                  accentColor={
                                                    dir.jabatan.toLowerCase().includes("umum")
                                                      ? "emerald"
                                                      : "blue"
                                                  }
                                                  isExpanded={expandedBidang[b.id]}
                                                  onToggleExpand={() => toggleBidangExpand(b.id)}
                                                  onSelectPerson={(p) =>
                                                    setSelectedPerson({ person: p, unitName: b.nama })
                                                  }
                                                  isHighlight={searchQuery ? isBidangMatched(b) : false}
                                                  isDimmed={searchQuery ? !isBidangMatched(b) : false}
                                                />
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      </>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="py-12 text-center text-muted-foreground text-sm">
                        Data pimpinan Direktur Utama belum diatur.
                      </div>
                    )}

                    {/* TIER 4: KANTOR CABANG / WILAYAH */}
                    {cabangList.length > 0 && filterTab !== "pusat" && (
                      <div className="mt-16 w-full max-w-5xl">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="h-px flex-1 bg-border/60" />
                          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-semibold">
                            <MapPin className="w-3.5 h-3.5" />
                            <span>Unit Kerja Pelayanan Wilayah & Kantor Cabang</span>
                          </div>
                          <div className="h-px flex-1 bg-border/60" />
                        </div>

                        <div className="flex items-start justify-center gap-6 flex-wrap">
                          {cabangList.map((b) => (
                            <DepartmentCard
                              key={b.id}
                              bidang={b}
                              detailMode={detailMode}
                              accentColor="amber"
                              isExpanded={expandedBidang[b.id]}
                              onToggleExpand={() => toggleBidangExpand(b.id)}
                              onSelectPerson={(p) => setSelectedPerson({ person: p, unitName: b.nama })}
                              isHighlight={searchQuery ? isBidangMatched(b) : false}
                              isDimmed={searchQuery ? !isBidangMatched(b) : false}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* GRID DIRECTORY VIEW */}
              {viewMode === "grid" && (
                <div className="space-y-8">
                  {/* Direksi Section */}
                  {filterTab !== "cabang" && data && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                          Tingkat 1
                        </Badge>
                        <h2 className="text-base font-bold text-foreground">Dewan Direksi & Eksekutif</h2>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {data.direksiList.map((dir) => (
                          <ExecutiveCard
                            key={dir.id}
                            person={dir}
                            roleTier={dir.id === dirut?.id ? "DIRUT" : "DIREKTUR"}
                            isHighlight={searchQuery ? isPersonMatched(dir) : false}
                            isDimmed={searchQuery ? !isPersonMatched(dir) : false}
                            onClick={() => setSelectedPerson({ person: dir, unitName: "Direksi" })}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Kantor Pusat Divisions */}
                  {filterTab !== "cabang" && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20">
                          Tingkat 2
                        </Badge>
                        <h2 className="text-base font-bold text-foreground">Satuan Kerja Kantor Pusat</h2>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {[...staffUnits, ...bidangUmumKeuangan, ...bidangOperasional, ...otherBidang].map((b) => (
                          <DepartmentCard
                            key={b.id}
                            bidang={b}
                            detailMode={detailMode}
                            accentColor={
                              staffUnits.some((s) => s.id === b.id)
                                ? "purple"
                                : bidangUmumKeuangan.some((s) => s.id === b.id)
                                ? "emerald"
                                : "blue"
                            }
                            isExpanded={expandedBidang[b.id]}
                            onToggleExpand={() => toggleBidangExpand(b.id)}
                            onSelectPerson={(p) => setSelectedPerson({ person: p, unitName: b.nama })}
                            isHighlight={searchQuery ? isBidangMatched(b) : false}
                            isDimmed={searchQuery ? !isBidangMatched(b) : false}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Kantor Cabang */}
                  {filterTab !== "pusat" && cabangList.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20">
                          Wilayah
                        </Badge>
                        <h2 className="text-base font-bold text-foreground">Kantor Cabang & Pelayanan Luar</h2>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {cabangList.map((b) => (
                          <DepartmentCard
                            key={b.id}
                            bidang={b}
                            detailMode={detailMode}
                            accentColor="amber"
                            isExpanded={expandedBidang[b.id]}
                            onToggleExpand={() => toggleBidangExpand(b.id)}
                            onSelectPerson={(p) => setSelectedPerson({ person: p, unitName: b.nama })}
                            isHighlight={searchQuery ? isBidangMatched(b) : false}
                            isDimmed={searchQuery ? !isBidangMatched(b) : false}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Person Detail Profile Modal */}
      <Dialog open={!!selectedPerson} onOpenChange={(open) => !open && setSelectedPerson(null)}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden border-border/80">
          {selectedPerson && (
            <div>
              {/* Header Gradient */}
              <div className="h-20 bg-linear-to-r from-blue-600 via-indigo-600 to-primary relative px-6 flex items-end">
                <div className="absolute -bottom-8 left-6">
                  <Avatar className="w-18 h-18 border-4 border-background shadow-md">
                    <AvatarImage src={selectedPerson.person.fotoUrl || undefined} alt={selectedPerson.person.nama} />
                    <AvatarFallback className="bg-primary/20 text-primary text-base font-bold">
                      {getInitials(selectedPerson.person.nama)}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </div>

              {/* Body */}
              <div className="pt-10 p-6 space-y-4">
                <div>
                  <h3 className="text-base font-bold text-foreground">{selectedPerson.person.nama}</h3>
                  <p className="text-xs font-medium text-muted-foreground mt-0.5">{selectedPerson.person.jabatan}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-muted/40 border border-border/50">
                    <span className="text-[10px] text-muted-foreground block">Unit Kerja</span>
                    <span className="font-semibold text-foreground">{selectedPerson.unitName || "Perumda Tirta Ardhia Rinjani"}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-muted/40 border border-border/50">
                    <span className="text-[10px] text-muted-foreground block">Tipe Jabatan</span>
                    <Badge variant="outline" className="text-[10px] mt-0.5">
                      {selectedPerson.person.tipeJabatan || "STAFF"}
                    </Badge>
                  </div>
                  {selectedPerson.person.golongan && (
                    <div className="p-2.5 rounded-lg bg-muted/40 border border-border/50">
                      <span className="text-[10px] text-muted-foreground block">Golongan</span>
                      <span className="font-semibold text-foreground">{selectedPerson.person.golongan}</span>
                    </div>
                  )}
                  {selectedPerson.person.atasanLangsung && (
                    <div className="p-2.5 rounded-lg bg-muted/40 border border-border/50">
                      <span className="text-[10px] text-muted-foreground block">Atasan Langsung</span>
                      <span className="font-semibold text-foreground">{selectedPerson.person.atasanLangsung}</span>
                    </div>
                  )}
                </div>

                {/* Contact info if available */}
                {(selectedPerson.person.email || selectedPerson.person.telepon) && (
                  <div className="pt-2 border-t border-border/50 space-y-2">
                    {selectedPerson.person.email && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Mail className="w-3.5 h-3.5 text-primary" />
                        <span>{selectedPerson.person.email}</span>
                      </div>
                    )}
                    {selectedPerson.person.telepon && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Phone className="w-3.5 h-3.5 text-primary" />
                        <span>{selectedPerson.person.telepon}</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <Button variant="outline" size="sm" onClick={() => setSelectedPerson(null)}>
                    Tutup
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── Sub-Component: Executive Card (Dirut & Direktur) ────────────────────────
function ExecutiveCard({
  person,
  roleTier,
  isHighlight,
  isDimmed,
  subordinateCount,
  onClick,
}: {
  person: P
  roleTier: "DIRUT" | "DIREKTUR"
  isHighlight?: boolean
  isDimmed?: boolean
  subordinateCount?: number
  onClick?: () => void
}) {
  const isDirut = roleTier === "DIRUT"

  return (
    <div
      onClick={onClick}
      className={`relative group cursor-pointer transition-all duration-200 rounded-2xl p-4 select-none ${
        isDirut
          ? "w-72 bg-gradient-to-b from-card to-amber-500/5 dark:to-amber-950/20 border-2 border-amber-400/60 dark:border-amber-500/40 shadow-md hover:shadow-lg"
          : "w-64 bg-card border border-border/80 shadow-xs hover:border-primary/50 hover:shadow-md"
      } ${
        isHighlight
          ? "ring-2 ring-blue-500 ring-offset-2 ring-offset-background scale-[1.02] shadow-lg"
          : ""
      } ${isDimmed ? "opacity-30 grayscale hover:opacity-100 hover:grayscale-0" : ""}`}
    >
      {/* Top accent badge */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <Badge
          variant="outline"
          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
            isDirut
              ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30"
              : "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20"
          }`}
        >
          {isDirut ? "DIREKTUR UTAMA" : "DEWAN DIREKSI"}
        </Badge>

        {subordinateCount !== undefined && subordinateCount > 0 && (
          <span className="text-[10px] text-muted-foreground font-mono flex items-center gap-1">
            <Users className="w-3 h-3 text-muted-foreground/70" />
            {subordinateCount}
          </span>
        )}
      </div>

      {/* Profile Details */}
      <div className="flex items-center gap-3">
        <Avatar
          className={`${
            isDirut ? "w-13 h-13 border-2 border-amber-400/50" : "w-11 h-11 border border-border/80"
          } shrink-0 shadow-xs`}
        >
          <AvatarImage src={person.fotoUrl || undefined} alt={person.nama} />
          <AvatarFallback
            className={`font-bold text-xs ${
              isDirut
                ? "bg-amber-500/20 text-amber-800 dark:text-amber-200"
                : "bg-primary/10 text-primary"
            }`}
          >
            {getInitials(person.nama)}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-foreground leading-snug line-clamp-1 group-hover:text-primary transition-colors">
            {person.nama}
          </p>
          <p className="text-[11px] text-muted-foreground leading-tight line-clamp-2 mt-0.5">
            {person.jabatan}
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── Sub-Component: Department Card (Bidang & Cabang) ───────────────────────
function DepartmentCard({
  bidang,
  detailMode,
  accentColor = "blue",
  isExpanded,
  onToggleExpand,
  onSelectPerson,
  isHighlight,
  isDimmed,
}: {
  bidang: Bid
  detailMode: "compact" | "full"
  accentColor?: "blue" | "emerald" | "purple" | "amber"
  isExpanded?: boolean
  onToggleExpand?: () => void
  onSelectPerson: (p: P) => void
  isHighlight?: boolean
  isDimmed?: boolean
}) {
  // Find head of department
  const kepala =
    bidang.pegawai.find((p) =>
      ["KEPALA_BIDANG", "KEPALA_CABANG"].includes(p.tipeJabatan)
    ) ||
    bidang.pegawai.find(
      (p) =>
        p.jabatan.toLowerCase().includes("kepala") ||
        (bidang.kepalaBidang &&
          p.nama.toLowerCase().includes(bidang.kepalaBidang.toLowerCase()))
    )

  // Total headcount in this department
  const totalPersonel = bidang.pegawai.length

  const accentStyles = {
    blue: {
      bar: "from-blue-500 to-indigo-600",
      badge: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20",
      hover: "hover:border-blue-500/40",
    },
    emerald: {
      bar: "from-emerald-500 to-teal-600",
      badge: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
      hover: "hover:border-emerald-500/40",
    },
    purple: {
      bar: "from-purple-500 to-indigo-600",
      badge: "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20",
      hover: "hover:border-purple-500/40",
    },
    amber: {
      bar: "from-amber-500 to-orange-600",
      badge: "bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/20",
      hover: "hover:border-amber-500/40",
    },
  }[accentColor]

  const showAllStaff = detailMode === "full" || isExpanded

  return (
    <Card
      className={`w-64 shrink-0 overflow-hidden border border-border/80 bg-card shadow-xs transition-all duration-200 ${
        accentStyles.hover
      } ${
        isHighlight
          ? "ring-2 ring-blue-500 ring-offset-2 ring-offset-background scale-[1.02] shadow-md"
          : ""
      } ${isDimmed ? "opacity-30 grayscale hover:opacity-100 hover:grayscale-0" : ""}`}
    >
      {/* Accent Header Strip */}
      <div className={`h-1.5 w-full bg-linear-to-r ${accentStyles.bar}`} />

      {/* Card Header: Name, Code, Headcount */}
      <CardHeader className="p-3.5 pb-2.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <span className="text-[10px] font-mono text-muted-foreground font-semibold">
              {bidang.kode || "DIV"}
            </span>
            <CardTitle className="text-xs font-bold text-foreground leading-snug line-clamp-1 mt-0.5">
              {bidang.nama}
            </CardTitle>
          </div>
          <Badge variant="outline" className={`text-[10px] font-mono shrink-0 ${accentStyles.badge}`}>
            {totalPersonel} Staf
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-3.5 pt-0 space-y-3">
        {/* Kepala Bidang Section */}
        <div className="p-2.5 rounded-xl bg-muted/40 border border-border/50">
          <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
            Pimpinan Unit
          </span>
          {kepala ? (
            <div
              onClick={() => onSelectPerson(kepala)}
              className="flex items-center gap-2.5 cursor-pointer group select-none"
            >
              <Avatar className="w-8 h-8 border border-border/80 shrink-0">
                <AvatarImage src={kepala.fotoUrl || undefined} alt={kepala.nama} />
                <AvatarFallback className="text-[10px] font-bold bg-primary/10 text-primary">
                  {getInitials(kepala.nama)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                  {kepala.nama}
                </p>
                <p className="text-[10px] text-muted-foreground line-clamp-1">
                  {kepala.jabatan || "Kepala Bidang"}
                </p>
              </div>
            </div>
          ) : bidang.kepalaBidang ? (
            <div className="flex items-center gap-2.5">
              <Avatar className="w-8 h-8 border border-border/80 shrink-0 opacity-70">
                <AvatarFallback className="text-[10px] font-bold">
                  {getInitials(bidang.kepalaBidang)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-foreground line-clamp-1">
                  {bidang.kepalaBidang}
                </p>
                <p className="text-[10px] text-muted-foreground">Kepala Bidang</p>
              </div>
            </div>
          ) : (
            <p className="text-[10px] text-muted-foreground italic py-0.5">Posisi belum terisi</p>
          )}
        </div>

        {/* Sub-Bidang Sections */}
        {bidang.subBidang.length > 0 && (
          <div className="space-y-2 pt-1 border-t border-border/40">
            <div className="flex items-center justify-between text-[10px] font-semibold text-muted-foreground">
              <span>Sub-Bagian ({bidang.subBidang.length})</span>
              {detailMode === "compact" && (
                <button
                  onClick={onToggleExpand}
                  className="flex items-center gap-0.5 text-primary hover:underline cursor-pointer"
                >
                  {isExpanded ? (
                    <>
                      Tutup <ChevronUp className="w-3 h-3" />
                    </>
                  ) : (
                    <>
                      Rincian <ChevronDown className="w-3 h-3" />
                    </>
                  )}
                </button>
              )}
            </div>

            <div className="space-y-1.5">
              {bidang.subBidang.map((sub) => {
                const kasubbid = sub.pegawai.find((p) =>
                  ["KASUBBID", "KASUBBID_CABANG"].includes(p.tipeJabatan)
                )
                const team = sub.pegawai.filter(
                  (p) => !["KASUBBID", "KASUBBID_CABANG"].includes(p.tipeJabatan)
                )

                return (
                  <div
                    key={sub.id}
                    className="p-2 rounded-lg bg-background/80 border border-border/50 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground text-[11px] line-clamp-1">
                        {sub.nama}
                      </span>
                      <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                        {sub.pegawai.length} staf
                      </span>
                    </div>

                    {/* Kasubbid leader */}
                    {kasubbid && (
                      <div
                        onClick={() => onSelectPerson(kasubbid)}
                        className="flex items-center gap-1.5 cursor-pointer group"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                        <span className="text-[10px] font-medium text-foreground line-clamp-1 group-hover:text-primary">
                          {kasubbid.nama}
                        </span>
                        <span className="text-[9px] text-muted-foreground font-mono shrink-0 ml-auto">
                          Kasubbid
                        </span>
                      </div>
                    )}

                    {/* Team Staff Members (Full detail mode or expanded) */}
                    {showAllStaff && team.length > 0 && (
                      <div className="pt-1.5 border-t border-border/40 space-y-1">
                        {team.map((m) => (
                          <div
                            key={m.id}
                            onClick={() => onSelectPerson(m)}
                            className="flex items-center gap-2 px-1 py-0.5 rounded hover:bg-muted/60 cursor-pointer group text-[10px]"
                          >
                            <Avatar className="w-4 h-4 shrink-0">
                              <AvatarImage src={m.fotoUrl || undefined} alt={m.nama} />
                              <AvatarFallback className="text-[7px]">
                                {getInitials(m.nama)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium text-foreground line-clamp-1 group-hover:text-primary">
                              {m.nama}
                            </span>
                            <span className="text-[9px] text-muted-foreground line-clamp-1 ml-auto">
                              {m.jabatan || "Staff"}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {!kasubbid && team.length === 0 && (
                      <span className="text-[9px] text-muted-foreground/60 italic block">
                        Belum ada personel
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
