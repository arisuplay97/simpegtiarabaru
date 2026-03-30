"use client"

import { useEffect, useState } from "react"
import { SidebarNav } from "@/components/simpeg/sidebar-nav"
import { TopBar } from "@/components/simpeg/top-bar"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, Users, Building2, Briefcase, Crown } from "lucide-react"

interface P { id: string; nama: string; jabatan: string; tipeJabatan: string; fotoUrl?: string | null; subBidangId?: string | null; atasanLangsung?: string | null }
interface Sub { id: string; nama: string; pegawai: P[] }
interface Bid { id: string; nama: string; kode: string; direkturAtasan: string; kepalaBidang: string; subBidang: Sub[]; pegawai: P[] }
interface OrgData { direksiList: P[]; bidangList: Bid[]; stats: { totalPegawai: number; totalBidang: number; totalJabatan: number } }

function initials(n: string) { return n.split(" ").slice(0,2).map(w=>w[0]).join("").toUpperCase() }

const CSS = `
.org-tree { display:flex; flex-direction:column; align-items:center; }
.org-children { display:flex; padding-top:0; position:relative; }
.org-children::before { content:''; position:absolute; top:0; left:50%; border-left:2px solid #64748b; height:20px; }
.org-child { display:flex; flex-direction:column; align-items:center; padding:0 8px; position:relative; }
.org-child::before { content:''; position:absolute; top:0; border-top:2px solid #64748b; }
.org-child:first-child:not(:only-child)::before { left:50%; right:0; }
.org-child:last-child:not(:only-child)::before { left:0; right:50%; }
.org-child:not(:first-child):not(:last-child)::before { left:0; right:0; }
.org-child:only-child::before { display:none; }
.org-child::after { content:''; display:block; width:2px; height:20px; background:#64748b; }
.org-child:only-child::after { display:block; }
`

function PhotoCircle({ p, size="md", color="bg-slate-600" }: { p: P; size?: "xl"|"lg"|"md"|"sm"; color?: string }) {
  const sz = { xl:"h-20 w-20 text-base border-4", lg:"h-14 w-14 text-sm border-4", md:"h-11 w-11 text-xs border-2", sm:"h-9 w-9 text-[10px] border-2" }[size]
  return (
    <div className={`${sz} rounded-full overflow-hidden border-white/40 shadow-lg flex-shrink-0`}>
      {p.fotoUrl
        ? <img src={p.fotoUrl} alt={p.nama} className="h-full w-full object-cover" />
        : <div className={`h-full w-full flex items-center justify-center font-bold text-white ${color}`}>{initials(p.nama)}</div>
      }
    </div>
  )
}

