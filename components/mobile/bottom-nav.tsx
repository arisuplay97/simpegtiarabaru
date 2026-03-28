"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, FileText, Fingerprint, CalendarDays, Settings } from "lucide-react"
import { cn } from "@/lib/utils"

const tabs = [
  { href: "/m/dashboard", label: "Home", icon: Home },
  { href: "/m/absensi", label: "Histori", icon: FileText },
  { href: "/m/selfie", label: "Pindai", icon: Fingerprint, isFab: true },
  { href: "/m/cuti", label: "Ajuan Izin", icon: CalendarDays },
  { href: "/m/profil", label: "Setting", icon: Settings },
]

export function MobileBottomNav() {
  const pathname = usePathname()
  
  // Sembunyikan navbar jika sedang di /m/selfie (karena itu layar kamera penuh)
  if (pathname === "/m/selfie") return null

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 pb-safe rounded-t-3xl shadow-[0_-4px_24px_rgba(0,0,0,0.08)]">
      <div className="relative flex h-16 items-center justify-around px-2">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href || pathname.startsWith(tab.href + "/")

          if (tab.isFab) {
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className="group relative flex flex-col items-center justify-center w-14"
              >
                <div className="absolute -top-12 flex h-16 w-16 items-center justify-center rounded-full bg-[#18553f] border-[4px] border-white dark:border-neutral-900 shadow-lg shadow-[#18553f]/40 transition-transform active:scale-95">
                  <tab.icon className="h-8 w-8 text-white stroke-[2px]" />
                </div>
                <span className="text-[10px] font-medium text-neutral-500 dark:text-neutral-400 mt-6 pt-1 group-hover:text-[#18553f] transition-colors">{tab.label}</span>
              </Link>
            )
          }

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex w-14 flex-col items-center justify-center py-2 transition-colors",
                isActive ? "text-[#18553f] dark:text-[#2ebd7c]" : "text-neutral-400 dark:text-neutral-500"
              )}
            >
              <tab.icon className={cn("h-6 w-6 mb-1", isActive ? "stroke-[2.5px]" : "stroke-[2px]")} />
              <span className="text-[10px] font-medium leading-none">
                {tab.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
