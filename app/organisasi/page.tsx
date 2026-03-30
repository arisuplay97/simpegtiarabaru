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

// ─── Tree CSS ─────────────────────────────────────────────────────────────
const CSS = `
/* TREE: container is a column-flex centred */
.tree { display:flex; flex-direction:column; align-items:center; }

/* ROW: flex-row of children; padding-top creates space for connectors */
.tr { display:flex; flex-direction:row; justify-content:center; align-items:flex-start; padding-top:20px; position:relative; }

/* Vertical STEM from parent node down into the T-bar (sits above children) */
.tr::before { content:''; position:absolute; top:0; left:50%; transform:translateX(-50%); width:1px; height:20px; background:#94a3b8; }

/* CHILD wrapper */
.tc { display:flex; flex-direction:column; align-items:center; padding:0 8px; padding-top:20px; position:relative; }

/* Horizontal bar connecting siblings */
.tc::before { content:''; position:absolute; top:0; height:1px; background:#94a3b8; }
.tc:first-child:not(:only-child)::before { left:50%; right:0; }
.tc:last-child:not(:only-child)::before  { right:50%; left:0; }
.tc:not(:first-child):not(:last-child)::before { left:0; right:0; }
.tc:only-child::before { display:none; }

/* Vertical connector from horizontal bar down to child node */
.tc::after { content:''; position:absolute; top:0; left:50%; transform:translateX(-50%); width:1px; height:20px; background:#94a3b8; }
.tc:only-child::after { display:none; }
`

// ─── Color map ──────────────────────────────────────────────────────────
const colorMap:Record<string,string> = {
  KEPALA_BIDANG:"bg-emerald-600", KEPALA_CABANG:"bg-emerald-600",
  KASUBBID:"bg-blue-600",        KASUBBID_CABANG:"bg-blue-600",
  STAFF:"bg-slate-500",          STAFF_CABANG:"bg-slate-500", KONTRAK:"bg-amber-600"
}

// ─── Avatar circle ─────────────────────────────────────────────────────
function Circle({ p, size, color }:{ p:P; size:number; color?:string }) {
  const bg = color ?? colorMap[p.tipeJabatan] ?? "bg-slate-500"
  return (
    <div
      className={`rounded-full overflow-hidden border-2 border-white/50 shadow-md flex-shrink-0 ${bg}`}
      style={{ width:size, height:size, minWidth:size }}
    >
      {p.fotoUrl
        ? <img src={p.fotoUrl} alt={p.nama} className="h-full w-full object-cover" />
        : <div className="h-full w-full flex items-center justify-center text-white font-bold" style={{fontSize:size*0.32}}>
            {initials(p.nama)}
          </div>
      }
    </div>
  )
}

// ─── Node card ──────────────────────────────────────────────────────────
function Node({ p, size, color, showJabatan=true }:{ p:P; size:number; color?:string; showJabatan?:boolean }) {
  const maxW = Math.max(size + 16, 90)
  return (
    <div className="flex flex-col items-center text-center relative" style={{maxWidth:maxW}}>
      <div className="absolute w-px bg-[#94a3b8] -z-10" style={{ top: size/2, bottom: -1 }} />
      <Circle p={p} size={size} color={color} />
      <div className="bg-background relative px-1 mt-1 z-10 flex flex-col items-center pt-0.5 pb-1">
        <p className="text-[10px] font-bold leading-tight text-foreground line-clamp-2" style={{maxWidth:maxW, wordBreak:"break-word"}}>{p.nama}</p>
        {showJabatan && <p className="text-[9px] text-muted-foreground leading-tight line-clamp-2 mt-0.5" style={{maxWidth:maxW}}>{p.jabatan}</p>}
      </div>
    </div>
  )
}

// ─── SubBidang ─────────────────────────────────────────────────────────
function SubNode({ sub }:{ sub:Sub }) {
  const kasubbid = sub.pegawai.find(p => ["KASUBBID","KASUBBID_CABANG"].includes(p.tipeJabatan))
  const staff    = sub.pegawai.filter(p => !["KASUBBID","KASUBBID_CABANG"].includes(p.tipeJabatan))
  return (
    <div className="tree">
      <div className="text-[8px] font-semibold text-blue-700 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 rounded-md px-2 py-0.5 max-w-[88px] text-center leading-tight">
        {sub.nama}
      </div>
      {kasubbid && <div className="tr"><div className="tc"><Node p={kasubbid} size={34} /></div></div>}
      {staff.length > 0 && (
        <div className="tr">
          {staff.map(s => <div key={s.id} className="tc"><Node p={s} size={27} showJabatan={false} /></div>)}
        </div>
      )}
      {!kasubbid && staff.length === 0 && <p className="text-[8px] text-muted-foreground/50 italic mt-1">–</p>}
    </div>
  )
}

