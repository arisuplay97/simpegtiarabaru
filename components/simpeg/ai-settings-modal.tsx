"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { 
  X, Check, CheckCircle2, ShieldCheck, KeyRound, Server, 
  Cpu, Zap, Loader2, Eye, EyeOff, Save, RefreshCw, 
  Sliders, Lock, AlertCircle, Sparkles, ChevronDown, ChevronUp
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { getAiConfig, saveAiConfig, testAiConnection, AiConfigData } from "@/lib/actions/ai-config"

interface AiSettingsModalProps {
  isOpen: boolean
  onClose: () => void
  onSaved?: () => void
}

const PROVIDER_PRESETS: Record<string, {
  label: string
  sublabel: string
  defaultBaseUrl: string
  models: string[]
  recommended: string
}> = {
  openai: {
    label: "OpenAI",
    sublabel: "GPT-4o, GPT-4o-mini, o1",
    defaultBaseUrl: "https://api.openai.com/v1",
    models: ["gpt-4o-mini", "gpt-4o", "gpt-3.5-turbo", "o1-mini"],
    recommended: "gpt-4o-mini"
  },
  google: {
    label: "Google Gemini",
    sublabel: "Gemini 1.5 Flash / Pro, 2.0",
    defaultBaseUrl: "https://generativelanguage.googleapis.com",
    models: ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-2.0-flash"],
    recommended: "gemini-1.5-flash"
  },
  deepseek: {
    label: "DeepSeek",
    sublabel: "DeepSeek-V3, DeepSeek-R1",
    defaultBaseUrl: "https://api.deepseek.com/v1",
    models: ["deepseek-chat", "deepseek-reasoner"],
    recommended: "deepseek-chat"
  },
  custom: {
    label: "Custom / Self-Hosted",
    sublabel: "Ollama, vLLM, LM Studio, Azure",
    defaultBaseUrl: "http://localhost:11434/v1",
    models: ["llama3.3", "qwen-2.5-72b", "mistral-large", "custom-model"],
    recommended: "llama3.3"
  }
}

