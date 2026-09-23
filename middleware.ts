import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

function detectIsMobile(request: NextRequest): { isMobile: boolean; shouldClearCookie: boolean } {
  const ua = request.headers.get('user-agent') || ''
  const secChUaMobile = request.headers.get('sec-ch-ua-mobile')
  const viewCookie = request.cookies.get('simpeg_view')?.value

  // 1. Explicit native browser mobile signals
  // - Chromium mobile sends sec-ch-ua-mobile: ?1
  // - Safari iOS mobile sends iPhone/iPod
  // - Android mobile sends Android WITH Mobile token
  const isNativeMobile =
    secChUaMobile === '?1' ||
    /iPhone|iPod|BlackBerry|IEMobile|Opera Mini|Windows Phone/i.test(ua) ||
    (/Android/i.test(ua) && /Mobile/i.test(ua))

  // 2. Explicit native browser desktop signals
  // - Chromium desktop / "Desktop site" mode sends sec-ch-ua-mobile: ?0
  // - Android "Desktop site" mode strips "Mobile" token
  // - Safari iOS "Request Desktop Website" sends "Macintosh" without iPhone
  // - Standard desktop OS (Windows NT, Linux x86_64, Mac)
  const isNativeDesktop =
    secChUaMobile === '?0' ||
    (/Android/i.test(ua) && !/Mobile/i.test(ua)) ||
    (/Macintosh/i.test(ua) && !/iPhone|iPad/i.test(ua)) ||
    /Windows NT|X11; Linux x86_64/i.test(ua)

  // Native browser state ALWAYS takes precedence over stale cookies!
  // When user switches back to mobile site in browser:
  if (isNativeMobile) {
    return { isMobile: true, shouldClearCookie: viewCookie === 'desktop' }
  }

  // When user switches to desktop site in browser:
  if (isNativeDesktop) {
    return { isMobile: false, shouldClearCookie: viewCookie === 'mobile' }
  }

  // iPad: treat as tablet/desktop
  if (/iPad/i.test(ua)) {
    return { isMobile: false, shouldClearCookie: false }
  }

  // 3. Fallback to manual override cookie if browser headers are neutral
  if (viewCookie === 'desktop') return { isMobile: false, shouldClearCookie: false }
  if (viewCookie === 'mobile') return { isMobile: true, shouldClearCookie: false }

  const fallbackMobile = Boolean(ua.match(/Android.*Mobile|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i))
  return { isMobile: fallbackMobile, shouldClearCookie: false }
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

const desktopToMobileMap: Record<string, string> = {
  '/': '/m/dashboard',
  '/dashboard': '/m/dashboard',
  '/absensi': '/m/fingerprint',
  '/kalender': '/m/kalender',
  '/cuti': '/m/cuti',
  '/lembur': '/m/lembur',
  '/slip-gaji': '/m/slip-gaji',
  '/notifikasi': '/m/notifikasi',
  '/indeks': '/m/indeks',
  '/pegawai/profil': '/m/profil',
}

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone()

  // Handle explicit query parameter override: ?view=desktop or ?view=mobile
  const viewQuery = url.searchParams.get('view')
  if (viewQuery === 'desktop' || viewQuery === 'mobile') {
    url.searchParams.delete('view')
    const targetPath = viewQuery === 'desktop'
      ? (url.pathname.startsWith('/m') ? mapMobileToDesktop(url.pathname) : url.pathname)
      : (url.pathname.startsWith('/m') ? url.pathname : (desktopToMobileMap[url.pathname] || '/m/dashboard'))

    url.pathname = targetPath
    const response = NextResponse.redirect(url)
    response.cookies.set('simpeg_view', viewQuery, {
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      sameSite: 'lax',
    })
    return response
  }

  const { isMobile, shouldClearCookie } = detectIsMobile(request)

  let response: NextResponse | null = null

  if (isMobile) {
    // If on mobile mode, redirect desktop routes to mobile equivalent
    const targetMobile = desktopToMobileMap[url.pathname]
    if (targetMobile) {
      url.pathname = targetMobile
      response = NextResponse.redirect(url)
    }
  } else {
    // If on desktop mode, redirect /m/* routes to desktop equivalent
    if (url.pathname === '/m' || url.pathname.startsWith('/m/')) {
      url.pathname = mapMobileToDesktop(url.pathname)
      response = NextResponse.redirect(url)
    }
  }

  if (response) {
    if (shouldClearCookie) {
      response.cookies.delete('simpeg_view')
    }
    return response
  }

  const res = NextResponse.next()
  if (shouldClearCookie) {
    res.cookies.delete('simpeg_view')
  }
  return res
}

export const config = {
  matcher: [
    '/',
    '/dashboard',
    '/absensi',
    '/kalender',
    '/cuti',
    '/lembur',
    '/slip-gaji',
    '/notifikasi',
    '/indeks',
    '/pegawai/profil',
    '/m',
    '/m/:path*',
  ],
}
