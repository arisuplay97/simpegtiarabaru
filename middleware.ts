import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

function detectIsMobile(request: NextRequest): boolean {
  // 1. User manual override cookie (simpeg_view)
  const viewCookie = request.cookies.get('simpeg_view')?.value
  if (viewCookie === 'desktop') return false
  if (viewCookie === 'mobile') return true

  // 2. Client Hints header (Chromium: Chrome, Edge, Samsung Internet, Opera)
  // ?0 explicitly means Desktop mode (or "Request Desktop Site" enabled on mobile)
  // ?1 means Mobile mode
  const secChUaMobile = request.headers.get('sec-ch-ua-mobile')
  if (secChUaMobile === '?0') return false
  if (secChUaMobile === '?1') return true

  // 3. User-Agent parsing
  const ua = request.headers.get('user-agent') || ''

  // Android: When "Desktop site" is requested in mobile browsers (Chrome / Samsung Internet),
  // the "Mobile" token is removed, but "Android" remains.
  // Standard phone mobile UA has BOTH "Android" AND "Mobile".
  if (/Android/i.test(ua)) {
    return /Mobile/i.test(ua)
  }

  // iOS Safari:
  // When "Request Desktop Website" is requested, Safari sends "Macintosh; Intel Mac OS X..." without "iPhone".
  // Normal iPhone sends "iPhone".
  if (/iPhone|iPod/i.test(ua)) {
    return true
  }

  // iPad (iPadOS sends Macintosh or iPad) -> treat as desktop/tablet mode
  if (/iPad/i.test(ua)) {
    return false
  }

  // Other mobile platforms
  if (/BlackBerry|IEMobile|Opera Mini|Windows Phone/i.test(ua)) {
    return true
  }

  return false
}

function mapMobileToDesktop(pathname: string): string {
  if (pathname === '/m' || pathname === '/m/dashboard') return '/dashboard'
  if (pathname === '/m/absensi' || pathname === '/m/fingerprint' || pathname === '/m/radar') return '/absensi'
  if (pathname === '/m/kalender') return '/kalender'
  if (pathname === '/m/cuti') return '/cuti'
  if (pathname === '/m/profil') return '/pegawai/profil'
  if (pathname === '/m/lembur') return '/lembur'
  if (pathname === '/m/slip-gaji') return '/slip-gaji'
  if (pathname === '/m/notifikasi') return '/notifikasi'
  if (pathname === '/m/indeks') return '/indeks'
  if (pathname.startsWith('/m/settings/lokasi')) return '/settings/lokasi'
  if (pathname.startsWith('/m/settings')) return '/settings/sistem'
  return '/dashboard'
}

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone()

  // Handle explicit query parameter override: ?view=desktop or ?view=mobile
  const viewQuery = url.searchParams.get('view')
  if (viewQuery === 'desktop' || viewQuery === 'mobile') {
    url.searchParams.delete('view')
    const targetPath = viewQuery === 'desktop'
      ? (url.pathname.startsWith('/m') ? mapMobileToDesktop(url.pathname) : url.pathname)
      : (url.pathname.startsWith('/m') ? url.pathname : '/m/dashboard')

    url.pathname = targetPath
    const response = NextResponse.redirect(url)
    response.cookies.set('simpeg_view', viewQuery, {
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      sameSite: 'lax',
    })
    return response
  }

  const isMobile = detectIsMobile(request)

  // Redirect root to mobile or desktop dashboard based on device
  if (url.pathname === '/') {
    url.pathname = isMobile ? '/m/dashboard' : '/dashboard'
    return NextResponse.redirect(url)
  }

  // Redirect /dashboard to /m/dashboard if on mobile (and not forced desktop)
  if (url.pathname === '/dashboard' && isMobile) {
    url.pathname = '/m/dashboard'
    return NextResponse.redirect(url)
  }

  // Redirect /m/* (PWA routes) to desktop equivalent if desktop browser or desktop mode
  if ((url.pathname === '/m' || url.pathname.startsWith('/m/')) && !isMobile) {
    url.pathname = mapMobileToDesktop(url.pathname)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/', '/dashboard', '/m', '/m/:path*'],
}
