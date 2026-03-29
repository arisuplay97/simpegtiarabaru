"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { SidebarNav } from "@/components/simpeg/sidebar-nav"
import { TopBar } from "@/components/simpeg/top-bar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Bell, Megaphone, Send, Trash2, Users,
  Loader2, CheckCircle2, AlertCircle, RefreshCw,
  Radio
} from "lucide-react"
import {
  getPengumumanAktif,
  broadcastPengumuman,
  hapusPengumuman
} from "@/lib/actions/notifikasi"
import { toast } from "sonner"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"

export default function PengumumanPage() {
  const { data: session } = useSession()
  const role = (session?.user as any)?.role
  const canBroadcast = ["SUPERADMIN", "HRD", "DIREKSI"].includes(role)

  const [pengumumanList, setPengumumanList] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  const [title, setTitle] = useState("")
  const [message, setMessage] = useState("")

  const loadData = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await getPengumumanAktif()
      setPengumumanList(data)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) {
      toast.error("Judul dan isi pengumuman harus diisi")
      return
    }
    setIsSending(true)
    try {
      const res = await broadcastPengumuman(title.trim(), message.trim())
      if ((res as any).error) {
        toast.error((res as any).error)
      } else {
        toast.success(`Pengumuman berhasil dikirim ke ${(res as any).count} pegawai`)
        setTitle("")
        setMessage("")
        await loadData()
      }
    } finally {
      setIsSending(false)
    }
  }

  const handleDelete = async (t: string, m: string, key: string) => {
    setIsDeleting(key)
    try {
      const res = await hapusPengumuman(t, m)
      if ((res as any).error) {
        toast.error((res as any).error)
      } else {
        toast.success("Pengumuman berhasil dihapus")
        await loadData()
      }
    } finally {
      setIsDeleting(null)
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      <SidebarNav />
      <div className="flex flex-1 flex-col sidebar-offset">
        <TopBar breadcrumb={["Dashboard", "Pengumuman Berjalan"]} />
        <main className="flex-1 overflow-auto p-6">

          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <Megaphone className="h-6 w-6 text-primary" />
                Pengumuman Berjalan
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Buat pengumuman yang akan muncul sebagai ticker berjalan di aplikasi mobile pegawai.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={loadData} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

            {/* Form Buat Pengumuman */}
            <Card className="card-premium">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Send className="h-4 w-4 text-primary" />
                  Buat Pengumuman Baru
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!canBroadcast && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Hanya Admin, HRD, dan Direksi yang dapat mengirim pengumuman.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="title">Judul Pengumuman</Label>
                  <Input
                    id="title"
                    placeholder="contoh: Perhatian Pegawai"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    disabled={!canBroadcast || isSending}
                    maxLength={80}
                  />
                  <p className="text-[11px] text-muted-foreground">{title.length}/80 karakter</p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="message">Isi Pengumuman</Label>
                  <Textarea
                    id="message"
                    placeholder="Tulis isi pengumuman di sini. Pesan ini akan berjalan (ticker) di layar mobile pegawai..."
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    disabled={!canBroadcast || isSending}
                    rows={4}
                    maxLength={300}
                  />
                  <p className="text-[11px] text-muted-foreground">{message.length}/300 karakter</p>
                </div>

                {/* Preview */}
                {(title || message) && (
                  <div className="rounded-xl p-3 border border-blue-200 bg-blue-50">
                    <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                      <Radio className="h-3 w-3" /> Preview Ticker Mobile
                    </p>
                    <div className="flex items-center gap-2 text-[11px] overflow-hidden">
                      <Bell className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                      <span className="font-bold text-blue-800 truncate shrink-0">{title || "Judul"}</span>
                      <span className="text-blue-600 truncate">— {message || "Pesan berjalan..."}</span>
                    </div>
                  </div>
                )}

                <Alert className="border-amber-200 bg-amber-50">
                  <Users className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-800 text-xs">
                    Pengumuman akan dikirim ke <strong>semua pegawai aktif</strong> dan muncul sebagai ticker berjalan di dashboard mobile selama 30 hari.
                  </AlertDescription>
                </Alert>

                <Button
                  onClick={handleSend}
                  disabled={!canBroadcast || isSending || !title.trim() || !message.trim()}
                  className="w-full gap-2"
                >
                  {isSending ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Mengirim...</>
                  ) : (
                    <><Send className="h-4 w-4" /> Kirim ke Semua Pegawai</>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Daftar Pengumuman Aktif */}
            <Card className="card-premium">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Bell className="h-4 w-4 text-primary" />
                  Pengumuman Aktif
                  {pengumumanList.length > 0 && (
                    <Badge variant="secondary" className="ml-auto">{pengumumanList.length} aktif</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : pengumumanList.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center gap-2">
                    <CheckCircle2 className="h-10 w-10 text-muted-foreground/40" />
                    <p className="text-sm text-muted-foreground">Belum ada pengumuman aktif.</p>
                    <p className="text-xs text-muted-foreground">Buat pengumuman baru di form sebelah kiri.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pengumumanList.map((p, i) => {
                      const key = `${p.title}||${p.message}`
                      return (
                        <div key={p.id} className="rounded-xl border border-border bg-card p-4">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-blue-50 text-blue-700 border-blue-200">
                                  <Radio className="h-2.5 w-2.5 mr-0.5" /> SIARAN
                                </Badge>
                                <span className="text-[10px] text-muted-foreground">
                                  {format(new Date(p.createdAt), "dd MMM yyyy HH:mm", { locale: idLocale })}
                                </span>
                              </div>
                              <p className="text-sm font-bold text-foreground">{p.title}</p>
                              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">{p.message}</p>
                            </div>
                            {canBroadcast && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 shrink-0 text-red-400 hover:text-red-600 hover:bg-red-50"
                                onClick={() => handleDelete(p.title, p.message, key)}
                                disabled={isDeleting === key}
                              >
                                {isDeleting === key
                                  ? <Loader2 className="h-4 w-4 animate-spin" />
                                  : <Trash2 className="h-4 w-4" />}
                              </Button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

          </div>
        </main>
      </div>
    </div>
  )
}
