/**
 * API base URL for backend requests.
 * - 프로덕션(도메인 접속): 항상 same-origin 사용 (nginx가 /auth, /api 등 프록시)
 * - 개발(localhost): http://localhost:8000
 */
export function getApiBase(): string {
  if (typeof window !== 'undefined') {
    const isLocalhost = /^localhost|127\.0\.0\.1$/.test(window.location.hostname)
    if (!isLocalhost) {
      // 프로덕션: 항상 same-origin (VITE_API_URL 오설정 방지)
      return ''
    }
  }
  const env = import.meta.env.VITE_API_URL
  if (env === '' || env === undefined) return 'http://localhost:8000'
  return env
}
