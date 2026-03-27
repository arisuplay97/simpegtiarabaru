'use client'
import { signIn } from "next-auth/react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Eye, EyeOff, Loader2 } from "lucide-react"

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

      {/* ─── WALLPAPER BACKGROUND ─── */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/login.png')" }}
      />
      {/* Overlay tipis agar form tetap kontras tapi wallpaper terlihat jelas */}
      <div className="absolute inset-0 bg-black/20" />
      {/* Gradient bawah untuk teks ASIK terbaca */}
      <div className="absolute bottom-0 inset-x-0 h-48 bg-gradient-to-t from-black/70 to-transparent" />

      {/* ─── TEKS ASIK POJOK KIRI BAWAH ─── */}
      <div className="absolute bottom-8 left-8 z-20 flex flex-col gap-0.5 select-none hidden sm:flex">
        <span
          className="text-4xl font-black tracking-widest text-white leading-none"
          style={{
            textShadow: '0 0 20px rgba(168,85,247,0.9), 0 0 40px rgba(168,85,247,0.6), 0 0 80px rgba(168,85,247,0.3)',
            letterSpacing: '0.25em',
          }}
        >
          ASIK
        </span>
        <span
          className="text-sm font-medium text-white/70 italic leading-tight"
          style={{ textShadow: '0 0 12px rgba(255,255,255,0.3)' }}
        >
          Aplikasi Sistem Informasi Kepegawaian
        </span>
        <span
          className="text-xs font-semibold text-white/60 leading-tight tracking-wide"
          style={{ textShadow: '0 0 10px rgba(255,255,255,0.2)' }}
        >
          Perumdam Tirta Ardhia Rinjani
        </span>
      </div>

      {/* ─── FORM CARD ─── terpusat */}
      <div className="relative z-10 w-full max-w-sm mx-4 sm:mx-auto">

        {/* Subtle card glow */}
        <div className="absolute -inset-0.5 rounded-2xl bg-white/5 blur-md" />

        {/* Form container — fully transparent glass */}
        <div className="relative rounded-2xl border border-white/15 bg-white/5 backdrop-blur-2xl p-8 pt-10">

          {/* ── HEADER BERSAMA LOGO ── */}
          <div className="mb-8 flex flex-col items-center text-center">
            
            {/* Logo Group */}
            <div className="flex items-center justify-center gap-8 mb-6 pointer-events-none">
              <img 
                src="/pojokkiri%20logo.png" 
                alt="Logo Tirta Rinjani" 
                className="h-24 w-auto object-contain opacity-95"
                style={{ filter: 'drop-shadow(0 0 15px rgba(255,255,255,0.6)) drop-shadow(0 0 30px rgba(255,255,255,0.2))' }}
              />
              <div className="h-16 w-px bg-white/20" />
              <img 
                src="/pojokkanan%20logo.png" 
                alt="Logo ASIK" 
                className="h-28 w-auto object-contain opacity-95"
                style={{ filter: 'drop-shadow(0 0 20px rgba(168,85,247,0.9)) drop-shadow(0 0 40px rgba(168,85,247,0.6))' }}
              />
            </div>

            <h1
              className="text-3xl font-bold text-white mb-2 leading-tight"
              style={{ fontFamily: '"Georgia", "Times New Roman", serif', fontStyle: 'italic' }}
            >
              Welcome back!
            </h1>
            <p className="text-sm text-white/45">Masuk untuk melanjutkan ke sistem</p>
          </div>

          {/* ── FORM ── */}
          <form onSubmit={handleLogin} className="space-y-4">

            {/* Username */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-white/55 uppercase tracking-wider">Username</label>
              <input
                type="text"
                placeholder="Masukkan username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
                className="w-full rounded-xl bg-black/20 border border-white/15 px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-violet-400/60 focus:bg-black/30 transition-all backdrop-blur-sm"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-white/55 uppercase tracking-wider">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Masukkan password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full rounded-xl bg-black/20 border border-white/15 px-4 py-3 pr-11 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-violet-400/60 focus:bg-black/30 transition-all backdrop-blur-sm"
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
              <div className="rounded-xl bg-red-500/20 border border-red-400/30 px-4 py-2.5 text-sm text-red-200">
                {error}
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={isLoading}
              className="relative w-full mt-2 rounded-xl py-3 text-sm font-bold text-white overflow-hidden transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 50%, #4c1d95 100%)',
                boxShadow: '0 4px 24px rgba(124, 58, 237, 0.55)',
              }}
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {isLoading ? (
                  <><Loader2 className="h-4 w-4 animate-spin" />Memuat...</>
                ) : (
                  "Masuk ke Sistem"
                )}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-700" />
            </button>

          </form>
        </div>
      </div>

    </div>
  )
}
