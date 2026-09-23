import NextAuth, { CredentialsSignin } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { prisma } from "./prisma"
import bcrypt from "bcryptjs"

class DeviceMismatchError extends CredentialsSignin {
  code = "DeviceMismatch"
}

// Demo users dengan username (bukan email)
const demoUsers: Record<string, any> = {
  "superadmin": { id: "00000000-0000-4000-8000-000000000001", name: "Dwiky Firmansyah", email: "superadmin@tiara.com", username: "superadmin", role: "SUPERADMIN", jabatan: "Super Admin HRIS", unitKerja: "IT & Sistem", mustChangePassword: false },
  "hrd":        { id: "00000000-0000-4000-8000-000000000002", name: "Fitri Handayani",  email: "hrd@tiara.com",        username: "hrd",        role: "HRD",        jabatan: "Staff HRD",        unitKerja: "SDM & Umum", mustChangePassword: false },
  "direktur":   { id: "00000000-0000-4000-8000-000000000003", name: "Ir. Gunawan Wibowo", email: "direktur@tiara.com", username: "direktur",   role: "DIREKSI",    jabatan: "Direktur Utama",   unitKerja: "Direksi", mustChangePassword: false },
  "pegawai":    { id: "00000000-0000-4000-8000-000000000004", name: "Ahmad Rizki Pratama", email: "pegawai@tiara.com", username: "pegawai",    role: "PEGAWAI",    jabatan: "Kepala Bagian IT", unitKerja: "IT & Sistem", mustChangePassword: false },
}

const demoPasswords: Record<string, string> = {
  "superadmin": "admin123",
  "hrd":        "hrd123",
  "direktur":   "direktur123",
  "pegawai":    "pegawai123",
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET || "any_long_random_string_for_demo_purposes_simpeg_2026",
  providers: [
    Credentials({
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
        deviceId: { label: "Device ID", type: "text" }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null

        const username = (credentials.username as string).toLowerCase().trim()
        const password = credentials.password as string
        const deviceId = credentials.deviceId as string | undefined

        // Cari di database berdasarkan NIK pegawai, username akun, atau email
        try {
          const user = await prisma.user.findFirst({
            where: {
              OR: [
                { pegawai: { nik: { equals: username, mode: "insensitive" } } },
                { username: { equals: username, mode: "insensitive" } },
                { email: { equals: username, mode: "insensitive" } },
                { email: { equals: `${username}@tiara.com`, mode: "insensitive" } },
                { email: { equals: `${username}@tiara.id`, mode: "insensitive" } },
                { email: { startsWith: `${username}@`, mode: "insensitive" } },
              ]
            },
            include: {
              pegawai: true
            }
          })
          if (user && user.password && bcrypt.compareSync(password, user.password)) {
            // --- DEVICE ID BINDING LOGIC ---
            if (user.role !== "SUPERADMIN" && user.pegawai && deviceId) {
              const currentDeviceId = user.pegawai.deviceId
              if (!currentDeviceId) {
                // First time login - bind device
                await prisma.pegawai.update({
                  where: { id: user.pegawai.id },
                  data: { deviceId }
                })
              } else if (currentDeviceId !== deviceId) {
                // Device mismatch
                throw new DeviceMismatchError()
              }
            }

            return { 
              id: user.id, 
              email: user.email, 
              role: user.role, 
              name: user.pegawai?.nama || user.username || user.email,
              username: user.pegawai?.nik || user.username || user.email.split("@")[0],
              jabatan: user.pegawai?.jabatan || "",
              unitKerja: user.pegawai?.bidangId || "",
              mustChangePassword: user.mustChangePassword,
              image: user.pegawai?.fotoUrl || null,
              pegawaiId: user.pegawai?.id || null,
            }
          }
        } catch (error: any) {
          if (error instanceof DeviceMismatchError || error.code === "DeviceMismatch" || error.message === "DeviceMismatch") {
            throw new DeviceMismatchError()
          }
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
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.role = (user as any).role
        token.jabatan = (user as any).jabatan
        token.unitKerja = (user as any).unitKerja
        token.username = (user as any).username
        token.mustChangePassword = (user as any).mustChangePassword ?? false
        token.picture = (user as any).image || null
        token.pegawaiId = (user as any).pegawaiId || null
      }

      // Re-query role & pegawai terkini dari database agar perubahan role (misal: HRD) langsung aktif di PWA
      if (token.sub) {
        try {
          const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
          if (UUID_REGEX.test(token.sub)) {
            const dbUser = await prisma.user.findUnique({
              where: { id: token.sub },
              select: {
                role: true,
                mustChangePassword: true,
                pegawai: { select: { id: true, jabatan: true, fotoUrl: true } }
              }
            })
            if (dbUser) {
              token.role = dbUser.role
              token.mustChangePassword = dbUser.mustChangePassword
              if (dbUser.pegawai) {
                token.pegawaiId = dbUser.pegawai.id
                token.jabatan = dbUser.pegawai.jabatan
                if (dbUser.pegawai.fotoUrl) token.picture = dbUser.pegawai.fotoUrl
              }
            }
          }
        } catch {}
      }

      if (trigger === "update" && session !== undefined) {
        token.mustChangePassword = session.mustChangePassword
        if (session.picture !== undefined) token.picture = session.picture
        if (session.role !== undefined) token.role = session.role
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
        ;(session.user as any).image = token.picture || null
        ;(session.user as any).pegawaiId = token.pegawaiId || null
      }
      return session
    }
  },
  session: { strategy: "jwt" },
  trustHost: true,
  pages: { signIn: "/login" }
})
