"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { SidebarNav } from "@/components/simpeg/sidebar-nav"
import { TopBar } from "@/components/simpeg/top-bar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Bot, ShieldCheck, KeyRound, Sparkles, CheckCircle2, 
  AlertCircle, Loader2, Save, Eye, EyeOff, Radio, 
  Server, Cpu, Zap, Activity
} from "lucide-react"
import { getAiConfig, saveAiConfig, testAiConnection, AiConfigData } from "@/lib/actions/ai-config"

const PROVIDER_PRESETS: Record<string, { label: string; defaultBaseUrl: string; models: string[]; iconName: string }> = {
  openai: {
    label: "OpenAI",
    defaultBaseUrl: "https://api.openai.com/v1",
    models: ["gpt-4o-mini", "gpt-4o", "gpt-3.5-turbo", "o1-mini", "o3-mini"],
    iconName: "openai"
  },
  google: {
    label: "Google Gemini",
    defaultBaseUrl: "https://generativelanguage.googleapis.com",
    models: ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-2.0-flash", "gemini-1.0-pro"],
    iconName: "google"
  },
  deepseek: {
    label: "DeepSeek",
    defaultBaseUrl: "https://api.deepseek.com/v1",
    models: ["deepseek-chat", "deepseek-reasoner"],
    iconName: "deepseek"
  },
  custom: {
    label: "Custom Provider / Local LLM",
    defaultBaseUrl: "http://localhost:11434/v1",
    models: ["llama3.3", "mistral-large", "qwen-2.5-72b", "claude-3-5-sonnet", "custom-model"],
    iconName: "custom"
  }
}

