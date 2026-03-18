import NextAuth, { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      role: string
      username?: string
      jabatan?: string
      unitKerja?: string
    } & DefaultSession["user"]
  }

  interface User {
    role: string
    username?: string
    jabatan?: string
    unitKerja?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string
    username?: string
    jabatan?: string
    unitKerja?: string
  }
}
