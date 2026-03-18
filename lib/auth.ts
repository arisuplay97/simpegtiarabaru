import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { prisma } from "./prisma"
import bcrypt from "bcryptjs"

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        // Demo Fallback (If DB fails or user not found)
        const demoUsers: Record<string, any> = {
          "superadmin@tiara.com": { id: "demo-1", name: "Super Admin", email: "superadmin@tiara.com", role: "SUPERADMIN" },
          "hrd@tiara.com": { id: "demo-2", name: "HRD Staff", email: "hrd@tiara.com", role: "HRD" },
          "direksi@tiara.com": { id: "demo-3", name: "Direktur Utama", email: "direksi@tiara.com", role: "DIREKSI" },
          "pegawai@tiara.com": { id: "demo-4", name: "Pegawai Tetap", email: "pegawai@tiara.com", role: "PEGAWAI" },
        }

        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email as string }
          })

          if (user && user.password && bcrypt.compareSync(credentials.password as string, user.password)) {
            return {
              id: user.id,
              email: user.email,
              role: user.role,
            }
          }
        } catch (error) {
          console.error("Database connection failed, using demo fallback")
        }

        // Check if it's a demo account with the default password
        if (demoUsers[credentials.email as string] && credentials.password === "123456") {
          return demoUsers[credentials.email as string]
        }

        return null
      }
    })
  ],
  callbacks: {
    jwt: ({ token, user }) => {
      if (user) {
        token.role = user.role
      }
      return token
    },
    session: ({ session, token }) => {
      if (session.user) {
        session.user.role = token.role as string
      }
      return session
    }
  },
  session: { strategy: "jwt" },
  trustHost: true,
  pages: {
    signIn: "/login",
  }
})
