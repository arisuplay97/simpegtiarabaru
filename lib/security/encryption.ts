import crypto from "crypto"

/**
 * Mendapatkan kunci enkripsi 256-bit yang diturunkan dari secret server
 */
function getEncryptionKey(): Buffer {
  const secret = process.env.AUTH_SECRET || process.env.ENCRYPTION_SECRET || "pdam-tirta-ardhia-rinjani-simpeg-ai-security-key-2026"
  return crypto.createHash("sha256").update(secret).digest()
}

/**
 * Enkripsi teks menggunakan standar industri AES-256-GCM (AEAD)
 * Format output: ivHex:authTagHex:encryptedHex
 */
export function encryptApiKey(plainText: string): string {
  if (!plainText || plainText.trim() === "") return ""
  
  const key = getEncryptionKey()
  const iv = crypto.randomBytes(12) // 96-bit IV standar untuk GCM
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv)

  const encrypted = Buffer.concat([
    cipher.update(plainText.trim(), "utf8"),
    cipher.final()
  ])

  const authTag = cipher.getAuthTag()

  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`
}

/**
 * Dekripsi teks terenkripsi AES-256-GCM
 */
export function decryptApiKey(encryptedPayload: string): string {
  if (!encryptedPayload || encryptedPayload.trim() === "") return ""

  const parts = encryptedPayload.split(":")
  if (parts.length !== 3) {
    throw new Error("Format payload terenkripsi tidak valid")
  }

  const [ivHex, authTagHex, encryptedHex] = parts
  const key = getEncryptionKey()
  const iv = Buffer.from(ivHex, "hex")
  const authTag = Buffer.from(authTagHex, "hex")
  const encrypted = Buffer.from(encryptedHex, "hex")

  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv)
  decipher.setAuthTag(authTag)

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final()
  ])

  return decrypted.toString("utf8")
}

/**
 * Masking API key untuk keamanan antarmuka klien
 * Contoh: sk-proj-1234567890abcdef -> sk-p••••••••••••••••cdef
 */
export function maskApiKey(apiKey: string): string {
  if (!apiKey || apiKey.trim() === "") return ""
  const clean = apiKey.trim()
  if (clean.length <= 8) {
    return "••••••••"
  }
  const prefix = clean.slice(0, 4)
  const suffix = clean.slice(-4)
  return `${prefix}${"•".repeat(16)}${suffix}`
}
