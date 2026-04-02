"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Wallet, Fingerprint, CalendarDays, User } from "lucide-react"
import { cn } from "@/lib/utils"

const tabs = [
  { href: "/m/dashboard", label: "Beranda", icon: Home },
  { href: "/m/slip-gaji", label: "Slip Gaji", icon: Wallet },
  { href: "/m/fingerprint", label: "Absen", icon: Fingerprint, isFab: true },
  { href: "/m/cuti", label: "Cuti & Izin", icon: CalendarDays },
  { href: "/m/profil", label: "Profil", icon: User },
]

const BLUE_ACTIVE = "#1d4ed8"
const BLUE_ACTIVE_BG = "#eff6ff"

export function MobileBottomNav() {
  const pathname = usePathname()

  if (pathname === "/m/selfie" || pathname === "/m/fingerprint") return null

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 pb-safe"
      style={{
        background: "rgba(255,255,255,0.97)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderTop: "1px solid #e2eaf4",
        boxShadow: "0 -4px 24px rgba(30,58,95,0.08)",
        borderRadius: "22px 22px 0 0",
      }}
    >
      <div className="relative flex h-16 items-center justify-around px-2">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href || pathname.startsWith(tab.href + "/")

          if (tab.isFab) {
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className="relative flex flex-col items-center justify-center w-16"
              >
                <div
                  className="absolute -top-7 h-[58px] w-[58px] flex items-center justify-center rounded-full border-4 border-white active:scale-95 transition-all duration-200"
                  style={{
                    background: "linear-gradient(135deg, #1e3a5f 0%, #1d4ed8 100%)",
                    boxShadow: "0 6px 20px rgba(30,58,95,0.45)",
                  }}
                >
                  <tab.icon className="h-6 w-6 text-white" strokeWidth={2} />
                </div>
                <span className="text-[9px] font-black text-blue-700 mt-8 pt-1 tracking-wide uppercase">
                  {tab.label}
                </span>
              </Link>
            )
          }

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex w-14 flex-col items-center justify-center py-2 gap-1 transition-all"
            >
              <div
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-2xl transition-all duration-200",
                )}
                style={isActive ? { background: BLUE_ACTIVE_BG } : {}}
              >
                <tab.icon
                  className="h-5 w-5 transition-all"
                  style={{
                    color: isActive ? BLUE_ACTIVE : "#94a3b8",
                    strokeWidth: isActive ? 2.5 : 2,
                  }}
                />
              </div>
              <span
                className="text-[9px] font-bold leading-none tracking-wide"
                style={{ color: isActive ? BLUE_ACTIVE : "#94a3b8" }}
              >
                {tab.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
