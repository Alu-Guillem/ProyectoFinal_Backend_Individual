/**
 * @fileoverview Librería de validación de datos
 *
 * Esta librería proporciona un conjunto de validadores comunes y una función
 * para validar objetos completos contra un schema de validación.
 *
 * @example
 * // Definir un schema de validación
 * import { isRequired, isValidEmail, maxLength, validateSchema } from '@/libs/validation'
 *
 * const userSchema = {
 *   name: [isRequired('name'), maxLength('name', 50)],
 *   email: [isRequired('email'), isValidEmail('email')],
 *   age: [isPositiveNumber('age'), isInteger('age')]
 * }
 *
 * // Validar un objeto
 * try {
 *   validateSchema(userSchema, { name: 'Juan', email: 'juan@example.com', age: 25 })
 *   console.log('Datos válidos')
 * } catch (error) {
 *   console.error('Error de validación:', error.message)
 * }
 */

export class ValidationError extends Error {
  /**
   * @param {Object<string, string[]>} errors - Errores por campo
   */
  constructor(errors) {
    super('Validación fallida')
    this.name = 'ValidationError'
    this.errors = errors
  }
}

/**
 * Valida un objeto contra un schema de validación.
 *
 * Itera sobre cada campo definido en el schema y ejecuta todos sus validadores
 * en orden. Si algún validador falla, lanza un error inmediatamente.
 *
 * @param {import('types').ValidationSchema} schema - El schema de validación con los campos y sus validadores
 * @param {Object} data - El objeto con los datos a validar
 * @returns {boolean} - Retorna true si todas las validaciones pasan exitosamente
 * @throws {ValidationError} - Lanza un ValidationError con los errores por campo si alguna validación falla
 *
 * @example
 * const schema = {
 *   email: [isRequired('email'), isValidEmail('email')],
 *   age: [isPositiveNumber('age')]
 * }
 *
 * validateSchema(schema, { email: 'test@example.com', age: 30 }) // true
 * validateSchema(schema, { email: 'invalid', age: 30 }) // Error: El campo "email" debe ser un correo electrónico válido
 */
export const validateSchema = (schema, data) => {
  /** @type {Object<string, string[]>} */
  const errors = {}

  for (const [fieldName, validators] of Object.entries(schema)) {
    const value = data[fieldName] ?? undefined

    for (const validator of validators) {
      try {
        validator(value)
      } catch (err) {
        if (!errors[fieldName]) errors[fieldName] = []
        errors[fieldName].push(err.message)
      }
    }
  }

  if (Object.keys(errors).length) {
    throw new ValidationError(errors)
  }

  return true
}

export * from './common-validations.js'