// ─── Bidang ────────────────────────────────────────────────────────────
function BidangNode({ bid }:{ bid:Bid }) {
  const kepala = bid.pegawai.find(p => ["KEPALA_BIDANG","KEPALA_CABANG"].includes(p.tipeJabatan))
  return (
    <div className="tree">
      <div className="text-[8px] font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 rounded-md px-2 py-0.5 max-w-[96px] text-center leading-tight">
        {bid.nama}
      </div>
      {kepala
        ? <div className="tr"><div className="tc"><Node p={kepala} size={40} /></div></div>
        : <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-[9px] text-muted-foreground mt-3">–</div>
      }
      {bid.subBidang.length > 0 && (
        <div className="tr">
          {bid.subBidang.map(sub => <div key={sub.id} className="tc"><SubNode sub={sub} /></div>)}
        </div>
      )}
    </div>
  )
}

// ─── Direktur ──────────────────────────────────────────────────────────
function DirNode({ dir, bidangList }:{ dir:P; bidangList:Bid[] }) {
  const jab = (dir.jabatan ?? "").toLowerCase()
  const myBidang = bidangList.filter(b => {
    const at = (b.direkturAtasan ?? "").toLowerCase().replace(/&/g, "dan").trim()
    const j = jab.replace(/&/g, "dan").trim()
    return at && j && (at === j)
  })
  return (
    <div className="tree">
      <Node p={dir} size={50} color="bg-primary" />
      {myBidang.length > 0 && (
        <div className="tr">
          {myBidang.map(b => <div key={b.id} className="tc"><BidangNode bid={b} /></div>)}
        </div>
      )}
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────
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

  const dirut    = data?.direksiList.find(d => d.jabatan?.toLowerCase().includes("utama") || d.jabatan?.toLowerCase().includes("dirut"))
  const otherDir = data?.direksiList.filter(d => d.id !== dirut?.id) ?? []

  const bidangPusat  = data?.bidangList.filter(b => !b.nama.toLowerCase().includes("cabang") && !b.kode?.toLowerCase().startsWith("c")) ?? []
  const bidangCabang = data?.bidangList.filter(b =>  b.nama.toLowerCase().includes("cabang") || b.kode?.toLowerCase().startsWith("c")) ?? []

  const linkedIds = new Set(otherDir.flatMap(dir =>
    bidangPusat.filter(b => {
      const at  = (b.direkturAtasan ?? "").toLowerCase().replace(/&/g, "dan").trim()
      const jab = (dir.jabatan ?? "").toLowerCase().replace(/&/g, "dan").trim()
      return at && jab && (at === jab)
    }).map(b => b.id)
  ))
  const unlinkedBidang = bidangPusat.filter(b => !linkedIds.has(b.id))
  
  const half = Math.ceil(otherDir.length / 2)
  const leftDir = otherDir.slice(0, half)
  const rightDir = otherDir.slice(half)

  const missingRight = Math.max(0, leftDir.length - rightDir.length)
  const fillersRight = leftDir.slice(0, missingRight).reverse()

  const missingLeft = Math.max(0, rightDir.length - leftDir.length)
  const fillersLeft = rightDir.slice(0, missingLeft).reverse()

  return (
    <div className="flex min-h-screen bg-background">
      <style>{CSS}</style>
      <SidebarNav />
      <div className="flex flex-1 flex-col sidebar-offset">
        <TopBar breadcrumb={["Kepegawaian", "Struktur Organisasi"]} />
        <main className="flex-1 overflow-auto p-6">

          {/* Header */}
          <div className="mb-4 text-center">
            <h1 className="text-xl font-black tracking-tight">STRUKTUR ORGANISASI</h1>
            <p className="text-xs text-muted-foreground">PERUMDA Air Minum Tirta Ardhia Rinjani — Kabupaten Lombok Tengah</p>
          </div>

          {/* Stats — compact horizontal strip */}
          {data && (
            <div className="mb-5 flex items-center justify-center gap-3 flex-wrap">
              {[
                { label:"Total Pegawai Aktif", value:data.stats.totalPegawai, icon:Users,     color:"text-emerald-600 bg-emerald-50 border-emerald-200" },
                { label:"Unit Kerja / Bidang",  value:data.stats.totalBidang,  icon:Building2, color:"text-blue-600 bg-blue-50 border-blue-200" },
                { label:"Jabatan Berbeda",       value:data.stats.totalJabatan, icon:Briefcase, color:"text-violet-600 bg-violet-50 border-violet-200" },
              ].map(s => {
                const Icon = s.icon
                return (
                  <div key={s.label} className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-semibold ${s.color}`}>
                    <Icon className="h-3.5 w-3.5" />
                    <span className="font-black">{s.value.toLocaleString("id-ID")}</span>
                    <span className="text-xs font-medium opacity-70">{s.label}</span>
                  </div>
                )
              })}
            </div>
          )}

          {/* Org Chart */}
          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : error ? (
            <Card><CardContent className="p-8 text-center text-destructive">{error}</CardContent></Card>
          ) : data && (
            <Card className="card-premium">
              <CardContent className="p-6 overflow-auto">
                <div className="min-w-max mx-auto">

                  {/* ── MAIN TREE ─────────────────────────────────── */}
                  <div className="tree">

                    {/* Direktur Utama */}
                    {dirut ? (
                      <div className="flex flex-col items-center text-center relative">
                        <div className="absolute w-px bg-[#94a3b8] -z-10" style={{ top: 40, bottom: -1 }} />
                        <div className="relative">
                          <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-amber-400 shadow-xl bg-primary">
                            {dirut.fotoUrl
                              ? <img src={dirut.fotoUrl} alt={dirut.nama} className="h-full w-full object-cover" />
                              : <div className="h-full w-full flex items-center justify-center text-white text-xl font-bold">{initials(dirut.nama)}</div>
                            }
                          </div>
                          <div className="absolute -top-1 -right-1 h-6 w-6 bg-amber-400 rounded-full flex items-center justify-center shadow">
                            <Crown className="h-3.5 w-3.5 text-amber-900" />
                          </div>
                        </div>
                        <div className="bg-background relative px-2 py-1 mt-1 z-10 flex flex-col items-center pb-2">
                          <p className="text-sm font-bold max-w-[130px] leading-tight text-foreground">{dirut.nama}</p>
                          <p className="text-[10px] text-muted-foreground max-w-[130px] mt-0.5">{dirut.jabatan}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">Belum ada Direktur Utama</p>
                    )}

                    {/* Level 2 — direktur lain + bidang unlinked */}
                    {(otherDir.length > 0 || unlinkedBidang.length > 0) && (
                      <div className="tr">
                        {/* Invisible Fillers Left */}
                        {fillersLeft.map((dir, i) => (
                          <div key={'fl'+i} className="tc invisible pointer-events-none" aria-hidden="true" style={{height: 1, paddingBottom: 0, overflow: 'hidden'}}>
                            <DirNode dir={dir} bidangList={bidangPusat} />
                          </div>
                        ))}
                        
                        {leftDir.map(dir => (
                          <div key={dir.id} className="tc">
                            <DirNode dir={dir} bidangList={bidangPusat} />
                          </div>
                        ))}
                        {unlinkedBidang.length > 0 && (
                          <div className="tc relative">
                            <div className="w-px bg-[#94a3b8]" style={{ height: "78px" }} />
                            <div className="tr w-full pt-0" style={{ marginTop: "-20px" }}>
                              {unlinkedBidang.map(b => (
                                <div key={b.id} className="tc">
                                  <BidangNode bid={b} />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {rightDir.map(dir => (
                          <div key={dir.id} className="tc">
                            <DirNode dir={dir} bidangList={bidangPusat} />
                          </div>
                        ))}

                        {/* Invisible Fillers Right */}
                        {fillersRight.map((dir, i) => (
                          <div key={'fr'+i} className="tc invisible pointer-events-none" aria-hidden="true" style={{height: 1, paddingBottom: 0, overflow: 'hidden'}}>
                            <DirNode dir={dir} bidangList={bidangPusat} />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* ── CABANG ─────────────────────────────────────── */}
                  {bidangCabang.length > 0 && (
                    <div className="mt-10">
                      <div className="flex items-center gap-3 mb-5">
                        <div className="h-px flex-1 border-t border-dashed border-slate-400/50" />
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-2">Kantor Cabang</span>
                        <div className="h-px flex-1 border-t border-dashed border-slate-400/50" />
                      </div>
                      <div className="flex flex-wrap justify-center gap-6">
                        {bidangCabang.map(b => (
                          <BidangNode key={b.id} bid={b} />
                        ))}
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
