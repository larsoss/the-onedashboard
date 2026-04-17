/**
 * Hides HA's top toolbar from within the ingress iframe.
 *
 * The dashboard runs at /api/hassio_ingress/<token>/ which is same-origin
 * with the parent HA window, so window.parent gives direct DOM access —
 * no Browser Mod required.
 *
 * Injects a <style> into home-assistant-main's shadow root (HA stores its
 * rendered panel tree there). A MutationObserver re-injects if HA removes
 * the style during a re-render.
 */

export const HEADER_STORAGE_KEY = 'hk_hide_ha_header'
const STYLE_ID = '__tod_hh__'

const HIDE_CSS = [
  /* HA 2023 and earlier */
  'app-header { display: none !important; }',
  'app-toolbar { display: none !important; }',
  /* HA 2024+ material toolbar */
  'ha-top-app-bar-fixed { display: none !important; }',
  /* Remove residual padding/margin left by the now-hidden header */
  'partial-panel-resolver { padding-top: 0 !important; }',
  ':host { --header-height: 0px !important; }',
].join('\n')

function getParentShadowRoot(): ShadowRoot | null {
  try {
    const p = window.parent
    if (!p || p === window) return null          // not in iframe
    const ha = p.document.querySelector('home-assistant')
    const main = ha?.shadowRoot?.querySelector('home-assistant-main')
    return (main as Element & { shadowRoot: ShadowRoot | null })?.shadowRoot ?? null
  } catch {
    return null  // cross-origin (direct access outside HA ingress)
  }
}

function getParentDoc(): Document | null {
  try {
    const p = window.parent
    return (!p || p === window) ? null : p.document
  } catch {
    return null
  }
}

export function injectHideHeader(): void {
  const root = getShadowRoot()
  if (!root) return
  if (root.getElementById(STYLE_ID)) return
  const doc = getParentDoc() ?? document
  const s = doc.createElement('style')
  s.id = STYLE_ID
  s.textContent = HIDE_CSS
  root.appendChild(s)
}

function getShadowRoot(): ShadowRoot | null {
  return getParentShadowRoot()
}

export function removeHideHeader(): void {
  const root = getShadowRoot()
  if (!root) return
  root.getElementById(STYLE_ID)?.remove()
}

let _cleanup: (() => void) | null = null

/** Start hiding + keep hidden when HA re-renders. Call once on app boot if setting is on. */
export function startHidingHeader(): void {
  if (_cleanup) return    // already watching
  injectHideHeader()
  const root = getShadowRoot()
  if (!root) return
  const observer = new MutationObserver(() => injectHideHeader())
  observer.observe(root, { childList: true })
  _cleanup = () => { observer.disconnect(); _cleanup = null }
}

/** Stop hiding and restore HA header. */
export function stopHidingHeader(): void {
  _cleanup?.()
  removeHideHeader()
}
