'use client'

import { useState, useTransition } from "react"
import { useSession } from "next-auth/react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { AlertCircle, KeyRound, Eye, EyeOff, CheckCircle2 } from "lucide-react"
import { changePassword } from "@/lib/actions/auth-actions"
import { toast } from "sonner"

export function ForceChangePasswordModal() {
  const { data: session, update } = useSession()
  const mustChange = (session?.user as any)?.mustChangePassword

  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  if (!mustChange) return null

  const validations = [
    { label: "Minimal 8 karakter", valid: password.length >= 8 },
    { label: "Ada huruf kapital", valid: /[A-Z]/.test(password) },
    { label: "Ada angka",          valid: /[0-9]/.test(password) },
  ]
  const isValid = validations.every(v => v.valid) && password === confirm

  const handleSubmit = () => {
    setError(null)
    if (password !== confirm) {
      setError("Password dan konfirmasi tidak cocok.")
      return
    }
    if (!validations.every(v => v.valid)) {
      setError("Password belum memenuhi semua kriteria.")
      return
    }

    startTransition(async () => {
      const result = await changePassword(password)
      if (result?.error) {
        setError(result.error)
        return
      }
      toast.success("Password berhasil diperbarui!")
      // Refresh session agar mustChangePassword terupdate
      await update({ mustChangePassword: false })
    })
  }

  return (
    <Dialog open={true}>
      <DialogContent
        className="max-w-md p-0 overflow-hidden"
        // Tidak ada onOpenChange → tidak bisa ditutup
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-primary/80 px-6 py-5 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-white text-lg font-semibold">
                Ganti Password
              </DialogTitle>
              <DialogDescription className="text-white/80 text-sm mt-0.5">
                Wajib dilakukan sebelum melanjutkan
              </DialogDescription>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <p className="text-sm text-muted-foreground">
            Akun Anda baru saja dibuat. Demi keamanan, harap ganti password sekarang sebelum menggunakan sistem.
          </p>

          {/* Password Baru */}
          <div className="space-y-1.5">
            <Label>Password Baru</Label>
            <div className="relative">
              <Input
                type={showPass ? "text" : "password"}
                placeholder="Masukkan password baru"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPass(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Validasi kriteria */}
          {password.length > 0 && (
            <div className="space-y-1">
              {validations.map(v => (
                <div key={v.label} className={`flex items-center gap-2 text-xs ${v.valid ? "text-emerald-600" : "text-muted-foreground"}`}>
                  <CheckCircle2 className={`h-3.5 w-3.5 ${v.valid ? "text-emerald-600" : "text-gray-300"}`} />
                  {v.label}
                </div>
              ))}
            </div>
          )}

          {/* Konfirmasi */}
          <div className="space-y-1.5">
            <Label>Konfirmasi Password</Label>
            <div className="relative">
              <Input
                type={showConfirm ? "text" : "password"}
                placeholder="Ulangi password baru"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {confirm.length > 0 && password !== confirm && (
              <p className="text-xs text-red-500">Password tidak cocok</p>
            )}
          </div>

          {/* Error global */}
          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-100 px-3 py-2">
              <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
              <p className="text-xs text-red-700">{error}</p>
            </div>
          )}

          <Button
            className="w-full"
            disabled={!isValid || isPending}
            onClick={handleSubmit}
          >
            {isPending ? "Menyimpan..." : "Simpan Password Baru"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
