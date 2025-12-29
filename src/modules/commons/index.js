/**
 *
 * @param {string} value
 * @returns {Date|null}
 */

export function parseDate(value) {
  if (typeof value !== 'string') return null

  const [day, month, year] = value.split('/').map(Number)

  if (!day || !month || !year) return null

  const date = new Date(year, month - 1, day)

  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null
  }

  return date
}
/**
 *
 * @param {Date} date
 * @returns {string|null}
 */
export function formatDate(date) {
  if (!(date instanceof Date)) return null

  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()

  return `${day}/${month}/${year}`
}
