import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "./prisma"
import bcrypt from "bcryptjs"

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string }
        })

        if (!user || !user.password) return null

        const isPasswordValid = bcrypt.compareSync(credentials.password as string, user.password)

        if (!isPasswordValid) return null

        return {
          id: user.id,
          email: user.email,
          role: user.role,
        }
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
  pages: {
    signIn: "/login",
  }
})
