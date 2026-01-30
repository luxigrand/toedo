// Token utilities for secure workspace sharing

export function generateSecureToken(workspaceId: number, password: string): string {
  const timestamp = Date.now()
  const tokenData = `${workspaceId}:${password}:${timestamp}`
  return btoa(tokenData) // Base64 encode
}

export function verifySecureToken(token: string): {
  valid: boolean
  workspaceId?: number
  password?: string
  expired?: boolean
} {
  try {
    const decoded = atob(token) // Base64 decode
    const [workspaceIdStr, password, timestampStr] = decoded.split(':')
    const workspaceId = parseInt(workspaceIdStr)
    const timestamp = parseInt(timestampStr)
    const now = Date.now()
    const thirtyMinutes = 30 * 60 * 1000 // 30 minutes in milliseconds

    if (isNaN(workspaceId) || isNaN(timestamp)) {
      return { valid: false }
    }

    // Check if token is expired (30 minutes)
    if (now - timestamp > thirtyMinutes) {
      return { valid: false, expired: true }
    }

    return {
      valid: true,
      workspaceId,
      password,
    }
  } catch (error) {
    return { valid: false }
  }
}
