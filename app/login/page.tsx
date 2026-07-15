'use client'

import { signIn } from "next-auth/react"
import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import Image from "next/image"
import "@/styles/login.css"

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") || "/"

  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
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
      if (
        result.error.includes("Perangkat tidak dikenali") ||
        result.error === "DeviceMismatch"
      ) {
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
    <form onSubmit={handleLogin} className="login-form" id="login-form">
      <div className="login-field-group">
        <label htmlFor="login-username" className="login-field-label">
          Username / NIK
        </label>
        <div className="login-field-wrapper">
          <input
            id="login-username"
            type="text"
            placeholder="Masukkan NIK atau username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoComplete="username"
            className="login-field-input"
          />
        </div>
      </div>

      <div className="login-field-group">
        <label htmlFor="login-password" className="login-field-label">
          Kata Sandi
        </label>
        <div className="login-field-wrapper">
          <input
            id="login-password"
            type={showPassword ? "text" : "password"}
            placeholder="Masukkan kata sandi"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            className="login-field-input login-hide-toggle has-icon-right"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="login-password-toggle"
            aria-label={showPassword ? "Sembunyikan" : "Tampilkan"}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      <div className="login-options-row">
        <label className="login-remember" htmlFor="login-remember">
          <input
            id="login-remember"
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="login-remember-checkbox"
          />
          <span className="login-remember-text">Ingat saya</span>
        </label>
        <button type="button" className="login-forgot-link">
          Lupa kata sandi?
        </button>
      </div>

      {error && (
        <div className="login-error" role="alert">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="login-submit-btn"
        id="login-submit"
      >
        {isLoading ? (
          <>
            <Loader2 size={16} className="login-spinner" />
            Memproses...
          </>
        ) : (
          "Masuk"
        )}
      </button>
    </form>
  )
}

export default function LoginPage() {
  return (
    <div className="login-page">
      <div className="login-card">
        {/* ── Left: Logo + Illustration ── */}
        <div className="login-left">
          <div className="login-left-logo">
            <Image
              src="/login2.png"
              alt="PERUMDAM Tirta Ardhia Rinjani"
              width={200}
              height={52}
              className="login-left-logo-img"
              priority
            />
          </div>
          <div className="login-left-illustration">
            <Image
              src="/login.png"
              alt="Ilustrasi"
              width={400}
              height={400}
              className="login-left-illustration-img"
              priority
            />
          </div>
        </div>

        {/* ── Right: Form ── */}
        <div className="login-right">
          <h2 className="login-heading">Selamat Datang di SIMPEG.</h2>
          <p className="login-subheading">
            Masuk untuk mengelola data kepegawaian Anda.
          </p>

          <Suspense
            fallback={
              <div style={{ textAlign: "center", padding: "32px 0" }}>
                <Loader2
                  size={24}
                  className="login-spinner"
                  style={{ color: "#94A3B8", margin: "0 auto" }}
                />
              </div>
            }
          >
            <LoginForm />
          </Suspense>

          <p className="login-footer">
            © {new Date().getFullYear()} PERUMDAM Tirta Ardhia Rinjani
            <br />
            Kab. Lombok Tengah
          </p>
        </div>
      </div>
    </div>
  )
}
