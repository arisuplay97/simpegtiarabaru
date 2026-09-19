"use client"

import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { SidebarNav } from "@/components/simpeg/sidebar-nav"
import { TopBar } from "@/components/simpeg/top-bar"
import { TiaraAiOrb } from "@/components/simpeg/tiara-ai-orb"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
  Sparkles,
  Send,
  Square,
  Plus,
  Trash2,
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Search,
  MessageSquare,
  ArrowRight,
  ExternalLink,
  Bot,
  User as UserIcon,
  BarChart3,
  CalendarDays,
  FileText,
  FileSpreadsheet,
  Download,
  BadgePercent,
  Loader2,
  Sliders,
  Settings
} from "lucide-react"
import { AiSettingsModal } from "@/components/simpeg/ai-settings-modal"

export interface ChatFile {
  name: string
  type: "pdf" | "excel"
  dataUrl: string
  size: string
}

interface ThinkingData {
  steps: string[]
  durationSeconds: string
}

interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  thinking?: ThinkingData
  suggestions?: string[]
  relatedLink?: { text: string; href: string } | null
  files?: ChatFile[]
  timestamp: string
  isStreaming?: boolean
}

interface Conversation {
  id: string
  title: string
  createdAt: string
  messages: ChatMessage[]
}

const DEFAULT_SUGGESTIONS = [
  {
    icon: BarChart3,
    title: "Analisis Presensi Hari Ini",
    desc: "Cek tingkat kehadiran, keterlambatan, dan daftar belum absen",
    prompt: "Analisis tingkat presensi dan keterlambatan pegawai PDAM hari ini"
  },
  {
    icon: CalendarDays,
    title: "Proyeksi Usia Pensiun (BUP)",
    desc: "Daftar pegawai yang mendekati batas usia pensiun 58 tahun",
    prompt: "Siapa saja pegawai yang mendekati batas usia pensiun (BUP) tahun ini?"
  },
  {
    icon: BadgePercent,
    title: "Kalkulasi PPh 21 TER",
    desc: "Ketentuan tarif TER bulanan PP 58/2023 & komponen gaji PDAM",
    prompt: "Jelaskan perhitungan PPh 21 TER bulanan dan komponen tunjangan PDAM"
  },
  {
    icon: FileText,
    title: "Draf Dokumen Resmi",
    desc: "Buat draf Nota Dinas, Surat Tugas, atau SK Direksi",
    prompt: "Buatkan draf format Nota Dinas pengajuan Kenaikan Gaji Berkala (KGB)"
  },
  {
    icon: FileSpreadsheet,
    title: "Ekspor Rekap Laporan",
    desc: "Unduh rekap ringkasan pegawai & presensi ke Excel atau PDF",
    prompt: "Buatkan ringkasan pegawai dan absensi hari ini lalu ekspor ke file Excel dan PDF"
  }
]

