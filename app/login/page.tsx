"use client"

import { signIn } from "next-auth/react"
import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import Image from "next/image"

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard"

  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [deviceId, setDeviceId] = useState("")

  useEffect(() => {
    let storedId = localStorage.getItem("deviceId") || localStorage.getItem("tris_device_id")
    if (!storedId) {
      storedId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15)
    }
    localStorage.setItem("deviceId", storedId)
    localStorage.setItem("tris_device_id", storedId)
    setDeviceId(storedId)

    const savedUser = localStorage.getItem("simpeg_remember_user")
    if (savedUser) {
      setUsername(savedUser)
    }
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    if (rememberMe) {
      localStorage.setItem("simpeg_remember_user", username)
    } else {
      localStorage.removeItem("simpeg_remember_user")
    }

    try {
      const result = await signIn("credentials", {
        username: username.toLowerCase().trim(),
        password,
        deviceId,
        redirect: false,
      })

      if (result?.error) {
        if (
          result.error.includes("Perangkat tidak dikenali") ||
          result.error.includes("DeviceMismatch") ||
          result.error === "DeviceMismatch" ||
          (result as any)?.code === "DeviceMismatch" ||
          (result as any)?.url?.includes("DeviceMismatch")
        ) {
          setError("Perangkat tidak dikenali! Akun Anda sudah terikat di perangkat lain. Hubungi HRD/Admin untuk reset perangkat.")
        } else {
          setError("NIK, username, atau kata sandi salah.")
        }
      } else {
        toast.success("Berhasil masuk ke SIMPEG")
        router.push(callbackUrl)
        router.refresh()
      }
    } catch {
      setError("Terjadi kesalahan jaringan. Silakan coba lagi.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleLogin} className="space-y-4" id="login-form">
      {/* Field: Username / NIK */}
      <div className="space-y-1.5">
        <div className="relative group">
          <input
            id="login-username"
            type="text"
            placeholder="Masukkan NIK atau Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoComplete="username"
            className="w-full px-4 py-3 rounded-xl bg-[#14161E]/90 border border-white/[0.08] text-white text-xs sm:text-sm placeholder:text-zinc-500 outline-none transition-all duration-200 focus:border-white/30 focus:ring-1 focus:ring-white/20 shadow-inner"
          />
          {/* Subtle top reflection accent on input */}
          <div className="absolute inset-x-3 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
        </div>
      </div>

      {/* Field: Kata Sandi */}
      <div className="space-y-1.5">
        <div className="relative group">
          <input
            id="login-password"
            type={showPassword ? "text" : "password"}
            placeholder="Masukkan kata sandi"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            className="w-full pl-4 pr-11 py-3 rounded-xl bg-[#14161E]/90 border border-white/[0.08] text-white text-xs sm:text-sm placeholder:text-zinc-500 outline-none transition-all duration-200 focus:border-white/30 focus:ring-1 focus:ring-white/20 shadow-inner"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors p-1"
            aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
          {/* Subtle top reflection accent on input */}
          <div className="absolute inset-x-3 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
        </div>
      </div>

      {/* Ingat saya selama 30 hari */}
      <div className="flex items-center pt-0.5 pb-1">
        <label className="flex items-center gap-2.5 cursor-pointer select-none group">
          <input
            id="login-remember"
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="w-4 h-4 rounded border-white/20 bg-[#14161E] text-white accent-white focus:ring-0 focus:ring-offset-0 cursor-pointer"
          />
          <span className="text-xs text-zinc-400 group-hover:text-zinc-300 transition-colors">
            Ingat saya selama 30 hari
          </span>
        </label>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs text-center leading-relaxed animate-in fade-in duration-200">
          {error}
        </div>
      )}

      {/* Solid White Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        id="login-submit"
        className="w-full py-3 px-4 rounded-xl bg-white text-zinc-950 hover:bg-zinc-100 font-semibold text-xs sm:text-sm transition-all duration-200 active:scale-[0.99] shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <>
            <Loader2 size={16} className="animate-spin text-zinc-900" />
            <span>Memproses...</span>
          </>
        ) : (
          <span>Masuk</span>
        )}
      </button>
    </form>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[#07070A] text-white relative overflow-hidden">
      
      {/* ── Atmospheric Planetary Horizon Glow (The signature curved light line across viewport) ── */}
      <div 
        className="absolute w-[140%] -left-[20%] top-[48%] h-[380px] pointer-events-none"
        style={{
          borderRadius: "50% 50% 0 0 / 100% 100% 0 0",
          background: "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(139, 92, 246, 0.2) 0%, rgba(99, 102, 241, 0.08) 35%, transparent 70%)",
          boxShadow: "0 -2px 36px 1px rgba(168, 85, 247, 0.3)",
          borderTop: "1px solid rgba(192, 132, 252, 0.25)"
        }}
      />

      {/* Ambient Dark Vignette & Background Radial Depth */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(20,20,35,0.4)_0%,rgba(7,7,10,0.98)_75%)] pointer-events-none" />

      {/* Subtle background star dust / particles */}
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:36px_36px] opacity-[0.03] pointer-events-none" />

      {/* ── Glassmorphism Card (Centered) ── */}
      <div className="relative z-10 w-full max-w-[400px] sm:max-w-[420px] mx-auto p-7 sm:p-9 rounded-[28px] bg-[#0F1118]/85 border border-white/[0.08] border-t-white/[0.18] backdrop-blur-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.95),0_0_50px_rgba(139,92,246,0.06)]">
        
        {/* Logo PDAM (slip.png) dengan Efek Glow */}
        <div className="relative flex items-center justify-center mb-5">
          {/* Ambient pulsating glow halo */}
          <div className="absolute w-32 h-32 bg-gradient-to-tr from-blue-500/50 via-indigo-400/40 to-teal-400/35 rounded-full blur-2xl animate-pulse pointer-events-none" />

          {/* Glowing Logo Card Badge */}
          <div className="relative z-10 px-4 py-2 rounded-2xl bg-white/95 backdrop-blur-md border border-white/40 shadow-[0_0_28px_rgba(59,130,246,0.55),0_8px_20px_rgba(0,0,0,0.3)] hover:shadow-[0_0_38px_rgba(59,130,246,0.75)] transition-all duration-300 hover:scale-105">
            <Image
              src="/slip.png"
              alt="PERUMDAM Tirta Ardhia Rinjani"
              width={70}
              height={98}
              className="h-16 w-auto object-contain drop-shadow-sm"
              priority
            />
          </div>
        </div>

        {/* Heading (Bahasa Indonesia) */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Selamat Datang
          </h1>
          <p className="text-xs text-zinc-400 font-normal mt-1">
            Silakan masukkan kredensial akun Anda.
          </p>
        </div>

        {/* Form */}
        <Suspense
          fallback={
            <div className="py-12 flex justify-center items-center">
              <Loader2 className="animate-spin text-zinc-400" size={24} />
            </div>
          }
        >
          <LoginForm />
        </Suspense>

        {/* Discreet Footer Note */}
        <div className="mt-6 pt-4 border-t border-white/[0.06] text-center">
          <p className="text-[11px] text-zinc-500">
            SIMPEG &bull; PERUMDAM Tirta Ardhia Rinjani
          </p>
        </div>

      </div>
    </div>
  )
}
