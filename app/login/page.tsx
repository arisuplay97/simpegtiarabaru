'use client'
import { signIn } from "next-auth/react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    const result = await signIn("credentials", { 
      email, 
      password, 
      redirect: false,
    })
    
    if (result?.error) {
      toast.error("Login gagal: Email atau password salah")
    } else {
      toast.success("Berhasil masuk")
      router.push("/dashboard")
      router.refresh()
    }
    setIsLoading(false)
  }

  const quickLogin = async (role: string) => {
    setIsLoading(true)
    await signIn("credentials", { 
      email: `${role.toLowerCase()}@tiara.com`, 
      password: "123456", 
      redirect: true,
      callbackUrl: "/dashboard"
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-950 to-black p-4">
      <Card className="w-full max-w-md p-8 shadow-2xl bg-white/10 backdrop-blur-md border-white/20 text-white">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold tracking-tight mb-2">SIMPEG Tiara</h1>
          <p className="text-blue-200">Sistem Informasi Manajemen Kepegawaian</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-blue-100">Email</Label>
            <Input 
              id="email" 
              type="email" 
              placeholder="nama@tiara.com" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-blue-500"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-blue-100">Password</Label>
            <Input 
              id="password" 
              type="password" 
              placeholder="••••••••" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-blue-500"
              required
            />
          </div>
          <Button type="submit" disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-all duration-200 shadow-lg">
            {isLoading ? "Memuat..." : "Masuk ke Sistem"}
          </Button>
        </form>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-white/10"></span>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-transparent px-2 text-blue-300 backdrop-blur-md">Uji Coba Demo</span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <Button onClick={() => quickLogin("superadmin")} variant="outline" className="border-white/20 hover:bg-white/10 text-blue-200">
            Login Superadmin
          </Button>
          <div className="grid grid-cols-2 gap-3">
            <Button onClick={() => quickLogin("hrd")} variant="outline" className="border-white/20 hover:bg-white/10 text-blue-200">
              Login HRD
            </Button>
            <Button onClick={() => quickLogin("direksi")} variant="outline" className="border-white/20 hover:bg-white/10 text-blue-200">
              Login Direksi
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
