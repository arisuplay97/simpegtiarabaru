/**
 * Anti-Fake GPS & Mock Location Detection Helper for ASIK PWA Mobile
 * Mendeteksi aplikasi lokasi tiruan / Fake GPS di perangkat mobile.
 */

import { hitungJarak } from "@/lib/data/lokasi-store"

const LAST_POS_KEY = "asik_last_gps_fix"

export interface FakeGpsDetectionResult {
  isFake: boolean
  reason: string
}

export function detectFakeGps(pos: GeolocationPosition): FakeGpsDetectionResult {
  const coords = pos.coords
  const lat = coords.latitude
  const lng = coords.longitude
  const accuracy = coords.accuracy
  const now = Date.now()

  // 1. Deteksi flag native mock location provider (didukung oleh sebagian besar browser Android)
  if ((coords as any).mocked === true || (coords as any).isMock === true) {
    return {
      isFake: true,
      reason: "Perangkat mengaktifkan fitur 'Mock Location' (Lokasi Tiruan) atau aplikasi Fake GPS aktif."
    }
  }

  // 2. Deteksi akurasi yang tidak wajar (Aplikasi Fake GPS sering meng-injeksi akurasi 0m, 1m, atau 2m bulat)
  if (accuracy <= 0 || (accuracy > 0 && accuracy < 3.2)) {
    return {
      isFake: true,
      reason: `Tingkat akurasi tidak wajar (±${accuracy}m). GPS satelit alami memiliki variasi jitter minimal 4m–30m.`
    }
  }

  // 3. Deteksi koordinat bulat sempurna (sering dihasilkan oleh generator lokasi palsu)
  if (lat === Math.round(lat) && lng === Math.round(lng)) {
    return {
      isFake: true,
      reason: "Koordinat latitude & longitude bulat sempurna tanpa desimal riil satelit."
    }
  }

  // 4. Deteksi lonjakan kecepatan / Teleportasi instan
  if (typeof window !== "undefined" && typeof sessionStorage !== "undefined") {
    try {
      const lastRaw = sessionStorage.getItem(LAST_POS_KEY)
      if (lastRaw) {
        const last = JSON.parse(lastRaw)
        const timeDiffSeconds = (now - last.time) / 1000

        // Jika fix sebelumnya terjadi kurang dari 15 detik yang lalu
        if (timeDiffSeconds > 0 && timeDiffSeconds < 15) {
          const distanceMeters = hitungJarak(last.lat, last.lng, lat, lng)
          const speedKmh = (distanceMeters / timeDiffSeconds) * 3.6

          // Jika kecepatan berpindah melebihi 350 km/jam (mustahil untuk pegawai darat)
          if (speedKmh > 350 && distanceMeters > 500) {
            return {
              isFake: true,
              reason: `Lonjakan perpindahan posisi tidak wajar (${Math.round(distanceMeters)}m dalam ${timeDiffSeconds.toFixed(1)}s, ${Math.round(speedKmh)} km/jam). Terindikasi teleportasi Fake GPS.`
            }
          }
        }
      }

      // Simpan pembacaan sekarang untuk evaluasi berikutnya
      sessionStorage.setItem(LAST_POS_KEY, JSON.stringify({ lat, lng, time: now }))
    } catch {}
  }

  return { isFake: false, reason: "" }
}
