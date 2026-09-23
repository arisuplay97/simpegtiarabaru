"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export function MobileRedirectWatcher() {
  const router = useRouter()

  useEffect(() => {
    if (typeof window === "undefined") return

    const pathname = window.location.pathname
    // Do not run on mobile routes, API, or login
    if (pathname.startsWith("/m") || pathname.startsWith("/api") || pathname === "/login") return

    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true ||
      window.location.search.includes("mode=pwa") ||
      window.location.search.includes("pwa=1")

    // If running inside the installed standalone PWA app, ALWAYS force PWA mobile mode!
    if (isStandalone) {
      window.location.replace("/m/dashboard?mode=pwa")
      return
    }

    // If query explicitly requests desktop view, do not redirect
    const searchParams = new URLSearchParams(window.location.search)
    if (searchParams.get("view") === "desktop") return

    const ua = navigator.userAgent

    // Check if user is physically on a mobile device and in mobile site mode:
    // 1. Android with "Mobile" token
    const isAndroidMobile = /Android/i.test(ua) && /Mobile/i.test(ua)
    // 2. iPhone / iPod
    const isIosMobile = /iPhone|iPod/i.test(ua)
    // 3. Chromium mobile Client Hint (?1)
    const isUaDataMobile = (navigator as any).userAgentData?.mobile === true
    // 4. Narrow screen width (< 768px) on mobile device
    const isNarrowScreen = window.innerWidth < 768

    // If the browser is in mobile mode:
    if (isAndroidMobile || isIosMobile || (isNarrowScreen && isUaDataMobile)) {
      // Clear any stale desktop cookie so the user isn't locked in desktop mode
      document.cookie = "simpeg_view=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT"

      let target = "/m/dashboard"
      if (pathname === "/" || pathname === "/dashboard") target = "/m/dashboard"
      else if (pathname === "/absensi") target = "/m/fingerprint"
      else if (pathname === "/kalender") target = "/m/kalender"
      else if (pathname === "/cuti") target = "/m/cuti"
      else if (pathname === "/lembur") target = "/m/lembur"
      else if (pathname === "/slip-gaji") target = "/m/slip-gaji"
      else if (pathname === "/notifikasi") target = "/m/notifikasi"
      else if (pathname === "/indeks") target = "/m/indeks"
      else if (pathname === "/pegawai/profil") target = "/m/profil"

      window.location.replace(target)
    }
  }, [router])

  return null
}
