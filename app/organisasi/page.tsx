"use client"

import { useEffect, useState } from "react"
import { SidebarNav } from "@/components/simpeg/sidebar-nav"
import { TopBar } from "@/components/simpeg/top-bar"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, Users, Building2, Briefcase, Crown } from "lucide-react"

interface P { id:string; nama:string; jabatan:string; tipeJabatan:string; fotoUrl?:string|null; subBidangId?:string|null; atasanLangsung?:string|null }
interface Sub { id:string; nama:string; pegawai:P[] }
interface Bid { id:string; nama:string; kode:string; direkturAtasan:string; kepalaBidang:string; subBidang:Sub[]; pegawai:P[] }
interface OrgData { direksiList:P[]; bidangList:Bid[]; stats:{totalPegawai:number;totalBidang:number;totalJabatan:number} }

function initials(n:string){ return n.split(" ").slice(0,2).map(w=>w[0]).join("").toUpperCase() }

// ─── CSS untuk garis pohon ────────────────────────────────────
const CSS = `
.ot { display:flex; flex-direction:column; align-items:center; }
.oc { display:flex; padding-top:0; position:relative; align-items:flex-start; justify-content:center; }
.oc::before { content:''; position:absolute; top:0; left:50%; border-left:1px solid #94a3b8; height:16px; }
.oi { display:flex; flex-direction:column; align-items:center; padding:0 10px; position:relative; }
.oi::before { content:''; position:absolute; top:0; border-top:1px solid #94a3b8; }
.oi:first-child:not(:only-child)::before { left:50%; right:0; }
.oi:last-child:not(:only-child)::before { left:0; right:50%; }
.oi:not(:first-child):not(:last-child)::before { left:0; right:0; }
.oi:only-child::before { display:none; }
.oi::after { content:''; display:block; width:1px; height:16px; background:#94a3b8; }
`

// ─── Foto lingkaran ───────────────────────────────────────────
const colorMap:Record<string,string> = {
  KEPALA_BIDANG:"bg-emerald-700", KEPALA_CABANG:"bg-emerald-700",
  KASUBBID:"bg-blue-700", KASUBBID_CABANG:"bg-blue-700",
  STAFF:"bg-slate-500", STAFF_CABANG:"bg-slate-500", KONTRAK:"bg-amber-600"
}

function Circle({ p, size, color }: { p:P; size:number; color?:string }) {
  const bg = color ?? colorMap[p.tipeJabatan] ?? "bg-slate-500"
  return (
    <div
      className={`rounded-full overflow-hidden border-2 border-white/50 shadow-md flex-shrink-0 ${bg}`}
      style={{ width:size, height:size, minWidth:size }}
    >
      {p.fotoUrl
        ? <img src={p.fotoUrl} alt={p.nama} className="h-full w-full object-cover" />
        : <div className="h-full w-full flex items-center justify-center text-white font-bold" style={{fontSize:size*0.3}}>
            {initials(p.nama)}
          </div>
      }
    </div>
  )
}

// ─── Node: hanya foto + teks di bawah ────────────────────────
function Node({ p, size, color, showJabatan=true }: { p:P; size:number; color?:string; showJabatan?:boolean }) {
  const maxW = Math.max(size + 10, 80)
  return (
    <div className="flex flex-col items-center gap-1 text-center" style={{maxWidth:maxW}}>
      <Circle p={p} size={size} color={color} />
      <p className="text-[10px] font-bold leading-tight text-foreground" style={{maxWidth:maxW}}>{p.nama}</p>
      {showJabatan && <p className="text-[9px] text-muted-foreground leading-tight" style={{maxWidth:maxW}}>{p.jabatan}</p>}
    </div>
  )
}

// ─── Sub Bidang node ──────────────────────────────────────────
function SubNode({ sub }: { sub:Sub }) {
  const kasubbid = sub.pegawai.find(p => ["KASUBBID","KASUBBID_CABANG"].includes(p.tipeJabatan))
  const staff = sub.pegawai.filter(p => !["KASUBBID","KASUBBID_CABANG"].includes(p.tipeJabatan))
  return (
    <div className="ot">
      {/* Label subbidang */}
      <div className="text-[8px] font-semibold text-blue-700 bg-blue-100 dark:bg-blue-900/30 rounded px-2 py-0.5 mb-1 max-w-[90px] text-center leading-tight">{sub.nama}</div>
      {kasubbid && <Node p={kasubbid} size={36} />}
      {staff.length > 0 && (
        <div className="oc">
          {staff.map(s => <div key={s.id} className="oi"><Node p={s} size={28} showJabatan={false} /></div>)}
        </div>
      )}
      {!kasubbid && staff.length === 0 && (
        <p className="text-[8px] text-muted-foreground/60 italic">-</p>
      )}
    </div>
  )
}

// ─── Bidang node ──────────────────────────────────────────────
function BidangNode({ bid }: { bid:Bid }) {
  const kepala = bid.pegawai.find(p => ["KEPALA_BIDANG","KEPALA_CABANG"].includes(p.tipeJabatan))
  return (
    <div className="ot">
      <div className="text-[8px] font-bold text-emerald-700 bg-emerald-100 dark:bg-emerald-900/30 rounded px-2 py-0.5 mb-1 max-w-[100px] text-center leading-tight">{bid.nama}</div>
      {kepala
        ? <Node p={kepala} size={42} />
        : <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[9px] text-muted-foreground">-</div>
      }
      {bid.subBidang.length > 0 && (
        <div className="oc">
          {bid.subBidang.map(sub => <div key={sub.id} className="oi"><SubNode sub={sub} /></div>)}
        </div>
      )}
    </div>
  )
}

