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
  RotateCcw,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Search,
  MessageSquare,
  Clock,
  ArrowRight,
  Lightbulb,
  ExternalLink,
  Bot,
  User as UserIcon,
  HelpCircle,
  BarChart3,
  CalendarDays,
  FileText,
  BadgePercent
} from "lucide-react"

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
  timestamp: string
  isStreaming?: boolean
  displayedContent?: string
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
    title: "Analisis Presensi & Kedisiplinan",
    desc: "Cek tingkat kehadiran, keterlambatan, dan rekap belum absen hari ini",
    prompt: "Analisis tingkat presensi dan keterlambatan pegawai PDAM hari ini"
  },
  {
    icon: CalendarDays,
    title: "Proyeksi Usia Pensiun (BUP)",
    desc: "Siapa saja pegawai yang mendekati batas usia pensiun 58 tahun?",
    prompt: "Siapa saja pegawai yang mendekati batas usia pensiun (BUP) tahun ini?"
  },
  {
    icon: BadgePercent,
    title: "Perhitungan PPh 21 TER & Remunerasi",
    desc: "Ketentuan tarif TER bulanan PP 58/2023 dan komponen gaji PDAM",
    prompt: "Jelaskan perhitungan PPh 21 TER bulanan dan komponen tunjangan PDAM"
  },
  {
    icon: FileText,
    title: "Draf Dokumen Kedinasan Resmi",
    desc: "Buat draf Nota Dinas, Surat Tugas, atau SK Direksi secara otomatis",
    prompt: "Buatkan draf format Nota Dinas pengajuan Kenaikan Gaji Berkala (KGB)"
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

  // Current Input & Streaming State
  const [inputPrompt, setInputPrompt] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [openThinkingMap, setOpenThinkingMap] = useState<Record<string, boolean>>({})
  const [copiedMap, setCopiedMap] = useState<Record<string, boolean>>({})
  const [feedbackMap, setFeedbackMap] = useState<Record<string, "up" | "down">>({})

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const streamAbortController = useRef<boolean>(false)

  // Initialize from LocalStorage
  useEffect(() => {
    setMounted(true)
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

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [conversations, activeChatId, isGenerating])

  // Current active conversation
  const activeConversation = conversations.find(c => c.id === activeChatId) || conversations[0]

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

  // Send Message with Typewriter Streaming Effect
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
      textareaRef.current.style.height = "auto"
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
      displayedContent: "",
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

      const fullContent = data.content || "Maaf, tidak ada respons yang dihasilkan."
      const thinking = data.thinking
      const suggestions = data.suggestions
      const relatedLink = data.relatedLink

      // Start Typewriter Stream
      let currentIndex = 0
      const totalLen = fullContent.length
      const stepSize = Math.max(2, Math.floor(totalLen / 120)) // Adaptive speed

      const streamTimer = setInterval(() => {
        if (streamAbortController.current) {
          clearInterval(streamTimer)
          setIsGenerating(false)
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
                            displayedContent: fullContent.slice(0, currentIndex),
                            isStreaming: false,
                            thinking,
                            suggestions,
                            relatedLink
                          }
                        : m
                    )
                  }
                : c
            )
          )
          return
        }

        currentIndex += stepSize
        if (currentIndex >= totalLen) {
          currentIndex = totalLen
          clearInterval(streamTimer)
          setIsGenerating(false)
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
                            displayedContent: fullContent,
                            isStreaming: false,
                            thinking,
                            suggestions,
                            relatedLink
                          }
                        : m
                    )
                  }
                : c
            )
          )
        } else {
          setConversations(prev =>
            prev.map(c =>
              c.id === activeChatId
                ? {
                    ...c,
                    messages: c.messages.map(m =>
                      m.id === assistantMsgId
                        ? {
                            ...m,
                            displayedContent: fullContent.slice(0, currentIndex),
                            thinking
                          }
                        : m
                    )
                  }
                : c
            )
          )
        }
      }, 15)

    } catch (err: any) {
      console.error(err)
      setIsGenerating(false)
      toast.error("Gagal memproses pesan: " + err.message)
      setConversations(prev =>
        prev.map(c =>
          c.id === activeChatId
            ? {
                ...c,
                messages: c.messages.map(m =>
                  m.id === assistantMsgId
                    ? {
                        ...m,
                        content: "Maaf, terjadi kesalahan saat menghubungi server SIMPEG.",
                        displayedContent: "Maaf, terjadi kesalahan saat menghubungi server SIMPEG.",
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
    toast.success("Teks berhasil disalin!")
    setTimeout(() => {
      setCopiedMap(prev => ({ ...prev, [id]: false }))
    }, 2000)
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

        {/* ChatGPT Dual-Panel Workspace */}
        <div className="flex-1 flex min-w-0 overflow-hidden relative">

          {/* ── LEFT PANEL: CHATGPT-STYLE CONVERSATION HISTORY SIDEBAR ── */}
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
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors shadow-xs group"
              >
                <span className="flex items-center gap-2">
                  <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" />
                  <span>Obrolan Baru</span>
                </span>
                <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded font-mono">⌘N</span>
              </button>

              {/* Search History */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari percakapan..."
                  value={searchHistory}
                  onChange={e => setSearchHistory(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-slate-100/70 dark:bg-zinc-900 border border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-zinc-800 outline-none text-slate-800 dark:text-zinc-200"
                />
              </div>
            </div>

            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                Riwayat Sesi
              </div>
              {filteredHistory.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400 dark:text-zinc-500">
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
                          ? "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-semibold"
                          : "text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800/60 hover:text-slate-900 dark:hover:text-zinc-100"
                      )}
                    >
                      <div className="flex items-center gap-2.5 truncate min-w-0 pr-2">
                        <MessageSquare className={cn("w-3.5 h-3.5 shrink-0", isActive ? "text-blue-600 dark:text-blue-400" : "text-slate-400")} />
                        <span className="truncate">{conv.title}</span>
                      </div>
                      <button
                        onClick={e => handleDeleteChat(e, conv.id)}
                        title="Hapus obrolan"
                        className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )
                })
              )}
            </div>

            {/* Sidebar Footer Info */}
            <div className="p-3 border-t border-slate-100 dark:border-zinc-800/80 text-[11px] text-slate-500 dark:text-zinc-400 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-medium">Tiara Engine 2.5</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">PDAM TAR</span>
            </div>
          </aside>

          {/* ── RIGHT PANEL: MAIN CHAT AREA (CHATGPT INTERFACE) ── */}
          <main className="flex-1 flex flex-col min-w-0 bg-[#F8FAFC] dark:bg-[#0B0C0E] h-full relative">

            {/* Sub-header Bar with Assistant Status */}
            <div className="h-14 px-4 sm:px-6 border-b border-slate-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-[#111113]/80 backdrop-blur-md flex items-center justify-between shrink-0 z-10">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSidebarOpen(prev => !prev)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                  title={sidebarOpen ? "Ciutkan Sidebar" : "Buka Sidebar Riwayat"}
                >
                  {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>

                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-2xs">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-zinc-100">
                        Tiara Assistant
                      </span>
                      <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-black bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white tracking-widest uppercase shadow-2xs">
                        AI
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-zinc-400 leading-none">
                      Asisten Cerdas Kepegawaian &bull; PDAM Tirta Ardhia Rinjani
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
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
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 max-w-4xl mx-auto w-full">
              
              {/* Empty / Welcome State */}
              {activeConversation.messages.length === 0 && (
                <div className="flex flex-col items-center justify-center min-h-[70%] text-center py-8">
                  {/* Glowing Animated Lottie Orb */}
                  <div className="w-32 h-32 relative flex items-center justify-center mb-4">
                    <div className="absolute inset-0 rounded-full bg-blue-500/20 blur-2xl animate-pulse" />
                    <TiaraAiOrb className="w-full h-full" />
                  </div>

                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/60 mb-3 shadow-2xs">
                    <Sparkles className="w-3 h-3 text-blue-600" />
                    <span>Tiara Intelligence &bull; SIMPEG PDAM TAR</span>
                  </div>

                  <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-zinc-100 tracking-tight">
                    Butuh Bantuan Kepegawaian?
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-2 max-w-lg leading-relaxed">
                    Saya Asisten Tiara, siap membantu analisis kehadiran real-time, regulasi BUP pensiun, kalkulasi PPh 21 TER, hingga pembuatan draf dokumen kedinasan resmi.
                  </p>

                  {/* Suggestion Cards Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full mt-8 text-left">
                    {DEFAULT_SUGGESTIONS.map((s, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleSendMessage(s.prompt)}
                        className="p-4 rounded-xl bg-white dark:bg-[#111113] border border-slate-200/80 dark:border-zinc-800/80 hover:border-blue-500/60 dark:hover:border-blue-500/60 hover:shadow-sm cursor-pointer transition-all group flex flex-col justify-between"
                      >
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 shrink-0 group-hover:scale-105 transition-transform">
                            <s.icon className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-slate-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                              {s.title}
                            </h4>
                            <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5 leading-normal">
                              {s.desc}
                            </p>
                          </div>
                        </div>
                        <div className="mt-3 flex items-center justify-end text-[11px] font-semibold text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
                          <span>Mulai Analisis</span>
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
                const contentToDisplay = msg.displayedContent ?? msg.content
                const isThinkingOpen = openThinkingMap[msg.id] ?? false
                const isCopied = copiedMap[msg.id] ?? false
                const feedback = feedbackMap[msg.id]

                return (
                  <div
                    key={msg.id || index}
                    className={cn(
                      "flex gap-3 sm:gap-4 transition-opacity duration-300",
                      isUser ? "justify-end" : "justify-start"
                    )}
                  >
                    {/* Assistant Avatar */}
                    {!isUser && (
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 flex items-center justify-center text-white shrink-0 shadow-2xs mt-0.5">
                        <Sparkles className="w-4 h-4" />
                      </div>
                    )}

                    {/* Message Body */}
                    <div className={cn("max-w-[88%] sm:max-w-[80%] space-y-2", isUser && "text-right")}>
                      
                      {/* USER BUBBLE */}
                      {isUser ? (
                        <div className="inline-block px-4 py-2.5 rounded-2xl bg-blue-600 text-white text-xs sm:text-[13px] font-normal leading-relaxed text-left shadow-xs">
                          {msg.content}
                        </div>
                      ) : (
                        /* ASSISTANT CARD / BUBBLE */
                        <div className="bg-white dark:bg-[#111113] border border-slate-200/80 dark:border-zinc-800/80 rounded-2xl p-4 sm:p-5 text-slate-800 dark:text-zinc-200 shadow-2xs space-y-3">
                          
                          {/* ── THINKING BLOCK (ChatGPT-o1 / DeepSeek Style) ── */}
                          {msg.thinking && (
                            <div className="rounded-xl border border-slate-200/70 dark:border-zinc-800/80 bg-slate-50/70 dark:bg-zinc-900/50 overflow-hidden text-xs">
                              <button
                                onClick={() => toggleThinking(msg.id)}
                                className="w-full flex items-center justify-between px-3.5 py-2 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 font-medium transition-colors"
                              >
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
                                  <span className="font-semibold text-[11px] text-blue-700 dark:text-blue-400">
                                    Proses Penalaran (Thinking) &bull; {msg.thinking.durationSeconds} detik
                                  </span>
                                </div>
                                <ChevronDown
                                  className={cn("w-3.5 h-3.5 transition-transform duration-200", isThinkingOpen && "rotate-180")}
                                />
                              </button>

                              {isThinkingOpen && (
                                <div className="px-3.5 pb-3 pt-1 border-t border-slate-200/60 dark:border-zinc-800/60 text-[11px] text-slate-500 dark:text-zinc-400 space-y-1.5 font-mono">
                                  {msg.thinking.steps.map((step, sIdx) => (
                                    <div key={sIdx} className="flex items-start gap-2">
                                      <span className="text-blue-500">&bull;</span>
                                      <span>{step}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                          {/* ── MARKDOWN CONTENT / TYPEWRITER ── */}
                          <div className="prose prose-sm dark:prose-invert max-w-none text-xs sm:text-[13px] leading-relaxed break-words space-y-2.5">
                            {contentToDisplay ? (
                              <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                  table: ({ node, ...props }) => (
                                    <div className="overflow-x-auto my-3 rounded-lg border border-slate-200 dark:border-zinc-800">
                                      <table className="min-w-full divide-y divide-slate-200 dark:divide-zinc-800 text-xs" {...props} />
                                    </div>
                                  ),
                                  thead: ({ node, ...props }) => (
                                    <thead className="bg-slate-50 dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 font-bold" {...props} />
                                  ),
                                  th: ({ node, ...props }) => (
                                    <th className="px-3 py-2 text-left font-semibold" {...props} />
                                  ),
                                  td: ({ node, ...props }) => (
                                    <td className="px-3 py-2 border-t border-slate-100 dark:border-zinc-800/80" {...props} />
                                  ),
                                  pre: ({ node, ...props }) => (
                                    <div className="relative group my-3">
                                      <pre className="p-3 rounded-xl bg-slate-900 dark:bg-black text-slate-100 text-xs overflow-x-auto font-mono" {...props} />
                                    </div>
                                  ),
                                  code: ({ node, ...props }) => (
                                    <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-blue-600 dark:text-blue-400 font-mono text-[11px]" {...props} />
                                  ),
                                  blockquote: ({ node, ...props }) => (
                                    <blockquote className="border-l-4 border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 px-3 py-2 rounded-r-lg italic text-slate-600 dark:text-zinc-300 my-2 text-xs" {...props} />
                                  )
                                }}
                              >
                                {contentToDisplay}
                              </ReactMarkdown>
                            ) : msg.isStreaming ? (
                              <div className="flex items-center gap-2 text-slate-400 py-1 text-xs">
                                <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" />
                                <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce [animation-delay:0.2s]" />
                                <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce [animation-delay:0.4s]" />
                                <span className="text-[11px] font-mono">Tiara Assistant sedang merumuskan jawaban...</span>
                              </div>
                            ) : null}

                            {/* Blinking Cursor while streaming */}
                            {msg.isStreaming && (
                              <span className="inline-block w-1.5 h-3.5 bg-blue-600 dark:bg-blue-400 ml-1 animate-pulse" />
                            )}
                          </div>

                          {/* ── CONTEXTUAL LINK BUTTON ── */}
                          {msg.relatedLink && !msg.isStreaming && (
                            <div className="pt-2">
                              <Link
                                href={msg.relatedLink.href}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 border border-blue-200/60 dark:border-blue-900/60 transition-colors shadow-2xs"
                              >
                                <span>{msg.relatedLink.text}</span>
                                <ExternalLink className="w-3 h-3" />
                              </Link>
                            </div>
                          )}

                          {/* ── FOLLOW-UP SUGGESTIONS CHIPS ── */}
                          {msg.suggestions && msg.suggestions.length > 0 && !msg.isStreaming && (
                            <div className="pt-2 border-t border-slate-100 dark:border-zinc-800/80 space-y-1.5">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                <Lightbulb className="w-3 h-3 text-amber-500" /> Saran Pertanyaan Lanjutan:
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                {msg.suggestions.map((sug, sIdx) => (
                                  <button
                                    key={sIdx}
                                    onClick={() => handleSendMessage(sug)}
                                    className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-100/80 dark:bg-zinc-800/70 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-slate-700 dark:text-zinc-300 hover:text-blue-600 dark:hover:text-blue-400 border border-slate-200/50 dark:border-zinc-700/50 transition-colors text-left"
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
                      <div className="w-8 h-8 rounded-xl bg-slate-800 dark:bg-zinc-700 flex items-center justify-center text-white shrink-0 shadow-2xs mt-0.5">
                        <UserIcon className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                )
              })}

              <div ref={messagesEndRef} />
            </div>

            {/* ── BOTTOM CHATGPT-STYLE INPUT DOCK ── */}
            <div className="shrink-0 p-4 sm:p-5 max-w-4xl mx-auto w-full">
              <div className="bg-white dark:bg-[#111113] border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-lg p-2.5 sm:p-3 transition-all focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 relative">
                
                {/* Auto-growing Textarea */}
                <textarea
                  ref={textareaRef}
                  value={inputPrompt}
                  onChange={e => {
                    setInputPrompt(e.target.value)
                    e.target.style.height = "auto"
                    e.target.style.height = `${Math.min(e.target.scrollHeight, 140)}px`
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Ketik pertanyaan untuk Tiara Assistant... (Tekan Enter untuk kirim, Shift+Enter untuk baris baru)"
                  rows={1}
                  disabled={isGenerating}
                  className="w-full bg-transparent resize-none outline-none text-xs sm:text-[13px] text-slate-800 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 px-2 py-1 max-h-[140px]"
                />

                {/* Dock Controls */}
                <div className="flex items-center justify-between pt-2 px-1 border-t border-slate-100 dark:border-zinc-800/60 mt-1">
                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="hidden sm:inline">Terhubung: Database SIMPEG PDAM TAR</span>
                  </div>

                  {/* Send / Stop Button */}
                  {isGenerating ? (
                    <button
                      onClick={handleStopGenerating}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition-colors shadow-xs"
                      title="Hentikan pembuatan respons"
                    >
                      <Square className="w-3.5 h-3.5 fill-current" />
                      <span>Hentikan</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleSendMessage()}
                      disabled={!inputPrompt.trim()}
                      className={cn(
                        "flex items-center justify-center h-8 w-8 rounded-xl transition-all shadow-xs",
                        inputPrompt.trim()
                          ? "bg-blue-600 hover:bg-blue-700 text-white cursor-pointer hover:scale-105"
                          : "bg-slate-100 dark:bg-zinc-800 text-slate-400 cursor-not-allowed"
                      )}
                      title="Kirim pesan"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Disclaimer */}
              <p className="text-[10px] text-center text-slate-400 dark:text-zinc-500 mt-2">
                Tiara Assistant dapat memproses data kepegawaian & regulasi PDAM Tirta Ardhia Rinjani. Verifikasi keputusan penting dengan Bagian Kepegawaian.
              </p>
            </div>

          </main>
        </div>
      </div>
    </div>
  )
}
