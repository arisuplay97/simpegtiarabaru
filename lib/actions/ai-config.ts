"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { encryptApiKey, decryptApiKey, maskApiKey } from "@/lib/security/encryption"

export interface AiConfigData {
  id: string
  enabled: boolean
  provider: string // "openai" | "google" | "deepseek" | "custom"
  model: string
  baseUrl?: string | null
  temperature: number
  maxTokens: number
  systemPrompt?: string | null
  hasApiKey: boolean
  apiKeyMasked: string
}

/**
 * Mengambil konfigurasi AI Assistant aktif dengan API Key yang disamarkan (masked)
 */
export async function getAiConfig(): Promise<{ data?: AiConfigData; error?: string }> {
  try {
    const session = await auth()
    const role = (session?.user as any)?.role?.toString().toUpperCase()
    if (!role || !["SUPERADMIN", "HRD"].includes(role)) {
      return { error: "Akses ditolak. Hanya Administrator & HRD yang dapat mengakses pengaturan ini." }
    }

    let config = await (prisma as any).aiConfig.findUnique({
      where: { id: "default" }
    })

    if (!config) {
      config = await (prisma as any).aiConfig.create({
        data: {
          id: "default",
          enabled: true,
          provider: "openai",
          model: "gpt-4o-mini",
          baseUrl: "https://api.openai.com/v1",
          temperature: 0.7,
          maxTokens: 2048,
          systemPrompt: "Anda adalah Tiara Assistant, AI copilot resmi untuk SIMPEG PDAM Tirta Ardhia Rinjani. Jawab pertanyaan dengan sopan, akurat, profesional, dan berbasis data.",
        }
      })
    }

    let apiKeyMasked = ""
    if (config.apiKeyEncrypted) {
      try {
        const decrypted = decryptApiKey(config.apiKeyEncrypted)
        apiKeyMasked = maskApiKey(decrypted)
      } catch {
        apiKeyMasked = "••••••••••••••••"
      }
    }

    return {
      data: {
        id: config.id,
        enabled: config.enabled,
        provider: config.provider,
        model: config.model,
        baseUrl: config.baseUrl,
        temperature: config.temperature,
        maxTokens: config.maxTokens,
        systemPrompt: config.systemPrompt,
        hasApiKey: Boolean(config.apiKeyEncrypted),
        apiKeyMasked,
      }
    }
  } catch (error: any) {
    console.error("getAiConfig error:", error)
    return { error: error.message || "Gagal memuat konfigurasi AI" }
  }
}

/**
 * Menyimpan konfigurasi AI Assistant dengan enkripsi AES-256-GCM pada API Key
 */
export async function saveAiConfig(payload: {
  enabled: boolean
  provider: string
  model: string
  baseUrl?: string | null
  apiKey?: string | null
  temperature?: number
  maxTokens?: number
  systemPrompt?: string | null
}): Promise<{ success?: boolean; error?: string }> {
  try {
    const session = await auth()
    const role = (session?.user as any)?.role?.toString().toUpperCase()
    if (!role || !["SUPERADMIN", "HRD"].includes(role)) {
      return { error: "Akses ditolak. Hanya Administrator & HRD yang dapat mengubah konfigurasi ini." }
    }

    const existing = await (prisma as any).aiConfig.findUnique({
      where: { id: "default" }
    })

    let newEncryptedKey = existing?.apiKeyEncrypted || null

    // Hanya enkripsi jika admin memasukkan key baru (bukan string kosong dan bukan masked bullet)
    if (payload.apiKey && payload.apiKey.trim() !== "" && !payload.apiKey.includes("••••")) {
      newEncryptedKey = encryptApiKey(payload.apiKey.trim())
    }

    await (prisma as any).aiConfig.upsert({
      where: { id: "default" },
      update: {
        enabled: payload.enabled,
        provider: payload.provider,
        model: payload.model.trim(),
        baseUrl: payload.baseUrl ? payload.baseUrl.trim() : null,
        apiKeyEncrypted: newEncryptedKey,
        temperature: payload.temperature ?? 0.7,
        maxTokens: payload.maxTokens ?? 2048,
        systemPrompt: payload.systemPrompt ? payload.systemPrompt.trim() : null,
      },
      create: {
        id: "default",
        enabled: payload.enabled,
        provider: payload.provider,
        model: payload.model.trim(),
        baseUrl: payload.baseUrl ? payload.baseUrl.trim() : null,
        apiKeyEncrypted: newEncryptedKey,
        temperature: payload.temperature ?? 0.7,
        maxTokens: payload.maxTokens ?? 2048,
        systemPrompt: payload.systemPrompt ? payload.systemPrompt.trim() : null,
      }
    })

    revalidatePath("/settings/ai")
    revalidatePath("/assistant")

    return { success: true }
  } catch (error: any) {
    console.error("saveAiConfig error:", error)
    return { error: error.message || "Gagal menyimpan konfigurasi AI" }
  }
}

/**
 * Uji koneksi API Key dan model secara realtime
 */
export async function testAiConnection(params: {
  provider: string
  model: string
  baseUrl?: string | null
  apiKey?: string | null
}): Promise<{ success: boolean; message: string; latencyMs?: number }> {
  try {
    const session = await auth()
    if (!session?.user) return { success: false, message: "Akses ditolak. Belum terautentikasi." }

    let apiKey = params.apiKey?.trim() || ""

    // Jika key kosong atau bertopeng, gunakan key yang tersimpan di database
    if (!apiKey || apiKey.includes("••••")) {
      const existing = await (prisma as any).aiConfig.findUnique({ where: { id: "default" } })
      if (existing?.apiKeyEncrypted) {
        apiKey = decryptApiKey(existing.apiKeyEncrypted)
      }
    }

    if (!apiKey) {
      return { success: false, message: "API Key belum diisi. Silakan masukkan API Key terlebih dahulu." }
    }

    const startTime = Date.now()

    if (params.provider === "google") {
      // Google Gemini API Test
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(params.model)}:generateContent?key=${apiKey}`
      const res = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: "Halo, tes koneksi SIMPEG PDAM." }] }],
          generationConfig: { maxOutputTokens: 10 }
        })
      })

      const latencyMs = Date.now() - startTime
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        return {
          success: false,
          message: `Gagal terhubung ke Gemini (${res.status}): ${errJson?.error?.message || res.statusText}`,
          latencyMs
        }
      }

      return {
        success: true,
        message: `Koneksi berhasil ke Google Gemini (${params.model})! Latensi: ${latencyMs}ms`,
        latencyMs
      }
    } else {
      // OpenAI / DeepSeek / Custom OpenAI-compatible endpoint
      let endpoint = (params.baseUrl || "https://api.openai.com/v1").replace(/\/+$/, "")
      if (!endpoint.endsWith("/chat/completions")) {
        endpoint = `${endpoint}/chat/completions`
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: params.model,
          messages: [{ role: "user", content: "Ping" }],
          max_tokens: 5
        })
      })

      const latencyMs = Date.now() - startTime
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        return {
          success: false,
          message: `Gagal terhubung (${res.status}): ${errJson?.error?.message || res.statusText}`,
          latencyMs
        }
      }

      return {
        success: true,
        message: `Koneksi berhasil ke model ${params.model}! Latensi: ${latencyMs}ms`,
        latencyMs
      }
    }
  } catch (error: any) {
    return {
      success: false,
      message: `Kesalahan jaringan: ${error.message || "Tidak dapat menghubungi endpoint API"}`
    }
  }
}