export function AiSettingsModal({ isOpen, onClose, onSaved }: AiSettingsModalProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [showKey, setShowKey] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
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
    temperature: 0.4,
    maxTokens: 2048,
    systemPrompt: "Anda adalah Tiara Assistant, AI Cerdas resmi sistem kepegawaian (SIMPEG) Perumda Air Minum Tirta Ardhia Rinjani (PDAM TIARA). Berikan respon berbasis data, sopan, akurat, profesional, dan patuhi protokol read-only.",
    hasApiKey: false,
    apiKeyMasked: ""
  })

  useEffect(() => {
    if (isOpen) {
      loadConfig()
    }
  }, [isOpen])

  const loadConfig = async () => {
    setIsLoading(true)
    setTestResult(null)
    try {
      const res = await getAiConfig()
      if (res.data) {
        const d = res.data
        const preset = PROVIDER_PRESETS[d.provider]
        const isPresetModel = preset?.models.includes(d.model)

        setFormData({
          enabled: d.enabled ?? true,
          provider: d.provider || "openai",
          model: isPresetModel ? d.model : "custom",
          customModel: isPresetModel ? "" : d.model,
          baseUrl: d.baseUrl || preset?.defaultBaseUrl || "",
          apiKey: "",
          temperature: d.temperature ?? 0.4,
          maxTokens: d.maxTokens ?? 2048,
          systemPrompt: d.systemPrompt || "Anda adalah Tiara Assistant, AI Cerdas resmi sistem kepegawaian (SIMPEG) Perumda Air Minum Tirta Ardhia Rinjani (PDAM TIARA).",
          hasApiKey: d.hasApiKey,
          apiKeyMasked: d.apiKeyMasked
        })
      }
    } catch (err: any) {
      toast.error("Gagal memuat konfigurasi AI: " + err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleProviderSelect = (key: string) => {
    const preset = PROVIDER_PRESETS[key]
    setFormData(prev => ({
      ...prev,
      provider: key,
      baseUrl: preset?.defaultBaseUrl || prev.baseUrl,
      model: preset?.recommended || "custom",
      customModel: ""
    }))
    setTestResult(null)
  }

  const handleTestConnection = async () => {
    setIsTesting(true)
    setTestResult(null)
    try {
      const actualModel = formData.model === "custom" 
        ? formData.customModel.trim() 
        : formData.model.trim()

      if (!actualModel) {
        toast.error("Nama model tidak boleh kosong saat pengujian.")
        setIsTesting(false)
        return
      }

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
      const msg = err.message || "Gagal menghubungi endpoint AI."
      setTestResult({ success: false, message: msg })
      toast.error(msg)
    } finally {
      setIsTesting(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    setTestResult(null)
    try {
      const actualModel = formData.model === "custom" 
        ? formData.customModel.trim() 
        : formData.model.trim()

      if (!actualModel) {
        toast.error("Nama model wajib diisi.")
        setIsSaving(false)
        return
      }

      const res = await saveAiConfig({
        enabled: formData.enabled,
        provider: formData.provider,
        model: actualModel,
        baseUrl: formData.baseUrl.trim(),
        apiKey: formData.apiKey.trim() || null,
        temperature: Number(formData.temperature),
        maxTokens: Number(formData.maxTokens),
        systemPrompt: formData.systemPrompt.trim()
      })

      if (res.success) {
        toast.success("Pengaturan AI Assistant berhasil disimpan dengan enkripsi AES-256-GCM.")
        setFormData(prev => ({ ...prev, apiKey: "" }))
        await loadConfig()
        onSaved?.()
        onClose()
      } else {
        toast.error(res.error || "Gagal menyimpan konfigurasi.")
      }
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan sistem.")
    } finally {
      setIsSaving(false)
    }
  }

  if (!isOpen) return null

  const currentPreset = PROVIDER_PRESETS[formData.provider]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl bg-white dark:bg-[#0E1116] border border-slate-200/90 dark:border-zinc-800/90 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-900/30">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center font-bold shadow-xs">
              <Cpu className="w-4.5 h-4.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-zinc-100 tracking-tight">
                  Pengaturan Model & API
                </h2>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700">
                  AES-256-GCM
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                Konfigurasi integrasi model bahasa eksternal untuk Tiara Assistant
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:text-zinc-500 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-7 h-7 animate-spin text-slate-700 dark:text-zinc-300" />
              <p className="text-xs text-slate-500 dark:text-zinc-400">Memuat konfigurasi keamanan...</p>
            </div>
          ) : (
            <>
              {/* Section 1: Activation Switch */}
              <div className="p-4 rounded-xl border border-slate-200/80 dark:border-zinc-800/80 bg-slate-50/60 dark:bg-zinc-900/40 flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-zinc-100">
                      Gunakan Model Eksternal
                    </span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      formData.enabled 
                        ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20" 
                        : "bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400"
                    }`}>
                      {formData.enabled ? "Aktif" : "Mesin Internal"}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                    Saat aktif, Tiara Assistant memanggil API penyedia yang dipilih. Jika nonaktif, asisten menggunakan mesin bawaan SIMPEG TIARA.
                  </p>
                </div>
                <Switch
                  checked={formData.enabled}
                  onCheckedChange={checked => setFormData(prev => ({ ...prev, enabled: checked }))}
                />
              </div>

              {/* Section 2: Provider Selection Grid */}
              <div className="space-y-2.5">
                <Label className="text-xs font-semibold text-slate-800 dark:text-zinc-200 tracking-wide uppercase">
                  Penyedia Layanan (AI Provider)
                </Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {Object.entries(PROVIDER_PRESETS).map(([key, item]) => {
                    const isSelected = formData.provider === key
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => handleProviderSelect(key)}
                        className={`p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between gap-1.5 ${
                          isSelected
                            ? "border-slate-900 dark:border-zinc-100 bg-slate-900 text-white dark:bg-zinc-100 dark:text-slate-950 shadow-xs"
                            : "border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 hover:border-slate-300 dark:hover:border-zinc-700 text-slate-800 dark:text-zinc-200"
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="text-xs font-bold leading-tight">{item.label}</span>
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                        </div>
                        <span className={`text-[10px] leading-tight line-clamp-1 ${isSelected ? "text-slate-300 dark:text-zinc-600" : "text-slate-500 dark:text-zinc-400"}`}>
                          {item.sublabel}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Section 3: Model Specification */}
              <div className="space-y-3">
                <Label className="text-xs font-semibold text-slate-800 dark:text-zinc-200 tracking-wide uppercase">
                  Pilihan Model
                </Label>
                
                {/* Preset Chips */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {currentPreset?.models.map(m => {
                    const isSelected = formData.model === m
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, model: m, customModel: "" }))}
                        className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors border ${
                          isSelected
                            ? "bg-slate-900 text-white dark:bg-zinc-100 dark:text-slate-900 border-slate-900 dark:border-zinc-100 shadow-2xs"
                            : "bg-slate-50 dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800"
                        }`}
                      >
                        {m}
                      </button>
                    )
                  })}
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, model: "custom" }))}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors border ${
                      formData.model === "custom"
                        ? "bg-slate-900 text-white dark:bg-zinc-100 dark:text-slate-900 border-slate-900 dark:border-zinc-100 shadow-2xs"
                        : "bg-slate-50 dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800"
                    }`}
                  >
                    + Custom Model
                  </button>
                </div>

                {/* Custom Model Text Input (if selected) */}
                {formData.model === "custom" && (
                  <div className="pt-1.5">
                    <Input
                      type="text"
                      placeholder="e.g. meta-llama/Llama-3.3-70B-Instruct atau custom-deployment"
                      value={formData.customModel}
                      onChange={e => setFormData(prev => ({ ...prev, customModel: e.target.value }))}
                      className="font-mono text-xs h-9 bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 focus:border-slate-900 dark:focus:border-zinc-100"
                    />
                    <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-1">
                      Ketik identifier model yang tersedia di server atau gateway LLM Anda.
                    </p>
                  </div>
                )}
              </div>

              {/* Section 4: Endpoint / Base URL */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-slate-800 dark:text-zinc-200 tracking-wide uppercase">
                    Endpoint URL (Base URL)
                  </Label>
                  <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono">
                    Opsional / Default Provider
                  </span>
                </div>
                <Input
                  type="text"
                  placeholder={currentPreset?.defaultBaseUrl || "https://api.openai.com/v1"}
                  value={formData.baseUrl}
                  onChange={e => setFormData(prev => ({ ...prev, baseUrl: e.target.value }))}
                  className="font-mono text-xs h-9 bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 focus:border-slate-900 dark:focus:border-zinc-100"
                />
              </div>

              {/* Section 5: API Key with Hardware-grade AES-256-GCM aesthetic */}
              <div className="space-y-2 p-4 rounded-xl border border-slate-200/90 dark:border-zinc-800/90 bg-slate-50/40 dark:bg-zinc-900/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5 text-slate-700 dark:text-zinc-300" />
                    <Label className="text-xs font-semibold text-slate-800 dark:text-zinc-200 tracking-wide uppercase">
                      Kunci API (API Key)
                    </Label>
                  </div>
                  {formData.hasApiKey && (
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      Tersimpan Terenkripsi
                    </span>
                  )}
                </div>

                {formData.hasApiKey && (
                  <div className="text-[11px] font-mono text-slate-500 dark:text-zinc-400 bg-white dark:bg-zinc-900 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 flex items-center justify-between">
                    <span>Key aktif: {formData.apiKeyMasked}</span>
                    <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-sans">AES-256-GCM</span>
                  </div>
                )}

                <div className="relative">
                  <Input
                    type={showKey ? "text" : "password"}
                    placeholder={formData.hasApiKey ? "Masukkan key baru untuk memperbarui..." : "Masukkan API Key (sk-... / AIza...)"}
                    value={formData.apiKey}
                    onChange={e => setFormData(prev => ({ ...prev, apiKey: e.target.value }))}
                    className="font-mono text-xs h-9 pr-10 bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 focus:border-slate-900 dark:focus:border-zinc-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-300 p-1"
                  >
                    {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <p className="text-[10px] text-slate-400 dark:text-zinc-500 leading-normal flex items-center gap-1 mt-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  Kunci langsung dienkripsi simetris menggunakan random initialization vector (IV) saat disimpan.
                </p>
              </div>

              {/* Section 6: Live Test Connection Button & Result */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isTesting}
                    onClick={handleTestConnection}
                    className="text-xs h-8 px-3 gap-1.5 font-medium border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200"
                  >
                    {isTesting ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Zap className="w-3.5 h-3.5 text-amber-500" />
                    )}
                    <span>{isTesting ? "Menguji Koneksi..." : "Uji Koneksi API"}</span>
                  </Button>

                  <button
                    type="button"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="text-[11px] font-medium text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200 flex items-center gap-1 transition-colors"
                  >
                    <Sliders className="w-3 h-3" />
                    <span>Parameter Lanjutan</span>
                    {showAdvanced ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                </div>

                {testResult && (
                  <div className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 transition-all ${
                    testResult.success 
                      ? "bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-500/30 text-emerald-900 dark:text-emerald-200"
                      : "bg-rose-50/70 dark:bg-rose-950/40 border-rose-500/30 text-rose-900 dark:text-rose-200"
                  }`}>
                    {testResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className="font-semibold text-[11px]">{testResult.message}</p>
                      {testResult.latencyMs !== undefined && (
                        <p className="text-[10px] opacity-80 mt-0.5 font-mono">
                          Roundtrip Latency: {testResult.latencyMs} ms
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Section 7: Advanced Parameters (Collapsible) */}
              {showAdvanced && (
                <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 space-y-4 bg-slate-50/30 dark:bg-zinc-900/20 animate-in fade-in duration-150">
                  {/* Temperature */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <Label className="font-semibold text-slate-800 dark:text-zinc-200">
                        Temperature ({formData.temperature})
                      </Label>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {formData.temperature <= 0.4 ? "Faktual & Konsisten" : "Seimbang / Kreatif"}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.0"
                      max="1.0"
                      step="0.05"
                      value={formData.temperature}
                      onChange={e => setFormData(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                      className="w-full accent-slate-900 dark:accent-zinc-100 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                      <span>0.0 (Presisi)</span>
                      <span>0.4 (Rekomendasi)</span>
                      <span>1.0 (Kreatif)</span>
                    </div>
                  </div>

                  {/* Max Tokens */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-800 dark:text-zinc-200">
                      Maksimal Token Output
                    </Label>
                    <div className="flex items-center gap-2">
                      {[1024, 2048, 4096, 8192].map(t => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, maxTokens: t }))}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-medium border transition-colors ${
                            formData.maxTokens === t
                              ? "bg-slate-900 text-white dark:bg-zinc-100 dark:text-slate-900 border-slate-900 dark:border-zinc-100"
                              : "bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-800"
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* System Prompt */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-800 dark:text-zinc-200">
                      Instruksi Sistem (System Prompt)
                    </Label>
                    <Textarea
                      rows={3}
                      value={formData.systemPrompt}
                      onChange={e => setFormData(prev => ({ ...prev, systemPrompt: e.target.value }))}
                      className="text-xs font-mono bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 focus:border-slate-900 dark:focus:border-zinc-100"
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 border-t border-slate-100 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-900/30 flex items-center justify-end gap-2.5">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-xs text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800"
          >
            Batal
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={isSaving || isLoading}
            onClick={handleSave}
            className="text-xs bg-slate-900 hover:bg-slate-800 text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-slate-900 font-semibold gap-1.5 shadow-xs"
          >
            {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>Simpan Konfigurasi</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
