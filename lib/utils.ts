import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Normalizes variations like "Gol A/I", "A/1", "Golongan B/1" -> "A/I", "B/I", etc.
export function normalizeGolonganKey(gol: string | null | undefined): string {
  if (!gol) return ""
  let clean = gol.toUpperCase().trim()
  clean = clean.replace(/^GOL(ONGAN)?[\s\.\-]*/i, "")
  clean = clean.replace(/\/1$/, "/I").replace(/\/2$/, "/II").replace(/\/3$/, "/III").replace(/\/4$/, "/IV")
  return clean.trim()
}