export default function AssistantPage() {
  const { data: session } = useSession()
  const [mounted, setMounted] = useState(false)

  // Chat Conversations State
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeChatId, setActiveChatId] = useState<string>("")
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [searchHistory, setSearchHistory] = useState("")

  // Current Input & Generation State
  const [inputPrompt, setInputPrompt] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [openThinkingMap, setOpenThinkingMap] = useState<Record<string, boolean>>({})
  const [copiedMap, setCopiedMap] = useState<Record<string, boolean>>({})
  const [feedbackMap, setFeedbackMap] = useState<Record<string, "up" | "down">>({})
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  const userRole = (session?.user as any)?.role?.toString().toUpperCase()
  const canManageAi = userRole === "SUPERADMIN" || userRole === "SUPER_ADMIN" || userRole === "HRD"

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const streamAbortController = useRef<boolean>(false)

  // Initialize from LocalStorage
  useEffect(() => {
    setMounted(true)
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)
      if (params.get("settings") === "true") {
        setIsSettingsOpen(true)
      }
    }
    const saved = localStorage.getItem("tiara_assistant_conversations")
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setConversations(parsed)
          setActiveChatId(parsed[0].id)
          return
        }
      } catch (e) {
        console.error("Failed to parse saved conversations", e)
      }
    }
    // Default initial conversation
    const initialId = "chat-" + Date.now()
    const initialConv: Conversation = {
      id: initialId,
      title: "Percakapan Baru",
      createdAt: new Date().toISOString(),
      messages: []
    }
    setConversations([initialConv])
    setActiveChatId(initialId)
  }, [])

  // Persist to LocalStorage
  useEffect(() => {
    if (!mounted || conversations.length === 0) return
    localStorage.setItem("tiara_assistant_conversations", JSON.stringify(conversations))
  }, [conversations, mounted])

  // Auto-scroll cleanly on new messages or generation changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [conversations.length, isGenerating])

  // Smooth auto-resize for textarea without jumping or DOM lag
  useEffect(() => {
    if (!textareaRef.current) return
    textareaRef.current.style.height = "auto"
    const nextHeight = Math.min(textareaRef.current.scrollHeight, 180)
    textareaRef.current.style.height = `${Math.max(44, nextHeight)}px`
  }, [inputPrompt])

  // Current active conversation
  const activeConversation = conversations.find(c => c.id === activeChatId) || conversations[0] || {
    id: "empty",
    title: "Percakapan Baru",
    createdAt: new Date().toISOString(),
    messages: []
  }

  // Create New Chat
  const handleNewChat = () => {
    if (isGenerating) streamAbortController.current = true
    const newId = "chat-" + Date.now()
    const newChat: Conversation = {
      id: newId,
      title: "Percakapan Baru",
      createdAt: new Date().toISOString(),
      messages: []
    }
    setConversations(prev => [newChat, ...prev])
    setActiveChatId(newId)
    setInputPrompt("")
    setTimeout(() => textareaRef.current?.focus(), 100)
  }

  // Delete Chat
  const handleDeleteChat = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    const filtered = conversations.filter(c => c.id !== id)
    if (filtered.length === 0) {
      const resetId = "chat-" + Date.now()
      const resetChat: Conversation = {
        id: resetId,
        title: "Percakapan Baru",
        createdAt: new Date().toISOString(),
        messages: []
      }
      setConversations([resetChat])
      setActiveChatId(resetId)
    } else {
      setConversations(filtered)
      if (activeChatId === id) {
        setActiveChatId(filtered[0].id)
      }
    }
    toast.success("Riwayat chat dihapus")
  }

  // Stop Generating
  const handleStopGenerating = () => {
    streamAbortController.current = true
    setIsGenerating(false)
  }

  // Send Message - Clean, instantaneous render without 15ms DOM-thrashing
  const handleSendMessage = async (customPrompt?: string) => {
    const text = (customPrompt ?? inputPrompt).trim()
    if (!text || isGenerating) return

    const userMessage: ChatMessage = {
      id: "msg-" + Date.now(),
      role: "user",
      content: text,
      timestamp: new Date().toISOString()
    }

    setInputPrompt("")
    if (textareaRef.current) {
      textareaRef.current.style.height = "44px"
    }

    // Update conversation with user message
    let currentConv = activeConversation
    const updatedMessages = [...currentConv.messages, userMessage]
    const updatedTitle = currentConv.messages.length === 0
      ? (text.length > 32 ? text.substring(0, 32) + "..." : text)
      : currentConv.title

    setConversations(prev =>
      prev.map(c => c.id === activeChatId ? { ...c, title: updatedTitle, messages: updatedMessages } : c)
    )

    // Prepare assistant temporary placeholder
    const assistantMsgId = "asst-" + Date.now()
    const placeholderAssistantMsg: ChatMessage = {
      id: assistantMsgId,
      role: "assistant",
      content: "",
      isStreaming: true,
      timestamp: new Date().toISOString()
    }

    setConversations(prev =>
      prev.map(c => c.id === activeChatId ? { ...c, messages: [...updatedMessages, placeholderAssistantMsg] } : c)
    )

    setIsGenerating(true)
    streamAbortController.current = false

    try {
      const res = await fetch("/api/assistant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages.map(m => ({ role: m.role, content: m.content }))
        })
      })

      if (!res.ok) throw new Error("Gagal menghubungi Tiara Assistant API")
      const data = await res.json()

      if (streamAbortController.current) {
        setIsGenerating(false)
        return
      }

      const fullContent = data.content || "Maaf, tidak ada respons yang dihasilkan."
      const thinking = data.thinking
      const suggestions = data.suggestions
      const relatedLink = data.relatedLink
      const files = data.files

      // Render response directly without thrashing React state & broken markdown
      setConversations(prev =>
        prev.map(c =>
          c.id === activeChatId
            ? {
                ...c,
                messages: c.messages.map(m =>
                  m.id === assistantMsgId
                    ? {
                        ...m,
                        content: fullContent,
                        isStreaming: false,
                        thinking,
                        suggestions,
                        relatedLink,
                        files
                      }
                    : m
                )
              }
            : c
        )
      )
      setIsGenerating(false)

    } catch (err: any) {
      console.error(err)
      setIsGenerating(false)
      toast.error("Gagal memproses pesan: " + (err.message || "Terjadi kesalahan"))
      setConversations(prev =>
        prev.map(c =>
          c.id === activeChatId
            ? {
                ...c,
                messages: c.messages.map(m =>
                  m.id === assistantMsgId
                    ? {
                        ...m,
                        content: "Maaf, terjadi kendala saat menghubungkan ke server SIMPEG. Silakan coba sesaat lagi.",
                        isStreaming: false
                      }
                    : m
                )
              }
            : c
        )
      )
    }
  }

  // Handle Input Keydown
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // Copy Message to Clipboard
  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedMap(prev => ({ ...prev, [id]: true }))
    toast.success("Teks berhasil disalin")
    setTimeout(() => {
      setCopiedMap(prev => ({ ...prev, [id]: false }))
    }, 2000)
  }

  // Handle File Download (PDF / Excel)
  const handleDownloadFile = (file: ChatFile) => {
    try {
      const link = document.createElement("a")
      link.href = file.dataUrl
      link.download = file.name
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast.success(`Mengunduh ${file.name}`)
    } catch (err) {
      toast.error("Gagal mengunduh file")
    }
  }

  // Toggle Thinking Block
  const toggleThinking = (id: string) => {
    setOpenThinkingMap(prev => ({ ...prev, [id]: !prev[id] }))
  }

  // Filtered History
  const filteredHistory = conversations.filter(c =>
    c.title.toLowerCase().includes(searchHistory.toLowerCase())
  )

  if (!mounted) return null

  return (
    <div className="flex h-screen bg-[#F8FAFC] dark:bg-[#09090b] overflow-hidden">
      {/* SIMPEG Primary Sidebar */}
      <SidebarNav />

      {/* Main Offset Container */}
      <div className="flex flex-1 flex-col sidebar-offset min-w-0 h-full overflow-hidden">
        {/* Top Header */}
        <TopBar breadcrumb={["Tiara Assistant", "AI Copilot SIMPEG"]} />

        {/* Dual-Panel Workspace */}
        <div className="flex-1 flex min-w-0 overflow-hidden relative">

          {/* ── LEFT PANEL: CONVERSATION HISTORY SIDEBAR ── */}
          <aside
            className={cn(
              "shrink-0 bg-white dark:bg-[#111113] border-r border-slate-200/80 dark:border-zinc-800/80 flex flex-col transition-all duration-300 z-20",
              sidebarOpen ? "w-64 sm:w-72" : "w-0 overflow-hidden border-r-0"
            )}
          >
            {/* Header & New Chat Button */}
            <div className="p-3 border-b border-slate-100 dark:border-zinc-800/80 space-y-2.5">
              <button
                onClick={handleNewChat}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 font-semibold text-xs transition-colors shadow-xs group"
              >
                <span className="flex items-center gap-2">
                  <Plus className="w-4 h-4 transition-transform group-hover:rotate-90 duration-200" />
                  <span>Obrolan Baru</span>
                </span>
                <span className="text-[10px] bg-white/20 dark:bg-black/10 px-1.5 py-0.5 rounded font-mono">⌘N</span>
              </button>

              {/* Search History */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari percakapan..."
                  value={searchHistory}
                  onChange={e => setSearchHistory(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-slate-100/80 dark:bg-zinc-900 border border-transparent focus:border-slate-300 dark:focus:border-zinc-700 focus:bg-white dark:focus:bg-zinc-800 outline-none text-slate-800 dark:text-zinc-200 transition-colors"
                />
              </div>
            </div>

            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
              <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                Riwayat Sesi
              </div>
              {filteredHistory.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400 dark:text-zinc-500">
                  Tidak ada riwayat
                </div>
              ) : (
                filteredHistory.map(conv => {
                  const isActive = conv.id === activeChatId
                  return (
                    <div
                      key={conv.id}
                      onClick={() => {
                        setActiveChatId(conv.id)
                        if (window.innerWidth < 768) setSidebarOpen(false)
                      }}
                      className={cn(
                        "group relative flex items-center justify-between px-3 py-2 rounded-xl text-xs cursor-pointer transition-colors",
                        isActive
                          ? "bg-slate-100 dark:bg-zinc-800/80 text-slate-900 dark:text-zinc-100 font-semibold"
                          : "text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800/40 hover:text-slate-900 dark:hover:text-zinc-200"
                      )}
                    >
                      <div className="flex items-center gap-2.5 truncate min-w-0 pr-2">
                        <MessageSquare className={cn("w-3.5 h-3.5 shrink-0", isActive ? "text-slate-900 dark:text-zinc-100" : "text-slate-400")} />
                        <span className="truncate">{conv.title}</span>
                      </div>
                      <button
                        onClick={e => handleDeleteChat(e, conv.id)}
                        title="Hapus obrolan"
                        className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )
                })
              )}
            </div>

            {/* Sidebar Footer Info - Crisp static indicator */}
            <div className="p-3 border-t border-slate-100 dark:border-zinc-800/80 text-[11px] text-slate-500 dark:text-zinc-400 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20" />
                <span className="font-medium text-slate-700 dark:text-zinc-300">Tiara Assistant</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">SIMPEG PDAM</span>
            </div>
          </aside>

          {/* ── RIGHT PANEL: MAIN CHAT WORKSPACE ── */}
          <main className="flex-1 flex flex-col min-w-0 bg-[#F8FAFC] dark:bg-[#0B0C0E] h-full relative">

            {/* Sub-header Bar with Assistant Status */}
            <div className="h-14 px-4 sm:px-6 border-b border-slate-200/80 dark:border-zinc-800/80 bg-white/90 dark:bg-[#111113]/90 backdrop-blur-md flex items-center justify-between shrink-0 z-10">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSidebarOpen(prev => !prev)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                  title={sidebarOpen ? "Ciutkan Sidebar" : "Buka Sidebar Riwayat"}
                >
                  {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>

                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-900 flex items-center justify-center shadow-xs border border-slate-200/50 dark:border-zinc-800">
                    <Sparkles className="w-4 h-4 text-blue-400 dark:text-blue-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-zinc-100">
                        Tiara Assistant
                      </span>
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700">
                        SIMPEG Copilot
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-zinc-400 leading-none mt-0.5">
                      Perumda Air Minum Tirta Ardhia Rinjani
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                {canManageAi && (
                  <button
                    type="button"
                    onClick={() => setIsSettingsOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-zinc-300 bg-white dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700/80 hover:bg-slate-50 dark:hover:bg-zinc-700 transition-colors shadow-2xs cursor-pointer"
                    title="Konfigurasi API AI & Model"
                  >
                    <Sliders className="w-3.5 h-3.5 text-slate-600 dark:text-zinc-300" />
                    <span>Pengaturan API</span>
                  </button>
                )}
                <button
                  onClick={handleNewChat}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-zinc-300 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Obrolan Baru</span>
                </button>
              </div>
            </div>

            {/* Chat Stream Scroll Container */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 max-w-3xl mx-auto w-full">
              
              {/* Empty / Welcome State */}
              {activeConversation.messages.length === 0 && (
                <div className="flex flex-col items-center justify-center min-h-[70%] text-center py-6">
                  {/* Clean, Tasteful Orb Icon without neon blur */}
                  <div className="w-20 h-20 sm:w-24 sm:h-24 relative flex items-center justify-center mb-4">
                    <TiaraAiOrb className="w-full h-full" />
                  </div>

                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-zinc-800/80 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700 mb-3">
                    <Sparkles className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                    <span>Asisten Kepegawaian PDAM TIARA</span>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-zinc-100 tracking-tight">
                    Ada yang bisa saya bantu hari ini?
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-2 max-w-md leading-relaxed">
                    Ajukan pertanyaan terkait data pegawai, rekap absensi, hak cuti, kalkulasi pensiun BUP, atau minta pembuatan laporan Excel & PDF.
                  </p>

                  {/* Clean Suggestion Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full mt-8 text-left">
                    {DEFAULT_SUGGESTIONS.map((s, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleSendMessage(s.prompt)}
                        className="p-3.5 rounded-xl bg-white dark:bg-zinc-900/90 border border-slate-200/80 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 hover:shadow-xs cursor-pointer transition-all group flex flex-col justify-between"
                      >
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 shrink-0 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            <s.icon className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-xs font-semibold text-slate-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                              {s.title}
                            </h4>
                            <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5 leading-normal">
                              {s.desc}
                            </p>
                          </div>
                        </div>
                        <div className="mt-2.5 flex items-center justify-end text-[10px] font-semibold text-slate-600 dark:text-zinc-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          <span>Kirim pertanyaan</span>
                          <ArrowRight className="w-3 h-3 ml-1" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Message List */}
              {activeConversation.messages.map((msg, index) => {
                const isUser = msg.role === "user"
                const isThinkingOpen = openThinkingMap[msg.id] ?? false
                const isCopied = copiedMap[msg.id] ?? false
                const feedback = feedbackMap[msg.id]

                return (
                  <div
                    key={msg.id || index}
                    className={cn(
                      "flex gap-3 sm:gap-3.5 transition-opacity duration-200",
                      isUser ? "justify-end" : "justify-start"
                    )}
                  >
                    {/* Assistant Avatar - Clean Dark Badge */}
                    {!isUser && (
                      <div className="w-7 h-7 rounded-lg bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-900 flex items-center justify-center shrink-0 shadow-xs mt-1 border border-slate-200/40 dark:border-zinc-800">
                        <Sparkles className="w-3.5 h-3.5 text-blue-400 dark:text-blue-600" />
                      </div>
                    )}

                    {/* Message Body */}
                    <div className={cn("max-w-[88%] sm:max-w-[82%] space-y-1.5", isUser && "text-right")}>
                      
                      {/* USER BUBBLE - Sleek executive bubble */}
                      {isUser ? (
                        <div className="inline-block px-4 py-2.5 rounded-2xl rounded-tr-xs bg-slate-900 dark:bg-blue-600 text-white text-xs sm:text-[13px] font-normal leading-relaxed text-left shadow-xs">
                          {msg.content}
                        </div>
                      ) : (
                        /* ASSISTANT CARD - Clean, non-slop enterprise layout */
                        <div className="bg-white dark:bg-zinc-900/90 border border-slate-200/90 dark:border-zinc-800/90 rounded-2xl p-4 sm:p-5 text-slate-800 dark:text-zinc-200 shadow-xs space-y-3.5">
                          
                          {/* ── REASONING / THINKING DISCLOSURE (Minimal, NO pulsing) ── */}
                          {msg.thinking && msg.thinking.steps && msg.thinking.steps.length > 0 && (
                            <div className="rounded-lg border border-slate-200/70 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-900/50 overflow-hidden text-xs">
                              <button
                                onClick={() => toggleThinking(msg.id)}
                                className="w-full flex items-center justify-between px-3 py-1.5 text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200 text-[11px] font-medium transition-colors"
                              >
                                <div className="flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-zinc-500" />
                                  <span>Penalaran data ({msg.thinking.durationSeconds}s)</span>
                                </div>
                                <ChevronDown
                                  className={cn("w-3 h-3 transition-transform duration-200", isThinkingOpen && "rotate-180")}
                                />
                              </button>

                              {isThinkingOpen && (
                                <div className="px-3 pb-2.5 pt-1 border-t border-slate-200/50 dark:border-zinc-800/50 text-[11px] text-slate-500 dark:text-zinc-400 space-y-1 font-mono">
                                  {msg.thinking.steps.map((step, sIdx) => (
                                    <div key={sIdx} className="flex items-start gap-1.5">
                                      <span className="text-slate-400">&bull;</span>
                                      <span>{step}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                          {/* ── MARKDOWN CONTENT / LOADING STATE ── */}
                          {msg.content ? (
                            <div className="prose prose-sm dark:prose-invert max-w-none text-xs sm:text-[13px] leading-relaxed break-words space-y-2.5">
                              <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                  table: ({ node, ...props }) => (
                                    <div className="overflow-x-auto my-3 rounded-lg border border-slate-200 dark:border-zinc-800">
                                      <table className="min-w-full divide-y divide-slate-200 dark:divide-zinc-800 text-xs text-left" {...props} />
                                    </div>
                                  ),
                                  thead: ({ node, ...props }) => (
                                    <thead className="bg-slate-50 dark:bg-zinc-800/70 text-slate-700 dark:text-zinc-200 font-semibold" {...props} />
                                  ),
                                  th: ({ node, ...props }) => (
                                    <th className="px-3.5 py-2 text-left font-semibold text-xs" {...props} />
                                  ),
                                  td: ({ node, ...props }) => (
                                    <td className="px-3.5 py-2 border-t border-slate-100 dark:border-zinc-800/60 text-xs" {...props} />
                                  ),
                                  pre: ({ node, ...props }) => (
                                    <div className="relative group my-3">
                                      <pre className="p-3.5 rounded-xl bg-slate-900 dark:bg-black text-slate-100 text-xs overflow-x-auto font-mono border border-slate-800" {...props} />
                                    </div>
                                  ),
                                  code: ({ node, ...props }) => (
                                    <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 font-mono text-[11px]" {...props} />
                                  ),
                                  blockquote: ({ node, ...props }) => (
                                    <blockquote className="border-l-2 border-slate-400 dark:border-zinc-600 bg-slate-50 dark:bg-zinc-800/40 px-3 py-2 rounded-r-md italic text-slate-700 dark:text-zinc-300 my-2 text-xs" {...props} />
                                  )
                                }}
                              >
                                {msg.content}
                              </ReactMarkdown>
                            </div>
                          ) : msg.isStreaming ? (
                            /* Clean Subtle Loading Indicator - NO bouncing dots */
                            <div className="flex items-center gap-2.5 py-1 text-slate-500 dark:text-zinc-400 text-xs">
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-500 dark:text-zinc-400" />
                              <span className="font-medium text-[11px]">Menyusun jawaban...</span>
                            </div>
                          ) : null}

                          {/* ── GENERATED FILES (PDF / EXCEL ATTACHMENTS) ── */}
                          {msg.files && msg.files.length > 0 && !msg.isStreaming && (
                            <div className="pt-2 space-y-2 border-t border-slate-100 dark:border-zinc-800/80">
                              <div className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                                <Download className="w-3 h-3 text-slate-500" />
                                <span>Dokumen Terlampir ({msg.files.length})</span>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {msg.files.map((file, fIdx) => {
                                  const isPdf = file.type === "pdf"
                                  return (
                                    <div
                                      key={fIdx}
                                      className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/40 hover:border-slate-300 dark:hover:border-zinc-700 transition-all group"
                                    >
                                      <div className="flex items-center gap-2.5 min-w-0 pr-2">
                                        <div
                                          className={cn(
                                            "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-2xs text-white",
                                            isPdf ? "bg-rose-600" : "bg-emerald-600"
                                          )}
                                        >
                                          {isPdf ? (
                                            <FileText className="w-4 h-4 text-white" />
                                          ) : (
                                            <FileSpreadsheet className="w-4 h-4 text-white" />
                                          )}
                                        </div>
                                        <div className="min-w-0">
                                          <p className="text-xs font-semibold text-slate-800 dark:text-zinc-100 truncate">
                                            {file.name}
                                          </p>
                                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
                                            <span className="uppercase font-semibold text-slate-500">
                                              {file.type}
                                            </span>
                                            <span>&bull;</span>
                                            <span>{file.size}</span>
                                          </div>
                                        </div>
                                      </div>

                                      <button
                                        onClick={() => handleDownloadFile(file)}
                                        className="px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 shrink-0 bg-slate-900 hover:bg-slate-800 text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-900 transition-colors shadow-2xs cursor-pointer"
                                      >
                                        <Download className="w-3 h-3" />
                                        <span>Unduh</span>
                                      </button>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          )}

                          {/* ── CONTEXTUAL LINK BUTTON ── */}
                          {msg.relatedLink && !msg.isStreaming && (
                            <div className="pt-1">
                              <Link
                                href={msg.relatedLink.href}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 hover:bg-slate-200 dark:hover:bg-zinc-700 border border-slate-200/80 dark:border-zinc-700 transition-colors shadow-2xs"
                              >
                                <span>{msg.relatedLink.text}</span>
                                <ExternalLink className="w-3 h-3 text-slate-400" />
                              </Link>
                            </div>
                          )}

                          {/* ── FOLLOW-UP SUGGESTIONS CHIPS ── */}
                          {msg.suggestions && msg.suggestions.length > 0 && !msg.isStreaming && (
                            <div className="pt-2 border-t border-slate-100 dark:border-zinc-800/80 space-y-1.5">
                              <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                                Saran Pertanyaan:
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                {msg.suggestions.map((sug, sIdx) => (
                                  <button
                                    key={sIdx}
                                    onClick={() => handleSendMessage(sug)}
                                    className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-50 dark:bg-zinc-800/50 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700/80 transition-colors text-left"
                                  >
                                    {sug}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* ── BOTTOM ACTIONS BAR ── */}
                          {!msg.isStreaming && (
                            <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-zinc-800/60 text-slate-400">
                              <span className="text-[10px] text-slate-400">
                                {new Date(msg.timestamp).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                              </span>

                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleCopy(msg.id, msg.content)}
                                  className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-700 dark:hover:text-zinc-200 transition-colors"
                                  title="Salin jawaban"
                                >
                                  {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                </button>
                                <button
                                  onClick={() => setFeedbackMap(prev => ({ ...prev, [msg.id]: "up" }))}
                                  className={cn(
                                    "p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors",
                                    feedback === "up" ? "text-blue-600" : "hover:text-slate-700 dark:hover:text-zinc-200"
                                  )}
                                  title="Jawaban membantu"
                                >
                                  <ThumbsUp className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setFeedbackMap(prev => ({ ...prev, [msg.id]: "down" }))}
                                  className={cn(
                                    "p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors",
                                    feedback === "down" ? "text-rose-600" : "hover:text-slate-700 dark:hover:text-zinc-200"
                                  )}
                                  title="Jawaban kurang memuaskan"
                                >
                                  <ThumbsDown className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          )}

                        </div>
                      )}

                      {/* Message Timestamp (User) */}
                      {isUser && (
                        <div className="text-[10px] text-slate-400 pr-1">
                          {new Date(msg.timestamp).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      )}

                    </div>

                    {/* User Avatar */}
                    {isUser && (
                      <div className="w-7 h-7 rounded-lg bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 flex items-center justify-center shrink-0 shadow-xs mt-1">
                        <UserIcon className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>
                )
              })}

              <div ref={messagesEndRef} />
            </div>

            {/* ── BOTTOM INPUT DOCK - Crisp, responsive, no jitter ── */}
            <div className="shrink-0 p-4 sm:p-5 max-w-3xl mx-auto w-full">
              <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm p-3 transition-all focus-within:border-slate-400 dark:focus-within:border-zinc-600 focus-within:ring-2 focus-within:ring-slate-400/10 relative">
                
                {/* Auto-growing Textarea */}
                <textarea
                  ref={textareaRef}
                  value={inputPrompt}
                  onChange={e => setInputPrompt(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Tanyakan tentang data pegawai, presensi, cuti, atau buat laporan..."
                  rows={1}
                  disabled={isGenerating}
                  className="w-full bg-transparent resize-none outline-none text-xs sm:text-[13px] text-slate-800 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 px-1 py-1 max-h-[180px] leading-relaxed"
                />

                {/* Dock Controls */}
                <div className="flex items-center justify-between pt-2 px-1 border-t border-slate-100 dark:border-zinc-800/60 mt-1.5">
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-zinc-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20" />
                    <span className="hidden sm:inline font-medium">SIMPEG Database Terhubung</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="hidden sm:inline text-[10px] font-mono text-slate-400 dark:text-zinc-500">
                      Enter ↵ kirim
                    </span>

                    {/* Send / Stop Button */}
                    {isGenerating ? (
                      <button
                        onClick={handleStopGenerating}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs transition-colors shadow-xs cursor-pointer"
                        title="Hentikan pembuatan respons"
                      >
                        <Square className="w-3 h-3 fill-current" />
                        <span>Hentikan</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleSendMessage()}
                        disabled={!inputPrompt.trim()}
                        className={cn(
                          "flex items-center justify-center h-7 w-7 rounded-xl transition-all shadow-xs",
                          inputPrompt.trim()
                            ? "bg-slate-900 hover:bg-slate-800 text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-900 cursor-pointer"
                            : "bg-slate-100 dark:bg-zinc-800 text-slate-300 dark:text-zinc-600 cursor-not-allowed"
                        )}
                        title="Kirim pesan"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Disclaimer */}
              <p className="text-[10px] text-center text-slate-400 dark:text-zinc-500 mt-2">
                Tiara Assistant memproses data kepegawaian internal PDAM Tirta Ardhia Rinjani dalam mode baca aman.
              </p>
            </div>

          </main>
        </div>
      </div>

      {/* Modern Premium AI Settings Modal */}
      <AiSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  )
}