export default function AiSettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [showKey, setShowKey] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; latencyMs?: number } | null>(null)

  const [formData, setFormData] = useState<{
    enabled: boolean
    provider: string
    model: string
    customModel: string
    baseUrl: string
    apiKey: string
    temperature: number
    maxTokens: number
    systemPrompt: string
    hasApiKey: boolean
    apiKeyMasked: string
  }>({
    enabled: true,
    provider: "openai",
    model: "gpt-4o-mini",
    customModel: "",
    baseUrl: "https://api.openai.com/v1",
    apiKey: "",
    temperature: 0.7,
    maxTokens: 2048,
    systemPrompt: "Anda adalah Tiara Assistant, asisten AI resmi untuk SIMPEG PDAM Tirta Ardhia Rinjani. Berikan jawaban berbasis data, sopan, akurat, dan profesional.",
    hasApiKey: false,
    apiKeyMasked: ""
  })

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    } else if (status === "authenticated") {
      const role = (session?.user as any)?.role?.toString().toUpperCase()
      if (role !== "SUPERADMIN" && role !== "HRD") {
        router.push("/dashboard")
        toast.error("Akses ditolak. Menu ini khusus Administrator & HRD.")
      } else {
        router.replace("/assistant?settings=true")
      }
    }
  }, [status, session, router])

  const loadData = async () => {
    setIsLoading(true)
    const res = await getAiConfig()
    if (res.data) {
      const d = res.data
      const isPreset = PROVIDER_PRESETS[d.provider]?.models.includes(d.model)
      setFormData({
        enabled: d.enabled,
        provider: d.provider || "openai",
        model: isPreset ? d.model : "custom",
        customModel: isPreset ? "" : d.model,
        baseUrl: d.baseUrl || PROVIDER_PRESETS[d.provider]?.defaultBaseUrl || "",
        apiKey: "",
        temperature: d.temperature ?? 0.7,
        maxTokens: d.maxTokens ?? 2048,
        systemPrompt: d.systemPrompt || "",
        hasApiKey: d.hasApiKey,
        apiKeyMasked: d.apiKeyMasked
      })
    }
    setIsLoading(false)
  }

  const handleProviderChange = (newProvider: string) => {
    const preset = PROVIDER_PRESETS[newProvider]
    setFormData(prev => ({
      ...prev,
      provider: newProvider,
      baseUrl: preset?.defaultBaseUrl || prev.baseUrl,
      model: preset?.models[0] || "custom",
      customModel: ""
    }))
    setTestResult(null)
  }

  const handleSave = async () => {
    setIsSaving(true)
    setTestResult(null)
    try {
      const actualModel = formData.model === "custom" 
        ? formData.customModel.trim() 
        : formData.model.trim()

      if (!actualModel) {
        toast.error("Nama Model tidak boleh kosong!")
        setIsSaving(false)
        return
      }

      const res = await saveAiConfig({
        enabled: formData.enabled,
        provider: formData.provider,
        model: actualModel,
        baseUrl: formData.baseUrl,
        apiKey: formData.apiKey || null,
        temperature: Number(formData.temperature),
        maxTokens: Number(formData.maxTokens),
        systemPrompt: formData.systemPrompt
      })

      if (res.success) {
        toast.success("Pengaturan AI Assistant berhasil disimpan dengan enkripsi AES-256-GCM!")
        setFormData(prev => ({ ...prev, apiKey: "" })) // Bersihkan input teks plaintext dari state
        await loadData()
      } else {
        toast.error(res.error || "Gagal menyimpan konfigurasi")
      }
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan")
    } finally {
      setIsSaving(false)
    }
  }

  const handleTestConnection = async () => {
    setIsTesting(true)
    setTestResult(null)
    try {
      const actualModel = formData.model === "custom" 
        ? formData.customModel.trim() 
        : formData.model.trim()

      const res = await testAiConnection({
        provider: formData.provider,
        model: actualModel,
        baseUrl: formData.baseUrl,
        apiKey: formData.apiKey || undefined
      })

      setTestResult(res)
      if (res.success) {
        toast.success(res.message)
      } else {
        toast.error(res.message)
      }
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || "Gagal menghubungi server" })
      toast.error("Gagal melakukan pengujian koneksi")
    } finally {
      setIsTesting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-zinc-950">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-xs text-slate-500">Memuat konfigurasi AI...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-slate-50/50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100">
      <SidebarNav />
      <div className="flex flex-1 flex-col sidebar-offset min-w-0">
        <TopBar breadcrumb={["Pengaturan", "AI Assistant & API"]} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto w-full">

          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#111113] p-6 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-2xs">
            <div className="flex items-center gap-3.5">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-xs shrink-0">
                <Bot className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-zinc-50">
                    Pengaturan AI Assistant & API
                  </h1>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                    AES-256-GCM
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                  Kelola integrasi model bahasa (LLM), kunci API terenkripsi, dan endpoint Tiara Assistant
                </p>
              </div>
            </div>

            <Button onClick={handleSave} disabled={isSaving} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-xs">
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              <span>Simpan Perubahan</span>
            </Button>
          </div>

          {/* Security Banner Alert */}
          <div className="rounded-xl border border-blue-200/80 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/20 p-4 flex items-start gap-3.5">
            <ShieldCheck className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed text-blue-950 dark:text-blue-200">
              <p className="font-semibold text-blue-900 dark:text-blue-300">
                Keamanan Terjamin &bull; Enkripsi Simetris Standar Perbankan (AES-256-GCM)
              </p>
              <p className="mt-0.5 text-blue-800/80 dark:text-blue-300/80 text-[11px]">
                Seluruh API Key yang Anda simpan akan dienkripsi secara kriptografis menggunakan algoritma AES-256-GCM dengan Initialization Vector (IV) unik di server database. Kunci rahasia tidak pernah ditampilkan secara utuh di peramban.
              </p>
            </div>
          </div>

          {/* Configuration Card */}
          <div className="grid grid-cols-1 gap-6">
            
            {/* Status Aktivasi */}
            <Card className="rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-[#111113] shadow-2xs">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                      <Zap className="h-4 w-4 text-amber-500" />
                      Status Integrasi AI Eksternal
                    </CardTitle>
                    <CardDescription className="text-xs mt-0.5">
                      Aktifkan untuk menghubungkan Tiara Assistant ke model kecerdasan buatan luar
                    </CardDescription>
                  </div>
                  <Switch 
                    checked={formData.enabled} 
                    onCheckedChange={(checked) => setFormData(p => ({ ...p, enabled: checked }))} 
                  />
                </div>
              </CardHeader>
            </Card>

            {/* Provider & Model Selection */}
            <Card className="rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-[#111113] shadow-2xs">
              <CardHeader className="pb-4 border-b border-slate-100 dark:border-zinc-800">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-blue-600" />
                  Penyedia AI (Provider) & Model
                </CardTitle>
                <CardDescription className="text-xs">
                  Pilih arsitektur provider yang ingin digunakan atau hubungkan ke custom local LLM
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-5 space-y-5">
                {/* Provider Cards */}
                <div>
                  <Label className="text-xs font-semibold mb-2.5 block">Pilih Penyedia Layanan (AI Provider)</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {Object.entries(PROVIDER_PRESETS).map(([key, p]) => {
                      const isSelected = formData.provider === key
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => handleProviderChange(key)}
                          className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between gap-2 ${
                            isSelected
                              ? "border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 text-blue-950 dark:text-blue-100 shadow-2xs ring-1 ring-blue-600/30"
                              : "border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/50 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300"
                          }`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="text-xs font-bold">{p.label}</span>
                            {isSelected && <CheckCircle2 className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />}
                          </div>
                          <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono truncate w-full">
                            {p.models[0]}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Model Selector & Custom Model Input */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div>
                    <Label className="text-xs font-semibold mb-1.5 block">Pilihan Model</Label>
                    <Select
                      value={formData.model}
                      onValueChange={(val) => setFormData(p => ({ ...p, model: val }))}
                    >
                      <SelectTrigger className="w-full text-xs rounded-xl bg-slate-50/70 dark:bg-zinc-900/60 border-slate-200 dark:border-zinc-800">
                        <SelectValue placeholder="Pilih model..." />
                      </SelectTrigger>
                      <SelectContent>
                        {PROVIDER_PRESETS[formData.provider]?.models.map((m) => (
                          <SelectItem key={m} value={m} className="text-xs">
                            {m}
                          </SelectItem>
                        ))}
                        <SelectItem value="custom" className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                          + Custom Model Lainnya...
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.model === "custom" && (
                    <div>
                      <Label className="text-xs font-semibold mb-1.5 block">Ketik Nama Model Custom</Label>
                      <Input
                        placeholder="e.g. gpt-4o, deepseek-chat, llama3.3:70b"
                        value={formData.customModel}
                        onChange={(e) => setFormData(p => ({ ...p, customModel: e.target.value }))}
                        className="text-xs rounded-xl bg-slate-50/70 dark:bg-zinc-900/60 border-slate-200 dark:border-zinc-800 font-mono"
                      />
                    </div>
                  )}
                </div>

                {/* Base URL (Endpoint) */}
                <div>
                  <Label className="text-xs font-semibold mb-1.5 block flex items-center justify-between">
                    <span>Base API Endpoint (URL)</span>
                    <span className="text-[10px] text-slate-400 font-normal">Kompatibel standar OpenAI REST</span>
                  </Label>
                  <Input
                    placeholder="https://api.openai.com/v1"
                    value={formData.baseUrl}
                    onChange={(e) => setFormData(p => ({ ...p, baseUrl: e.target.value }))}
                    className="text-xs rounded-xl bg-slate-50/70 dark:bg-zinc-900/60 border-slate-200 dark:border-zinc-800 font-mono"
                  />
                </div>
              </CardContent>
            </Card>

            {/* API Key & Security Credentials */}
            <Card className="rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-[#111113] shadow-2xs">
              <CardHeader className="pb-4 border-b border-slate-100 dark:border-zinc-800">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <KeyRound className="h-4 w-4 text-emerald-600" />
                  Kunci Rahasia API (API Key)
                </CardTitle>
                <CardDescription className="text-xs">
                  Kunci API akan langsung dienkripsi sebelum disimpan ke dalam database
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-5 space-y-4">
                <div>
                  <Label className="text-xs font-semibold mb-1.5 block flex items-center justify-between">
                    <span>API Key / Secret Token</span>
                    {formData.hasApiKey && (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Tersimpan: {formData.apiKeyMasked}
                      </span>
                    )}
                  </Label>
                  
                  <div className="relative">
                    <Input
                      type={showKey ? "text" : "password"}
                      placeholder={formData.hasApiKey ? "Ketik untuk mengganti dengan API Key baru..." : "Masukkan API Key Anda..."}
                      value={formData.apiKey}
                      onChange={(e) => setFormData(p => ({ ...p, apiKey: e.target.value }))}
                      className="pr-10 text-xs rounded-xl bg-slate-50/70 dark:bg-zinc-900/60 border-slate-200 dark:border-zinc-800 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200"
                    >
                      {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-1">
                    Biarkan kosong jika Anda tidak ingin mengubah kunci API yang telah tersimpan.
                  </p>
                </div>

                {/* Test Connection Button & Status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleTestConnection}
                    disabled={isTesting || (!formData.apiKey && !formData.hasApiKey)}
                    className="text-xs rounded-xl gap-2 border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800"
                  >
                    {isTesting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Activity className="h-3.5 w-3.5 text-blue-600" />}
                    <span>Uji Koneksi (Test Connection)</span>
                  </Button>

                  {testResult && (
                    <div className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-xl border ${
                      testResult.success 
                        ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-500/20" 
                        : "bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-500/20"
                    }`}>
                      {testResult.success ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> : <AlertCircle className="h-3.5 w-3.5 shrink-0" />}
                      <span className="truncate max-w-sm">{testResult.message}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Parameter Lanjutan & Prompt Sistem */}
            <Card className="rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-[#111113] shadow-2xs">
              <CardHeader className="pb-4 border-b border-slate-100 dark:border-zinc-800">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-violet-600" />
                  Parameter Model & Prompt Sistem
                </CardTitle>
                <CardDescription className="text-xs">
                  Atur kreativitas respons (temperature) dan instruksi dasar Tiara AI Copilot
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs font-semibold mb-1.5 block">Temperature ({formData.temperature})</Label>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      max="1.5"
                      value={formData.temperature}
                      onChange={(e) => setFormData(p => ({ ...p, temperature: parseFloat(e.target.value) || 0 }))}
                      className="text-xs rounded-xl bg-slate-50/70 dark:bg-zinc-900/60 border-slate-200 dark:border-zinc-800"
                    />
                    <span className="text-[10px] text-slate-400">0.0 (Presisi & Faktual) &bull; 0.7 (Standar) &bull; 1.0 (Kreatif)</span>
                  </div>

                  <div>
                    <Label className="text-xs font-semibold mb-1.5 block">Max Output Tokens</Label>
                    <Input
                      type="number"
                      step="256"
                      min="512"
                      max="8192"
                      value={formData.maxTokens}
                      onChange={(e) => setFormData(p => ({ ...p, maxTokens: parseInt(e.target.value) || 2048 }))}
                      className="text-xs rounded-xl bg-slate-50/70 dark:bg-zinc-900/60 border-slate-200 dark:border-zinc-800"
                    />
                    <span className="text-[10px] text-slate-400">Batas maksimum panjang jawaban yang dihasilkan</span>
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-semibold mb-1.5 block">System Prompt (Instruksi Sistem)</Label>
                  <Textarea
                    rows={4}
                    value={formData.systemPrompt}
                    onChange={(e) => setFormData(p => ({ ...p, systemPrompt: e.target.value }))}
                    className="text-xs rounded-xl bg-slate-50/70 dark:bg-zinc-900/60 border-slate-200 dark:border-zinc-800 font-sans leading-relaxed"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Instruksi ini akan selalu disematkan pada setiap percakapan bersamaan dengan data statistik real-time SIMPEG PDAM.
                  </p>
                </div>
              </CardContent>
            </Card>

          </div>

        </main>
      </div>
    </div>
  )
}
