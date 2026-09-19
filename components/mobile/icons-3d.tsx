import React from "react"

interface Icon3DProps {
  className?: string
  size?: number
}

/**
 * 1. ICON CUTI & IZIN 3D
 * Kalender cuti 3D dengan binder cincin, aksen daun tropis liburan, dan badge approved
 */
export function IconCuti3D({ className = "w-8 h-8", size }: Icon3DProps) {
  const s = size || 36
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        {/* Shadow filter */}
        <filter id="cuti-shadow" x="-10%" y="-10%" width="130%" height="135%" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="3" stdDeviation="2.5" floodColor="#f43f5e" floodOpacity="0.25" />
          <feDropShadow dx="0" dy="1" stdDeviation="1" floodColor="#000000" floodOpacity="0.15" />
        </filter>
        {/* Back page gradient */}
        <linearGradient id="cuti-back" x1="10" y1="12" x2="38" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#cbd5e1" />
          <stop offset="100%" stopColor="#94a3b8" />
        </linearGradient>
        {/* Main calendar body */}
        <linearGradient id="cuti-body" x1="8" y1="14" x2="38" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="60%" stopColor="#f8fafc" />
          <stop offset="100%" stopColor="#e2e8f0" />
        </linearGradient>
        {/* Calendar top header (Coral / Rose 3D) */}
        <linearGradient id="cuti-header" x1="6" y1="8" x2="40" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fb7185" />
          <stop offset="50%" stopColor="#f43f5e" />
          <stop offset="100%" stopColor="#e11d48" />
        </linearGradient>
        {/* Metallic rings */}
        <linearGradient id="cuti-ring" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f8fafc" />
          <stop offset="40%" stopColor="#94a3b8" />
          <stop offset="100%" stopColor="#475569" />
        </linearGradient>
        {/* Palm Leaf / Vacation Accent */}
        <linearGradient id="cuti-leaf" x1="24" y1="22" x2="42" y2="42" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
        {/* Check badge */}
        <linearGradient id="cuti-badge" x1="28" y1="28" x2="44" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>
      </defs>

      {/* 3D Depth Back Layer */}
      <rect x="10" y="12" width="30" height="30" rx="7" fill="url(#cuti-back)" />
      
      {/* 3D Main Page Body */}
      <g filter="url(#cuti-shadow)">
        <rect x="7" y="10" width="32" height="32" rx="7" fill="url(#cuti-body)" />
        {/* Calendar grid dots/lines */}
        <rect x="12" y="24" width="4" height="3" rx="1" fill="#cbd5e1" />
        <rect x="19" y="24" width="4" height="3" rx="1" fill="#cbd5e1" />
        <rect x="26" y="24" width="4" height="3" rx="1" fill="#cbd5e1" />
        <rect x="12" y="30" width="4" height="3" rx="1" fill="#cbd5e1" />
        <rect x="19" y="30" width="4" height="3" rx="1" fill="#fb7185" opacity="0.8" />
        <rect x="26" y="30" width="4" height="3" rx="1" fill="#fb7185" />
        <rect x="12" y="36" width="4" height="3" rx="1" fill="#fb7185" />
      </g>

      {/* 3D Top Header Bar */}
      <path
        d="M7 17C7 13.134 10.134 10 14 10H32C35.866 10 39 13.134 39 17V19H7V17Z"
        fill="url(#cuti-header)"
      />
      {/* Header Gloss Highlight */}
      <path
        d="M8 12C9.5 11 12 10.5 16 10.5H30C34 10.5 36.5 11 38 12"
        stroke="#ffffff"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.6"
      />

      {/* Ring Binders */}
      <rect x="13" y="6" width="3.5" height="8" rx="1.75" fill="url(#cuti-ring)" />
      <rect x="21" y="6" width="3.5" height="8" rx="1.75" fill="url(#cuti-ring)" />
      <rect x="29" y="6" width="3.5" height="8" rx="1.75" fill="url(#cuti-ring)" />

      {/* Floating 3D Check Badge (Approval Cuti) */}
      <g filter="url(#cuti-shadow)">
        <circle cx="35" cy="35" r="9" fill="url(#cuti-badge)" />
        <circle cx="35" cy="35" r="8" stroke="#ffffff" strokeWidth="1" opacity="0.4" />
        <path
          d="M31.5 35L34 37.5L38.5 32.5"
          stroke="#ffffff"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  )
}

