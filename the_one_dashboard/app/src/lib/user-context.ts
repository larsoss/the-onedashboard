// Global current user ID — set once after user selection
let _userId = 'default'
let _syncTimer: ReturnType<typeof setTimeout> | null = null
let _pendingSync = false

export function setCurrentUserId(id: string) { _userId = id }
export function getCurrentUserId() { return _userId }

/** Namespace a localStorage key per user */
export function userKey(baseKey: string): string {
  return `${baseKey}_u_${_userId}`
}

/** Collect all user settings and write to server (debounced 400ms) */
export function scheduleSyncToServer() {
  _pendingSync = true
  if (_syncTimer) clearTimeout(_syncTimer)
  _syncTimer = setTimeout(() => syncToServer(), 400)
}

/** Flush immediately — called on page hide / beforeunload */
export function flushSyncToServer() {
  if (!_pendingSync) return
  if (_syncTimer) { clearTimeout(_syncTimer); _syncTimer = null }
  syncToServer()
}

async function syncToServer() {
  if (_userId === 'default') return
  _pendingSync = false
  try {
    const { collectUserSettings } = await import('./settings-sync')
    const settings = collectUserSettings()
    await fetch(`/dashboard-api/settings/${encodeURIComponent(_userId)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
      keepalive: true,   // survives tab close / navigation
    })
  } catch { /* offline - that's ok */ }
}

// Flush on tab close or app switch (phone switching away)
if (typeof window !== 'undefined') {
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flushSyncToServer()
  })
  window.addEventListener('beforeunload', () => flushSyncToServer())
  window.addEventListener('pagehide', () => flushSyncToServer())
}
