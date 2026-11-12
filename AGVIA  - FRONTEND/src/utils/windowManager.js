/**
 * AGVIA Window & Tab Manager
 * Prevents duplicate windows, unmanaged popups, and runaway tabs in production.
 * Reuses active named windows and focuses them instead of opening duplicates.
 */

const windowRegistry = new Map()

/**
 * Safely opens a URL in a named window/tab, reusing an already open instance
 * if available, rather than spawning duplicate windows on multiple clicks.
 *
 * @param {string} url - Target URL to open
 * @param {string} [name='agvia_external_tab'] - Unique window target name
 * @param {string} [features='noopener,noreferrer'] - Window feature flags
 * @returns {Window|null} - The window instance
 */
export function safeOpenWindow(url, name = 'agvia_external_tab', features = 'noopener,noreferrer') {
  if (typeof window === 'undefined') return null

  // Ensure target name is valid and alphanumeric
  const cleanName = (name || 'agvia_tab').replace(/[^a-zA-Z0-9_]/g, '_')

  try {
    const existing = windowRegistry.get(cleanName)
    if (existing && !existing.closed) {
      existing.location.href = url
      existing.focus()
      return existing
    }
  } catch (err) {
    // Cross-origin restriction on existing window object; fallback to fresh open
  }

  const newWindow = window.open(url, cleanName, features)
  if (newWindow) {
    try {
      newWindow.focus()
    } catch (_) {}
    windowRegistry.set(cleanName, newWindow)
  }

  return newWindow
}

/**
 * Closes and clears a registered named window if open.
 * @param {string} name
 */
export function closeNamedWindow(name) {
  if (typeof window === 'undefined') return
  const cleanName = (name || '').replace(/[^a-zA-Z0-9_]/g, '_')
  const existing = windowRegistry.get(cleanName)
  if (existing && !existing.closed) {
    try {
      existing.close()
    } catch (_) {}
  }
  windowRegistry.delete(cleanName)
}