/**
 * 2. ICON RIWAYAT ABSEN 3D
 * Papan klip presensi 3D dengan jam dinding mini dan checkmark 3D
 */
export function IconAbsensi3D({ className = "w-8 h-8", size }: Icon3DProps) {
  const s = size || 36
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <filter id="absen-shadow" x="-10%" y="-10%" width="130%" height="135%" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="3" stdDeviation="2.5" floodColor="#0284c7" floodOpacity="0.25" />
          <feDropShadow dx="0" dy="1" stdDeviation="1" floodColor="#000000" floodOpacity="0.15" />
        </filter>
        {/* Board gradient (Matte leather / clay) */}
        <linearGradient id="board-bg" x1="6" y1="8" x2="38" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="50%" stopColor="#0284c7" />
          <stop offset="100%" stopColor="#0369a1" />
        </linearGradient>
        {/* Paper sheet */}
        <linearGradient id="paper-bg" x1="10" y1="12" x2="36" y2="42" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#f1f5f9" />
        </linearGradient>
        {/* Clip metal gradient */}
        <linearGradient id="clip-metal" x1="16" y1="4" x2="28" y2="12" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#f8fafc" />
          <stop offset="50%" stopColor="#94a3b8" />
          <stop offset="100%" stopColor="#475569" />
        </linearGradient>
        {/* Clock 3D */}
        <linearGradient id="clock-3d" x1="28" y1="26" x2="44" y2="42" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#0284c7" />
        </linearGradient>
      </defs>

      {/* Main Board Base */}
      <g filter="url(#absen-shadow)">
        <rect x="7" y="8" width="30" height="36" rx="6" fill="url(#board-bg)" />
        {/* Clip Board highlight */}
        <rect x="8" y="9" width="28" height="34" rx="5" stroke="#ffffff" strokeWidth="0.8" opacity="0.3" />
      </g>

      {/* Inner Paper Sheet */}
      <rect x="10.5" y="14" width="23" height="27" rx="3.5" fill="url(#paper-bg)" />

      {/* Checklist Rows */}
      <g>
        {/* Row 1 */}
        <circle cx="15" cy="20" r="2.2" fill="#10b981" />
        <rect x="19" y="19" width="11" height="2" rx="1" fill="#94a3b8" />
        {/* Row 2 */}
        <circle cx="15" cy="25" r="2.2" fill="#10b981" />
        <rect x="19" y="24" width="9" height="2" rx="1" fill="#94a3b8" />
        {/* Row 3 */}
        <circle cx="15" cy="30" r="2.2" fill="#10b981" />
        <rect x="19" y="29" width="7" height="2" rx="1" fill="#cbd5e1" />
        {/* Row 4 */}
        <circle cx="15" cy="35" r="2.2" fill="#38bdf8" />
        <rect x="19" y="34" width="8" height="2" rx="1" fill="#cbd5e1" />
      </g>

      {/* Top Clip Mechanism */}
      <rect x="17" y="5" width="10" height="6" rx="2.5" fill="url(#clip-metal)" />
      <circle cx="22" cy="7" r="1.2" fill="#1e293b" opacity="0.3" />

      {/* Floating 3D Mini Clock Badge */}
      <g filter="url(#absen-shadow)">
        <circle cx="35" cy="34" r="8.5" fill="url(#clock-3d)" />
        <circle cx="35" cy="34" r="7.5" fill="#ffffff" />
        {/* Clock Hands */}
        <circle cx="35" cy="34" r="1" fill="#0284c7" />
        <path d="M35 30V34L37.5 35.5" stroke="#0284c7" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="35" cy="34" r="7.5" stroke="#38bdf8" strokeWidth="0.8" opacity="0.4" />
      </g>
    </svg>
  )
}

/**
 * 3. ICON KALENDER KERJA 3D
 * Kalender jadwal 3D dengan binder spiral dan penanda acara warna-warni
 */
