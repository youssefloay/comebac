// Détection du type d'appareil et du navigateur
export function getDeviceInfo() {
  if (typeof window === 'undefined') {
    return {
      device: 'unknown',
      os: 'unknown',
      browser: 'unknown',
      isPWA: false
    }
  }

  const userAgent = navigator.userAgent.toLowerCase()
  
  // Détection du système d'exploitation
  let os = 'unknown'
  if (/iphone|ipad|ipod/.test(userAgent)) {
    os = 'iOS'
  } else if (/android/.test(userAgent)) {
    os = 'Android'
  } else if (/windows/.test(userAgent)) {
    os = 'Windows'
  } else if (/mac/.test(userAgent)) {
    os = 'macOS'
  } else if (/linux/.test(userAgent)) {
    os = 'Linux'
  }

  // Détection du type d'appareil
  let device = 'desktop'
  if (/mobile/.test(userAgent)) {
    device = 'mobile'
  } else if (/tablet|ipad/.test(userAgent)) {
    device = 'tablet'
  }

  // Détection du navigateur
  let browser = 'unknown'
  if (/chrome/.test(userAgent) && !/edge/.test(userAgent)) {
    browser = 'Chrome'
  } else if (/safari/.test(userAgent) && !/chrome/.test(userAgent)) {
    browser = 'Safari'
  } else if (/firefox/.test(userAgent)) {
    browser = 'Firefox'
  } else if (/edge/.test(userAgent)) {
    browser = 'Edge'
  } else if (/opera|opr/.test(userAgent)) {
    browser = 'Opera'
  }

  // Détection PWA (Progressive Web App)
  const isPWA = window.matchMedia('(display-mode: standalone)').matches ||
                (window.navigator as any).standalone === true ||
                document.referrer.includes('android-app://')

  // Informations supplémentaires
  const screenResolution = `${window.screen.width}x${window.screen.height}`
  const viewportSize = `${window.innerWidth}x${window.innerHeight}`
  const language = navigator.language || (navigator as any).userLanguage
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
  const cookiesEnabled = navigator.cookieEnabled
  const onlineStatus = navigator.onLine
  
  // Type de connexion (si disponible)
  const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection
  const connectionType = connection?.effectiveType || 'unknown'
  const downlink = connection?.downlink || null
  
  // Mémoire de l'appareil (si disponible)
  const deviceMemory = (navigator as any).deviceMemory || null
  
  // Nombre de coeurs CPU (si disponible)
  const hardwareConcurrency = navigator.hardwareConcurrency || null

  return {
    device,
    os,
    browser,
    isPWA,
    userAgent: navigator.userAgent,
    screenResolution,
    viewportSize,
    language,
    timezone,
    cookiesEnabled,
    onlineStatus,
    connectionType,
    downlink,
    deviceMemory,
    hardwareConcurrency
  }
}

export function getDeviceIcon(os: string, isPWA: boolean) {
  if (isPWA) return '📱'
  
  switch (os) {
    case 'iOS': return '🍎'
    case 'Android': return '🤖'
    case 'Windows': return '🪟'
    case 'macOS': return '💻'
    case 'Linux': return '🐧'
    default: return '🌐'
  }
}

export function getDeviceLabel(device: string, os: string, browser: string, isPWA: boolean) {
  if (isPWA) {
    return `${os} (PWA)`
  }
  
  const deviceType = device === 'mobile' ? 'Mobile' : device === 'tablet' ? 'Tablette' : 'Ordinateur'
  return `${deviceType} ${os} - ${browser}`
}
