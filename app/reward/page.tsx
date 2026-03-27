"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { SidebarNav } from "@/components/simpeg/sidebar-nav"
import { TopBar } from "@/components/simpeg/top-bar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Gift, Wallet, CheckCircle2, XCircle, Clock, Save, Loader2, ArrowRight, Medal } from "lucide-react"
import { toast } from "sonner"
import { getSaldoPoinPegawai, getRiwayatPenukaranPoin, ajukanPenukaranPoin, prosesPenukaranPoin, getTopPegawaiLeaderboard } from "@/lib/actions/poin-reward"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const REWARD_CATALOG = [
  { id: 1, name: "Voucher Belanja Indomaret Rp 100.000", cost: 1000 },
  { id: 2, name: "Voucher Bensin Pertamina Rp 200.000", cost: 2000 },
  { id: 3, name: "Uang Tunai Rp 500.000 (Bonus Gaji)", cost: 5000 },
  { id: 4, name: "Emas Antam 1 Gram", cost: 10000 },
  { id: 5, name: "Cuti Tambahan 1 Hari", cost: 1500 },
]

export default function RewardPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const isAdmin = session?.user?.role === "SUPERADMIN" || session?.user?.role === "HRD"
  
  const [saldo, setSaldo] = useState({ saldo: 0, totalEarned: 0, spent: 0 })
  const [riwayat, setRiwayat] = useState<any[]>([])
  const [leaderboardBulan, setLeaderboardBulan] = useState<any[]>([])
  const [leaderboardAll, setLeaderboardAll] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Form Tukar
  const [openModal, setOpenModal] = useState(false)
  const [selectedReward, setSelectedReward] = useState<any>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    
    // Fetch leaderboards regardless of role
    const [lbBulan, lbAll] = await Promise.all([
      getTopPegawaiLeaderboard("month"),
      getTopPegawaiLeaderboard("alltime")
    ])
    setLeaderboardBulan(lbBulan)
    setLeaderboardAll(lbAll)

    if (session?.user?.email) {
      if (!isAdmin) {
        const pegawaiId = (session.user as any).id
        const userSaldo = await getSaldoPoinPegawai(pegawaiId)
        setSaldo(userSaldo)
        const myRiwayat = await getRiwayatPenukaranPoin(pegawaiId)
        setRiwayat(myRiwayat)
      } else {
        const allRiwayat = await getRiwayatPenukaranPoin()
        setRiwayat(allRiwayat)
      }
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [session])

  const handleTukar = async () => {
    if (!selectedReward) return toast.error("Pilih reward terlebih dahulu")
    
    setIsSubmitting(true)
    const res = await ajukanPenukaranPoin({
      pegawaiId: (session?.user as any).id,
      jumlahPoin: selectedReward.cost,
      keteranganItem: selectedReward.name
    })

    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success("Pengajuan penukaran poin berhasil")
      setOpenModal(false)
      fetchData()
    }
    setIsSubmitting(false)
  }

  const handleProses = async (id: string, st: "APPROVED" | "REJECTED") => {
    const res = await prosesPenukaranPoin(id, st)
    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success(`Penukaran berhasil di-${st}`)
      fetchData()
    }
  }

  if (loading) return <div className="flex justify-center items-center min-h-screen"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>

  return (
    <div className="flex min-h-screen bg-background">
      <SidebarNav />
      <div className="flex flex-1 flex-col sidebar-offset">
        <TopBar breadcrumb={["Kinerja", "Reward Poin"]} />
        <main className="flex-1 p-6 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <Gift className="w-6 h-6 text-primary" />
                Poin & Reward Pegawai
              </h1>
              <p className="text-sm text-muted-foreground mt-1">Gamifikasi Kedisiplinan dan Katalog Penukaran Poin</p>
            </div>
            {!isAdmin && (
              <Dialog open={openModal} onOpenChange={setOpenModal}>
                <DialogTrigger asChild>
                  <Button className="gap-2"><Gift className="w-4 h-4" /> Tukar Poin</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Minta Penukaran Poin</DialogTitle>
                    <DialogDescription>
                      Saldo aktif Anda saat ini: <strong>{saldo.saldo} PTS</strong>
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4 space-y-4">
                    <div className="space-y-2">
                      <Label>Pilih Item Reward</Label>
                      <Select 
                        onValueChange={(val) => setSelectedReward(REWARD_CATALOG.find(c => c.id.toString() === val))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih Hadiah..." />
                        </SelectTrigger>
                        <SelectContent>
                          {REWARD_CATALOG.map(r => (
                            <SelectItem key={r.id} value={r.id.toString()} disabled={saldo.saldo < r.cost}>
                              {r.name} - {r.cost} Pts
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {selectedReward && (
                        <p className="text-xs text-muted-foreground pt-1">
                          Akan memotong {selectedReward.cost} poin dari saldo Anda.
                        </p>
                      )}
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setOpenModal(false)}>Batal</Button>
                    <Button onClick={handleTukar} disabled={isSubmitting || !selectedReward}>
                      {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} Ajukan
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {!isAdmin && (
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Saldo Poin Aktif</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-black">{saldo.saldo} <span className="text-lg font-normal opacity-80">PTS</span></div>
                  <p className="text-xs opacity-80 mt-1 flex items-center gap-1">
                    <Wallet className="w-3 h-3" /> Poin siap ditukarkan
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Poin Didapat</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{saldo.totalEarned} PTS</div>
                  <p className="text-xs text-muted-foreground mt-1">Akumulasi penerimaan poin</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Poin Terpakai</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-amber-600">{saldo.spent} PTS</div>
                  <p className="text-xs text-muted-foreground mt-1">Total penarikan reward</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* LEADERBOARDS ROW */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="shadow-sm">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Medal className="w-5 h-5 text-amber-500" />
                  Top 5 Pegawai (Bulan Ini)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="px-6 py-4 space-y-4">
                  {leaderboardBulan.length === 0 ? (
                    <div className="text-center text-sm text-muted-foreground py-4">Belum ada data.</div>
                  ) : (
                    leaderboardBulan.map((lb: any, idx: number) => (
                      <div key={lb.id} className="flex items-center gap-3">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${idx === 0 ? 'bg-amber-100 text-amber-700' : idx === 1 ? 'bg-slate-200 text-slate-700' : idx === 2 ? 'bg-orange-100 text-orange-700' : 'bg-neutral-100 text-neutral-500'}`}>
                          {idx + 1}
                        </div>
                        <Avatar className="h-9 w-9 shrink-0">
                          <AvatarImage src={lb.fotoUrl} />
                          <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                            {lb.nama.substring(0,2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">{lb.nama}</p>
                          <p className="text-xs text-muted-foreground truncate">{lb.bidang}</p>
                        </div>
                        <div className="text-sm font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                          {lb.points} Pts
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Medal className="w-5 h-5 text-indigo-500" />
                  Top 5 Pegawai (Sepanjang Waktu)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="px-6 py-4 space-y-4">
                  {leaderboardAll.length === 0 ? (
                    <div className="text-center text-sm text-muted-foreground py-4">Belum ada data.</div>
                  ) : (
                    leaderboardAll.map((lb: any, idx: number) => (
                      <div key={lb.id} className="flex items-center gap-3">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${idx === 0 ? 'bg-indigo-100 text-indigo-700' : idx === 1 ? 'bg-slate-200 text-slate-700' : idx === 2 ? 'bg-purple-100 text-purple-700' : 'bg-neutral-100 text-neutral-500'}`}>
                          {idx + 1}
                        </div>
                        <Avatar className="h-9 w-9 shrink-0">
                          <AvatarImage src={lb.fotoUrl} />
                          <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                            {lb.nama.substring(0,2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">{lb.nama}</p>
                          <p className="text-xs text-muted-foreground truncate">{lb.bidang}</p>
                        </div>
                        <div className="text-sm font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
                          {lb.points} Pts
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* TABLE RIWAYAT */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Daftar Pengajuan Penukaran Poin</CardTitle>
              <CardDescription>
                {isAdmin ? "Semua request dari pegawai untuk ditindaklanjuti." : "Riwayat penukaran Anda."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {riwayat.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  <Gift className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>Belum ada riwayat penukaran poin saat ini.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tanggal</TableHead>
                      {isAdmin && <TableHead>Pegawai</TableHead>}
                      <TableHead>Reward Diajukan</TableHead>
                      <TableHead>Potongan</TableHead>
                      <TableHead>Status</TableHead>
                      {isAdmin && <TableHead className="text-right">Aksi HRD</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {riwayat.map((r: any) => (
                      <TableRow key={r.id}>
                        <TableCell>{format(new Date(r.tanggal), "dd MMM yyyy", { locale: id })}</TableCell>
                        {isAdmin && (
                          <TableCell>
                            <span className="font-semibold">{r.pegawai.nama}</span>
                            <br/><span className="text-xs text-muted-foreground">{r.pegawai.jabatan}</span>
                          </TableCell>
                        )}
                        <TableCell className="font-medium text-primary">{r.keteranganItem}</TableCell>
                        <TableCell className="text-amber-600 font-semibold">-{r.jumlahPoin} Pts</TableCell>
                        <TableCell>
                          {r.status === "PENDING" && <Badge variant="outline" className="text-blue-600 border-blue-600 bg-blue-50"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>}
                          {r.status === "APPROVED" && <Badge variant="outline" className="text-emerald-600 border-emerald-600 bg-emerald-50"><CheckCircle2 className="w-3 h-3 mr-1" /> Disetujui</Badge>}
                          {r.status === "REJECTED" && <Badge variant="outline" className="text-rose-600 border-rose-600 bg-rose-50"><XCircle className="w-3 h-3 mr-1" /> Ditolak</Badge>}
                        </TableCell>
                        {isAdmin && (
                          <TableCell className="text-right">
                            {r.status === "PENDING" ? (
                              <div className="flex items-center justify-end gap-2">
                                <Button size="sm" variant="outline" className="text-emerald-600 bg-emerald-50 hover:bg-emerald-100" onClick={() => handleProses(r.id, "APPROVED")}>Setujui</Button>
                                <Button size="sm" variant="outline" className="text-rose-600 bg-rose-50 hover:bg-rose-100" onClick={() => handleProses(r.id, "REJECTED")}>Tolak</Button>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground mr-2">Diproses oleh: {r.approvedBy?.nama || 'Sistem'}</span>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}
