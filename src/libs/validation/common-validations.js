/**
 * @fileoverview Validadores comunes para campos de formularios y datos
 *
 * Este módulo proporciona un conjunto de validadores reutilizables que siguen
 * el principio de responsabilidad única. Cada validador se enfoca en una sola
 * regla de validación.
 *
 * Todos los validadores:
 * - Retornan true si la validación es exitosa
 * - Lanzan un Error con mensaje descriptivo si la validación falla
 * - Consideran valores vacíos (undefined, null, '') como válidos (excepto isRequired)
 * - Siguen el patrón: validator(field)(value) o validator(field, params)(value)
 *
 * @example
 * // Validadores simples
 * isRequired('nombre')('Juan') // true
 * isRequired('nombre')('') // Error: El campo "nombre" es obligatorio
 *
 * // Validadores parametrizados
 * maxLength('nombre', 50)('Juan') // true
 * maxLength('nombre', 3)('Juan') // Error: El campo "nombre" no puede tener más de 3 caracteres
 */

/**
 * Verifica si un valor está vacío
 * @param {any} value - El valor a verificar
 * @returns {boolean} - true si el valor es undefined, null o string vacío
 */
export const isEmpty = value => value === undefined || value === null || value === ''

/**
 * Factory function para crear validadores custom
 * Ejecuta la función de validación y si retorna un mensaje de error, lanza una excepción
 * @param {(field: string, value: any, ...params: any[]) => string | void | null | undefined} validateFn - Función que retorna mensaje de error o nada
 * @returns {(field: string, ...params: any[]) => import('types').fieldValidation} - Validador con patrón (field, ...params) => value => boolean
 * @example
 * import { createValidator, isEmpty } from './common-validations.js'
 *
 * // Validador simple
 * const isCustom = createValidator((field, value) => {
 *   if (isEmpty(value)) return
 *   if (value !== 'custom') return `El campo '${field}' debe ser 'custom'`
 * })
 *
 * // Validador con parámetros
 * const maxValue = createValidator((field, value, max) => {
 *   if (isEmpty(value)) return
 *   if (Number(value) > max) return `El campo '${field}' no puede ser mayor que ${max}`
 * })
 */
export const createValidator =
  validateFn =>
  (field, ...params) =>
  value => {
    const errorMessage = validateFn(field, value, ...params)
    if (errorMessage) throw new Error(errorMessage)
    return true
  }

/**
 * Valida que un valor sea numérico
 * @type {import('types').commonValidation}
 * @example
 * isValidNumber('edad')(25) // true
 * isValidNumber('edad')('25') // true
 * isValidNumber('edad')('abc') // Error: El campo "edad" debe ser numérico
 */
export const isValidNumber = createValidator((field, value) => {
  if (isEmpty(value)) return
  if (isNaN(Number(value))) return `El campo '${field}' debe ser numérico`
})

/**
 * Valida que un número sea positivo (mayor o igual a 0)
 * @type {import('types').commonValidation}
 * @example
 * isPositiveNumber('cantidad')(5) // true
 * isPositiveNumber('cantidad')(0) // true
 * isPositiveNumber('cantidad')(-5) // Error: El campo "cantidad" debe ser positivo
 */
export const isPositiveNumber = createValidator((field, value) => {
  if (isEmpty(value)) return
  isValidNumber(field)(value)
  if (Number(value) < 0) return `El campo '${field}' debe ser positivo`
})

/**
 * Valida que un campo tenga un valor (no sea undefined, null o string vacío)
 * @type {import('types').commonValidation}
 * @example
 * isRequired('nombre')('Juan') // true
 * isRequired('nombre')('') // Error: El campo "nombre" es obligatorio
 * isRequired('nombre')(null) // Error: El campo "nombre" es obligatorio
 */
export const isRequired = createValidator((field, value) => {
  if (isEmpty(value)) return `El campo '${field}' es obligatorio`
})

/**
 * Valida que un valor sea una cadena de texto
 * @type {import('types').commonValidation}
 * @example
 * isValidString('nombre')('Juan') // true
 * isValidString('nombre')(123) // Error: El campo "nombre" debe ser una cadena de texto
 */
export const isValidString = createValidator((field, value) => {
  if (isEmpty(value)) return
  if (typeof value !== 'string') return `El campo '${field}' debe ser una cadena de texto`
})

/**
 * Valida que la longitud de un campo no exceda un máximo
 * @param {string} field - Nombre del campo
 * @param {number} max - Longitud máxima permitida
 * @returns {import('types').fieldValidation}
 * @example
 * maxLength('nombre', 50)('Juan') // true
 * maxLength('codigo', 3)('ABCD') // Error: El campo "codigo" no puede tener más de 3 caracteres
 */
