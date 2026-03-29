import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "../globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/components/auth/auth-provider"
import { MobileBottomNav } from "@/components/mobile/bottom-nav"
import { Toaster } from "sonner"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })

export const metadata: Metadata = {
  title: "SIMPEG Mobile",
  description: "SIMPEG PDAM Tirta Ardhia Rinjani",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "SIMPEG" },
}

export const viewport: Viewport = {
  themeColor: "#3730a3",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function MobileLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased bg-background`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <AuthProvider>
            <div className="flex min-h-screen flex-col">
              {/* Content — padded bottom for nav */}
              <main className="flex-1 overflow-y-auto pb-20">
                {children}
              </main>
              <MobileBottomNav />
            </div>
          </AuthProvider>
          <Toaster position="top-center" richColors toastOptions={{ style: { marginTop: 'var(--safe-area-inset-top, 40px)' } }} />
        </ThemeProvider>
      </body>
    </html>
  )
}
