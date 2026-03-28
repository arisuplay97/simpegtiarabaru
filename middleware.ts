import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const userAgent = request.headers.get('user-agent') || ''
  const isMobile = Boolean(userAgent.match(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i))

  const url = request.nextUrl.clone()

  // Redirect root to mobile or desktop dashboard based on device
  if (url.pathname === '/') {
    url.pathname = isMobile ? '/m/dashboard' : '/dashboard'
    return NextResponse.redirect(url)
  }

  // Redirect /dashboard to /m/dashboard if mobile
  if (url.pathname === '/dashboard' && isMobile) {
    url.pathname = '/m/dashboard'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/', '/dashboard'],
}
