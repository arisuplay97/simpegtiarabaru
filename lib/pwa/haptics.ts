/**
 * Haptic Feedback Utility untuk PWA Mobile
 * Mendukung getaran taktil pada Android dan peramban yang mendukung navigator.vibrate
 */

type HapticType = "light" | "medium" | "heavy" | "success" | "warning" | "error"

const HAPTIC_PATTERNS: Record<HapticType, number | number[]> = {
  light: 15,
  medium: 35,
  heavy: 60,
  success: [25, 40, 45],
  warning: [50, 40, 50],
  error: [60, 50, 60, 50, 80],
}

export function triggerHaptic(type: HapticType = "light") {
  if (typeof window === "undefined") return

  try {
    if ("vibrate" in navigator && typeof navigator.vibrate === "function") {
      const pattern = HAPTIC_PATTERNS[type] || 25
      navigator.vibrate(pattern)
    }
  } catch {
    // Fail silently jika browser/OS memblokir izin getar
  }
}