// ─── Direktur node ────────────────────────────────────────────
function DirNode({ dir, bidangList }: { dir:P; bidangList:Bid[] }) {
  const myBidang = bidangList.filter(b => {
    const at = (b.direkturAtasan ?? "").toLowerCase()
    const jab = (dir.jabatan ?? "").toLowerCase()
    if (!at || !jab) return false
    return at === jab || at.includes(jab) || jab.includes(at) ||
      jab.split(" ").filter((w:string)=>w.length>4).some((w:string)=>at.includes(w))
  })
  return (
    <div className="ot">
      <Node p={dir} size={52} color="bg-primary" />
      {myBidang.length > 0 && (
        <div className="oc">
          {myBidang.map(b => <div key={b.id} className="oi"><BidangNode bid={b} /></div>)}
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────
export default function OrganisasiPage() {
  const [data, setData] = useState<OrgData|null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    fetch("/api/organisasi").then(r=>r.json()).then(d=>{
      if(d.error) throw new Error(d.error)
      setData(d)
    }).catch(e=>setError(e.message)).finally(()=>setLoading(false))
  }, [])

  const dirut = data?.direksiList.find(d =>
    d.jabatan?.toLowerCase().includes("utama") || d.jabatan?.toLowerCase().includes("dirut")
  )
  const otherDir = data?.direksiList.filter(d => d.id !== dirut?.id) ?? []

  const bidangPusat = data?.bidangList.filter(b =>
    !b.nama.toLowerCase().includes("cabang") && !b.kode?.toLowerCase().startsWith("c")
  ) ?? []
  const bidangCabang = data?.bidangList.filter(b =>
    b.nama.toLowerCase().includes("cabang") || b.kode?.toLowerCase().startsWith("c")
  ) ?? []

  // Bidang yang sudah di-link ke salah satu direktur
  const linkedIds = new Set(otherDir.flatMap(dir =>
    bidangPusat.filter(b => {
      const at = (b.direkturAtasan ?? "").toLowerCase()
      const jab = (dir.jabatan ?? "").toLowerCase()
      if (!at || !jab) return false
      return at === jab || at.includes(jab) || jab.includes(at) ||
        jab.split(" ").filter((w:string)=>w.length>4).some((w:string)=>at.includes(w))
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
            <h1 className="text-xl font-black tracking-tight">STRUKTUR ORGANISASI</h1>
            <p className="text-xs text-muted-foreground">PERUMDA Air Minum Tirta Ardhia Rinjani — Kabupaten Lombok Tengah</p>
          </div>

          {/* Stats */}
          {data && (
            <div className="mb-6 grid gap-3 sm:grid-cols-3">
              {[
                { label:"Total Pegawai Aktif", value:data.stats.totalPegawai, icon:Users },
                { label:"Unit Kerja / Bidang", value:data.stats.totalBidang, icon:Building2 },
                { label:"Jabatan Berbeda", value:data.stats.totalJabatan, icon:Briefcase },
              ].map(s => (
                <Card key={s.label} className="card-premium">
                  <CardContent className="flex items-center gap-3 p-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary">
                      <s.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xl font-bold">{s.value.toLocaleString("id-ID")}</p>
                      <p className="text-[10px] text-muted-foreground">{s.label}</p>
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
            <Card className="card-premium">
              <CardContent className="p-8 overflow-auto">
                <div className="min-w-max mx-auto">

                  {/* ── MAIN TREE ── */}
                  <div className="ot">

                    {/* Direktur Utama */}
                    {dirut ? (
                      <div className="flex flex-col items-center gap-1 text-center relative">
                        <div className="relative">
                          <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-amber-400 shadow-xl">
                            {dirut.fotoUrl
                              ? <img src={dirut.fotoUrl} alt={dirut.nama} className="h-full w-full object-cover" />
                              : <div className="h-full w-full bg-primary flex items-center justify-center text-white text-xl font-bold">{initials(dirut.nama)}</div>
                            }
                          </div>
                          <div className="absolute -top-1 -right-1 h-6 w-6 bg-amber-400 rounded-full flex items-center justify-center shadow">
                            <Crown className="h-3.5 w-3.5 text-amber-900" />
                          </div>
                        </div>
                        <p className="text-sm font-bold max-w-[120px] leading-tight">{dirut.nama}</p>
                        <p className="text-[10px] text-muted-foreground max-w-[120px]">{dirut.jabatan}</p>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">Belum ada Direktur Utama</p>
                    )}

                    {/* Level 2: Direktur lain + bidang unlinked */}
                    {(otherDir.length > 0 || unlinkedBidang.length > 0) && (
                      <div className="oc">
                        {otherDir.map(dir => (
                          <div key={dir.id} className="oi">
                            <DirNode dir={dir} bidangList={bidangPusat} />
                          </div>
                        ))}
                        {unlinkedBidang.map(b => (
                          <div key={b.id} className="oi">
                            <BidangNode bid={b} />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* ── CABANG ── */}
                  {bidangCabang.length > 0 && (
                    <div className="mt-10">
                      <div className="flex items-center gap-3 mb-5">
                        <div className="h-px flex-1 border-t border-dashed border-slate-400/50" />
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-2">Kantor Cabang</span>
                        <div className="h-px flex-1 border-t border-dashed border-slate-400/50" />
                      </div>
                      <div className="ot">
                        <div className="oc" style={{paddingTop:0}}>
                          {bidangCabang.map(b => (
                            <div key={b.id} className="oi" style={{paddingTop:0}}>
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
