import multer from 'multer'
import fs from 'fs'
import path from 'path'

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

/**
 * Calcula la edad a partir de una fecha de nacimiento
 *
 * @function getAge
 * @param {Date} date - Fecha de nacimiento como objeto Date
 * @returns {number|null} Edad calculada o null si el parámetro no es un objeto Date
 *
 * @example
 * getAge(new Date(2000, 0, 1)) // 23 (si el año actual es 2023)
 * getAge('invalid')            // null
 */
export function getAge(date) {
  if (!(date instanceof Date)) return null

  const now = new Date()

  let year = now.getFullYear() - date.getFullYear()
  const month = now.getMonth() - date.getMonth()
  const day = now.getDate() - date.getDate()

  if ((month == 0 && day < 0) || month < 0) {
    year -= 1
  }

  return year
}

const UPLOAD_DIR = path.join(process.cwd(), 'uploads')

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
})

export const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) return cb(new Error('Solo se permiten imágenes'))
    cb(null, true)
  },
})
