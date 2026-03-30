"use client"

import { useEffect, useState } from "react"
import { SidebarNav } from "@/components/simpeg/sidebar-nav"
import { TopBar } from "@/components/simpeg/top-bar"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Loader2, Users, Building2, Briefcase, ChevronRight, ChevronDown } from "lucide-react"

// ─── Types ───────────────────────────────────────────────────
interface PegawaiNode {
  id: string
  nama: string
  jabatan: string
  tipeJabatan: string
  fotoUrl?: string | null
  subBidangId?: string | null
}

interface SubBidangNode {
  id: string
  nama: string
  pegawai: PegawaiNode[]
}

interface BidangNode {
  id: string
  nama: string
  kode: string
  kepalaBidang: string
  direkturAtasan: string
  subBidang: SubBidangNode[]
  pegawai: PegawaiNode[]
}

interface OrgData {
  bidangList: BidangNode[]
  stats: { totalPegawai: number; totalBidang: number; totalJabatan: number }
}

// ─── Helper ───────────────────────────────────────────────────
function getInitials(nama: string) {
  return nama
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
}

const tipeColor: Record<string, string> = {
  KEPALA_BIDANG: "bg-primary text-primary-foreground",
  KEPALA_CABANG: "bg-primary text-primary-foreground",
  KASUBBID: "bg-blue-600 text-white",
  KASUBBID_CABANG: "bg-blue-600 text-white",
  STAFF: "bg-emerald-600 text-white",
  STAFF_CABANG: "bg-emerald-600 text-white",
  KONTRAK: "bg-amber-500 text-white",
}

const tipeLabel: Record<string, string> = {
  KEPALA_BIDANG: "Kepala Bidang",
  KEPALA_CABANG: "Kepala Cabang",
  KASUBBID: "Kasubbid",
  KASUBBID_CABANG: "Kasubbid Cabang",
  STAFF: "Staff",
  STAFF_CABANG: "Staff Cabang",
  KONTRAK: "Kontrak",
}

// ─── PegawaiCard ──────────────────────────────────────────────
function PegawaiCard({ p, size = "md" }: { p: PegawaiNode; size?: "sm" | "md" | "lg" }) {
  const avatarSize = size === "lg" ? "h-16 w-16" : size === "md" ? "h-11 w-11" : "h-9 w-9"
  const nameClass = size === "lg" ? "text-sm font-bold" : size === "md" ? "text-xs font-semibold" : "text-[11px] font-medium"

  return (
    <div className="flex flex-col items-center text-center gap-1.5">
      <Avatar className={avatarSize}>
        {p.fotoUrl && <AvatarImage src={p.fotoUrl} alt={p.nama} />}
        <AvatarFallback className={`text-[11px] font-bold ${tipeColor[p.tipeJabatan] || "bg-muted text-muted-foreground"}`}>
          {getInitials(p.nama)}
        </AvatarFallback>
      </Avatar>
      <div>
        <p className={`${nameClass} text-foreground leading-tight max-w-[120px]`}>{p.nama}</p>
        <p className="text-[10px] text-muted-foreground leading-tight mt-0.5 max-w-[120px]">{p.jabatan}</p>
        <Badge variant="outline" className="mt-1 text-[9px] px-1.5 py-0">
          {tipeLabel[p.tipeJabatan] || p.tipeJabatan}
        </Badge>
      </div>
    </div>
  )
}