// ── Card components ──────────────────────────────────────────
function DireksiCard({ p, isRoot=false }: { p: P; isRoot?: boolean }) {
  return (
    <div className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 shadow-lg text-center ${isRoot ? "border-amber-400 bg-amber-50 dark:bg-amber-950/30 min-w-[150px]" : "border-primary/40 bg-primary/5 min-w-[130px]"}`}>
      <div className="relative">
        <PhotoCircle p={p} size={isRoot?"xl":"lg"} color="bg-primary" />
        {isRoot && <div className="absolute -top-1 -right-1 h-5 w-5 bg-amber-400 rounded-full flex items-center justify-center shadow"><Crown className="h-3 w-3 text-amber-900" /></div>}
      </div>
      <p className={`font-bold leading-tight ${isRoot?"text-sm":"text-xs"} max-w-[140px]`}>{p.nama}</p>
      <p className={`text-muted-foreground leading-tight ${isRoot?"text-xs":"text-[10px]"} max-w-[140px]`}>{p.jabatan}</p>
    </div>
  )
}

function KabidCard({ bid, kepala }: { bid: Bid; kepala: P | null }) {
  return (
    <div className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl border-2 border-emerald-600/40 bg-emerald-50 dark:bg-emerald-950/20 shadow text-center min-w-[120px] max-w-[140px]">
      {kepala ? <PhotoCircle p={kepala} size="md" color="bg-emerald-700" /> : <div className="h-11 w-11 rounded-full bg-emerald-100 flex items-center justify-center"><Building2 className="h-5 w-5 text-emerald-700" /></div>}
      <p className="text-[11px] font-bold leading-tight max-w-[120px]">{kepala?.nama ?? "Kosong"}</p>
      <p className="text-[9px] text-muted-foreground max-w-[120px]">{kepala?.jabatan ?? ""}</p>
      <div className="text-[9px] font-semibold text-emerald-700 bg-emerald-100 dark:bg-emerald-900/40 rounded-full px-2 py-0.5 max-w-[120px] truncate">{bid.nama}</div>
    </div>
  )
}

function KasubbidCard({ sub, kasubbid }: { sub: Sub; kasubbid: P | null }) {
  return (
    <div className="flex flex-col items-center gap-1.5 p-2 rounded-lg border border-blue-500/30 bg-blue-50 dark:bg-blue-950/20 shadow-sm text-center min-w-[100px] max-w-[120px]">
      {kasubbid ? <PhotoCircle p={kasubbid} size="sm" color="bg-blue-700" /> : <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center text-[10px] text-blue-700">-</div>}
      <p className="text-[10px] font-semibold leading-tight max-w-[110px]">{kasubbid?.nama ?? "Kosong"}</p>
      <p className="text-[9px] text-muted-foreground max-w-[110px]">{kasubbid?.jabatan ?? ""}</p>
      <div className="text-[8px] font-semibold text-blue-700 bg-blue-100 dark:bg-blue-900/40 rounded px-1.5 max-w-[110px] truncate">{sub.nama}</div>
    </div>
  )
}

function StaffCard({ p }: { p: P }) {
  return (
    <div className="flex items-center gap-1.5 p-1.5 rounded-lg border border-border/60 bg-muted/30 min-w-[90px] max-w-[120px]">
      <PhotoCircle p={p} size="sm" color="bg-slate-500" />
      <div className="min-w-0">
        <p className="text-[10px] font-medium leading-tight truncate">{p.nama}</p>
        <p className="text-[9px] text-muted-foreground truncate">{p.jabatan}</p>
      </div>
    </div>
  )
}

// ── Tree builder functions ───────────────────────────────────
function SubBidangNode({ sub }: { sub: Sub }) {
  const kasubbid = sub.pegawai.find(p => p.tipeJabatan === "KASUBBID" || p.tipeJabatan === "KASUBBID_CABANG") ?? null
  const staff = sub.pegawai.filter(p => p.tipeJabatan !== "KASUBBID" && p.tipeJabatan !== "KASUBBID_CABANG")
  return (
    <div className="org-tree">
      <KasubbidCard sub={sub} kasubbid={kasubbid} />
      {staff.length > 0 && (
        <div className="org-children">
          {staff.map(s => (
            <div key={s.id} className="org-child"><StaffCard p={s} /></div>
          ))}
        </div>
      )}
    </div>
  )
}

function BidangNode({ bid }: { bid: Bid }) {
  const kepala = bid.pegawai.find(p => p.tipeJabatan === "KEPALA_BIDANG" || p.tipeJabatan === "KEPALA_CABANG") ?? null
  const hasChildren = bid.subBidang.length > 0
  return (
    <div className="org-tree">
      <KabidCard bid={bid} kepala={kepala} />
      {hasChildren && (
        <div className="org-children">
          {bid.subBidang.map(sub => (
            <div key={sub.id} className="org-child">
              <SubBidangNode sub={sub} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function DirekturNode({ dir, bidangList }: { dir: P; bidangList: Bid[] }) {
  // Matching bidang.direkturAtasan ke jabatan direktur ini (case-insensitive partial match)
  const myBidang = bidangList.filter(b => {
    const at = b.direkturAtasan?.toLowerCase() ?? ""
    const jab = dir.jabatan?.toLowerCase() ?? ""
    return at && jab && (at.includes(jab) || jab.includes(at) || at.split(" ").some(w => w.length > 4 && jab.includes(w)))
  })
  return (
    <div className="org-tree">
      <DireksiCard p={dir} />
      {myBidang.length > 0 && (
        <div className="org-children">
          {myBidang.map(b => (
            <div key={b.id} className="org-child">
              <BidangNode bid={b} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main Page ────────────────────────────────────────────────
export default function OrganisasiPage() {
  const [data, setData] = useState<OrgData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    fetch("/api/organisasi").then(r => r.json()).then(d => {
      if (d.error) throw new Error(d.error)
      setData(d)
    }).catch(e => setError(e.message)).finally(() => setLoading(false))
  }, [])

  const dirut = data?.direksiList.find(d => d.jabatan?.toLowerCase().includes("utama"))
  const otherDireksi = data?.direksiList.filter(d => d.id !== dirut?.id) ?? []

  // Bidang pusat: non-cabang
  const bidangPusat = data?.bidangList.filter(b => !b.nama.toLowerCase().includes("cabang") && !b.kode?.toLowerCase().startsWith("c")) ?? []
  // Bidang cabang
  const bidangCabang = data?.bidangList.filter(b => b.nama.toLowerCase().includes("cabang") || b.kode?.toLowerCase().startsWith("c")) ?? []
  // Bidang belum di-link ke direktur
  const linkedIds = new Set(otherDireksi.flatMap(dir =>
    bidangPusat.filter(b => {
      const at = b.direkturAtasan?.toLowerCase() ?? ""
      const jab = dir.jabatan?.toLowerCase() ?? ""
      return at && jab && (at.includes(jab) || jab.includes(at) || at.split(" ").some((w:string) => w.length > 4 && jab.includes(w)))
    }).map(b => b.id)
  ))
  const unlinkedBidang = bidangPusat.filter(b => !linkedIds.has(b.id))

  return (
    <div className="flex min-h-screen bg-background">
      <style>{CSS}</style>
      <SidebarNav />
      <div className="flex flex-1 flex-col sidebar-offset">
        <TopBar breadcrumb={["Kepegawaian", "Struktur Organisasi"]} />
        <main className="flex-1 overflow-auto p-6">

          {/* Header */}
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-black text-foreground tracking-tight">STRUKTUR ORGANISASI</h1>
            <p className="text-sm text-muted-foreground">PERUMDA Air Minum Tirta Ardhia Rinjani — Kabupaten Lombok Tengah</p>
          </div>

          {/* Stats */}
          {data && (
            <div className="mb-6 grid gap-4 sm:grid-cols-3">
              {[
                { label:"Total Pegawai Aktif", value:data.stats.totalPegawai, icon:Users, c:"text-primary" },
                { label:"Unit Kerja / Bidang", value:data.stats.totalBidang, icon:Building2, c:"text-blue-600" },
                { label:"Jabatan Berbeda", value:data.stats.totalJabatan, icon:Briefcase, c:"text-emerald-600" },
              ].map(s => (
                <Card key={s.label} className="card-premium">
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary">
                      <s.icon className={`h-6 w-6 ${s.c}`} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{s.value.toLocaleString("id-ID")}</p>
                      <p className="text-xs text-muted-foreground">{s.label}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Org Chart */}
          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : error ? (
            <Card><CardContent className="p-8 text-center text-destructive">{error}</CardContent></Card>
          ) : data && (
            <Card className="card-premium overflow-auto">
              <CardContent className="p-8">
                <div className="min-w-max mx-auto">

                  {/* ── MAIN TREE ── */}
                  <div className="org-tree">
                    {/* Direktur Utama */}
                    {dirut && <DireksiCard p={dirut} isRoot />}

                    {/* Level 2: Direktur-Direktur lain + Unlinked bidang */}
                    {(otherDireksi.length > 0 || unlinkedBidang.length > 0) && (
                      <div className="org-children">
                        {otherDireksi.map(dir => (
                          <div key={dir.id} className="org-child">
                            <DirekturNode dir={dir} bidangList={bidangPusat} />
                          </div>
                        ))}
                        {unlinkedBidang.map(b => (
                          <div key={b.id} className="org-child">
                            <BidangNode bid={b} />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* ── CABANG (terhubung dari Dirut) ── */}
                  {bidangCabang.length > 0 && (
                    <div className="mt-12">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="h-px flex-1 bg-slate-400/40 border-dashed" />
                        <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground border border-dashed border-slate-400/60 rounded-full px-4 py-1">
                          <Building2 className="h-4 w-4" /> Kantor Cabang
                        </div>
                        <div className="h-px flex-1 bg-slate-400/40 border-dashed" />
                      </div>
                      <div className="org-tree">
                        <div className="org-children">
                          {bidangCabang.map(b => (
                            <div key={b.id} className="org-child">
                              <BidangNode bid={b} />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </div>
  )
}
