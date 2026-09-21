import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Normalizes variations like "Gol A/I", "A/1", "A1", "B2", "C-3", "Golongan B/1" -> "A/I", "B/II", etc.
export function normalizeGolonganKey(gol: string | null | undefined): string {
  if (!gol) return ""
  let clean = gol.toUpperCase().trim()
  // Strip "Gol", "Golongan" prefix
  clean = clean.replace(/^GOL(ONGAN)?[\s\.\-]*/i, "")
  // Handle format without slash: "A1" → "A/1", "B2" → "B/2", "C3" → "C/3"
  clean = clean.replace(/^([A-E])[\s\-]?(\d)$/, "$1/$2")
  // Convert arabic numerals to roman: /1→/I, /2→/II, /3→/III, /4→/IV
  clean = clean.replace(/\/1$/, "/I").replace(/\/2$/, "/II").replace(/\/3$/, "/III").replace(/\/4$/, "/IV")
  return clean.trim()
}
