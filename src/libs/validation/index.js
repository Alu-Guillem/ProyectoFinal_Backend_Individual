/**
 * @fileoverview Librería de validación de datos
 *
 * Esta librería proporciona un conjunto de validadores comunes y una función
 * para validar objetos completos contra un schema de validación.
 *
 * Estandarización de errores:
 * Todos los errores de validación lanzados por esta librería (ValidationError)
 * devuelven un objeto con la forma `{ message: mensajeDeError }` al serializarse con toJSON.
 * Se recomienda que todos los errores de la API sigan este formato para mantener consistencia.
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
   * @description
   * Crea un error de validación que, al serializarse con toJSON(), devuelve un objeto con la forma:
   * `{ message: 'Se han detectado errores en los siguientes campos: ...' }`
   * Esto permite estandarizar la respuesta de errores en la API.
   */
  constructor(errors) {
    super('Validación fallida')
    this.name = 'ValidationError'
    this.errors = errors
  }

  /**
   * Mensaje de error estandarizado para la API.
   * @returns {string}
   */
  get message() {
    let message = 'Se han detectado errores en los siguientes campos:'
    Object.values(this.errors).forEach(msg => {
      message += `\n- ${msg.join(', ')}`
    })
    return message
  }

  /**
   * Serializa el error en el formato estándar de la API: { message: string }
   * @returns {{ message: string }}
   */
  toJSON() {
    return {
      message: this.message,
    }
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
 * @returns {Object} - Retorna una copia del objeto solo de los campos validados
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
  const validatedData = {}

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
    validatedData[fieldName] = value
  }

  if (Object.keys(errors).length) {
    throw new ValidationError(errors)
  }

  return validatedData
}

export * from './common-validations.js'
