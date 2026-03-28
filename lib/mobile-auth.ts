import { NextResponse } from "next/server"
import { SignJWT, jwtVerify } from "jose"

const SECRET = new TextEncoder().encode(
  process.env.MOBILE_JWT_SECRET || process.env.NEXTAUTH_SECRET || "mobile-secret-key"
)

export async function signMobileToken(payload: Record<string, any>): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(SECRET)
}

export async function verifyMobileToken(token: string): Promise<any> {
  const { payload } = await jwtVerify(token, SECRET)
  return payload
}

export function getMobileToken(req: Request): string | null {
  const auth = req.headers.get("Authorization")
  if (auth?.startsWith("Bearer ")) return auth.slice(7)
  return null
}

export async function requireMobileAuth(req: Request): Promise<{ payload: any } | NextResponse> {
  const token = getMobileToken(req)
  if (!token) {
    return NextResponse.json({ error: "Token tidak ditemukan" }, { status: 401 })
  }
  try {
    const payload = await verifyMobileToken(token)
    return { payload }
  } catch {
    return NextResponse.json({ error: "Token tidak valid atau sudah kedaluwarsa" }, { status: 401 })
  }
}