export const maxLength = createValidator((field, value, max) => {
  if (isEmpty(value)) return
  if (String(value).length > max)
    return `El campo '${field}' no puede tener más de ${max} caracteres`
})

/**
 * Valida que la longitud de un campo sea al menos un mínimo
 * @param {string} field - Nombre del campo
 * @param {number} min - Longitud mínima requerida
 * @returns {import('types').fieldValidation}
 * @example
 * minLength('password', 8)('secreto123') // true
 * minLength('password', 8)('12345') // Error: El campo "password" debe tener al menos 8 caracteres
 */
export const minLength = createValidator((field, value, min) => {
  if (isEmpty(value)) return
  if (String(value).length < min) return `El campo '${field}' debe tener al menos ${min} caracteres`
})

/**
 * Valida que un campo tenga formato de correo electrónico válido
 * Usa internamente el validador 'match' con un regex estándar
 * @type {import('types').commonValidation}
 * @example
 * isValidEmail('email')('juan@example.com') // true
 * isValidEmail('email')('invalid') // Error: El campo "email" debe ser un correo electrónico válido
 */
export const isValidEmail = field =>
  match(
    field,
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    `El campo '${field}' debe ser un correo electrónico válido`,
  )

/**
 * Valida que un número sea estrictamente menor que un valor máximo
 * @param {string} field - Nombre del campo
 * @param {number} max - Valor máximo (exclusivo)
 * @returns {import('types').fieldValidation}
 * @example
 * isLessThan('edad', 18)(15) // true
 * isLessThan('edad', 18)(18) // Error: El campo "edad" debe ser menor que 18
 */
export const isLessThan = createValidator((field, value, max) => {
  if (isEmpty(value)) return
  isValidNumber(field)(value)
  if (Number(value) >= max) return `El campo '${field}' debe ser menor que ${max}`
})

/**
 * Valida que un número sea estrictamente mayor que un valor mínimo
 * @param {string} field - Nombre del campo
 * @param {number} min - Valor mínimo (exclusivo)
 * @returns {import('types').fieldValidation}
 * @example
 * isGreaterThan('edad', 18)(20) // true
 * isGreaterThan('edad', 18)(18) // Error: El campo "edad" debe ser mayor que 18
 */
export const isGreaterThan = createValidator((field, value, min) => {
  if (isEmpty(value)) return
  isValidNumber(field)(value)
  if (Number(value) <= min) return `El campo '${field}' debe ser mayor que ${min}`
})

/**
 * Valida que un número esté dentro de un rango (inclusivo)
 * @param {string} field - Nombre del campo
 * @param {number} min - Valor mínimo (inclusivo)
 * @param {number} max - Valor máximo (inclusivo)
 * @returns {import('types').fieldValidation}
 * @example
 * isBetween('edad', 18, 65)(25) // true
 * isBetween('edad', 18, 65)(70) // Error: El campo "edad" debe estar entre 18 y 65
 */
export const isBetween = createValidator((field, value, min, max) => {
  if (isEmpty(value)) return
  isValidNumber(field)(value)
  const numValue = Number(value)
  if (numValue < min || numValue > max)
    return `El campo '${field}' debe estar entre ${min} y ${max}`
})

/**
 * Valida que un número sea menor o igual que un valor máximo
 * @param {string} field - Nombre del campo
 * @param {number} max - Valor máximo (inclusivo)
 * @returns {import('types').fieldValidation}
 * @example
 * isLessThanOrEqual('edad', 18)(18) // true
 * isLessThanOrEqual('edad', 18)(19) // Error: El campo "edad" debe ser menor o igual a 18
 */
export const isLessThanOrEqual = createValidator((field, value, max) => {
  if (isEmpty(value)) return
  isValidNumber(field)(value)
  if (Number(value) > max) return `El campo '${field}' debe ser menor o igual a ${max}`
})

/**
 * Valida que un número sea mayor o igual que un valor mínimo
 * @param {string} field - Nombre del campo
 * @param {number} min - Valor mínimo (inclusivo)
 * @returns {import('types').fieldValidation}
 * @example
 * isGreaterThanOrEqual('edad', 18)(18) // true
 * isGreaterThanOrEqual('edad', 18)(17) // Error: El campo "edad" debe ser mayor o igual a 18
 */
export const isGreaterThanOrEqual = createValidator((field, value, min) => {
  if (isEmpty(value)) return
  isValidNumber(field)(value)
  if (Number(value) < min) return `El campo '${field}' debe ser mayor o igual a ${min}`
})

