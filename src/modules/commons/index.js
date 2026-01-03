/**
 * @fileoverview Utilidades comunes para manejo de fechas
 * @module commons
 *
 * Proporciona funciones para parsear y formatear fechas
 * en el formato DD/MM/YYYY usado en la aplicación.
 */

/**
 * Parsea una fecha en formato DD/MM/YYYY a objeto Date
 *
 * @function parseDate
 * @param {string} value - Fecha en formato DD/MM/YYYY
 * @returns {Date|null} Objeto Date si el formato es válido, null en caso contrario
 *
 * @example
 * parseDate('25/12/2024') // Date object: 2024-12-25
 * parseDate('31/02/2024') // null (fecha inválida)
 * parseDate('invalid')    // null
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
 * Formatea un objeto Date a string DD/MM/YYYY
 *
 * @function formatDate
 * @param {Date} date - Objeto Date a formatear
 * @returns {string|null} Fecha formateada o null si el parámetro no es Date
 *
 * @example
 * formatDate(new Date(2024, 11, 25)) // '25/12/2024'
 * formatDate('invalid')               // null
 */
export function formatDate(date) {
  if (!(date instanceof Date)) return null

  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()

  return `${day}/${month}/${year}`
}
