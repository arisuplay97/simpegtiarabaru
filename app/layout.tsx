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
    statusBarStyle: "black-translucent",
    title: "SIMPEG",
  },
  icons: {
    apple: "/apple-icon.png?v=5",
    icon: "/logo-tar.png?v=5",
  },
  other: {
    "mobile-web-app-capable": "yes",
  }
}

export const viewport: Viewport = {
  themeColor: '#1e3a5f',
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
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <AuthProvider>
            <SidebarProvider>
              <AuthGuard>
                {children}
              </AuthGuard>
            </SidebarProvider>
          </AuthProvider>
          <Analytics />
          <Toaster position="top-right" richColors />
          <PWARegister />
        </ThemeProvider>
      </body>
    </html>
  )
}

