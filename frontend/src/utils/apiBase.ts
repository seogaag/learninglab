/**
 * API base URL for backend requests.
 * - Empty string = same origin (for CloudFront/proxy deployment)
 * - Runtime: if env falls back to localhost but we're not on localhost, use same origin
 */
export function getApiBase(): string {
  const env = import.meta.env.VITE_API_URL
  if (env === '') return ''
  const base = env || 'http://localhost:8000'
  if (
    base === 'http://localhost:8000' &&
    typeof window !== 'undefined' &&
    !window.location.hostname.match(/^localhost|127\.0\.0\.1$/)
  ) {
    return ''
  }
  return base
}