export function IconKalender3D({ className = "w-8 h-8", size }: Icon3DProps) {
  const s = size || 36
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <filter id="kalender-shadow" x="-10%" y="-10%" width="130%" height="135%" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="3" stdDeviation="2.5" floodColor="#6366f1" floodOpacity="0.25" />
          <feDropShadow dx="0" dy="1" stdDeviation="1" floodColor="#000000" floodOpacity="0.15" />
        </filter>
        {/* Stand Calendar Base */}
        <linearGradient id="cal-stand" x1="6" y1="36" x2="42" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#4338ca" />
          <stop offset="100%" stopColor="#312e81" />
        </linearGradient>
        {/* Page Gradient */}
        <linearGradient id="cal-page" x1="9" y1="12" x2="39" y2="38" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="70%" stopColor="#f8fafc" />
          <stop offset="100%" stopColor="#e0e7ff" />
        </linearGradient>
        {/* Calendar Indigo Header */}
        <linearGradient id="cal-header" x1="9" y1="10" x2="39" y2="20" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#818cf8" />
          <stop offset="50%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#4f46e5" />
        </linearGradient>
        {/* Event Pin 3D */}
        <linearGradient id="cal-pin" x1="28" y1="26" x2="42" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
      </defs>

      {/* Desk Stand Base */}
      <path d="M6 38L10 43H38L42 38H6Z" fill="url(#cal-stand)" opacity="0.6" />

      {/* Main Calendar Body */}
      <g filter="url(#kalender-shadow)">
        <rect x="8" y="10" width="32" height="30" rx="6" fill="url(#cal-page)" />
        <rect x="9" y="11" width="30" height="28" rx="5" stroke="#ffffff" strokeWidth="0.8" opacity="0.6" />
      </g>

      {/* Top Header */}
      <path
        d="M8 16C8 12.686 10.686 10 14 10H34C37.314 10 40 12.686 40 16V19H8V16Z"
        fill="url(#cal-header)"
      />
      {/* Subtle shine on header */}
      <line x1="10" y1="11.5" x2="38" y2="11.5" stroke="#ffffff" strokeWidth="1" strokeLinecap="round" opacity="0.5" />

      {/* Spiral Wire Binders */}
      {[13, 19, 25, 31].map((pos) => (
        <g key={pos}>
          <rect x={pos} y="7" width="2.5" height="6" rx="1.25" fill="#475569" />
          <rect x={pos + 0.3} y="7.3" width="1.2" height="5" rx="0.6" fill="#cbd5e1" opacity="0.8" />
        </g>
      ))}

      {/* Grid of Work Dates */}
      <g>
        <circle cx="14" cy="24" r="1.8" fill="#94a3b8" />
        <circle cx="20" cy="24" r="1.8" fill="#94a3b8" />
        <circle cx="26" cy="24" r="1.8" fill="#6366f1" />
        <circle cx="32" cy="24" r="1.8" fill="#94a3b8" />

        <circle cx="14" cy="30" r="1.8" fill="#94a3b8" />
        <circle cx="20" cy="30" r="2.2" fill="#ef4444" />
        <circle cx="26" cy="30" r="1.8" fill="#94a3b8" />
        <circle cx="32" cy="30" r="1.8" fill="#10b981" />

        <circle cx="14" cy="35" r="1.8" fill="#94a3b8" />
        <circle cx="20" cy="35" r="1.8" fill="#94a3b8" />
        <circle cx="26" cy="35" r="2.2" fill="#f59e0b" />
      </g>

      {/* Floating 3D Star / Event Pin */}
      <g filter="url(#kalender-shadow)">
        <circle cx="35" cy="33" r="7.5" fill="url(#cal-pin)" />
        <path
          d="M35 28.5L36.3 31.7L39.7 32.1L37.1 34.3L37.8 37.6L35 35.9L32.2 37.6L32.9 34.3L30.3 32.1L33.7 31.7L35 28.5Z"
          fill="#ffffff"
        />
      </g>
    </svg>
  )
}

/**
 * 4. ICON INDEKS KINERJA 3D
 * Piala trofi emas 3D berkilau dengan diagram batang naik dan panah pertumbuhan
 */
