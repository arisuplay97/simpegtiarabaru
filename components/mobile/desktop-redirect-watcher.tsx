"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export function DesktopRedirectWatcher() {
  const router = useRouter()

  useEffect(() => {
    if (typeof window === "undefined") return

    // Don't redirect if query contains view=mobile or cookie is set to mobile
    const searchParams = new URLSearchParams(window.location.search)
    if (searchParams.get("view") === "mobile") return

    const cookies = document.cookie || ""
    if (cookies.includes("simpeg_view=mobile")) return

    // If running as an installed standalone PWA app, respect mobile mode
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true
    if (isStandalone) return

    // Check if user is viewing in desktop browser or requested desktop site:
    // 1. Screen / viewport width >= 1024px (mobile browser "Desktop Site" mode expands layout viewport to 980-1280px)
    const isWideViewport = window.innerWidth >= 1024
    // 2. Chromium Client Hints in browser (navigator.userAgentData.mobile is false when "Desktop site" is checked)
    const isUaDataDesktop = (navigator as any).userAgentData?.mobile === false
    // 3. Android UA without "Mobile" token
    const isAndroidDesktop = /Android/i.test(navigator.userAgent) && !/Mobile/i.test(navigator.userAgent)
    // 4. Safari desktop mode (sends Macintosh without iPhone/iPad)
    const isSafariDesktop = /Macintosh/i.test(navigator.userAgent) && !/iPhone|iPad/i.test(navigator.userAgent)

    if (isWideViewport || isUaDataDesktop || isAndroidDesktop || isSafariDesktop) {
      // Set cookie so middleware also remembers desktop view
      document.cookie = "simpeg_view=desktop; path=/; max-age=604800; SameSite=Lax"

      const currentPath = window.location.pathname
      let target = "/dashboard"
      if (currentPath === "/m" || currentPath === "/m/dashboard") target = "/dashboard"
      else if (currentPath === "/m/absensi" || currentPath === "/m/fingerprint" || currentPath === "/m/radar") target = "/absensi"
      else if (currentPath === "/m/kalender") target = "/kalender"
      else if (currentPath === "/m/cuti") target = "/cuti"
      else if (currentPath === "/m/profil") target = "/pegawai/profil"
      else if (currentPath === "/m/lembur") target = "/lembur"
      else if (currentPath === "/m/slip-gaji") target = "/slip-gaji"
      else if (currentPath === "/m/notifikasi") target = "/notifikasi"
      else if (currentPath === "/m/indeks") target = "/indeks"
      else if (currentPath.startsWith("/m/settings/lokasi")) target = "/settings/lokasi"
      else if (currentPath.startsWith("/m/settings")) target = "/settings/sistem"

      window.location.replace(target)
    }
  }, [router])

  return null
}
