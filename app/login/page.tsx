'use client'
import { signIn } from "next-auth/react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import Image from "next/image"

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

  return (
    <div className="relative min-h-screen w-full overflow-hidden flex items-center justify-center">
      
      {/* ─── BACKGROUND: deep dark garden ─── */}
      <div className="absolute inset-0 bg-[#080b14]" />
      
      {/* Gradient orbs for depth */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-violet-900/30 blur-[120px]" />
        <div className="absolute top-1/4 -right-20 w-[400px] h-[400px] rounded-full bg-indigo-900/25 blur-[100px]" />
        <div className="absolute bottom-0 left-1/3 w-[600px] h-[400px] rounded-full bg-purple-950/40 blur-[130px]" />
      </div>

      {/* Decorative floating particles */}
      <div className="absolute inset-0 pointer-events-none">
        {[
          { top: "8%",  left: "12%",  size: "6px",  color: "#e879f9", delay: "0s",   dur: "4s"   },
          { top: "15%", left: "72%",  size: "4px",  color: "#a78bfa", delay: "1s",   dur: "5s"   },
          { top: "35%", left: "88%",  size: "7px",  color: "#fb7185", delay: "0.5s", dur: "3.5s" },
          { top: "55%", left: "6%",   size: "5px",  color: "#818cf8", delay: "2s",   dur: "4.5s" },
          { top: "70%", left: "82%",  size: "4px",  color: "#c084fc", delay: "1.5s", dur: "6s"   },
          { top: "82%", left: "25%",  size: "8px",  color: "#f472b6", delay: "0.8s", dur: "4s"   },
          { top: "20%", left: "45%",  size: "3px",  color: "#93c5fd", delay: "3s",   dur: "5.5s" },
          { top: "65%", left: "55%",  size: "5px",  color: "#a5b4fc", delay: "2.5s", dur: "4s"   },
        ].map((p, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              top: p.top, left: p.left, width: p.size, height: p.size,
              backgroundColor: p.color,
              boxShadow: `0 0 ${parseInt(p.size) * 3}px ${p.color}`,
              animation: `pulse ${p.dur} ${p.delay} ease-in-out infinite alternate`,
              opacity: 0.7,
            }}
          />
        ))}
      </div>

      {/* Decorative flower/petal SVGs */}
      <div className="absolute top-6 left-8 pointer-events-none select-none text-7xl opacity-20 rotate-12" style={{ filter: 'drop-shadow(0 0 20px #e879f9)' }}>✿</div>
      <div className="absolute top-20 right-12 pointer-events-none select-none text-5xl opacity-15 -rotate-12" style={{ filter: 'drop-shadow(0 0 16px #a78bfa)' }}>❀</div>
      <div className="absolute bottom-16 left-16 pointer-events-none select-none text-6xl opacity-20 rotate-6" style={{ filter: 'drop-shadow(0 0 18px #fb7185)' }}>✿</div>
      <div className="absolute bottom-8 right-20 pointer-events-none select-none text-4xl opacity-15 -rotate-6" style={{ filter: 'drop-shadow(0 0 14px #c084fc)' }}>❋</div>
      <div className="absolute top-1/2 left-4 pointer-events-none select-none text-3xl opacity-10 rotate-45" style={{ filter: 'drop-shadow(0 0 12px #818cf8)' }}>✾</div>

      {/* ─── LOGO TOP LEFT ─── */}
      <div className="absolute top-6 left-8 flex items-center gap-2.5 z-10">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 backdrop-blur-sm border border-white/10">
          <Image src="/logo-tar.png" alt="Logo" width={22} height={22} className="object-contain" />
        </div>
        <span className="text-sm font-semibold text-white/70">SIMPEG Tiara</span>
      </div>

      {/* ─── GLASSMORPHISM CARD ─── */}
      <div className="relative z-10 w-full max-w-sm mx-4 sm:mx-auto">
        
        {/* Card glow backdrop */}
        <div className="absolute -inset-1 rounded-3xl bg-gradient-to-br from-violet-500/20 via-purple-500/10 to-pink-500/20 blur-xl" />
        
        <div className="relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur-2xl p-8 shadow-2xl">

          {/* ── HEADER ── */}
          <div className="mb-8 text-center">
            <h1
              className="text-4xl font-bold text-white mb-2 leading-tight tracking-tight"
              style={{ fontFamily: '"Georgia", "Times New Roman", serif', fontStyle: 'italic' }}
            >
              Welcome back!
            </h1>
            <p className="text-sm text-white/40">Masuk untuk melanjutkan ke sistem</p>
          </div>

          {/* ── FORM ── */}
          <form onSubmit={handleLogin} className="space-y-4">
            
            {/* Username */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white/60 uppercase tracking-wider">Username</label>
              <input
                type="text"
                placeholder="Masukkan username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
                className="w-full rounded-xl bg-white/8 border border-white/10 px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-violet-500/60 focus:bg-white/12 transition-all"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white/60 uppercase tracking-wider">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Masukkan password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full rounded-xl bg-white/8 border border-white/10 px-4 py-3 pr-11 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-violet-500/60 focus:bg-white/12 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-xl bg-red-500/15 border border-red-500/25 px-4 py-2.5 text-sm text-red-300">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="relative w-full mt-2 rounded-xl py-3 text-sm font-bold text-white overflow-hidden transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 50%, #4c1d95 100%)',
                boxShadow: '0 4px 24px rgba(124, 58, 237, 0.5)',
              }}
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {isLoading ? (
                  <><Loader2 className="h-4 w-4 animate-spin" />Memuat...</>
                ) : (
                  "Masuk ke Sistem"
                )}
              </span>
              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-700" />
            </button>

          </form>

          {/* Footer */}
          <p className="mt-6 text-center text-xs text-white/25">
            Sistem Informasi Manajemen Kepegawaian
          </p>
        </div>
      </div>

      {/* Keyframe animation for particles */}
      <style jsx>{`
        @keyframes pulse {
          from { opacity: 0.3; transform: scale(0.8); }
          to   { opacity: 0.9; transform: scale(1.3); }
        }
      `}</style>
    </div>
  )
}