export function IconKinerja3D({ className = "w-8 h-8", size }: Icon3DProps) {
  const s = size || 36
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <filter id="kinerja-shadow" x="-10%" y="-10%" width="130%" height="135%" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="3" stdDeviation="2.5" floodColor="#eab308" floodOpacity="0.3" />
          <feDropShadow dx="0" dy="1" stdDeviation="1" floodColor="#000000" floodOpacity="0.15" />
        </filter>
        {/* Gold Trophy Gradients */}
        <linearGradient id="trophy-gold" x1="14" y1="8" x2="34" y2="36" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="30%" stopColor="#eab308" />
          <stop offset="70%" stopColor="#ca8a04" />
          <stop offset="100%" stopColor="#a16207" />
        </linearGradient>
        {/* Trophy Base */}
        <linearGradient id="trophy-base" x1="16" y1="36" x2="32" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#92400e" />
          <stop offset="50%" stopColor="#78350f" />
          <stop offset="100%" stopColor="#451a03" />
        </linearGradient>
        {/* Growth Arrow Gradient */}
        <linearGradient id="growth-arrow" x1="28" y1="8" x2="42" y2="24" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
      </defs>

      {/* Rising Chart Pillars (Background 3D) */}
      <rect x="6" y="28" width="5" height="14" rx="2" fill="#10b981" opacity="0.35" />
      <rect x="13" y="22" width="5" height="20" rx="2" fill="#10b981" opacity="0.55" />
      <rect x="37" y="16" width="5" height="26" rx="2" fill="#10b981" opacity="0.4" />

      {/* Main 3D Golden Trophy Cup */}
      <g filter="url(#kinerja-shadow)">
        {/* Handles */}
        <path
          d="M13 14H17M13 14C9.5 14 8 18 10 22C11.5 25 15 25.5 17 25.5"
          stroke="#ca8a04"
          strokeWidth="3.2"
          strokeLinecap="round"
        />
        <path
          d="M35 14H31M35 14C38.5 14 40 18 38 22C36.5 25 33 25.5 31 25.5"
          stroke="#ca8a04"
          strokeWidth="3.2"
          strokeLinecap="round"
        />

        {/* Cup Body */}
        <path
          d="M16 11C16 9.895 16.895 9 18 9H30C31.105 9 32 9.895 32 11V21C32 25.418 28.418 29 24 29C19.582 29 16 25.418 16 21V11Z"
          fill="url(#trophy-gold)"
        />
        {/* Specular Light Reflection */}
        <path
          d="M18.5 11.5C18.5 11.5 20 20 20.5 22"
          stroke="#ffffff"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.75"
        />

        {/* Cup Stem */}
        <path d="M22 29H26V36H22V29Z" fill="url(#trophy-gold)" />

        {/* Cup Base */}
        <path d="M16 36H32L34 42H14L16 36Z" fill="url(#trophy-base)" />
        <rect x="18" y="38" width="12" height="2" rx="0.8" fill="#fde047" opacity="0.8" />
      </g>

      {/* 3D Ascending Growth Arrow */}
      <g filter="url(#kinerja-shadow)">
        <path
          d="M26 18L35 9M35 9H29M35 9V15"
          stroke="url(#growth-arrow)"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  )
}

/**
 * 5. ICON LEMBUR KERJA 3D
 * Stopwatch lembur 3D dengan tombol metalik dan petir energi oranye menyala
 */
export function IconLembur3D({ className = "w-8 h-8", size }: Icon3DProps) {
  const s = size || 36
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <filter id="lembur-shadow" x="-10%" y="-10%" width="130%" height="135%" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="3" stdDeviation="2.5" floodColor="#f97316" floodOpacity="0.3" />
          <feDropShadow dx="0" dy="1" stdDeviation="1" floodColor="#000000" floodOpacity="0.15" />
        </filter>
        {/* Stopwatch Outer Ring (Chrome / Metallic) */}
        <linearGradient id="watch-metal" x1="8" y1="8" x2="40" y2="42" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#cbd5e1" />
          <stop offset="50%" stopColor="#64748b" />
          <stop offset="100%" stopColor="#334155" />
        </linearGradient>
        {/* Stopwatch Dial Body (Amber / Orange 3D) */}
        <linearGradient id="watch-body" x1="12" y1="14" x2="36" y2="38" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fb923c" />
          <stop offset="40%" stopColor="#f97316" />
          <stop offset="100%" stopColor="#ea580c" />
        </linearGradient>
        {/* Lightning Bolt */}
        <linearGradient id="bolt-grad" x1="28" y1="24" x2="42" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fde047" />
          <stop offset="50%" stopColor="#eab308" />
          <stop offset="100%" stopColor="#ca8a04" />
        </linearGradient>
      </defs>

      {/* Top Stopwatch Push Buttons */}
      <rect x="22" y="4" width="4" height="4.5" rx="1.5" fill="#64748b" />
      <rect x="20" y="3" width="8" height="2" rx="1" fill="#94a3b8" />
      <rect x="33" y="8" width="3.5" height="4" rx="1.2" transform="rotate(35 33 8)" fill="#94a3b8" />

      {/* Main Stopwatch Outer Casing */}
      <g filter="url(#lembur-shadow)">
        <circle cx="24" cy="26" r="17" fill="url(#watch-metal)" />
        <circle cx="24" cy="26" r="16" stroke="#ffffff" strokeWidth="0.8" opacity="0.4" />
        
        {/* Inner Dial Face */}
        <circle cx="24" cy="26" r="13.5" fill="url(#watch-body)" />
        <circle cx="24" cy="26" r="13.5" fill="#ffffff" opacity="0.1" />

        {/* Dial Hour Ticks */}
        <circle cx="24" cy="15" r="1" fill="#ffffff" />
        <circle cx="35" cy="26" r="1" fill="#ffffff" />
        <circle cx="24" cy="37" r="1" fill="#ffffff" />
        <circle cx="13" cy="26" r="1" fill="#ffffff" />

        {/* Clock Hands */}
        <circle cx="24" cy="26" r="1.8" fill="#ffffff" />
        <path d="M24 26L24 18" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M24 26L30 29" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" />
      </g>

      {/* 3D Electric Lightning Bolt (Lembur Ekstra Energi) */}
      <g filter="url(#lembur-shadow)">
        <path
          d="M34 22L28 32H33L31 42L40 30H34L36 22H34Z"
          fill="url(#bolt-grad)"
          stroke="#ffffff"
          strokeWidth="0.8"
        />
      </g>
    </svg>
  )
}

