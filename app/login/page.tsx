'use client'
import { signIn } from "next-auth/react"
import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import Image from "next/image"

function LoginForm() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [deviceId, setDeviceId] = useState("")

  useEffect(() => {
    let storedId = localStorage.getItem("deviceId")
    if (!storedId) {
      storedId = crypto.randomUUID()
      localStorage.setItem("deviceId", storedId)
    }
    setDeviceId(storedId)
  }, [])

  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") || "/"

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)
    const result = await signIn("credentials", {
      username: username.toLowerCase().trim(),
      password,
      deviceId,
      redirect: false,
    })
    if (result?.error) {
      if (result.error.includes("Perangkat tidak dikenali") || result.error === "DeviceMismatch") {
        setError("Akun Anda sudah login di perangkat lain. Hubungi HRD.")
      } else {
        setError("NIP atau password salah")
      }
    } else {
      toast.success("Berhasil masuk")
      router.push(callbackUrl)
      router.refresh()
    }
    setIsLoading(false)
  }

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      {/* NIP */}
      <div>
        <input
          type="text"
          placeholder="NIP"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          autoComplete="username"
          style={{
            width: '100%',
            padding: '14px 16px',
            border: '1.5px solid #d1d5db',
            borderRadius: '8px',
            fontSize: '14px',
            color: '#374151',
            outline: 'none',
            background: '#fff',
            boxSizing: 'border-box' as const,
          }}
          onFocus={e => (e.target.style.borderColor = '#3b82f6')}
          onBlur={e => (e.target.style.borderColor = '#d1d5db')}
        />
      </div>

      {/* Password */}
      <div style={{ position: 'relative' }}>
        <input
          type={showPassword ? "text" : "password"}
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          style={{
            width: '100%',
            padding: '14px 44px 14px 16px',
            border: '1.5px solid #d1d5db',
            borderRadius: '8px',
            fontSize: '14px',
            color: '#374151',
            outline: 'none',
            background: '#fff',
            boxSizing: 'border-box' as const,
          }}
          onFocus={e => (e.target.style.borderColor = '#3b82f6')}
          onBlur={e => (e.target.style.borderColor = '#d1d5db')}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          style={{
            position: 'absolute',
            right: '14px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#9ca3af',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          background: '#fee2e2',
          border: '1px solid #fca5a5',
          borderRadius: '8px',
          padding: '10px 14px',
          fontSize: '13px',
          color: '#dc2626',
        }}>
          {error}
        </div>
      )}

      {/* LOGIN Button */}
      <button
        type="submit"
        disabled={isLoading}
        style={{
          width: '100%',
          padding: '15px',
          borderRadius: '50px',
          border: 'none',
          background: 'linear-gradient(to right, #84cc16, #22c55e, #14b8a6, #0ea5e9)',
          color: '#fff',
          fontWeight: '700',
          fontSize: '14px',
          letterSpacing: '2px',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          opacity: isLoading ? 0.7 : 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          marginTop: '8px',
          boxShadow: '0 4px 15px rgba(14, 165, 233, 0.4)',
          transition: 'opacity 0.2s, transform 0.1s',
        }}
        onMouseOver={e => { if (!isLoading) (e.currentTarget.style.opacity = '0.9') }}
        onMouseOut={e => { (e.currentTarget.style.opacity = isLoading ? '0.7' : '1') }}
        onMouseDown={e => { if (!isLoading) (e.currentTarget.style.transform = 'scale(0.98)') }}
        onMouseUp={e => { (e.currentTarget.style.transform = 'scale(1)') }}
      >
        {isLoading ? (
          <><Loader2 size={16} className="animate-spin" />Memuat...</>
        ) : (
          "LOGIN"
        )}
      </button>
    </form>
  )
}

export default function LoginPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        background: 'linear-gradient(135deg, #2196f3 0%, #1976d2 40%, #29b6f6 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative circles for depth */}
      <div style={{
        position: 'absolute',
        top: '-80px',
        left: '-80px',
        width: '320px',
        height: '320px',
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.06)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-120px',
        left: '20%',
        width: '500px',
        height: '500px',
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.04)',
        pointerEvents: 'none',
      }} />

      {/* White card - centered */}
      <div
        style={{
          background: '#fff',
          borderRadius: '16px',
          width: '420px',
          maxWidth: 'calc(100vw - 40px)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '48px 44px 36px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          position: 'relative',
          zIndex: 10,
        }}
      >
        {/* Logo */}
        <div style={{ marginBottom: '24px' }}>
          <Image
            src="/login2.png"
            alt="Tugu Tirta"
            width={200}
            height={70}
            style={{ objectFit: 'contain', maxHeight: '70px', width: 'auto' }}
            priority
          />
        </div>

        {/* Title */}
        <h1 style={{
          fontSize: '22px',
          fontWeight: '700',
          color: '#111827',
          margin: '0 0 6px 0',
          lineHeight: '1.3',
        }}>
          Log In to Your Account
        </h1>

        {/* Subtitle */}
        <p style={{
          fontSize: '13.5px',
          color: '#3b82f6',
          margin: '0 0 28px 0',
          fontWeight: '400',
        }}>
          Silakan masuk menggunakan NIP dan Password.
        </p>

        {/* Form */}
        <Suspense fallback={
          <div style={{ textAlign: 'center', padding: '16px', color: '#9ca3af' }}>
            <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto' }} />
          </div>
        }>
          <LoginForm />
        </Suspense>

        {/* Copyright */}
        <p style={{
          marginTop: '28px',
          textAlign: 'center',
          fontSize: '11px',
          color: '#9ca3af',
          lineHeight: '1.5',
        }}>
          © ASIK PERUMDA Air Minum Tirta Ardhia Rinjani Kab Lombok Tengah
        </p>
      </div>
    </div>
  )
}
