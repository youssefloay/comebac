export function getPasswordResetActionCodeSettings(email?: string) {
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://www.comebac.com').replace(/\/$/, '')
  const resetUrl = `${baseUrl}/reset-password${email ? `?email=${encodeURIComponent(email)}` : ''}`

  return {
    url: resetUrl,
    handleCodeInApp: true
  }
}