/**
 * 6. ICON SLIP GAJI 3D
 * Dompet/lembaran uang gaji 3D dengan koin emas mengkilap
 */
export function IconSlipGaji3D({ className = "w-8 h-8", size }: Icon3DProps) {
  const s = size || 36
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <filter id="slip-shadow" x="-10%" y="-10%" width="130%" height="135%" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="3" stdDeviation="2.5" floodColor="#10b981" floodOpacity="0.25" />
          <feDropShadow dx="0" dy="1" stdDeviation="1" floodColor="#000000" floodOpacity="0.15" />
        </filter>
        {/* Banknote Gradients */}
        <linearGradient id="note-bg" x1="6" y1="12" x2="38" y2="36" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="50%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
        {/* Gold Coin Gradient */}
        <linearGradient id="coin-gold" x1="26" y1="24" x2="42" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="40%" stopColor="#eab308" />
          <stop offset="100%" stopColor="#a16207" />
        </linearGradient>
      </defs>

      {/* Back Bill (Layer 2) */}
      <rect x="10" y="10" width="30" height="20" rx="4.5" fill="#047857" opacity="0.4" />
      <rect x="8" y="13" width="30" height="20" rx="4.5" fill="#059669" opacity="0.6" />

      {/* Front Banknote (Layer 1) */}
      <g filter="url(#slip-shadow)">
        <rect x="6" y="16" width="32" height="22" rx="5" fill="url(#note-bg)" />
        <rect x="7" y="17" width="30" height="20" rx="4" stroke="#ffffff" strokeWidth="0.8" opacity="0.4" />

        {/* Center Emblem on Banknote */}
        <circle cx="22" cy="27" r="5" stroke="#047857" strokeWidth="1" opacity="0.4" />
        <circle cx="22" cy="27" r="3" fill="#047857" opacity="0.2" />
        
        {/* Decorative corner lines */}
        <circle cx="10" cy="20" r="1.5" fill="#ffffff" opacity="0.5" />
        <circle cx="34" cy="20" r="1.5" fill="#ffffff" opacity="0.5" />
        <circle cx="10" cy="34" r="1.5" fill="#ffffff" opacity="0.5" />
        <circle cx="34" cy="34" r="1.5" fill="#ffffff" opacity="0.5" />
      </g>

      {/* Floating 3D Shiny Gold Coin */}
      <g filter="url(#slip-shadow)">
        <circle cx="35" cy="34" r="8.5" fill="url(#coin-gold)" />
        <circle cx="35" cy="34" r="7" stroke="#ffffff" strokeWidth="0.8" opacity="0.6" />
        {/* Coin Emboss (Rp / Currency symbol) */}
        <text
          x="35"
          y="37"
          fontSize="8"
          fontWeight="bold"
          textAnchor="middle"
          fill="#ffffff"
          opacity="0.9"
        >
          Rp
        </text>
      </g>
    </svg>
  )
}