// ─── BidangCard ───────────────────────────────────────────────
function BidangCard({ bidang }: { bidang: BidangNode }) {
  const [expanded, setExpanded] = useState(true)

  // Pisahkan kepala bidang vs staff langsung (tanpa subbidang)
  const kepalaBidang = bidang.pegawai.filter(
    (p) => p.tipeJabatan === "KEPALA_BIDANG" || p.tipeJabatan === "KEPALA_CABANG"
  )
  const staffLangsung = bidang.pegawai.filter(
    (p) => p.tipeJabatan !== "KEPALA_BIDANG" && p.tipeJabatan !== "KEPALA_CABANG" && !p.subBidangId
  )

  return (
    <Card className="card-premium overflow-hidden">
      {/* Header Bidang */}
      <div
        className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b border-border cursor-pointer hover:bg-primary/5 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-bold text-foreground">{bidang.nama}</h3>
            <p className="text-xs text-muted-foreground">
              Kode: {bidang.kode} · Atasan: {bidang.direkturAtasan}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {bidang.pegawai.length} pegawai
          </Badge>
          {expanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </div>

      {expanded && (
        <CardContent className="p-5">
          {/* Kepala Bidang */}
          {kepalaBidang.length > 0 && (
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-px flex-1 bg-border" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary px-2">Pimpinan</span>
                <div className="h-px flex-1 bg-border" />
              </div>
              <div className="flex flex-wrap justify-center gap-8">
                {kepalaBidang.map((p) => (
                  <PegawaiCard key={p.id} p={p} size="lg" />
                ))}
              </div>
            </div>
          )}

          {/* Sub Bidang */}
          {bidang.subBidang.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-px flex-1 bg-border" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2">Sub Bidang</span>
                <div className="h-px flex-1 bg-border" />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {bidang.subBidang.map((sub) => {
                  const kasubbid = sub.pegawai.filter(
                    (p) => p.tipeJabatan === "KASUBBID" || p.tipeJabatan === "KASUBBID_CABANG"
                  )
                  const staffSub = sub.pegawai.filter(
                    (p) => p.tipeJabatan !== "KASUBBID" && p.tipeJabatan !== "KASUBBID_CABANG"
                  )
                  return (
                    <div key={sub.id} className="rounded-xl border border-border/60 bg-muted/20 p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="h-6 w-6 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                          <Briefcase className="h-3 w-3 text-blue-600" />
                        </div>
                        <p className="text-xs font-bold text-foreground">{sub.nama}</p>
                        <Badge variant="outline" className="text-[9px] ml-auto px-1.5">
                          {sub.pegawai.length}
                        </Badge>
                      </div>

                      {sub.pegawai.length === 0 ? (
                        <p className="text-[10px] text-muted-foreground text-center py-2">Belum ada pegawai</p>
                      ) : (
                        <div className="space-y-3">
                          {/* Kasubbid */}
                          {kasubbid.length > 0 && (
                            <div className="flex flex-wrap gap-4 justify-center">
                              {kasubbid.map((p) => (
                                <PegawaiCard key={p.id} p={p} size="md" />
                              ))}
                            </div>
                          )}
                          {/* Staff */}
                          {staffSub.length > 0 && (
                            <>
                              {kasubbid.length > 0 && <div className="h-px bg-border/60" />}
                              <div className="flex flex-wrap gap-3 justify-center">
                                {staffSub.map((p) => (
                                  <PegawaiCard key={p.id} p={p} size="sm" />
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Staff langsung tanpa subbidang */}
          {staffLangsung.length > 0 && (
            <div className="mt-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-px flex-1 bg-border" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2">Staff</span>
                <div className="h-px flex-1 bg-border" />
              </div>
              <div className="flex flex-wrap gap-4 justify-center">
                {staffLangsung.map((p) => (
                  <PegawaiCard key={p.id} p={p} size="sm" />
                ))}
              </div>
            </div>
          )}

          {/* Kosong */}
          {kepalaBidang.length === 0 && bidang.subBidang.length === 0 && staffLangsung.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">Belum ada pegawai aktif di bidang ini.</p>
          )}
        </CardContent>
      )}
    </Card>
  )
}

// ─── Page ─────────────────────────────────────────────────────
export default function OrganisasiPage() {
  const [data, setData] = useState<OrgData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

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

  return (
    <div className="flex min-h-screen bg-background">
      <SidebarNav />
      <div className="flex flex-1 flex-col sidebar-offset">
        <TopBar breadcrumb={["Kepegawaian", "Struktur Organisasi"]} />
        <main className="flex-1 overflow-auto p-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-foreground">Struktur Organisasi</h1>
            <p className="text-sm text-muted-foreground">PDAM Tirta Ardhia Rinjani — Data Pegawai Aktif</p>
          </div>

          {/* Stats */}
          {data && (
            <div className="mb-6 grid gap-4 sm:grid-cols-3">
              {[
                { label: "Total Pegawai Aktif", value: data.stats.totalPegawai, icon: Users, color: "text-primary" },
                { label: "Unit Kerja / Bidang", value: data.stats.totalBidang, icon: Building2, color: "text-blue-600" },
                { label: "Jabatan Berbeda", value: data.stats.totalJabatan, icon: Briefcase, color: "text-emerald-600" },
              ].map((s) => (
                <Card key={s.label} className="card-premium">
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary">
                      <s.icon className={`h-6 w-6 ${s.color}`} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{s.value.toLocaleString("id-ID")}</p>
                      <p className="text-xs text-muted-foreground">{s.label}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Legend */}
          <Card className="card-premium mb-6">
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center gap-5">
                <span className="text-sm font-medium">Keterangan:</span>
                {[
                  { color: "bg-primary", label: "Kepala Bidang/Cabang" },
                  { color: "bg-blue-600", label: "Kasubbid" },
                  { color: "bg-emerald-600", label: "Staff" },
                  { color: "bg-amber-500", label: "Kontrak" },
                ].map((l) => (
                  <div key={l.label} className="flex items-center gap-2">
                    <div className={`h-3 w-3 rounded-full ${l.color}`} />
                    <span className="text-sm">{l.label}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Content */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <Card className="border-destructive">
              <CardContent className="p-6 text-center text-destructive">{error}</CardContent>
            </Card>
          ) : !data || data.bidangList.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center text-muted-foreground">
                <Building2 className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p className="font-medium">Belum ada data bidang.</p>
                <p className="text-sm mt-1">Tambahkan data bidang melalui menu Master Data.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {data.bidangList.map((bidang) => (
                <BidangCard key={bidang.id} bidang={bidang} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