/**
 * Valida que un valor sea booleano o pueda parsearse como tal
 * Acepta: true, false, 'true', 'false', '1', '0'
 * @type {import('types').commonValidation}
 * @example
 * isValidBoolean('activo')(true) // true
 * isValidBoolean('activo')('true') // true
 * isValidBoolean('activo')('1') // true
 * isValidBoolean('activo')('abc') // Error: El campo "activo" debe ser un valor booleano
 */
export const isValidBoolean = createValidator((field, value) => {
  if (isEmpty(value)) return
  if (typeof value === 'boolean') return
  const stringValue = String(value).toLowerCase()
  if (['true', 'false', '1', '0'].includes(stringValue)) return
  return `El campo '${field}' debe ser un valor booleano`
})

/**
 * Valida que un número sea entero (sin decimales)
 * @type {import('types').commonValidation}
 * @example
 * isInteger('cantidad')(5) // true
 * isInteger('cantidad')(5.5) // Error: El campo "cantidad" debe ser un número entero
 */
export const isInteger = createValidator((field, value) => {
  if (isEmpty(value)) return
  isValidNumber(field)(value)
  if (!Number.isInteger(Number(value))) return `El campo '${field}' debe ser un número entero`
})

/**
 * Valida que un valor cumpla con un patrón de expresión regular
 * @param {string} field - Nombre del campo
 * @param {RegExp} pattern - Expresión regular a validar
 * @param {string} [errorMessage] - Mensaje de error personalizado (opcional)
 * @returns {import('types').fieldValidation}
 * @example
 * match('codigo', /^[A-Z]{3}$/)('ABC') // true
 * match('codigo', /^[A-Z]{3}$/, 'Debe ser 3 letras mayúsculas')('AB') // Error: Debe ser 3 letras mayúsculas
 */
export const match = createValidator((field, value, pattern, errorMessage) => {
  if (isEmpty(value)) return
  if (!pattern.test(String(value)))
    return errorMessage || `El campo '${field}' no cumple con el formato requerido`
})

/**
 * Valida que un valor tenga formato de fecha DD/MM/YYYY válida
 * @type {import('types').commonValidation}
 * @example
 * dateValidator('fecha')('25/12/2023') // true
 * dateValidator('fecha')('31/02/2023') // Error: El campo "fecha" tiene un día inválido
 */
export const isValidDate = createValidator((field, value) => {
  if (isEmpty(value)) return

  const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/
  const match = String(value).match(regex)
  if (!match) return `El campo '${field}' debe tener el formato DD/MM/YYYY`

  const day = parseInt(match[1], 10)
  const month = parseInt(match[2], 10)
  const year = parseInt(match[3], 10)

  if (month < 1 || month > 12) return `El campo '${field}' tiene un mes inválido`

  const maxDays = new Date(year, month, 0).getDate()
  if (day < 1 || day > maxDays) return `El campo '${field}' tiene un día inválido`

  const date = new Date(year, month - 1, day)
  if (isNaN(date.getTime())) return `El campo '${field}' debe ser una fecha válida`
})

/**
 * Valida que un valor tenga formato de DNI español válido (8 dígitos seguidos de una letra)
 * @type {import('types').commonValidation}
 * @example
 * isValidDNI('dni')('12345678Z') // true
 * isValidDNI('dni')('12345678z') // true
 * isValidDNI('dni')('12345678B') // Error: El campo "dni" es inválido
 * isValidDNI('dni')('1234567Z')  // Error: El campo "dni" debe tener formato 12345678Z
 */
export const isValidDNI = createValidator((field, value) => {
  if (isEmpty(value)) return
  value = value.toUpperCase()
  const regex = /^(\d{8})([A-Z])$/
  const match = String(value).match(regex)
  if (!match) return `El campo '${field}' debe tener formato 12345678Z`

  const letters = 'TRWAGMYFPDXBNJZSQVHLCKE'

  const number = parseInt(match[1], 10)
  const letter = match[2]
  if (letters[number % 23] !== letter) return `El campo '${field}' es inválido`
})

/**
 * Valida que un valor sea un rol de empleado válido ('admin' o 'employee')
 * @type {import('types').commonValidation}
 * @example
 * isValidEmployeeRole('rol')('admin') // true
 * isValidEmployeeRole('rol')('employee') // true
 * isValidEmployeeRole('rol')('manager') // Error: El campo "rol" solo puede ser 'admin' o 'employee'
 */
export const isValidEmployeeRole = createValidator((field, value) => {
  if (isEmpty(value)) return
  if (value !== 'admin' && value !== 'employee')
    return `El campo '${field}' solo puede ser 'admin' o 'employee'`
})