/**
 * 7. ICON HADIR 3D (REKAP PRESENSI)
 * Lencana medali 3D hijau zamrud dengan centang tebal dan kilau specular
 */
export function IconHadir3D({ className = "w-6 h-6", size }: Icon3DProps) {
  const s = size || 32
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <filter id="hadir-shadow" x="-10%" y="-10%" width="130%" height="135%" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="2.5" stdDeviation="2" floodColor="#10b981" floodOpacity="0.3" />
          <feDropShadow dx="0" dy="1" stdDeviation="0.8" floodColor="#000000" floodOpacity="0.12" />
        </filter>
        <linearGradient id="hadir-body" x1="8" y1="8" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="50%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>
        <linearGradient id="hadir-rim" x1="10" y1="10" x2="38" y2="38" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#a7f3d0" />
          <stop offset="100%" stopColor="#065f46" />
        </linearGradient>
      </defs>

      {/* 3D Circular Shield */}
      <g filter="url(#hadir-shadow)">
        <circle cx="24" cy="24" r="19" fill="url(#hadir-body)" />
        <circle cx="24" cy="24" r="17.5" stroke="url(#hadir-rim)" strokeWidth="1.5" opacity="0.6" />
        
        {/* Specular Gloss Highlight */}
        <path
          d="M12 18C14 13 18 10 24 10"
          stroke="#ffffff"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.6"
        />

        {/* 3D Checkmark */}
        <path
          d="M16 24.5L22 30.5L32.5 18.5"
          stroke="#ffffff"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  )
}

/**
 * 8. ICON SAKIT 3D (REKAP PRESENSI)
 * Kapsul medis 3D miring dengan tanda palang kesehatan dan kilau kaca
 */
export function IconSakit3D({ className = "w-6 h-6", size }: Icon3DProps) {
  const s = size || 32
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <filter id="sakit-shadow" x="-10%" y="-10%" width="130%" height="135%" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="2.5" stdDeviation="2" floodColor="#f59e0b" floodOpacity="0.3" />
          <feDropShadow dx="0" dy="1" stdDeviation="0.8" floodColor="#000000" floodOpacity="0.12" />
        </filter>
        <linearGradient id="pill-top" x1="12" y1="12" x2="28" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="50%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
        <linearGradient id="pill-bottom" x1="20" y1="20" x2="36" y2="36" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="60%" stopColor="#f8fafc" />
          <stop offset="100%" stopColor="#e2e8f0" />
        </linearGradient>
      </defs>

      {/* Pill Capsule at 45 Degree Angle */}
      <g filter="url(#sakit-shadow)" transform="rotate(-45 24 24)">
        {/* Full Pill Base */}
        <rect x="15" y="10" width="18" height="28" rx="9" fill="url(#pill-bottom)" />
        
        {/* Top Half (Warm Amber/Coral) */}
        <path
          d="M15 19C15 14.0294 19.0294 10 24 10C28.9706 10 33 14.0294 33 19V24H15V19Z"
          fill="url(#pill-top)"
        />
        
        {/* Center Divider Line */}
        <line x1="15" y1="24" x2="33" y2="24" stroke="#d97706" strokeWidth="0.8" opacity="0.4" />

        {/* Specular Pill Highlight */}
        <path
          d="M18 13C19.5 11.5 21.5 11 24 11"
          stroke="#ffffff"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.75"
        />

        {/* Medical Cross Sign */}
        <path
          d="M24 16V22M21 19H27"
          stroke="#ffffff"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      </g>
    </svg>
  )
}

/**
 * 9. ICON IZIN 3D (REKAP PRESENSI)
 * Dokumen surat permohonan izin 3D dengan cap stempel biru resmi
 */
