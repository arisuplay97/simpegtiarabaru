'use client'

import { signIn } from "next-auth/react"
import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { Eye, EyeOff, Loader2, Users, CalendarCheck, CalendarOff, TrendingUp, Network, GraduationCap } from "lucide-react"
import Image from "next/image"
import "@/styles/login.css"

/* ──────────────────────────────────────────────
   Dashboard Preview Cards — Branding Panel
   ────────────────────────────────────────────── */

const dashboardCards = [
  {
    label: "Total Pegawai",
    value: "248",
    change: "+12 bulan ini",
    icon: Users,
    iconClass: "employees",
    bars: [40, 55, 70, 50, 85, 65, 90],
  },
  {
    label: "Kehadiran",
    value: "96.4%",
    change: "↑ 2.1% dari bulan lalu",
    icon: CalendarCheck,
    iconClass: "attendance",
    bars: [80, 70, 85, 90, 75, 95, 88],
  },
  {
    label: "Pengajuan Cuti",
    value: "14",
    change: "3 menunggu persetujuan",
    icon: CalendarOff,
    iconClass: "leave",
    bars: [30, 45, 20, 60, 35, 25, 50],
  },
  {
    label: "Kinerja",
    value: "87.2",
    change: "Rata-rata skor",
    icon: TrendingUp,
    iconClass: "performance",
    bars: [75, 80, 65, 90, 85, 70, 88],
  },
  {
    label: "Struktur Organisasi",
    value: "12",
    change: "Unit kerja aktif",
    icon: Network,
    iconClass: "organization",
    bars: [60, 45, 70, 55, 80, 50, 65],
  },
  {
    label: "Progress Pelatihan",
    value: "78%",
    change: "Target tercapai",
    icon: GraduationCap,
    iconClass: "training",
    bars: [50, 60, 45, 75, 80, 55, 70],
  },
]

function DashboardCard({ card }: { card: typeof dashboardCards[number] }) {
  const Icon = card.icon
  return (
    <div className="login-dashboard-card">
      <div className={`login-dashboard-card-icon ${card.iconClass}`}>
        <Icon size={15} />
      </div>
      <div className="login-dashboard-card-label">{card.label}</div>
      <div className="login-dashboard-card-value">{card.value}</div>
      <div className="login-dashboard-card-change">{card.change}</div>
      <div className="login-mini-bars">
        {card.bars.map((h, i) => (
          <div
            key={i}
            className={`login-mini-bar ${i >= card.bars.length - 3 ? "active" : ""}`}
            style={{ height: `${(h / 100) * 24}px` }}
          />
        ))}
      </div>
    </div>
  )
}

/* ──────────────────────────────────────────────
   Login Form (wrapped in Suspense for searchParams)
   ────────────────────────────────────────────── */

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
      {/* Username / NIK */}
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

      {/* Password */}
      <div className="login-field-group">
        <label htmlFor="login-password" className="login-field-label">
          Password
        </label>
        <div className="login-field-wrapper">
          <input
            id="login-password"
            type={showPassword ? "text" : "password"}
            placeholder="Masukkan password"
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
            aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      {/* Remember Me & Forgot Password */}
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
          Lupa Password?
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="login-error" role="alert">
          {error}
        </div>
      )}

      {/* Sign In Button */}
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
          "Sign In"
        )}
      </button>
    </form>
  )
}

/* ──────────────────────────────────────────────
   Main Login Page
   ────────────────────────────────────────────── */

export default function LoginPage() {
  return (
    <div className="login-page">
      {/* ── Left: Branding Panel ── */}
      <div className="login-branding">
        <div className="login-branding-content">
          <Image
            src="/putih.png"
            alt="PERUMDAM Tirta Ardhia Rinjani"
            width={56}
            height={56}
            className="login-branding-logo"
            priority
          />
          <h1 className="login-branding-title">SIMPEG</h1>
          <p className="login-branding-subtitle">
            Sistem Informasi Manajemen Kepegawaian
          </p>
          <p className="login-branding-desc">
            Manage employee data, attendance, leave, performance evaluation,
            promotions, and organizational information through one integrated
            platform.
          </p>

          {/* Dashboard Preview Grid */}
          <div className="login-dashboard-grid">
            {dashboardCards.map((card) => (
              <DashboardCard key={card.label} card={card} />
            ))}
          </div>
        </div>
      </div>

      {/* ── Right: Login Form Panel ── */}
      <div className="login-form-panel">
        <div className="login-form-container">
          {/* Logo */}
          <div className="login-form-logo">
            <Image
              src="/login2.png"
              alt="PERUMDAM Tirta Ardhia Rinjani"
              width={160}
              height={44}
              style={{ height: '44px', width: 'auto', objectFit: 'contain' }}
              priority
            />
          </div>

          {/* Heading */}
          <h2 className="login-form-heading">Welcome Back</h2>
          <p className="login-form-subheading">
            Silakan masuk menggunakan NIK/Username dan Password Anda.
          </p>

          {/* Form */}
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

          {/* Footer */}
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
