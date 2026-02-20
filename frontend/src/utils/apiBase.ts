/**
 * API base URL for backend requests.
 * - 프로덕션: /api 프리픽스 사용 (CloudFront 등에서 /api/*만 백엔드로 라우팅하는 경우 대응)
 * - 개발(localhost): http://localhost:8000
 */
export function getApiBase(): string {
  if (typeof window !== 'undefined') {
    const isLocalhost = /^localhost|127\.0\.0\.1$/.test(window.location.hostname)
    if (!isLocalhost) {
      return '/api'
    }
  }
  const env = import.meta.env.VITE_API_URL
  if (env === '' || env === undefined) return 'http://localhost:8000'
  return env
}
