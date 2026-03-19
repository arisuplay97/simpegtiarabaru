'use client'
import { signIn } from "next-auth/react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Eye, EyeOff, Loader2, User, Lock } from "lucide-react"

const demoAccounts = [
  { username: "superadmin", password: "admin123", label: "Super Admin",  color: "bg-purple-100 text-purple-700" },
  { username: "hrd",        password: "hrd123",   label: "HRD / Admin",  color: "bg-blue-100 text-blue-700" },
  { username: "direktur",   password: "direktur123", label: "Direktur",  color: "bg-amber-100 text-amber-700" },
  { username: "pegawai",    password: "pegawai123",  label: "Pegawai",   color: "bg-emerald-100 text-emerald-700" },
]

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)
    const result = await signIn("credentials", {
      username: username.toLowerCase().trim(),
      password,
      redirect: false,
    })
    if (result?.error) {
      setError("Username atau password salah")
    } else {
      toast.success("Berhasil masuk")
      router.push("/")
      router.refresh()
    }
    setIsLoading(false)
  }

  const quickLogin = async (u: string, p: string) => {
    setIsLoading(true)
    setError("")
    const result = await signIn("credentials", {
      username: u,
      password: p,
      redirect: false,
    })
    if (result?.error) {
      setError("Login gagal")
      setIsLoading(false)
    } else {
      toast.success(`Login berhasil`)
      router.push("/")
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-950 to-black p-4">
      <Card className="w-full max-w-md p-8 shadow-2xl bg-white/10 backdrop-blur-md border-white/20 text-white">
        <div className="text-center mb-8 flex flex-col items-center justify-center">
          <img src="/logo-tar.png" alt="Logo Tirta Ardhia Rinjani" className="h-24 object-contain mb-4" />
          <h1 className="text-4xl font-extrabold tracking-tight mb-2">SIMPEG Tiara</h1>
          <p className="text-blue-200">Sistem Informasi Manajemen Kepegawaian</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="username" className="text-blue-100">Username</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
              <Input
                id="username"
                type="text"
                placeholder="Masukkan username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-blue-500"
                required
                autoComplete="username"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-blue-100">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Masukkan password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-blue-500"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error && (
            <p className="rounded-lg bg-red-500/20 border border-red-500/30 px-3 py-2 text-sm text-red-300">
              {error}
            </p>
          )}

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg"
          >
            {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Memuat...</> : "Masuk ke Sistem"}
          </Button>
        </form>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-white/10"></span>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-transparent px-2 text-blue-300">— Login Cepat Demo —</span>
          </div>
        </div>

        {/* Quick Login */}
        <div className="grid grid-cols-2 gap-2">
          {demoAccounts.map(acc => (
            <button
              key={acc.username}
              onClick={() => quickLogin(acc.username, acc.password)}
              disabled={isLoading}
              className="flex flex-col items-start rounded-lg border border-white/10 p-3 text-left hover:bg-white/10 transition-colors disabled:opacity-50"
            >
              <div className="flex w-full items-center justify-between">
                <span className="text-sm font-medium text-white">{acc.username}</span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${acc.color}`}>
                  {acc.label}
                </span>
              </div>
              <span className="mt-0.5 text-xs text-white/40">{acc.password}</span>
            </button>
          ))}
        </div>
      </Card>
    </div>
  )
}