export function IconIzin3D({ className = "w-6 h-6", size }: Icon3DProps) {
  const s = size || 32
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <filter id="izin-shadow" x="-10%" y="-10%" width="130%" height="135%" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="2.5" stdDeviation="2" floodColor="#0284c7" floodOpacity="0.25" />
          <feDropShadow dx="0" dy="1" stdDeviation="0.8" floodColor="#000000" floodOpacity="0.12" />
        </filter>
        <linearGradient id="doc-bg" x1="10" y1="8" x2="38" y2="42" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="70%" stopColor="#f0f9ff" />
          <stop offset="100%" stopColor="#e0f2fe" />
        </linearGradient>
        <linearGradient id="doc-header" x1="10" y1="8" x2="34" y2="16" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#0284c7" />
        </linearGradient>
        <linearGradient id="stamp-blue" x1="26" y1="26" x2="42" y2="42" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0ea5e9" />
          <stop offset="100%" stopColor="#0369a1" />
        </linearGradient>
      </defs>

      {/* Main Document Body */}
      <g filter="url(#izin-shadow)">
        <path
          d="M11 9C11 6.79086 12.7909 5 15 5H29L37 13V39C37 41.2091 35.2091 43 33 43H15C12.7909 43 11 41.2091 11 39V9Z"
          fill="url(#doc-bg)"
        />
        {/* Folded Corner */}
        <path d="M29 5V11C29 12.1046 29.8954 13 31 13H37L29 5Z" fill="#bae6fd" />
        
        {/* Document Header Accent */}
        <rect x="15" y="10" width="10" height="3" rx="1.5" fill="url(#doc-header)" />
        
        {/* Text Lines */}
        <rect x="15" y="18" width="18" height="2" rx="1" fill="#94a3b8" />
        <rect x="15" y="23" width="14" height="2" rx="1" fill="#cbd5e1" />
        <rect x="15" y="28" width="11" height="2" rx="1" fill="#cbd5e1" />
      </g>

      {/* Official Approval Wax Stamp 3D */}
      <g filter="url(#izin-shadow)">
        <circle cx="32" cy="33" r="8" fill="url(#stamp-blue)" />
        <circle cx="32" cy="33" r="7" stroke="#ffffff" strokeWidth="0.8" opacity="0.6" />
        <path
          d="M29 33L31 35L35.5 30.5"
          stroke="#ffffff"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  )
}

/**
 * 10. ICON CUTI REKAP 3D (JATAH SALDO CUTI TAHUNAN)
 * Koper liburan / tropis 3D ungu-indigo dengan lencana saldo jatah tahunan
 */
export function IconCutiRekap3D({ className = "w-6 h-6", size }: Icon3DProps) {
  const s = size || 32
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <filter id="rekap-cuti-shadow" x="-10%" y="-10%" width="130%" height="135%" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="2.5" stdDeviation="2" floodColor="#8b5cf6" floodOpacity="0.3" />
          <feDropShadow dx="0" dy="1" stdDeviation="0.8" floodColor="#000000" floodOpacity="0.12" />
        </filter>
        <linearGradient id="suitcase-body" x1="8" y1="14" x2="40" y2="42" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#a78bfa" />
          <stop offset="50%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#6d28d9" />
        </linearGradient>
        <linearGradient id="palm-accent" x1="26" y1="24" x2="42" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fb7185" />
          <stop offset="100%" stopColor="#e11d48" />
        </linearGradient>
      </defs>

      {/* Suitcase Handle */}
      <path
        d="M19 14V10C19 8.34315 20.3431 7 22 7H26C27.6569 7 29 8.34315 29 10V14"
        stroke="#64748b"
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* Suitcase 3D Body */}
      <g filter="url(#rekap-cuti-shadow)">
        <rect x="8" y="14" width="32" height="26" rx="6" fill="url(#suitcase-body)" />
        <rect x="9" y="15" width="30" height="24" rx="5" stroke="#ffffff" strokeWidth="0.8" opacity="0.4" />
        
        {/* Horizontal Straps */}
        <rect x="15" y="14" width="3" height="26" fill="#5b21b6" opacity="0.5" />
        <rect x="30" y="14" width="3" height="26" fill="#5b21b6" opacity="0.5" />

        {/* Center Lock Metallic */}
        <rect x="22" y="24" width="4" height="4" rx="1" fill="#fde047" />

        {/* Specular Curved Highlight */}
        <path
          d="M11 17C13 16 16 15.5 20 15.5"
          stroke="#ffffff"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.7"
        />
      </g>

      {/* Floating Vacation Beach Umbrella / Pin */}
      <g filter="url(#rekap-cuti-shadow)">
        <circle cx="35" cy="33" r="7.5" fill="url(#palm-accent)" />
        <circle cx="35" cy="33" r="6.5" stroke="#ffffff" strokeWidth="0.8" opacity="0.5" />
        {/* Vacation Sun / Star */}
        <path
          d="M35 29V37M31 33H39M32 30L38 36M32 36L38 30"
          stroke="#ffffff"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </g>
    </svg>
  )
}

