export function onlyDigits(value) {
  return String(value ?? '').replace(/\D/g, '')
}

export function formatPhoneNumber(value) {
  const raw = onlyDigits(value)
  if (!raw) return ''

  if (raw.startsWith('02')) {
    const digits = raw.slice(0, 10)
    if (digits.length <= 2) return digits
    if (digits.length <= 6) return `${digits.slice(0, 2)}-${digits.slice(2)}`
    if (digits.length <= 9) return `${digits.slice(0, 2)}-${digits.slice(2, 5)}-${digits.slice(5)}`
    return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6)}`
  }

  const digits = raw.slice(0, 11)
  if (digits.length <= 3) return digits
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`
  return `${digits.slice(0, 3)}-${digits.slice(3, -4)}-${digits.slice(-4)}`
}

export function isValidPhoneNumber(value, { required = false } = {}) {
  const digits = onlyDigits(value)
  if (!digits) return !required
  if (digits.startsWith('02')) return digits.length === 9 || digits.length === 10
  return digits.length === 10 || digits.length === 11
}

export function formatLoginId(value) {
  return String(value ?? '')
    .trim()
    .replace(/\s/g, '')
    .replace(/[^A-Za-z0-9._-]/g, '')
    .slice(0, 30)
}

export function isValidLoginId(value) {
  return /^[A-Za-z0-9._-]{4,30}$/.test(String(value ?? ''))
}

export function formatSiteCode(value) {
  return String(value ?? '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, '')
    .replace(/-{2,}/g, '-')
    .slice(0, 20)
}

export function isValidSiteCode(value, { required = true } = {}) {
  const code = formatSiteCode(value)
  if (!code) return !required
  return /^[A-Z0-9](?:[A-Z0-9-]{0,18}[A-Z0-9])?$/.test(code)
}

export function formatEmailInput(value) {
  return String(value ?? '')
    .replace(/\s/g, '')
    .slice(0, 80)
}

export function normalizeEmail(value) {
  return formatEmailInput(value).toLowerCase()
}

export function isValidEmail(value, { required = false } = {}) {
  const email = normalizeEmail(value)
  if (!email) return !required
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}
