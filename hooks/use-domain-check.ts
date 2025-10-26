"use client"

import { useEffect, useState } from 'react'

export function useDomainCheck() {
  const [currentDomain, setCurrentDomain] = useState<string>('')
  const [isVercelDomain, setIsVercelDomain] = useState(false)
  const [isLocalhost, setIsLocalhost] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const domain = window.location.hostname
      setCurrentDomain(domain)
      setIsVercelDomain(domain.includes('vercel.app'))
      setIsLocalhost(domain === 'localhost' || domain === '127.0.0.1')
    }
  }, [])

  const getFirebaseDomainsToAdd = () => {
    const domains = ['localhost', '127.0.0.1']
    
    if (isVercelDomain) {
      domains.push('*.vercel.app', currentDomain)
    } else if (currentDomain && !isLocalhost) {
      domains.push(currentDomain)
    }
    
    return domains
  }

  return {
    currentDomain,
    isVercelDomain,
    isLocalhost,
    domainsToAdd: getFirebaseDomainsToAdd()
  }
}