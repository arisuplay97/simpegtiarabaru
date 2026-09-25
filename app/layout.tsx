import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from "sonner"
import './globals.css'

import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/components/auth/auth-provider"
import { AuthGuard } from "@/components/auth/guard"
import { SidebarProvider } from "@/components/simpeg/sidebar-nav"
import { PWARegister } from "@/components/pwa-register"
import { MobileRedirectWatcher } from "@/components/simpeg/mobile-redirect-watcher"

const inter = Inter({
  subsets: ["latin"],
  variable: '--font-inter'
})

export const metadata: Metadata = {
  title: "SIMPEG - PDAM Tirta Ardhia Rinjani",
  description: "Sistem Informasi Manajemen Kepegawaian PDAM Tirta Ardhia Rinjani",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black",
    title: "SIMPEG",
  },
  icons: {
    icon: [
      { url: "/favicon.PNG", sizes: "any" },
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/icon-192x192.png",
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  other: {
    "mobile-web-app-capable": "yes",
  }
}

export const viewport: Viewport = {
  themeColor: '#09090b',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <AuthProvider>
            <SidebarProvider>
              <AuthGuard>
                {children}
              </AuthGuard>
            </SidebarProvider>
          </AuthProvider>
          <Toaster 
            position="top-center" 
            richColors 
            closeButton
            toastOptions={{
              className: "rounded-2xl shadow-xl border border-zinc-200/80 dark:border-zinc-800 text-sm font-semibold p-4 max-w-sm mx-auto",
              style: {
                marginTop: "max(48px, calc(env(safe-area-inset-top) + 32px))",
                fontSize: "13.5px",
                lineHeight: "1.4"
              }
            }}
          />
          <PWARegister />
          <MobileRedirectWatcher />
        </ThemeProvider>
      </body>
    </html>
  )
}

