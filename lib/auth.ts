import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { prisma } from "./prisma"
import bcrypt from "bcryptjs"

// Demo users dengan username (bukan email)
const demoUsers: Record<string, any> = {
  "superadmin": { id: "demo-1", name: "Dwiky Firmansyah", email: "superadmin@tiara.com", username: "superadmin", role: "SUPERADMIN", jabatan: "Super Admin HRIS", unitKerja: "IT & Sistem", mustChangePassword: false },
  "hrd":        { id: "demo-2", name: "Fitri Handayani",  email: "hrd@tiara.com",        username: "hrd",        role: "HRD",        jabatan: "Staff HRD",        unitKerja: "SDM & Umum", mustChangePassword: false },
  "direktur":   { id: "demo-3", name: "Ir. Gunawan Wibowo", email: "direktur@tiara.com", username: "direktur",   role: "DIREKSI",    jabatan: "Direktur Utama",   unitKerja: "Direksi", mustChangePassword: false },
  "pegawai":    { id: "demo-4", name: "Ahmad Rizki Pratama", email: "pegawai@tiara.com", username: "pegawai",    role: "PEGAWAI",    jabatan: "Kepala Bagian IT", unitKerja: "IT & Sistem", mustChangePassword: false },
}

const demoPasswords: Record<string, string> = {
  "superadmin": "admin123",
  "hrd":        "hrd123",
  "direktur":   "direktur123",
  "pegawai":    "pegawai123",
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null

        const username = (credentials.username as string).toLowerCase().trim()
        const password = credentials.password as string

        // Coba cari di database dulu (by email atau NIK)
        try {
          const user = await prisma.user.findFirst({
            where: {
              OR: [
                { email: { contains: username } },
                { pegawai: { nik: { contains: username } } }
              ]
            },
            include: {
              pegawai: true
            }
          })
          if (user && user.password && bcrypt.compareSync(password, user.password)) {
            return { 
              id: user.id, 
              email: user.email, 
              role: user.role, 
              name: user.pegawai?.nama || user.email,
              username: user.pegawai?.nik || user.email,
              jabatan: user.pegawai?.jabatan || "",
              unitKerja: user.pegawai?.bidangId || "",
              mustChangePassword: user.mustChangePassword,
            }
          }
        } catch (error) {
          console.error("Database connection failed, using demo fallback")
        }

        // Demo fallback via username
        if (demoUsers[username] && demoPasswords[username] === password) {
          return demoUsers[username]
        }

        return null
      }
    })
  ],
  callbacks: {
    jwt: ({ token, user, trigger, session }) => {
      if (user) {
        token.role = (user as any).role
        token.jabatan = (user as any).jabatan
        token.unitKerja = (user as any).unitKerja
        token.username = (user as any).username
        token.mustChangePassword = (user as any).mustChangePassword ?? false
      }
      if (trigger === "update" && session !== undefined) {
        token.mustChangePassword = session.mustChangePassword
      }
      return token
    },
    session: ({ session, token }) => {
      if (session.user) {
        ;(session.user as any).id = token.sub
        ;(session.user as any).role = token.role
        ;(session.user as any).jabatan = token.jabatan
        ;(session.user as any).unitKerja = token.unitKerja
        ;(session.user as any).username = token.username
        ;(session.user as any).mustChangePassword = token.mustChangePassword
      }
      return session
    }
  },
  session: { strategy: "jwt" },
  trustHost: true,
  pages: { signIn: "/login" }
})
