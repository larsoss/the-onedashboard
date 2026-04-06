// Global current user ID — set once after user selection
let _userId = 'default'
let _syncTimer: ReturnType<typeof setTimeout> | null = null

export function setCurrentUserId(id: string) { _userId = id }
export function getCurrentUserId() { return _userId }

/** Namespace a localStorage key per user */
export function userKey(baseKey: string): string {
  return `${baseKey}_u_${_userId}`
}

/** Collect all user settings and write to server (debounced 800ms) */
export function scheduleSyncToServer() {
  if (_syncTimer) clearTimeout(_syncTimer)
  _syncTimer = setTimeout(() => syncToServer(), 800)
}

async function syncToServer() {
  if (_userId === 'default') return
  try {
    // Import dynamically to avoid circular deps
    const { collectUserSettings } = await import('./settings-sync')
    const settings = collectUserSettings()
    await fetch(`/dashboard-api/settings/${encodeURIComponent(_userId)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    })
  } catch { /* offline - that's ok */ }
}
