import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "../globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/components/auth/auth-provider"
import { MobileBottomNav } from "@/components/mobile/bottom-nav"
import { MobileOfflineSyncWatcher } from "@/components/mobile/offline-sync-watcher"
import { Toaster } from "sonner"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })

export const metadata: Metadata = {
  title: "ASIK Mobile",
  description: "ASIK Perumdam Tirta Ardhia Rinjani",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "ASIK" },
  icons: {
    icon: "/slip.png",
    shortcut: "/slip.png",
    apple: "/slip.png",
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function MobileLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased bg-zinc-50 dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 selection:bg-zinc-900 selection:text-white dark:selection:bg-white dark:selection:text-zinc-900`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthProvider>
            <MobileOfflineSyncWatcher />
            <div className="flex min-h-screen flex-col max-w-md mx-auto relative shadow-sm border-x border-zinc-200/50 dark:border-zinc-800/50">
              {/* Content — padded bottom for nav */}
              <main className="flex-1 overflow-y-auto">
                {children}
              </main>
              <MobileBottomNav />
            </div>
          </AuthProvider>
          <Toaster 
            position="top-center" 
            richColors 
            toastOptions={{ 
              style: { marginTop: "max(12px, env(safe-area-inset-top))" } 
            }} 
          />
        </ThemeProvider>
      </body>
    </html>
  )
}
